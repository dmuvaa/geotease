import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { LabelTier } from "@/lib/map/labels";

const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

export function satelliteStyle(tier: LabelTier = "initials"): StyleSpecification {
  return {
    version: 8,
    name: "geotease-satellite",
    glyphs: GLYPHS,
    sources: {
      satellite: {
        type: "raster",
        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© Esri, Maxar, Earthstar Geographics",
      },
      openmaptiles: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
        attribution:
          '© <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#05070c" } },
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        paint: {
          "raster-saturation": 0.12,
          "raster-contrast": 0.06,
        },
      },
      boundary("country-boundary", 2, 0, "rgba(255,255,255,0.88)", [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        0.7,
        4,
        1.5,
      ]),
      boundary("region-boundary", 4, 3.2, "rgba(255,255,255,0.55)", [
        "interpolate",
        ["linear"],
        ["zoom"],
        3,
        0.4,
        7,
        1.3,
      ]),
      label("country-code", true, {
        "text-field": ["coalesce", ["get", "iso_a2"], ""],
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 0, 11, 3, 15],
        "text-letter-spacing": 0.04,
        "text-padding": 4,
        "symbol-sort-key": ["get", "rank"],
      }, {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(4, 12, 18, 0.85)",
        "text-halo-width": 1.3,
      }, ["all", ["==", ["get", "class"], "country"], ["has", "iso_a2"]], 0, 5),
      label(
        "city-major",
        tier !== "initials",
        {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name_en"], ["get", "name:latin"], ["get", "name"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3, 11, 8, 16],
          "text-padding": 6,
          "symbol-sort-key": ["get", "rank"],
        },
        {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(4, 12, 18, 0.88)",
          "text-halo-width": 1.4,
        },
        ["all", ["==", ["get", "class"], "city"], ["<=", ["get", "rank"], 4]],
        3,
        13,
      ),
      label(
        "city-small",
        tier === "towns",
        {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name_en"], ["get", "name:latin"], ["get", "name"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 11, 10, 15],
          "text-padding": 8,
          "symbol-sort-key": ["get", "rank"],
        },
        {
          "text-color": "#f4f7f2",
          "text-halo-color": "rgba(4, 12, 18, 0.88)",
          "text-halo-width": 1.2,
        },
        [
          "any",
          ["all", ["==", ["get", "class"], "city"], [">", ["get", "rank"], 4]],
          ["==", ["get", "class"], "town"],
        ],
        6,
        13,
      ),
    ],
  } as StyleSpecification;
}

export function applyLabelTier(map: MapLibreMap, tier: LabelTier) {
  const show = (id: string, visible: boolean) => {
    if (!map.getLayer(id)) {
      return;
    }
    map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  };
  show("country-code", true);
  show("city-major", tier !== "initials");
  show("city-small", tier === "towns");
}

function boundary(id: string, adminLevel: number, minzoom: number, color: string, width: unknown) {
  return {
    id,
    type: "line" as const,
    source: "openmaptiles",
    "source-layer": "boundary",
    minzoom,
    filter: [
      "all",
      ["==", ["get", "admin_level"], adminLevel],
      ["!=", ["get", "maritime"], 1],
      ["!=", ["get", "disputed"], 1],
      ["!", ["has", "claimed_by"]],
    ],
    paint: {
      "line-color": color,
      "line-width": width,
    },
  };
}

function label(
  id: string,
  visible: boolean,
  layout: Record<string, unknown>,
  paint: Record<string, unknown>,
  filter: unknown[],
  minzoom: number,
  maxzoom: number,
) {
  return {
    id,
    type: "symbol" as const,
    source: "openmaptiles",
    "source-layer": "place",
    minzoom,
    maxzoom,
    filter,
    layout: {
      ...layout,
      visibility: visible ? "visible" : "none",
    },
    paint,
  };
}
