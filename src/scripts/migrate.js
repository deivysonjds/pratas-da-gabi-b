require('dotenv').config();

const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('../models');

const queryInterface = sequelize.getQueryInterface();

const fs = require('fs');

const migrationsDir = path.resolve(__dirname, '../../migrations');

console.log('Diretório procurado:', migrationsDir);
console.log('Diretório existe:', fs.existsSync(migrationsDir));

if (fs.existsSync(migrationsDir)) {
  console.log('Arquivos encontrados:', fs.readdirSync(migrationsDir));
}

const umzug = new Umzug({
  migrations: {
  glob: path
    .join(__dirname, '../../migrations/*.js')
    .replace(/\\/g, '/'),
  resolve: ({ name, path: migrationPath }) => {
    const migration = require(migrationPath);

    return {
      name,
      up: () => migration.up(queryInterface, require('sequelize')),
      down: () => migration.down(queryInterface, require('sequelize')),
    };
  },
},
  context: queryInterface,
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com PostgreSQL estabelecida.');

    if (process.argv.includes('undo')) {
      const reverted = await umzug.down();
      console.log(reverted.name ? `Migration revertida: ${reverted.name}` : 'Não há migrations para reverter.');
    } else if (process.argv.includes('status')) {
      const [executed, pending] = await Promise.all([umzug.executed(), umzug.pending()]);
      console.log('Executadas:', executed.map(item => item.name));
      console.log('Pendentes:', pending.map(item => item.name));
    } else {
      const executed = await umzug.up();
      if (!executed.length) console.log('Nenhuma migration pendente.');
      else console.log(`Migrations executadas: ${executed.map(item => item.name).join(', ')}`);
    }
  } catch (error) {
    console.error('Falha ao executar migrations:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
