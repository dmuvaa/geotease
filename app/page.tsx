import Link from "next/link";
import { ChallengeCard } from "@/components/game/ChallengeCard";
import { PlayerProgress } from "@/components/game/PlayerProgress";
import { ShareChallenge } from "@/components/game/ShareChallenge";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { buttonClass } from "@/components/ui/Button";
import { dailyNumber, formatDailyDate, utcDateKey } from "@/lib/game/daily";
import { MODES } from "@/lib/game/modes";
import { buildInviteText } from "@/lib/game/share";

export default function HomePage() {
  const number = dailyNumber();

  return (
    <SiteFrame>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.05fr_.95fr] md:items-stretch md:py-14">
        <div className="flex flex-col justify-center py-3">
          <p className="text-sm font-medium text-sea">A geography game played on the globe</p>
          <h1 className="mt-3 max-w-2xl font-serif text-5xl leading-[0.96] tracking-tight md:text-6xl lg:text-7xl">
            Read the place. Find it on Earth.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Follow the clues, place one pin, and learn how the world fits together.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/play" className={buttonClass("pin")}>
              Choose a game
            </Link>
            <ShareChallenge text={buildInviteText()} label="Challenge a friend" />
          </div>
        </div>

        <aside className="atlas-panel overflow-hidden rounded-[2rem] text-white shadow-[var(--shadow)]">
          <div className="flex h-full flex-col bg-[linear-gradient(120deg,rgb(5_25_37/.2),transparent)] p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/70">{formatDailyDate()} UTC</p>
                <h2 className="mt-1 font-serif text-4xl">Daily #{number}</h2>
              </div>
              <span className="rounded-full border border-white/25 px-3 py-1 text-sm">3 rounds</span>
            </div>
            <p className="mt-5 max-w-md text-white/80">
              The same three places for everyone. Play each once and compare your score.
            </p>
            <ol className="my-6 divide-y divide-white/20 border-y border-white/20">
              {MODES.map((mode) => (
                <li key={mode.id}>
                  <Link
                    href={`/daily/${mode.slug}`}
                    className="flex min-h-14 items-center justify-between gap-4 py-3 text-white hover:text-white/75"
                  >
                    <span>{mode.title}</span>
                    <span aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href="/daily" className={buttonClass("primary", "mt-auto bg-white text-[#174b63] hover:bg-white/90")}>
              Open today’s challenge
            </Link>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="flex items-end justify-between gap-5 border-b border-line pb-4">
          <div>
            <h2 className="font-serif text-3xl">Choose how to play</h2>
            <p className="mt-1 text-muted">Five rounds per game. Your difficulty choice sets the challenge pool.</p>
          </div>
          <Link href="/how-to-play" className="hidden text-sm text-sea hover:underline sm:block">
            How scoring works
          </Link>
        </div>
        <div className="grid md:grid-cols-3">
          {MODES.map((mode) => (
            <ChallengeCard key={mode.id} mode={mode} href={`/play/${mode.slug}`} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="mb-4 font-serif text-3xl">Your atlas</h2>
        <PlayerProgress today={utcDateKey()} />
      </section>
    </SiteFrame>
  );
}
