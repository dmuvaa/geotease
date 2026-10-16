import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameShell } from "@/components/game/GameShell";
import { getModeBySlug } from "@/lib/game/modes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string }>;
}): Promise<Metadata> {
  const { mode } = await params;
  const info = getModeBySlug(mode);
  return { title: info ? `Daily · ${info.title}` : "Daily" };
}

export default async function DailyModePage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  const info = getModeBySlug(mode);
  if (!info) {
    notFound();
  }
  return <GameShell mode={info.id} daily />;
}
