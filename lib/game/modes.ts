import type { GameMode } from "@/types/challenge";

export type ModeInfo = {
  id: GameMode;
  slug: string;
  emoji: string;
  title: string;
  summary: string;
  detail: string;
};

export const MODES: readonly ModeInfo[] = [
  {
    id: "where_is_it",
    slug: "where-is-it",
    emoji: "🕵️",
    title: "Where Is It?",
    summary: "Follow the clues. Find the place.",
    detail:
      "A location is described in stages. Reveal another clue, or pin it while the score multiplier is still high.",
  },
  {
    id: "find_it",
    slug: "find-it",
    emoji: "🌎",
    title: "Find It on the Map",
    summary: "Use geography to pinpoint the answer.",
    detail:
      "A direction, a border, a capital, a confluence. The instruction is the puzzle, and the map is how you answer.",
  },
  {
    id: "where_did_this_happen",
    slug: "where-did-this-happen",
    emoji: "🌐",
    title: "Where Did This Happen?",
    summary: "Discover where history happened.",
    detail:
      "An event, a discovery, a game, a treaty. Find the place it happened, not just the name in your head.",
  },
] as const;

export function getMode(id: GameMode) {
  const mode = MODES.find((item) => item.id === id);
  if (!mode) {
    throw new Error(`Unknown mode ${id}`);
  }
  return mode;
}

export function getModeBySlug(slug: string) {
  return MODES.find((item) => item.slug === slug);
}

export function isGameMode(value: string): value is GameMode {
  return MODES.some((item) => item.id === value);
}
