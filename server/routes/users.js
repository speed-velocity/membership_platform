const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const POSTER_MAP = {
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
  'movie|aedilhaimushkil': 'posters/romance/ae-dil-hai-mushkil.jpg',
  'movie|jabwemet': 'posters/romance/jab-we-met.jpg',
  'movie|tamasha': 'posters/romance/tamasha.jpg',
  'movie|kalhonaaho': 'posters/romance/kal-ho-naa-ho.jpg',
  'movie|shiddat': 'posters/romance/shiddat.jpg',
  'movie|raanjhanaa': 'posters/romance/raanjhanaa.jpg',
  'movie|thenotebook': 'posters/romance/the-notebook.jpg',
  'movie|lalaland': 'posters/romance/la-la-land.jpg',
  'movie|titanic': 'posters/romance/titanic.jpg',
  'movie|aashiqui2': 'posters/romance/aashiqui-2.jpg',
  'series|modernlove': 'posters/romance/modern-love.jpg',
  'series|feelslikeishq': 'posters/romance/feels-like-ishq.jpg',
  'series|onedayseries': 'posters/romance/one-day-series.jpg',
  'series|littlethings': 'posters/romance/little-things.jpg',
  'series|brokenbutbeautiful': 'posters/romance/broken-but-beautiful.jpg',
  'movie|se7en': 'posters/thriller/se7en.jpg',
  'movie|gonegirl': 'posters/thriller/gone-girl.jpg',
  'movie|shutterisland': 'posters/thriller/shutter-island.jpg',
  'movie|thesilenceofthelambs': 'posters/thriller/silence-of-the-lambs.jpg',
  'movie|prisoners': 'posters/thriller/prisoners.jpg',
  'movie|andhadhun': 'posters/thriller/andhadhun.jpg',
  'movie|drishyam': 'posters/thriller/drishyam.jpg',
  'movie|badla': 'posters/thriller/badla.jpg',
  'movie|kahaani': 'posters/thriller/kahaani.jpg',
  'movie|ramanraghav20': 'posters/thriller/raman-raghav-20.jpg',
  'series|mindhunter': 'posters/thriller/mindhunter.jpg',
  'series|1000babies': 'posters/thriller/1000-babies.jpg',
  'series|breakingbad': 'posters/thriller/breaking-bad.jpg',
  'series|sacredgames': 'posters/thriller/sacred-games.jpg',
  'series|asur': 'posters/thriller/asur.jpg',
  'movie|thehangover': 'posters/comedy/the-hangover.jpg',
  'movie|superbad': 'posters/comedy/superbad.jpg',
  'movie|21jumpstreet': 'posters/comedy/21-jump-street.jpg',
  'movie|werethemillers': 'posters/comedy/were-the-millers.jpg',
  'movie|deadpool': 'posters/comedy/deadpool.jpg',
  'movie|herapheri': 'posters/comedy/hera-pheri.jpg',
  'movie|phirherapheri': 'posters/comedy/phir-hera-pheri.jpg',
  'movie|dhamaal': 'posters/comedy/dhamaal.jpg',
  'movie|golmaal': 'posters/comedy/golmaal.jpg',
  'movie|chupchupke': 'posters/comedy/chup-chup-ke.jpg',
  'series|friends': 'posters/comedy/friends.jpg',
  'series|theofficeus': 'posters/comedy/the-office-us.jpg',
  'series|brooklynninenine': 'posters/comedy/brooklyn-nine-nine.jpg',
  'series|panchayat': 'posters/comedy/panchayat.jpg',
  'series|tvfpitchers': 'posters/comedy/tvf-pitchers.jpg',
  'movie|theconjuring': 'posters/horror/the-conjuring.jpg',
  'movie|insidious': 'posters/horror/insidious.jpg',
  'movie|sinister': 'posters/horror/sinister.jpg',
  'movie|hereditary': 'posters/horror/hereditary.jpg',
  'movie|it': 'posters/horror/it.jpg',
  'movie|tumbbad': 'posters/horror/tumbbad.jpg',
  'movie|stree': 'posters/horror/stree.jpg',
  'movie|1920': 'posters/horror/1920.jpg',
  'movie|bhoot': 'posters/horror/bhoot.jpg',
  'movie|pari': 'posters/horror/pari.jpg',
  'series|thehauntingofhillhouse': 'posters/horror/haunting-of-hill-house.jpg',
  'series|thehauntingofblymanor': 'posters/horror/haunting-of-bly-manor.jpg',
  'series|americanhorrorstory': 'posters/horror/american-horror-story.jpg',
  'series|ghoul': 'posters/horror/ghoul.jpg',
  'series|typewriter': 'posters/horror/typewriter.jpg',
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

router.get('/about', authMiddleware, async (req, res) => {
  const row = await db.get('SELECT value FROM settings WHERE key = $1', ['about_content']);
  res.json({ content: row?.value || '' });
});

router.post('/reset-genre', authMiddleware, async (req, res) => {
  await db.run('UPDATE users SET favorite_genre = NULL WHERE id = $1', [req.user.id]);
  res.json({ ok: true, favoriteGenre: null });
});

router.get('/wishlist', authMiddleware, async (req, res) => {
  const row = await db.get('SELECT wishlist_titles FROM users WHERE id = $1', [req.user.id]);
  const titles = Array.isArray(row?.wishlist_titles) ? row.wishlist_titles : [];
  res.json({ titles });
});

router.put('/wishlist', authMiddleware, async (req, res) => {
  const { titles } = req.body || {};
  if (!Array.isArray(titles)) {
    return res.status(400).json({ error: 'titles array required' });
  }
  const cleaned = titles.map((title) => (title || '').trim()).slice(0, 5);
  while (cleaned.length < 5) cleaned.push('');
  await db.run('UPDATE users SET wishlist_titles = $1 WHERE id = $2', [cleaned, req.user.id]);
  res.json({ ok: true, titles: cleaned });
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
    SELECT DISTINCT ON (lower(trim(r.kind)), regexp_replace(lower(r.title), '[^a-z0-9]+', '', 'g'))
           r.id, r.title, r.kind, r.poster_path, r.created_at,
           rl.id as like_id
    FROM weekly_recommendations r
    LEFT JOIN weekly_recommendation_likes rl ON rl.recommendation_id = r.id AND rl.user_id = $2
    WHERE LOWER(r.genre) = LOWER($1)
    ORDER BY lower(trim(r.kind)),
             regexp_replace(lower(r.title), '[^a-z0-9]+', '', 'g'),
             (r.poster_path IS NOT NULL) DESC,
             r.created_at DESC,
             r.id DESC
  `,
    [genre, req.user.id]
  );
  for (const row of rows) {
    const kindKey = String(row.kind || '').trim().toLowerCase();
    const key = `${kindKey}|${normalizeTitle(row.title)}`;
    const mappedPoster = POSTER_MAP[key];
    if ((!row.poster_path || row.poster_path !== mappedPoster) && mappedPoster) {
      row.poster_path = mappedPoster;
      await db.run('UPDATE weekly_recommendations SET poster_path = $1 WHERE id = $2', [
        mappedPoster,
        row.id,
      ]);
    }
  }
  const content = rows.map((r) => ({
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
