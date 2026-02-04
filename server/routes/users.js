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

module.exports = router;
