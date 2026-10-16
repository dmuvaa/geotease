export function formatDistance(km: number) {
  if (!Number.isFinite(km) || km < 0) {
    return "—";
  }
  if (km < 1) {
    return `${Math.max(0, Math.round(km * 1000))} m`;
  }
  const rounded = km < 100 ? Math.round(km * 10) / 10 : Math.round(km);
  const text = rounded.toLocaleString("en-US", {
    maximumFractionDigits: km < 100 ? 1 : 0,
    minimumFractionDigits: 0,
  });
  return `${text} km`;
}

export function formatPoints(score: number) {
  return Math.round(score).toLocaleString("en-US");
}

export function formatMultiplier(value: number) {
  return `${value.toFixed(2)}×`;
}

export function formatCoordinate(latitude: number, longitude: number) {
  const latitudeHemisphere = latitude >= 0 ? "N" : "S";
  const longitudeHemisphere = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(2)}° ${latitudeHemisphere}, ${Math.abs(longitude).toFixed(2)}° ${longitudeHemisphere}`;
}

export function formatDifficulty(difficulty: string) {
  return difficulty.slice(0, 1).toUpperCase() + difficulty.slice(1);
}
