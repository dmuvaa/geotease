import type { GameMode } from "@/types/challenge";

export type PlayerProgress = {
  gamesCompleted: number;
  roundsCompleted: number;
  bestScore: number;
  dailyDates: string[];
  dailyCompletions: string[];
};

const KEY = "geotease-progress-v1";
export const PROGRESS_EVENT = "geotease-progress";
export const EMPTY_PROGRESS: PlayerProgress = {
  gamesCompleted: 0,
  roundsCompleted: 0,
  bestScore: 0,
  dailyDates: [],
  dailyCompletions: [],
};

let cachedRaw: string | null | undefined;
let cachedProgress = EMPTY_PROGRESS;

export function readProgress(): PlayerProgress {
  if (typeof window === "undefined") {
    return EMPTY_PROGRESS;
  }
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) {
    return cachedProgress;
  }
  cachedRaw = raw;
  if (!raw) {
    cachedProgress = EMPTY_PROGRESS;
    return cachedProgress;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    cachedProgress = {
      gamesCompleted: Math.max(0, Number(parsed.gamesCompleted) || 0),
      roundsCompleted: Math.max(0, Number(parsed.roundsCompleted) || 0),
      bestScore: Math.max(0, Number(parsed.bestScore) || 0),
      dailyDates: Array.isArray(parsed.dailyDates)
        ? parsed.dailyDates.filter((date): date is string => typeof date === "string").slice(-60)
        : [],
      dailyCompletions: Array.isArray(parsed.dailyCompletions)
        ? parsed.dailyCompletions.filter((entry): entry is string => typeof entry === "string").slice(-180)
        : [],
    };
  } catch {
    cachedProgress = EMPTY_PROGRESS;
  }
  return cachedProgress;
}

export function recordRound(input: {
  sessionScore: number;
  finished: boolean;
  daily: boolean;
  dateKey: string;
  mode: GameMode;
}) {
  const current = readProgress();
  const dailyDates =
    input.daily && input.finished && !current.dailyDates.includes(input.dateKey)
      ? [...current.dailyDates, input.dateKey].slice(-60)
      : current.dailyDates;
  const completion = `${input.dateKey}:${input.mode}`;
  const dailyCompletions =
    input.daily && input.finished && !current.dailyCompletions.includes(completion)
      ? [...current.dailyCompletions, completion].slice(-180)
      : current.dailyCompletions;
  const next: PlayerProgress = {
    gamesCompleted: current.gamesCompleted + (input.finished ? 1 : 0),
    roundsCompleted: current.roundsCompleted + 1,
    bestScore: input.finished ? Math.max(current.bestScore, input.sessionScore) : current.bestScore,
    dailyDates,
    dailyCompletions,
  };
  const raw = JSON.stringify(next);
  localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedProgress = next;
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function currentDailyStreak(progress: PlayerProgress, today: string) {
  const dates = new Set(progress.dailyDates);
  const cursor = new Date(`${today}T00:00:00.000Z`);
  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
