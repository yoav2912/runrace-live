import { create } from 'zustand';
import type { LiveRace } from '@runrace/shared';
import { RACE_DISTANCE_PRESETS } from '@runrace/shared';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useRaceStore } from './raceStore';

export const MATCHMAKING_DISTANCES = RACE_DISTANCE_PRESETS.map((p) => ({
  meters: p.meters,
  labelHe:
    p.meters === 1000 ? '1 ק"מ' : p.meters === 5000 ? '5 ק"מ' : p.meters === 10000 ? '10 ק"מ' : p.label,
  subtitle:
    p.meters >= 10000 ? '~60 דק׳' : p.meters >= 5000 ? '~30 דק׳' : '~8 דק׳',
}));

type Status = 'idle' | 'searching';

interface MatchmakingState {
  counts: Record<number, number>;
  status: Status;
  selectedDistanceM: number | null;
  searchers: number;
  error: string | null;
  listenersAttached: boolean;
  startWatching: () => Promise<void>;
  stopWatching: () => Promise<void>;
  joinDistance: (distanceM: number) => Promise<LiveRace | null>;
  leaveQueue: () => Promise<void>;
}

async function attachListeners(
  set: (partial: Partial<MatchmakingState>) => void,
  get: () => MatchmakingState,
): Promise<void> {
  const socket = await getSocket();

  socket.off('matchmaking:stats');
  socket.off('matchmaking:matched');

  socket.on('matchmaking:stats', ({ counts }) => {
    const { selectedDistanceM, status } = get();
    set({
      counts,
      searchers:
        status === 'searching' && selectedDistanceM
          ? (counts[selectedDistanceM] ?? 0)
          : get().searchers,
    });
  });

  socket.on('matchmaking:matched', async ({ race }) => {
    set({ status: 'idle', selectedDistanceM: null, searchers: 0 });
    await useRaceStore.getState().enterRace(race);
  });

  set({ listenersAttached: true });
}

export const useMatchmakingStore = create<MatchmakingState>((set, get) => ({
  counts: Object.fromEntries(MATCHMAKING_DISTANCES.map((d) => [d.meters, 0])),
  status: 'idle',
  selectedDistanceM: null,
  searchers: 0,
  error: null,
  listenersAttached: false,

  startWatching: async () => {
    try {
      const stats = await api<{ counts: Record<number, number> }>('/api/races/matchmaking/stats');
      set({ counts: stats.counts, error: null });
    } catch {
      /* offline — socket may still work */
    }

    const socket = await getSocket();
    socket.emit('matchmaking:watch');
    await attachListeners(set, get);
  },

  stopWatching: async () => {
    const socket = await getSocket();
    socket.emit('matchmaking:unwatch');
    socket.off('matchmaking:stats');
    socket.off('matchmaking:matched');
    set({ listenersAttached: false, status: 'idle', selectedDistanceM: null });
  },

  joinDistance: async (distanceM) => {
    set({ error: null, selectedDistanceM: distanceM, status: 'searching' });

    const socket = await getSocket();
    return new Promise((resolve, reject) => {
      socket.emit('matchmaking:join', { distanceM }, async (res) => {
        if (!res.ok) {
          set({ status: 'idle', selectedDistanceM: null, error: res.error ?? 'שגיאה בהצטרפות' });
          reject(new Error(res.error));
          return;
        }

        if (res.status === 'matched' && res.race) {
          set({ status: 'idle', selectedDistanceM: null, searchers: 0 });
          await useRaceStore.getState().enterRace(res.race);
          resolve(res.race);
          return;
        }

        set({
          status: 'searching',
          searchers: res.searchers ?? 0,
        });
        resolve(null);
      });
    });
  },

  leaveQueue: async () => {
    try {
      await api('/api/races/matchmaking/leave', { method: 'POST' });
    } catch {
      /* ignore */
    }
    set({ status: 'idle', selectedDistanceM: null, searchers: 0 });
  },
}));
