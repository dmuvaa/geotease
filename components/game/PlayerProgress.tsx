"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_PROGRESS,
  PROGRESS_EVENT,
  currentDailyStreak,
  readProgress,
} from "@/lib/game/progress";
import { formatPoints } from "@/lib/game/format";

function subscribe(callback: () => void) {
  window.addEventListener(PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function PlayerProgress({ today }: { today: string }) {
  const progress = useSyncExternalStore(subscribe, readProgress, () => EMPTY_PROGRESS);
  const streak = currentDailyStreak(progress, today);

  if (progress.roundsCompleted === 0) {
    return <p className="text-sm text-muted">Your completed rounds and best score will appear here.</p>;
  }

  return (
    <dl className="grid grid-cols-3 divide-x divide-line border-y border-line py-4">
      <div className="pr-4">
        <dt className="text-sm text-muted">Rounds</dt>
        <dd className="mt-1 font-serif text-3xl">{progress.roundsCompleted}</dd>
      </div>
      <div className="px-4">
        <dt className="text-sm text-muted">Best game</dt>
        <dd className="mt-1 font-serif text-3xl">{formatPoints(progress.bestScore)}</dd>
      </div>
      <div className="pl-4">
        <dt className="text-sm text-muted">Daily streak</dt>
        <dd className="mt-1 font-serif text-3xl">{streak}</dd>
      </div>
    </dl>
  );
}
