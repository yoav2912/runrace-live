import type { Pool } from 'pg';
import type { RaceConfig, RaceStatus } from '@runrace/shared';

export class RaceRepository {
  constructor(private pool: Pool) {}

  async persistRace(params: {
    id: string;
    code: string;
    hostId: string;
    config: RaceConfig;
    status: RaceStatus;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO races (id, code, host_id, race_type, visibility, status, target_distance_m, target_duration_sec, interval_config, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
      [
        params.id,
        params.code,
        params.hostId,
        params.config.type,
        params.config.visibility,
        params.status,
        params.config.targetDistanceM ?? null,
        params.config.targetDurationSec ?? null,
        params.config.intervalConfig ? JSON.stringify(params.config.intervalConfig) : null,
        params.config.maxParticipants,
      ],
    );
  }

  async saveGpsPoint(params: {
    raceId: string;
    userId: string;
    lat: number;
    lng: number;
    altitudeM?: number;
    accuracyM: number;
    speedMps?: number;
    heading?: number;
    recordedAt: Date;
    validated: boolean;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO gps_tracks (race_id, user_id, lat, lng, altitude_m, accuracy_m, speed_mps, heading, recorded_at, validated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        params.raceId,
        params.userId,
        params.lat,
        params.lng,
        params.altitudeM ?? null,
        params.accuracyM,
        params.speedMps ?? null,
        params.heading ?? null,
        params.recordedAt,
        params.validated,
      ],
    );
  }

  async logCheatFlag(params: {
    userId: string;
    raceId: string;
    flagType: string;
    confidence: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO anti_cheat_logs (user_id, race_id, flag_type, confidence, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.userId, params.raceId, params.flagType, params.confidence, JSON.stringify(params.metadata ?? {})],
    );
  }

  async saveReplay(raceId: string, payload: unknown): Promise<void> {
    await this.pool.query(
      `INSERT INTO race_replays (race_id, payload) VALUES ($1, $2)`,
      [raceId, JSON.stringify(payload)],
    );
  }
}
