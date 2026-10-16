"use client";

import { useSyncExternalStore } from "react";

const KEY = "geotease-guide-seen";
const EVENT = "geotease-guide";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function hasSeenGuide() {
  return localStorage.getItem(KEY) === "1";
}

export function FirstRunGuide() {
  const seen = useSyncExternalStore(subscribe, hasSeenGuide, () => true);

  if (seen) {
    return null;
  }

  function dismiss() {
    localStorage.setItem(KEY, "1");
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <aside className="border-y border-line py-4" aria-label="How to play">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">Your first round</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Read the clue, tap the globe to place a pin, then submit. Reveal another clue if you need it.
          </p>
        </div>
        <button type="button" onClick={dismiss} className="shrink-0 text-sm text-sea hover:underline">
          Got it
        </button>
      </div>
    </aside>
  );
}
