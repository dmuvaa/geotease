import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { buttonClass } from "@/components/ui/Button";
import { formatMultiplier } from "@/lib/game/format";
import { MODES } from "@/lib/game/modes";
import { CLUE_MULTIPLIERS, DIFFICULTY_MULTIPLIERS, DISTANCE_DECAY_KM } from "@/lib/scoring/score";

export const metadata: Metadata = {
  title: "How to Play",
};

const steps = [
  {
    title: "Read",
    text: "Each challenge opens with one clue. Reveal another if you need it. Fewer clues keep a higher multiplier.",
  },
  {
    title: "Explore",
    text: "The map is a satellite globe. Choose Difficulty before a free game: Easy uses familiar places and shows towns, Medium uses regional places and shows major cities, and Hard uses obscure places with country codes only. Zoom, pan, and rotate until the place feels familiar.",
  },
  {
    title: "Pin",
    text: "Click or tap to drop a pin. Drag it, or enter coordinates, until you are ready.",
  },
  {
    title: "Score",
    text: "Submit. The correct place appears, with the distance and the points. Then play another.",
  },
];

export default function HowToPlayPage() {
  return (
    <SiteFrame>
      <article className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="font-serif text-5xl tracking-tight">How to play</h1>
        <p className="mt-4 text-lg text-muted">Read a clue. Find it on the map. See how close you were.</p>
        <ol className="mt-10 space-y-6">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t border-line pt-6">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">0{index + 1}</p>
              <h2 className="mt-2 font-serif text-3xl">{step.title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <section className="mt-12">
          <h2 className="font-serif text-3xl">Three ways to play</h2>
          <ul className="mt-4 space-y-3">
            {MODES.map((mode) => (
              <li key={mode.id}>
                <span aria-hidden="true">{mode.emoji} </span>
                <span className="font-medium">{mode.title}.</span> {mode.detail}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-12">
          <h2 className="font-serif text-3xl">Scoring</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Closer is the main score. A perfect pin is worth 10,000 before modifiers. A guess about{" "}
            {DISTANCE_DECAY_KM.toLocaleString("en-US")} km away is worth about a third of that. Clue and difficulty
            multipliers come after, and they are shown before you submit.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Clue multipliers</caption>
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 font-medium">Clues used</th>
                  <th className="py-2 font-medium">Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(CLUE_MULTIPLIERS).map(([clues, multiplier]) => (
                  <tr key={clues} className="border-b border-line">
                    <td className="py-2">{clues}</td>
                    <td className="py-2 tabular-nums">{formatMultiplier(multiplier)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">
            Difficulty:{" "}
            {Object.entries(DIFFICULTY_MULTIPLIERS)
              .map(([name, multiplier]) => `${name} ${formatMultiplier(multiplier)}`)
              .join(" · ")}
            . An approximate target treats a radius around the answer as a direct hit.
          </p>
        </section>
        <Link href="/play" className={`${buttonClass("primary")} mt-10`}>
          Play now
        </Link>
      </article>
    </SiteFrame>
  );
}
