const bcrypt = require('bcrypt');
const { User } = require('../models');
const { createCrudController } = require('./crudController');

function sanitize(user) {
  if (!user) return user;
  const json = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete json.password;
  return json;
}

async function hashPassword(data) {
  if (typeof data.password !== 'string' || data.password.length < 8) {
    const error = new Error('A senha deve ter pelo menos 8 caracteres.');
    error.name = 'ValidationError';
    throw error;
  }
  data.password = await bcrypt.hash(data.password, 12);
}

module.exports = createCrudController(User, {
  fields: ['name', 'password'],
  sanitize,
  beforeCreate: hashPassword,
  beforeUpdate: async data => {
    if (Object.hasOwn(data, 'password')) await hashPassword(data);
  }
});
