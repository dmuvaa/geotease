import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line px-5 py-6 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p>
            <span className="font-serif text-ink">GeoTease</span> · Clues. Maps. One location.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/daily" className="hover:text-ink">
              Today’s daily
            </Link>
            <Link href="/leaderboard" className="hover:text-ink">
              Leaderboard
            </Link>
            <Link href="/how-to-play" className="hover:text-ink">
              How scoring works
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
