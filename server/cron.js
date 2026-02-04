const cron = require('node-cron');
const db = require('./db');
const { sendEmail } = require('./emailService');
const config = require('./config');

function checkExpiringSubscriptions() {
  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  const dateStr = in3Days.toISOString().split('T')[0];
  const rows = db.prepare(`
    SELECT s.user_id, s.expiry_date, s.plan, u.email
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.is_active = 1 AND s.expiry_date = ? AND s.expiry_date >= date('now')
  `).all(dateStr);
  rows.forEach((r) => {
    const email = r.email ?? r.Email;
    sendEmail(
      email,
      'Subscription Expiring Soon',
      `Your ${r.plan} subscription expires on ${r.expiry_date}. Renew to keep access.`
    );
  });
}

function deactivateExpiredSubscriptions() {
  const expired = db.prepare(`
    SELECT u.email, s.plan, s.expiry_date
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.expiry_date < date('now') AND s.is_active = 1
  `).all();
  expired.forEach((r) => {
    const email = r.email ?? r.Email;
    sendEmail(
      email,
      'Subscription Expired',
      `Your ${r.plan} subscription has expired on ${r.expiry_date}. Renew at the platform to restore access.`
    );
  });
  db.prepare('UPDATE subscriptions SET is_active = 0 WHERE expiry_date < date("now") AND is_active = 1').run();
}

function start() {
  deactivateExpiredSubscriptions();
  cron.schedule('0 * * * *', () => {
    deactivateExpiredSubscriptions();
    checkExpiringSubscriptions();
  });
}

module.exports = { start, checkExpiringSubscriptions, deactivateExpiredSubscriptions };
