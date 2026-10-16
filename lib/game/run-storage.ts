import { utcDateKey } from "@/lib/game/daily";
import type { SavedRun } from "@/types/game";

const KEY = "geotease-active-v1";

export function readActiveRun(): SavedRun | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SavedRun;
    if (parsed?.v !== 1 || typeof parsed.token !== "string" || !Array.isArray(parsed.clues)) {
      return null;
    }
    if (parsed.daily && parsed.dateKey !== utcDateKey()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeActiveRun(run: SavedRun) {
  sessionStorage.setItem(KEY, JSON.stringify(run));
}

export function clearActiveRun() {
  sessionStorage.removeItem(KEY);
}
