export const LOCATION_TYPES = [
  "city",
  "town",
  "landmark",
  "country",
  "island",
  "mountain",
  "river",
  "lake",
  "historical_site",
  "building",
  "stadium",
  "airport",
  "other",
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type Location = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  latitude: number;
  longitude: number;
  type: LocationType;
  difficulty: Difficulty;
  description: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
};
