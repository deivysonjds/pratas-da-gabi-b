const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  value: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: 0 } },
  stock: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, isInt: true } },
  // unique mantido conforme o esquema informado; remova se a categoria puder ter vários produtos.
  category_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  image_url: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'product', timestamps: false });
