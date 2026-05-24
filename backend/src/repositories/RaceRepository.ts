import type { Pool } from 'pg';
import type { RaceConfig, RaceStatus, UserRaceHistoryItem } from '@runrace/shared';
import { TRUST_BONUS_CLEAN_RACE } from '@runrace/shared';

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

  async markRaceFinished(raceId: string, finishedAt: Date): Promise<void> {
    await this.pool.query(
      `UPDATE races SET status = 'finished', finished_at = $2 WHERE id = $1`,
      [raceId, finishedAt],
    );
  }

  async upsertParticipantResult(params: {
    raceId: string;
    userId: string;
    finalRank: number;
    distanceM: number;
    finishTime: Date | null;
    avgPaceSecPerKm: number;
    avgSpeedMps: number;
    disqualified: boolean;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO race_participants (
         race_id, user_id, final_rank, distance_m, finish_time,
         avg_pace_sec_per_km, avg_speed_mps, disqualified
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (race_id, user_id) DO UPDATE SET
         final_rank = EXCLUDED.final_rank,
         distance_m = EXCLUDED.distance_m,
         finish_time = EXCLUDED.finish_time,
         avg_pace_sec_per_km = EXCLUDED.avg_pace_sec_per_km,
         avg_speed_mps = EXCLUDED.avg_speed_mps,
         disqualified = EXCLUDED.disqualified`,
      [
        params.raceId,
        params.userId,
        params.finalRank,
        params.distanceM,
        params.finishTime,
        Math.round(params.avgPaceSecPerKm),
        params.avgSpeedMps,
        params.disqualified,
      ],
    );
  }

  async listUserRaces(userId: string, limit = 50): Promise<UserRaceHistoryItem[]> {
    const { rows } = await this.pool.query(
      `SELECT r.id AS race_id, r.code, r.finished_at, r.target_distance_m,
              rp.final_rank, rp.distance_m, rp.disqualified, rp.finish_time,
              (SELECT COUNT(*)::int FROM anti_cheat_logs acl
               WHERE acl.race_id = r.id AND acl.user_id = rp.user_id) AS cheat_flags
       FROM race_participants rp
       JOIN races r ON r.id = rp.race_id
       WHERE rp.user_id = $1 AND r.status = 'finished'
       ORDER BY COALESCE(r.finished_at, rp.finish_time, rp.created_at) DESC
       LIMIT $2`,
      [userId, limit],
    );

    return rows.map((row: Record<string, unknown>) => {
      const cheatFlags = Number(row.cheat_flags ?? 0);
      const disqualified = Boolean(row.disqualified);
      const hasFinish = row.finish_time != null;
      const cleanRace = hasFinish && !disqualified && cheatFlags === 0;
      const finalRank = row.final_rank != null ? Number(row.final_rank) : null;

      return {
        raceId: String(row.race_id),
        code: String(row.code),
        finishedAt: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null,
        targetDistanceM: row.target_distance_m != null ? Number(row.target_distance_m) : null,
        finalRank,
        distanceM: Number(row.distance_m),
        disqualified,
        won: finalRank === 1 && !disqualified,
        cleanRace,
        trustBonusEarned: cleanRace ? TRUST_BONUS_CLEAN_RACE : 0,
      };
    });
  }
}
