import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@runrace/shared';
import { useLiveGpsStore } from '@/store/liveGpsStore';
import {
  createGpsMotionState,
  processGpsSample,
  type GpsMotionState,
} from '@/utils/gpsMotion';
import { createStepCadenceDetector, type StepCadenceDetector } from '@/utils/stepCadence';

export interface TrackerOptions {
  raceId: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  onWarning?: (message: string, strikes: number, maxStrikes: number) => void;
  onDisqualified?: (message: string) => void;
}

let watchSub: Location.LocationSubscription | null = null;
let accelSub: { remove: () => void } | null = null;
let lastAccel = { x: 0, y: 0, z: 0 };
let motionState: GpsMotionState = createGpsMotionState();
let stepDetector: StepCadenceDetector = createStepCadenceDetector();

function isMockLocation(loc: Location.LocationObject): boolean {
  return loc.mocked === true;
}

export async function startRaceTracking(opts: TrackerOptions): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission required');

  motionState = createGpsMotionState();
  stepDetector = createStepCadenceDetector();

  accelSub = Accelerometer.addListener((data) => {
    lastAccel = data;
    const ts = Date.now();
    stepDetector.feed(data.x, data.y, data.z, ts);
  });
  Accelerometer.setUpdateInterval(50);

  watchSub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 5,
      timeInterval: 2000,
    },
    (loc) => {
      const processed = processGpsSample(
        motionState,
        loc.coords.latitude,
        loc.coords.longitude,
        loc.timestamp,
        loc.coords.speed,
        loc.coords.accuracy ?? 50,
      );

      useLiveGpsStore.getState().setPosition(
        processed.lat,
        processed.lng,
        processed.speedMps,
        loc.coords.heading ?? null,
      );

      const now = Date.now();
      const cadenceReliable = stepDetector.isReliable(now);
      const cadenceSpm = cadenceReliable ? stepDetector.getCadenceSpm(now) : undefined;

      opts.socket.emit('gps:update', {
        raceId: opts.raceId,
        lat: processed.lat,
        lng: processed.lng,
        accuracyM: loc.coords.accuracy ?? 25,
        speedMps: processed.speedMps > 0 ? processed.speedMps : undefined,
        heading: loc.coords.heading ?? undefined,
        altitudeM: loc.coords.altitude ?? undefined,
        timestamp: loc.timestamp,
        sensors: {
          accelX: lastAccel.x,
          accelY: lastAccel.y,
          accelZ: lastAccel.z,
          cadenceSpm,
          cadenceReliable,
          isMockLocation: isMockLocation(loc),
          isRooted: false,
        },
      });
    },
  );

  opts.socket.off('anti-cheat:warning');
  opts.socket.off('anti-cheat:disqualified');

  opts.socket.on('anti-cheat:warning', ({ message, strikes, maxStrikes }) => {
    opts.onWarning?.(message, strikes, maxStrikes);
  });

  opts.socket.on('anti-cheat:disqualified', ({ message }) => {
    opts.onDisqualified?.(message);
  });
}

export function stopRaceTracking(): void {
  watchSub?.remove();
  watchSub = null;
  accelSub?.remove();
  accelSub = null;
  motionState = createGpsMotionState();
  stepDetector.reset();
  useLiveGpsStore.getState().reset();
}
