export interface UserRaceHistoryItem {
  raceId: string;
  code: string;
  finishedAt: string | null;
  targetDistanceM: number | null;
  finalRank: number | null;
  distanceM: number;
  disqualified: boolean;
  won: boolean;
  /** מירוץ הושלם בלי הפרות אמון במירוץ */
  cleanRace: boolean;
  trustBonusEarned: number;
}

export interface TrustHistoryItem {
  id: string;
  delta: number;
  newScore: number;
  reason: string | null;
  createdAt: string;
  raceId?: string | null;
}
