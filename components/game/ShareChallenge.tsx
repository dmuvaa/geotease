"use client";

import { useRef, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { trackClientEvent } from "@/lib/analytics/client";
import { copyText } from "@/lib/game/clipboard";
import type { GameMode } from "@/types/challenge";

export function ShareChallenge({
  text,
  label,
  mode,
}: {
  text: string;
  label: string;
  mode?: GameMode;
}) {
  const [state, setState] = useState<"idle" | "copied" | "shared" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  async function onShare() {
    trackClientEvent("share_clicked", mode);
    let next: "copied" | "shared" | "failed" = "failed";
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text, title: "GeoTease" });
        next = "shared";
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        next = (await copyText(text)) ? "copied" : "failed";
      }
    } else {
      next = (await copyText(text)) ? "copied" : "failed";
    }
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  }

  const message =
    state === "copied" ? "Link copied" : state === "shared" ? "Shared" : state === "failed" ? "Couldn’t copy" : label;
  return (
    <button type="button" className={buttonClass("ghost")} onClick={() => void onShare()} aria-live="polite">
      {message}
    </button>
  );
}
