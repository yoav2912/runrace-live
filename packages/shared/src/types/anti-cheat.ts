export type CheatFlagType =
  | 'gps_spoof'
  | 'mock_location'
  | 'impossible_speed'
  | 'vehicle_detected'
  | 'bike_detected'
  | 'gps_jump'
  | 'sensor_mismatch'
  | 'linear_pattern'
  | 'teleport'
  | 'root_jailbreak'
  | 'perfect_cadence'
  | 'no_running_cadence'
  | 'acceleration_anomaly';

export interface GpsSample {
  lat: number;
  lng: number;
  altitudeM?: number;
  accuracyM: number;
  speedMps?: number;
  heading?: number;
  timestamp: number;
}

export interface SensorSample {
  timestamp: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  cadenceSpm?: number;
  heartRateBpm?: number;
}

export interface AntiCheatResult {
  confidence: number;
  trustDelta: number;
  flags: CheatFlagType[];
  allowed: boolean;
  reason?: string;
}

export interface TrustScoreSnapshot {
  userId: string;
  score: number;
  flags: CheatFlagType[];
  updatedAt: string;
}
