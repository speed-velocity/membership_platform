const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'content');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + (file.originalname || 'video')),
});
const upload = multer({ storage });

async function getActiveSubscription(userId) {
  return db.get(
    `
    SELECT id FROM subscriptions 
    WHERE user_id = $1 AND is_active = 1 AND expiry_date >= CURRENT_DATE
    LIMIT 1
  `,
    [userId]
  );
}

router.get('/', authMiddleware, async (req, res) => {
  const hasSub = await getActiveSubscription(req.user.id);
  const category = req.query.category;
  let sql = `
    SELECT c.*, w.id as watch_id
    FROM content c
    LEFT JOIN watchlist w ON w.content_id = c.id AND w.user_id = $1
    WHERE 1=1
  `;
  const params = [req.user.id];
  if (category) {
    sql += ' AND c.category = $2';
    params.push(category);
  }
  sql += ' ORDER BY c.created_at DESC';
  const items = await db.all(sql, params);
  const withAccess = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    thumbnail_path: item.thumbnail_path,
    created_at: item.created_at,
    canAccess: !!hasSub,
    isFavorite: !!item.watch_id,
    video_1080_path: hasSub ? item.video_1080_path : null,
    video_4k_path: hasSub ? item.video_4k_path : null,
  }));
  res.json({ content: withAccess });
});

router.get('/categories', async (req, res) => {
  const rows = await db.all('SELECT DISTINCT category FROM content ORDER BY category');
  res.json({ categories: rows.map((r) => r.category) });
});

router.get('/:id/stream', authMiddleware, async (req, res) => {
  const hasSub = await getActiveSubscription(req.user.id);
  if (!hasSub) {
    return res.status(403).json({ error: 'Active subscription required' });
  }
  const quality = req.query.quality || '1080p';
  const item = await db.get('SELECT * FROM content WHERE id = $1', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const videoPath = quality === '4k' ? item.video_4k_path : item.video_1080_path;
  if (!videoPath) return res.status(404).json({ error: 'Quality not available' });
  const fullPath = path.resolve(__dirname, '..', '..', videoPath);
  res.sendFile(fullPath, (err) => {
    if (err) res.status(404).json({ error: 'File not found' });
  });
});

router.get('/:id', authMiddleware, async (req, res) => {
  const hasSub = await getActiveSubscription(req.user.id);
  const item = await db.get('SELECT * FROM content WHERE id = $1', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const response = {
    ...item,
    canAccess: !!hasSub,
    video_1080_path: hasSub ? item.video_1080_path : null,
    video_4k_path: hasSub ? item.video_4k_path : null,
  };
  res.json(response);
});

module.exports = router;
