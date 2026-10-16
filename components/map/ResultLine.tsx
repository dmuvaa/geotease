import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { LngLatTuple } from "@/lib/map/great-circle";

const SOURCE = "geotease-result";
const LAYER = "geotease-result-line";

export function syncResultLine(map: MapLibreMap, lines: LngLatTuple[][] | null) {
  const data = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "MultiLineString" as const,
      coordinates: lines ?? [],
    },
  };
  const existing = map.getSource(SOURCE) as GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  if (!lines || lines.length === 0) {
    return;
  }
  map.addSource(SOURCE, { type: "geojson", data });
  if (!map.getLayer(LAYER)) {
    map.addLayer({
      id: LAYER,
      type: "line",
      source: SOURCE,
      paint: {
        "line-color": "#4dff57",
        "line-width": 3.5,
        "line-opacity": 0.95,
      },
    });
  }
}

export function createTargetElement() {
  const element = document.createElement("div");
  element.className = "map-target";
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", "Correct location");
  return element;
}
