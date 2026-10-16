import { NextResponse } from "next/server";
import { type AreaCandidate, type AreaGeometry, selectPlaceArea } from "@/lib/map/place-area";

const cache = new Map<string, AreaGeometry>();
const CACHE_LIMIT = 120;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lng"));
  const type = url.searchParams.get("type");
  const name = clean(url.searchParams.get("name") ?? "");
  const country = clean(url.searchParams.get("country") ?? "");

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  if (type !== "city" && type !== "town") {
    return NextResponse.json({ error: "Not a city area" }, { status: 400 });
  }
  if (!name || !country) {
    return NextResponse.json({ error: "Missing place" }, { status: 400 });
  }

  const key = `${type}:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached) {
    return NextResponse.json({ geometry: cached }, { headers: cacheHeaders });
  }

  const target = { latitude, longitude };
  try {
    const candidates = await searchPlace(name, country);
    const geometry = selectPlaceArea(candidates, target, type);
    remember(key, geometry);
    return NextResponse.json({ geometry }, { headers: cacheHeaders });
  } catch {
    const geometry = selectPlaceArea([], target, type);
    return NextResponse.json({ geometry });
  }
}

const cacheHeaders = { "Cache-Control": "public, max-age=86400" };

function clean(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80);
}

function remember(key: string, geometry: AreaGeometry) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      cache.delete(oldest);
    }
  }
  cache.set(key, geometry);
}

async function searchPlace(name: string, country: string) {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("polygon_geojson", "1");
  endpoint.searchParams.set("limit", "5");
  endpoint.searchParams.set("q", `${name}, ${country}`);
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "GeoTease/1.0 (https://geotease.com)",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error("Place lookup failed");
  }
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.flatMap((row) => {
    const candidate = readCandidate(row);
    return candidate ? [candidate] : [];
  });
}

function readCandidate(row: unknown): AreaCandidate | null {
  if (!row || typeof row !== "object") {
    return null;
  }
  const record = row as Record<string, unknown>;
  const latitude = Number(record.lat);
  const longitude = Number(record.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  const box = Array.isArray(record.boundingbox) ? record.boundingbox.map(Number) : [];
  const geometry = readGeometry(record.geojson);
  return {
    latitude,
    longitude,
    category: typeof record.category === "string" ? record.category : undefined,
    kind: typeof record.type === "string" ? record.type : undefined,
    addressType: typeof record.addresstype === "string" ? record.addresstype : undefined,
    boundingBox: box.length === 4 && box.every(Number.isFinite) ? [box[0], box[1], box[2], box[3]] : undefined,
    geometry,
  };
}

function readGeometry(value: unknown): AreaGeometry | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if ((record.type === "Polygon" || record.type === "MultiPolygon") && Array.isArray(record.coordinates)) {
    return { type: record.type, coordinates: record.coordinates } as AreaGeometry;
  }
  return undefined;
}
