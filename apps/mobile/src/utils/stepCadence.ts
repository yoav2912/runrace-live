/**
 * Step detection from accelerometer — running produces periodic peaks (~150–180 spm).
 * Used to block vehicle / smooth movement without foot strikes.
 */

const MIN_STEP_INTERVAL_MS = 280;
const PEAK_THRESHOLD = 0.11;
const CADENCE_WINDOW_MS = 18_000;
const WARMUP_MS = 12_000;

export interface StepCadenceDetector {
  feed: (x: number, y: number, z: number, timestampMs: number) => void;
  /** Steps per minute in recent window; 0 if no steps detected. */
  getCadenceSpm: (nowMs: number) => number;
  /** Enough samples elapsed to trust cadence for anti-cheat. */
  isReliable: (nowMs: number) => boolean;
  reset: () => void;
}

export function createStepCadenceDetector(): StepCadenceDetector {
  let smoothed = 1;
  let prevDelta = 0;
  let startedAt = 0;
  const stepTimestamps: number[] = [];

  const prune = (nowMs: number) => {
    const cutoff = nowMs - CADENCE_WINDOW_MS;
    while (stepTimestamps.length > 0 && stepTimestamps[0] < cutoff) {
      stepTimestamps.shift();
    }
  };

  return {
    reset() {
      smoothed = 1;
      prevDelta = 0;
      startedAt = 0;
      stepTimestamps.length = 0;
    },

    feed(x, y, z, timestampMs) {
      if (!startedAt) startedAt = timestampMs;

      const mag = Math.sqrt(x * x + y * y + z * z);
      smoothed = smoothed * 0.82 + mag * 0.18;
      const delta = mag - smoothed;

      const isPeak =
        prevDelta > PEAK_THRESHOLD && delta < prevDelta && prevDelta >= PEAK_THRESHOLD;

      if (isPeak) {
        const last = stepTimestamps[stepTimestamps.length - 1];
        if (!last || timestampMs - last >= MIN_STEP_INTERVAL_MS) {
          stepTimestamps.push(timestampMs);
          prune(timestampMs);
        }
      }

      prevDelta = delta;
    },

    getCadenceSpm(nowMs) {
      prune(nowMs);
      if (stepTimestamps.length < 3) return 0;

      const first = stepTimestamps[0];
      const last = stepTimestamps[stepTimestamps.length - 1];
      const spanMin = (last - first) / 60_000;
      if (spanMin < 0.15) return 0;

      return (stepTimestamps.length - 1) / spanMin;
    },

    isReliable(nowMs) {
      return startedAt > 0 && nowMs - startedAt >= WARMUP_MS;
    },
  };
}
