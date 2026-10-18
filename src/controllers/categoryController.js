const { Category } = require('../models');
const { createCrudController } = require('./crudController');

async function validateCategory(data) {
  if (Object.hasOwn(data, 'name')) {
    if (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 60) {
      const error = new Error('O nome da categoria é obrigatório e deve ter até 60 caracteres.'); error.name = 'ValidationError'; throw error;
    }
    data.name = data.name.trim();
  }
}

module.exports = createCrudController(Category, {
  fields: ['name'], beforeCreate: validateCategory, beforeUpdate: validateCategory
});
