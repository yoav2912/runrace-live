import type { AntiCheatResult, CheatFlagType, GpsSample, SensorSample } from '@runrace/shared';
import {
  BIKE_SPEED_MPS,
  GPS_JUMP_THRESHOLD_M,
  MAX_GPS_SPEED_MPS,
  MIN_RUNNING_CADENCE_SPM,
  MIN_SPEED_REQUIRE_CADENCE_MPS,
  SPRINT_MAX_SPEED_MPS,
} from '@runrace/shared';
import { haversineDistanceM } from '../../utils/geo';

export interface AntiCheatContext {
  raceType: string;
  previousSamples: GpsSample[];
  trustScore: number;
  isMockLocation?: boolean;
  isRooted?: boolean;
  cadenceReliable?: boolean;
}

/**
 * Multilayer server-side anti-cheat engine.
 * Architecture ready for ML pipeline via ML_CHEAT_WEBHOOK_URL.
 */
export class AntiCheatEngine {
  validateGpsUpdate(
    sample: GpsSample,
    sensor: SensorSample | undefined,
    ctx: AntiCheatContext,
  ): AntiCheatResult {
    const flags: CheatFlagType[] = [];
    let confidence = 0;

    if (ctx.isMockLocation || sample.accuracyM < 0) {
      flags.push('mock_location');
      confidence += 0.55;
    }

    if (ctx.isRooted) {
      flags.push('root_jailbreak');
      confidence += 0.25;
    }

    const prev = ctx.previousSamples[ctx.previousSamples.length - 1];
    let peakSpeed = sample.speedMps ?? 0;
    if (prev) {
      const dtSec = Math.max(0.5, (sample.timestamp - prev.timestamp) / 1000);
      const distM = haversineDistanceM(prev.lat, prev.lng, sample.lat, sample.lng);
      const impliedSpeed = distM / dtSec;
      const reportedSpeed = sample.speedMps ?? 0;
      peakSpeed = Math.max(impliedSpeed, reportedSpeed);

      if (distM > GPS_JUMP_THRESHOLD_M && dtSec < 5) {
        flags.push('gps_jump');
        confidence += 0.4;
      }

      if (peakSpeed > MAX_GPS_SPEED_MPS) {
        flags.push('impossible_speed');
        flags.push('vehicle_detected');
        confidence += 0.55;
      } else if (peakSpeed > BIKE_SPEED_MPS) {
        flags.push('bike_detected');
        confidence += 0.35;
      }

      if (ctx.raceType === 'sprint' && peakSpeed > SPRINT_MAX_SPEED_MPS) {
        flags.push('impossible_speed');
        confidence += 0.25;
      }

      if (distM > 15 && dtSec < 2 && impliedSpeed > 3.5) {
        const accel = impliedSpeed / dtSec;
        if (accel > 3.5) {
          flags.push('acceleration_anomaly');
          confidence += 0.25;
        }
      }

      if (this.isLinearPattern(ctx.previousSamples, sample)) {
        flags.push('linear_pattern');
        confidence += 0.2;
      }

      if (distM > 120 && dtSec < 3) {
        flags.push('teleport');
        confidence += 0.55;
      }
    }

    if (sensor) {
      const magnitude = Math.sqrt(sensor.accelX ** 2 + sensor.accelY ** 2 + sensor.accelZ ** 2);
      const moving = peakSpeed > 1.2;
      if (moving && magnitude < 0.35) {
        flags.push('sensor_mismatch');
        confidence += 0.35;
      }

      const cadenceReliable = ctx.cadenceReliable ?? false;
      const cadence = sensor.cadenceSpm ?? 0;
      if (
        cadenceReliable &&
        peakSpeed >= MIN_SPEED_REQUIRE_CADENCE_MPS &&
        cadence < MIN_RUNNING_CADENCE_SPM
      ) {
        flags.push('no_running_cadence');
        confidence += 0.52;
      }
    }

    if (sample.accuracyM > 50) {
      confidence += 0.08;
    }

    confidence = Math.min(1, confidence);
    const trustDelta = -Math.round(confidence * 18);
    const allowed = confidence < 0.55 && ctx.trustScore + trustDelta >= 0;

    return {
      confidence,
      trustDelta,
      flags: [...new Set(flags)],
      allowed,
      reason: allowed ? undefined : this.reasonFromFlags(flags),
    };
  }

  private reasonFromFlags(flags: CheatFlagType[]): string {
    if (flags.includes('mock_location')) return 'מיקום מזויף זוהה';
    if (flags.includes('vehicle_detected')) return 'מהירות תואמת רכב — לא ריצה';
    if (flags.includes('teleport') || flags.includes('gps_jump')) return 'קפיצת מיקום חשודה';
    if (flags.includes('no_running_cadence')) return 'תנועה מהירה בלי צעדי ריצה';
    if (flags.includes('bike_detected')) return 'מהירות חשודה לריצה';
    if (flags.includes('sensor_mismatch')) return 'חיישני תנועה לא תואמים';
    return 'תנועה לא עברה אימות אמינות';
  }

  private isLinearPattern(history: GpsSample[], current: GpsSample): boolean {
    const recent = [...history.slice(-8), current];
    if (recent.length < 5) return false;

    const bearings: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      const a = recent[i - 1];
      const b = recent[i];
      const y = Math.sin(((b.lng - a.lng) * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180);
      const x =
        Math.cos((a.lat * Math.PI) / 180) * Math.sin((b.lat * Math.PI) / 180) -
        Math.sin((a.lat * Math.PI) / 180) *
          Math.cos((b.lat * Math.PI) / 180) *
          Math.cos(((b.lng - a.lng) * Math.PI) / 180);
      bearings.push((Math.atan2(y, x) * 180) / Math.PI);
    }

    const variance =
      bearings.reduce((s, b) => s + Math.abs(b - bearings[0]), 0) / bearings.length;
    const speeds = recent.map((s) => s.speedMps ?? 0).filter((v) => v > 0);
    const speedVariance =
      speeds.length > 2
        ? speeds.reduce((s, v) => s + Math.abs(v - speeds[0]), 0) / speeds.length
        : 999;

    return variance < 2 && speedVariance < 0.15;
  }

  async enqueueMlAnalysis(payload: {
    userId: string;
    raceId: string;
    samples: GpsSample[];
    flags: CheatFlagType[];
  }): Promise<void> {
    const url = process.env.ML_CHEAT_WEBHOOK_URL;
    if (!url) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      /* non-blocking */
    }
  }
}

export const antiCheatEngine = new AntiCheatEngine();
