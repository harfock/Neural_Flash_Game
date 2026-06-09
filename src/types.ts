export interface Profile {
  id: string;
  name: string;
  maxLvl: number;
  ownerId: string;
  createdAt: any; // Firestore Timestamp or Date
  updatedAt: any;
}

export interface GameHistory {
  id: string;
  profileId: string;
  level: number;
  score: number;
  livesRemaining: number;
  clicks: string[];
  timestamp: any;
  ownerId: string;
}

export type GameStatus = 'idle' | 'mem' | 'play' | 'win' | 'fail';

export interface Cell {
  id: number;
  label: string; // Dynamic label like uppercase letters or numbers
  color: string; // Vibrant hex color mapped to make nearby colors very different
  isTarget: boolean;
  status: 'none' | 'correct' | 'wrong';
}

export interface ClickRecord {
  timestamp: number;
  cellId: number;
  label: string;
  isCorrect: boolean;
  livesAfter: number;
}
