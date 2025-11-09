// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./docs/swagger.json');
const { connect } = require('./database/index');
const apiRouter = require('./routers/index');
const authRouter = require('./routers/auth');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');
const oauthRouter = require('./routers/oauth');

const app = express();

//OAuth session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// SECURITY
app.use(helmet());
app.set('trust proxy', 1);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// CORS
app.use(cors());

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Swagger UI (reads generated JSON)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, { explorer: true }));

app.get('/', (_req, res) => res.json({ ok: true, message: 'API is up' }));
app.get('/health', (_req, res) => res.status(200).send('ok'));

// API
app.use('/api', apiRouter);
app.use('/api', authRouter);
app.use('/api', oauthRouter);

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