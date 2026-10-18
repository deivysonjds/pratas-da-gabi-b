function getAllowedOrigins() {
  return (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',').map(value => value.trim()).filter(Boolean);
}

function verifyOrigin(req, res, next) {
  const origin = req.get('origin');
  const method = req.method.toUpperCase();
  if (origin && !['GET', 'HEAD', 'OPTIONS'].includes(method) && !getAllowedOrigins().includes(origin)) {
    return res.status(403).json({ message: 'Origem não permitida.' });
  }
  next();
}

module.exports = { getAllowedOrigins, verifyOrigin };
