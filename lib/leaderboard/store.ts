import "server-only";

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { formatDailyDate, utcDayBounds } from "@/lib/game/daily";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { GameMode } from "@/types/challenge";
import type { Difficulty } from "@/types/location";
import type { LeaderboardRow, LeaderboardSnapshot, LeaderboardView } from "@/types/game";

export type StoredResult = {
  id: string;
  sessionId: string;
  displayName: string;
  mode: GameMode;
  challengeId: string;
  score: number;
  distanceKm: number;
  cluesUsed: number;
  difficulty: Difficulty;
  daily: boolean;
  createdAt: string;
};

const filePath = path.join(process.cwd(), "data", "leaderboard.json");
const modes = new Set<GameMode>(["where_is_it", "find_it", "where_did_this_happen"]);

function isStoredResult(value: unknown): value is StoredResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<StoredResult>;
  return (
    typeof row.id === "string" &&
    typeof row.sessionId === "string" &&
    typeof row.displayName === "string" &&
    typeof row.mode === "string" &&
    modes.has(row.mode as GameMode) &&
    typeof row.score === "number" &&
    typeof row.distanceKm === "number" &&
    typeof row.cluesUsed === "number" &&
    typeof row.daily === "boolean" &&
    typeof row.createdAt === "string"
  );
}

async function readLocal(): Promise<StoredResult[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isStoredResult) : [];
  } catch {
    return [];
  }
}

async function writeLocal(rows: StoredResult[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, JSON.stringify(rows), "utf8");
  await rename(temporary, filePath);
}

function fromSupabaseRow(row: Record<string, unknown>): StoredResult | null {
  const candidate = {
    id: row.id,
    sessionId: row.session_id,
    displayName: row.display_name,
    mode: row.mode,
    challengeId: row.challenge_id,
    score: row.score,
    distanceKm: row.distance_km,
    cluesUsed: row.clues_used,
    difficulty: row.difficulty,
    daily: row.daily,
    createdAt: row.created_at,
  };
  return isStoredResult(candidate) ? candidate : null;
}

export async function saveResult(row: StoredResult) {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from("game_results").insert({
        id: row.id,
        session_id: row.sessionId,
        display_name: row.displayName,
        mode: row.mode,
        challenge_id: row.challengeId,
        score: row.score,
        distance_km: row.distanceKm,
        clues_used: row.cluesUsed,
        difficulty: row.difficulty,
        daily: row.daily,
        created_at: row.createdAt,
      });
      if (error) {
        console.error("[geotease] leaderboard insert failed", error.message);
      }
      return;
    }
    const existing = await readLocal();
    const next = [...existing, row].slice(-2000);
    await writeLocal(next);
  } catch (error) {
    console.error("[geotease] leaderboard save failed", error);
  }
}

function matchesView(row: StoredResult, view: LeaderboardView) {
  if (view === "all") {
    return true;
  }
  if (view === "daily") {
    return row.daily;
  }
  return row.mode === view;
}

function rankRows(rows: StoredResult[], view: LeaderboardView, sessionId: string): LeaderboardSnapshot {
  const filtered = rows.filter((row) => matchesView(row, view));
  const best = new Map<string, StoredResult>();
  for (const row of filtered) {
    const key = `${row.sessionId}:${row.mode}:${row.daily ? "daily" : "free"}`;
    const current = best.get(key);
    if (
      !current ||
      row.score > current.score ||
      (row.score === current.score && row.distanceKm < current.distanceKm)
    ) {
      best.set(key, row);
    }
  }
  const sorted = [...best.values()].sort(
    (a, b) => b.score - a.score || a.distanceKm - b.distanceKm,
  );
  const yours = sorted
    .map((row, index) => ({ row, rank: index + 1 }))
    .filter((item) => sessionId && item.row.sessionId === sessionId)
    .sort((a, b) => a.rank - b.rank)[0];
  const top: LeaderboardRow[] = sorted.slice(0, 100).map((row, index) => ({
    rank: index + 1,
    displayName: row.displayName,
    mode: row.mode,
    score: row.score,
    distanceKm: row.distanceKm,
    cluesUsed: row.cluesUsed,
    daily: row.daily,
    yours: Boolean(sessionId) && row.sessionId === sessionId,
  }));
  return {
    rows: top,
    yours: yours
      ? { rank: yours.rank, score: yours.row.score, distanceKm: yours.row.distanceKm }
      : null,
    dateLabel: formatDailyDate(),
  };
}

export async function listLeaderboard(view: LeaderboardView, sessionId: string) {
  const bounds = utcDayBounds();
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from("game_results")
        .select("id, session_id, display_name, mode, challenge_id, score, distance_km, clues_used, difficulty, daily, created_at")
        .gte("created_at", bounds.start)
        .lt("created_at", bounds.end)
        .limit(1000);
      if (error) {
        console.error("[geotease] leaderboard read failed", error.message);
        return rankRows([], view, sessionId);
      }
      const rows = (data ?? []).map((row) => fromSupabaseRow(row)).filter((row): row is StoredResult => Boolean(row));
      return rankRows(rows, view, sessionId);
    }
    const local = await readLocal();
    const today = local.filter((row) => row.createdAt >= bounds.start && row.createdAt < bounds.end);
    return rankRows(today, view, sessionId);
  } catch (error) {
    console.error("[geotease] leaderboard read failed", error);
    return rankRows([], view, sessionId);
  }
}
