import { Router } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { Env } from '../config/env';
import { createAuthMiddleware } from '../middleware/auth';

export function createSocialRoutes(env: Env, pool: Pool): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.get('/feed', auth, async (req, res) => {
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const { rows } = await pool.query(
      `SELECT af.*, u.username, u.avatar_url
       FROM activity_feed af
       JOIN users u ON u.id = af.user_id
       ORDER BY af.created_at DESC
       LIMIT $1`,
      [limit],
    );
    res.json({ items: rows });
  });

  router.post('/friends/request', auth, async (req, res) => {
    const schema = z.object({ username: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }

    const { rows } = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      parsed.data.username.toLowerCase(),
    ]);
    if (!rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user!.id, rows[0].id],
    );
    res.json({ ok: true });
  });

  router.post('/follow/:userId', auth, async (req, res) => {
    await pool.query(
      `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user!.id, req.params.userId],
    );
    res.json({ ok: true });
  });

  return router;
}
