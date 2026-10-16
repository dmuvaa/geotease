import { haversineKm } from "../scoring/score.ts";

export type AreaRing = number[][];

export type AreaGeometry =
  | { type: "Polygon"; coordinates: AreaRing[] }
  | { type: "MultiPolygon"; coordinates: AreaRing[][] };

export type AreaCandidate = {
  latitude: number;
  longitude: number;
  category?: string;
  kind?: string;
  addressType?: string;
  boundingBox?: [number, number, number, number];
  geometry?: AreaGeometry;
};

const NEAR_KM = 80;
const MAX_SPAN_KM = 280;
const MIN_SPAN_KM = 0.4;
const MAX_RING_POINTS = 700;

export function circlePolygon(
  center: { latitude: number; longitude: number },
  radiusKm: number,
  steps = 72,
): AreaGeometry {
  const ring: AreaRing = [];
  const earthRadiusKm = 6371;
  const latitude = (center.latitude * Math.PI) / 180;
  const longitude = (center.longitude * Math.PI) / 180;
  const angular = radiusKm / earthRadiusKm;
  for (let index = 0; index <= steps; index += 1) {
    const bearing = (index / steps) * Math.PI * 2;
    const nextLatitude = Math.asin(
      Math.sin(latitude) * Math.cos(angular) + Math.cos(latitude) * Math.sin(angular) * Math.cos(bearing),
    );
    const nextLongitude =
      longitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(latitude),
        Math.cos(angular) - Math.sin(latitude) * Math.sin(nextLatitude),
      );
    ring.push([wrapLongitude((nextLongitude * 180) / Math.PI), (nextLatitude * 180) / Math.PI]);
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]]);
  }
  return { type: "Polygon", coordinates: [ring] };
}

export function visitCoordinates(geometry: AreaGeometry, visit: (longitude: number, latitude: number) => void) {
  const walk = (value: unknown) => {
    if (!Array.isArray(value) || value.length === 0) {
      return;
    }
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      visit(value[0], value[1]);
      return;
    }
    for (const child of value) {
      walk(child);
    }
  };
  walk(geometry.coordinates);
}

export function selectPlaceArea(
  candidates: AreaCandidate[],
  target: { latitude: number; longitude: number },
  type: "city" | "town",
): AreaGeometry {
  const near = candidates.filter((candidate) => haversineKm(candidate, target) <= NEAR_KM);
  const polygons = near
    .filter((candidate): candidate is AreaCandidate & { geometry: AreaGeometry } => {
      if (!candidate.geometry) {
        return false;
      }
      const span = spanKm(candidate.geometry);
      return span >= MIN_SPAN_KM && span <= MAX_SPAN_KM;
    })
    .sort((left, right) => {
      const rank = placeRank(left, type) - placeRank(right, type);
      if (rank !== 0) {
        return rank;
      }
      return haversineKm(left, target) - haversineKm(right, target);
    });
  if (polygons[0]) {
    return simplifyGeometry(polygons[0].geometry);
  }

  for (const candidate of near) {
    if (!candidate.boundingBox) {
      continue;
    }
    const radius = bboxRadiusKm(candidate.boundingBox);
    if (radius >= 2 && radius <= 45) {
      return circlePolygon(target, radius);
    }
  }
  return circlePolygon(target, type === "town" ? 5 : 14);
}

function placeRank(candidate: AreaCandidate, type: "city" | "town") {
  const label = candidate.addressType ?? candidate.kind ?? "";
  if (label === type) {
    return 0;
  }
  if (label === "city" || label === "town") {
    return 1;
  }
  if (label === "municipality" || label === "village") {
    return 2;
  }
  if (label === "county" || label === "state" || label === "region") {
    return 9;
  }
  return 4;
}

function wrapLongitude(longitude: number) {
  return ((longitude + 540) % 360) - 180;
}

function spanKm(geometry: AreaGeometry) {
  let south = 90;
  let north = -90;
  let west = 180;
  let east = -180;
  visitCoordinates(geometry, (longitude, latitude) => {
    south = Math.min(south, latitude);
    north = Math.max(north, latitude);
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
  });
  if (south > north || west > east) {
    return 0;
  }
  return haversineKm({ latitude: south, longitude: west }, { latitude: north, longitude: east });
}

function bboxRadiusKm(box: [number, number, number, number]) {
  const [south, north, west, east] = box;
  const height = haversineKm({ latitude: south, longitude: west }, { latitude: north, longitude: west });
  const width = haversineKm({ latitude: south, longitude: west }, { latitude: south, longitude: east });
  return Math.max(height, width) / 2;
}

function simplifyRing(ring: AreaRing) {
  if (ring.length <= MAX_RING_POINTS) {
    return ring;
  }
  const step = Math.ceil((ring.length - 1) / (MAX_RING_POINTS - 1));
  const next: AreaRing = [];
  for (let index = 0; index < ring.length - 1; index += step) {
    next.push(ring[index]);
  }
  const first = next[0];
  if (first) {
    next.push([first[0], first[1]]);
  }
  return next;
}

function simplifyGeometry(geometry: AreaGeometry): AreaGeometry {
  if (geometry.type === "Polygon") {
    return { type: "Polygon", coordinates: geometry.coordinates.map(simplifyRing) };
  }
  return {
    type: "MultiPolygon",
    coordinates: geometry.coordinates.map((polygon) => polygon.map(simplifyRing)),
  };
}
