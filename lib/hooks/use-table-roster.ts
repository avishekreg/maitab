"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSessionStore } from "@/lib/store/session-store";
import { DEMO_TABLES } from "@/lib/demo/data";

export type RosterPlayer = {
  id: string;
  name: string;
  isSelf?: boolean;
};

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || "Me";
}

function defaultRoster(selfId: string, selfName: string): RosterPlayer[] {
  return [
    { id: selfId, name: firstName(selfName), isSelf: true },
    { id: "p2", name: "Player 2" },
    { id: "p3", name: "Player 3" },
    { id: "p4", name: "Player 4" },
  ];
}

export function useTableRoster() {
  const user = useSessionStore((s) => s.user);
  const session = useSessionStore((s) => s.session);
  const table =
    DEMO_TABLES.find((t) => t.id === session.primary_table_id) ?? DEMO_TABLES[0];
  const tableLabel = table?.table_code ?? "VIP-04";
  const storageKey = `maitab-table-roster:${session.primary_table_id}`;

  const [players, setPlayers] = useState<RosterPlayer[]>(() =>
    defaultRoster(user.id, user.full_name)
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as RosterPlayer[];
        if (Array.isArray(parsed) && parsed.length) {
          const withSelf = parsed.map((p) =>
            p.id === user.id || p.isSelf
              ? { ...p, id: user.id, name: firstName(user.full_name), isSelf: true }
              : { ...p, isSelf: false }
          );
          if (!withSelf.some((p) => p.isSelf)) {
            withSelf.unshift({
              id: user.id,
              name: firstName(user.full_name),
              isSelf: true,
            });
          }
          setPlayers(withSelf);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setPlayers(defaultRoster(user.id, user.full_name));
  }, [storageKey, user.full_name, user.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(players));
    } catch {
      /* ignore */
    }
  }, [players, storageKey]);

  const addPlayer = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlayers((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, name: trimmed, isSelf: false },
    ]);
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.isSelf || p.id !== id));
  }, []);

  const self = useMemo(
    () => players.find((p) => p.isSelf) ?? players[0]!,
    [players]
  );

  return { players, self, tableLabel, addPlayer, removePlayer };
}
