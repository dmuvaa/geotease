import { formatDistance, formatPoints } from "@/lib/game/format";
import { getMode } from "@/lib/game/modes";
import { proximityMark } from "@/lib/game/proximity";
import type { GameMode } from "@/types/challenge";

export const SITE_URL = "https://geotease.com";

export function playUrl(mode: GameMode, daily: boolean) {
  const slug = getMode(mode).slug;
  return daily ? `${SITE_URL}/daily/${slug}` : `${SITE_URL}/play/${slug}`;
}

export function buildInviteText() {
  return ["🌍 GeoTease", "", "Think you know where it is?", "Clues. Maps. One location.", "", SITE_URL].join("\n");
}

export function buildDailyInviteText(dailyNumber: number) {
  return [
    "🌍 GeoTease",
    `Daily Challenge #${dailyNumber}`,
    "",
    "Same challenges for everyone today.",
    "",
    `${SITE_URL}/daily`,
  ].join("\n");
}

export function buildShareText(input: {
  daily: boolean;
  dailyNumber: number | null;
  mode: GameMode;
  score: number;
  distanceKm: number;
  cluesUsed: number;
}) {
  const mode = getMode(input.mode);
  const lines = ["🌍 GeoTease"];
  if (input.daily && input.dailyNumber) {
    lines.push(`Daily Challenge #${input.dailyNumber}`);
  }
  lines.push(
    "",
    `${mode.emoji} ${mode.title}`,
    "",
    `${proximityMark(input.distanceKm)} ${formatPoints(input.score)} points`,
    `${formatDistance(input.distanceKm)} away · ${input.cluesUsed} ${input.cluesUsed === 1 ? "clue" : "clues"}`,
    "",
    "Can you beat me?",
    "",
    playUrl(input.mode, input.daily),
  );
  return lines.join("\n");
}

export function buildSessionShareText(input: {
  mode: GameMode;
  score: number;
  daily: boolean;
  dailyNumber: number | null;
  distancesKm: number[];
}) {
  const mode = getMode(input.mode);
  const rounds = input.distancesKm.length;
  const lines = ["🌍 GeoTease"];
  if (input.daily && input.dailyNumber) {
    lines.push(`Daily Challenge #${input.dailyNumber}`);
  }
  lines.push(
    "",
    `${mode.emoji} ${mode.title}`,
    `${rounds} ${rounds === 1 ? "round" : "rounds"}`,
    "",
    input.distancesKm.map((distance) => proximityMark(distance)).join(""),
    `${formatPoints(input.score)} points`,
    "",
    "Can you beat me?",
    "",
    playUrl(input.mode, input.daily),
  );
  return lines.join("\n");
}
