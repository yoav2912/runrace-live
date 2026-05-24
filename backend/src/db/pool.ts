import { Pool } from 'pg';
import type { Env } from '../config/env';

let pool: Pool | null = null;

export function getPool(env: Env): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}
