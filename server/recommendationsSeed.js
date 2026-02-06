const ACTION_RECOMMENDATIONS = [
  { title: 'Raid Redemption', kind: 'Movie' },
  { title: 'Oldboy', kind: 'Movie' },
  { title: 'Marco', kind: 'Movie' },
  { title: 'HIT-The third case', kind: 'Movie' },
  { title: 'Dhurandhar', kind: 'Movie' },
  { title: 'WAR', kind: 'Movie' },
  { title: 'Fight club', kind: 'Movie' },
  { title: 'Rocky Handsome', kind: 'Movie' },
  { title: 'Tenet', kind: 'Movie' },
  { title: 'Extraction', kind: 'Movie' },
  { title: 'Banshee', kind: 'Series' },
  { title: 'Paatal lok', kind: 'Series' },
  { title: 'The Terminal List', kind: 'Series' },
  { title: 'Spartacus', kind: 'Series' },
  { title: 'Rana Raidu', kind: 'Series' },
];

const GENRE_RECOMMENDATIONS = [
  { genre: 'Action', items: ACTION_RECOMMENDATIONS },
];

async function seedRecommendations(db) {
  for (const group of GENRE_RECOMMENDATIONS) {
    for (const item of group.items) {
      await db.run(
        `INSERT INTO weekly_recommendations (genre, title, kind)
         VALUES ($1, $2, $3)
         ON CONFLICT (genre, title, kind) DO NOTHING`,
        [group.genre, item.title, item.kind]
      );
    }
  }
}

module.exports = { seedRecommendations, GENRE_RECOMMENDATIONS };
