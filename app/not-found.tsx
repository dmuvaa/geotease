import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="font-serif text-5xl tracking-tight">That page is off the map.</h1>
        <Link href="/play" className={`${buttonClass("primary")} mt-8`}>
          Play now
        </Link>
      </section>
    </SiteFrame>
  );
}
