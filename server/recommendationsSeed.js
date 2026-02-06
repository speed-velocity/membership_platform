const ACTION_RECOMMENDATIONS = [
  { title: 'Raid Redemption', kind: 'Movie' },
  { title: 'Oldboy', kind: 'Movie' },
  { title: 'Marco', kind: 'Movie' },
  { title: 'HIT - The Third Case', kind: 'Movie' },
  { title: 'Dhurandhar', kind: 'Movie' },
  { title: 'War', kind: 'Movie' },
  { title: 'Fight Club', kind: 'Movie' },
  { title: 'Rocky Handsome', kind: 'Movie' },
  { title: 'Tenet', kind: 'Movie' },
  { title: 'Extraction', kind: 'Movie' },
  { title: 'Banshee', kind: 'Series' },
  { title: 'Paatal Lok', kind: 'Series' },
  { title: 'The Terminal List', kind: 'Series' },
  { title: 'Spartacus', kind: 'Series' },
  { title: 'Rana Naidu', kind: 'Series' },
];

const GENRE_RECOMMENDATIONS = [
  { genre: 'Action', items: ACTION_RECOMMENDATIONS },
];

async function seedRecommendations(db) {
  for (const group of GENRE_RECOMMENDATIONS) {
    for (const item of group.items) {
      const existing = await db.get(
        'SELECT id FROM weekly_recommendations WHERE genre = $1 AND title = $2 AND kind = $3',
        [group.genre, item.title, item.kind]
      );
      if (existing) continue;
      await db.run(
        'INSERT INTO weekly_recommendations (genre, title, kind) VALUES ($1, $2, $3)',
        [group.genre, item.title, item.kind]
      );
    }
  }
}

module.exports = { seedRecommendations, GENRE_RECOMMENDATIONS };
