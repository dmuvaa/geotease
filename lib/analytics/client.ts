import type { ClientAnalyticsEvent } from "@/lib/analytics/events";

export function trackClientEvent(event: ClientAnalyticsEvent, mode?: string) {
  const body = JSON.stringify({ event, mode: mode ?? null });
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/events", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
  });
}
