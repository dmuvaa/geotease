import type { Metadata } from "next";
import { GameShell } from "@/components/game/GameShell";

export const metadata: Metadata = {
  title: "Where Is It?",
};

export default function WhereIsItPage() {
  return <GameShell mode="where_is_it" daily={false} />;
}
