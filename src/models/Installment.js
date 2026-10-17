const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Installment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sale_id: { type: DataTypes.INTEGER, allowNull: false },
  number: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, isInt: true } },
  is_paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  amount: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: 0 } }
}, { tableName: 'installment', timestamps: false });
