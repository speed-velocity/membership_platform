const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
require('dotenv').config();

// Path to your DB (matches your screenshot)
const dbPath = path.join(__dirname, '..', 'data', 'membership.db');

async function resetAdmin() {
  if (!fs.existsSync(dbPath)) {
    console.error('Database not found:', dbPath);
    process.exit(1);
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL or ADMIN_PASSWORD missing in .env');
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  const email = process.env.ADMIN_EMAIL;
  const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);

  // Try updating existing admin
  const updateStmt = db.prepare(
    'UPDATE users SET password = ? WHERE email = ? AND role = ?'
  );
  updateStmt.run([passwordHash, email, 'admin']);
  const changes = db.getRowsModified();
  updateStmt.free();

  // If no admin existed, create one
  if (changes === 0) {
    const insertStmt = db.prepare(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)'
    );
    insertStmt.run([email, passwordHash, 'admin']);
    insertStmt.free();
    console.log('Admin user created successfully!');
  } else {
    console.log('Admin password reset successfully!');
  }

  console.log('Email:', email);
  console.log('Password: (from .env)');

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();

  console.log('\nRestart the server (npm run dev)');
}

resetAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
