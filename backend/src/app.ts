import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@runrace/shared';
import type { Env } from './config/env';
import { getPool } from './db/pool';
import { UserRepository } from './repositories/UserRepository';
import { RaceRepository } from './repositories/RaceRepository';
import { createAuthRoutes } from './routes/auth.routes';
import { createUsersRoutes } from './routes/users.routes';
import { createRacesRoutes } from './routes/races.routes';
import { createSocialRoutes } from './routes/social.routes';
import { createGamificationRoutes } from './routes/gamification.routes';
import { createAdminRoutes } from './routes/admin.routes';

type Io = Server<ClientToServerEvents, ServerToClientEvents>;

export function createApp(env: Env, io?: Io) {
  const app = express();
  const pool = getPool(env);
  const users = new UserRepository(pool);
  const races = new RaceRepository(pool);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'runrace-live-api' });
  });

  app.use('/api/auth', createAuthRoutes(env, users));
  app.use('/api/users', createUsersRoutes(env, users, races));
  app.use('/api/races', createRacesRoutes(env, users, races, io));
  app.use('/api/social', createSocialRoutes(env, pool));
  app.use('/api/gamification', createGamificationRoutes(env, pool));
  app.use('/api/admin', createAdminRoutes(env, pool));

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, pool, users, races };
}
