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
const oauthRouter = require('./routers/oauth');

const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// tell express we're behind a proxy (Render) so secure cookies work
app.set('trust proxy', 1);

// --- sessions (for OAuth) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 7, // 7 days
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// passport
app.use(passport.initialize());
app.use(passport.session());

// security
app.use(helmet());

// rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  })
);

// CORS (you can tighten this later)
app.use(cors());

// body + logging
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, { explorer: true }));

// health
app.get('/', (_req, res) => res.json({ ok: true, message: 'API is up' }));
app.get('/health', (_req, res) => res.status(200).send('ok'));

// routes
app.use('/api', apiRouter);
app.use('/api', authRouter);
app.use('/api', oauthRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ status, error: err.message || 'Server error' });
});

// start
(async () => {
  try {
    await connect();
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();