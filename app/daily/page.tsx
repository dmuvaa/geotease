import type { Metadata } from "next";
import { DailyChallengeList } from "@/components/game/DailyChallengeList";
import { ShareChallenge } from "@/components/game/ShareChallenge";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { dailyNumber, formatDailyDate, utcDateKey } from "@/lib/game/daily";
import { MODES } from "@/lib/game/modes";
import { buildDailyInviteText } from "@/lib/game/share";

export const metadata: Metadata = {
  title: "Daily",
};

export default function DailyPage() {
  const number = dailyNumber();
  return (
    <SiteFrame>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{formatDailyDate()} UTC</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight">Daily Challenge #{number}</h1>
        <p className="mt-4 max-w-xl text-muted">
          Three one-round games, one in each mode. Everyone gets the same places today, and each score lands on today’s board.
        </p>
        <div className="mt-6">
          <ShareChallenge text={buildDailyInviteText(number)} label="Share today's challenge" />
        </div>
        <div className="mt-10">
          <DailyChallengeList modes={MODES} dateKey={utcDateKey()} />
        </div>
      </section>
    </SiteFrame>
  );
}
