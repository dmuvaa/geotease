"use client";

import { useId, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import {
  type MapLevel,
  MAP_LEVELS,
  labelTierCaption,
  labelTierFor,
  mapLevelFromChallenge,
} from "@/lib/map/labels";
import type { Difficulty } from "@/types/location";

const STORAGE_KEY = "geotease-difficulty";
const LEGACY_KEY = "geotease-map-level";
const EVENT = "geotease-difficulty";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function readStored() {
  const value = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  return null;
}

export function usePreferredDifficulty(fallback: Difficulty | null = null) {
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  return stored ?? mapLevelFromChallenge(fallback);
}

export function MapLevelControl({
  fallback,
}: {
  fallback: Difficulty | null;
  variant: "bar";
}) {
  const level = usePreferredDifficulty(fallback);
  const caption = labelTierCaption(labelTierFor(level));
  const description =
    level === "easy"
      ? `Familiar places; ${caption.toLowerCase()} shown`
      : level === "medium"
        ? `Regional knowledge; ${caption.toLowerCase()} shown`
        : `Hard and expert places; ${caption.toLowerCase()} only`;
  const labelId = useId();

  function choose(next: MapLevel) {
    localStorage.setItem(STORAGE_KEY, next);
    localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p id={labelId} className="text-sm font-medium">
        Difficulty
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="grid grid-cols-3 gap-1 rounded-full border border-line bg-paper p-1"
      >
        {MAP_LEVELS.map((option) => {
          const selected = option === level;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => choose(option)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm capitalize transition",
                selected ? "bg-ink text-paper" : "text-muted hover:text-ink",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}
