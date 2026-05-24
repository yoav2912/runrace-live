import { Router } from 'express';
import type { UserRepository } from '../repositories/UserRepository';
import { createAuthMiddleware } from '../middleware/auth';
import type { Env } from '../config/env';
import { paramString } from '../utils/routeParams';

export function createUsersRoutes(env: Env, users: UserRepository): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.get('/me', auth, async (req, res) => {
    const profile = await users.findById(req.user!.id);
    const stats = await users.getStats(req.user!.id);
    res.json({ profile, stats });
  });

  router.get('/profile/:username', auth, async (req, res) => {
    const profile = await users.findByUsername(paramString(req.params.username));
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const stats = await users.getStats(profile.id);
    res.json({ profile, stats });
  });

  return router;
}
