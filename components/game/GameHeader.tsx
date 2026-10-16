import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatDifficulty, formatPoints } from "@/lib/game/format";
import { labelTierCaption, labelTierFor } from "@/lib/map/labels";
import type { Difficulty } from "@/types/location";

export function GameHeader({
  score,
  difficulty,
  round,
  totalRounds,
  daily,
}: {
  score: number;
  difficulty: Difficulty | null;
  round: number;
  totalRounds: number;
  daily: boolean;
}) {
  return (
    <header className="border-b border-line bg-paper md:col-span-2">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="font-serif text-xl tracking-tight">
            GeoTease
          </Link>
          <Link href="/play" className="hidden text-sm text-muted hover:text-ink sm:inline">
            Modes
          </Link>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <p className="tabular-nums text-sm">
            <span className="font-medium">{formatPoints(score)}</span>
            <span className="text-muted"> pts</span>
          </p>
          <p className="text-sm text-muted">
            {daily ? "Daily" : `${round} of ${totalRounds}`}
          </p>
          <ThemeToggle />
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-sm">
        <div className="flex flex-1 gap-1" aria-label={`Round ${round} of ${totalRounds}`}>
          {Array.from({ length: totalRounds }, (_, index) => (
            <span
              key={index}
              className={`h-1 flex-1 rounded-full ${
                index < round ? "bg-pin" : "bg-line"
              }`}
            />
          ))}
        </div>
        {difficulty ? (
          <p className="shrink-0 text-muted">
            <span className="font-medium text-ink">{formatDifficulty(difficulty)}</span>
            <span className="hidden sm:inline"> · {labelTierCaption(labelTierFor(difficulty))}</span>
          </p>
        ) : null}
        {!daily ? (
          <Link href="/play" className="shrink-0 text-sea underline-offset-4 hover:underline">
            Change
          </Link>
        ) : null}
      </div>
    </header>
  );
}
