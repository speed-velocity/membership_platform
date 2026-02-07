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
  { title: 'Rana Naidu', kind: 'Series', posterPath: 'posters/action/rana-naidu.jpg' },
];

const ROMANCE_RECOMMENDATIONS = [
  { title: 'Ae Dil Hai Mushkil', kind: 'Movie', posterPath: 'posters/romance/ae-dil-hai-mushkil.jpg' },
  { title: 'Jab We Met', kind: 'Movie', posterPath: 'posters/romance/jab-we-met.jpg' },
  { title: 'Tamasha', kind: 'Movie', posterPath: 'posters/romance/tamasha.jpg' },
  { title: 'Kal Ho Naa Ho', kind: 'Movie', posterPath: 'posters/romance/kal-ho-naa-ho.jpg' },
  { title: 'Shiddat', kind: 'Movie', posterPath: 'posters/romance/shiddat.jpg' },
  { title: 'Raanjhanaa', kind: 'Movie', posterPath: 'posters/romance/raanjhanaa.jpg' },
  { title: 'The Notebook', kind: 'Movie', posterPath: 'posters/romance/the-notebook.jpg' },
  { title: 'La La Land', kind: 'Movie', posterPath: 'posters/romance/la-la-land.jpg' },
  { title: 'Titanic', kind: 'Movie', posterPath: 'posters/romance/titanic.jpg' },
  { title: 'Aashiqui 2', kind: 'Movie', posterPath: 'posters/romance/aashiqui-2.jpg' },
  { title: 'Modern Love', kind: 'Series', posterPath: 'posters/romance/modern-love.jpg' },
  { title: 'Feels Like Ishq', kind: 'Series', posterPath: 'posters/romance/feels-like-ishq.jpg' },
  { title: 'One Day (Series)', kind: 'Series', posterPath: 'posters/romance/one-day-series.jpg' },
  { title: 'Little Things', kind: 'Series', posterPath: 'posters/romance/little-things.jpg' },
  { title: 'Broken But Beautiful', kind: 'Series', posterPath: 'posters/romance/broken-but-beautiful.jpg' },
];

const THRILLER_RECOMMENDATIONS = [
  { title: 'Se7en', kind: 'Movie', posterPath: 'posters/thriller/se7en.jpg' },
  { title: 'Gone Girl', kind: 'Movie', posterPath: 'posters/thriller/gone-girl.jpg' },
  { title: 'Shutter Island', kind: 'Movie', posterPath: 'posters/thriller/shutter-island.jpg' },
  { title: 'The Silence of the Lambs', kind: 'Movie', posterPath: 'posters/thriller/silence-of-the-lambs.jpg' },
  { title: 'Prisoners', kind: 'Movie', posterPath: 'posters/thriller/prisoners.jpg' },
  { title: 'Andhadhun', kind: 'Movie', posterPath: 'posters/thriller/andhadhun.jpg' },
  { title: 'Drishyam', kind: 'Movie', posterPath: 'posters/thriller/drishyam.jpg' },
  { title: 'Badla', kind: 'Movie', posterPath: 'posters/thriller/badla.jpg' },
  { title: 'Kahaani', kind: 'Movie', posterPath: 'posters/thriller/kahaani.jpg' },
  { title: 'Raman Raghav 2.0', kind: 'Movie', posterPath: 'posters/thriller/raman-raghav-20.jpg' },
  { title: 'Mindhunter', kind: 'Series', posterPath: 'posters/thriller/mindhunter.jpg' },
  { title: '1000 Babies', kind: 'Series', posterPath: 'posters/thriller/1000-babies.jpg' },
  { title: 'Breaking Bad', kind: 'Series', posterPath: 'posters/thriller/breaking-bad.jpg' },
  { title: 'Sacred Games', kind: 'Series', posterPath: 'posters/thriller/sacred-games.jpg' },
  { title: 'Asur', kind: 'Series', posterPath: 'posters/thriller/asur.jpg' },
];

const COMEDY_RECOMMENDATIONS = [
  { title: 'The Hangover', kind: 'Movie', posterPath: 'posters/comedy/the-hangover.jpg' },
  { title: 'Superbad', kind: 'Movie', posterPath: 'posters/comedy/superbad.jpg' },
  { title: '21 Jump Street', kind: 'Movie', posterPath: 'posters/comedy/21-jump-street.jpg' },
  { title: "We're the Millers", kind: 'Movie', posterPath: 'posters/comedy/were-the-millers.jpg' },
  { title: 'Deadpool', kind: 'Movie', posterPath: 'posters/comedy/deadpool.jpg' },
  { title: 'Hera Pheri', kind: 'Movie', posterPath: 'posters/comedy/hera-pheri.jpg' },
  { title: 'Phir Hera Pheri', kind: 'Movie', posterPath: 'posters/comedy/phir-hera-pheri.jpg' },
  { title: 'Dhamaal', kind: 'Movie', posterPath: 'posters/comedy/dhamaal.jpg' },
  { title: 'Golmaal', kind: 'Movie', posterPath: 'posters/comedy/golmaal.jpg' },
  { title: 'Chup Chup Ke', kind: 'Movie', posterPath: 'posters/comedy/chup-chup-ke.jpg' },
  { title: 'Friends', kind: 'Series', posterPath: 'posters/comedy/friends.jpg' },
  { title: 'The Office (US)', kind: 'Series', posterPath: 'posters/comedy/the-office-us.jpg' },
  { title: 'Brooklyn Nine-Nine', kind: 'Series', posterPath: 'posters/comedy/brooklyn-nine-nine.jpg' },
  { title: 'Panchayat', kind: 'Series', posterPath: 'posters/comedy/panchayat.jpg' },
  { title: 'TVF Pitchers', kind: 'Series', posterPath: 'posters/comedy/tvf-pitchers.jpg' },
];

const GENRE_RECOMMENDATIONS = [
  { genre: 'Action', items: ACTION_RECOMMENDATIONS },
  { genre: 'Romance', items: ROMANCE_RECOMMENDATIONS },
  { genre: 'Thriller', items: THRILLER_RECOMMENDATIONS },
  { genre: 'Comedy', items: COMEDY_RECOMMENDATIONS },
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
