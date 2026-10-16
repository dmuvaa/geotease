import type { Metadata } from "next";
import { GameShell } from "@/components/game/GameShell";

export const metadata: Metadata = {
  title: "Where Did This Happen?",
};

export default function WhereDidThisHappenPage() {
  return <GameShell mode="where_did_this_happen" daily={false} />;
}
