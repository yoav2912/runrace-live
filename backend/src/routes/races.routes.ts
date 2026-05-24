import { Router } from 'express';
import { z } from 'zod';
import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@runrace/shared';
import type { Env } from '../config/env';
import { createAuthMiddleware } from '../middleware/auth';
import type { UserRepository } from '../repositories/UserRepository';
import type { RaceRepository } from '../repositories/RaceRepository';
import { raceEngine } from '../modules/races/RaceEngine';
import { finalizeLiveRace } from '../modules/races/finalizeLiveRace';
import { matchmakingService } from '../modules/matchmaking/MatchmakingService';
import {
  emitMatchmakingStats,
  tryJoinMatchmakingQueue,
} from '../modules/matchmaking/matchmakingActions';
import { paramString } from '../utils/routeParams';

const createRaceSchema = z.object({
  type: z.enum(['distance', 'time', 'sprint', 'interval', 'custom', 'ghost']),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
  targetDistanceM: z.number().int().positive().optional(),
  targetDurationSec: z.number().int().positive().optional(),
  maxParticipants: z.number().int().min(2).max(64).default(16),
  intervalConfig: z
    .object({ workSec: z.number(), restSec: z.number(), rounds: z.number() })
    .optional(),
});

const joinMatchmakingSchema = z.object({
  distanceM: z.number().int().positive(),
});

type Io = Server<ClientToServerEvents, ServerToClientEvents>;

export function createRacesRoutes(
  env: Env,
  users: UserRepository,
  raceRepo: RaceRepository,
  io?: Io,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.get('/matchmaking/stats', auth, (_req, res) => {
    res.json({ counts: matchmakingService.getCountsByDistance() });
  });

  router.post('/matchmaking/join', auth, async (req, res) => {
    const parsed = joinMatchmakingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    if (!io) {
      res.status(503).json({ error: 'Matchmaking unavailable' });
      return;
    }

    try {
      const result = await tryJoinMatchmakingQueue(
        io,
        users,
        raceRepo,
        req.user!.id,
        parsed.data.distanceM,
      );
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Join failed' });
    }
  });

  router.post('/matchmaking/leave', auth, (req, res) => {
    matchmakingService.dequeue(req.user!.id);
    if (io) emitMatchmakingStats(io);
    res.json({ ok: true });
  });

  router.post('/', auth, async (req, res) => {
    const parsed = createRaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const profile = await users.findById(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const config = {
      type: parsed.data.type,
      visibility: parsed.data.visibility,
      targetDistanceM: parsed.data.targetDistanceM,
      targetDurationSec: parsed.data.targetDurationSec,
      intervalConfig: parsed.data.intervalConfig,
      maxParticipants: parsed.data.maxParticipants,
    };

    const race = raceEngine.createRace(profile.id, config);
    raceEngine.joinRace(race.id, {
      id: profile.id,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      trustScore: profile.trustScore,
    });

    await raceRepo.persistRace({
      id: race.id,
      code: race.code,
      hostId: race.hostId,
      config,
      status: race.status,
    });

    res.status(201).json(raceEngine.toLiveRace(race.id));
  });

  router.post('/:raceId/dev/finish', auth, async (req, res) => {
    if (env.NODE_ENV === 'production' && !env.ALLOW_DEV_FINISH) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const winnerUserId =
      typeof req.body?.winnerUserId === 'string' ? req.body.winnerUserId : req.user!.id;

    const raceId = paramString(req.params.raceId);
    const results = raceEngine.forceFinishForDev(raceId, winnerUserId);
    if (!results) {
      res.status(400).json({ error: 'Race not live or not found' });
      return;
    }

    if (io) {
      const live = raceEngine.toLiveRace(raceId);
      if (live) io.to(`race:${raceId}`).emit('race:updated', live);
      await finalizeLiveRace(io, raceId, users, raceRepo, results);
    } else {
      await finalizeLiveRace(undefined, raceId, users, raceRepo, results);
    }

    res.json({ results });
  });

  router.get('/:raceId', auth, async (req, res) => {
    const live = raceEngine.toLiveRace(paramString(req.params.raceId));
    if (!live) {
      res.status(404).json({ error: 'Race not found' });
      return;
    }
    res.json(live);
  });

  router.post('/join', auth, async (req, res) => {
    const code = String(req.body.code ?? '').toUpperCase();
    const race = raceEngine.getByCode(code);
    if (!race) {
      res.status(404).json({ error: 'Invalid race code' });
      return;
    }

    const profile = await users.findById(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const joined = raceEngine.joinRace(race.id, {
      id: profile.id,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      trustScore: profile.trustScore,
    });

    if (!joined) {
      res.status(400).json({ error: 'Cannot join race' });
      return;
    }

    res.json(raceEngine.toLiveRace(race.id));
  });

  return router;
}
