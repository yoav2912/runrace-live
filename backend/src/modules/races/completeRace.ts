import type { Server } from 'socket.io';
import type { ClientToServerEvents, RacerState, ServerToClientEvents } from '@runrace/shared';
import { TRUST_BONUS_CLEAN_RACE } from '@runrace/shared';
import type { RaceRepository } from '../../repositories/RaceRepository';
import type { UserRepository } from '../../repositories/UserRepository';
import { raceEngine } from './RaceEngine';
import { clearRaceViolations, hadRaceViolation } from './raceViolations';

type Io = Server<ClientToServerEvents, ServerToClientEvents>;

export interface RaceFinishTrustReward {
  userId: string;
  delta: number;
  trustScoreAfter: number;
  cleanRace: boolean;
}

export async function completeRaceWithRewards(
  io: Io | undefined,
  raceId: string,
  results: RacerState[],
  users: UserRepository,
  raceRepo: RaceRepository,
): Promise<RaceFinishTrustReward[]> {
  const race = raceEngine.getRace(raceId);
  const finishedAt = race?.finishedAt ?? new Date();
  const rewards: RaceFinishTrustReward[] = [];

  await raceRepo.markRaceFinished(raceId, finishedAt);

  const winnerId =
    [...results]
      .filter((r) => r.finished && !r.disqualified)
      .sort((a, b) => a.rank - b.rank)[0]?.userId ?? null;

  for (const racer of results) {
    const violated = hadRaceViolation(raceId, racer.userId);
    const cleanRace = racer.finished && !racer.disqualified && !violated;

    await raceRepo.upsertParticipantResult({
      raceId,
      userId: racer.userId,
      finalRank: racer.rank,
      distanceM: racer.distanceM,
      finishTime: racer.finishTime ? new Date(racer.finishTime) : null,
      avgPaceSecPerKm: racer.paceSecPerKm,
      avgSpeedMps: racer.speedMps,
      disqualified: racer.disqualified ?? false,
    });

    let trustBonus = 0;
    let trustScoreAfter = racer.trustScore;

    if (cleanRace) {
      trustScoreAfter = await users.updateTrustScore(
        racer.userId,
        TRUST_BONUS_CLEAN_RACE,
        'clean_race_complete',
      );
      trustBonus = TRUST_BONUS_CLEAN_RACE;

      if (io) {
        io.to(`user:${racer.userId}`).emit('trust:updated', {
          delta: TRUST_BONUS_CLEAN_RACE,
          trustScoreAfter,
          reason: `מירוץ נקי הושלם (+${TRUST_BONUS_CLEAN_RACE})`,
          raceId,
        });
      }
    }

    const won = winnerId === racer.userId && !racer.disqualified;
    await users.recordRaceResult(racer.userId, won);

    rewards.push({
      userId: racer.userId,
      delta: trustBonus,
      trustScoreAfter: cleanRace ? trustScoreAfter : racer.trustScore,
      cleanRace,
    });
  }

  clearRaceViolations(raceId);
  await raceRepo.saveReplay(raceId, { results, finishedAt, rewards });

  return rewards;
}
