import type { Server } from 'socket.io';
import type { ClientToServerEvents, RacerState, ServerToClientEvents } from '@runrace/shared';
import type { RaceRepository } from '../../repositories/RaceRepository';
import type { UserRepository } from '../../repositories/UserRepository';
import { raceEngine } from './RaceEngine';
import { clearRaceSession } from '../../socket/gpsSession';
import { completeRaceWithRewards } from './completeRace';

type Io = Server<ClientToServerEvents, ServerToClientEvents>;

const finishing = new Set<string>();

export type TrustRewardsByUser = Record<
  string,
  { delta: number; cleanRace: boolean; trustScoreAfter: number }
>;

export async function finalizeLiveRace(
  io: Io | undefined,
  raceId: string,
  users: UserRepository,
  raceRepo: RaceRepository,
  precomputedResults?: RacerState[],
): Promise<{ results: RacerState[]; trustRewards: TrustRewardsByUser } | null> {
  if (finishing.has(raceId)) return null;
  finishing.add(raceId);

  try {
    const results = precomputedResults ?? raceEngine.finishRace(raceId);
    if (!results) return null;

    const rewards = await completeRaceWithRewards(io, raceId, results, users, raceRepo);
    const trustRewards: TrustRewardsByUser = {};
    for (const r of rewards) {
      trustRewards[r.userId] = {
        delta: r.delta,
        cleanRace: r.cleanRace,
        trustScoreAfter: r.trustScoreAfter,
      };
    }

    clearRaceSession(
      raceId,
      results.map((r) => r.userId),
    );

    if (io) {
      io.to(`race:${raceId}`).emit('race:finished', { raceId, results, trustRewards });
    }

    return { results, trustRewards };
  } finally {
    finishing.delete(raceId);
  }
}
