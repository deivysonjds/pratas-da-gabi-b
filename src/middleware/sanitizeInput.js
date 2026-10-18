const xss = require('xss');

const sensitiveKeys = new Set(['password', 'refreshToken', 'accessToken', 'token']);
const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] };

function clean(value, key = '') {
  if (typeof value === 'string') {
    if (sensitiveKeys.has(key)) return value;
    const normalized = value.replace(/\u0000/g, '').replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    return xss(normalized, xssOptions);
  }
  if (Array.isArray(value)) return value.map(item => clean(item));
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const output = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(childKey)) continue;
      output[childKey] = clean(childValue, childKey);
    }
    return output;
  }
  return value;
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.params && typeof req.params === 'object') req.params = clean(req.params);
  try {
    Object.defineProperty(req, 'query', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: clean(req.query || {})
    });
  } catch { /* A consulta será validada pelos controladores caso não possa ser sobrescrita. */ }
  next();
}

module.exports = { sanitizeInput, clean };
