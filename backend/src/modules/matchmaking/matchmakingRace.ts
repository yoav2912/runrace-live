import type { LiveRace } from '@runrace/shared';
import type { RaceRepository } from '../../repositories/RaceRepository';
import { raceEngine } from '../races/RaceEngine';
import type { QueueEntry } from './MatchmakingService';

export function createRaceFromMatch(match: QueueEntry[], raceRepo: RaceRepository): LiveRace | null {
  const host = match[0];
  const race = raceEngine.createRace(host.userId, host.config);

  for (const m of match) {
    raceEngine.joinRace(race.id, {
      id: m.userId,
      username: m.username,
      avatarUrl: m.avatarUrl,
      trustScore: m.trustScore,
    });
  }

  void raceRepo.persistRace({
    id: race.id,
    code: race.code,
    hostId: race.hostId,
    config: race.config,
    status: race.status,
  });

  return raceEngine.toLiveRace(race.id);
}
