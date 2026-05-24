export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'elite';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  league: LeagueTier;
  competitiveRank: number;
  trustScore: number;
  totalRaces: number;
  wins: number;
  winStreak: number;
  createdAt: string;
}

export interface UserStats {
  totalDistanceM: number;
  totalTimeSec: number;
  avgPaceSecPerKm: number;
  best5kSec?: number;
  best10kSec?: number;
}
