const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { sendEmail } = require('../emailService');
const config = require('../config');

const router = express.Router();

router.post('/register', (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Name, email and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)').run(
      email,
      hashed,
      'user',
      fullName
    );
    const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE email = ?').get(email);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    sendEmail(config.notificationEmail, 'New Member Signup', `New user registered: ${email}`);
    res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = db.prepare('SELECT id, email, password, role, full_name FROM users WHERE email = ?').get(email);
  const pwd = user?.password ?? user?.Password;
  if (!user || !pwd || !bcrypt.compareSync(password, pwd)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  db.prepare(
    'INSERT INTO login_history (user_id, email, full_name, role, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    user.id,
    user.email,
    user.full_name ?? user.fullName ?? null,
    user.role,
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
    req.headers['user-agent'] || ''
  );
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
});

router.post('/admin-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = db.prepare('SELECT id, email, password, role, full_name FROM users WHERE email = ?').get(email);
  const pwd = user?.password ?? user?.Password;
  if (!user || !pwd || !bcrypt.compareSync(password, pwd)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const role = user.role ?? user.Role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  db.prepare(
    'INSERT INTO login_history (user_id, email, full_name, role, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    user.id,
    user.email,
    user.full_name ?? user.fullName ?? null,
    user.role,
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
    req.headers['user-agent'] || ''
  );
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
