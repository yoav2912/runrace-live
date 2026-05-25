import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env';
import type { UserRepository } from '../repositories/UserRepository';

const trustBodySchema = z.object({
  username: z.string().min(1),
  delta: z.number().optional(),
  trustScore: z.number().min(0).max(100).optional(),
});

export function createDevRoutes(env: Env, users: UserRepository): Router {
  const router = Router();

  router.use((req, res, next) => {
    if (env.NODE_ENV === 'production' && !env.ALLOW_DEV_FINISH) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const apiKey = req.headers['x-admin-key'];
    if (!env.ADMIN_API_KEY || apiKey !== env.ADMIN_API_KEY) {
      res.status(401).json({ error: 'Invalid or missing x-admin-key' });
      return;
    }
    next();
  });

  /** POST /api/dev/trust  { username, delta: 20 } או { username, trustScore: 100 } */
  router.post('/trust', async (req, res) => {
    const parsed = trustBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { username, delta, trustScore } = parsed.data;
    if (delta === undefined && trustScore === undefined) {
      res.status(400).json({ error: 'Provide delta or trustScore' });
      return;
    }

    const profile = await users.findByUsername(username);
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const scoreAfter =
      trustScore !== undefined
        ? await users.setTrustScore(profile.id, trustScore, 'dev_set')
        : await users.updateTrustScore(profile.id, delta!, 'dev_adjust');

    res.json({
      ok: true,
      username: profile.username,
      trustScore: scoreAfter,
    });
  });

  return router;
}
