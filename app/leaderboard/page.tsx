import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDistance, formatPoints } from "@/lib/game/format";
import { getMode, getModeBySlug, isGameMode } from "@/lib/game/modes";
import { listLeaderboard } from "@/lib/leaderboard/store";
import type { LeaderboardView } from "@/types/game";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export const dynamic = "force-dynamic";

const filters: Array<{ view: LeaderboardView; label: string; href: string }> = [
  { view: "all", label: "All", href: "/leaderboard" },
  { view: "where_is_it", label: "Where Is It?", href: "/leaderboard?view=where-is-it" },
  { view: "find_it", label: "Find It", href: "/leaderboard?view=find-it" },
  { view: "where_did_this_happen", label: "Where Did This Happen?", href: "/leaderboard?view=where-did-this-happen" },
  { view: "daily", label: "Daily", href: "/leaderboard?view=daily" },
];

function parseView(value: string | string[] | undefined): LeaderboardView {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === "all") {
    return "all";
  }
  if (raw === "daily") {
    return "daily";
  }
  const fromSlug = getModeBySlug(raw);
  if (fromSlug) {
    return fromSlug.id;
  }
  return isGameMode(raw) ? raw : "all";
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const params = await searchParams;
  const view = parseView(params.view);
  const jar = await cookies();
  const snapshot = await listLeaderboard(view, jar.get("geotease_sid")?.value ?? "");

  return (
    <SiteFrame>
      <section className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{snapshot.dateLabel} UTC</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight">Today’s Top 100</h1>
        <p className="mt-4 max-w-xl text-muted">
          Best score today for each player and mode. The board resets at 00:00 UTC.
        </p>
        {snapshot.yours ? (
          <p className="mt-4 text-sm">
            Your best today is {formatPoints(snapshot.yours.score)} points, rank {snapshot.yours.rank}.
          </p>
        ) : null}
        <nav aria-label="Filter leaderboard" className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {filters.map((filter) => {
            const active = filter.view === view;
            return (
              <Link
                key={filter.view}
                href={filter.href}
                aria-current={active ? "page" : undefined}
                className={cn(active ? buttonClass("primary") : buttonClass("ghost"), "shrink-0")}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
        {snapshot.rows.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-line bg-raised p-8">
            <p className="font-serif text-3xl">No scores yet today.</p>
            <p className="mt-3 text-muted">Finish a round and your best pin lands here.</p>
            <Link href="/play" className={`${buttonClass("primary")} mt-6`}>
              Play now
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Today’s top scores</caption>
              <thead>
                <tr className="border-b border-line text-muted">
                  <th scope="col" className="py-3 pr-3 font-medium">#</th>
                  <th scope="col" className="py-3 pr-3 font-medium">Player</th>
                  <th scope="col" className="hidden py-3 pr-3 font-medium md:table-cell">Mode</th>
                  <th scope="col" className="py-3 pr-3 text-right font-medium">Score</th>
                  <th scope="col" className="hidden py-3 pr-3 text-right font-medium sm:table-cell">Distance</th>
                  <th scope="col" className="hidden py-3 text-right font-medium sm:table-cell">Clues</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.rows.map((row) => {
                  const mode = getMode(row.mode);
                  return (
                    <tr key={`${row.rank}-${row.displayName}-${row.mode}-${row.daily}`} className={row.yours ? "row-yours border-b border-line" : "border-b border-line"}>
                      <td className="py-3 pr-3 tabular-nums text-muted">{row.rank}</td>
                      <td className="py-3 pr-3">
                        <span className="font-medium">{row.displayName}</span>
                        {row.yours ? <span className="ml-2 text-xs text-pin">You</span> : null}
                        <span className="mt-0.5 block text-xs text-muted md:hidden">
                          {mode.title}
                          {row.daily ? " · Daily" : ""}
                          <span className="sm:hidden"> · {formatDistance(row.distanceKm)}</span>
                        </span>
                      </td>
                      <td className="hidden py-3 pr-3 md:table-cell">
                        <span aria-hidden="true">{mode.emoji} </span>
                        {mode.title}
                        {row.daily ? " · Daily" : ""}
                      </td>
                      <td className="py-3 pr-3 text-right font-medium tabular-nums">{formatPoints(row.score)}</td>
                      <td className="hidden py-3 pr-3 text-right tabular-nums sm:table-cell">{formatDistance(row.distanceKm)}</td>
                      <td className="hidden py-3 text-right tabular-nums sm:table-cell">{row.cluesUsed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </SiteFrame>
  );
}
