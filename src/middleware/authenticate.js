const { verifyAccessToken } = require('../utils/authTokens');

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const token = match?.[1] || req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ message: 'Autenticação necessária.' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: Number(payload.sub), email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
  }
}

module.exports = authenticate;
