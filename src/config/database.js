
const { Sequelize } = require('sequelize');

const {
  DB_HOST,
  DB_PORT = '5432',
  DB_NAME = 'postgres',
  DB_USER = 'postgres',
  DB_PASSWORD,
} = process.env;

console.log(DB_USER);

if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  throw new Error('Configure DB_HOST, DB_USER e DB_PASSWORD no .env.');
}

const sslEnabled = process.env.DB_SSL === 'true';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: false,
  dialectOptions: sslEnabled
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
