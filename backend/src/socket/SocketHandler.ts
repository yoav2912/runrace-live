import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { ClientToServerEvents, ServerToClientEvents } from '@runrace/shared';
import type { Env } from '../config/env';
import type { AuthUser } from '../middleware/auth';
import type { UserRepository } from '../repositories/UserRepository';
import type { RaceRepository } from '../repositories/RaceRepository';
import { raceEngine } from '../modules/races/RaceEngine';
import { antiCheatEngine } from '../modules/anti-cheat/AntiCheatEngine';
import type { GpsSample } from '@runrace/shared';
import { CHEAT_MAX_STRIKES } from '@runrace/shared';
import { beginRaceCountdown } from './raceCountdown';
import { registerMatchmakingHandlers } from './matchmakingSocket';

type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const gpsHistoryByUser = new Map<string, GpsSample[]>();
const cheatStrikesByUser = new Map<string, number>();

function strikeKey(raceId: string, userId: string): string {
  return `${raceId}:${userId}`;
}

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  env: Env,
  users: UserRepository,
  raceRepo: RaceRepository,
): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Unauthorized'));
      return;
    }
    try {
      const user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      (socket.data as { user: AuthUser }).user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: IOSocket) => {
    const authUser = (socket.data as { user: AuthUser }).user;
    registerMatchmakingHandlers(io, users, raceRepo, socket, authUser);

    socket.on('race:join', async ({ raceId, code }, ack) => {
      let race = raceEngine.getRace(raceId);
      if (!race && code) race = raceEngine.getByCode(code);
      if (!race) {
        ack?.({ ok: false, error: 'Race not found' });
        return;
      }

      const profile = await users.findById(authUser.id);
      if (!profile) {
        ack?.({ ok: false, error: 'User not found' });
        return;
      }

      const alreadyIn = race.participants.has(authUser.id);
      const joined =
        alreadyIn
          ? race.participants.get(authUser.id)
          : raceEngine.joinRace(race.id, {
              id: profile.id,
              username: profile.username,
              avatarUrl: profile.avatarUrl,
              trustScore: profile.trustScore,
            });

      if (!joined) {
        ack?.({ ok: false, error: 'Cannot join' });
        return;
      }

      socket.join(`race:${race.id}`);
      const live = raceEngine.toLiveRace(race.id)!;
      io.to(`race:${race.id}`).emit('race:updated', live);
      ack?.({ ok: true });
    });

    socket.on('race:leave', ({ raceId }) => {
      socket.leave(`race:${raceId}`);
    });

    socket.on('race:ready', ({ raceId }, ack) => {
      const race = raceEngine.getRace(raceId);
      if (!race) {
        ack?.({ ok: false, error: 'Race not found' });
        return;
      }
      if (race.status !== 'lobby') {
        ack?.({ ok: false, error: 'Race already started' });
        return;
      }

      raceEngine.setReady(raceId, authUser.id);
      const live = raceEngine.toLiveRace(raceId)!;
      io.to(`race:${raceId}`).emit('race:updated', live);
      for (const p of race.participants.values()) {
        io.to(`user:${p.userId}`).emit('race:updated', live);
      }

      const allReady =
        race.participants.size >= 2 &&
        [...race.participants.values()].every((p) => p.ready);

      if (allReady) {
        beginRaceCountdown(io, raceId, 5);
      }

      ack?.({ ok: true });
    });

    socket.on('gps:update', async (payload) => {
      const race = raceEngine.getRace(payload.raceId);
      if (!race || race.status !== 'live') return;

      const profile = await users.findById(authUser.id);
      if (!profile) return;

      const participant = race.participants.get(authUser.id);
      if (participant?.disqualified) return;

      const historyKey = strikeKey(payload.raceId, authUser.id);
      const previousSamples = gpsHistoryByUser.get(historyKey) ?? [];
      const sample: GpsSample = {
        lat: payload.lat,
        lng: payload.lng,
        altitudeM: payload.altitudeM,
        accuracyM: payload.accuracyM,
        speedMps: payload.speedMps,
        heading: payload.heading,
        timestamp: payload.timestamp,
      };

      const cheatResult = antiCheatEngine.validateGpsUpdate(
        sample,
        payload.sensors
          ? {
              timestamp: payload.timestamp,
              accelX: payload.sensors.accelX,
              accelY: payload.sensors.accelY,
              accelZ: payload.sensors.accelZ,
              cadenceSpm: payload.sensors.cadenceSpm,
              heartRateBpm: payload.sensors.heartRateBpm,
            }
          : undefined,
        {
          raceType: race.config.type,
          previousSamples,
          trustScore: profile.trustScore,
          isMockLocation: payload.sensors?.isMockLocation,
          isRooted: payload.sensors?.isRooted,
          cadenceReliable: payload.sensors?.cadenceReliable,
        },
      );

      if (!cheatResult.allowed) {
        const strikes = (cheatStrikesByUser.get(historyKey) ?? 0) + 1;
        cheatStrikesByUser.set(historyKey, strikes);

        for (const flag of cheatResult.flags) {
          await raceRepo.logCheatFlag({
            userId: authUser.id,
            raceId: payload.raceId,
            flagType: flag,
            confidence: cheatResult.confidence,
          });
        }
        await users.updateTrustScore(authUser.id, cheatResult.trustDelta, 'gps_validation_failed');

        if (strikes >= CHEAT_MAX_STRIKES) {
          raceEngine.disqualifyParticipant(payload.raceId, authUser.id);
          cheatStrikesByUser.delete(historyKey);
          gpsHistoryByUser.delete(historyKey);

          const dqMessage = 'פסילה מהמירוץ — זוהתה רמאות (למשל נסיעה ברכב)';
          socket.emit('anti-cheat:disqualified', {
            raceId: payload.raceId,
            message: dqMessage,
            strikes,
          });

          const live = raceEngine.toLiveRace(payload.raceId);
          if (live) {
            io.to(`race:${payload.raceId}`).emit('race:updated', live);
            io.to(`race:${payload.raceId}`).emit('leaderboard:update', {
              raceId: payload.raceId,
              racers: live.racers,
            });
          }

          if (raceEngine.isRaceComplete(payload.raceId)) {
            const results = raceEngine.finishRace(payload.raceId);
            if (results) {
              await raceRepo.saveReplay(payload.raceId, { results, finishedAt: new Date() });
              io.to(`race:${payload.raceId}`).emit('race:finished', {
                raceId: payload.raceId,
                results,
              });
            }
          }
          return;
        }

        socket.emit('anti-cheat:warning', {
          message: `${cheatResult.reason ?? 'תנועה חשודה'} (${strikes}/${CHEAT_MAX_STRIKES})`,
          result: cheatResult,
          strikes,
          maxStrikes: CHEAT_MAX_STRIKES,
        });
        return;
      }

      cheatStrikesByUser.delete(historyKey);

      previousSamples.push(sample);
      if (previousSamples.length > 30) previousSamples.shift();
      gpsHistoryByUser.set(historyKey, previousSamples);

      await raceRepo.saveGpsPoint({
        raceId: payload.raceId,
        userId: authUser.id,
        lat: payload.lat,
        lng: payload.lng,
        altitudeM: payload.altitudeM,
        accuracyM: payload.accuracyM,
        speedMps: payload.speedMps,
        heading: payload.heading,
        recordedAt: new Date(payload.timestamp),
        validated: true,
      });

      const racer = raceEngine.updatePosition(payload.raceId, authUser.id, {
        lat: payload.lat,
        lng: payload.lng,
        speedMps: payload.speedMps,
        heartRateBpm: payload.sensors?.heartRateBpm,
        cadenceSpm: payload.sensors?.cadenceSpm,
        timestamp: payload.timestamp,
      });

      if (!racer) return;

      io.to(`race:${payload.raceId}`).emit('racer:position', {
        raceId: payload.raceId,
        racer,
      });

      const leaderboard = raceEngine.getLeaderboard(payload.raceId);
      io.to(`race:${payload.raceId}`).emit('leaderboard:update', {
        raceId: payload.raceId,
        racers: leaderboard,
      });

      if (raceEngine.isRaceComplete(payload.raceId)) {
        const results = raceEngine.finishRace(payload.raceId);
        if (results) {
          await raceRepo.saveReplay(payload.raceId, { results, finishedAt: new Date() });
          io.to(`race:${payload.raceId}`).emit('race:finished', {
            raceId: payload.raceId,
            results,
          });
          gpsHistoryByUser.delete(historyKey);
        }
      }
    });

    socket.on('race:spectate', ({ raceId }) => {
      socket.join(`race:${raceId}:spectators`);
      const live = raceEngine.toLiveRace(raceId);
      if (live) socket.emit('race:updated', live);
    });

    socket.on('voice:signal', ({ raceId, toUserId, signal }) => {
      socket.to(`race:${raceId}`).emit('voice:signal', {
        fromUserId: authUser.id,
        signal,
      });
    });
  });
}
