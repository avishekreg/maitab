/**
 * PartyKit room stub — Quiplash / Open-Party-Lab style table sync.
 * Localhost preview uses BroadcastChannel via useTablePartySync.
 * Deploy with `npx partykit dev` when you want a hosted room later.
 *
 * No payment / discount / billing logic lives here.
 */
import type * as Party from "partykit/server";

type RoomState = {
  phase: string;
  prompt: string;
  secondsLeft: number;
  tallies: Record<string, number>;
  buzzedBy: string | null;
  updatedAt: number;
};

export default class TableArcadeParty implements Party.Server {
  constructor(readonly room: Party.Room) {}

  state: RoomState = {
    phase: "lobby",
    prompt: "",
    secondsLeft: 15,
    tallies: {},
    buzzedBy: null,
    updatedAt: Date.now(),
  };

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "sync", state: this.state }));
  }

  onMessage(message: string) {
    try {
      const msg = JSON.parse(message) as {
        type: string;
        state?: RoomState;
        playerId?: string;
      };
      if (msg.type === "sync" && msg.state) {
        this.state = { ...msg.state, updatedAt: Date.now() };
      } else if (msg.type === "vote" && msg.playerId) {
        this.state.tallies[msg.playerId] =
          (this.state.tallies[msg.playerId] ?? 0) + 1;
        this.state.updatedAt = Date.now();
      } else if (msg.type === "buzz" && msg.playerId && !this.state.buzzedBy) {
        this.state.buzzedBy = msg.playerId;
        this.state.phase = "buzz";
        this.state.updatedAt = Date.now();
      }
      this.room.broadcast(JSON.stringify({ type: "sync", state: this.state }));
    } catch {
      /* ignore malformed */
    }
  }
}
