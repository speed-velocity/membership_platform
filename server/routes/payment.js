const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sendEmail } = require('../emailService');
const config = require('../config');

const router = express.Router();

const PLANS = {
  Basic: { price: 10, name: 'Basic' },
};

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

router.post('/subscribe', authMiddleware, async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Members only' });
  }
  const { plan, months, fullName, telegramUsername } = req.body;
  if (!plan || !months) {
    return res.status(400).json({ error: 'Plan and months required' });
  }
  if (!PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  const monthsNum = parseInt(months, 10);
  if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 12) {
    return res.status(400).json({ error: 'Months must be 1-12' });
  }
  if (!fullName || !telegramUsername) {
    return res.status(400).json({ error: 'Full name and Telegram username required' });
  }
  const start = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + monthsNum);
  const startStr = start.toISOString().split('T')[0];
  const expiryStr = expiryDate.toISOString().split('T')[0];
  await db.run(
    'UPDATE users SET full_name = $1, telegram_username = $2 WHERE id = $3',
    [fullName, telegramUsername, req.user.id]
  );
  await db.run('UPDATE subscriptions SET is_active = 0 WHERE user_id = $1', [req.user.id]);
  await db.run(
    'INSERT INTO subscriptions (user_id, plan, start_date, expiry_date, is_active) VALUES ($1, $2, $3, $4, 1)',
    [req.user.id, plan, startStr, expiryStr]
  );
  const userEmail = req.user.email ?? req.user.Email;
  sendEmail(
    userEmail,
    'Subscription Activated',
    `Your ${plan} subscription is now active.\nStart: ${startStr}\nExpires: ${expiryStr}\n\nThank you for subscribing!`
  );
  sendEmail(
    config.notificationEmail,
    'New Subscription',
    `User ${userEmail} subscribed to ${plan} for ${monthsNum} month(s). Expires: ${expiryStr}`
  );
  res.json({
    ok: true,
    subscription: { plan, startDate: startStr, expiryDate: expiryStr },
    message: 'Payment successful! Your subscription is now active.',
  });
});

module.exports = router;
