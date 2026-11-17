import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-3xl px-5 py-20">
        <p className="text-sm font-medium text-pin">404</p>
        <h1 className="mt-2 font-serif text-5xl tracking-tight">That page is off the map.</h1>
        <p className="mt-4 text-lg text-muted">The link may be old, or the address has a typo.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/play" className={buttonClass("pin")}>
            Play a game
          </Link>
          <Link href="/" className={buttonClass("ghost")}>
            Back to home
          </Link>
        </div>
      </section>
    </SiteFrame>
  );
}
