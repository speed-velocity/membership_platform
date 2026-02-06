const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('./config');
const { seedRecommendations } = require('./recommendationsSeed');

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for Postgres');
    }
    const useSsl = process.env.DATABASE_SSL === 'true';
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });
    process.on('beforeExit', async () => {
      try {
        await pool.end();
      } catch (e) {
        console.error('Failed to close DB pool:', e.message);
      }
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const p = Array.isArray(params) ? params : [params];
  return getPool().query(sql, p);
}

async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0];
}

async function all(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

async function run(sql, params = []) {
  const result = await query(sql, params);
  return { changes: result.rowCount };
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      full_name TEXT,
      telegram_username TEXT,
      favorite_genre TEXT,
      status TEXT DEFAULT 'active',
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL,
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS content (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      thumbnail_path TEXT,
      video_1080_path TEXT,
      video_4k_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movie_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS email_otps (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      content_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, content_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (content_id) REFERENCES content(id)
    );

    CREATE TABLE IF NOT EXISTS weekly_recommendations (
      id SERIAL PRIMARY KEY,
      genre TEXT NOT NULL,
      title TEXT NOT NULL,
      kind TEXT NOT NULL,
      poster_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(genre, title, kind)
    );

    CREATE TABLE IF NOT EXISTS weekly_recommendation_likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      recommendation_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, recommendation_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recommendation_id) REFERENCES weekly_recommendations(id)
    );

    CREATE TABLE IF NOT EXISTS account_deletion_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      action TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_watchlist_content ON watchlist(content_id);
    CREATE INDEX IF NOT EXISTS idx_weekly_reco_genre ON weekly_recommendations(genre);
    CREATE INDEX IF NOT EXISTS idx_weekly_likes_user ON weekly_recommendation_likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_weekly_likes_reco ON weekly_recommendation_likes(recommendation_id);
  `);

  const requestLimit = await get('SELECT value FROM settings WHERE key = $1', ['request_limit_per_12h']);
  if (!requestLimit) {
    await query("INSERT INTO settings (key, value) VALUES ('request_limit_per_12h', '2')");
  }

  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_genre TEXT');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP');
  await query("UPDATE users SET status = 'active' WHERE status IS NULL");

  const adminEmail = config.adminEmail;
  const hasAdmin = await get('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (!hasAdmin) {
    const hashedPassword = bcrypt.hashSync(config.adminPassword, 10);
    await query(
      'INSERT INTO users (email, password, role, full_name) VALUES ($1, $2, $3, $4)',
      [adminEmail, hashedPassword, 'admin', 'Admin']
    );
    console.log(`Admin created: ${adminEmail}`);
  }

  await seedRecommendations({ get, run });
}

module.exports = { initDb, query, get, all, run };
