import type { Metadata } from "next";
import { ChallengeCard } from "@/components/game/ChallengeCard";
import { MapLevelControl } from "@/components/map/MapLevelControl";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { FREE_PLAY_ROUNDS } from "@/lib/game/constants";
import { MODES } from "@/lib/game/modes";

export const metadata: Metadata = {
  title: "Play",
};

export default function PlayPage() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <h1 className="font-serif text-5xl tracking-tight">Choose your game</h1>
        <p className="mt-3 max-w-xl text-lg text-muted">
          Pick a difficulty, then play {FREE_PLAY_ROUNDS} places. Fewer clues and closer pins earn more.
        </p>
        <div className="mt-8 border-y border-line py-5">
          <MapLevelControl fallback={null} variant="bar" />
        </div>
        <div className="mt-5 grid md:grid-cols-3">
          {MODES.map((mode) => (
            <ChallengeCard key={mode.id} mode={mode} href={`/play/${mode.slug}`} detail={mode.detail} />
          ))}
        </div>
      </section>
    </SiteFrame>
  );
}
