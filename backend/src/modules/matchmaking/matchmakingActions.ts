import type { Server } from 'socket.io';
import type { ClientToServerEvents, LiveRace, ServerToClientEvents } from '@runrace/shared';
import type { RaceRepository } from '../../repositories/RaceRepository';
import type { UserRepository } from '../../repositories/UserRepository';
import { matchmakingService } from './MatchmakingService';
import { createRaceFromMatch } from './matchmakingRace';

type Io = Server<ClientToServerEvents, ServerToClientEvents>;

export function emitMatchmakingStats(io: Io): void {
  const counts = matchmakingService.getCountsByDistance();
  io.to('matchmaking:lobby').emit('matchmaking:stats', { counts });
}

function notifyMatched(io: Io, userIds: string[], race: LiveRace): void {
  for (const userId of userIds) {
    io.to(`user:${userId}`).emit('matchmaking:matched', { race });
  }
}

export async function tryJoinMatchmakingQueue(
  io: Io,
  users: UserRepository,
  raceRepo: RaceRepository,
  userId: string,
  distanceM: number,
): Promise<{ status: 'searching' | 'matched'; searchers: number; race?: LiveRace }> {
  const profile = await users.findById(userId);
  if (!profile) throw new Error('User not found');

  matchmakingService.enqueue({
    userId: profile.id,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    trustScore: profile.trustScore,
    competitiveRank: profile.competitiveRank,
    config: {
      type: 'distance',
      visibility: 'public',
      targetDistanceM: distanceM,
      maxParticipants: 2,
    },
    enqueuedAt: Date.now(),
  });

  emitMatchmakingStats(io);

  const match = matchmakingService.findMatch(profile.id);
  if (!match) {
    return {
      status: 'searching',
      searchers: matchmakingService.getSearchersAtDistance(distanceM),
    };
  }

  const liveRace = createRaceFromMatch(match, raceRepo);
  if (!liveRace) throw new Error('Failed to create race');

  notifyMatched(
    io,
    match.map((m) => m.userId),
    liveRace,
  );
  emitMatchmakingStats(io);

  return { status: 'matched', searchers: 0, race: liveRace };
}
