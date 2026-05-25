import type { Pool } from 'pg';
import type { TrustHistoryItem, UserProfile, UserStats } from '@runrace/shared';

export class UserRepository {
  constructor(private pool: Pool) {}

  async findByAuthId(authProviderId: string): Promise<UserProfile | null> {
    const { rows } = await this.pool.query(
      `SELECT id, username, display_name, avatar_url, level, xp, league,
              competitive_rank, trust_score, total_races, wins, win_streak, created_at
       FROM users WHERE auth_provider_id = $1 AND is_banned = FALSE`,
      [authProviderId],
    );
    return rows[0] ? this.mapProfile(rows[0]) : null;
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    const { rows } = await this.pool.query(
      `SELECT id, username, display_name, avatar_url, level, xp, league,
              competitive_rank, trust_score, total_races, wins, win_streak, created_at
       FROM users WHERE username = $1 AND is_banned = FALSE`,
      [username.toLowerCase()],
    );
    return rows[0] ? this.mapProfile(rows[0]) : null;
  }

  async findById(id: string): Promise<UserProfile | null> {
    const { rows } = await this.pool.query(
      `SELECT id, username, display_name, avatar_url, level, xp, league,
              competitive_rank, trust_score, total_races, wins, win_streak, created_at
       FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ? this.mapProfile(rows[0]) : null;
  }

  async upsertFromAuth(params: {
    authProviderId: string;
    email?: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  }): Promise<UserProfile> {
    const { rows } = await this.pool.query(
      `INSERT INTO users (auth_provider_id, email, username, display_name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (auth_provider_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
         updated_at = NOW()
       RETURNING id, username, display_name, avatar_url, level, xp, league,
                 competitive_rank, trust_score, total_races, wins, win_streak, created_at`,
      [params.authProviderId, params.email ?? null, params.username, params.displayName, params.avatarUrl ?? null],
    );
    await this.pool.query(
      `INSERT INTO user_stats (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [rows[0].id],
    );
    await this.pool.query(
      `INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [rows[0].id],
    );
    return this.mapProfile(rows[0]);
  }

  async getStats(userId: string): Promise<UserStats | null> {
    const { rows } = await this.pool.query(
      `SELECT total_distance_m, total_time_sec, avg_pace_sec_per_km, best_5k_sec, best_10k_sec
       FROM user_stats WHERE user_id = $1`,
      [userId],
    );
    if (!rows[0]) return null;
    return {
      totalDistanceM: Number(rows[0].total_distance_m),
      totalTimeSec: Number(rows[0].total_time_sec),
      avgPaceSecPerKm: rows[0].avg_pace_sec_per_km ?? 0,
      best5kSec: rows[0].best_5k_sec ?? undefined,
      best10kSec: rows[0].best_10k_sec ?? undefined,
    };
  }

  async setTrustScore(userId: string, trustScore: number, reason: string): Promise<number> {
    const clamped = Math.max(0, Math.min(100, trustScore));
    const { rows } = await this.pool.query(
      `SELECT trust_score FROM users WHERE id = $1`,
      [userId],
    );
    const previous = Number(rows[0]?.trust_score ?? 0);
    const delta = clamped - previous;

    await this.pool.query(
      `UPDATE users SET trust_score = $2, updated_at = NOW() WHERE id = $1`,
      [userId, clamped],
    );
    await this.pool.query(
      `INSERT INTO trust_score_history (user_id, previous_score, new_score, delta, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, previous, clamped, delta, reason],
    );
    return clamped;
  }

  async updateTrustScore(userId: string, delta: number, reason: string): Promise<number> {
    const { rows } = await this.pool.query(
      `UPDATE users SET trust_score = GREATEST(0, LEAST(100, trust_score + $2)), updated_at = NOW()
       WHERE id = $1
       RETURNING trust_score AS new_score, trust_score - $2 AS previous_score`,
      [userId, delta],
    );
    const newScore = Number(rows[0]?.new_score ?? 0);
    const previousScore = Number(rows[0]?.previous_score ?? newScore - delta);
    await this.pool.query(
      `INSERT INTO trust_score_history (user_id, previous_score, new_score, delta, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, previousScore, newScore, delta, reason],
    );
    return newScore;
  }

  async recordRaceResult(userId: string, won: boolean): Promise<void> {
    await this.pool.query(
      `UPDATE users SET
         total_races = total_races + 1,
         wins = wins + CASE WHEN $2 THEN 1 ELSE 0 END,
         win_streak = CASE WHEN $2 THEN win_streak + 1 ELSE 0 END,
         updated_at = NOW()
       WHERE id = $1`,
      [userId, won],
    );
  }

  async getTrustHistory(userId: string, limit = 50): Promise<TrustHistoryItem[]> {
    const { rows } = await this.pool.query(
      `SELECT id, delta, new_score, reason, created_at
       FROM trust_score_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      delta: Number(row.delta),
      newScore: Number(row.new_score),
      reason: row.reason ? String(row.reason) : null,
      createdAt: new Date(String(row.created_at)).toISOString(),
    }));
  }

  private mapProfile(row: Record<string, unknown>): UserProfile {
    return {
      id: String(row.id),
      username: String(row.username),
      displayName: String(row.display_name),
      avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
      level: Number(row.level),
      xp: Number(row.xp),
      league: row.league as UserProfile['league'],
      competitiveRank: Number(row.competitive_rank),
      trustScore: Number(row.trust_score),
      totalRaces: Number(row.total_races),
      wins: Number(row.wins),
      winStreak: Number(row.win_streak),
      createdAt: new Date(String(row.created_at)).toISOString(),
    };
  }
}
