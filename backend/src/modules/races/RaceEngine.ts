import type { LiveRace, RaceConfig, RacerState, RaceStatus } from '@runrace/shared';
import { MIN_TRUST_SCORE_RACE } from '@runrace/shared';
import { haversineDistanceM } from '../../utils/geo';
import { generateRaceCode } from '../../utils/codes';

export interface InMemoryParticipant {
  participantId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  trustScore: number;
  lat: number;
  lng: number;
  distanceM: number;
  lastLat: number;
  lastLng: number;
  paceSecPerKm: number;
  speedMps: number;
  heartRateBpm?: number;
  cadenceSpm?: number;
  finished: boolean;
  finishTime?: Date;
  ready: boolean;
  disqualified?: boolean;
  gpsHistory: { lat: number; lng: number; ts: number }[];
}

export interface InMemoryRace {
  id: string;
  code: string;
  hostId: string;
  config: RaceConfig;
  status: RaceStatus;
  countdownEndsAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
  participants: Map<string, InMemoryParticipant>;
  spectators: Set<string>;
}

export class RaceEngine {
  private races = new Map<string, InMemoryRace>();

  createRace(hostId: string, config: RaceConfig): InMemoryRace {
    const id = crypto.randomUUID();
    const race: InMemoryRace = {
      id,
      code: generateRaceCode(),
      hostId,
      config,
      status: 'lobby',
      participants: new Map(),
      spectators: new Set(),
    };
    this.races.set(id, race);
    return race;
  }

  getRace(raceId: string): InMemoryRace | undefined {
    return this.races.get(raceId);
  }

  getByCode(code: string): InMemoryRace | undefined {
    return [...this.races.values()].find((r) => r.code === code.toUpperCase());
  }

  joinRace(
    raceId: string,
    user: { id: string; username: string; avatarUrl?: string; trustScore: number },
  ): InMemoryParticipant | null {
    const race = this.races.get(raceId);
    if (!race) return null;

    if (race.participants.has(user.id)) {
      return race.participants.get(user.id)!;
    }

    if (race.status !== 'lobby') return null;
    if (user.trustScore < MIN_TRUST_SCORE_RACE) return null;
    if (race.participants.size >= race.config.maxParticipants) return null;

    const participant: InMemoryParticipant = {
      participantId: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      trustScore: user.trustScore,
      lat: 0,
      lng: 0,
      distanceM: 0,
      lastLat: 0,
      lastLng: 0,
      paceSecPerKm: 0,
      speedMps: 0,
      finished: false,
      ready: false,
      gpsHistory: [],
    };
    race.participants.set(user.id, participant);
    return participant;
  }

  setReady(raceId: string, userId: string): void {
    const p = this.races.get(raceId)?.participants.get(userId);
    if (p) p.ready = true;
  }

  startCountdown(raceId: string, seconds = 5): boolean {
    const race = this.races.get(raceId);
    if (!race || race.status !== 'lobby') return false;
    const allReady = [...race.participants.values()].every((p) => p.ready);
    if (race.participants.size < 1) return false;
    if (race.participants.size > 1 && !allReady) return false;

    race.status = 'countdown';
    race.countdownEndsAt = new Date(Date.now() + seconds * 1000);
    return true;
  }

  startRace(raceId: string): boolean {
    const race = this.races.get(raceId);
    if (!race || race.status !== 'countdown') return false;
    race.status = 'live';
    race.startedAt = new Date();
    return true;
  }

  updatePosition(
    raceId: string,
    userId: string,
    update: {
      lat: number;
      lng: number;
      speedMps?: number;
      heartRateBpm?: number;
      cadenceSpm?: number;
      timestamp: number;
    },
  ): RacerState | null {
    const race = this.races.get(raceId);
    if (!race || race.status !== 'live') return null;

    const p = race.participants.get(userId);
    if (!p || p.finished || p.disqualified) return null;

    const MIN_RUN_SPEED_MPS = 0.7;
    const MIN_SEGMENT_M = 4;
    const MAX_SEGMENT_M = 40;

    let segmentM = 0;
    if (p.lastLat !== 0 && p.lastLng !== 0) {
      segmentM = haversineDistanceM(p.lastLat, p.lastLng, update.lat, update.lng);
    }

    const deviceSpeed = update.speedMps ?? 0;
    const derivedSpeed = segmentM > 0 && p.gpsHistory.length > 0
      ? segmentM / Math.max(0.5, (update.timestamp - p.gpsHistory[p.gpsHistory.length - 1].ts) / 1000)
      : 0;

    let speedMps = deviceSpeed > 0 ? deviceSpeed : derivedSpeed;
    if (speedMps < MIN_RUN_SPEED_MPS) speedMps = 0;

    if (
      segmentM >= MIN_SEGMENT_M &&
      segmentM <= MAX_SEGMENT_M &&
      speedMps >= MIN_RUN_SPEED_MPS
    ) {
      p.distanceM += segmentM;
    }

    p.lastLat = p.lat || update.lat;
    p.lastLng = p.lng || update.lng;
    p.lat = update.lat;
    p.lng = update.lng;
    p.speedMps = speedMps;
    p.heartRateBpm = update.heartRateBpm;
    p.cadenceSpm = update.cadenceSpm;
    p.gpsHistory.push({ lat: update.lat, lng: update.lng, ts: update.timestamp });
    if (p.gpsHistory.length > 120) p.gpsHistory.shift();

    if (p.speedMps >= MIN_RUN_SPEED_MPS) {
      p.paceSecPerKm = 1000 / p.speedMps;
    } else {
      p.paceSecPerKm = 0;
    }

    this.checkFinish(race, p);
    return this.toRacerState(race, p);
  }

  private checkFinish(race: InMemoryRace, p: InMemoryParticipant): void {
    const { config } = race;
    if (config.type === 'distance' && config.targetDistanceM) {
      if (p.distanceM >= config.targetDistanceM) {
        p.finished = true;
        p.finishTime = new Date();
      }
    }
    if (config.type === 'time' && race.startedAt && config.targetDurationSec) {
      const elapsed = (Date.now() - race.startedAt.getTime()) / 1000;
      if (elapsed >= config.targetDurationSec) {
        for (const part of race.participants.values()) {
          if (!part.finished) {
            part.finished = true;
            part.finishTime = new Date();
          }
        }
      }
    }
  }

  getLeaderboard(raceId: string): RacerState[] {
    const race = this.races.get(raceId);
    if (!race) return [];

    const racers = [...race.participants.values()].map((p) => this.toRacerState(race, p));
    racers.sort((a, b) => {
      if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.distanceM - a.distanceM;
    });

    const leaderDist = racers[0]?.distanceM ?? 0;
    return racers.map((r, i) => ({
      ...r,
      rank: i + 1,
      gapToLeaderM: leaderDist - r.distanceM,
    }));
  }

  disqualifyParticipant(raceId: string, userId: string): boolean {
    const p = this.races.get(raceId)?.participants.get(userId);
    if (!p || p.disqualified) return false;
    p.disqualified = true;
    p.finished = true;
    p.finishTime = new Date();
    p.speedMps = 0;
    return true;
  }

  isRaceComplete(raceId: string): boolean {
    const race = this.races.get(raceId);
    if (!race || race.status !== 'live') return false;
    const participants = [...race.participants.values()];
    if (participants.length === 0) return false;

    if (race.config.type === 'distance') {
      const racing = participants.filter((p) => !p.disqualified);
      if (racing.length === 0) return true;
      return racing.every((p) => p.finished);
    }
    if (race.config.type === 'time' && race.startedAt && race.config.targetDurationSec) {
      return (Date.now() - race.startedAt.getTime()) / 1000 >= race.config.targetDurationSec;
    }
    return false;
  }

  finishRace(raceId: string): RacerState[] | null {
    const race = this.races.get(raceId);
    if (!race) return null;
    race.status = 'finished';
    race.finishedAt = new Date();
    return this.getLeaderboard(raceId);
  }

  /** סיום מירוץ לבדיקות — מנצח מגיע ליעד, היריב קצת אחריו */
  forceFinishForDev(raceId: string, winnerUserId: string): RacerState[] | null {
    const race = this.races.get(raceId);
    if (!race || (race.status !== 'live' && race.status !== 'countdown')) return null;

    if (race.status === 'countdown') {
      race.status = 'live';
      race.startedAt = new Date();
    }

    const target = race.config.targetDistanceM ?? 1000;
    const startMs = race.startedAt?.getTime() ?? Date.now();
    const km = target / 1000;
    /** קצב ריאלי לבדיקה: ~5:30 לק"מ */
    const winnerPaceSecPerKm = 330;
    const loserPaceSecPerKm = 360;
    const winnerElapsedMs = Math.max(60_000, km * winnerPaceSecPerKm * 1000);
    const loserElapsedMs = Math.max(70_000, km * loserPaceSecPerKm * 1000);

    for (const p of race.participants.values()) {
      if (p.userId === winnerUserId) {
        p.distanceM = target;
        p.finished = true;
        p.finishTime = new Date(startMs + winnerElapsedMs);
        p.paceSecPerKm = winnerPaceSecPerKm;
        p.speedMps = 1000 / winnerPaceSecPerKm;
      } else {
        p.distanceM = Math.max(0, target - 30);
        p.finished = true;
        p.finishTime = new Date(startMs + loserElapsedMs);
        p.paceSecPerKm = loserPaceSecPerKm;
        p.speedMps = 1000 / loserPaceSecPerKm;
      }
    }

    return this.finishRace(raceId);
  }

  toLiveRace(raceId: string): LiveRace | null {
    const race = this.races.get(raceId);
    if (!race) return null;
    return {
      id: race.id,
      code: race.code,
      hostId: race.hostId,
      config: race.config,
      status: race.status,
      countdownEndsAt: race.countdownEndsAt?.toISOString(),
      startedAt: race.startedAt?.toISOString(),
      finishedAt: race.finishedAt?.toISOString(),
      racers: this.getLeaderboard(raceId),
    };
  }

  private toRacerState(race: InMemoryRace, p: InMemoryParticipant): RacerState {
    return {
      participantId: p.participantId,
      userId: p.userId,
      username: p.username,
      avatarUrl: p.avatarUrl,
      rank: 0,
      distanceM: Math.round(p.distanceM * 10) / 10,
      paceSecPerKm: Math.round(p.paceSecPerKm),
      speedMps: Math.round(p.speedMps * 100) / 100,
      gapToLeaderM: 0,
      lat: p.lat,
      lng: p.lng,
      heartRateBpm: p.heartRateBpm,
      cadenceSpm: p.cadenceSpm,
      finished: p.finished,
      finishTime: p.finishTime?.toISOString(),
      trustScore: p.trustScore,
      ready: p.ready,
      disqualified: p.disqualified ?? false,
    };
  }
}

export const raceEngine = new RaceEngine();
