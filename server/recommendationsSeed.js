const ACTION_RECOMMENDATIONS = [
  { title: 'Raid Redemption', type: 'Movie' },
  { title: 'Oldboy', type: 'Movie' },
  { title: 'Marco', type: 'Movie' },
  { title: 'HIT - The Third Case', type: 'Movie' },
  { title: 'Dhurandhar', type: 'Movie' },
  { title: 'War', type: 'Movie' },
  { title: 'Fight Club', type: 'Movie' },
  { title: 'Rocky Handsome', type: 'Movie' },
  { title: 'Tenet', type: 'Movie' },
  { title: 'Extraction', type: 'Movie' },
  { title: 'Banshee', type: 'Series' },
  { title: 'Paatal Lok', type: 'Series' },
  { title: 'The Terminal List', type: 'Series' },
  { title: 'Spartacus', type: 'Series' },
  { title: 'Rana Naidu', type: 'Series' },
];

const GENRE_RECOMMENDATIONS = [
  { genre: 'Action', items: ACTION_RECOMMENDATIONS },
];

async function seedRecommendations(db) {
  for (const group of GENRE_RECOMMENDATIONS) {
    for (const item of group.items) {
      const existing = await db.get(
        'SELECT id FROM content WHERE title = $1 AND category = $2',
        [item.title, group.genre]
      );
      if (existing) continue;
      await db.run(
        'INSERT INTO content (title, description, category) VALUES ($1, $2, $3)',
        [item.title, item.type, group.genre]
      );
    }
  }
}

module.exports = { seedRecommendations, GENRE_RECOMMENDATIONS };
