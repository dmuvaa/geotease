import "server-only";

import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@/lib/analytics/events";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const filePath = path.join(process.cwd(), "data", "analytics.jsonl");

export function isAnalyticsEvent(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

export async function trackEvent(
  event: AnalyticsEventName,
  properties: Record<string, string | number | boolean | null>,
  sessionId?: string | null,
) {
  const row = {
    event,
    sessionId: sessionId ?? null,
    properties,
    createdAt: new Date().toISOString(),
  };
  console.info("[geotease]", JSON.stringify(row));
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from("analytics_events").insert({
        event,
        session_id: sessionId ?? null,
        properties,
      });
      if (error) {
        console.error("[geotease] analytics insert failed", error.message);
      }
      return;
    }
    await mkdir(path.dirname(filePath), { recursive: true });
    await appendFile(filePath, `${JSON.stringify(row)}\n`, "utf8");
  } catch (error) {
    console.error("[geotease] analytics failed", error);
  }
}
