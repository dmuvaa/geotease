"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { buttonClass } from "@/components/ui/Button";
import { clearActiveRun } from "@/lib/game/run-storage";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  function retry() {
    // A corrupt saved run is the most likely cause of a crash mid-game.
    try {
      clearActiveRun();
    } catch {
      // Storage may be unavailable; retrying is still worthwhile.
    }
    if (typeof reset === "function") {
      reset();
    } else {
      window.location.reload();
    }
  }

  return (
    <SiteFrame>
      <section className="mx-auto max-w-3xl px-5 py-20" role="alert">
        <p className="text-sm font-medium text-pin">Something went wrong</p>
        <h1 className="mt-2 font-serif text-5xl tracking-tight">We lost our bearings.</h1>
        <p className="mt-4 text-lg text-muted">
          This page hit an unexpected error. Trying again usually fixes it. Your atlas progress is safe.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={retry} className={buttonClass("pin")}>
            Try again
          </button>
          <Link href="/" className={buttonClass("ghost")}>
            Back to home
          </Link>
        </div>
        {error.digest ? <p className="mt-8 font-mono text-xs text-muted">Reference: {error.digest}</p> : null}
      </section>
    </SiteFrame>
  );
}
