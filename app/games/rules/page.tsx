import { redirect } from "next/navigation";

/** Full catalog rulebook removed — rules live in the on-table popup on /game. */
export default function GameRulesDirectoryPage() {
  redirect("/game");
}
