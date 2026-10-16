import type { Difficulty } from "@/types/location";

export type LabelTier = "initials" | "major" | "towns";

export type MapLevel = "easy" | "medium" | "hard";

export const MAP_LEVELS: readonly MapLevel[] = ["easy", "medium", "hard"];

export function isMapLevel(value: unknown): value is MapLevel {
  return value === "easy" || value === "medium" || value === "hard";
}

export function mapLevelFromChallenge(difficulty: Difficulty | null): MapLevel {
  if (difficulty === "easy" || difficulty === "medium") {
    return difficulty;
  }
  if (difficulty === "hard" || difficulty === "expert") {
    return "hard";
  }
  return "medium";
}

export function labelTierFor(difficulty: Difficulty | MapLevel | null): LabelTier {
  if (difficulty === "easy") {
    return "towns";
  }
  if (difficulty === "medium") {
    return "major";
  }
  return "initials";
}

export function labelTierCaption(tier: LabelTier) {
  if (tier === "towns") {
    return "Cities and towns";
  }
  if (tier === "major") {
    return "Major cities";
  }
  return "Country codes";
}
