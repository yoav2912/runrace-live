import { Router } from 'express';
import type { Pool } from 'pg';
import type { Env } from '../config/env';
import { createAuthMiddleware } from '../middleware/auth';

export function createGamificationRoutes(env: Env, pool: Pool): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.get('/missions/daily', auth, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT * FROM daily_missions
       WHERE user_id = $1 AND mission_date = CURRENT_DATE`,
      [req.user!.id],
    );
    res.json({ missions: rows });
  });

  router.get('/badges', auth, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT b.*, ub.earned_at FROM badges b
       LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = $1`,
      [req.user!.id],
    );
    res.json({ badges: rows });
  });

  router.get('/leaderboard/global', auth, async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT username, avatar_url, competitive_rank, league, wins, level
       FROM users WHERE is_banned = FALSE
       ORDER BY competitive_rank DESC LIMIT 100`,
    );
    res.json({ leaderboard: rows });
  });

  return router;
}
