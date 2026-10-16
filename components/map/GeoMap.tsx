"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { syncAreaFill } from "@/components/map/AreaFill";
import { createGuessElement } from "@/components/map/GuessMarker";
import { createTargetElement, syncResultLine } from "@/components/map/ResultLine";
import { showsSettlementArea } from "@/lib/game/proximity";
import { greatCircle, splitAntimeridian } from "@/lib/map/great-circle";
import { labelTierCaption, labelTierFor } from "@/lib/map/labels";
import { playMapAdjust, playMapTravel } from "@/lib/map/map-sound";
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
        setMapError("The map is taking a while to load. You can still enter coordinates.");
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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : 900;
    if (result) {
      const bounds = new lib.LngLatBounds();
      bounds.extend([result.guess.longitude, result.guess.latitude]);
      bounds.extend([result.target.longitude, result.target.latitude]);
      if (visibleArea) {
        visitCoordinates(visibleArea, (longitude, latitude) => {
          bounds.extend([longitude, latitude]);
        });
      }
      map.fitBounds(bounds, {
        padding: { top: 64, right: 64, bottom: 72, left: 64 },
        maxZoom: visibleArea ? 11 : 12,
        duration,
      });
      return;
    }
    if (cameraKey.endsWith(":start")) {
      return;
    }
    map.flyTo({ center: [12, 18], zoom: 1.55, bearing: 0, pitch: 0, duration });
  }, [cameraKey, ready, result, visibleArea]);

  return (
    <div className="map-stage relative h-full min-h-[240px]">
      <div ref={containerRef} className="h-full w-full" />
      <p className="sr-only">
        Satellite globe. {labelTierCaption(labelTierFor(difficulty))}. Drag to pan, scroll or pinch to zoom, and twist
        to rotate. Click or tap to place a guess, then drag the pin to move it.
      </p>
      {interactive && !result ? (
        <div className="pointer-events-none absolute left-3 top-3">
          <p className="rounded-full bg-black/55 px-3 py-1 text-xs text-white/90">
            {guess ? "Drag the pin to move it" : "Drag, zoom, and spin. Click to pin."}
          </p>
        </div>
      ) : null}
      {mapError ? (
        <div className="pointer-events-none absolute inset-x-4 top-4 rounded-2xl bg-paper/95 px-4 py-3 text-sm text-ink">
          {mapError}
        </div>
      ) : null}
    </div>
  );
}

function isAreaGeometry(value: unknown): value is AreaGeometry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as { type?: unknown; coordinates?: unknown };
  return (record.type === "Polygon" || record.type === "MultiPolygon") && Array.isArray(record.coordinates);
}
