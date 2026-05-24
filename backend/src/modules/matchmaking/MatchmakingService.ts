import type { RaceConfig } from '@runrace/shared';
import { RACE_DISTANCE_PRESETS } from '@runrace/shared';

export interface QueueEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  trustScore: number;
  competitiveRank: number;
  config: RaceConfig;
  enqueuedAt: number;
}

const DISTANCES = RACE_DISTANCE_PRESETS.map((p) => p.meters);

export class MatchmakingService {
  private queue: QueueEntry[] = [];

  enqueue(entry: QueueEntry): void {
    this.queue = this.queue.filter((e) => e.userId !== entry.userId);
    this.queue.push(entry);
  }

  dequeue(userId: string): void {
    this.queue = this.queue.filter((e) => e.userId !== userId);
  }

  isQueued(userId: string): boolean {
    return this.queue.some((e) => e.userId === userId);
  }

  getQueueEntry(userId: string): QueueEntry | undefined {
    return this.queue.find((e) => e.userId === userId);
  }

  /** מספר מחפשים לכל מרחק (כולל מי שכבר בתור) */
  getCountsByDistance(): Record<number, number> {
    const counts: Record<number, number> = {};
    for (const d of DISTANCES) counts[d] = 0;
    for (const e of this.queue) {
      const m = e.config.targetDistanceM;
      if (m && counts[m] !== undefined) counts[m] += 1;
    }
    return counts;
  }

  getSearchersAtDistance(distanceM: number): number {
    return this.queue.filter((e) => e.config.targetDistanceM === distanceM).length;
  }

  /** מחזיר זוג לשידוך — רק כשיש לפחות 2 באותו מרחק */
  findMatch(userId: string): QueueEntry[] | null {
    const self = this.queue.find((e) => e.userId === userId);
    if (!self) return null;

    const distanceM = self.config.targetDistanceM;
    const rankBand = 200;

    const sameDistance = this.queue.filter(
      (e) => e.config.targetDistanceM === distanceM && e.config.type === 'distance',
    );

    if (sameDistance.length < 2) return null;

    const candidates = sameDistance.filter(
      (e) =>
        e.userId !== userId &&
        Math.abs(e.competitiveRank - self.competitiveRank) <= rankBand &&
        Math.abs(e.trustScore - self.trustScore) <= 25,
    );

    if (candidates.length === 0) {
      const fallback = sameDistance.find((e) => e.userId !== userId);
      if (!fallback) return null;
      const match = [self, fallback];
      for (const m of match) this.dequeue(m.userId);
      return match;
    }

    candidates.sort(
      (a, b) =>
        Math.abs(a.competitiveRank - self.competitiveRank) -
        Math.abs(b.competitiveRank - self.competitiveRank),
    );

    const match = [self, candidates[0]];
    for (const m of match) this.dequeue(m.userId);
    return match;
  }
}

export const matchmakingService = new MatchmakingService();
