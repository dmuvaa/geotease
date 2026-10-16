"use client";

import type { FormEvent } from "react";
import { FirstRunGuide } from "@/components/game/FirstRunGuide";
import { GuessButton } from "@/components/game/GuessButton";
import { ScoreResult } from "@/components/game/ScoreResult";
import { Button } from "@/components/ui/Button";
import { formatDifficulty, formatMultiplier } from "@/lib/game/format";
import { getMode } from "@/lib/game/modes";
import { clueMultiplier, DIFFICULTY_MULTIPLIERS } from "@/lib/scoring/score";
import type { GameMode, TargetKind } from "@/types/challenge";
import type { Difficulty } from "@/types/location";
import type { Coordinates, GamePhase, GuessResult, RoundSummary } from "@/types/game";

export function CluePanel({
  mode,
  phase,
  difficulty,
  clues,
  totalClues,
  targetKind,
  guess,
  result,
  summaries,
  error,
  playerName,
  onPlayerName,
  onReveal,
  onSubmit,
  onResetPin,
  onGuess,
  onNext,
  onReplay,
}: {
  mode: GameMode;
  phase: GamePhase;
  difficulty: Difficulty | null;
  clues: string[];
  totalClues: number;
  targetKind: TargetKind;
  guess: Coordinates | null;
  result: GuessResult | null;
  summaries: RoundSummary[];
  error: string | null;
  playerName: string;
  onPlayerName: (name: string) => void;
  onReveal: () => void;
  onSubmit: () => void;
  onResetPin: () => void;
  onGuess: (guess: Coordinates) => void;
  onNext: () => void;
  onReplay: () => void;
}) {
  const info = getMode(mode);
  const pending = phase === "submitted" || phase === "loading" || phase === "next_round";
  const locked = Boolean(result) || pending;
  const coordinateKey = guess ? `${guess.latitude.toFixed(5)},${guess.longitude.toFixed(5)}` : "empty";

  function placeCoordinates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextLatitude = Number(data.get("latitude"));
    const nextLongitude = Number(data.get("longitude"));
    if (!Number.isFinite(nextLatitude) || nextLatitude < -90 || nextLatitude > 90) {
      return;
    }
    if (!Number.isFinite(nextLongitude) || nextLongitude < -180 || nextLongitude > 180) {
      return;
    }
    onGuess({ latitude: nextLatitude, longitude: nextLongitude });
  }

  if (phase === "loading" || phase === "next_round") {
    return (
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Setting the next challenge…</p>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="space-y-4 p-5 md:p-6">
        <p className="text-sm text-pin">{error ?? "The challenge could not be loaded."}</p>
        <Button type="button" onClick={onReplay}>
          Try again
        </Button>
      </div>
    );
  }

  const used = clues.length;
  const multiplier = clueMultiplier(Math.max(used, 1));
  const nextMultiplier = used < totalClues ? clueMultiplier(used + 1) : null;

  return (
    <div className="flex flex-col gap-6 p-5 md:p-6">
      <div>
        <p className="text-sm text-muted">
          <span aria-hidden="true">{info.emoji} </span>
          {info.title}
          {targetKind === "approximate" ? ", approximate target" : ""}
        </p>
      </div>

      {!result ? <FirstRunGuide /> : null}

      {result ? (
        <ScoreResult result={result} summaries={summaries} onNext={onNext} onReplay={onReplay} />
      ) : (
        <>
          <ol className="space-y-4">
            {clues.map((clue, index) => (
              <li key={`${index}-${clue}`} className={index === clues.length - 1 ? "clue-in" : undefined}>
                <p className="text-sm text-muted">
                  Clue {index + 1} of {totalClues}
                </p>
                <p className="mt-1 font-serif text-2xl leading-snug tracking-tight">{clue}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted">
            Current clue value: {formatMultiplier(multiplier)}.
            {difficulty ? ` ${formatDifficulty(difficulty)} round: ${formatMultiplier(DIFFICULTY_MULTIPLIERS[difficulty])}.` : ""}
            {nextMultiplier ? ` The next clue drops that to ${formatMultiplier(nextMultiplier)}.` : ""}
          </p>
          {error ? <p className="text-sm text-pin">{error}</p> : null}
          <div className="flex flex-col gap-3">
            <GuessButton disabled={!guess || locked} pending={phase === "submitted"} onClick={onSubmit} />
            {!guess ? <p className="text-center text-sm text-muted">Place a pin on the globe to submit.</p> : null}
            <Button type="button" variant="ghost" onClick={onReveal} disabled={locked || used >= totalClues}>
              {used >= totalClues ? "All clues open" : "Next clue"}
            </Button>
            {guess ? (
              <button type="button" className="self-center text-sm text-muted underline-offset-4 hover:underline" onClick={onResetPin} disabled={locked}>
                Remove pin
              </button>
            ) : null}
          </div>
          <details className="border-t border-line pt-4 text-sm text-muted">
            <summary className="cursor-pointer select-none">Enter exact coordinates</summary>
            <form key={coordinateKey} onSubmit={placeCoordinates} className="mt-4 grid grid-cols-2 gap-3">
              <label>
                Latitude
                <input
                  name="latitude"
                  defaultValue={guess ? guess.latitude.toFixed(4) : ""}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink"
                  aria-label="Latitude"
                />
              </label>
              <label>
                Longitude
                <input
                  name="longitude"
                  defaultValue={guess ? guess.longitude.toFixed(4) : ""}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink"
                  aria-label="Longitude"
                />
              </label>
              <Button type="submit" variant="ghost" className="col-span-2" disabled={locked}>
                Place pin
              </Button>
            </form>
          </details>
        </>
      )}

      <label className="text-xs text-muted">
        Name on today’s board
        <input
          value={playerName}
          maxLength={18}
          onChange={(event) => onPlayerName(event.target.value)}
          placeholder="Explorer"
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>
    </div>
  );
}
