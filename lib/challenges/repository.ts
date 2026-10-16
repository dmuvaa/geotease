import "server-only";

import { challenges, locations } from "@/lib/challenges/catalog";
import type { Challenge, GameMode } from "@/types/challenge";
import type { Location } from "@/types/location";

export type ResolvedChallenge = Challenge & {
  location: Location;
};

const locationById = new Map(locations.map((location) => [location.id, location]));

function resolve(challenge: Challenge): ResolvedChallenge {
  const location = locationById.get(challenge.locationId);
  if (!location) {
    throw new Error(`Challenge ${challenge.id} is missing location ${challenge.locationId}`);
  }
  return {
    ...challenge,
    location,
    clues: [...challenge.clues].sort((a, b) => a.sequence - b.sequence),
  };
}

function assertCatalog() {
  const seenLocations = new Set<string>();
  const seenChallenges = new Set<string>();
  for (const location of locations) {
    if (seenLocations.has(location.id)) {
      throw new Error(`Duplicate location ${location.id}`);
    }
    seenLocations.add(location.id);
    if (location.latitude < -90 || location.latitude > 90 || location.longitude < -180 || location.longitude > 180) {
      throw new Error(`Location ${location.id} has invalid coordinates`);
    }
  }
  for (const challenge of challenges) {
    if (seenChallenges.has(challenge.id)) {
      throw new Error(`Duplicate challenge ${challenge.id}`);
    }
    seenChallenges.add(challenge.id);
    if (!locationById.has(challenge.locationId)) {
      throw new Error(`Challenge ${challenge.id} is missing location ${challenge.locationId}`);
    }
    const sequences = challenge.clues.map((clue) => clue.sequence);
    sequences.forEach((sequence, index) => {
      if (sequence !== index + 1) {
        throw new Error(`Challenge ${challenge.id} has a gap in clue sequence`);
      }
    });
    if (challenge.mode === "where_is_it" && (challenge.clues.length < 4 || challenge.clues.length > 6)) {
      throw new Error(`Challenge ${challenge.id} should have 4 to 6 clues`);
    }
    if (challenge.mode === "where_did_this_happen" && !challenge.event) {
      throw new Error(`Challenge ${challenge.id} is missing its event`);
    }
  }
  for (const mode of ["where_is_it", "find_it", "where_did_this_happen"] as const) {
    if (challenges.filter((challenge) => challenge.mode === mode && challenge.status === "published").length < 8) {
      throw new Error(`Mode ${mode} needs more published challenges`);
    }
  }
}

assertCatalog();

const published = challenges.filter((challenge) => challenge.status === "published").map(resolve);

export function listPublished(mode?: GameMode) {
  return mode ? published.filter((challenge) => challenge.mode === mode) : published;
}

export function getChallenge(id: string) {
  return published.find((challenge) => challenge.id === id);
}
