const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'membership.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function createWrapper(db) {
  return {
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        get(...params) {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          stmt.bind(p.length ? p : null);
          const hasRow = stmt.step();
          const row = hasRow ? stmt.getAsObject() : undefined;
          stmt.reset();
          return row;
        },
        run(...params) {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          stmt.run(p.length ? p : undefined);
          stmt.reset();
          return { changes: db.getRowsModified() };
        },
        all(...params) {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          stmt.bind(p.length ? p : null);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.reset();
          return rows;
        },
      };
    },
    exec(sql) {
      db.run(sql);
    },
  };
}

const mod = module.exports;

mod.initDb = async function () {
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  // Ensure users.last_login/full_name/telegram_username exist
  try {
    const info = db.exec("PRAGMA table_info(users)");
    const columns = info?.[0]?.values?.map((row) => row[1]) || [];
    if (!columns.includes('last_login')) {
      db.run('ALTER TABLE users ADD COLUMN last_login DATETIME');
    }
    if (!columns.includes('full_name')) {
      db.run('ALTER TABLE users ADD COLUMN full_name TEXT');
    }
    if (!columns.includes('telegram_username')) {
      db.run('ALTER TABLE users ADD COLUMN telegram_username TEXT');
    }
  } catch (e) {
    console.error('DB migration error:', e.message);
  }
  db.run('PRAGMA journal_mode = WAL;');
  const wrapper = createWrapper(db);
  Object.assign(mod, wrapper);
  const save = () => {
    try {
      const data = db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (e) {
      console.error('DB save error:', e.message);
    }
  };
  setInterval(save, 5000);
  process.on('beforeExit', () => {
    save();
    db.close();
  });
  return mod;
};
