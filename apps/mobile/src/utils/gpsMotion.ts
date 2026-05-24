/** סינון רעש GPS — עומד במקום לא אמור להראות 5–8 קמ"ש */

const EARTH_RADIUS_M = 6_371_000;

/** מתחת לזה — מציגים 0 קמ"ש (בערך 2.5 קמ"ש) */
export const MIN_RUN_SPEED_MPS = 0.7;

/** מרחק מינימלי בין נקודות כדי לספור מטרים */
const MIN_DISTANCE_DELTA_M = 4;

/** דיוק GPS מקסימלי לספירת תנועה */
const MAX_ACCURACY_M = 30;

/** קפיצה חד-פעמית מעל זה — מתעלמים (זיהוי קפיצת GPS) */
const MAX_SEGMENT_M = 40;

export interface GpsMotionState {
  lat: number;
  lng: number;
  timestamp: number;
  initialized: boolean;
}

export interface ProcessedGps {
  lat: number;
  lng: number;
  speedMps: number;
  /** מרחק מצטבר לשליחה לשרת (מטרים) */
  distanceDeltaM: number;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function createGpsMotionState(): GpsMotionState {
  return { lat: 0, lng: 0, timestamp: 0, initialized: false };
}

/**
 * מחשב מהירות ומרחק מנקודה קודמת (לא סומכים רק על coords.speed של המכשיר).
 */
export function processGpsSample(
  state: GpsMotionState,
  lat: number,
  lng: number,
  timestamp: number,
  deviceSpeedMps: number | null | undefined,
  accuracyM: number,
): ProcessedGps {
  if (!state.initialized) {
    state.lat = lat;
    state.lng = lng;
    state.timestamp = timestamp;
    state.initialized = true;
    return { lat, lng, speedMps: 0, distanceDeltaM: 0 };
  }

  const dtSec = Math.max(0.5, (timestamp - state.timestamp) / 1000);
  const segmentM = haversineM(state.lat, state.lng, lat, lng);
  const derivedSpeedMps = segmentM / dtSec;

  const accuracyOk = accuracyM <= MAX_ACCURACY_M;
  let distanceDeltaM = 0;

  if (
    accuracyOk &&
    segmentM >= MIN_DISTANCE_DELTA_M &&
    segmentM <= MAX_SEGMENT_M &&
    derivedSpeedMps >= MIN_RUN_SPEED_MPS
  ) {
    distanceDeltaM = segmentM;
  }

  let speedMps = derivedSpeedMps;
  if (deviceSpeedMps != null && deviceSpeedMps > 0 && accuracyOk) {
    speedMps = Math.min(deviceSpeedMps, derivedSpeedMps > 0 ? derivedSpeedMps * 1.5 : deviceSpeedMps);
  }

  if (speedMps < MIN_RUN_SPEED_MPS || !accuracyOk) {
    speedMps = 0;
  }

  state.lat = lat;
  state.lng = lng;
  state.timestamp = timestamp;

  return { lat, lng, speedMps, distanceDeltaM };
}

export function displaySpeedMps(mps: number): number {
  return mps >= MIN_RUN_SPEED_MPS ? mps : 0;
}
