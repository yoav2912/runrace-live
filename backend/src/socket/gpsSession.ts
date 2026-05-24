import type { GpsSample } from '@runrace/shared';

export const gpsHistoryByUser = new Map<string, GpsSample[]>();
export const cheatStrikesByUser = new Map<string, number>();

export function sessionKey(raceId: string, userId: string): string {
  return `${raceId}:${userId}`;
}

export function clearRaceSession(raceId: string, userIds: string[]): void {
  for (const userId of userIds) {
    const key = sessionKey(raceId, userId);
    gpsHistoryByUser.delete(key);
    cheatStrikesByUser.delete(key);
  }
}
