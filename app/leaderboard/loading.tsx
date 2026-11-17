import { SiteFrame } from "@/components/ui/SiteFrame";

export default function LeaderboardLoading() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-5xl px-5 py-14" role="status" aria-label="Loading the leaderboard">
        <div className="skeleton h-3 w-48 rounded-full" />
        <div className="skeleton mt-4 h-12 w-80 max-w-full rounded-xl" />
        <div className="skeleton mt-4 h-4 w-96 max-w-full rounded-full" />
        <div className="mt-8 flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-11 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="skeleton h-10 w-full rounded-lg" />
          ))}
        </div>
      </section>
    </SiteFrame>
  );
}
