import 'dotenv/config';
import { ensureSchema } from '../src/db/ensureSchema';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  await ensureSchema(url);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
