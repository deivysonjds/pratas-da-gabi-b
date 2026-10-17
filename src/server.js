require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.PORT || 3000);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com PostgreSQL estabelecida.');

    // Para desenvolvimento inicial. Use migrations em produção.
    await sequelize.sync();

    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar a API:', error);
    process.exit(1);
  }
}

start();
