const { Installment, Sale } = require('../models');
const { createCrudController, sendError } = require('./crudController');

const crud = createCrudController(Installment, {
  fields: ['sale_id', 'number', 'is_paid', 'amount'],
  include: [{ model: Sale, as: 'sale' }]
});

async function updateStatus(req, res) {
  const { id } = req.params;
  const { is_paid } = req.body || {};

  if (typeof is_paid !== 'boolean') {
    return res.status(400).json({
      message: 'O campo is_paid deve ser true ou false.'
    });
  }

  try {
    const installment = await Installment.findByPk(id);

    if (!installment) {
      return res.status(404).json({
        message: 'Parcela não encontrada.'
      });
    }

    await installment.update({ is_paid });

    return res.status(200).json({
      message: 'Status da parcela atualizado com sucesso.',
      installment
    });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  ...crud,
  updateStatus
};