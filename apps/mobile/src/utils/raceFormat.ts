export function mpsToKmh(mps: number): number {
  if (!mps || mps < 0) return 0;
  return mps * 3.6;
}

export function kmRemaining(targetDistanceM: number | undefined, distanceM: number): number {
  if (!targetDistanceM || targetDistanceM <= 0) return 0;
  return Math.max(0, (targetDistanceM - distanceM) / 1000);
}

export function formatKm(km: number): string {
  return km.toFixed(2);
}

export function formatSpeedKmh(mps: number): string {
  return mpsToKmh(mps).toFixed(1);
}

export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function raceElapsedSec(
  startedAt?: string,
  finishTime?: string,
  raceFinishedAt?: string,
): number {
  if (!startedAt) return 0;
  const start = new Date(startedAt).getTime();
  const end = finishTime
    ? new Date(finishTime).getTime()
    : raceFinishedAt
      ? new Date(raceFinishedAt).getTime()
      : Date.now();
  return Math.max(1, Math.round((end - start) / 1000));
}

export function avgSpeedKmhFromRace(distanceM: number, elapsedSec: number): number {
  if (elapsedSec <= 0 || distanceM <= 0) return 0;
  return distanceM / 1000 / (elapsedSec / 3600);
}

/** זמן + מהירות ממוצעת לתצוגה (מונע 300+ קמ"ש מכפתור בדיקה) */
export function computeDisplayRaceStats(
  distanceM: number,
  startedAt?: string,
  finishTime?: string,
  raceFinishedAt?: string,
  paceSecPerKm?: number,
): { elapsedSec: number; avgKmh: number } {
  const km = distanceM / 1000;
  let elapsedSec = raceElapsedSec(startedAt, finishTime, raceFinishedAt);

  const minElapsedSec = Math.max(45, km * 180);
  if (km > 0 && elapsedSec < minElapsedSec) {
    elapsedSec = minElapsedSec;
  }

  let avgKmh = avgSpeedKmhFromRace(distanceM, elapsedSec);

  if (paceSecPerKm && paceSecPerKm >= 150 && paceSecPerKm <= 900) {
    avgKmh = 3600 / paceSecPerKm;
    elapsedSec = Math.max(elapsedSec, km * paceSecPerKm);
  }

  const MAX_RUN_KMH = 22;
  if (avgKmh > MAX_RUN_KMH) {
    avgKmh = MAX_RUN_KMH;
    elapsedSec = Math.max(elapsedSec, (km / MAX_RUN_KMH) * 3600);
  }

  return { elapsedSec, avgKmh };
}
