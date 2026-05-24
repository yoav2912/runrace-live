import type { LeagueTier } from '@runrace/shared';
import { colors } from './colors';

export function leagueColor(league?: LeagueTier): string {
  switch (league) {
    case 'elite':
      return colors.platinum;
    case 'platinum':
      return colors.platinum;
    case 'gold':
      return colors.gold;
    case 'silver':
      return colors.silver;
    case 'bronze':
    default:
      return colors.bronze;
  }
}

export function leagueLabel(league?: LeagueTier): string {
  if (!league) return 'Bronze';
  return league.charAt(0).toUpperCase() + league.slice(1);
}
