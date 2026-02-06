const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const ACTION_POSTERS = {
  'movie|raidredemption': 'posters/action/raid-redemption.jpg',
  'movie|oldboy': 'posters/action/oldboy.jpg',
  'movie|marco': 'posters/action/marco.jpg',
  'movie|hitthethirdcase': 'posters/action/hit-the-third-case.jpg',
  'movie|dhurandhar': 'posters/action/dhurandhar.jpg',
  'movie|war': 'posters/action/war.jpg',
  'movie|fightclub': 'posters/action/fight-club.jpg',
  'movie|rockyhandsome': 'posters/action/rocky-handsome.jpg',
  'movie|tenet': 'posters/action/tenet.jpg',
  'movie|extraction': 'posters/action/extraction.jpg',
  'series|banshee': 'posters/action/banshee.jpg',
  'series|paatallok': 'posters/action/paatal-lok.jpg',
  'series|theterminallist': 'posters/action/the-terminal-list.jpg',
  'series|spartacus': 'posters/action/spartacus.jpg',
  'series|rananaidu': 'posters/action/rana-naidu.jpg',
  'series|ranaraidu': 'posters/action/rana-naidu.jpg',
};

async function getActiveSubscription(userId) {
  const sub = await db.get(
    `
    SELECT * FROM subscriptions 
    WHERE user_id = $1 AND is_active = 1 AND expiry_date >= CURRENT_DATE
    ORDER BY expiry_date DESC LIMIT 1
  `,
    [userId]
  );
  return sub;
}

function daysRemaining(expiryDate) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = expiry - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

router.get('/dashboard', authMiddleware, async (req, res) => {
  const profile = await db.get(
    'SELECT full_name, telegram_username, favorite_genre FROM users WHERE id = $1',
    [req.user.id]
  );
  const approved = await db.get(
    "SELECT COUNT(*) as count FROM movie_requests WHERE user_id = $1 AND status = 'approved'",
    [req.user.id]
  );
  const denied = await db.get(
    "SELECT COUNT(*) as count FROM movie_requests WHERE user_id = $1 AND status = 'denied'",
    [req.user.id]
  );
  const sub = await getActiveSubscription(req.user.id);
  if (!sub) {
    return res.json({
      hasSubscription: false,
      plan: null,
      startDate: null,
      expiryDate: null,
      remainingDays: 0,
      fullName: profile?.full_name || null,
      telegramUsername: profile?.telegram_username || null,
      favoriteGenre: profile?.favorite_genre || null,
      approvedRequests: Number(approved?.count || 0),
      deniedRequests: Number(denied?.count || 0),
    });
  }
  res.json({
    hasSubscription: true,
    plan: sub.plan,
    startDate: sub.start_date,
    expiryDate: sub.expiry_date,
    remainingDays: daysRemaining(sub.expiry_date),
    fullName: profile?.full_name || null,
    telegramUsername: profile?.telegram_username || null,
    favoriteGenre: profile?.favorite_genre || null,
    approvedRequests: Number(approved?.count || 0),
    deniedRequests: Number(denied?.count || 0),
  });
});

router.put('/favorite-genre', authMiddleware, async (req, res) => {
  const { genre } = req.body || {};
  const value = (genre || '').trim();
  if (!value) return res.status(400).json({ error: 'Genre required' });
  await db.run('UPDATE users SET favorite_genre = $1 WHERE id = $2', [value, req.user.id]);
  res.json({ ok: true, favoriteGenre: value });
});

router.post('/request-delete', authMiddleware, async (req, res) => {
  const user = await db.get('SELECT id, email FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await db.run('UPDATE users SET status = $1 WHERE id = $2', ['pending_delete', user.id]);
  await db.run('DELETE FROM account_deletion_requests WHERE user_id = $1 AND status = $2', [user.id, 'pending']);
  await db.run(
    'INSERT INTO account_deletion_requests (user_id, email, status) VALUES ($1, $2, $3)',
    [user.id, user.email, 'pending']
  );
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/recommendations', authMiddleware, async (req, res) => {
  const profile = await db.get('SELECT favorite_genre FROM users WHERE id = $1', [req.user.id]);
  const genre = profile?.favorite_genre;
  if (!genre) return res.json({ genre: null, content: [] });
  const rows = await db.all(
    `
    SELECT r.id, r.title, r.kind, r.poster_path, r.created_at,
           rl.id as like_id
    FROM weekly_recommendations r
    LEFT JOIN weekly_recommendation_likes rl ON rl.recommendation_id = r.id AND rl.user_id = $2
    WHERE LOWER(r.genre) = LOWER($1)
    ORDER BY r.created_at DESC
  `,
    [genre, req.user.id]
  );
  const deduped = new Map();
  for (const row of rows) {
    const kindKey = String(row.kind || '').trim().toLowerCase();
    const key = `${kindKey}|${normalizeTitle(row.title)}`;
    const mappedPoster = ACTION_POSTERS[key];
    if ((!row.poster_path || row.poster_path !== mappedPoster) && mappedPoster) {
      row.poster_path = mappedPoster;
      await db.run('UPDATE weekly_recommendations SET poster_path = $1 WHERE id = $2', [
        mappedPoster,
        row.id,
      ]);
    }

    if (!deduped.has(key)) {
      deduped.set(key, row);
      continue;
    }
    const existing = deduped.get(key);
    if (!existing.poster_path && row.poster_path) {
      deduped.set(key, row);
    }
  }
  const content = Array.from(deduped.values()).map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    thumbnail_path: r.poster_path,
    created_at: r.created_at,
    liked: !!r.like_id,
  }));
  res.json({ genre, content });
});

router.post('/recommendations/:id/like', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const exists = await db.get('SELECT id FROM weekly_recommendations WHERE id = $1', [id]);
  if (!exists) return res.status(404).json({ error: 'Content not found' });
  try {
    await db.run(
      'INSERT INTO weekly_recommendation_likes (user_id, recommendation_id) VALUES ($1, $2)',
      [req.user.id, id]
    );
  } catch (e) {
    // ignore duplicate
  }
  res.json({ ok: true });
});

router.delete('/recommendations/:id/like', authMiddleware, async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM weekly_recommendation_likes WHERE user_id = $1 AND recommendation_id = $2', [req.user.id, id]);
  res.json({ ok: true });
});

router.get('/watchlist', authMiddleware, async (req, res) => {
  const rows = await db.all(`
    SELECT c.*
    FROM watchlist w
    JOIN content c ON c.id = w.content_id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC
  `, [req.user.id]);
  res.json({ content: rows });
});

router.post('/watchlist', authMiddleware, async (req, res) => {
  const { contentId } = req.body || {};
  if (!contentId) return res.status(400).json({ error: 'contentId required' });
  const exists = await db.get('SELECT id FROM content WHERE id = $1', [contentId]);
  if (!exists) return res.status(404).json({ error: 'Content not found' });
  try {
    await db.run('INSERT INTO watchlist (user_id, content_id) VALUES ($1, $2)', [req.user.id, contentId]);
  } catch (e) {
    // ignore duplicate
  }
  res.json({ ok: true });
});

router.delete('/watchlist/:contentId', authMiddleware, async (req, res) => {
  await db.run('DELETE FROM watchlist WHERE user_id = $1 AND content_id = $2', [req.user.id, req.params.contentId]);
  res.json({ ok: true });
});

module.exports = router;
