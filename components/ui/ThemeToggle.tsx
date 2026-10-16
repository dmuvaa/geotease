"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  document.addEventListener("geotease-theme", callback);
  return () => document.removeEventListener("geotease-theme", callback);
}

function snapshot() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, snapshot, () => false);

  function toggle() {
    const next = document.documentElement.classList.toggle("dark");
    localStorage.setItem("geotease-theme", next ? "dark" : "light");
    document.dispatchEvent(new Event("geotease-theme"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="min-h-11 rounded-full px-3 text-sm text-muted transition hover:text-ink"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}
