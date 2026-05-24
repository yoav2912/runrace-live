import type { CheatFlagType } from '../types/anti-cheat';
import { CHEAT_MAX_STRIKES, MIN_TRUST_SCORE_RACE } from '../constants/race';
import { TRUST_FLAG_ESTIMATED_DROP } from '../constants/trust';

export interface AntiCheatWarningDetails {
  reason: string;
  strikes: number;
  maxStrikes: number;
  trustDelta: number;
  trustScoreAfter: number;
  flags: CheatFlagType[];
}

function estimatedDropFromFlags(flags: CheatFlagType[]): number {
  if (flags.length === 0) return 0;
  const drops = flags
    .map((f) => TRUST_FLAG_ESTIMATED_DROP[f])
    .filter((n): n is number => n !== undefined);
  if (drops.length === 0) return 0;
  return Math.max(...drops);
}

/** טקסט מלא לאזהרה במסך המירוץ */
export function buildAntiCheatWarningMessage(d: AntiCheatWarningDetails): string {
  const lost = Math.abs(d.trustDelta);
  const est = estimatedDropFromFlags(d.flags);
  const lines: string[] = [
    `⚠️ ${d.reason}`,
    `אזהרה ${d.strikes}/${d.maxStrikes} — עוד ${d.maxStrikes - d.strikes} עד פסילה`,
    `ציון אמון: −${lost} (עכשיו ${Math.round(d.trustScoreAfter)})`,
  ];
  if (est > 0 && est !== lost) {
    lines.push(`(לפי סוג הזיהוי, טיפוסית בערך ${est} נקודות)`);
  }
  return lines.join('\n');
}

/** תווית בעברית לרשומת היסטוריית אמון */
export function trustReasonHe(reason: string | null | undefined): string {
  if (!reason) return 'עדכון ציון אמון';
  if (reason === 'gps_validation_failed') return 'אזהרת GPS / אנטי-צ\'יט';
  if (reason === 'clean_race_complete') return 'מירוץ נקי הושלם';
  return reason;
}

export function buildAntiCheatDisqualifiedMessage(
  trustDelta: number,
  trustScoreAfter: number,
): string {
  const lost = Math.abs(trustDelta);
  return `פסילה מהמירוץ\nציון אמון: −${lost} (עכשיו ${Math.round(trustScoreAfter)})\nמתחת 40? לא תוכל להצטרף למירוץ חדש`;
}

export function trustScoreStatusHe(score: number): string {
  if (score >= 80) return 'מצוין — אמון גבוה';
  if (score >= 60) return 'טוב — היזהר מעוד אזהרות';
  if (score >= MIN_TRUST_SCORE_RACE) return 'נמוך — עוד אזהרה עלולה לחסום מירוצים';
  return 'נמוך מדי — לא ניתן להצטרף למירוץ';
}
