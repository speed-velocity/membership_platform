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

router.get('/subscriptions', async (req, res) => {
  const rows = await db.all(`
    SELECT s.id, s.plan, s.start_date, s.expiry_date, u.email
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.is_active = 1 AND s.expiry_date >= CURRENT_DATE
    ORDER BY s.expiry_date ASC
  `);
  res.json({ subscriptions: rows });
});

router.get('/users', async (req, res) => {
  const users = await db.all(`
    SELECT
      id,
      email,
      role,
      created_at,
      last_login,
      favorite_genre,
      (SELECT COUNT(*) FROM movie_requests mr WHERE mr.user_id = users.id) AS request_count
    FROM users
    WHERE role = $1
    ORDER BY created_at DESC
  `, ['user']);
  const withSubs = await Promise.all(users.map(async (u) => {
    const sub = await db.get(
      'SELECT plan, start_date, expiry_date, is_active FROM subscriptions WHERE user_id = $1 AND is_active = 1 ORDER BY expiry_date DESC LIMIT 1',
      [u.id]
    );
    return {
      ...u,
      request_count: Number(u.request_count || 0),
      subscription: sub || null,
    };
  }));
  res.json({ users: withSubs });
});

router.post('/subscriptions', async (req, res) => {
  const { userId, plan, months } = req.body;
  if (!userId || !plan || !months) {
    return res.status(400).json({ error: 'userId, plan, and months required' });
  }
  const start = new Date();
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + parseInt(months, 10));
  const startStr = start.toISOString().split('T')[0];
  const expiryStr = expiry.toISOString().split('T')[0];
  await db.run('UPDATE subscriptions SET is_active = 0 WHERE user_id = $1', [userId]);
  await db.run(
    'INSERT INTO subscriptions (user_id, plan, start_date, expiry_date, is_active) VALUES ($1, $2, $3, $4, 1)',
    [userId, plan, startStr, expiryStr]
  );
  const user = await db.get('SELECT email FROM users WHERE id = $1', [userId]);
  const userEmail = user?.email ?? user?.Email;
  if (userEmail) {
    sendEmail(userEmail, 'Subscription Activated', `Your ${plan} subscription is now active.\nStart: ${startStr}\nExpires: ${expiryStr}`);
  }
  res.json({ ok: true, startDate: startStr, expiryDate: expiryStr });
});

router.put('/subscriptions/:userId', async (req, res) => {
  const { userId } = req.params;
  const { expiryDate, isActive } = req.body;
  if (!expiryDate) return res.status(400).json({ error: 'expiryDate required' });
  await db.run(
    'UPDATE subscriptions SET expiry_date = $1, is_active = $2 WHERE user_id = $3 AND is_active = 1',
    [expiryDate, isActive !== false ? 1 : 0, userId]
  );
  res.json({ ok: true });
});

router.get('/content', async (req, res) => {
  const items = await db.all('SELECT * FROM content ORDER BY created_at DESC');
  res.json({ content: items });
});

router.post('/content', async (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Title and category required' });
  const inserted = await db.get(
    'INSERT INTO content (title, description, category) VALUES ($1, $2, $3) RETURNING id',
    [title || '', description || '', category]
  );
  const id = inserted?.id;
  res.json({ id });
});

router.put('/content/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, thumbnail_path, video_1080_path, video_4k_path } = req.body;
  const item = await db.get('SELECT id FROM content WHERE id = $1', [id]);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const updates = [];
  const params = [];
  if (title !== undefined) { params.push(title); updates.push(`title = $${params.length}`); }
  if (description !== undefined) { params.push(description); updates.push(`description = $${params.length}`); }
  if (category !== undefined) { params.push(category); updates.push(`category = $${params.length}`); }
  if (thumbnail_path !== undefined) { params.push(thumbnail_path); updates.push(`thumbnail_path = $${params.length}`); }
  if (video_1080_path !== undefined) { params.push(video_1080_path); updates.push(`video_1080_path = $${params.length}`); }
  if (video_4k_path !== undefined) { params.push(video_4k_path); updates.push(`video_4k_path = $${params.length}`); }
  if (updates.length === 0) return res.json({ ok: true });
  params.push(id);
  await db.run(`UPDATE content SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`, params);
  res.json({ ok: true });
});

router.post('/content/:id/upload', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video1080', maxCount: 1 },
  { name: 'video4k', maxCount: 1 },
]), async (req, res) => {
  const { id } = req.params;
  const item = await db.get('SELECT id FROM content WHERE id = $1', [id]);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const updates = [];
  const params = [];
  if (req.files?.thumbnail?.[0]) {
    params.push('uploads/content/' + req.files.thumbnail[0].filename);
    updates.push(`thumbnail_path = $${params.length}`);
  }
  if (req.files?.video1080?.[0]) {
    params.push('uploads/content/' + req.files.video1080[0].filename);
    updates.push(`video_1080_path = $${params.length}`);
  }
  if (req.files?.video4k?.[0]) {
    params.push('uploads/content/' + req.files.video4k[0].filename);
    updates.push(`video_4k_path = $${params.length}`);
  }
  if (updates.length === 0) return res.json({ ok: true });
  params.push(id);
  await db.run(`UPDATE content SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`, params);
  res.json({ ok: true });
});

router.delete('/content/:id', async (req, res) => {
  await db.run('DELETE FROM content WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.get('/requests', async (req, res) => {
  const rows = await db.all(`
    SELECT mr.id, mr.user_id, mr.title, mr.message, mr.status, mr.created_at, u.email
    FROM movie_requests mr
    JOIN users u ON u.id = mr.user_id
    ORDER BY mr.created_at DESC
  `);
  res.json({ requests: rows });
});

router.get('/logins', async (req, res) => {
  const rows = await db.all(`
    SELECT lh.id, lh.user_id, lh.email, lh.full_name, lh.role, lh.ip, lh.user_agent, lh.created_at
    FROM login_history lh
    ORDER BY lh.created_at DESC
    LIMIT 200
  `);
  res.json({ logins: rows });
});

router.get('/analytics', async (req, res) => {
  const totalUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
  const activeSubs = await db.get(
    "SELECT COUNT(*) as count FROM subscriptions WHERE is_active = 1 AND expiry_date >= CURRENT_DATE"
  );
  const totalRequests = await db.get('SELECT COUNT(*) as count FROM movie_requests');
  const pendingRequests = await db.get("SELECT COUNT(*) as count FROM movie_requests WHERE status = 'pending'");
  const approvedRequests = await db.get("SELECT COUNT(*) as count FROM movie_requests WHERE status = 'approved'");
  const deniedRequests = await db.get("SELECT COUNT(*) as count FROM movie_requests WHERE status = 'denied'");
  const logins7d = await db.get(
    "SELECT COUNT(*) as count FROM login_history WHERE created_at >= NOW() - INTERVAL '7 days'"
  );
  res.json({
    totalUsers: Number(totalUsers?.count || 0),
    activeSubs: Number(activeSubs?.count || 0),
    totalRequests: Number(totalRequests?.count || 0),
    pendingRequests: Number(pendingRequests?.count || 0),
    approvedRequests: Number(approvedRequests?.count || 0),
    deniedRequests: Number(deniedRequests?.count || 0),
    logins7d: Number(logins7d?.count || 0),
  });
});

router.get('/activity', async (req, res) => {
  const rows = await db.all(`
    SELECT 'login' as type, lh.email as email, lh.created_at as created_at,
           lh.ip as meta, lh.user_agent as detail
    FROM login_history lh
    UNION ALL
    SELECT 'request' as type, u.email as email, mr.created_at as created_at,
           mr.status as meta, mr.title as detail
    FROM movie_requests mr
    JOIN users u ON u.id = mr.user_id
    ORDER BY created_at DESC
    LIMIT 200
  `);
  res.json({ activity: rows });
});

router.put('/requests/:id', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  await db.run('UPDATE movie_requests SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ ok: true });
});

router.get('/settings', async (req, res) => {
  const rows = await db.all('SELECT key, value FROM settings');
  const settings = {};
  rows.forEach((r) => { settings[r.key] = r.value; });
  res.json({ settings });
});

router.get('/deletions', async (req, res) => {
  const rows = await db.all(`
    SELECT r.id, r.user_id, r.email, r.status, r.created_at, r.resolved_at, r.action
    FROM account_deletion_requests r
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `);
  res.json({ requests: rows });
});

router.post('/deletions/:id/keep', async (req, res) => {
  const { id } = req.params;
  const reqRow = await db.get('SELECT id, user_id, email FROM account_deletion_requests WHERE id = $1', [id]);
  if (!reqRow) return res.status(404).json({ error: 'Request not found' });
  if (reqRow.user_id) {
    await db.run('UPDATE users SET status = $1, deleted_at = NOW() WHERE id = $2', ['deleted', reqRow.user_id]);
  }
  await db.run(
    "UPDATE account_deletion_requests SET status = 'kept', action = 'keep', resolved_at = NOW() WHERE id = $1",
    [id]
  );
  res.json({ ok: true });
});

router.post('/deletions/:id/remove', async (req, res) => {
  const { id } = req.params;
  const reqRow = await db.get('SELECT id, user_id, email FROM account_deletion_requests WHERE id = $1', [id]);
  if (!reqRow) return res.status(404).json({ error: 'Request not found' });
  if (reqRow.user_id) {
    const uid = reqRow.user_id;
    await db.run('DELETE FROM subscriptions WHERE user_id = $1', [uid]);
    await db.run('DELETE FROM movie_requests WHERE user_id = $1', [uid]);
    await db.run('DELETE FROM login_history WHERE user_id = $1', [uid]);
    await db.run('DELETE FROM password_resets WHERE user_id = $1', [uid]);
    await db.run('DELETE FROM email_otps WHERE user_id = $1', [uid]);
    await db.run('DELETE FROM watchlist WHERE user_id = $1', [uid]);
    await db.run('DELETE FROM users WHERE id = $1', [uid]);
  }
  await db.run(
    "UPDATE account_deletion_requests SET status = 'removed', action = 'remove', resolved_at = NOW() WHERE id = $1",
    [id]
  );
  res.json({ ok: true });
});

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

router.get('/exports/users.csv', async (req, res) => {
  const rows = await db.all(`
    SELECT u.id, u.email, u.full_name, u.telegram_username, u.created_at, u.last_login,
           (SELECT COUNT(*) FROM movie_requests mr WHERE mr.user_id = u.id) AS request_count,
           s.plan, s.start_date, s.expiry_date
    FROM users u
    LEFT JOIN LATERAL (
      SELECT plan, start_date, expiry_date
      FROM subscriptions
      WHERE user_id = u.id AND is_active = 1
      ORDER BY expiry_date DESC
      LIMIT 1
    ) s ON true
    WHERE u.role = 'user'
    ORDER BY u.created_at DESC
  `);

  const header = [
    'id',
    'email',
    'full_name',
    'telegram_username',
    'created_at',
    'last_login',
    'request_count',
    'plan',
    'start_date',
    'expiry_date',
  ];

  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.email,
        r.full_name,
        r.telegram_username,
        r.created_at,
        r.last_login,
        r.request_count,
        r.plan,
        r.start_date,
        r.expiry_date,
      ]
        .map(toCsvValue)
        .join(',')
    ),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="movie-mayhem-users.csv"');
  res.send(lines.join('\n'));
});

router.put('/settings/request-limit', async (req, res) => {
  const { value } = req.body;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > 10) {
    return res.status(400).json({ error: 'Request limit must be between 1 and 10' });
  }
  await db.run(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
    ['request_limit_per_12h', String(num)]
  );
  res.json({ ok: true, value: num });
});

module.exports = router;
