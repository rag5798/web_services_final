// routers/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getCollection } = require('../database/index');
const requireAuth = require('../middleware/requireAuth');
const { ObjectId } = require('mongodb');

const router = express.Router();
const users = () => getCollection('users');

function makeToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6'),
  ],
  async (req, res, next) => {
    /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Register a new user'
    #swagger.requestBody = {
        required: true,
        content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/UserRegister" },
            example: {
            email: "test1@example.com",
            password: "password123"
            }
        }
        }
    }
    #swagger.responses[201] = { description: 'Created (returns JWT)' }
    #swagger.responses[409] = { description: 'User already exists' }
    */

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 400, errors: errors.array() });
      }

      const { email, password } = req.body;
      const existing = await users().findOne({ email });
      if (existing) {
        return res.status(409).json({ status: 409, error: 'User already exists' });
      }

      const hash = await bcrypt.hash(password, 10);
      const doc = {
        email,
        passwordHash: hash,
        createdAt: new Date(),
      };
      const result = await users().insertOne(doc);
      const token = makeToken({ _id: result.insertedId, email });

      return res.status(201).json({
        status: 201,
        message: 'Registered',
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Login user'
    #swagger.requestBody = {
        required: true,
        content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/UserLogin" },
            example: {
            email: "test1@example.com",
            password: "password123"
            }
        }
        }
    }
    #swagger.responses[200] = { description: 'OK (returns JWT)' }
    #swagger.responses[401] = { description: 'Invalid credentials' }
    */

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 400, errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await users().findOne({ email });
      if (!user) return res.status(401).json({ status: 401, error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ status: 401, error: 'Invalid credentials' });

      const token = makeToken(user);
      return res.json({ status: 200, message: 'Logged in', token });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/auth/email
router.put(
  '/auth/email',
  requireAuth,
  [body('email').isEmail().withMessage('Valid email required')],
  async (req, res, next) => {
    /*
      #swagger.tags = ['Auth']
      #swagger.summary = 'Update user email'
      #swagger.security = [{ "bearerAuth": [] }]
      #swagger.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', example: 'newemail@example.com' }
              }
            }
          }
        }
      }
      #swagger.responses[200] = { description: 'Email updated' }
      #swagger.responses[400] = { description: 'Validation error' }
      #swagger.responses[409] = { description: 'Email already in use' }
    */
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 400, errors: errors.array() });
      }

      const { email } = req.body;

      // check if email already exists
      const existing = await users().findOne({ email });
      if (existing && existing._id.toString() !== req.user.id) {
        return res.status(409).json({ status: 409, error: 'Email already in use' });
      }

      await users().updateOne(
        { _id: new ObjectId(req.user.id) },
        { $set: { email } }
      );

      return res.json({ status: 200, message: 'Email updated', email });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/auth/password
router.put(
  '/auth/password',
  requireAuth,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password min 6'),
  ],
  async (req, res, next) => {
    /*
      #swagger.tags = ['Auth']
      #swagger.summary = 'Update user password'
      #swagger.security = [{ "bearerAuth": [] }]
      #swagger.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string', example: 'password123' },
                newPassword: { type: 'string', example: 'newpassword456' }
              }
            }
          }
        }
      }
      #swagger.responses[200] = { description: 'Password updated' }
      #swagger.responses[400] = { description: 'Validation or current password wrong' }
    */
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 400, errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const user = await users().findOne({ _id: new ObjectId(req.user.id) });

      if (!user || !user.passwordHash) {
        return res.status(400).json({ status: 400, error: 'Password cannot be changed for this account' });
      }

      const matches = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!matches) {
        return res.status(400).json({ status: 400, error: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await users().updateOne(
        { _id: user._id },
        { $set: { passwordHash: newHash } }
      );

      return res.json({ status: 200, message: 'Password updated' });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/auth/account
router.delete('/auth/account', requireAuth, async (req, res, next) => {
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Delete current user account'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.responses[200] = { description: 'Account deleted' }
  */
  try {
    await users().deleteOne({ _id: new ObjectId(req.user.id) });
    return res.json({ status: 200, message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me (protected)
router.get('/me', requireAuth, (req, res) => {
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Return current user'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.responses[200] = { description: 'User info' }
    #swagger.responses[401] = { description: 'Unauthorized' }
  */
  return res.json({ status: 200, user: req.user });
});

module.exports = router;
