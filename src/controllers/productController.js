const { Product, Category } = require('../models');
const { createCrudController } = require('./crudController');
const {
  deleteProductImageByPath,
  extractPathFromPublicUrl
} = require('../services/storageService');

module.exports = createCrudController(Product, {
  fields: ['name', 'description', 'value', 'stock', 'category_id', 'image_url'],
  include: [{ model: Category, as: 'category' }],
  afterDelete: async product => {
    const filePath = extractPathFromPublicUrl(product.image_url);
    if (filePath) await deleteProductImageByPath(filePath);
  }
});
