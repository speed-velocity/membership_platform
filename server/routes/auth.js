const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { sendEmail, getTransporter } = require('../emailService');
const config = require('../config');

const router = express.Router();

router.post('/register', async (req, res) => {
  let { email, password, fullName } = req.body;
  email = (email || '').trim().toLowerCase();
  fullName = (fullName || '').trim();
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Name, email and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const hashed = bcrypt.hashSync(password, 10);
    await db.run(
      'INSERT INTO users (email, password, role, full_name) VALUES ($1, $2, $3, $4)',
      [email, hashed, 'user', fullName]
    );
    const user = await db.get('SELECT id, email, role, full_name, favorite_genre FROM users WHERE email = $1', [email]);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    sendEmail(config.notificationEmail, 'New Member Signup', `New user registered: ${email}`);
    res.json({ user: { id: user.id, email: user.email, role: user.role, favoriteGenre: user.favorite_genre || null }, token });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  email = (email || '').trim().toLowerCase();
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = await db.get(
    'SELECT id, email, password, role, full_name, favorite_genre, status FROM users WHERE email = $1',
    [email]
  );
  const pwd = user?.password ?? user?.Password;
  if (!user || !pwd || !bcrypt.compareSync(password, pwd)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (user.status && user.status !== 'active') {
    return res.status(403).json({ error: 'Account pending deletion' });
  }
  await recordLogin(req, user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ user: { id: user.id, email: user.email, role: user.role, favoriteGenre: user.favorite_genre || null }, token });
});

router.post('/admin-login', async (req, res) => {
  let { email, password } = req.body;
  email = (email || '').trim().toLowerCase();
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = await db.get(
    'SELECT id, email, password, role, full_name, favorite_genre, status FROM users WHERE email = $1',
    [email]
  );
  const pwd = user?.password ?? user?.Password;
  if (!user || !pwd || !bcrypt.compareSync(password, pwd)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const role = user.role ?? user.Role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  if (user.status && user.status !== 'active') {
    return res.status(403).json({ error: 'Account pending deletion' });
  }
  await recordLogin(req, user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ user: { id: user.id, email: user.email, role: user.role, favoriteGenre: user.favorite_genre || null }, token });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.post('/forgot-password', async (req, res) => {
  let { email } = req.body || {};
  email = (email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = await db.get('SELECT id, email FROM users WHERE email = $1', [email]);
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    await db.run('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
    await db.run(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );
    const resetLink = `${config.appUrl}/reset-password?token=${token}`;
    const sent = await sendEmail(
      user.email,
      'Reset your password',
      `Click to reset your password: ${resetLink}\nThis link expires in 1 hour.`,
      `Click to reset your password: ${resetLink}<br>This link expires in 1 hour.`
    );
    if (config.showResetLink) {
      return res.json({ ok: true, resetLink, sent });
    }
  }
  // Always respond ok to avoid user enumeration
  res.json({ ok: true });
});

// Insecure direct reset (no email). Use only if you accept the risk.
router.post('/direct-reset', async (req, res) => {
  let { email, password, confirmPassword } = req.body || {};
  email = (email || '').trim().toLowerCase();
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email and passwords required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const user = await db.get('SELECT id FROM users WHERE email = $1', [email]);
  if (user) {
    const hashed = bcrypt.hashSync(password, 10);
    await db.run('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
  }
  // Always respond ok to avoid user enumeration
  res.json({ ok: true });
});

router.post('/request-otp', async (req, res) => {
  let { email } = req.body || {};
  email = (email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = await db.get('SELECT id, email, role, full_name FROM users WHERE email = $1', [email]);
  if (user) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 5).toISOString();
    await db.run('DELETE FROM email_otps WHERE user_id = $1', [user.id]);
    await db.run(
      'INSERT INTO email_otps (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, otpHash, expiresAt]
    );
    const hasSmtp = !!getTransporter();
    const sent = await sendEmail(
      user.email,
      'Your login code',
      `Your one-time login code is: ${otp}\nThis code expires in 5 minutes.`,
      `Your one-time login code is: <b>${otp}</b><br>This code expires in 5 minutes.`
    );
    if (config.showOtp || !hasSmtp) {
      return res.json({ ok: true, otp, sent: !!sent });
    }
  }
  res.json({ ok: true });
});

router.post('/verify-otp', async (req, res) => {
  let { email, otp } = req.body || {};
  email = (email || '').trim().toLowerCase();
  otp = (otp || '').trim();
  if (!email || !otp) return res.status(400).json({ error: 'Email and code required' });
  const user = await db.get('SELECT id, email, role, full_name FROM users WHERE email = $1', [email]);
  if (!user) return res.status(400).json({ error: 'Invalid code' });
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const row = await db.get(`
    SELECT id FROM email_otps
    WHERE user_id = $1 AND otp_hash = $2 AND used = 0 AND expires_at > NOW()
    ORDER BY id DESC LIMIT 1
  `, [user.id, otpHash]);
  if (!row) return res.status(400).json({ error: 'Invalid or expired code' });
  await db.run('UPDATE email_otps SET used = 1 WHERE id = $1', [row.id]);
  await recordLogin(req, user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const reset = await db.get(`
    SELECT id, user_id FROM password_resets
    WHERE token_hash = $1 AND used = 0 AND expires_at > NOW()
    ORDER BY id DESC LIMIT 1
  `, [tokenHash]);
  if (!reset) return res.status(400).json({ error: 'Invalid or expired token' });
  const hashed = bcrypt.hashSync(password, 10);
  await db.run('UPDATE users SET password = $1 WHERE id = $2', [hashed, reset.user_id]);
  await db.run('UPDATE password_resets SET used = 1 WHERE id = $1', [reset.id]);
  res.json({ ok: true });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    user: {
      ...user,
      favoriteGenre: user.favorite_genre || null,
    },
  });
});

module.exports = router;
async function recordLogin(req, user) {
  await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
  await db.run(
    'INSERT INTO login_history (user_id, email, full_name, role, ip, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
    [
      user.id,
      user.email,
      user.full_name ?? null,
      user.role,
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
      req.headers['user-agent'] || '',
    ]
  );
}
