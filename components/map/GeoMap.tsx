"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { syncAreaFill } from "@/components/map/AreaFill";
import { createGuessElement } from "@/components/map/GuessMarker";
import { createTargetElement, syncResultLine } from "@/components/map/ResultLine";
import { showsSettlementArea } from "@/lib/game/proximity";
import { greatCircle, splitAntimeridian } from "@/lib/map/great-circle";
import { labelTierCaption, labelTierFor } from "@/lib/map/labels";
import { SOUND_EVENT, isSoundOn, playMapAdjust, playMapTravel, setSoundOn } from "@/lib/map/map-sound";
import { type AreaGeometry, circlePolygon, visitCoordinates } from "@/lib/map/place-area";
import { applyLabelTier, satelliteStyle } from "@/lib/map/satellite-style";
import type { Difficulty, LocationType } from "@/types/location";
import type { Coordinates } from "@/types/game";

type MapResult = {
  guess: Coordinates;
  target: Coordinates;
  distanceKm: number;
  locationType: LocationType;
  locationName: string;
  country: string;
};

const WORLD_VIEW = { center: [12, 18] as [number, number], zoom: 1.55, bearing: 0, pitch: 0 };

function subscribeSound(callback: () => void) {
  window.addEventListener(SOUND_EVENT, callback);
  return () => window.removeEventListener(SOUND_EVENT, callback);
}

function motionDuration(ms: number) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
}

type Props = {
  interactive: boolean;
  guess: Coordinates | null;
  result: MapResult | null;
  cameraKey: string;
  difficulty: Difficulty | null;
  onGuess: (guess: Coordinates) => void;
};

export function GeoMap({ interactive, guess, result, cameraKey, difficulty, onGuess }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const libRef = useRef<typeof import("maplibre-gl") | null>(null);
  const guessMarker = useRef<Marker | null>(null);
  const targetMarker = useRef<Marker | null>(null);
  const onGuessRef = useRef(onGuess);
  const propsRef = useRef({ interactive, guess, result, area: null as AreaGeometry | null });
  const paintRef = useRef<() => void>(() => {});
  const difficultyRef = useRef(difficulty);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [area, setArea] = useState<AreaGeometry | null>(null);
  const [areaKeyLoaded, setAreaKeyLoaded] = useState("");
  const soundOn = useSyncExternalStore(subscribeSound, isSoundOn, () => true);

  const areaKey =
    result && showsSettlementArea(result.distanceKm, result.locationType)
      ? `${result.target.latitude.toFixed(4)},${result.target.longitude.toFixed(4)}`
      : "";
  const visibleArea = areaKey && areaKeyLoaded === areaKey ? area : null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let alive = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void (async () => {
      const lib = await import("maplibre-gl");
      if (!alive || !containerRef.current) {
        return;
      }
      // Turbopack cannot serve MapLibre's bundled worker URL. These files are
      // copied from maplibre-gl/dist into public/.
      lib.setWorkerUrl("/maplibre-gl-worker.mjs");
      libRef.current = lib;
      const map = new lib.Map({
        container,
        style: satelliteStyle(labelTierFor(difficultyRef.current)),
        center: [12, 18],
        zoom: 1.55,
        minZoom: 0.8,
        maxZoom: 13,
        maxPitch: 70,
        attributionControl: { compact: true },
        fadeDuration: reducedMotion ? 0 : 250,
        dragRotate: true,
        pitchWithRotate: true,
        touchPitch: true,
        touchZoomRotate: true,
        cooperativeGestures: false,
        keyboard: true,
        doubleClickZoom: true,
        scrollZoom: true,
        renderWorldCopies: false,
      });
      map.addControl(new lib.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new lib.ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");
      map.touchZoomRotate.enableRotation();
      map.on("load", () => {
        if (!alive) {
          return;
        }
        try {
          map.setProjection({ type: "globe" });
        } catch {
          // The mercator map remains usable if the globe cannot start.
        }
        setMapError(null);
        setReady(true);
      });
      map.on("style.load", () => {
        if (alive) {
          paintRef.current();
        }
      });
      map.on("idle", () => {
        if (alive) {
          paintRef.current();
        }
      });
      map.on("movestart", (event) => {
        if (event.originalEvent) {
          playMapAdjust();
          return;
        }
        playMapTravel();
      });
      map.on("click", (event) => {
        const current = propsRef.current;
        if (!current.interactive || current.result) {
          return;
        }
        onGuessRef.current({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        });
      });
      mapRef.current = map;
    })();

    const slowTimer = window.setTimeout(() => {
      if (!mapRef.current?.isStyleLoaded()) {
        setMapError("The globe is taking a while to load. You can still type coordinates in the clue panel.");
      }
    }, 8000);

    return () => {
      alive = false;
      window.clearTimeout(slowTimer);
      guessMarker.current?.remove();
      targetMarker.current?.remove();
      guessMarker.current = null;
      targetMarker.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!areaKey || !result || !showsSettlementArea(result.distanceKm, result.locationType)) {
      return;
    }
    const controller = new AbortController();
    const target = result.target;
    const locationType = result.locationType === "town" ? "town" : "city";
    const params = new URLSearchParams({
      lat: String(target.latitude),
      lng: String(target.longitude),
      type: locationType,
      name: result.locationName,
      country: result.country,
    });
    void (async () => {
      try {
        const response = await fetch(`/api/place-area?${params}`, { signal: controller.signal });
        const body: unknown = await response.json();
        const geometry =
          body && typeof body === "object" && "geometry" in body && isAreaGeometry(body.geometry)
            ? body.geometry
            : circlePolygon(target, locationType === "town" ? 5 : 14);
        if (!controller.signal.aborted) {
          setArea(geometry);
          setAreaKeyLoaded(areaKey);
        }
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        setArea(circlePolygon(target, locationType === "town" ? 5 : 14));
        setAreaKeyLoaded(areaKey);
      }
    })();
    return () => controller.abort();
  }, [areaKey, result]);

  function paint() {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib) {
      return;
    }
    const current = propsRef.current;
    map.getCanvas().style.cursor = current.interactive && !current.result ? "crosshair" : "grab";

    if (!current.guess) {
      guessMarker.current?.remove();
      guessMarker.current = null;
    } else if (!guessMarker.current) {
      const marker = new lib.Marker({
        element: createGuessElement(),
        anchor: "bottom",
        draggable: current.interactive && !current.result,
      })
        .setLngLat([current.guess.longitude, current.guess.latitude])
        .addTo(map);
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onGuessRef.current({ latitude: lngLat.lat, longitude: lngLat.lng });
      });
      guessMarker.current = marker;
    } else {
      const currentLngLat = guessMarker.current.getLngLat();
      if (
        Math.abs(currentLngLat.lat - current.guess.latitude) > 0.0000001 ||
        Math.abs(currentLngLat.lng - current.guess.longitude) > 0.0000001
      ) {
        guessMarker.current.setLngLat([current.guess.longitude, current.guess.latitude]);
      }
      guessMarker.current.setDraggable(current.interactive && !current.result);
    }

    if (!map.isStyleLoaded()) {
      return;
    }

    if (!current.result) {
      targetMarker.current?.remove();
      targetMarker.current = null;
      syncAreaFill(map, null);
      syncResultLine(map, null);
      return;
    }

    syncAreaFill(map, current.area);

    if (!targetMarker.current) {
      targetMarker.current = new lib.Marker({ element: createTargetElement(), anchor: "center" })
        .setLngLat([current.result.target.longitude, current.result.target.latitude])
        .addTo(map);
    } else {
      targetMarker.current.setLngLat([current.result.target.longitude, current.result.target.latitude]);
    }

    const line = splitAntimeridian(
      greatCircle(
        [current.result.guess.longitude, current.result.guess.latitude],
        [current.result.target.longitude, current.result.target.latitude],
      ),
    );
    syncResultLine(map, line);
  }

  useEffect(() => {
    onGuessRef.current = onGuess;
    difficultyRef.current = difficulty;
    propsRef.current = { interactive, guess, result, area: visibleArea };
    paintRef.current = paint;
  });

  useEffect(() => {
    if (ready) {
      paintRef.current();
    }
  }, [ready, interactive, guess, result, visibleArea]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }
    applyLabelTier(map, labelTierFor(difficulty));
  }, [difficulty, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || !ready) {
      return;
    }
    if (result) {
      fitResult(map, lib, result, visibleArea, motionDuration(900));
      return;
    }
    if (cameraKey.endsWith(":start")) {
      return;
    }
    map.flyTo({ ...WORLD_VIEW, duration: motionDuration(900) });
  }, [cameraKey, ready, result, visibleArea]);

  function worldView() {
    mapRef.current?.flyTo({ ...WORLD_VIEW, duration: motionDuration(800) });
  }

  function focusPin() {
    const map = mapRef.current;
    if (!map || !guess) {
      return;
    }
    map.flyTo({
      center: [guess.longitude, guess.latitude],
      zoom: Math.max(map.getZoom(), 4),
      duration: motionDuration(800),
    });
  }

  function reframeResult() {
    const map = mapRef.current;
    const lib = libRef.current;
    if (map && lib && result) {
      fitResult(map, lib, result, visibleArea, motionDuration(800));
    }
  }

  return (
    <div className="map-stage relative h-full min-h-[240px]">
      <div ref={containerRef} className="h-full w-full" />
      <p className="sr-only">
        Satellite globe. {labelTierCaption(labelTierFor(difficulty))}. Drag to pan, scroll or pinch to zoom, and twist
        to rotate. Click or tap to place a guess, then drag the pin to move it.
      </p>
      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-5rem)] flex-col items-start gap-2">
        {interactive && !result ? (
          <p className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white/95">
            {guess ? (
              <>
                <span className="[@media(pointer:coarse)]:hidden">Click elsewhere or drag the pin to move it</span>
                <span className="hidden [@media(pointer:coarse)]:inline">Tap elsewhere or drag the pin to move it</span>
              </>
            ) : (
              <>
                <span className="[@media(pointer:coarse)]:hidden">Drag to spin, scroll to zoom, click to drop a pin</span>
                <span className="hidden [@media(pointer:coarse)]:inline">Drag to spin, pinch to zoom, tap to drop a pin</span>
              </>
            )}
          </p>
        ) : null}
        {ready ? (
          <div className="pointer-events-auto flex flex-wrap gap-1.5">
            {result ? (
              <button type="button" className="map-overlay-button" onClick={reframeResult}>
                Show both points
              </button>
            ) : (
              <>
                <button type="button" className="map-overlay-button" onClick={worldView}>
                  World view
                </button>
                {guess ? (
                  <button type="button" className="map-overlay-button" onClick={focusPin}>
                    Go to my pin
                  </button>
                ) : null}
              </>
            )}
            <button
              type="button"
              className="map-overlay-button"
              aria-pressed={soundOn}
              onClick={() => setSoundOn(!soundOn)}
              title={soundOn ? "Mute map sounds" : "Turn map sounds on"}
            >
              {soundOn ? "Sound on" : "Sound off"}
            </button>
          </div>
        ) : null}
      </div>
      {!ready && !mapError ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
          <p className="rounded-full bg-black/55 px-4 py-2 text-sm text-white/90">Loading the globe…</p>
        </div>
      ) : null}
      {mapError ? (
        <div role="status" className="pointer-events-none absolute inset-x-4 bottom-10 rounded-2xl bg-paper/95 px-4 py-3 text-sm text-ink">
          {mapError}
        </div>
      ) : null}
    </div>
  );
}

function fitResult(
  map: MapLibreMap,
  lib: typeof import("maplibre-gl"),
  result: MapResult,
  area: AreaGeometry | null,
  duration: number,
) {
  const bounds = new lib.LngLatBounds();
  bounds.extend([result.guess.longitude, result.guess.latitude]);
  bounds.extend([result.target.longitude, result.target.latitude]);
  if (area) {
    visitCoordinates(area, (longitude, latitude) => {
      bounds.extend([longitude, latitude]);
    });
  }
  const compact = map.getContainer().clientHeight < 360;
  const pad = compact ? 36 : 64;
  map.fitBounds(bounds, {
    padding: { top: pad + (compact ? 24 : 16), right: pad, bottom: pad, left: pad },
    maxZoom: area ? 11 : 12,
    duration,
  });
}

function isAreaGeometry(value: unknown): value is AreaGeometry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as { type?: unknown; coordinates?: unknown };
  return (record.type === "Polygon" || record.type === "MultiPolygon") && Array.isArray(record.coordinates);
}
