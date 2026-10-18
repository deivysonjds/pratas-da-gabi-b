const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/sanitizeInput');
const { getAllowedOrigins, verifyOrigin } = require('./middleware/verifyOrigin');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || getAllowedOrigins().includes(origin)) return callback(null, true);
    return callback(new Error('Origem não permitida pelo CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 600
}));
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(verifyOrigin);
app.use(sanitizeInput);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas requisições. Tente novamente em alguns minutos.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 10),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de autenticação. Aguarde 15 minutos.' }
});
const saleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.SALE_RATE_LIMIT || 20),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de compra. Tente novamente mais tarde.' }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.post('/api/sales', saleLimiter);
app.use('/api', routes);

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((error, req, res, next) => {
  if (error && error.message && error.message.includes('Origem não permitida pelo CORS')) {
    return res.status(403).json({ message: 'Origem não permitida.' });
  }
  return next(error);
});
app.use(errorHandler);

module.exports = app;
