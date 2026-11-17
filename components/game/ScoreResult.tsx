"use client";

import Link from "next/link";
import { PlayerNameField } from "@/components/game/PlayerNameField";
import { ShareChallenge } from "@/components/game/ShareChallenge";
import { Button } from "@/components/ui/Button";
import { formatDistance, formatPoints } from "@/lib/game/format";
import { getMode } from "@/lib/game/modes";
import { buildSessionShareText } from "@/lib/game/share";
import type { GuessResult, RoundSummary } from "@/types/game";

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
  const { breakdown } = result;

  return (
    <div className="flex min-h-full flex-col">
      <div className="clue-in flex-1 p-5 md:p-6">
        <h2 className="font-serif text-4xl leading-tight tracking-tight">{result.location.name}</h2>
        <p className="mt-1 text-muted">{result.location.country}</p>

        <p className="mt-8 font-serif text-6xl tabular-nums leading-none tracking-tight">
          {formatPoints(breakdown.score)}
        </p>
        <p className="mt-2 text-muted">{formatDistance(breakdown.distanceKm)} away</p>

        {result.finished ? (
          <div className="mt-10 border-t border-line pt-5">
            <p className="text-sm text-muted">Total</p>
            <p className="font-serif text-3xl tabular-nums">{formatPoints(result.sessionScore)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ShareChallenge
                mode={result.mode}
                label="Share"
                text={buildSessionShareText({
                  mode: result.mode,
                  score: result.sessionScore,
                  daily: result.daily,
                  dailyNumber: result.dailyNumber,
                  distancesKm: summaries.map((round) => round.distanceKm),
                })}
              />
              <Link
                href={result.daily ? "/leaderboard?view=daily" : `/leaderboard?view=${getMode(result.mode).slug}`}
                className="text-sm text-sea underline-offset-4 hover:underline"
              >
                Leaderboard
              </Link>
            </div>
            <div className="mt-6">
              <PlayerNameField name={playerName} onChange={onPlayerName} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="action-bar sticky bottom-0 z-10 p-4 md:px-6">
        {result.finished ? (
          <Button type="button" variant="pin" onClick={onReplay} className="w-full" disabled={pending}>
            Play again
          </Button>
        ) : (
          <Button type="button" variant="pin" onClick={onNext} className="w-full" disabled={pending}>
            {pending ? "Loading…" : "Next"}
          </Button>
        )}
      </div>
    </div>
  );
}
