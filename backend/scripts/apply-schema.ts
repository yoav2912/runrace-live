/**
 * Applies 001_initial_schema.sql once (safe to run on every deploy).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: url,
    ssl: url.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });

  await client.connect();

  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'`,
  );

  if (rows.length > 0) {
    console.log('Schema already applied — skipping.');
    await client.end();
    return;
  }

  const sqlPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await client.query(sql);
  console.log('Schema applied successfully.');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
