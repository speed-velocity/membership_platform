const cron = require('node-cron');
const db = require('./db');
const { sendEmail } = require('./emailService');
const config = require('./config');

async function checkExpiringSubscriptions() {
  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  const dateStr = in3Days.toISOString().split('T')[0];
  const rows = await db.all(`
    SELECT s.user_id, s.expiry_date, s.plan, u.email
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.is_active = 1 AND s.expiry_date = $1 AND s.expiry_date >= CURRENT_DATE
  `, [dateStr]);
  rows.forEach((r) => {
    const email = r.email ?? r.Email;
    sendEmail(
      email,
      'Subscription Expiring Soon',
      `Your ${r.plan} subscription expires on ${r.expiry_date}. Renew to keep access.`
    );
  });
}

async function deactivateExpiredSubscriptions() {
  const expired = await db.all(`
    SELECT u.email, s.plan, s.expiry_date
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.expiry_date < CURRENT_DATE AND s.is_active = 1
  `);
  expired.forEach((r) => {
    const email = r.email ?? r.Email;
    sendEmail(
      email,
      'Subscription Expired',
      `Your ${r.plan} subscription has expired on ${r.expiry_date}. Renew at the platform to restore access.`
    );
  });
  await db.run('UPDATE subscriptions SET is_active = 0 WHERE expiry_date < CURRENT_DATE AND is_active = 1');
}

async function start() {
  await deactivateExpiredSubscriptions();
  cron.schedule('0 * * * *', async () => {
    await deactivateExpiredSubscriptions();
    await checkExpiringSubscriptions();
  });
}

module.exports = { start, checkExpiringSubscriptions, deactivateExpiredSubscriptions };
