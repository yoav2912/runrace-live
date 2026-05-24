import type { Pool } from 'pg';

/**
 * Wallet abstraction — tournament entry fees, prizes, sponsor rewards.
 * KYC-gated withdrawals planned; no gambling logic.
 */
export class WalletService {
  constructor(private pool: Pool) {}

  async getOrCreateWallet(userId: string): Promise<{ id: string; balanceCents: number }> {
    const existing = await this.pool.query(
      'SELECT id, balance_cents FROM wallets WHERE user_id = $1',
      [userId],
    );
    if (existing.rows[0]) {
      return { id: existing.rows[0].id, balanceCents: Number(existing.rows[0].balance_cents) };
    }
    const created = await this.pool.query(
      `INSERT INTO wallets (user_id) VALUES ($1) RETURNING id, balance_cents`,
      [userId],
    );
    return { id: created.rows[0].id, balanceCents: 0 };
  }

  async recordTransaction(params: {
    walletId: string;
    amountCents: number;
    type: 'deposit' | 'withdrawal' | 'entry_fee' | 'prize' | 'refund' | 'sponsor_reward';
    referenceId?: string;
    metadata?: Record<string, unknown>;
    fraudFlag?: boolean;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, amount_cents, type, reference_id, metadata, fraud_flag)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          params.walletId,
          params.amountCents,
          params.type,
          params.referenceId ?? null,
          JSON.stringify(params.metadata ?? {}),
          params.fraudFlag ?? false,
        ],
      );
      await client.query(
        `UPDATE wallets SET balance_cents = balance_cents + $1 WHERE id = $2`,
        [params.amountCents, params.walletId],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
