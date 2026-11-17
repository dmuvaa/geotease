"use client";

import Link from "next/link";
import { PlayerNameField } from "@/components/game/PlayerNameField";
import { ShareActions } from "@/components/game/ShareActions";
import { Button } from "@/components/ui/Button";
import { formatCoordinate, formatDistance, formatMultiplier, formatPoints } from "@/lib/game/format";
import { getMode } from "@/lib/game/modes";
import { type Proximity, proximityOf } from "@/lib/game/proximity";
import { buildSessionShareText, buildShareText, playUrl } from "@/lib/game/share";
import type { GuessResult, RoundSummary } from "@/types/game";

const VERDICT: Record<Proximity | "hit", { label: string; className: string }> = {
  hit: { label: "Direct hit", className: "bg-correct text-white" },
  close: { label: "Very close", className: "bg-correct/15 text-correct" },
  near: { label: "Close", className: "bg-[#c4a15a]/20 text-[#7a5c1c] dark:text-[#e2c487]" },
  far: { label: "Some way off", className: "bg-pin/12 text-pin" },
  miss: { label: "A long way off", className: "bg-ink/10 text-muted" },
};

const MARK_CLASS: Record<Proximity, string> = {
  close: "bg-correct",
  near: "bg-[#c4a15a]",
  far: "bg-pin",
  miss: "bg-ink/30",
};

export function ScoreResult({
  result,
  summaries,
  playerName,
  onPlayerName,
  onNext,
  onReplay,
  pending,
}: {
  result: GuessResult;
  summaries: RoundSummary[];
  playerName: string;
  onPlayerName: (name: string) => void;
  onNext: () => void;
  onReplay: () => void;
  pending: boolean;
}) {
  const mode = getMode(result.mode);
  const link = playUrl(result.mode, result.daily);
  const { breakdown } = result;
  const verdict =
    breakdown.withinTolerance || breakdown.distanceKm <= 25 ? VERDICT.hit : VERDICT[proximityOf(breakdown.distanceKm)];
  const kicker = result.daily && result.dailyNumber ? `Daily #${result.dailyNumber}` : "GeoTease";

  const shareText = result.finished
    ? buildSessionShareText({
        mode: result.mode,
        score: result.sessionScore,
        daily: result.daily,
        dailyNumber: result.dailyNumber,
        distancesKm: summaries.map((round) => round.distanceKm),
      })
    : buildShareText({
        daily: result.daily,
        dailyNumber: result.dailyNumber,
        mode: result.mode,
        score: breakdown.score,
        distanceKm: breakdown.distanceKm,
        cluesUsed: breakdown.cluesUsed,
      });
  const card = result.finished
    ? {
        kicker,
        title: mode.title,
        score: formatPoints(result.sessionScore),
        detail: `${summaries.length} ${summaries.length === 1 ? "round" : "rounds"}`,
        marks: summaries.map((round) => proximityOf(round.distanceKm)),
        link,
      }
    : {
        kicker,
        title: mode.title,
        score: formatPoints(breakdown.score),
        detail: `${formatDistance(breakdown.distanceKm)} away · ${breakdown.cluesUsed} ${breakdown.cluesUsed === 1 ? "clue" : "clues"}`,
        marks: [proximityOf(breakdown.distanceKm)],
        link,
      };

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6 p-5 md:p-6">
        <div className="clue-in">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${verdict.className}`}>{verdict.label}</span>
            <span className="text-xs text-muted">
              {result.daily ? "Daily" : `Round ${result.round} of ${result.totalRounds}`}
            </span>
          </div>
          {result.event ? (
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted">
              {result.event.title}
              {result.event.year ? ` · ${result.event.year < 0 ? `${Math.abs(result.event.year)} BCE` : result.event.year}` : ""}
            </p>
          ) : null}
          <h2 className={`${result.event ? "mt-1" : "mt-4"} font-serif text-4xl leading-none tracking-tight`}>
            {result.location.name}
          </h2>
          <p className="mt-2 text-muted">
            {result.location.country}
            {result.location.region ? (
              <>
                <span aria-hidden="true"> · </span>
                {result.location.region}
              </>
            ) : null}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-serif text-5xl tabular-nums leading-none tracking-tight">{formatPoints(breakdown.score)}</p>
              <p className="mt-1 text-sm text-muted">points this round</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-medium tabular-nums">{formatDistance(breakdown.distanceKm)}</p>
              <p className="text-sm text-muted">from the answer</p>
            </div>
          </div>
          {breakdown.withinTolerance ? (
            <p className="mt-3 text-sm text-correct">
              Inside the target area — anything within {formatDistance(breakdown.toleranceKm)} counts as a direct hit.
            </p>
          ) : null}
          <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-line pt-3 text-sm">
            <dt className="text-muted">Distance score</dt>
            <dd className="tabular-nums">{formatPoints(breakdown.distanceScore)}</dd>
            <dt className="text-muted">
              {breakdown.cluesUsed} {breakdown.cluesUsed === 1 ? "clue" : "clues"} used
            </dt>
            <dd className="tabular-nums">{formatMultiplier(breakdown.clueMultiplier)}</dd>
            <dt className="text-muted capitalize">{result.difficulty} difficulty</dt>
            <dd className="tabular-nums">{formatMultiplier(breakdown.difficultyMultiplier)}</dd>
          </dl>
        </div>

        <div className="space-y-2">
          <p className="leading-relaxed text-muted">{result.event?.description ?? result.location.description}</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-mono text-xs text-muted">
              {formatCoordinate(result.location.latitude, result.location.longitude)}
            </span>
            {result.sourceUrl ? (
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sea underline decoration-sea/40 underline-offset-4 hover:decoration-sea"
              >
                Read more<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </p>
        </div>

        {result.finished ? (
          <section className="border-t border-line pt-5" aria-labelledby="game-summary">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Game complete</p>
            <h3 id="game-summary" className="mt-1 font-serif text-3xl tracking-tight">
              {formatPoints(result.sessionScore)} points
            </h3>
            {summaries.length > 1 ? (
              <ol className="mt-4 divide-y divide-line border-y border-line">
                {summaries.map((round) => (
                  <li key={`${round.round}-${round.locationName}`} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className={`size-3 shrink-0 rounded-sm ${MARK_CLASS[proximityOf(round.distanceKm)]}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{round.locationName}</span>
                    <span className="shrink-0 tabular-nums text-muted">{formatDistance(round.distanceKm)}</span>
                    <span className="w-14 shrink-0 text-right font-medium tabular-nums">{formatPoints(round.score)}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-3 border-t border-line pt-5" aria-label="Share">
          <ShareActions
            text={shareText}
            card={card}
            mode={result.mode}
            label={result.finished ? "Share your game" : "Share this round"}
            showCard={result.finished}
          />
        </section>

        {result.finished ? (
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Keep playing">
            <Link href={result.daily ? "/daily" : "/play"} className="text-sea underline-offset-4 hover:underline">
              {result.daily ? "Play another daily mode" : "Try another mode"}
            </Link>
            <Link
              href={result.daily ? "/leaderboard?view=daily" : `/leaderboard?view=${mode.slug}`}
              className="text-sea underline-offset-4 hover:underline"
            >
              See today’s leaderboard
            </Link>
          </nav>
        ) : null}

        <div className="border-t border-line pt-4">
          <PlayerNameField name={playerName} onChange={onPlayerName} />
        </div>
      </div>

      <div className="action-bar sticky bottom-0 z-10 border-t border-line p-4 md:px-6">
        {result.finished ? (
          <Button type="button" variant="pin" onClick={onReplay} className="w-full" disabled={pending}>
            {result.daily ? "Play this daily again" : "Play a new game"}
          </Button>
        ) : (
          <Button type="button" variant="pin" onClick={onNext} className="w-full" disabled={pending}>
            {pending ? "Loading…" : `Next challenge · ${result.round + 1} of ${result.totalRounds}`}
          </Button>
        )}
        <p className="mt-2 hidden text-center text-xs text-muted [@media(pointer:fine)]:block">
          Press <kbd>Enter</kbd> to continue
        </p>
      </div>
    </div>
  );
}
