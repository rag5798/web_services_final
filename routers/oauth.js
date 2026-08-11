const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// GET /api/google
router.get('/google', (req, res, next) => {
  /*
    #swagger.tags = ['OAuth']
    #swagger.summary = 'Start Google OAuth 2.0 login'
    #swagger.description = 'Redirects the user to Google for authentication.'
  */
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// GET /api/google/callback
router.get('/google/callback', (req, res, next) => {
  /*
    #swagger.tags = ['OAuth']
    #swagger.summary = 'Google OAuth callback'
    #swagger.description = 'Exchanges Google profile for API JWT'
    #swagger.responses[200] = {
      description: 'OAuth success - returns JWT',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'integer', example: 200 },
              message: { type: 'string', example: 'OAuth login successful' },
              token: { type: 'string' }
            }
          }
        }
      }
    }
  */
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/google/fail'
  })(req, res, async () => {
    // at this point req.user is set
    const user = req.user;
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.json({
      status: 200,
      message: 'OAuth login successful',
      token,
      user: {
        email: user.email,
        id: user._id,
      },
    });
  });
});

// GET /api/google/fail
router.get('/google/fail', (req, res) => {
  /*
    #swagger.tags = ['OAuth']
    #swagger.summary = 'Google OAuth failed'
  */
  res.status(401).json({ status: 401, error: 'Google OAuth failed' });
});

module.exports = router;