/**
 * Wearable integration layer (Apple Health, Google Fit, Garmin, Fitbit).
 * Implement platform-specific bridges and normalize to RunRace metrics.
 */
export interface WearableMetrics {
  heartRateBpm?: number;
  cadenceSpm?: number;
  distanceM?: number;
  source: 'apple_health' | 'google_fit' | 'garmin' | 'fitbit' | 'apple_watch';
}

export async function fetchLatestWearableMetrics(): Promise<WearableMetrics | null> {
  // TODO: HealthKit / Health Connect native modules
  return null;
}
