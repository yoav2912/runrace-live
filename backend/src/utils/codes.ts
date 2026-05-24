import { customAlphabet } from 'nanoid';

const raceCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export function generateRaceCode(): string {
  return raceCode();
}
