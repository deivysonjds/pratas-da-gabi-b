require('dotenv').config();

const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');

async function main() {
  const rl = readline.createInterface({ input, output });
  try {
    const name = (await rl.question('Nome: ')).trim();
    const email = (await rl.question('Email: ')).trim().toLowerCase();
    const password = await rl.question('Senha (8 a 72 bytes): ');

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new Error('Informe nome, email válido e senha entre 8 e 72 bytes.');
    }

    await sequelize.authenticate();
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new Error('Já existe um usuário com esse email.');

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    console.log(`Usuário criado com sucesso (ID ${user.id}).`);
  } finally {
    rl.close();
    await sequelize.close();
  }
}

main().catch(error => {
  console.error(error.message || 'Não foi possível criar o usuário.');
  process.exitCode = 1;
});
