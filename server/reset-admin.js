/**
 * Reset admin password. Run with: node server/reset-admin.js
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from .env
 * IMPORTANT: Stop the server first, then run this, then restart the server.
 */
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('./config');

const dbPath = path.join(__dirname, '..', 'data', 'membership.db');

async function resetAdmin() {
  const initSqlJs = require('sql.js');

  if (!fs.existsSync(dbPath)) {
    console.error('Database not found. Run: npm run init-db');
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const buf = fs.readFileSync(dbPath);
  const db = new SQL.Database(buf);

  const adminEmail = config.adminEmail;
  const hashedPassword = bcrypt.hashSync(config.adminPassword, 10);

  const stmt = db.prepare('UPDATE users SET password = ? WHERE email = ? AND role = ?');
  stmt.run([hashedPassword, adminEmail, 'admin']);
  const changes = db.getRowsModified();
  stmt.free();

  if (changes === 0) {
    const insertStmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
    insertStmt.run([adminEmail, hashedPassword, 'admin']);
    insertStmt.free();
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin password reset successfully!');
  }

  console.log(`Email: ${adminEmail}`);
  console.log('Password: (from .env ADMIN_PASSWORD)');
  console.log('\nRestart the server (npm run dev) for changes to take effect.');

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
}

resetAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
