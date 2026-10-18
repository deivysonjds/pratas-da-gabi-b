const fs = require('fs');
const { Sequelize } = require('sequelize');

const sslEnabled = process.env.DB_SSL === 'true';
const ssl = sslEnabled ? {
  require: true,
  rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  ...(process.env.DB_SSL_CA ? { ca: fs.readFileSync(process.env.DB_SSL_CA, 'utf8') } : {}),
} : undefined;
const dialectOptions = sslEnabled ? { ssl } : {};
const commonOptions = {
  dialect: 'postgres',
  logging: false,
  dialectOptions,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
};

let sequelize;
if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...commonOptions,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
    },
  );
} else if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, commonOptions);
} else {
  throw new Error('Configure DB_HOST/DB_USER/DB_PASSWORD ou DATABASE_URL no .env.');
}

module.exports = sequelize;
