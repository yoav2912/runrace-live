import { create } from 'zustand';

interface LiveGpsState {
  lat: number;
  lng: number;
  speedMps: number;
  heading: number | null;
  setPosition: (lat: number, lng: number, speedMps: number, heading?: number | null) => void;
  reset: () => void;
}

export const useLiveGpsStore = create<LiveGpsState>((set) => ({
  lat: 0,
  lng: 0,
  speedMps: 0,
  heading: null,
  setPosition: (lat, lng, speedMps, heading = null) => set({ lat, lng, speedMps, heading }),
  reset: () => set({ lat: 0, lng: 0, speedMps: 0, heading: null }),
}));
