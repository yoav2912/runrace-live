import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@runrace/shared';
import type { AuthUser } from '../middleware/auth';
import type { UserRepository } from '../repositories/UserRepository';
import type { RaceRepository } from '../repositories/RaceRepository';
import { matchmakingService } from '../modules/matchmaking/MatchmakingService';
import {
  emitMatchmakingStats,
  tryJoinMatchmakingQueue,
} from '../modules/matchmaking/matchmakingActions';

type Io = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerMatchmakingHandlers(
  io: Io,
  users: UserRepository,
  raceRepo: RaceRepository,
  socket: IOSocket,
  authUser: AuthUser,
): void {
  socket.join(`user:${authUser.id}`);

  socket.on('matchmaking:watch', () => {
    socket.join('matchmaking:lobby');
    const counts = matchmakingService.getCountsByDistance();
    socket.emit('matchmaking:stats', { counts });
  });

  socket.on('matchmaking:unwatch', () => {
    socket.leave('matchmaking:lobby');
    if (matchmakingService.isQueued(authUser.id)) {
      matchmakingService.dequeue(authUser.id);
      emitMatchmakingStats(io);
    }
  });

  socket.on('matchmaking:join', async ({ distanceM }, ack) => {
    try {
      const result = await tryJoinMatchmakingQueue(io, users, raceRepo, authUser.id, distanceM);
      ack?.({ ok: true, ...result });
    } catch (e) {
      ack?.({ ok: false, error: e instanceof Error ? e.message : 'Join failed' });
    }
  });

  socket.on('disconnect', () => {
    if (matchmakingService.isQueued(authUser.id)) {
      matchmakingService.dequeue(authUser.id);
      emitMatchmakingStats(io);
    }
  });
}
