const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS db_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const [rows] = await db.query('SELECT id FROM db_migrations WHERE filename = ?', [file]);
    if (rows.length > 0) {
      console.log(`  skip: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await db.query(sql);
      await db.query('INSERT INTO db_migrations (filename) VALUES (?)', [file]);
      console.log(`  done: ${file}`);
    } catch (err) {
      // Column/table already exists — record as done and continue
      if (['ER_DUP_FIELDNAME', 'ER_TABLE_EXISTS_ERROR'].includes(err.code)) {
        await db.query('INSERT INTO db_migrations (filename) VALUES (?)', [file]);
        console.log(`  done (already exists): ${file}`);
      } else {
        console.error(`  ERROR: ${file} — ${err.message}`);
        process.exit(1);
      }
    }
  }

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
