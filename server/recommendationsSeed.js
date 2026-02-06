const ACTION_RECOMMENDATIONS = [
  { title: 'Raid Redemption', kind: 'Movie', posterPath: 'posters/action/raid-redemption.jpg' },
  { title: 'Oldboy', kind: 'Movie', posterPath: 'posters/action/oldboy.jpg' },
  { title: 'Marco', kind: 'Movie', posterPath: 'posters/action/marco.jpg' },
  { title: 'Dhurandhar', kind: 'Movie', posterPath: 'posters/action/dhurandhar.jpg' },
  { title: 'WAR', kind: 'Movie', posterPath: 'posters/action/war.jpg' },
  { title: 'Fight club', kind: 'Movie', posterPath: 'posters/action/fight-club.jpg' },
  { title: 'Rocky Handsome', kind: 'Movie', posterPath: 'posters/action/rocky-handsome.jpg' },
  { title: 'Tenet', kind: 'Movie', posterPath: 'posters/action/tenet.jpg' },
  { title: 'Extraction', kind: 'Movie', posterPath: 'posters/action/extraction.jpg' },
  { title: 'Banshee', kind: 'Series', posterPath: 'posters/action/banshee.jpg' },
  { title: 'Paatal lok', kind: 'Series', posterPath: 'posters/action/paatal-lok.jpg' },
  { title: 'The Terminal List', kind: 'Series', posterPath: 'posters/action/the-terminal-list.jpg' },
  { title: 'Spartacus', kind: 'Series', posterPath: 'posters/action/spartacus.jpg' },
];

const GENRE_RECOMMENDATIONS = [
  { genre: 'Action', items: ACTION_RECOMMENDATIONS },
];

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

async function seedRecommendations(db) {
  for (const group of GENRE_RECOMMENDATIONS) {
    for (const item of group.items) {
      try {
        await db.run(
          `INSERT INTO weekly_recommendations (genre, title, kind, poster_path)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (genre, title, kind)
           DO UPDATE SET poster_path = EXCLUDED.poster_path`,
          [group.genre, item.title, item.kind, item.posterPath || null]
        );
      } catch (error) {
        if (error?.code !== '23505') {
          throw error;
        }
      }
    }

    const canonical = new Map();
    for (const item of group.items) {
      const key = `${item.kind}|${normalizeTitle(item.title)}`;
      canonical.set(key, item);
    }

    const existing = await db.all(
      'SELECT id, title, kind, poster_path FROM weekly_recommendations WHERE LOWER(genre) = LOWER($1)',
      [group.genre]
    );

    const seen = new Set();
    for (const row of existing) {
      const key = `${row.kind}|${normalizeTitle(row.title)}`;
      const match = canonical.get(key);

      if (!match) {
        await db.run('DELETE FROM weekly_recommendations WHERE id = $1', [row.id]);
        continue;
      }

      if (seen.has(key)) {
        await db.run('DELETE FROM weekly_recommendations WHERE id = $1', [row.id]);
        continue;
      }

      seen.add(key);
      const desiredPoster = match.posterPath || null;
      if (row.title !== match.title || row.poster_path !== desiredPoster) {
        await db.run(
          'UPDATE weekly_recommendations SET title = $1, poster_path = $2 WHERE id = $3',
          [match.title, desiredPoster, row.id]
        );
      }
    }
  }
}

module.exports = { seedRecommendations, GENRE_RECOMMENDATIONS };
