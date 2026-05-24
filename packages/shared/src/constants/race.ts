export const RACE_DISTANCE_PRESETS = [
  { label: '1K Sprint', meters: 1000 },
  { label: '5K', meters: 5000 },
  { label: '10K', meters: 10000 },
] as const;

export const RACE_TIME_PRESETS = [
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
] as const;

/** ~25 km/h — מעל זה נחשב רכב / רמאות */
export const MAX_GPS_SPEED_MPS = 25 / 3.6;
/** ~20 km/h — מעל זה חשוד (אופניים / ריצה חריגה) */
export const BIKE_SPEED_MPS = 20 / 3.6;
export const SPRINT_MAX_SPEED_MPS = 20 / 3.6;
export const GPS_JUMP_THRESHOLD_M = 80;
export const MIN_TRUST_SCORE_RACE = 40;
/** אזהרות לפני פסילה מהמירוץ */
export const CHEAT_MAX_STRIKES = 3;

/** מעל ~10 קמ"ש — חייבים לראות צעדי ריצה בחיישן */
export const MIN_SPEED_REQUIRE_CADENCE_MPS = 10 / 3.6;
/** מתחת לזה — נחשב "אין ריצה" (רכב / טלפון על מושב) */
export const MIN_RUNNING_CADENCE_SPM = 95;
