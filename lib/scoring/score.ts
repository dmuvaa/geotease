import type { Difficulty } from "@/types/location";

/**
 * Distance decay in kilometers. A guess one decay-length away scores
 * about 37% of a perfect pin before multipliers. Tuned so a same-country
 * miss still registers, while another continent does not.
 */
export const DISTANCE_DECAY_KM = 500;

export const CLUE_MULTIPLIERS: Record<number, number> = {
  1: 1,
  2: 0.9,
  3: 0.8,
  4: 0.7,
  5: 0.6,
  6: 0.5,
};

/**
 * Difficulty nudges the score without overturning a clearly closer pin.
 * Clue multipliers are larger on purpose: the player chooses those.
 */
export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 0.95,
  medium: 1,
  hard: 1.08,
  expert: 1.15,
};

export function clueMultiplier(cluesUsed: number) {
  return CLUE_MULTIPLIERS[cluesUsed] ?? 0.5;
}

export function distanceScore(distanceKm: number, toleranceKm = 0) {
  const effective = Math.max(0, distanceKm - Math.max(0, toleranceKm));
  const raw = 10000 * Math.exp(-effective / DISTANCE_DECAY_KM);
  return Math.max(0, Math.round(raw));
}

export function finalScore(input: {
  distanceKm: number;
  toleranceKm: number;
  cluesUsed: number;
  difficulty: Difficulty;
}) {
  const geographic = distanceScore(input.distanceKm, input.toleranceKm);
  const clues = clueMultiplier(input.cluesUsed);
  const difficulty = DIFFICULTY_MULTIPLIERS[input.difficulty];
  return {
    distanceKm: input.distanceKm,
    distanceScore: geographic,
    clueMultiplier: clues,
    difficultyMultiplier: difficulty,
    score: Math.max(0, Math.round(geographic * clues * difficulty)),
    cluesUsed: input.cluesUsed,
    withinTolerance: input.toleranceKm > 0 && input.distanceKm <= input.toleranceKm,
    toleranceKm: input.toleranceKm,
  };
}

export function haversineKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(haversine)));
}
