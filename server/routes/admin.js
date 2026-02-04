const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { sendEmail } = require('../emailService');
const config = require('../config');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'content');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + (file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_')),
});
const upload = multer({ storage });

router.use(authMiddleware);
router.use(adminOnly);

router.get('/subscriptions', (req, res) => {
  const rows = db.prepare(`
    SELECT s.id, s.plan, s.start_date, s.expiry_date, u.email
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.is_active = 1 AND s.expiry_date >= date('now')
    ORDER BY s.expiry_date ASC
  `).all();
  res.json({ subscriptions: rows });
});

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT
      id,
      email,
      role,
      created_at,
      last_login,
      (SELECT COUNT(*) FROM movie_requests mr WHERE mr.user_id = users.id) AS request_count
    FROM users
    WHERE role = ?
    ORDER BY created_at DESC
  `).all('user');
  const withSubs = users.map((u) => {
    const sub = db.prepare(
      'SELECT plan, start_date, expiry_date, is_active FROM subscriptions WHERE user_id = ? AND is_active = 1 ORDER BY expiry_date DESC LIMIT 1'
    ).get(u.id);
    return {
      ...u,
      subscription: sub || null,
    };
  });
  res.json({ users: withSubs });
});

router.post('/subscriptions', (req, res) => {
  const { userId, plan, months } = req.body;
  if (!userId || !plan || !months) {
    return res.status(400).json({ error: 'userId, plan, and months required' });
  }
  const start = new Date();
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + parseInt(months, 10));
  const startStr = start.toISOString().split('T')[0];
  const expiryStr = expiry.toISOString().split('T')[0];
  db.prepare('UPDATE subscriptions SET is_active = 0 WHERE user_id = ?').run(userId);
  db.prepare(
    'INSERT INTO subscriptions (user_id, plan, start_date, expiry_date, is_active) VALUES (?, ?, ?, ?, 1)'
  ).run(userId, plan, startStr, expiryStr);
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
  const userEmail = user?.email ?? user?.Email;
  if (userEmail) {
    sendEmail(userEmail, 'Subscription Activated', `Your ${plan} subscription is now active.\nStart: ${startStr}\nExpires: ${expiryStr}`);
  }
  res.json({ ok: true, startDate: startStr, expiryDate: expiryStr });
});

router.put('/subscriptions/:userId', (req, res) => {
  const { userId } = req.params;
  const { expiryDate, isActive } = req.body;
  if (!expiryDate) return res.status(400).json({ error: 'expiryDate required' });
  db.prepare('UPDATE subscriptions SET expiry_date = ?, is_active = ? WHERE user_id = ? AND is_active = 1').run(
    expiryDate,
    isActive !== false ? 1 : 0,
    userId
  );
  res.json({ ok: true });
});

router.get('/content', (req, res) => {
  const items = db.prepare('SELECT * FROM content ORDER BY created_at DESC').all();
  res.json({ content: items });
});

router.post('/content', (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Title and category required' });
  db.prepare('INSERT INTO content (title, description, category) VALUES (?, ?, ?)').run(
    title || '',
    description || '',
    category
  );
  const id = db.prepare('SELECT last_insert_rowid() as id').get().id;
  res.json({ id });
});

router.put('/content/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, category, thumbnail_path, video_1080_path, video_4k_path } = req.body;
  const item = db.prepare('SELECT id FROM content WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const updates = [];
  const params = [];
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (thumbnail_path !== undefined) { updates.push('thumbnail_path = ?'); params.push(thumbnail_path); }
  if (video_1080_path !== undefined) { updates.push('video_1080_path = ?'); params.push(video_1080_path); }
  if (video_4k_path !== undefined) { updates.push('video_4k_path = ?'); params.push(video_4k_path); }
  if (updates.length === 0) return res.json({ ok: true });
  params.push(id);
  db.prepare(`UPDATE content SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.post('/content/:id/upload', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video1080', maxCount: 1 },
  { name: 'video4k', maxCount: 1 },
]), (req, res) => {
  const { id } = req.params;
  const item = db.prepare('SELECT id FROM content WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const updates = [];
  const params = [];
  if (req.files?.thumbnail?.[0]) {
    updates.push('thumbnail_path = ?');
    params.push('uploads/content/' + req.files.thumbnail[0].filename);
  }
  if (req.files?.video1080?.[0]) {
    updates.push('video_1080_path = ?');
    params.push('uploads/content/' + req.files.video1080[0].filename);
  }
  if (req.files?.video4k?.[0]) {
    updates.push('video_4k_path = ?');
    params.push('uploads/content/' + req.files.video4k[0].filename);
  }
  if (updates.length === 0) return res.json({ ok: true });
  params.push(id);
  db.prepare(`UPDATE content SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.delete('/content/:id', (req, res) => {
  db.prepare('DELETE FROM content WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/requests', (req, res) => {
  const rows = db.prepare(`
    SELECT mr.id, mr.user_id, mr.title, mr.message, mr.status, mr.created_at, u.email
    FROM movie_requests mr
    JOIN users u ON u.id = mr.user_id
    ORDER BY mr.created_at DESC
  `).all();
  res.json({ requests: rows });
});

router.get('/logins', (req, res) => {
  const rows = db.prepare(`
    SELECT lh.id, lh.user_id, lh.email, lh.full_name, lh.role, lh.ip, lh.user_agent, lh.created_at
    FROM login_history lh
    ORDER BY lh.created_at DESC
    LIMIT 200
  `).all();
  res.json({ logins: rows });
});

router.put('/requests/:id', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  db.prepare('UPDATE movie_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach((r) => { settings[r.key] = r.value; });
  res.json({ settings });
});

router.put('/settings/request-limit', (req, res) => {
  const { value } = req.body;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > 10) {
    return res.status(400).json({ error: 'Request limit must be between 1 and 10' });
  }
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('request_limit_per_12h', String(num));
  res.json({ ok: true, value: num });
});

module.exports = router;
