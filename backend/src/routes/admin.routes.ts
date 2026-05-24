import { Router } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { Env } from '../config/env';
import { createAdminMiddleware } from '../middleware/admin';
import { createAuthMiddleware } from '../middleware/auth';

export function createAdminRoutes(env: Env, pool: Pool): Router {
  const router = Router();
  const admin = createAdminMiddleware(env);
  const auth = createAuthMiddleware(env);

  router.use(admin);

  router.get('/races/live', async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT r.*, u.username AS host_username
       FROM races r JOIN users u ON u.id = r.host_id
       WHERE r.status IN ('lobby','countdown','live')
       ORDER BY r.created_at DESC LIMIT 100`,
    );
    res.json({ races: rows });
  });

  router.get('/cheat-flags', async (req, res) => {
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const { rows } = await pool.query(
      `SELECT acl.*, u.username FROM anti_cheat_logs acl
       JOIN users u ON u.id = acl.user_id
       ORDER BY acl.created_at DESC LIMIT $1`,
      [limit],
    );
    res.json({ flags: rows });
  });

  router.post('/users/:userId/ban', auth, async (req, res) => {
    const body = z.object({ reason: z.string().optional() }).safeParse(req.body);
    await pool.query(`UPDATE users SET is_banned = TRUE WHERE id = $1`, [req.params.userId]);
    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, action, target_user_id, metadata)
       VALUES ($1, 'ban_user', $2, $3)`,
      [req.user?.id ?? null, req.params.userId, JSON.stringify({ reason: body.data?.reason })],
    );
    res.json({ ok: true });
  });

  router.get('/analytics/overview', async (_req, res) => {
    const [users, races, flags] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM users`),
      pool.query(`SELECT COUNT(*)::int AS c FROM races WHERE created_at > NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*)::int AS c FROM anti_cheat_logs WHERE created_at > NOW() - INTERVAL '24 hours'`),
    ]);
    res.json({
      totalUsers: users.rows[0].c,
      racesLast7Days: races.rows[0].c,
      cheatFlags24h: flags.rows[0].c,
    });
  });

  router.get('/tournaments', async (_req, res) => {
    const { rows } = await pool.query(`SELECT * FROM tournaments ORDER BY starts_at DESC`);
    res.json({ tournaments: rows });
  });

  return router;
}
