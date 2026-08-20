"use client";

/**
 * Local-first table party sync (Open-Party-Lab / Quiplash patterns).
 * Uses BroadcastChannel + sessionStorage so every phone/tab on the same
 * table session shares countdown, prompts, buzzers, and vote tallies.
 * PartyKit package is installed for a future hosted room; localhost
 * preview does not require a PartyKit deploy.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSessionStore } from "@/lib/store/session-store";
import { useTableRoster, type RosterPlayer } from "@/lib/hooks/use-table-roster";

export type TablePartyPhase =
  | "lobby"
  | "countdown"
  | "prompt"
  | "voting"
  | "reveal"
  | "buzz";

export type TablePartyState = {
  tableCode: string;
  sessionId: string;
  phase: TablePartyPhase;
  prompt: string;
  secondsLeft: number;
  buzzedBy: string | null;
  tallies: Record<string, number>;
  revealed: boolean;
  updatedAt: number;
  hostId: string;
};

type PartyMessage =
  | { type: "sync"; state: TablePartyState }
  | { type: "vote"; playerId: string; voterId: string }
  | { type: "buzz"; playerId: string; name: string }
  | { type: "ping" };

const CHANNEL_PREFIX = "maitab-table-party:";

function defaultState(
  tableCode: string,
  sessionId: string,
  hostId: string,
  prompt: string
): TablePartyState {
  return {
    tableCode,
    sessionId,
    phase: "lobby",
    prompt,
    secondsLeft: 15,
    buzzedBy: null,
    tallies: {},
    revealed: false,
    updatedAt: Date.now(),
    hostId,
  };
}

export function useTablePartySync(prompt: string) {
  const user = useSessionStore((s) => s.user);
  const session = useSessionStore((s) => s.session);
  const { players, self, tableLabel, addPlayer } = useTableRoster();
  const roomKey = `${CHANNEL_PREFIX}${session.primary_table_id}`;
  const [state, setState] = useState<TablePartyState>(() =>
    defaultState(tableLabel, session.id, user.id, prompt)
  );
  const bcRef = useRef<BroadcastChannel | null>(null);

  const broadcast = useCallback(
    (msg: PartyMessage) => {
      try {
        bcRef.current?.postMessage(msg);
      } catch {
        /* ignore */
      }
      try {
        window.sessionStorage.setItem(
          roomKey,
          JSON.stringify(
            msg.type === "sync" ? msg.state : { ...state, updatedAt: Date.now() }
          )
        );
      } catch {
        /* ignore */
      }
    },
    [roomKey, state]
  );

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(roomKey);
      bcRef.current = bc;
      bc.onmessage = (ev: MessageEvent<PartyMessage>) => {
        const msg = ev.data;
        if (!msg) return;
        if (msg.type === "sync") {
          setState((prev) =>
            msg.state.updatedAt >= prev.updatedAt ? msg.state : prev
          );
        } else if (msg.type === "vote") {
          setState((prev) => ({
            ...prev,
            tallies: {
              ...prev.tallies,
              [msg.playerId]: (prev.tallies[msg.playerId] ?? 0) + 1,
            },
            updatedAt: Date.now(),
          }));
        } else if (msg.type === "buzz") {
          setState((prev) =>
            prev.buzzedBy
              ? prev
              : {
                  ...prev,
                  buzzedBy: msg.playerId,
                  phase: "buzz",
                  updatedAt: Date.now(),
                }
          );
        }
      };
    } catch {
      bcRef.current = null;
    }

    try {
      const raw = window.sessionStorage.getItem(roomKey);
      if (raw) {
        const parsed = JSON.parse(raw) as TablePartyState;
        if (parsed?.sessionId === session.id) setState(parsed);
      }
    } catch {
      /* ignore */
    }

    return () => {
      bc?.close();
      bcRef.current = null;
    };
  }, [roomKey, session.id]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      prompt,
      revealed: false,
      tallies: {},
      buzzedBy: null,
      phase: "lobby",
      updatedAt: Date.now(),
    }));
  }, [prompt]);

  const publishState = useCallback(
    (next: TablePartyState) => {
      setState(next);
      broadcast({ type: "sync", state: next });
      try {
        window.sessionStorage.setItem(roomKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [broadcast, roomKey]
  );

  const startCountdown = useCallback(
    (seconds = 15) => {
      publishState({
        ...state,
        phase: "countdown",
        secondsLeft: seconds,
        revealed: false,
        buzzedBy: null,
        tallies: {},
        updatedAt: Date.now(),
      });
    },
    [publishState, state]
  );

  useEffect(() => {
    if (state.phase !== "countdown") return;
    if (state.secondsLeft <= 0) {
      publishState({
        ...state,
        phase: "voting",
        secondsLeft: 0,
        updatedAt: Date.now(),
      });
      return;
    }
    const id = window.setTimeout(() => {
      publishState({
        ...state,
        secondsLeft: state.secondsLeft - 1,
        updatedAt: Date.now(),
      });
    }, 1000);
    return () => window.clearTimeout(id);
  }, [publishState, state]);

  const castVote = useCallback(
    (playerId: string) => {
      const next = {
        ...state,
        phase: "voting" as const,
        tallies: {
          ...state.tallies,
          [playerId]: (state.tallies[playerId] ?? 0) + 1,
        },
        updatedAt: Date.now(),
      };
      publishState(next);
      broadcast({ type: "vote", playerId, voterId: user.id });
    },
    [broadcast, publishState, state, user.id]
  );

  const buzz = useCallback(() => {
    if (state.buzzedBy) return;
    const next = {
      ...state,
      phase: "buzz" as const,
      buzzedBy: user.id,
      updatedAt: Date.now(),
    };
    publishState(next);
    broadcast({ type: "buzz", playerId: user.id, name: self.name });
  }, [broadcast, publishState, self.name, state, user.id]);

  const reveal = useCallback(() => {
    publishState({
      ...state,
      phase: "reveal",
      revealed: true,
      updatedAt: Date.now(),
    });
  }, [publishState, state]);

  const resetRound = useCallback(() => {
    publishState({
      ...defaultState(tableLabel, session.id, user.id, prompt),
      updatedAt: Date.now(),
    });
  }, [prompt, publishState, session.id, tableLabel, user.id]);

  const totalVotes = useMemo(
    () => Object.values(state.tallies).reduce((a, b) => a + b, 0),
    [state.tallies]
  );

  const leader = useMemo(() => {
    let best: RosterPlayer | null = null;
    let bestVotes = -1;
    for (const p of players) {
      const v = state.tallies[p.id] ?? 0;
      if (v > bestVotes) {
        bestVotes = v;
        best = p;
      }
    }
    const pass = state.tallies.__pass__ ?? 0;
    if (pass > bestVotes) return null;
    return best ? { ...best, votes: bestVotes } : null;
  }, [players, state.tallies]);

  return {
    state,
    players,
    self,
    tableLabel,
    totalVotes,
    leader,
    addPlayer,
    startCountdown,
    castVote,
    buzz,
    reveal,
    resetRound,
  };
}
