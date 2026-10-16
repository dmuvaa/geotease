"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { clearActiveRun } from "@/lib/game/run-storage";
import type { ModeInfo } from "@/lib/game/modes";

export function ChallengeCard({
  mode,
  href,
  action = "Play",
  detail,
  status,
}: {
  mode: ModeInfo;
  href: string;
  action?: string;
  detail?: string;
  status?: string;
}) {
  return (
    <article className="group relative grid grid-cols-[auto_1fr] gap-x-4 border-b border-line py-6 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
      {status ? (
        <span className="absolute right-0 top-6 rounded-full bg-correct px-2.5 py-1 text-xs font-medium text-white md:right-6">
          {status}
        </span>
      ) : null}
      <p className="text-2xl" aria-hidden="true">
        {mode.emoji}
      </p>
      <div className="min-w-0">
        <h2 className="font-serif text-2xl tracking-tight">{mode.title}</h2>
        <p className="mt-2 min-h-12 leading-relaxed text-muted">{detail ?? mode.summary}</p>
        <Link
          href={href}
          onClick={clearActiveRun}
          className={buttonClass("ghost", "mt-5 group-hover:border-ink")}
        >
          {action}
        </Link>
      </div>
    </article>
  );
}
