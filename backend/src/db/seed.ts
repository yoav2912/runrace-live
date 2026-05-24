import 'dotenv/config';
import { Pool } from 'pg';
import { loadEnv } from '../config/env';

async function seed() {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  await pool.query(`
    INSERT INTO badges (key, name, description) VALUES
      ('first_win', 'First Blood', 'Win your first live race'),
      ('streak_5', 'On Fire', '5 race win streak'),
      ('elite_runner', 'Elite', 'Reach Elite league')
    ON CONFLICT (key) DO NOTHING
  `);

  console.log('Seed completed');
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
