const db = require('./db');

async function initDb() {
  await db.initDb();
  console.log('Database initialized successfully.');
}

initDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
