const violatedKeys = new Set<string>();

export function strikeKey(raceId: string, userId: string): string {
  return `${raceId}:${userId}`;
}

export function markRaceViolation(raceId: string, userId: string): void {
  violatedKeys.add(strikeKey(raceId, userId));
}

export function hadRaceViolation(raceId: string, userId: string): boolean {
  return violatedKeys.has(strikeKey(raceId, userId));
}

export function clearRaceViolations(raceId: string): void {
  const prefix = `${raceId}:`;
  for (const key of violatedKeys) {
    if (key.startsWith(prefix)) violatedKeys.delete(key);
  }
}
