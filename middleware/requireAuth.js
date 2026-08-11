// middleware/requireAuth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ status: 401, error: 'Missing Bearer token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // keep a minimal user object
    req.user = { id: decoded.sub, email: decoded.email };
    return next();
  } catch (err) {
    return res.status(401).json({ status: 401, error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
