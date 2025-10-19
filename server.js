// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./docs/swagger.json');     // ← generated file
const { connect } = require('./database/index');
const apiRouter = require('./routers/index');

const app = express();

// SECURITY
app.use(helmet());
app.set('trust proxy', 1); // needed on Render for accurate IPs
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })); // 300 req/15min per IP

// CORS (lock down in prod)
app.use(cors());

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Swagger UI (reads generated JSON)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, { explorer: true }));

app.get('/', (_req, res) => res.json({ ok: true, message: 'API is up' }));
app.get('/health', (_req, res) => res.status(200).send('ok'));

// API
app.use('/api', apiRouter);

// 404 & errors
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ status, error: err.message || 'Server error' });
});


const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connect();
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();