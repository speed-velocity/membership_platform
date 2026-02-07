const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'cinematic-platform-secret-key-change-in-production';

async function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(
      'SELECT id, email, role, favorite_genre, avatar_url, status FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ error: 'Account pending deletion' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, JWT_SECRET };
