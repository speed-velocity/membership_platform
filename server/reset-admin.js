/**
 * Reset admin password. Run with: node server/reset-admin.js
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from .env
 * IMPORTANT: Stop the server first, then run this, then restart the server.
 */
const bcrypt = require('bcryptjs');
const config = require('./config');
const db = require('./db');

async function resetAdmin() {
  await db.initDb();

  const adminEmail = config.adminEmail;
  const hashedPassword = bcrypt.hashSync(config.adminPassword, 10);

  const updated = await db.run(
    'UPDATE users SET password = $1 WHERE email = $2 AND role = $3',
    [hashedPassword, adminEmail, 'admin']
  );

  if (updated.changes === 0) {
    await db.run('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [
      adminEmail,
      hashedPassword,
      'admin',
    ]);
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin password reset successfully!');
  }

  console.log(`Email: ${adminEmail}`);
  console.log('Password: (from .env ADMIN_PASSWORD)');
  console.log('\nRestart the server (npm run dev) for changes to take effect.');
}

resetAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
