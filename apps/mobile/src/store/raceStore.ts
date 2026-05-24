import { create } from 'zustand';
import type { LiveRace, RacerState } from '@runrace/shared';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@runrace/shared';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuthStore } from './authStore';

type RaceSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface RaceState {
  activeRace: LiveRace | null;
  leaderboard: RacerState[];
  countdown: number | null;
  cheatWarning: string | null;
  socketListenersReady: boolean;
  createRace: (config: Record<string, unknown>) => Promise<LiveRace>;
  joinByCode: (code: string) => Promise<void>;
  enterRace: (race: LiveRace) => Promise<void>;
  setReady: () => Promise<void>;
  connectLive: (raceId: string) => Promise<void>;
  devFinishRace: (winnerUserId: string) => Promise<void>;
  clear: () => void;
}

function markSelfReady(racers: RacerState[], userId: string): RacerState[] {
  return racers.map((r) => (r.userId === userId ? { ...r, ready: true } : r));
}

function attachRaceSocketListeners(
  socket: RaceSocket,
  set: (fn: (s: RaceState) => Partial<RaceState> | RaceState) => void,
  get: () => RaceState,
): void {
  if (get().socketListenersReady) return;

  socket.off('leaderboard:update');
  socket.off('race:countdown');
  socket.off('race:updated');
  socket.off('race:started');
  socket.off('race:finished');
  socket.off('anti-cheat:warning');
  socket.off('anti-cheat:disqualified');

  socket.on('race:updated', (updated) => {
    set({ activeRace: updated, leaderboard: updated.racers });
  });

  socket.on('leaderboard:update', ({ racers }) => {
    set({ leaderboard: racers });
  });

  socket.on('race:countdown', ({ secondsLeft }) => {
    set((s) => ({
      countdown: secondsLeft,
      activeRace: s.activeRace ? { ...s.activeRace, status: 'countdown' as const } : null,
    }));
  });

  socket.on('race:started', ({ startedAt }) => {
    set((s) => ({
      countdown: null,
      activeRace: s.activeRace ? { ...s.activeRace, status: 'live' as const, startedAt } : null,
    }));
  });

    socket.on('race:finished', ({ results }) => {
      set((s) => ({
        activeRace: s.activeRace
          ? {
              ...s.activeRace,
              status: 'finished' as const,
              racers: results,
              finishedAt: s.activeRace.finishedAt ?? new Date().toISOString(),
            }
          : null,
        leaderboard: results,
      }));
    });

  socket.on('anti-cheat:warning', ({ message }) => {
    set({ cheatWarning: message });
  });

  socket.on('anti-cheat:disqualified', ({ message }) => {
    set({ cheatWarning: message });
  });

  set({ socketListenersReady: true });
}

export const useRaceStore = create<RaceState>((set, get) => ({
  activeRace: null,
  leaderboard: [],
  countdown: null,
  cheatWarning: null,
  socketListenersReady: false,

  createRace: async (config) => {
    const race = await api<LiveRace>('/api/races', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    set({ activeRace: race, leaderboard: race.racers });
    await get().connectLive(race.id);
    return race;
  },

  joinByCode: async (code) => {
    const race = await api<LiveRace>('/api/races/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    set({ activeRace: race, leaderboard: race.racers });
    await get().connectLive(race.id);
  },

  enterRace: async (race) => {
    set({ activeRace: race, leaderboard: race.racers, countdown: null });
    const socket = await getSocket();
    attachRaceSocketListeners(socket, set, get);
    await get().connectLive(race.id);
  },

  setReady: async () => {
    const race = get().activeRace;
    const userId = useAuthStore.getState().user?.id;
    if (!race || !userId || race.status !== 'lobby') return;

    const me = race.racers.find((r) => r.userId === userId);
    if (me?.ready) return;

    set((s) => {
      if (!s.activeRace) return s;
      const racers = markSelfReady(s.activeRace.racers, userId);
      return { activeRace: { ...s.activeRace, racers }, leaderboard: racers };
    });

    const socket = await getSocket();
    attachRaceSocketListeners(socket, set, get);
    await get().connectLive(race.id);

    await new Promise<void>((resolve, reject) => {
      socket.emit('race:ready', { raceId: race.id }, (res) => {
        if (res && !res.ok) {
          reject(new Error(res.error ?? 'Ready failed'));
          return;
        }
        resolve();
      });
    });
  },

  connectLive: async (raceId) => {
    const socket = await getSocket();
    attachRaceSocketListeners(socket, set, get);

    await new Promise<void>((resolve, reject) => {
      socket.emit('race:join', { raceId }, (res) => {
        if (res?.ok) resolve();
        else reject(new Error(res?.error ?? 'Failed to join race room'));
      });
    });
  },

  devFinishRace: async (winnerUserId) => {
    const race = get().activeRace;
    if (!race) return;

    const { results } = await api<{ results: RacerState[] }>(
      `/api/races/${race.id}/dev/finish`,
      {
        method: 'POST',
        body: JSON.stringify({ winnerUserId }),
      },
    );

    set({
      activeRace: {
        ...race,
        status: 'finished',
        racers: results,
        finishedAt: new Date().toISOString(),
      },
      leaderboard: results,
    });
  },

  clear: () =>
    set({
      activeRace: null,
      leaderboard: [],
      countdown: null,
      cheatWarning: null,
      socketListenersReady: false,
    }),
}));
