import type { Difficulty } from "@/types/location";

export type GameMode = "where_is_it" | "find_it" | "where_did_this_happen";

export type ClueType =
  | "region"
  | "direction"
  | "distance"
  | "relationship"
  | "border"
  | "feature"
  | "history"
  | "culture"
  | "specific";

export type TargetKind = "exact" | "approximate";

export type Clue = {
  sequence: number;
  text: string;
  clueType: ClueType;
};

export type HistoricalEvent = {
  id: string;
  title: string;
  description: string;
  year: number;
  category: string;
  sourceUrl?: string;
};

export type Challenge = {
  id: string;
  mode: GameMode;
  locationId: string;
  title: string;
  difficulty: Difficulty;
  status: "draft" | "published";
  targetKind: TargetKind;
  toleranceKm: number;
  clues: Clue[];
  event?: HistoricalEvent;
  publishedAt: string;
  createdAt: string;
};
