"use client";

import Link from "next/link";
import { useState } from "react";
import { ShareActions } from "@/components/game/ShareActions";
import { Button } from "@/components/ui/Button";
import { trackClientEvent } from "@/lib/analytics/client";
import { formatCoordinate, formatDistance, formatMultiplier, formatPoints } from "@/lib/game/format";
import { getMode } from "@/lib/game/modes";
import { proximityOf } from "@/lib/game/proximity";
import { buildSessionShareText, buildShareText, playUrl } from "@/lib/game/share";
import type { GuessResult, RoundSummary } from "@/types/game";

async function copyOrShare(text: string, mode: GuessResult["mode"]) {
  trackClientEvent("share_clicked", mode);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text, title: "GeoTease" });
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled" as const;
      }
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied" as const;
}

export function ScoreResult({
  result,
  summaries,
  onNext,
  onReplay,
}: {
  result: GuessResult;
  summaries: RoundSummary[];
  onNext: () => void;
  onReplay: () => void;
}) {
  const [roundShare, setRoundShare] = useState<"idle" | "copied" | "shared">("idle");
  const place = `${result.location.name}, ${result.location.country}`;
  const mode = getMode(result.mode);
  const link = playUrl(result.mode, result.daily);
  const roundText = buildShareText({
    daily: result.daily,
    dailyNumber: result.dailyNumber,
    mode: result.mode,
    score: result.breakdown.score,
    distanceKm: result.breakdown.distanceKm,
    cluesUsed: result.breakdown.cluesUsed,
  });
  const sessionText = buildSessionShareText({
    mode: result.mode,
    score: result.sessionScore,
    daily: result.daily,
    dailyNumber: result.dailyNumber,
    distancesKm: summaries.map((round) => round.distanceKm),
  });
  const kicker = result.daily && result.dailyNumber ? `Daily #${result.dailyNumber}` : "GeoTease";
  const roundCard = {
    kicker,
    title: mode.title,
    score: formatPoints(result.breakdown.score),
    detail: `${formatDistance(result.breakdown.distanceKm)} away · ${result.breakdown.cluesUsed} ${result.breakdown.cluesUsed === 1 ? "clue" : "clues"}`,
    marks: [proximityOf(result.breakdown.distanceKm)],
    link,
  };
  const sessionCard = {
    kicker,
    title: mode.title,
    score: formatPoints(result.sessionScore),
    detail: `${summaries.length} ${summaries.length === 1 ? "round" : "rounds"}`,
    marks: summaries.map((round) => proximityOf(round.distanceKm)),
    link,
  };
  async function shareRound() {
    const outcome = await copyOrShare(roundText, result.mode);
    if (outcome === "cancelled") {
      return;
    }
    setRoundShare(outcome === "shared" ? "shared" : "copied");
    window.setTimeout(() => setRoundShare("idle"), 2000);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {result.event ? result.event.title : "The place"}
        </p>
        <h2 className="mt-2 font-serif text-4xl leading-none tracking-tight">{result.location.name}</h2>
        <p className="mt-2 text-muted">
          {result.location.country}
          <span aria-hidden="true"> · </span>
          {result.location.region}
        </p>
      </div>
      <div>
        <p className="text-lg">
          You were <span className="font-medium">{formatDistance(result.breakdown.distanceKm)}</span> away.
        </p>
        {result.breakdown.withinTolerance ? (
          <p className="mt-1 text-sm text-correct">
            Inside the target area. Within {formatDistance(result.breakdown.toleranceKm)} counts as a direct hit.
          </p>
        ) : null}
        <p className="mt-3 font-serif text-6xl tabular-nums tracking-tight">{formatPoints(result.breakdown.score)}</p>
        <p className="mt-1 text-sm text-muted">points</p>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Distance score</dt>
        <dd className="tabular-nums">{formatPoints(result.breakdown.distanceScore)}</dd>
        <dt className="text-muted">Clues · {result.breakdown.cluesUsed}</dt>
        <dd className="tabular-nums">{formatMultiplier(result.breakdown.clueMultiplier)}</dd>
        <dt className="text-muted capitalize">{result.difficulty}</dt>
        <dd className="tabular-nums">{formatMultiplier(result.breakdown.difficultyMultiplier)}</dd>
      </dl>
      <p className="text-sm leading-relaxed text-muted">{result.event?.description ?? result.location.description}</p>
      <p className="font-mono text-xs text-muted">
        {formatCoordinate(result.location.latitude, result.location.longitude)}
      </p>
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        {result.sourceUrl ? (
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="self-start text-sm text-sea underline decoration-sea/40 underline-offset-4 hover:decoration-sea"
          >
            Source
          </a>
        ) : null}
        {result.finished ? (
          <Button type="button" onClick={onReplay} className="w-full">
            Play again
          </Button>
        ) : (
          <Button type="button" onClick={onNext} className="w-full">
            Next challenge
          </Button>
        )}
      </div>
      <ShareActions
        text={result.finished ? sessionText : roundText}
        card={result.finished ? sessionCard : roundCard}
        mode={result.mode}
        label={result.finished ? "Share game" : "Share"}
      />
      {result.finished ? (
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Keep playing">
          <Link href={result.daily ? "/daily" : "/play"} className="text-sea hover:underline">
            {result.daily ? "Play another daily mode" : "Choose another mode"}
          </Link>
          <Link
            href={result.daily ? "/leaderboard?view=daily" : `/leaderboard?view=${mode.slug}`}
            className="text-sea hover:underline"
          >
            See today’s leaderboard
          </Link>
        </nav>
      ) : null}
      {result.finished ? (
        <Button type="button" variant="ghost" onClick={() => void shareRound()}>
          {roundShare === "copied" ? "Copied" : roundShare === "shared" ? "Shared" : "Share this round"}
        </Button>
      ) : null}
      {result.finished ? (
        <section className="border-t border-line pt-5">
          <h3 className="font-serif text-2xl tracking-tight">
            {formatPoints(result.sessionScore)} across {result.totalRounds}{" "}
            {result.totalRounds === 1 ? "round" : "rounds"}
          </h3>
          <ol className="mt-4 space-y-3">
            {summaries.map((round) => (
              <li key={`${round.round}-${round.locationName}`} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="text-muted">{round.round}. </span>
                  {round.locationName}
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {formatPoints(round.score)} · {formatDistance(round.distanceKm)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <p className="sr-only">Answer: {place}</p>
    </div>
  );
}
