const { Installment, Sale } = require('../models');
const { createCrudController } = require('./crudController');

module.exports = createCrudController(Installment, {
  fields: ['sale_id', 'number', 'is_paid', 'amount'],
  include: [{ model: Sale, as: 'sale' }]
});
