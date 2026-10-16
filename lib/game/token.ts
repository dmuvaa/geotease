import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { GameMode } from "@/types/challenge";
import type { MapLevel } from "@/lib/map/labels";

const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export type PlayToken = {
  kind: "play";
  sid: string;
  cid: string;
  revealed: number;
  seen: string[];
  round: number;
  totalRounds: number;
  sessionScore: number;
  daily: boolean;
  mode: GameMode;
  difficulty?: MapLevel;
  iat: number;
};

export type NextToken = {
  kind: "next";
  sid: string;
  seen: string[];
  round: number;
  totalRounds: number;
  sessionScore: number;
  daily: boolean;
  mode: GameMode;
  difficulty?: MapLevel;
  iat: number;
};

export type GameToken = PlayToken | NextToken;

function secret() {
  const value = process.env.GEOTEASE_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    console.warn("GEOTEASE_SECRET is not set. Signed rounds can be forged until it is.");
  }
  return value || "geotease-dev-secret";
}

export function signToken(payload: GameToken) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readToken(token: string): GameToken | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as GameToken;
    if (!payload || (payload.kind !== "play" && payload.kind !== "next")) {
      return null;
    }
    if (!Number.isFinite(payload.iat) || Date.now() - payload.iat > MAX_AGE_MS) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
