const { Client } = require('../models');
const { createCrudController } = require('./crudController');

module.exports = createCrudController(Client, {
  fields: ['name', 'cpf', 'contact', 'email']
});
