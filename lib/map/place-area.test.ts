import assert from "node:assert/strict";
import test from "node:test";
import { circlePolygon, selectPlaceArea, visitCoordinates } from "./place-area.ts";

const lisbon = { latitude: 38.72, longitude: -9.14 };

test("a nearby city polygon is kept and a country-sized one is not", () => {
  const city = square(38.72, -9.14, 0.08);
  const country = square(38.72, -9.14, 8);
  const geometry = selectPlaceArea(
    [
      { latitude: 38.72, longitude: -9.14, kind: "administrative", category: "boundary", geometry: country },
      { latitude: 38.73, longitude: -9.14, kind: "city", category: "boundary", geometry: city },
    ],
    lisbon,
    "city",
  );
  assert.equal(geometry.type, "Polygon");
  assert.equal(geometry.coordinates[0][0][0], city.coordinates[0][0][0]);
});

test("the city outline wins over the surrounding county", () => {
  const city = square(38.72, -9.14, 0.05);
  const county = square(38.99, -9.14, 0.3);
  const geometry = selectPlaceArea(
    [
      {
        latitude: 38.99,
        longitude: -9.14,
        kind: "administrative",
        addressType: "county",
        category: "boundary",
        geometry: county,
      },
      {
        latitude: 38.71,
        longitude: -9.14,
        kind: "administrative",
        addressType: "city",
        category: "boundary",
        geometry: city,
      },
    ],
    lisbon,
    "city",
  );
  assert.equal(geometry.type, "Polygon");
  if (geometry.type !== "Polygon") {
    return;
  }
  assert.equal(geometry.coordinates[0][0][0], city.coordinates[0][0][0]);
});

test("a missing boundary becomes a circle around the target", () => {
  const geometry = selectPlaceArea([], lisbon, "city");
  assert.equal(geometry.type, "Polygon");
  const ring = geometry.coordinates[0];
  assert.equal(ring[0][0], ring[ring.length - 1][0]);
  assert.equal(ring[0][1], ring[ring.length - 1][1]);
  let south = 90;
  let north = -90;
  visitCoordinates(geometry, (_longitude, latitude) => {
    south = Math.min(south, latitude);
    north = Math.max(north, latitude);
  });
  assert.ok(north - south < 1, "fallback city circle stays local");
  assert.ok(north > lisbon.latitude && south < lisbon.latitude);
});

test("circle rings close", () => {
  const geometry = circlePolygon(lisbon, 14);
  const ring = geometry.coordinates[0];
  assert.ok(ring.length > 8);
  assert.deepEqual(ring[0], ring[ring.length - 1]);
});

function square(latitude: number, longitude: number, delta: number) {
  return {
    type: "Polygon" as const,
    coordinates: [
      [
        [longitude - delta, latitude - delta],
        [longitude + delta, latitude - delta],
        [longitude + delta, latitude + delta],
        [longitude - delta, latitude + delta],
        [longitude - delta, latitude - delta],
      ],
    ],
  };
}
