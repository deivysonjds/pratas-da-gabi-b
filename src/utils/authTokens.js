const crypto = require('crypto');

function getAccessTokenSecret() {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ACCESS_TOKEN_SECRET deve estar configurado com pelo menos 32 caracteres.');
  }
  return secret;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const ttl = process.env.ACCESS_TOKEN_TTL || '15m';
  const match = /^(\d+)(s|m|h|d)$/.exec(ttl);
  if (!match) throw new Error('ACCESS_TOKEN_TTL inválido. Use, por exemplo, 15m, 1h ou 1d.');
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  const expiresIn = Number(match[1]) * multiplier;
  if (!Number.isSafeInteger(expiresIn) || expiresIn <= 0) throw new Error('ACCESS_TOKEN_TTL inválido.');

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: String(user.id),
    email: user.email,
    typ: 'access',
    iat: now,
    exp: now + expiresIn
  }));
  const data = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', getAccessTokenSecret()).update(data).digest('base64url');
  return { token: `${data}.${signature}`, expiresIn };
}

function verifyAccessToken(token) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) throw new Error('Token inválido.');

  const data = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', getAccessTokenSecret()).update(data).digest();
  let received;
  try {
    received = Buffer.from(parts[2], 'base64url');
  } catch {
    throw new Error('Token inválido.');
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new Error('Assinatura do token inválida.');
  }

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Token inválido.');
  }
  if (header.alg !== 'HS256' || payload.typ !== 'access' || !payload.sub || !Number.isFinite(payload.exp)) {
    throw new Error('Token inválido.');
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Token expirado.');
  return payload;
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshTokenExpiration() {
  const days = Number.parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error('REFRESH_TOKEN_TTL_DAYS deve ser um inteiro entre 1 e 365.');
  }
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

module.exports = { signAccessToken, verifyAccessToken, createRefreshToken, hashRefreshToken, refreshTokenExpiration };
