const { Client } = require('../models');
const { createCrudController } = require('./crudController');

function isValidCPF(value) {
  const cpf = String(value || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = length => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(cpf[i]) * (length + 1 - i);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

async function validateClient(data, req, record) {
  const required = !record;
  if (required || Object.hasOwn(data, 'name')) {
    if (typeof data.name !== 'string' || data.name.trim().length < 3 || data.name.trim().length > 120) {
      const error = new Error('O nome deve ter entre 3 e 120 caracteres.'); error.name = 'ValidationError'; throw error;
    }
    data.name = data.name.trim();
  }
  if (required || Object.hasOwn(data, 'cpf')) {
    const cpf = typeof data.cpf === 'string' ? data.cpf.replace(/\D/g, '') : '';
    if (!isValidCPF(cpf)) { const error = new Error('Informe um CPF válido.'); error.name = 'ValidationError'; throw error; }
    data.cpf = cpf;
  }
  if (required || Object.hasOwn(data, 'email')) {
    if (typeof data.email !== 'string' || data.email.trim().length > 254 || !/^\S+@\S+\.\S+$/.test(data.email.trim())) {
      const error = new Error('Informe um e-mail válido.'); error.name = 'ValidationError'; throw error;
    }
    data.email = data.email.trim().toLowerCase();
  }
  if (required || Object.hasOwn(data, 'contact')) {
    if (typeof data.contact !== 'string' || data.contact.replace(/\D/g, '').length < 10 || data.contact.length > 30) {
      const error = new Error('Informe um telefone válido.'); error.name = 'ValidationError'; throw error;
    }
    data.contact = data.contact.trim();
  }
}

module.exports = createCrudController(Client, {
  fields: ['name', 'cpf', 'contact', 'email'],
  beforeCreate: (data, req) => validateClient(data, req, null),
  beforeUpdate: validateClient
});
