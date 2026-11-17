"use client";

import { GuessButton } from "@/components/game/GuessButton";
import { ScoreResult } from "@/components/game/ScoreResult";
import { Button } from "@/components/ui/Button";
import { getMode } from "@/lib/game/modes";
import type { GameMode } from "@/types/challenge";
import type { Coordinates, GamePhase, GuessResult, RoundSummary } from "@/types/game";

export function CluePanel({
  mode,
  phase,
  clues,
  totalClues,
  guess,
  result,
  summaries,
  error,
  revealing,
  playerName,
  onPlayerName,
  onReveal,
  onSubmit,
  onNext,
  onReplay,
}: {
  mode: GameMode;
  phase: GamePhase;
  clues: string[];
  totalClues: number;
  guess: Coordinates | null;
  result: GuessResult | null;
  summaries: RoundSummary[];
  error: string | null;
  revealing: boolean;
  playerName: string;
  onPlayerName: (name: string) => void;
  onReveal: () => void;
  onSubmit: () => void;
  onNext: () => void;
  onReplay: () => void;
}) {
  const pending = phase === "submitted" || phase === "loading" || phase === "next_round";
  const locked = Boolean(result) || pending;

  if (phase === "loading" || phase === "next_round") {
    return (
      <div className="space-y-4 p-5 md:p-6" role="status" aria-label="Loading the next challenge">
        <div className="skeleton h-4 w-32 rounded-full" />
        <div className="skeleton h-8 w-full rounded-lg" />
        <div className="skeleton h-8 w-3/4 rounded-lg" />
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="space-y-4 p-5 md:p-6" role="alert">
        <p className="text-muted">{error ?? "The challenge could not be loaded."}</p>
        <Button type="button" onClick={onReplay}>
          Start a fresh game
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <ScoreResult
        result={result}
        summaries={summaries}
        playerName={playerName}
        onPlayerName={onPlayerName}
        onNext={onNext}
        onReplay={onReplay}
        pending={pending}
      />
    );
  }

  const allOpen = clues.length >= totalClues;
  const latest = clues[clues.length - 1];
  const earlier = clues.slice(0, -1);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 p-5 md:p-6">
        <h1 className="text-sm text-muted">{getMode(mode).title}</h1>

        {latest ? (
          <p key={latest} className="clue-in mt-3 font-serif text-3xl leading-snug tracking-tight">
            {latest}
          </p>
        ) : null}
        {revealing ? <div className="skeleton mt-4 h-8 w-4/5 rounded-lg" aria-hidden="true" /> : null}

        {earlier.length > 0 ? (
          <ul className="mt-6 space-y-2 border-t border-line pt-4">
            {earlier
              .slice()
              .reverse()
              .map((clue) => (
                <li key={clue} className="leading-snug text-muted">
                  {clue}
                </li>
              ))}
          </ul>
        ) : null}

        {error ? (
          <p role="alert" className="mt-6 text-sm text-pin">
            {error}
          </p>
        ) : null}
      </div>

      <div className="action-bar sticky bottom-0 z-10 p-4 md:px-6">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <GuessButton disabled={!guess || locked} pending={phase === "submitted"} onClick={onSubmit} />
          {!allOpen ? (
            <Button type="button" variant="ghost" onClick={onReveal} disabled={locked || revealing}>
              {revealing ? "…" : "Next clue"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
