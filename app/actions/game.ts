"use server";

import { loadRound, revealNextClue, submitGuess } from "@/lib/game/engine";
import { isGameMode } from "@/lib/game/modes";
import { isMapLevel } from "@/lib/map/labels";

export async function startRound(input: {
  mode: string;
  daily: boolean;
  continuation?: string | null;
  difficulty?: string | null;
}) {
  if (!isGameMode(input.mode)) {
    return { ok: false as const, error: "Choose a game mode to begin." };
  }
  return loadRound({
    mode: input.mode,
    daily: Boolean(input.daily),
    continuation: input.continuation,
    difficulty: isMapLevel(input.difficulty) ? input.difficulty : null,
  });
}

export async function revealClue(token: string) {
  if (!token) {
    return { ok: false as const, error: "This round expired. Start again." };
  }
  return revealNextClue(token);
}

export async function submitRoundGuess(input: {
  token: string;
  latitude: number;
  longitude: number;
  displayName?: string;
}) {
  return submitGuess(input);
}
