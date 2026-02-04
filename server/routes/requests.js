const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sendEmail } = require('../emailService');
const config = require('../config');

const router = express.Router();

function getRequestLimit() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('request_limit_per_12h');
  return parseInt(row?.value || '2', 10);
}

function getRecentRequestCount(userId) {
  const limit = getRequestLimit();
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const count = db.prepare(
    'SELECT COUNT(*) as c FROM movie_requests WHERE user_id = ? AND created_at >= ?'
  ).get(userId, cutoff);
  return count?.c || 0;
}

function getNextRequestTime(userId) {
  const limit = getRequestLimit();
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const oldest = db.prepare(
    'SELECT created_at FROM movie_requests WHERE user_id = ? AND created_at >= ? ORDER BY created_at ASC LIMIT 1'
  ).get(userId, cutoff);
  if (!oldest || getRecentRequestCount(userId) < limit) return null;
  const t = new Date(oldest.created_at);
  t.setHours(t.getHours() + 12);
  return t.toISOString();
}

router.get('/limit-status', authMiddleware, (req, res) => {
  const count = getRecentRequestCount(req.user.id);
  const limit = getRequestLimit();
  const nextAvailable = getNextRequestTime(req.user.id);
  res.json({
    count,
    limit,
    canRequest: count < limit,
    nextAvailableAt: nextAvailable,
  });
});

router.post('/', authMiddleware, (req, res) => {
  const { title, message } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const count = getRecentRequestCount(req.user.id);
  const limit = getRequestLimit();
  if (count >= limit) {
    const nextAvailable = getNextRequestTime(req.user.id);
    return res.status(429).json({
      error: 'Request limit reached',
      nextAvailableAt: nextAvailable,
      count,
      limit,
    });
  }
  db.prepare('INSERT INTO movie_requests (user_id, title, message) VALUES (?, ?, ?)').run(
    req.user.id,
    title.trim(),
    (message || '').trim()
  );
  sendEmail(
    config.notificationEmail,
    'New Movie Request',
    `User ${req.user.email} requested: ${title.trim()}${message ? '\nMessage: ' + message : ''}`
  );
  const newCount = getRecentRequestCount(req.user.id);
  const nextAvailable = getNextRequestTime(req.user.id);
  res.json({
    ok: true,
    count: newCount,
    limit,
    nextAvailableAt: nextAvailable,
  });
});

router.get('/my', authMiddleware, (req, res) => {
  const rows = db.prepare(
    'SELECT id, title, message, status, created_at FROM movie_requests WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ requests: rows });
});

module.exports = router;
