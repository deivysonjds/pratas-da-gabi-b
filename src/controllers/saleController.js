const {
  sequelize, Client, Product, Sale, ProductSale, Installment
} = require('../models');
const { createCrudController, sendError } = require('./crudController');

const include = [
  { model: Client, as: 'client' },
  { model: ProductSale, as: 'items', include: [{ model: Product, as: 'product' }] },
  { model: Installment, as: 'installments' }
];

const crud = createCrudController(Sale, {
  fields: ['client_id', 'status', 'paymentMethod'],
  include
});

async function createComplete(req, res) {
  const { client_id, paymentMethod, products, installments = [] } = req.body || {};

  if (!Number.isInteger(Number(client_id)) || Number(client_id) <= 0 ||
      typeof paymentMethod !== 'string' || !paymentMethod.trim() ||
      !Array.isArray(products) || products.length === 0 ||
      !Array.isArray(installments)) {
    return res.status(400).json({
      message: 'Informe client_id, paymentMethod, uma lista products e uma lista installments opcional.'
    });
  }

  const productIds = products.map(Number);
  if (productIds.some(id => !Number.isInteger(id) || id <= 0)) {
    return res.status(400).json({ message: 'A lista products contém IDs inválidos.' });
  }

  for (const item of installments) {
    if (!item || !Number.isInteger(item.number) || item.number < 1 ||
        typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount < 0 ||
        (item.is_paid !== undefined && typeof item.is_paid !== 'boolean')) {
      return res.status(400).json({ message: 'Uma ou mais parcelas são inválidas.' });
    }
  }

  const transaction = await sequelize.transaction();
  try {
    const client = await Client.findByPk(Number(client_id), { transaction });
    if (!client) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cliente não encontrado.' });
    }

    // Agrupa IDs repetidos: [1, 1, 2] significa duas unidades do produto 1 e uma do 2.
    const quantities = new Map();
    for (const id of productIds) quantities.set(id, (quantities.get(id) || 0) + 1);

    const ids = [...quantities.keys()];
    const found = await Product.findAll({
      where: { id: ids },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (found.length !== ids.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Um ou mais produtos não existem.' });
    }

    for (const product of found) {
      const requested = quantities.get(product.id);
      if (product.stock < requested) {
        await transaction.rollback();
        return res.status(409).json({
          message: `Estoque insuficiente para o produto "${product.name}".`,
          available: product.stock,
          requested
        });
      }
    }

    const sale = await Sale.create({
      client_id: Number(client_id),
      paymentMethod: paymentMethod.trim(),
      status: 'PENDING'
    }, { transaction });

    for (const id of productIds) {
      await ProductSale.create({ sale_id: sale.id, product_id: id }, { transaction });
    }

    for (const product of found) {
      await product.decrement('stock', {
        by: quantities.get(product.id),
        transaction
      });
    }

    if (installments.length) {
      await Installment.bulkCreate(installments.map(item => ({
        sale_id: sale.id,
        number: item.number,
        amount: item.amount,
        is_paid: item.is_paid ?? false
      })), { transaction });
    }

    await transaction.commit();
    const result = await Sale.findByPk(sale.id, { include });
    return res.status(201).json(result);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return sendError(res, error);
  }
}

async function deleteSale(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const sale = await Sale.findByPk(req.params.id, { transaction });
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Venda não encontrada.' });
    }

    // Devolve o estoque antes de apagar os itens.
    const items = await ProductSale.findAll({
      where: { sale_id: sale.id },
      transaction
    });

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (product) await product.increment('stock', { by: 1, transaction });
    }

    await Installment.destroy({ where: { sale_id: sale.id }, transaction });
    await ProductSale.destroy({ where: { sale_id: sale.id }, transaction });
    await sale.destroy({ transaction });
    await transaction.commit();
    return res.status(204).send();
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return sendError(res, error);
  }
}

module.exports = { ...crud, createComplete, deleteSale };
