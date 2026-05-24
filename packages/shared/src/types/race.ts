export type RaceType =
  | 'distance'
  | 'time'
  | 'sprint'
  | 'interval'
  | 'custom'
  | 'ghost';

export type RaceVisibility = 'public' | 'friends' | 'private';

export type RaceStatus =
  | 'lobby'
  | 'countdown'
  | 'live'
  | 'finished'
  | 'cancelled';

export interface RaceConfig {
  type: RaceType;
  targetDistanceM?: number;
  targetDurationSec?: number;
  intervalConfig?: { workSec: number; restSec: number; rounds: number };
  maxParticipants: number;
  visibility: RaceVisibility;
}

export interface RacerState {
  participantId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  rank: number;
  distanceM: number;
  paceSecPerKm: number;
  speedMps: number;
  gapToLeaderM: number;
  lat: number;
  lng: number;
  heading?: number;
  heartRateBpm?: number;
  cadenceSpm?: number;
  finished: boolean;
  finishTime?: string;
  trustScore: number;
  ready?: boolean;
  disqualified?: boolean;
}

export interface LiveRace {
  id: string;
  code: string;
  hostId: string;
  config: RaceConfig;
  status: RaceStatus;
  countdownEndsAt?: string;
  startedAt?: string;
  finishedAt?: string;
  racers: RacerState[];
}
