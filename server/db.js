const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('./config');

const dbPath = path.join(__dirname, '..', 'data', 'membership.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function createWrapper(db) {
  return {
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        get(...params) {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          stmt.bind(p.length ? p : null);
          const hasRow = stmt.step();
          const row = hasRow ? stmt.getAsObject() : undefined;
          stmt.reset();
          return row;
        },
        run(...params) {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          stmt.run(p.length ? p : undefined);
          stmt.reset();
          return { changes: db.getRowsModified() };
        },
        all(...params) {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          stmt.bind(p.length ? p : null);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.reset();
          return rows;
        },
      };
    },
    exec(sql) {
      db.run(sql);
    },
  };
}

const mod = module.exports;

mod.initDb = async function () {
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  // Ensure base schema exists
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      full_name TEXT,
      telegram_username TEXT
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

    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS email_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_movie_requests_user ON movie_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_movie_requests_created ON movie_requests(created_at);
    CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);
    CREATE INDEX IF NOT EXISTS idx_email_otps_user ON email_otps(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_otps_hash ON email_otps(otp_hash);
  `);

  // Ensure users.last_login/full_name/telegram_username exist
  try {
    const info = db.exec("PRAGMA table_info(users)");
    const columns = info?.[0]?.values?.map((row) => row[1]) || [];
    if (!columns.includes('last_login')) {
      db.run('ALTER TABLE users ADD COLUMN last_login DATETIME');
    }
    if (!columns.includes('full_name')) {
      db.run('ALTER TABLE users ADD COLUMN full_name TEXT');
    }
    if (!columns.includes('telegram_username')) {
      db.run('ALTER TABLE users ADD COLUMN telegram_username TEXT');
    }
  } catch (e) {
    console.error('DB migration error:', e.message);
  }

  // Ensure login_history.full_name exists
  try {
    const info = db.exec("PRAGMA table_info(login_history)");
    const columns = info?.[0]?.values?.map((row) => row[1]) || [];
    if (columns.includes('id') && !columns.includes('full_name')) {
      db.run('ALTER TABLE login_history ADD COLUMN full_name TEXT');
    }
  } catch (e) {
    console.error('DB migration error:', e.message);
  }

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
    const stmt = db.prepare('INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)');
    stmt.run([adminEmail, hashedPassword, 'admin', 'Admin']);
    stmt.free();
    console.log(`Admin created: ${adminEmail}`);
  }
  db.run('PRAGMA journal_mode = WAL;');
  const wrapper = createWrapper(db);
  Object.assign(mod, wrapper);
  const save = () => {
    try {
      const data = db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (e) {
      console.error('DB save error:', e.message);
    }
  };
  setInterval(save, 5000);
  process.on('beforeExit', () => {
    save();
    db.close();
  });
  return mod;
};
