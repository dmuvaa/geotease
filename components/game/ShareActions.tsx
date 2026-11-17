"use client";

import { useRef, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { trackClientEvent } from "@/lib/analytics/client";
import { copyText } from "@/lib/game/clipboard";
import type { GameMode } from "@/types/challenge";
import { type ShareCardModel, renderShareCard } from "@/components/game/share-card";
import type { Proximity } from "@/lib/game/proximity";

const MARK_CLASS: Record<Proximity, string> = {
  close: "bg-correct",
  near: "bg-[#c4a15a]",
  far: "bg-pin",
  miss: "bg-ink/30",
};

type ShareState = "idle" | "copied" | "shared" | "failed";

export function ShareActions({
  text,
  card,
  mode,
  label = "Share",
  showCard = true,
}: {
  text: string;
  card: ShareCardModel;
  mode: GameMode;
  label?: string;
  showCard?: boolean;
}) {
  const [state, setState] = useState<ShareState>("idle");
  const timer = useRef<number | undefined>(undefined);

  function flash(next: ShareState) {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  }

  async function publish() {
    trackClientEvent("share_clicked", mode);
    const outcome = await shareResult(text, card);
    if (outcome !== "cancelled") {
      flash(outcome);
    }
  }

  async function copy() {
    trackClientEvent("share_clicked", mode);
    flash((await copyText(text)) ? "copied" : "failed");
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const post = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const status =
    state === "copied"
      ? "Copied to your clipboard."
      : state === "shared"
        ? "Shared."
        : state === "failed"
          ? "Couldn’t reach your clipboard. Try WhatsApp or X instead."
          : "";

  return (
    <div className="space-y-3">
      {showCard ? (
        <article className="rounded-3xl border border-line bg-paper px-5 py-4" aria-label="Share card preview. The place is not named.">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{card.kicker}</p>
          <h3 className="mt-2 font-serif text-2xl tracking-tight">{card.title}</h3>
          <p className="mt-3 font-serif text-5xl tabular-nums tracking-tight">{card.score}</p>
          <p className="mt-1 text-sm text-muted">{card.detail}</p>
          <div className="mt-4 flex gap-1.5" aria-hidden="true">
            {card.marks.map((mark, index) => (
              <span key={`${mark}-${index}`} className={`size-5 rounded-md ${MARK_CLASS[mark]}`} />
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">{card.link.replace(/^https:\/\//, "")}</p>
        </article>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass("primary")} onClick={() => void publish()}>
          {label}
        </button>
        <button type="button" className={buttonClass("ghost")} onClick={() => void copy()}>
          {state === "copied" ? "Copied" : "Copy"}
        </button>
        <a
          className={buttonClass("ghost")}
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackClientEvent("share_clicked", mode)}
        >
          WhatsApp<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a
          className={buttonClass("ghost")}
          href={post}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackClientEvent("share_clicked", mode)}
        >
          X<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <p className="min-h-5 text-sm text-muted" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

async function shareResult(text: string, card: ShareCardModel): Promise<"shared" | "copied" | "failed" | "cancelled"> {
  try {
    const blob = await renderShareCard(card);
    const file = new File([blob], "geotease.png", { type: "image/png" });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title: "GeoTease" });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
  }
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text, title: "GeoTease" });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }
  return (await copyText(text)) ? "copied" : "failed";
}
