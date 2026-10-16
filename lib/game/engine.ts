import "server-only";

import { randomBytes, randomInt, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { trackEvent } from "@/lib/analytics/track";
import { getChallenge, listPublished, type ResolvedChallenge } from "@/lib/challenges/repository";
import { DAILY_ROUNDS, FREE_PLAY_ROUNDS } from "@/lib/game/constants";
import { dailyNumber, hashString, utcDateKey } from "@/lib/game/daily";
import { buildShareText } from "@/lib/game/share";
import { readToken, signToken, type NextToken, type PlayToken } from "@/lib/game/token";
import { mapLevelFromChallenge, type MapLevel } from "@/lib/map/labels";
import { saveResult } from "@/lib/leaderboard/store";
import { finalScore, haversineKm } from "@/lib/scoring/score";
import type { GameMode } from "@/types/challenge";
import type { ActionFailure, GuessResult, PublicRound, RevealResult } from "@/types/game";

const SESSION_COOKIE = "geotease_sid";

function failure(error: string): ActionFailure {
  return { ok: false, error };
}

async function sessionId() {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{16,}$/.test(existing)) {
    return existing;
  }
  const created = randomBytes(16).toString("base64url");
  jar.set(SESSION_COOKIE, created, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return created;
}

export function sanitizeName(input: string | undefined, sid: string) {
  const cleaned = (input ?? "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} _.'-]/gu, "")
    .trim()
    .slice(0, 18);
  if (cleaned.length < 2) {
    return `Explorer ${sid.slice(0, 4).toUpperCase()}`;
  }
  return cleaned;
}

function isCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function publicRound(challenge: ResolvedChallenge, token: PlayToken): PublicRound {
  const clue = challenge.clues[token.revealed - 1];
  if (!clue) {
    throw new Error(`Challenge ${challenge.id} has no clue ${token.revealed}`);
  }
  return {
    ok: true,
    token: signToken(token),
    mode: token.mode,
    difficulty: challenge.difficulty,
    clue: clue.text,
    revealed: token.revealed,
    totalClues: challenge.clues.length,
    round: token.round,
    totalRounds: token.totalRounds,
    sessionScore: token.sessionScore,
    daily: token.daily,
    dailyNumber: token.daily ? dailyNumber() : null,
    targetKind: challenge.targetKind,
    dateKey: utcDateKey(),
  };
}

function pickChallenge(mode: GameMode, seen: string[], daily: boolean, difficulty: MapLevel) {
  const pool = listPublished(mode);
  if (pool.length === 0) {
    return null;
  }
  if (daily) {
    return pool[hashString(`${utcDateKey()}:${mode}`) % pool.length];
  }
  const atLevel = pool.filter(
    (challenge) => mapLevelFromChallenge(challenge.difficulty) === difficulty,
  );
  const eligible = atLevel.length > 0 ? atLevel : pool;
  const fresh = eligible.filter((challenge) => !seen.includes(challenge.id));
  const source = fresh.length > 0 ? fresh : eligible;
  return source[randomInt(source.length)];
}

export async function loadRound(input: {
  mode: GameMode;
  daily: boolean;
  continuation?: string | null;
  difficulty?: MapLevel | null;
}): Promise<PublicRound | ActionFailure> {
  const sid = await sessionId();
  let seen: string[] = [];
  let round = 1;
  let sessionScore = 0;
  let difficulty = input.difficulty ?? "medium";
  const totalRounds = input.daily ? DAILY_ROUNDS : FREE_PLAY_ROUNDS;

  if (input.continuation) {
    const continuation = readToken(input.continuation);
    if (!continuation || continuation.kind !== "next") {
      return failure("That round expired. Start again.");
    }
    if (continuation.mode !== input.mode || continuation.daily !== input.daily || continuation.sid !== sid) {
      return failure("That round does not belong to this game.");
    }
    if (continuation.round > continuation.totalRounds) {
      return failure("This game is already finished.");
    }
    seen = continuation.seen;
    round = continuation.round;
    sessionScore = continuation.sessionScore;
    difficulty = continuation.difficulty ?? difficulty;
  }

  const challenge = pickChallenge(input.mode, seen, input.daily, difficulty);
  if (!challenge) {
    return failure("No challenges are published for this mode yet.");
  }

  const token: PlayToken = {
    kind: "play",
    sid,
    cid: challenge.id,
    revealed: 1,
    seen: seen.includes(challenge.id) ? seen : [...seen, challenge.id],
    round,
    totalRounds,
    sessionScore,
    daily: input.daily,
    mode: input.mode,
    difficulty,
    iat: Date.now(),
  };

  if (round === 1) {
    await trackEvent("game_started", { mode: input.mode, daily: input.daily }, sid);
    if (input.daily) {
      await trackEvent("daily_game_started", { mode: input.mode }, sid);
    }
  }

  return publicRound(challenge, token);
}

export async function revealNextClue(tokenValue: string): Promise<RevealResult | ActionFailure> {
  const token = readToken(tokenValue);
  if (!token || token.kind !== "play") {
    return failure("This round expired. Start again.");
  }
  const sid = await sessionId();
  if (token.sid !== sid) {
    return failure("This round belongs to another session.");
  }
  const challenge = getChallenge(token.cid);
  if (!challenge) {
    return failure("This challenge is no longer available.");
  }
  if (token.revealed >= challenge.clues.length) {
    return failure("Every clue is already open.");
  }
  const revealed = token.revealed + 1;
  const clue = challenge.clues[revealed - 1];
  const next: PlayToken = { ...token, revealed, iat: Date.now() };
  await trackEvent(
    "clue_revealed",
    { mode: token.mode, revealed, daily: token.daily },
    sid,
  );
  return {
    ok: true,
    token: signToken(next),
    clue: clue.text,
    revealed,
    totalClues: challenge.clues.length,
  };
}

export async function submitGuess(input: {
  token: string;
  latitude: number;
  longitude: number;
  displayName?: string;
}): Promise<GuessResult | ActionFailure> {
  const token = readToken(input.token);
  if (!token || token.kind !== "play") {
    return failure("This round expired. Start again.");
  }
  const sid = await sessionId();
  if (token.sid !== sid) {
    return failure("This round belongs to another session.");
  }
  if (!isCoordinate(input.latitude, input.longitude)) {
    return failure("That pin is not a valid location.");
  }
  const challenge = getChallenge(token.cid);
  if (!challenge) {
    return failure("This challenge is no longer available.");
  }

  const distanceKm = haversineKm(
    { latitude: input.latitude, longitude: input.longitude },
    { latitude: challenge.location.latitude, longitude: challenge.location.longitude },
  );
  const breakdown = finalScore({
    distanceKm,
    toleranceKm: challenge.toleranceKm,
    cluesUsed: token.revealed,
    difficulty: challenge.difficulty,
  });
  const sessionScore = token.sessionScore + breakdown.score;
  const finished = token.round >= token.totalRounds;
  const dailyNumberValue = token.daily ? dailyNumber() : null;
  const continuation: NextToken | null = finished
    ? null
    : {
        kind: "next",
        sid,
        seen: token.seen,
        round: token.round + 1,
        totalRounds: token.totalRounds,
        sessionScore,
        daily: token.daily,
        mode: token.mode,
        difficulty: token.difficulty,
        iat: Date.now(),
      };

  const result: GuessResult = {
    ok: true,
    breakdown,
    location: {
      name: challenge.location.name,
      country: challenge.location.country,
      region: challenge.location.region,
      latitude: challenge.location.latitude,
      longitude: challenge.location.longitude,
      type: challenge.location.type,
      description: challenge.location.description,
    },
    guess: { latitude: input.latitude, longitude: input.longitude },
    event: challenge.event
      ? {
          title: challenge.event.title,
          year: challenge.event.year,
          category: challenge.event.category,
          description: challenge.event.description,
        }
      : null,
    sourceUrl: challenge.event?.sourceUrl ?? challenge.location.sourceUrl ?? null,
    sessionScore,
    round: token.round,
    totalRounds: token.totalRounds,
    finished,
    continuation: continuation ? signToken(continuation) : null,
    shareText: buildShareText({
      daily: token.daily,
      dailyNumber: dailyNumberValue,
      mode: token.mode,
      score: breakdown.score,
      distanceKm,
      cluesUsed: token.revealed,
    }),
    daily: token.daily,
    dailyNumber: dailyNumberValue,
    mode: token.mode,
    difficulty: challenge.difficulty,
  };

  await saveResult({
    id: randomUUID(),
    sessionId: sid,
    displayName: sanitizeName(input.displayName, sid),
    mode: token.mode,
    challengeId: challenge.id,
    score: breakdown.score,
    distanceKm,
    cluesUsed: token.revealed,
    difficulty: challenge.difficulty,
    daily: token.daily,
    createdAt: new Date().toISOString(),
  });
  await trackEvent(
    "guess_submitted",
    {
      mode: token.mode,
      score: breakdown.score,
      distanceKm: Math.round(distanceKm * 10) / 10,
      cluesUsed: token.revealed,
      daily: token.daily,
      round: token.round,
    },
    sid,
  );
  if (finished) {
    await trackEvent(
      "game_completed",
      { mode: token.mode, score: sessionScore, daily: token.daily, rounds: token.totalRounds },
      sid,
    );
  }
  return result;
}
