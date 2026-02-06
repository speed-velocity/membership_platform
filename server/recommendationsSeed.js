const ACTION_RECOMMENDATIONS = [
  { title: 'Raid Redemption', kind: 'Movie', posterPath: 'posters/action/raid-redemption.jpg' },
  { title: 'Oldboy', kind: 'Movie', posterPath: 'posters/action/oldboy.jpg' },
  { title: 'Marco', kind: 'Movie', posterPath: 'posters/action/marco.jpg' },
  { title: 'HIT-The third case', kind: 'Movie', posterPath: 'posters/action/hit-the-third-case.jpg' },
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
  { title: 'Rana Raidu', kind: 'Series', posterPath: 'posters/action/rana-raidu.jpg' },
];

const GENRE_RECOMMENDATIONS = [
  { genre: 'Action', items: ACTION_RECOMMENDATIONS },
];

async function seedRecommendations(db) {
  for (const group of GENRE_RECOMMENDATIONS) {
    for (const item of group.items) {
      await db.run(
        `INSERT INTO weekly_recommendations (genre, title, kind, poster_path)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (genre, title, kind)
         DO UPDATE SET poster_path = EXCLUDED.poster_path`,
        [group.genre, item.title, item.kind, item.posterPath || null]
      );
    }
  }
}

module.exports = { seedRecommendations, GENRE_RECOMMENDATIONS };
