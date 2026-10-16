import type { GameMode, TargetKind } from "@/types/challenge";
import type { Difficulty, LocationType } from "@/types/location";

export type GamePhase =
  | "idle"
  | "loading"
  | "playing"
  | "guess_placed"
  | "submitted"
  | "result"
  | "next_round";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ActionFailure = {
  ok: false;
  error: string;
};

export type PublicRound = {
  ok: true;
  token: string;
  mode: GameMode;
  difficulty: Difficulty;
  clue: string;
  revealed: number;
  totalClues: number;
  round: number;
  totalRounds: number;
  sessionScore: number;
  daily: boolean;
  dailyNumber: number | null;
  targetKind: TargetKind;
  dateKey: string;
};

export type RevealResult = {
  ok: true;
  token: string;
  clue: string;
  revealed: number;
  totalClues: number;
};

export type ScoreBreakdown = {
  distanceKm: number;
  distanceScore: number;
  clueMultiplier: number;
  difficultyMultiplier: number;
  score: number;
  cluesUsed: number;
  withinTolerance: boolean;
  toleranceKm: number;
};

export type RevealedLocation = {
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  type: LocationType;
  description: string;
};

export type RevealedEvent = {
  title: string;
  year: number;
  category: string;
  description: string;
};

export type GuessResult = {
  ok: true;
  breakdown: ScoreBreakdown;
  location: RevealedLocation;
  guess: Coordinates;
  event: RevealedEvent | null;
  sourceUrl: string | null;
  sessionScore: number;
  round: number;
  totalRounds: number;
  finished: boolean;
  continuation: string | null;
  shareText: string;
  daily: boolean;
  dailyNumber: number | null;
  mode: GameMode;
  difficulty: Difficulty;
};

export type RoundSummary = {
  round: number;
  locationName: string;
  country: string;
  score: number;
  distanceKm: number;
  cluesUsed: number;
};

export type SavedRun = {
  v: 1;
  mode: GameMode;
  daily: boolean;
  dateKey: string;
  token: string;
  clues: string[];
  totalClues: number;
  difficulty: Difficulty;
  targetKind: TargetKind;
  round: number;
  totalRounds: number;
  sessionScore: number;
  dailyNumber: number | null;
  summaries: RoundSummary[];
  result: GuessResult | null;
  guess: Coordinates | null;
};

export type LeaderboardView = "all" | "daily" | GameMode;

export type LeaderboardRow = {
  rank: number;
  displayName: string;
  mode: GameMode;
  score: number;
  distanceKm: number;
  cluesUsed: number;
  daily: boolean;
  yours: boolean;
};

export type LeaderboardSnapshot = {
  rows: LeaderboardRow[];
  yours: { rank: number; score: number; distanceKm: number } | null;
  dateLabel: string;
};
