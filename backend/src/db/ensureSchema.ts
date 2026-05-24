import fs from 'fs';
import path from 'path';
import pg from 'pg';

/** Creates tables on first boot (safe for free Render — no preDeploy hook). */
export async function ensureSchema(databaseUrl: string): Promise<void> {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });

  await client.connect();

  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'`,
  );

  if (rows.length > 0) {
    await client.end();
    return;
  }

  const sqlPath = path.resolve(__dirname, '../../migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await client.query(sql);
  console.log('Database schema applied.');
  await client.end();
}
