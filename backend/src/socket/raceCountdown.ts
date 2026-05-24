import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@runrace/shared';
import { raceEngine } from '../modules/races/RaceEngine';

type Io = Server<ClientToServerEvents, ServerToClientEvents>;

const activeCountdowns = new Set<string>();

export function beginRaceCountdown(io: Io, raceId: string, seconds = 5): void {
  if (activeCountdowns.has(raceId)) return;

  const race = raceEngine.getRace(raceId);
  if (!race) return;

  if (!raceEngine.startCountdown(raceId, seconds)) return;

  activeCountdowns.add(raceId);

  io.to(`race:${raceId}`).emit('race:updated', raceEngine.toLiveRace(raceId)!);
  io.to(`race:${raceId}`).emit('race:countdown', { raceId, secondsLeft: seconds });

  let secondsLeft = seconds - 1;
  const interval = setInterval(() => {
    if (secondsLeft < 0) {
      clearInterval(interval);
      activeCountdowns.delete(raceId);
      raceEngine.startRace(raceId);
      io.to(`race:${raceId}`).emit('race:started', {
        raceId,
        startedAt: new Date().toISOString(),
      });
      io.to(`race:${raceId}`).emit('race:updated', raceEngine.toLiveRace(raceId)!);
      return;
    }
    io.to(`race:${raceId}`).emit('race:countdown', { raceId, secondsLeft });
    secondsLeft -= 1;
  }, 1000);
}
