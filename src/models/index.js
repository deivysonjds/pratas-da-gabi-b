const sequelize = require('../config/database');

const Client = require('./Client');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Sale = require('./Sale');
const ProductSale = require('./ProductSale');
const Installment = require('./Installment');
const RefreshToken = require('./RefreshToken');

Client.hasMany(Sale, { foreignKey: 'client_id', as: 'sales' });
Sale.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Sale.hasMany(ProductSale, { foreignKey: 'sale_id', as: 'items' });
ProductSale.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

Product.hasMany(ProductSale, { foreignKey: 'product_id', as: 'saleItems' });
ProductSale.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Sale.hasMany(Installment, { foreignKey: 'sale_id', as: 'installments' });
Installment.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

module.exports = { sequelize, Client, User, Category, Product, Sale, ProductSale, Installment, RefreshToken };
