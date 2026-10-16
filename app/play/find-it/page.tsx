import type { Metadata } from "next";
import { GameShell } from "@/components/game/GameShell";

export const metadata: Metadata = {
  title: "Find It on the Map",
};

export default function FindItPage() {
  return <GameShell mode="find_it" daily={false} />;
}
