import { CLIENT_ANALYTICS_EVENTS, type ClientAnalyticsEvent } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { isGameMode } from "@/lib/game/modes";
import { cookies } from "next/headers";

const allowed = new Set<string>(CLIENT_ANALYTICS_EVENTS);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false }, { status: 400 });
  }
  const event = "event" in body ? body.event : null;
  const mode = "mode" in body ? body.mode : null;
  if (typeof event !== "string" || !allowed.has(event)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const safeMode = typeof mode === "string" && isGameMode(mode) ? mode : null;
  const jar = await cookies();
  await trackEvent(
    event as ClientAnalyticsEvent,
    { mode: safeMode },
    jar.get("geotease_sid")?.value ?? null,
  );
  return Response.json({ ok: true });
}
