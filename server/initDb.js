const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('./config');

const dbPath = path.join(__dirname, '..', 'data', 'membership.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

async function initDb() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL,
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      thumbnail_path TEXT,
      video_1080_path TEXT,
      video_4k_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movie_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_movie_requests_user ON movie_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_movie_requests_created ON movie_requests(created_at);
  `);

  const requestLimit = db.exec("SELECT * FROM settings WHERE key = 'request_limit_per_12h'");
  if (!requestLimit?.length || !requestLimit[0]?.values?.length) {
    db.run("INSERT INTO settings (key, value) VALUES ('request_limit_per_12h', '2')");
  }

  const adminEmail = config.adminEmail;
  const adminStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  adminStmt.bind([adminEmail]);
  const hasAdmin = adminStmt.step();
  adminStmt.free();
  if (!hasAdmin) {
    const hashedPassword = bcrypt.hashSync(config.adminPassword, 10);
    const stmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
    stmt.run([adminEmail, hashedPassword, 'admin']);
    stmt.free();
    console.log(`Admin created: ${adminEmail}`);
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
  console.log('Database initialized successfully.');
}

initDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
