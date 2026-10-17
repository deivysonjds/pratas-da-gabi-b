const sequelize = require('../config/database');

const Client = require('./Client');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Sale = require('./Sale');
const ProductSale = require('./ProductSale');
const Installment = require('./Installment');

Client.hasMany(Sale, { foreignKey: 'client_id', as: 'sales' });
Sale.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Category.hasOne(Product, { foreignKey: 'category_id', as: 'product' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Sale.hasMany(ProductSale, { foreignKey: 'sale_id', as: 'items' });
ProductSale.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

Product.hasMany(ProductSale, { foreignKey: 'product_id', as: 'saleItems' });
ProductSale.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Sale.hasMany(Installment, { foreignKey: 'sale_id', as: 'installments' });
Installment.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

module.exports = { sequelize, Client, User, Category, Product, Sale, ProductSale, Installment };
