export const ANALYTICS_EVENTS = [
  "game_started",
  "clue_revealed",
  "guess_placed",
  "guess_submitted",
  "game_completed",
  "game_abandoned",
  "share_clicked",
  "daily_game_started",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export const CLIENT_ANALYTICS_EVENTS = [
  "guess_placed",
  "share_clicked",
  "game_abandoned",
] as const satisfies readonly AnalyticsEventName[];

export type ClientAnalyticsEvent = (typeof CLIENT_ANALYTICS_EVENTS)[number];
