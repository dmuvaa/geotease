export const CLOSE_AREA_KM = 100;

export type Proximity = "close" | "near" | "far" | "miss";

export function proximityOf(distanceKm: number): Proximity {
  if (distanceKm <= CLOSE_AREA_KM) {
    return "close";
  }
  if (distanceKm <= 500) {
    return "near";
  }
  if (distanceKm <= 2000) {
    return "far";
  }
  return "miss";
}

const MARKS: Record<Proximity, string> = {
  close: "🟩",
  near: "🟨",
  far: "🟧",
  miss: "🟥",
};

export function proximityMark(distanceKm: number) {
  return MARKS[proximityOf(distanceKm)];
}

export function showsSettlementArea(distanceKm: number, locationType: string) {
  return distanceKm <= CLOSE_AREA_KM && (locationType === "city" || locationType === "town");
}
