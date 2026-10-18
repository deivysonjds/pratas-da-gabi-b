const { Product, Category } = require('../models');
const { createCrudController } = require('./crudController');
const {
  deleteProductImageByPath,
  extractPathFromPublicUrl
} = require('../services/storageService');

async function validateProduct(data) {
  if (Object.hasOwn(data, 'name') && (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 120)) {
    const error = new Error('O nome do produto é obrigatório e deve ter até 120 caracteres.'); error.name = 'ValidationError'; throw error;
  }
  if (Object.hasOwn(data, 'name')) data.name = data.name.trim();
  if (Object.hasOwn(data, 'description') && data.description !== null && (typeof data.description !== 'string' || data.description.length > 2000)) {
    const error = new Error('A descrição deve ter no máximo 2000 caracteres.'); error.name = 'ValidationError'; throw error;
  }
  if (Object.hasOwn(data, 'value')) {
    data.value = Number(data.value);
    if (!Number.isFinite(data.value) || data.value < 0) { const error = new Error('O preço deve ser um número maior ou igual a zero.'); error.name = 'ValidationError'; throw error; }
  }
  if (Object.hasOwn(data, 'stock')) {
    data.stock = Number(data.stock);
    if (!Number.isInteger(data.stock) || data.stock < 0) { const error = new Error('O estoque deve ser um inteiro maior ou igual a zero.'); error.name = 'ValidationError'; throw error; }
  }
}

async function resolveCategory(data) {
  if (Object.hasOwn(data, 'category')) {
    if (typeof data.category !== 'string' || !data.category.trim()) {
      const error = new Error('Informe uma categoria válida.');
      error.name = 'ValidationError';
      throw error;
    }
    const name = data.category.trim();
    const [category] = await Category.findOrCreate({ where: { name }, defaults: { name } });
    data.category_id = category.id;
    delete data.category;
  }
  if (data.category_id !== undefined) {
    data.category_id = Number(data.category_id);
    if (!Number.isInteger(data.category_id) || data.category_id < 1) {
      const error = new Error('Categoria inválida.');
      error.name = 'ValidationError';
      throw error;
    }
  }
}

module.exports = createCrudController(Product, {
  fields: ['name', 'description', 'value', 'stock', 'category_id', 'category'],
  include: [{ model: Category, as: 'category' }],
  beforeCreate: async data => { await validateProduct(data); await resolveCategory(data); },
  beforeUpdate: async data => { await validateProduct(data); await resolveCategory(data); },
  afterDelete: async product => {
    const filePath = extractPathFromPublicUrl(product.image_url);
    if (filePath) await deleteProductImageByPath(filePath);
  },
  sanitize: product => {
    if (!product) return product;
    const json = typeof product.toJSON === 'function' ? product.toJSON() : { ...product };
    if (json.category && json.category.name) json.category = json.category.name;
    return json;
  }
});
