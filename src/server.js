require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.PORT || 3333);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com PostgreSQL estabelecida.');

    // O esquema é gerenciado por migrations: npm run db:migrate

    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar a API:', error);
    process.exit(1);
  }
}

start();
