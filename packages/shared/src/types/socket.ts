import type { AntiCheatResult } from './anti-cheat';
import type { LiveRace, RacerState } from './race';

export interface MatchmakingStatsPayload {
  counts: Record<number, number>;
}

export interface MatchmakingJoinAck {
  ok: boolean;
  status?: 'searching' | 'matched';
  searchers?: number;
  race?: LiveRace;
  error?: string;
}

export interface ServerToClientEvents {
  'matchmaking:stats': (payload: MatchmakingStatsPayload) => void;
  'matchmaking:matched': (payload: { race: LiveRace }) => void;
  'race:updated': (race: LiveRace) => void;
  'race:countdown': (payload: { raceId: string; secondsLeft: number }) => void;
  'race:started': (payload: { raceId: string; startedAt: string }) => void;
  'race:finished': (payload: { raceId: string; results: RacerState[] }) => void;
  'leaderboard:update': (payload: { raceId: string; racers: RacerState[] }) => void;
  'racer:position': (payload: { raceId: string; racer: RacerState }) => void;
  'anti-cheat:warning': (payload: {
    message: string;
    result: AntiCheatResult;
    strikes: number;
    maxStrikes: number;
  }) => void;
  'anti-cheat:disqualified': (payload: {
    raceId: string;
    message: string;
    strikes: number;
  }) => void;
  'race:invite': (payload: { raceId: string; code: string; fromUsername: string }) => void;
  'voice:signal': (payload: { fromUserId: string; signal: unknown }) => void;
  'error': (payload: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'matchmaking:watch': () => void;
  'matchmaking:unwatch': () => void;
  'matchmaking:join': (
    payload: { distanceM: number },
    ack?: (res: MatchmakingJoinAck) => void,
  ) => void;
  'race:join': (payload: { raceId: string; code?: string }, ack?: (res: { ok: boolean; error?: string }) => void) => void;
  'race:leave': (payload: { raceId: string }) => void;
  'race:ready': (
    payload: { raceId: string },
    ack?: (res: { ok: boolean; error?: string }) => void,
  ) => void;
  'gps:update': (payload: {
    raceId: string;
    lat: number;
    lng: number;
    accuracyM: number;
    speedMps?: number;
    heading?: number;
    altitudeM?: number;
    timestamp: number;
    sensors?: {
      accelX: number;
      accelY: number;
      accelZ: number;
      cadenceSpm?: number;
      /** true after ~12s of accelerometer data — server may enforce step cadence */
      cadenceReliable?: boolean;
      heartRateBpm?: number;
      isMockLocation?: boolean;
      isRooted?: boolean;
    };
  }) => void;
  'race:spectate': (payload: { raceId: string }) => void;
  'voice:signal': (payload: { raceId: string; toUserId: string; signal: unknown }) => void;
}
