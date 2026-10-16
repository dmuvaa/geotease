"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { trackClientEvent } from "@/lib/analytics/client";
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
  const [state, setState] = useState<"idle" | "copied" | "shared">("idle");

  async function onShare() {
    trackClientEvent("share_clicked", mode);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text, title: "GeoTease" });
        setState("shared");
      } else {
        await navigator.clipboard.writeText(text);
        setState("copied");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      await navigator.clipboard.writeText(text);
      setState("copied");
    }
    window.setTimeout(() => setState("idle"), 2000);
  }

  const message = state === "copied" ? "Link copied" : state === "shared" ? "Shared" : label;
  return (
    <button type="button" className={buttonClass("ghost")} onClick={() => void onShare()}>
      {message}
    </button>
  );
}
