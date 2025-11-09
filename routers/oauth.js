const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// start google login
router.get('/google', (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// google callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/google/fail'
  })(req, res, async () => {
    const user = req.user;

    // make the JWT like before
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    // where to send them after login
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://web-services-final.onrender.com';

    // redirect with token
    return res.redirect(`${FRONTEND_URL}/oauth?token=${token}`);
  });
});

// fail route
router.get('/google/fail', (req, res) => {
  res.status(401).json({ status: 401, error: 'Google OAuth failed' });
});

module.exports = router;
