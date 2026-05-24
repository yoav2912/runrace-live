import type { LeagueTier } from '../types/user';

export const LEAGUE_TIERS: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'elite'];

export const LEAGUE_THRESHOLDS: Record<LeagueTier, { minRank: number; maxRank: number }> = {
  bronze: { minRank: 0, maxRank: 1199 },
  silver: { minRank: 1200, maxRank: 1599 },
  gold: { minRank: 1600, maxRank: 1999 },
  platinum: { minRank: 2000, maxRank: 2399 },
  elite: { minRank: 2400, maxRank: 9999 },
};

export function leagueFromRank(rank: number): LeagueTier {
  if (rank >= 2400) return 'elite';
  if (rank >= 2000) return 'platinum';
  if (rank >= 1600) return 'gold';
  if (rank >= 1200) return 'silver';
  return 'bronze';
}
