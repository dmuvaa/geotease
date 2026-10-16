import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { AreaGeometry } from "@/lib/map/place-area";

const SOURCE = "geotease-area";
const FILL = "geotease-area-fill";
const LINE = "geotease-area-line";

const FILL_COLOR = "#4dff57";

export function syncAreaFill(map: MapLibreMap, geometry: AreaGeometry | null) {
  if (!geometry) {
    if (map.getLayer(LINE)) {
      map.removeLayer(LINE);
    }
    if (map.getLayer(FILL)) {
      map.removeLayer(FILL);
    }
    if (map.getSource(SOURCE)) {
      map.removeSource(SOURCE);
    }
    return;
  }

  const data = {
    type: "Feature" as const,
    properties: {},
    geometry,
  };
  const existing = map.getSource(SOURCE) as GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }

  map.addSource(SOURCE, { type: "geojson", data });
  map.addLayer({
    id: FILL,
    type: "fill",
    source: SOURCE,
    paint: {
      "fill-color": FILL_COLOR,
      "fill-opacity": 0.38,
    },
  });
  map.addLayer({
    id: LINE,
    type: "line",
    source: SOURCE,
    paint: {
      "line-color": FILL_COLOR,
      "line-width": 4,
      "line-opacity": 1,
    },
  });
}
