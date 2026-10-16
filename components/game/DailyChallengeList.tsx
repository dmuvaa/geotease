"use client";

import { useSyncExternalStore } from "react";
import { ChallengeCard } from "@/components/game/ChallengeCard";
import { EMPTY_PROGRESS, PROGRESS_EVENT, readProgress } from "@/lib/game/progress";
import type { ModeInfo } from "@/lib/game/modes";

function subscribe(callback: () => void) {
  window.addEventListener(PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function DailyChallengeList({
  modes,
  dateKey,
}: {
  modes: readonly ModeInfo[];
  dateKey: string;
}) {
  const progress = useSyncExternalStore(subscribe, readProgress, () => EMPTY_PROGRESS);
  const completed = new Set(progress.dailyCompletions);
  const completedCount = modes.filter((mode) => completed.has(`${dateKey}:${mode.id}`)).length;

  return (
    <div>
      <p className="text-sm text-muted">
        {completedCount === modes.length
          ? "Today’s set is complete."
          : `${completedCount} of ${modes.length} played today`}
      </p>
      <div className="mt-4 grid md:grid-cols-3">
        {modes.map((mode) => {
          const played = completed.has(`${dateKey}:${mode.id}`);
          return (
            <ChallengeCard
              key={mode.id}
              mode={mode}
              href={`/daily/${mode.slug}`}
              action={played ? "Play again" : "Play today"}
              status={played ? "Played" : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
