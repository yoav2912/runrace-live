import type { CheatFlagType } from '../types/anti-cheat';

/** נוסחת השרת: trustDelta = -round(confidence × 18), מקסימום בערך 18 בבת אחת */
export const TRUST_DELTA_MULTIPLIER = 18;

/** בונוס כשמסיימים מירוץ בלי הפרות אמון */
export const TRUST_BONUS_CLEAN_RACE = 5;

/** הערכת ירידה לפי דגל עיקרי (כשהוא לבד) — לתצוגה למשתמש */
export const TRUST_FLAG_ESTIMATED_DROP: Partial<Record<CheatFlagType, number>> = {
  mock_location: 10,
  vehicle_detected: 10,
  impossible_speed: 10,
  teleport: 10,
  no_running_cadence: 9,
  gps_jump: 7,
  bike_detected: 6,
  sensor_mismatch: 6,
  acceleration_anomaly: 5,
  linear_pattern: 4,
};

/** הסבר בעברית — מתי יורדים נקודות */
export const TRUST_RULES_HE: { title: string; detail: string }[] = [
  {
    title: 'בכל אזהרה במירוץ',
    detail:
      'עדכון GPS חשוד נחסם, ציון האמון יורד (בדרך כלל 4–18 נקודות לפי חומרת הזיהוי). 3 אזהרות → פסילה.',
  },
  {
    title: 'מיקום מזויף',
    detail: 'אפליקציית GPS מזויפת — בערך 10 נקודות.',
  },
  {
    title: 'מהירות רכב (>25 קמ"ש)',
    detail: 'בערך 10 נקודות. מעל 20 קמ"ש — בערך 6 נקודות (אזהרה).',
  },
  {
    title: 'תנועה מהירה בלי צעדים',
    detail: 'GPS זז אבל הטלפון לא מזהה ריצה (מעל ~10 קמ"ש) — בערך 9 נקודות.',
  },
  {
    title: 'קפיצת מיקום / טלפורט',
    detail: 'בערך 7–10 נקודות.',
  },
  {
    title: 'ציון מתחת 40',
    detail: 'לא ניתן להצטרף למירוץ חדש עד שהציון עולה (ריצות תקינות בעתיד).',
  },
  {
    title: 'מירוץ נקי הושלם',
    detail: `סיום מירוץ בלי אזהרות אמון — +${TRUST_BONUS_CLEAN_RACE} נקודות (פעם אחת למירוץ).`,
  },
];
