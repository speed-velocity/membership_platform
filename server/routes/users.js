const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function getActiveSubscription(userId) {
  const sub = db.prepare(`
    SELECT * FROM subscriptions 
    WHERE user_id = ? AND is_active = 1 AND expiry_date >= date('now')
    ORDER BY expiry_date DESC LIMIT 1
  `).get(userId);
  return sub;
}

function daysRemaining(expiryDate) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = expiry - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

router.get('/dashboard', authMiddleware, (req, res) => {
  const profile = db.prepare(
    'SELECT full_name, telegram_username FROM users WHERE id = ?'
  ).get(req.user.id);
  const approved = db.prepare(
    "SELECT COUNT(*) as count FROM movie_requests WHERE user_id = ? AND status = 'approved'"
  ).get(req.user.id);
  const denied = db.prepare(
    "SELECT COUNT(*) as count FROM movie_requests WHERE user_id = ? AND status = 'denied'"
  ).get(req.user.id);
  const sub = getActiveSubscription(req.user.id);
  if (!sub) {
    return res.json({
      hasSubscription: false,
      plan: null,
      startDate: null,
      expiryDate: null,
      remainingDays: 0,
      fullName: profile?.full_name || null,
      telegramUsername: profile?.telegram_username || null,
      approvedRequests: approved?.count ?? 0,
      deniedRequests: denied?.count ?? 0,
    });
  }
  res.json({
    hasSubscription: true,
    plan: sub.plan,
    startDate: sub.start_date,
    expiryDate: sub.expiry_date,
    remainingDays: daysRemaining(sub.expiry_date),
    fullName: profile?.full_name || null,
    telegramUsername: profile?.telegram_username || null,
    approvedRequests: approved?.count ?? 0,
    deniedRequests: denied?.count ?? 0,
  });
});

router.get('/watchlist', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT c.*
    FROM watchlist w
    JOIN content c ON c.id = w.content_id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `).all(req.user.id);
  res.json({ content: rows });
});

router.post('/watchlist', authMiddleware, (req, res) => {
  const { contentId } = req.body || {};
  if (!contentId) return res.status(400).json({ error: 'contentId required' });
  const exists = db.prepare('SELECT id FROM content WHERE id = ?').get(contentId);
  if (!exists) return res.status(404).json({ error: 'Content not found' });
  try {
    db.prepare('INSERT INTO watchlist (user_id, content_id) VALUES (?, ?)').run(req.user.id, contentId);
  } catch (e) {
    // ignore duplicate
  }
  res.json({ ok: true });
});

router.delete('/watchlist/:contentId', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM watchlist WHERE user_id = ? AND content_id = ?').run(req.user.id, req.params.contentId);
  res.json({ ok: true });
});

module.exports = router;
