import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env';
import { signToken } from '../middleware/auth';
import type { UserRepository } from '../repositories/UserRepository';

const loginSchema = z.object({
  authProviderId: z.string().min(1),
  email: z.string().email().optional(),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(48),
  avatarUrl: z.string().url().optional(),
  provider: z.enum(['google', 'apple', 'email', 'supabase']).default('supabase'),
});

export function createAuthRoutes(env: Env, users: UserRepository): Router {
  const router = Router();

  /** Exchange Supabase/Firebase session for app JWT */
  router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const profile = await users.upsertFromAuth({
      authProviderId: parsed.data.authProviderId,
      email: parsed.data.email,
      username: parsed.data.username.toLowerCase(),
      displayName: parsed.data.displayName,
      avatarUrl: parsed.data.avatarUrl,
    });

    const token = signToken(env, {
      id: profile.id,
      username: profile.username,
    });

    res.json({ token, user: profile });
  });

  return router;
}
