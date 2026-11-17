"use client";

import { type FormEvent, useState } from "react";
import { FirstRunGuide } from "@/components/game/FirstRunGuide";
import { GuessButton } from "@/components/game/GuessButton";
import { PlayerNameField } from "@/components/game/PlayerNameField";
import { ScoreResult } from "@/components/game/ScoreResult";
import { Button } from "@/components/ui/Button";
import { formatCoordinate, formatDifficulty, formatMultiplier } from "@/lib/game/format";
import { getMode } from "@/lib/game/modes";
import { clueMultiplier, DIFFICULTY_MULTIPLIERS } from "@/lib/scoring/score";
import type { GameMode, TargetKind } from "@/types/challenge";
import type { Difficulty } from "@/types/location";
import type { Coordinates, GamePhase, GuessResult, RoundSummary } from "@/types/game";

/** Accepts "12.5", "-3", "12.5 N", "3 W", and a pasted "lat, lng" pair. */
function parseCoordinatePair(latitudeRaw: string, longitudeRaw: string): Coordinates | string {
  let latText = latitudeRaw.trim();
  let lngText = longitudeRaw.trim();
  if (!lngText && /[,;\s]/.test(latText)) {
    const parts = latText.split(/\s*[,;]\s*|\s+(?=[-+]?\d)/).filter(Boolean);
    if (parts.length === 2) {
      [latText, lngText] = parts;
    }
  }
  const read = (text: string, positive: string, negative: string) => {
    const match = /^([-+]?\d+(?:\.\d+)?)\s*°?\s*([A-Za-z])?$/.exec(text);
    if (!match) {
      return Number.NaN;
    }
    const value = Number(match[1]);
    const hemisphere = match[2]?.toUpperCase();
    if (!hemisphere) {
      return value;
    }
    if (hemisphere === positive) {
      return Math.abs(value);
    }
    if (hemisphere === negative) {
      return -Math.abs(value);
    }
    return Number.NaN;
  };
  const latitude = read(latText, "N", "S");
  const longitude = read(lngText, "E", "W");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return "Latitude must be a number from -90 to 90 (or use N/S).";
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return "Longitude must be a number from -180 to 180 (or use E/W).";
  }
  return { latitude, longitude };
}

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
  revealing,
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
  revealing: boolean;
  playerName: string;
  onPlayerName: (name: string) => void;
  onReveal: () => void;
  onSubmit: () => void;
  onResetPin: () => void;
  onGuess: (guess: Coordinates) => void;
  onNext: () => void;
  onReplay: () => void;
}) {
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const info = getMode(mode);
  const pending = phase === "submitted" || phase === "loading" || phase === "next_round";
  const locked = Boolean(result) || pending;
  const coordinateKey = guess ? `${guess.latitude.toFixed(5)},${guess.longitude.toFixed(5)}` : "empty";

  function placeCoordinates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = parseCoordinatePair(String(data.get("latitude") ?? ""), String(data.get("longitude") ?? ""));
    if (typeof parsed === "string") {
      setCoordinateError(parsed);
      return;
    }
    setCoordinateError(null);
    onGuess(parsed);
  }

  if (phase === "loading" || phase === "next_round") {
    return (
      <div className="space-y-5 p-5 md:p-6" role="status" aria-label="Loading the next challenge">
        <div className="skeleton h-4 w-40 rounded-full" />
        <div className="space-y-2.5">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-7 w-full rounded-lg" />
          <div className="skeleton h-7 w-4/5 rounded-lg" />
        </div>
        <div className="skeleton h-11 w-full rounded-full" />
        <p className="text-sm text-muted">{phase === "next_round" ? "Setting the next challenge…" : "Spinning the globe…"}</p>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="space-y-4 p-5 md:p-6" role="alert">
        <p className="font-serif text-2xl tracking-tight">Something slipped off the map.</p>
        <p className="text-sm text-muted">{error ?? "The challenge could not be loaded."}</p>
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

  const used = clues.length;
  const multiplier = clueMultiplier(Math.max(used, 1));
  const nextMultiplier = used < totalClues ? clueMultiplier(used + 1) : null;
  const allOpen = used >= totalClues;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-5 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            <span aria-hidden="true">{info.emoji} </span>
            {info.title}
            {targetKind === "approximate" ? " · approximate target" : ""}
          </p>
          <ClueMeter used={used} total={totalClues} />
        </div>

        <FirstRunGuide />

        <ol className="space-y-4" aria-label="Clues">
          {clues.map((clue, index) => {
            const latest = index === clues.length - 1;
            return (
              <li
                key={`${index}-${clue}`}
                className={latest ? "clue-in" : "opacity-75"}
              >
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Clue {index + 1} of {totalClues}
                </p>
                <p className={`mt-1 font-serif leading-snug tracking-tight ${latest ? "text-2xl" : "text-lg"}`}>{clue}</p>
              </li>
            );
          })}
          {revealing ? (
            <li aria-hidden="true" className="space-y-2">
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton h-7 w-4/5 rounded-lg" />
            </li>
          ) : null}
        </ol>

        <p className="text-sm text-muted">
          Clue value <span className="font-medium text-ink tabular-nums">{formatMultiplier(multiplier)}</span>
          {difficulty ? (
            <>
              {" · "}
              {formatDifficulty(difficulty)}{" "}
              <span className="tabular-nums">{formatMultiplier(DIFFICULTY_MULTIPLIERS[difficulty])}</span>
            </>
          ) : null}
          {nextMultiplier ? (
            <span className="block">Another clue drops it to {formatMultiplier(nextMultiplier)}.</span>
          ) : null}
        </p>

        {guess ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-muted">Your pin</span>
            <span className="font-mono text-xs">{formatCoordinate(guess.latitude, guess.longitude)}</span>
            <button
              type="button"
              className="text-muted underline-offset-4 hover:text-ink hover:underline"
              onClick={onResetPin}
              disabled={locked}
            >
              Remove
            </button>
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl border border-pin/40 bg-pin/10 px-3 py-2 text-sm text-ink">
            {error}
          </p>
        ) : null}

        <details className="border-t border-line pt-4 text-sm text-muted">
          <summary className="cursor-pointer select-none hover:text-ink">Type coordinates instead</summary>
          <form key={coordinateKey} onSubmit={placeCoordinates} className="mt-4 grid grid-cols-2 gap-3" noValidate>
            <label className="block">
              Latitude
              <input
                name="latitude"
                defaultValue={guess ? guess.latitude.toFixed(4) : ""}
                inputMode="text"
                placeholder="48.86 or 48.86 N"
                autoComplete="off"
                onChange={() => setCoordinateError(null)}
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 font-mono text-base text-ink sm:text-sm"
              />
            </label>
            <label className="block">
              Longitude
              <input
                name="longitude"
                defaultValue={guess ? guess.longitude.toFixed(4) : ""}
                inputMode="text"
                placeholder="2.35 or 2.35 E"
                autoComplete="off"
                onChange={() => setCoordinateError(null)}
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 font-mono text-base text-ink sm:text-sm"
              />
            </label>
            {coordinateError ? (
              <p role="alert" className="col-span-2 text-sm text-pin">
                {coordinateError}
              </p>
            ) : (
              <p className="col-span-2 text-xs">Tip: paste “lat, lng” into the first box.</p>
            )}
            <Button type="submit" variant="ghost" className="col-span-2" disabled={locked}>
              Place pin here
            </Button>
          </form>
        </details>

        <div className="border-t border-line pt-4">
          <PlayerNameField name={playerName} onChange={onPlayerName} />
        </div>
      </div>

      <div className="action-bar sticky bottom-0 z-10 border-t border-line p-4 md:px-6">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <GuessButton disabled={!guess || locked} pending={phase === "submitted"} onClick={onSubmit} />
          <Button
            type="button"
            variant="ghost"
            onClick={onReveal}
            disabled={locked || allOpen || revealing}
            aria-describedby="next-clue-cost"
          >
            {revealing ? "Opening…" : allOpen ? "No more clues" : "Next clue"}
          </Button>
        </div>
        <p id="next-clue-cost" className="mt-2 text-center text-xs text-muted">
          {!guess ? (
            <>
              <span className="[@media(pointer:coarse)]:hidden">Click the globe to place your pin.</span>
              <span className="hidden [@media(pointer:coarse)]:inline">Tap the globe to place your pin.</span>
            </>
          ) : (
            "Happy with your pin? Submit it."
          )}
          <span className="hidden [@media(pointer:fine)]:inline">
            {" "}
            <kbd>Enter</kbd> submits · <kbd>C</kbd> opens a clue
          </span>
        </p>
      </div>
    </div>
  );
}

function ClueMeter({ used, total }: { used: number; total: number }) {
  if (total <= 0) {
    return null;
  }
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${used} of ${total} clues open`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 w-4 rounded-full ${index < used ? "bg-sea" : "bg-line"}`}
        />
      ))}
    </span>
  );
}
