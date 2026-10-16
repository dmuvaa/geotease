import { SiteHeader } from "@/components/ui/SiteHeader";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line px-5 py-6 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p>GeoTease</p>
          <p>Clues. Maps. One location.</p>
        </div>
      </footer>
    </div>
  );
}
