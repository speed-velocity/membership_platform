const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('../server/db');

async function resetAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL or ADMIN_PASSWORD missing in .env');
    process.exit(1);
  }

  await db.initDb();

  const email = process.env.ADMIN_EMAIL;
  const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);

  const updated = await db.run(
    'UPDATE users SET password = $1 WHERE email = $2 AND role = $3',
    [passwordHash, email, 'admin']
  );

  if (updated.changes === 0) {
    await db.run('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [
      email,
      passwordHash,
      'admin',
    ]);
    console.log('Admin user created successfully!');
  } else {
    console.log('Admin password reset successfully!');
  }

  console.log('Email:', email);
  console.log('Password: (from .env)');
  console.log('\nRestart the server (npm run dev)');
}

resetAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
