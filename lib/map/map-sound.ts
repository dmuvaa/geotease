let context: AudioContext | null = null;

const SOUND_KEY = "geotease-sound";
export const SOUND_EVENT = "geotease-sound";

export function isSoundOn() {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // Storage can be unavailable in private modes; the toggle still applies to this page.
  }
  muted = !on;
  window.dispatchEvent(new Event(SOUND_EVENT));
}

let muted: boolean | null = null;
let lastAdjustAt = 0;
let lastTravelAt = 0;

function audio() {
  if (typeof window === "undefined") {
    return null;
  }
  if (muted === null) {
    muted = !isSoundOn();
  }
  if (muted) {
    return null;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }
  const Context = window.AudioContext;
  if (!Context) {
    return null;
  }
  if (!context) {
    context = new Context();
  }
  if (context.state === "suspended") {
    void context.resume();
    return null;
  }
  return context;
}

function tone(startHz: number, endHz: number, seconds: number, peak: number) {
  const ctx = audio();
  if (!ctx) {
    return;
  }
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(startHz, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endHz), now + seconds);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.03, seconds / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + seconds + 0.02);
}

export function playMapAdjust() {
  const now = performance.now();
  if (now - lastAdjustAt < 140) {
    return;
  }
  lastAdjustAt = now;
  tone(520, 280, 0.09, 0.03);
}

export function playMapTravel() {
  const now = performance.now();
  if (now - lastTravelAt < 700) {
    return;
  }
  lastTravelAt = now;
  tone(240, 90, 0.42, 0.045);
  tone(480, 180, 0.42, 0.02);
}
