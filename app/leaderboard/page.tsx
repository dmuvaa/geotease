import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { buttonClass } from "@/components/ui/Button";
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
        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = filter.view === view;
            return (
              <Link
                key={filter.view}
                href={filter.href}
                aria-current={active ? "page" : undefined}
                className={active ? buttonClass("primary") : buttonClass("ghost")}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
        {snapshot.rows.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-line bg-raised p-8">
            <p className="font-serif text-3xl">No scores yet today.</p>
            <p className="mt-3 text-muted">Finish a round and your best pin lands here.</p>
            <Link href="/play" className={`${buttonClass("primary")} mt-6`}>
              Play now
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Today’s top scores</caption>
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-3 font-medium">Rank</th>
                  <th className="py-3 font-medium">Player</th>
                  <th className="py-3 font-medium">Mode</th>
                  <th className="py-3 font-medium">Score</th>
                  <th className="py-3 font-medium">Distance</th>
                  <th className="py-3 font-medium">Clues</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.rows.map((row) => {
                  const mode = getMode(row.mode);
                  return (
                    <tr key={`${row.rank}-${row.displayName}-${row.mode}-${row.daily}`} className={row.yours ? "row-yours border-b border-line" : "border-b border-line"}>
                      <td className="py-3 tabular-nums">{row.rank}</td>
                      <td className="py-3">{row.displayName}</td>
                      <td className="py-3">
                        <span aria-hidden="true">{mode.emoji} </span>
                        {mode.title}
                        {row.daily ? " · Daily" : ""}
                      </td>
                      <td className="py-3 tabular-nums">{formatPoints(row.score)}</td>
                      <td className="py-3 tabular-nums">{formatDistance(row.distanceKm)}</td>
                      <td className="py-3 tabular-nums">{row.cluesUsed}</td>
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
