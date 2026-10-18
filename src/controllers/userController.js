const bcrypt = require('bcrypt');
const { User } = require('../models');
const { createCrudController } = require('./crudController');

function sanitize(user) {
  if (!user) return user;
  const json = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete json.password;
  return json;
}

function validateUserFields(data, requirePassword = false) {
  if (Object.hasOwn(data, 'name') || requirePassword) {
    if (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 120) {
      const error = new Error('O nome do usuário é obrigatório e deve ter até 120 caracteres.'); error.name = 'ValidationError'; throw error;
    }
    data.name = data.name.trim();
  }
  if (Object.hasOwn(data, 'email') || requirePassword) {
    if (typeof data.email !== 'string' || data.email.trim().length > 254 || !/^\S+@\S+\.\S+$/.test(data.email.trim())) {
      const error = new Error('Informe um e-mail válido.'); error.name = 'ValidationError'; throw error;
    }
    data.email = data.email.trim().toLowerCase();
  }
  if (requirePassword || Object.hasOwn(data, 'password')) {
    if (typeof data.password !== 'string' || data.password.length < 8 || Buffer.byteLength(data.password, 'utf8') > 72) {
      const error = new Error('A senha deve ter entre 8 e 72 bytes.'); error.name = 'ValidationError'; throw error;
    }
  }
}

async function createUser(data) {
  validateUserFields(data, true);
  data.password = await bcrypt.hash(data.password, 12);
}

async function updateUser(data) {
  validateUserFields(data, false);
  if (Object.hasOwn(data, 'password')) data.password = await bcrypt.hash(data.password, 12);
}

module.exports = createCrudController(User, {
  fields: ['name', 'email', 'password'],
  sanitize,
  beforeCreate: createUser,
  beforeUpdate: updateUser
});
