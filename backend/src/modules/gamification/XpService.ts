import { leagueFromRank } from '@runrace/shared';

export function xpForRacePlacement(place: number, participantCount: number): number {
  const base = 50;
  const multiplier = Math.max(1, participantCount - place + 1);
  return base * multiplier + (place === 1 ? 100 : place <= 3 ? 50 : 0);
}

export function applyXp(currentXp: number, currentLevel: number, earned: number): {
  xp: number;
  level: number;
  leveledUp: boolean;
} {
  let xp = currentXp + earned;
  let level = currentLevel;
  let leveledUp = false;

  while (xp >= levelThreshold(level)) {
    xp -= levelThreshold(level);
    level += 1;
    leveledUp = true;
  }

  return { xp, level, leveledUp };
}

function levelThreshold(level: number): number {
  return 500 + level * 120;
}

export function eloDelta(winnerRank: number, loserRank: number, won: boolean): number {
  const k = 32;
  const expected = 1 / (1 + 10 ** ((loserRank - winnerRank) / 400));
  return Math.round(k * ((won ? 1 : 0) - expected));
}

export { leagueFromRank };
