export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt?: string;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
}

export interface SeasonInfo {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  battlePassTier: number;
  battlePassXp: number;
}
