const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sendEmail } = require('../emailService');
const config = require('../config');

const router = express.Router();

async function getRequestLimit() {
  const row = await db.get('SELECT value FROM settings WHERE key = $1', ['request_limit_per_12h']);
  return parseInt(row?.value || '2', 10);
}

async function getRecentRequestCount(userId) {
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const count = await db.get(
    'SELECT COUNT(*) as c FROM movie_requests WHERE user_id = $1 AND created_at >= $2',
    [userId, cutoff]
  );
  return Number(count?.c || 0);
}

async function getNextRequestTime(userId) {
  const limit = await getRequestLimit();
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const oldest = await db.get(
    'SELECT created_at FROM movie_requests WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at ASC LIMIT 1',
    [userId, cutoff]
  );
  const recent = await getRecentRequestCount(userId);
  if (!oldest || recent < limit) return null;
  const t = new Date(oldest.created_at);
  t.setHours(t.getHours() + 12);
  return t.toISOString();
}

router.get('/limit-status', authMiddleware, async (req, res) => {
  const count = await getRecentRequestCount(req.user.id);
  const limit = await getRequestLimit();
  const nextAvailable = await getNextRequestTime(req.user.id);
  res.json({
    count,
    limit,
    canRequest: count < limit,
    nextAvailableAt: nextAvailable,
  });
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const count = await getRecentRequestCount(req.user.id);
  const limit = await getRequestLimit();
  if (count >= limit) {
    const nextAvailable = await getNextRequestTime(req.user.id);
    return res.status(429).json({
      error: 'Request limit reached',
      nextAvailableAt: nextAvailable,
      count,
      limit,
    });
  }
  await db.run(
    'INSERT INTO movie_requests (user_id, title, message) VALUES ($1, $2, $3)',
    [req.user.id, title.trim(), (message || '').trim()]
  );
  sendEmail(
    config.notificationEmail,
    'New Movie Request',
    `User ${req.user.email} requested: ${title.trim()}${message ? '\nMessage: ' + message : ''}`
  );
  const newCount = await getRecentRequestCount(req.user.id);
  const nextAvailable = await getNextRequestTime(req.user.id);
  res.json({
    ok: true,
    count: newCount,
    limit,
    nextAvailableAt: nextAvailable,
  });
});

router.get('/my', authMiddleware, async (req, res) => {
  const rows = await db.all(
    'SELECT id, title, message, status, created_at FROM movie_requests WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ requests: rows });
});

module.exports = router;
