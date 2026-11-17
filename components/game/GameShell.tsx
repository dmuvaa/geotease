"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { revealClue, startRound, submitRoundGuess } from "@/app/actions/game";
import { CluePanel } from "@/components/game/CluePanel";
import { GameHeader } from "@/components/game/GameHeader";
import { GeoMap } from "@/components/map/GeoMap";
import { usePreferredDifficulty } from "@/components/map/MapLevelControl";
import { trackClientEvent } from "@/lib/analytics/client";
import { recordRound } from "@/lib/game/progress";
import { formatDistance, formatPoints } from "@/lib/game/format";
import { clearActiveRun, readActiveRun, writeActiveRun } from "@/lib/game/run-storage";
import type { GameMode, TargetKind } from "@/types/challenge";
import type { Difficulty } from "@/types/location";
import type {
  Coordinates,
  GamePhase,
  GuessResult,
  PublicRound,
  RoundSummary,
  SavedRun,
} from "@/types/game";

const PLAYER_EVENT = "geotease-player";

function isStaleRunError(error: string) {
  return /expired|another session|no longer available|does not belong/i.test(error);
}

function subscribePlayer(callback: () => void) {
  window.addEventListener(PLAYER_EVENT, callback);
  return () => window.removeEventListener(PLAYER_EVENT, callback);
}

function readPlayerName() {
  return localStorage.getItem("geotease-player") ?? "";
}

export function GameShell({ mode, daily }: { mode: GameMode; daily: boolean }) {
  const preferredDifficulty = usePreferredDifficulty();
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [clues, setClues] = useState<string[]>([]);
  const [totalClues, setTotalClues] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(daily ? 1 : 5);
  const [sessionScore, setSessionScore] = useState(0);
  const [dailyNumber, setDailyNumber] = useState<number | null>(null);
  const [targetKind, setTargetKind] = useState<TargetKind>("exact");
  const [dateKey, setDateKey] = useState("");
  const [guess, setGuess] = useState<Coordinates | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [summaries, setSummaries] = useState<RoundSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const playerName = useSyncExternalStore(subscribePlayer, readPlayerName, () => "");
  const [cameraKey, setCameraKey] = useState("boot:start");
  const [loadKey, setLoadKey] = useState(0);
  const phaseRef = useRef(phase);
  const placedFor = useRef<string | null>(null);
  phaseRef.current = phase;

  useEffect(() => {
    const onHide = () => {
      const current = phaseRef.current;
      if (current === "playing" || current === "guess_placed") {
        trackClientEvent("game_abandoned", mode);
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (loadKey === 0) {
        const saved = readActiveRun();
        if (saved && saved.mode === mode && saved.daily === daily) {
          if (cancelled) {
            return;
          }
          restore(saved);
          return;
        }
      }

      let response: Awaited<ReturnType<typeof startRound>>;
      try {
        response = await startRound({
          mode,
          daily,
          continuation: null,
          difficulty: daily ? null : preferredDifficulty,
        });
      } catch {
        if (!cancelled) {
          setError("We couldn’t reach the server. Check your connection and try again.");
          setPhase("idle");
        }
        return;
      }
      if (cancelled) {
        return;
      }
      if (!response.ok) {
        setError(response.error);
        setPhase("idle");
        return;
      }
      adopt(response, loadKey === 0 ? "start" : "next");
    }

    void boot();
    return () => {
      cancelled = true;
    };
    // adopt and restore are recreated with state, but this effect should only rerun for a new game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily, loadKey, mode]);

  function snapshot(overrides: Partial<SavedRun> = {}): SavedRun | null {
    const nextToken = overrides.token ?? token;
    if (!nextToken) {
      return null;
    }
    return {
      v: 1,
      mode,
      daily,
      dateKey: overrides.dateKey ?? dateKey,
      token: nextToken,
      clues: overrides.clues ?? clues,
      totalClues: overrides.totalClues ?? totalClues,
      difficulty: overrides.difficulty ?? difficulty ?? "medium",
      targetKind: overrides.targetKind ?? targetKind,
      round: overrides.round ?? round,
      totalRounds: overrides.totalRounds ?? totalRounds,
      sessionScore: overrides.sessionScore ?? sessionScore,
      dailyNumber: overrides.dailyNumber === undefined ? dailyNumber : overrides.dailyNumber,
      summaries: overrides.summaries ?? summaries,
      result: overrides.result === undefined ? result : overrides.result,
      guess: overrides.guess === undefined ? guess : overrides.guess,
    };
  }

  function persist(overrides: Partial<SavedRun> = {}) {
    const run = snapshot(overrides);
    if (run) {
      writeActiveRun(run);
    }
  }

  function showRunError(message: string, fallbackPhase: GamePhase) {
    if (isStaleRunError(message)) {
      clearActiveRun();
      setError("This saved game expired. Start a fresh game.");
      setPhase("idle");
      return;
    }
    setError(message);
    setPhase(fallbackPhase);
  }

  function restore(saved: SavedRun) {
    setToken(saved.token);
    setClues(saved.clues);
    setTotalClues(saved.totalClues);
    setDifficulty(saved.difficulty);
    setRound(saved.round);
    setTotalRounds(saved.totalRounds);
    setSessionScore(saved.sessionScore);
    setDailyNumber(saved.dailyNumber);
    setTargetKind(saved.targetKind);
    setDateKey(saved.dateKey);
    setGuess(saved.guess);
    setResult(saved.result);
    setSummaries(saved.summaries);
    setError(null);
    setPhase(saved.result ? "result" : saved.guess ? "guess_placed" : "playing");
    setCameraKey(saved.result ? `${saved.token.slice(-8)}:result` : "boot:start");
  }

  function adopt(response: PublicRound, camera: "start" | "next") {
    setToken(response.token);
    setClues([response.clue]);
    setTotalClues(response.totalClues);
    setDifficulty(response.difficulty);
    setRound(response.round);
    setTotalRounds(response.totalRounds);
    setSessionScore(response.sessionScore);
    setDailyNumber(response.dailyNumber);
    setTargetKind(response.targetKind);
    setDateKey(response.dateKey);
    setGuess(null);
    setResult(null);
    setError(null);
    setPhase("playing");
    setCameraKey(`${response.token.slice(-8)}:${camera}`);
    placedFor.current = null;
    writeActiveRun({
      v: 1,
      mode,
      daily,
      dateKey: response.dateKey,
      token: response.token,
      clues: [response.clue],
      totalClues: response.totalClues,
      difficulty: response.difficulty,
      targetKind: response.targetKind,
      round: response.round,
      totalRounds: response.totalRounds,
      sessionScore: response.sessionScore,
      dailyNumber: response.dailyNumber,
      summaries,
      result: null,
      guess: null,
    });
  }

  function handleGuess(next: Coordinates) {
    if (phase !== "playing" && phase !== "guess_placed") {
      return;
    }
    setGuess(next);
    setPhase("guess_placed");
    if (token && placedFor.current !== token) {
      placedFor.current = token;
      trackClientEvent("guess_placed", mode);
    }
    persist({ guess: next });
  }

  async function handleReveal() {
    if (!token || revealing || phase === "submitted" || result || clues.length >= totalClues) {
      return;
    }
    setError(null);
    setRevealing(true);
    let response: Awaited<ReturnType<typeof revealClue>>;
    try {
      response = await revealClue(token);
    } catch {
      setRevealing(false);
      setError("We couldn’t reach the server. Check your connection and try again.");
      return;
    }
    setRevealing(false);
    if (!response.ok) {
      showRunError(response.error, phase);
      return;
    }
    const nextClues = [...clues, response.clue];
    setToken(response.token);
    setClues(nextClues);
    setTotalClues(response.totalClues);
    persist({ token: response.token, clues: nextClues, totalClues: response.totalClues });
  }

  async function handleSubmit() {
    if (!token || !guess || phase === "submitted" || result) {
      return;
    }
    setPhase("submitted");
    setError(null);
    let response: Awaited<ReturnType<typeof submitRoundGuess>>;
    try {
      response = await submitRoundGuess({
        token,
        latitude: guess.latitude,
        longitude: guess.longitude,
        displayName: playerName,
      });
    } catch {
      setError("We couldn’t reach the server. Your pin is still placed — try submitting again.");
      setPhase("guess_placed");
      return;
    }
    if (!response.ok) {
      showRunError(response.error, "guess_placed");
      return;
    }
    const summary: RoundSummary = {
      round: response.round,
      locationName: response.location.name,
      country: response.location.country,
      score: response.breakdown.score,
      distanceKm: response.breakdown.distanceKm,
      cluesUsed: response.breakdown.cluesUsed,
    };
    const nextSummaries = [...summaries, summary];
    setSummaries(nextSummaries);
    setResult(response);
    setSessionScore(response.sessionScore);
    setPhase("result");
    setCameraKey(`${response.round}:result`);
    recordRound({
      sessionScore: response.sessionScore,
      finished: response.finished,
      daily: response.daily,
      dateKey,
      mode: response.mode,
    });
    persist({
      result: response,
      summaries: nextSummaries,
      sessionScore: response.sessionScore,
      token,
    });
  }

  async function handleNext() {
    const continuation = result?.continuation;
    if (!continuation) {
      return;
    }
    setPhase("next_round");
    setError(null);
    let response: Awaited<ReturnType<typeof startRound>>;
    try {
      response = await startRound({ mode, daily, continuation });
    } catch {
      setError("We couldn’t reach the server. Check your connection and try again.");
      setPhase("result");
      return;
    }
    if (!response.ok) {
      showRunError(response.error, "result");
      return;
    }
    adopt(response, "next");
  }

  function handleReplay() {
    clearActiveRun();
    setRevealing(false);
    setResult(null);
    setGuess(null);
    setSummaries([]);
    setError(null);
    setPhase("loading");
    setCameraKey(`replay-${Date.now()}:next`);
    setLoadKey((value) => value + 1);
  }

  const shortcuts = useRef({
    phase,
    finished: false,
    submit: () => {},
    next: () => {},
    replay: () => {},
    reveal: () => {},
  });
  useEffect(() => {
    shortcuts.current = {
      phase,
      finished: Boolean(result?.finished),
      submit: () => void handleSubmit(),
      next: () => void handleNext(),
      replay: handleReplay,
      reveal: () => void handleReveal(),
    };
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      const current = shortcuts.current;
      if (event.key === "Enter") {
        // Let focused buttons and links handle Enter themselves.
        if (target?.closest("button, a, summary")) {
          return;
        }
        if (current.phase === "guess_placed") {
          event.preventDefault();
          current.submit();
        } else if (current.phase === "result") {
          event.preventDefault();
          if (current.finished) {
            current.replay();
          } else {
            current.next();
          }
        }
        return;
      }
      if ((event.key === "c" || event.key === "C") && (current.phase === "playing" || current.phase === "guess_placed")) {
        event.preventDefault();
        current.reveal();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handlePlayerName(name: string) {
    localStorage.setItem("geotease-player", name.slice(0, 18));
    window.dispatchEvent(new Event(PLAYER_EVENT));
  }

  const shownGuess = result?.guess ?? guess;
  const mapResult = useMemo(() => {
    if (!result) {
      return null;
    }
    return {
      guess: result.guess,
      target: {
        latitude: result.location.latitude,
        longitude: result.location.longitude,
      },
      distanceKm: result.breakdown.distanceKm,
      locationType: result.location.type,
      locationName: result.location.name,
      country: result.location.country,
    };
  }, [result]);

  const announcement = result
    ? `${result.location.name}, ${result.location.country}. You were ${formatDistance(result.breakdown.distanceKm)} away for ${formatPoints(result.breakdown.score)} points.`
    : clues.length > 0
      ? `Clue ${clues.length} of ${totalClues}: ${clues[clues.length - 1]}`
      : "";

  return (
    <div className="grid h-dvh grid-cols-1 grid-rows-[auto_minmax(200px,42dvh)_minmax(0,1fr)] overflow-hidden bg-paper md:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)]">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <GameHeader
        score={sessionScore}
        difficulty={difficulty}
        round={round}
        totalRounds={totalRounds}
        daily={daily}
      />
      <div className="relative min-h-0 md:col-start-2 md:row-start-2">
        <GeoMap
          interactive={phase === "playing" || phase === "guess_placed"}
          guess={shownGuess}
          result={mapResult}
          cameraKey={cameraKey}
          difficulty={difficulty}
          onGuess={handleGuess}
        />
      </div>
      <section
        aria-label={result ? "Result" : "Clues"}
        className="min-h-0 overflow-y-auto overscroll-contain border-t border-line bg-raised md:col-start-1 md:row-start-2 md:border-t-0 md:border-r"
      >
        <CluePanel
          mode={mode}
          phase={phase}
          clues={clues}
          totalClues={totalClues}
          guess={guess}
          result={result}
          summaries={summaries}
          error={error}
          revealing={revealing}
          playerName={playerName}
          onPlayerName={handlePlayerName}
          onReveal={() => void handleReveal()}
          onSubmit={() => void handleSubmit()}
          onNext={() => void handleNext()}
          onReplay={handleReplay}
        />
      </section>
    </div>
  );
}
