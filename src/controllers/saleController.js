const {
  sequelize, Client, Product, Sale, ProductSale, Installment
} = require('../models');
const { createCrudController, sendError } = require('./crudController');

function isValidCPF(value) {
  const cpf = String(value || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = length => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(cpf[i]) * (length + 1 - i);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

const include = [
  { model: Client, as: 'client' },
  { model: ProductSale, as: 'items', include: [{ model: Product, as: 'product' }] },
  { model: Installment, as: 'installments' }
];

async function validateSaleUpdate(data) {
  if (Object.hasOwn(data, 'status') && !['PENDING', 'PAID', 'CANCELED'].includes(String(data.status).toUpperCase())) {
    const error = new Error('Status de venda inválido.'); error.name = 'ValidationError'; throw error;
  }
  if (Object.hasOwn(data, 'status')) data.status = String(data.status).toUpperCase();
  if (Object.hasOwn(data, 'paymentMethod') && (typeof data.paymentMethod !== 'string' || !data.paymentMethod.trim() || data.paymentMethod.trim().length > 50)) {
    const error = new Error('Forma de pagamento inválida.'); error.name = 'ValidationError'; throw error;
  }
  if (Object.hasOwn(data, 'paymentMethod')) data.paymentMethod = data.paymentMethod.trim();
}

const crud = createCrudController(Sale, {
  fields: ['client_id', 'status', 'paymentMethod'],
  include,
  beforeUpdate: validateSaleUpdate
});

async function createComplete(req, res) {
  const { client_id, paymentMethod, products, installments = [] } = req.body || {};

  if (!Number.isInteger(Number(client_id)) || Number(client_id) <= 0 ||
      typeof paymentMethod !== 'string' || !['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Parcelado'].includes(paymentMethod.trim()) ||
      !Array.isArray(products) || products.length === 0 || products.length > 100 ||
      !Array.isArray(installments) || installments.length > 100) {
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


async function createPublicSale(req, res) {
  const { customer, items, paymentMethod } = req.body || {};
  const name = typeof customer?.name === 'string' ? customer.name.trim() : '';
  const cpf = typeof customer?.cpf === 'string' ? customer.cpf.replace(/\D/g, '') : '';
  const email = typeof customer?.email === 'string' ? customer.email.trim().toLowerCase() : '';
  const contact = typeof (customer?.phone ?? customer?.contact) === 'string'
    ? String(customer.phone ?? customer.contact).trim() : '';

  if (name.length < 3 || name.length > 120 || !isValidCPF(cpf) ||
      !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 ||
      contact.replace(/\D/g, '').length < 10 || contact.length > 30 ||
      typeof paymentMethod !== 'string' || !['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'].includes(paymentMethod.trim()) ||
      !Array.isArray(items) || items.length === 0 || items.length > 100) {
    return res.status(400).json({ message: 'Confira os dados do cliente, pagamento e produtos.' });
  }

  const quantities = new Map();
  let totalUnits = 0;
  for (const item of items) {
    const productId = Number(item?.productId ?? item?.product_id ?? item?.id);
    const quantity = Number(item?.quantity ?? 1);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return res.status(400).json({ message: 'Um ou mais itens da compra são inválidos.' });
    }
    totalUnits += quantity;
    if (totalUnits > 100) return res.status(400).json({ message: 'O pedido pode conter no máximo 100 unidades.' });
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const transaction = await sequelize.transaction();
  try {
    const clients = await Client.findAll({ transaction });
    let client = clients.find(existing => String(existing.cpf || '').replace(/\D/g, '') === cpf) || null;
    if (client) {
      await client.update({ name, cpf, email, contact }, { transaction });
    } else {
      const emailOwner = await Client.findOne({ where: { email }, transaction });
      if (emailOwner) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Este e-mail já está cadastrado com outro CPF. Confira os dados ou entre em contato com a loja.' });
      }
      client = await Client.create({ name, cpf, email, contact }, { transaction });
    }

    const ids = [...quantities.keys()];
    const found = await Product.findAll({
      where: { id: ids }, transaction, lock: transaction.LOCK.UPDATE
    });
    if (found.length !== ids.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Um ou mais produtos não estão disponíveis.' });
    }
    for (const product of found) {
      const requested = quantities.get(product.id);
      if (Number(product.stock) < requested) {
        await transaction.rollback();
        return res.status(409).json({ message: `Estoque insuficiente para ${product.name}.`, available: product.stock, requested });
      }
    }

    const sale = await Sale.create({
      client_id: client.id,
      paymentMethod: paymentMethod.trim(),
      status: 'PENDING'
    }, { transaction });

    for (const [productId, quantity] of quantities.entries()) {
      for (let index = 0; index < quantity; index += 1) {
        await ProductSale.create({ sale_id: sale.id, product_id: productId }, { transaction });
      }
      const product = found.find(entry => entry.id === productId);
      await product.decrement('stock', { by: quantity, transaction });
    }

    await transaction.commit();
    const result = await Sale.findByPk(sale.id, { include });
    const total = (result.items || []).reduce((sum, row) => sum + Number(row.product?.value || 0), 0);
    return res.status(201).json({ message: 'Pedido registrado com sucesso.', sale: result, total });
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

module.exports = { ...crud, createComplete, createPublicSale, deleteSale };
