"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dices, Lock, Send, ShieldAlert, Sparkles } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import {
  CLOAK_WARNING,
  getMuteState,
  guardMessageSync,
  recordBreach,
  resetBreaches,
  type GuardDecision,
} from "@/lib/cloak/guardrail";
import {
  loadOrMintPersona,
  purgePersona,
  type CloakPersona,
} from "@/lib/cloak/persona";
import {
  cloakAppend,
  cloakJoin,
  cloakLeave,
  cloakPurgeAll,
  createCloakChannel,
  type CloakEnvelope,
  type CloakMessage,
} from "@/lib/cloak/room";
import { buildMysteryShooterItem } from "@/lib/cloak/mystery-nudge";
import {
  createPresenceChannel,
  HEARTBEAT_MS,
  MATCH_COOLDOWN_MS,
  mintPresenceCard,
  pickMysteryMatch,
  PresenceRegistry,
  type GhostPresence,
  type PresenceEnvelope,
} from "@/lib/cloak/presence";
import {
  inverseThreadKey,
  pickFallbackLine,
  sanitizeWingmanReply,
  scheduleWingman,
  threadKey,
  WINGMAN_SUPPRESS_MS,
  type WingmanController,
} from "@/lib/cloak/ai-ghost";
import { useSessionStore } from "@/lib/store/session-store";
import {
  ActiveGuestsBadge,
  GhostRosterDrawer,
} from "@/components/cloak/GhostRosterDrawer";

/** Ambient peer so solo localhost still gets wingman replies. */
const AMBIENT_PRESENCE: GhostPresence = mintPresenceCard({
  id: "cloak-ambient-wingman",
  alias: "Velvet Ghost #09",
  glyph: "✧",
  accent: "#f472b6",
  vibeTag: "Vibing to Bass",
  status: "ONLINE",
});

async function remoteGuard(
  text: string,
  personaId: string
): Promise<GuardDecision> {
  try {
    const res = await fetch("/api/cloak/guard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, personaId }),
    });
    if (!res.ok) return guardMessageSync(text, personaId);
    return (await res.json()) as GuardDecision;
  } catch {
    return guardMessageSync(text, personaId);
  }
}

async function fetchWingmanReply(
  incoming: string,
  recipientAlias: string,
  recent: string[],
  signal: AbortSignal
): Promise<string> {
  try {
    const res = await fetch("/api/cloak/ai-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incoming, recipientAlias, recent }),
      signal,
    });
    if (!res.ok) return pickFallbackLine(incoming);
    const data = (await res.json()) as { reply?: string };
    return (
      sanitizeWingmanReply(data.reply ?? "") ?? pickFallbackLine(incoming)
    );
  } catch {
    if (signal.aborted) return "";
    return pickFallbackLine(incoming);
  }
}

function isWhisperThread(
  m: CloakMessage,
  selfId: string,
  peerId: string
): boolean {
  return (
    (m.fromId === selfId && m.toId === peerId) ||
    (m.fromId === peerId && m.toId === selfId)
  );
}

export function ShadowChat() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const addOrderItems = useSessionStore((s) => s.addOrderItems);

  const whisperParam = searchParams.get("whisper");
  const channelParam = searchParams.get("channel");
  const isLounge =
    !whisperParam || channelParam === "lounge" || whisperParam === "lounge";
  const whisperPeerId = isLounge ? null : whisperParam;

  const [persona, setPersona] = useState<CloakPersona | null>(null);
  const [presenceList, setPresenceList] = useState<GhostPresence[]>([
    AMBIENT_PRESENCE,
  ]);
  const [messages, setMessages] = useState<CloakMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nudgeNote, setNudgeNote] = useState<string | null>(null);
  const [typingGhostId, setTypingGhostId] = useState<string | null>(null);
  const [matchCooldownUntil, setMatchCooldownUntil] = useState(0);
  const [matchCooldownMs, setMatchCooldownMs] = useState(0);
  const recentMatchIdsRef = useRef<string[]>([]);

  const feedRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof createCloakChannel> | null>(null);
  const presenceChRef = useRef<ReturnType<
    typeof createPresenceChannel
  > | null>(null);
  const registryRef = useRef(new PresenceRegistry());
  const selfPresenceRef = useRef<GhostPresence | null>(null);
  const pendingWingmanRef = useRef<Map<string, WingmanController>>(new Map());
  const suppressUntilRef = useRef<Map<string, number>>(new Map());
  const messagesRef = useRef<CloakMessage[]>([]);
  const typingEmitTimer = useRef<number | undefined>(undefined);
  const whisperPeerIdRef = useRef<string | null>(whisperPeerId);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    whisperPeerIdRef.current = whisperPeerId;
  }, [whisperPeerId]);

  const refreshPresence = useCallback(() => {
    const reg = registryRef.current;
    reg.prune();
    // Always keep ambient for solo wingman demos
    if (!reg.get(AMBIENT_PRESENCE.id)) {
      reg.upsert({ ...AMBIENT_PRESENCE, lastBeat: Date.now() });
    }
    setPresenceList(reg.list());
  }, []);

  const setChannelUrl = useCallback(
    (mode: "lounge" | "whisper", peerId?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "lounge") {
        params.delete("whisper");
        params.set("channel", "lounge");
      } else if (peerId) {
        params.delete("channel");
        params.set("whisper", peerId);
      }
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const cancelWingman = useCallback((key: string) => {
    const ctrl = pendingWingmanRef.current.get(key);
    if (ctrl) {
      ctrl.cancel();
      pendingWingmanRef.current.delete(key);
    }
  }, []);

  useEffect(() => {
    const me = loadOrMintPersona();
    setPersona(me);
    const card = cloakJoin(me);
    const presence = mintPresenceCard({
      id: card.id,
      alias: card.alias,
      glyph: card.glyph,
      accent: card.accent,
      status: "ONLINE",
    });
    selfPresenceRef.current = presence;
    registryRef.current.replaceAll([
      { ...AMBIENT_PRESENCE, lastBeat: Date.now() },
      presence,
    ]);
    refreshPresence();

    const ch = createCloakChannel({
      onEnvelope(env: CloakEnvelope) {
        if (env.type === "join") {
          const g = mintPresenceCard({
            id: env.ghost.id,
            alias: env.ghost.alias,
            glyph: env.ghost.glyph,
            accent: env.ghost.accent,
          });
          registryRef.current.upsert(g);
          refreshPresence();
        } else if (env.type === "leave") {
          if (env.id === AMBIENT_PRESENCE.id) return;
          registryRef.current.leave(env.id);
          refreshPresence();
        } else if (env.type === "msg") {
          cloakAppend(env.message);
          setMessages((prev) => [...prev, env.message].slice(-80));

          const isLoungePost = env.message.toId === null;
          const isAmbient =
            env.message.fromId === AMBIENT_PRESENCE.id;
          const isSelf = env.message.fromId === me.id;

          // Real human answered lounge → cancel pending lounge wingman
          if (isLoungePost && !isAmbient && !isSelf) {
            const loungeKey = threadKey(me.id, null);
            const ctrl = pendingWingmanRef.current.get(loungeKey);
            if (ctrl) {
              ctrl.cancel();
              pendingWingmanRef.current.delete(loungeKey);
            }
          }

          // Only suppress wingman when a real human replies in a 1-on-1
          if (!isLoungePost && !isAmbient) {
            const inv = inverseThreadKey(
              env.message.fromId,
              env.message.toId
            );
            suppressUntilRef.current.set(
              inv,
              Date.now() + WINGMAN_SUPPRESS_MS
            );
            for (const [key, ctrl] of Array.from(
              pendingWingmanRef.current.entries()
            )) {
              if (key.endsWith(`::${env.message.fromId}`)) {
                ctrl.cancel();
                pendingWingmanRef.current.delete(key);
                suppressUntilRef.current.set(
                  key,
                  Date.now() + WINGMAN_SUPPRESS_MS
                );
              }
            }
          }
        } else if (env.type === "cloak_typing") {
          if (env.active) {
            setTypingGhostId(env.fromId);
            // Lounge typing from another human → cancel lounge AI wait
            if (env.peerId === null && env.fromId !== me.id) {
              const loungeKey = threadKey(me.id, null);
              const ctrl = pendingWingmanRef.current.get(loungeKey);
              if (ctrl) {
                ctrl.cancel();
                pendingWingmanRef.current.delete(loungeKey);
              }
            }
            // Whisper typing from the expected peer → cancel that thread's AI
            for (const [key, ctrl] of Array.from(
              pendingWingmanRef.current.entries()
            )) {
              if (
                env.peerId &&
                (key.endsWith(`::${env.fromId}`) ||
                  key === threadKey(env.peerId, env.fromId))
              ) {
                ctrl.cancel();
                pendingWingmanRef.current.delete(key);
              }
            }
          } else {
            setTypingGhostId((id) => (id === env.fromId ? null : id));
          }
        } else if (env.type === "sync") {
          for (const g of env.snapshot.ghosts) {
            registryRef.current.upsert(
              mintPresenceCard({
                id: g.id,
                alias: g.alias,
                glyph: g.glyph,
                accent: g.accent,
              })
            );
          }
          refreshPresence();
          setMessages(env.snapshot.messages);
        } else if (env.type === "purge") {
          setMessages([]);
        }
      },
    });
    channelRef.current = ch;
    ch.publish({ type: "join", ghost: card });

    const presenceCh = createPresenceChannel({
      onEnvelope(env: PresenceEnvelope) {
        if (env.type === "presence_join" || env.type === "presence_beat") {
          if (env.ghost.id === me.id) return;
          registryRef.current.beat(env.ghost);
          refreshPresence();
        } else if (env.type === "presence_leave") {
          if (env.id === AMBIENT_PRESENCE.id) return;
          registryRef.current.leave(env.id);
          refreshPresence();
        } else if (env.type === "presence_sync") {
          for (const g of env.ghosts) {
            if (g.id === me.id) continue;
            registryRef.current.upsert(g);
          }
          refreshPresence();
        }
      },
    });
    presenceChRef.current = presenceCh;
    presenceCh.publish({ type: "presence_join", ghost: presence });
    presenceCh.publish({
      type: "presence_sync",
      ghosts: registryRef.current.list(),
    });

    const beat = window.setInterval(() => {
      const dropped = registryRef.current.prune();
      const self = selfPresenceRef.current;
      if (self) {
        const next = {
          ...self,
          status: (whisperPeerIdRef.current
            ? "IN_CONVERSATION"
            : "ONLINE") as GhostPresence["status"],
          lastBeat: Date.now(),
        };
        selfPresenceRef.current = next;
        registryRef.current.beat(next);
        presenceCh.publish({ type: "presence_beat", ghost: next });
      }
      // Keep ambient alive locally
      registryRef.current.beat({
        ...AMBIENT_PRESENCE,
        lastBeat: Date.now(),
      });
      if (dropped.length) refreshPresence();
      else refreshPresence();
    }, HEARTBEAT_MS);

    const onVis = () => {
      if (document.visibilityState === "hidden") {
        setMessages([]);
        const self = selfPresenceRef.current;
        if (self) {
          const away = { ...self, status: "AWAY" as const, lastBeat: Date.now() };
          selfPresenceRef.current = away;
          presenceCh.publish({ type: "presence_beat", ghost: away });
        }
      } else if (selfPresenceRef.current) {
        const back = {
          ...selfPresenceRef.current,
          status: "ONLINE" as const,
          lastBeat: Date.now(),
        };
        selfPresenceRef.current = back;
        presenceCh.publish({ type: "presence_beat", ghost: back });
        refreshPresence();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.clearInterval(beat);
      for (const ctrl of Array.from(pendingWingmanRef.current.values()))
        ctrl.cancel();
      pendingWingmanRef.current.clear();
      cloakLeave(me.id);
      ch.publish({ type: "leave", id: me.id });
      presenceCh.publish({ type: "presence_leave", id: me.id });
      ch.close();
      presenceCh.close();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  // Reflect whisper/lounge in own presence status
  useEffect(() => {
    const self = selfPresenceRef.current;
    if (!self) return;
    const status: GhostPresence["status"] = whisperPeerId
      ? "IN_CONVERSATION"
      : "ONLINE";
    const next = { ...self, status, lastBeat: Date.now() };
    selfPresenceRef.current = next;
    registryRef.current.setStatus(self.id, status);
    presenceChRef.current?.publish({ type: "presence_beat", ghost: next });
    refreshPresence();
  }, [whisperPeerId, refreshPresence]);

  const visibleMessages = useMemo(() => {
    if (!persona) return [];
    if (!whisperPeerId) {
      return messages.filter(
        (m) =>
          m.toId === null ||
          (m.kind === "system" && m.toId === persona.id)
      );
    }
    return messages.filter(
      (m) =>
        isWhisperThread(m, persona.id, whisperPeerId) ||
        (m.kind === "system" && m.toId === persona.id)
    );
  }, [messages, persona, whisperPeerId]);

  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleMessages.length, typingGhostId]);

  const peer = useMemo(
    () =>
      whisperPeerId
        ? presenceList.find((g) => g.id === whisperPeerId) ?? null
        : null,
    [presenceList, whisperPeerId]
  );

  const onlineCount = useMemo(
    () => presenceList.filter((g) => g.status !== "AWAY").length,
    [presenceList]
  );

  const pushSystem = useCallback(
    (body: string) => {
      if (!persona) return;
      const msg: CloakMessage = {
        id: `sys-${crypto.randomUUID()}`,
        fromId: "cloak-system",
        fromAlias: "Cloak Protocol",
        fromGlyph: "⛨",
        fromAccent: "#22d3ee",
        toId: persona.id,
        body,
        kind: "system",
        relative: "Just now",
        at: Date.now(),
      };
      setMessages((prev) => [...prev, msg].slice(-80));
    },
    [persona]
  );

  const resolveRecipient = useCallback((): GhostPresence | null => {
    if (whisperPeerId) {
      return (
        presenceList.find((g) => g.id === whisperPeerId) ??
        (whisperPeerId === AMBIENT_PRESENCE.id ? AMBIENT_PRESENCE : null)
      );
    }
    // Lounge wingman always speaks as the ambient ghost
    return AMBIENT_PRESENCE;
  }, [presenceList, whisperPeerId]);

  /**
   * Lounge: always AI-reply if no human answers (ambient ghost).
   * 1-on-1 with a real guest: no auto-AI.
   * 1-on-1 with ambient wingman: AI still replies (they are the ghost).
   */
  const armWingman = useCallback(
    (incoming: string) => {
      if (!persona) return;

      const inWhisper = Boolean(whisperPeerId);
      const whisperingAmbient =
        whisperPeerId === AMBIENT_PRESENCE.id;

      // Active human 1-on-1 → stay silent (no wingman)
      if (inWhisper && !whisperingAmbient) return;

      const recipient = resolveRecipient();
      if (!recipient || recipient.id === persona.id) return;

      // Lounge thread key is stable so every lounge send can re-arm
      const key = inWhisper
        ? threadKey(persona.id, recipient.id)
        : threadKey(persona.id, null);

      // Lounge must always get a reply — ignore long suppress windows
      if (inWhisper) {
        const until = suppressUntilRef.current.get(key) ?? 0;
        if (until > Date.now()) return;
      }

      cancelWingman(key);

      const ctrl = scheduleWingman({
        onTypingStart: () => setTypingGhostId(recipient.id),
        onTypingEnd: () =>
          setTypingGhostId((id) => (id === recipient.id ? null : id)),
        generate: async (signal) => {
          const recent = messagesRef.current
            .filter((m) => {
              if (m.kind !== "text") return false;
              if (!inWhisper) return m.toId === null;
              return (
                (m.fromId === persona.id && m.toId === recipient.id) ||
                (m.fromId === recipient.id && m.toId === persona.id)
              );
            })
            .slice(-4)
            .map((m) => m.body);
          const text = await fetchWingmanReply(
            incoming,
            recipient.alias,
            recent,
            signal
          );
          // Always return something for lounge (never leave dead air)
          return text || pickFallbackLine(incoming + recipient.alias);
        },
        onReply: (text) => {
          if (!text) return;
          const msg: CloakMessage = {
            id: `m-${crypto.randomUUID()}`,
            fromId: recipient.id,
            fromAlias: recipient.alias,
            fromGlyph: recipient.glyph,
            fromAccent: recipient.accent,
            // Lounge replies are public wall posts; whispers stay private
            toId: inWhisper ? persona.id : null,
            body: text,
            kind: "text",
            relative: "Just now",
            at: Date.now(),
          };
          cloakAppend(msg);
          setMessages((prev) => [...prev, msg].slice(-80));
          channelRef.current?.publish({ type: "msg", message: msg });
          pendingWingmanRef.current.delete(key);
          void triggerHaptic(10);
        },
      });
      pendingWingmanRef.current.set(key, ctrl);
    },
    [cancelWingman, persona, resolveRecipient, whisperPeerId]
  );

  const emitTyping = useCallback(
    (active: boolean) => {
      if (!persona) return;
      channelRef.current?.publish({
        type: "cloak_typing",
        fromId: persona.id,
        peerId: whisperPeerId,
        active,
      });
    },
    [persona, whisperPeerId]
  );

  const onDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      if (!persona) return;
      for (const [key, ctrl] of Array.from(
        pendingWingmanRef.current.entries()
      )) {
        if (key.endsWith(`::${persona.id}`)) {
          ctrl.cancel();
          pendingWingmanRef.current.delete(key);
        }
      }
      emitTyping(true);
      if (typingEmitTimer.current) window.clearTimeout(typingEmitTimer.current);
      typingEmitTimer.current = window.setTimeout(
        () => emitTyping(false),
        1200
      );
    },
    [emitTyping, persona]
  );

  const sendWhisper = useCallback(async () => {
    if (!persona || busy) return;
    const text = draft.trim();
    if (!text) return;

    const mute = getMuteState(persona.id);
    if (mute.muted) {
      setWarning(
        `${CLOAK_WARNING} (Muted ${Math.ceil(mute.remainingMs / 1000)}s)`
      );
      return;
    }

    setBusy(true);
    setWarning(null);
    emitTyping(false);

    const local = guardMessageSync(text, persona.id);
    let decision = local;
    if (local.status === "APPROVED") {
      decision = await remoteGuard(text, persona.id);
      if (decision.status === "BLOCKED") {
        recordBreach(persona.id);
      } else {
        resetBreaches(persona.id);
      }
    }

    if (decision.status === "BLOCKED") {
      setWarning(`${CLOAK_WARNING} · ${decision.reason}`);
      pushSystem(`Blocked (Tier-${decision.tier}): ${decision.reason}`);
      void triggerHaptic([30, 40, 30]);
      setBusy(false);
      return;
    }

    const msg: CloakMessage = {
      id: `m-${crypto.randomUUID()}`,
      fromId: persona.id,
      fromAlias: persona.alias,
      fromGlyph: persona.glyph,
      fromAccent: persona.accent,
      toId: whisperPeerId,
      body: text,
      kind: "text",
      relative: "Just now",
      at: Date.now(),
    };
    cloakAppend(msg);
    setMessages((prev) => [...prev, msg].slice(-80));
    channelRef.current?.publish({ type: "msg", message: msg });
    setDraft("");
    void triggerHaptic(12);
    setBusy(false);
    armWingman(text);
  }, [
    armWingman,
    busy,
    draft,
    emitTyping,
    persona,
    pushSystem,
    whisperPeerId,
  ]);

  useEffect(() => {
    if (matchCooldownUntil <= Date.now()) {
      setMatchCooldownMs(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, matchCooldownUntil - Date.now());
      setMatchCooldownMs(left);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [matchCooldownUntil]);

  const runMysteryMatch = useCallback(() => {
    if (!persona) return;
    if (matchCooldownUntil > Date.now()) return;

    const match = pickMysteryMatch(presenceList, persona.id, {
      excludeIds: recentMatchIdsRef.current,
      allowAmbient: true,
      ambientId: AMBIENT_PRESENCE.id,
    });

    // If recent excludes wiped the pool, retry without exclude (still no self)
    const picked =
      match ??
      pickMysteryMatch(presenceList, persona.id, {
        allowAmbient: true,
        ambientId: AMBIENT_PRESENCE.id,
      });

    if (!picked) {
      setWarning("No ghosts online to match — try again in a moment.");
      return;
    }

    recentMatchIdsRef.current = [
      picked.id,
      ...recentMatchIdsRef.current.filter((id) => id !== picked.id),
    ].slice(0, 5);

    setChannelUrl("whisper", picked.id);
    setRosterOpen(false);
    setMatchCooldownUntil(Date.now() + MATCH_COOLDOWN_MS);
    setNudgeNote(`Mystery Match → ${picked.alias}`);
    pushSystem(
      `Cloak matched you with ${picked.alias}. Keep it mysterious — no names, numbers, or meetups.`
    );
    void triggerHaptic([20, 30, 40]);
  }, [
    matchCooldownUntil,
    persona,
    presenceList,
    pushSystem,
    setChannelUrl,
  ]);

  const sendMysteryTo = useCallback(
    async (ghostId: string) => {
      if (!persona) return;
      const target =
        presenceList.find((g) => g.id === ghostId) ??
        (ghostId === AMBIENT_PRESENCE.id ? AMBIENT_PRESENCE : null);
      if (!target || target.id === persona.id) {
        setWarning("Pick an Active Ghost before sending a Mystery Drink.");
        return;
      }
      setBusy(true);
      try {
        await addOrderItems([
          buildMysteryShooterItem({
            toAlias: target.alias,
            fromAlias: persona.alias,
          }),
        ]);
        const msg: CloakMessage = {
          id: `nudge-${crypto.randomUUID()}`,
          fromId: persona.id,
          fromAlias: persona.alias,
          fromGlyph: persona.glyph,
          fromAccent: persona.accent,
          toId: target.id,
          body: `Mystery Drink queued for ${target.alias} — staff delivers discreetly. Identities stay cloaked.`,
          kind: "mystery_nudge",
          relative: "Just now",
          at: Date.now(),
        };
        cloakAppend(msg);
        setMessages((prev) => [...prev, msg].slice(-80));
        channelRef.current?.publish({ type: "msg", message: msg });
        setNudgeNote(`Mystery Drink → ${target.alias} (KDS discreet)`);
        setChannelUrl("whisper", target.id);
        setRosterOpen(false);
        void triggerHaptic([40, 30, 60]);
      } catch {
        setWarning("Could not queue Mystery Drink");
      }
      setBusy(false);
    },
    [addOrderItems, persona, presenceList, setChannelUrl]
  );

  function endGhostSession() {
    for (const ctrl of Array.from(pendingWingmanRef.current.values()))
      ctrl.cancel();
    pendingWingmanRef.current.clear();
    if (persona) {
      cloakLeave(persona.id);
      channelRef.current?.publish({ type: "leave", id: persona.id });
      presenceChRef.current?.publish({
        type: "presence_leave",
        id: persona.id,
      });
    }
    cloakPurgeAll();
    purgePersona();
    setMessages([]);
    const next = loadOrMintPersona();
    setPersona(next);
    const presence = mintPresenceCard({
      id: next.id,
      alias: next.alias,
      glyph: next.glyph,
      accent: next.accent,
    });
    selfPresenceRef.current = presence;
    registryRef.current.replaceAll([
      { ...AMBIENT_PRESENCE, lastBeat: Date.now() },
      presence,
    ]);
    refreshPresence();
    cloakJoin(next);
    channelRef.current?.publish({
      type: "join",
      ghost: {
        id: next.id,
        alias: next.alias,
        glyph: next.glyph,
        accent: next.accent,
      },
    });
    presenceChRef.current?.publish({ type: "presence_join", ghost: presence });
    setChannelUrl("lounge");
    setNudgeNote("Ghost session purged. New alias minted.");
  }

  const typingGhost = presenceList.find((g) => g.id === typingGhostId);
  const showTyping =
    typingGhost &&
    (isLounge
      ? true
      : typingGhost.id === whisperPeerId || typingGhost.id === persona?.id);

  if (!persona) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/95 p-8 text-center text-zinc-400">
        Minting cyber persona…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/95 p-5 text-zinc-100 shadow-2xl backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_280px_at_10%_-10%,rgba(124,58,237,0.2),transparent_55%),radial-gradient(500px_240px_at_90%_0%,rgba(6,182,212,0.12),transparent_50%)]" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
            mAI Cloak · Shadow Lounge
          </p>
          <h1 className="mt-1 font-display text-2xl font-black text-white md:text-3xl">
            {isLounge ? "Venue Lounge Wall" : "Private Whisper"}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-sm"
              style={{ color: persona.accent, borderColor: persona.accent }}
            >
              {persona.glyph}
            </span>
            You are{" "}
            <span className="font-semibold text-white">{persona.alias}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActiveGuestsBadge
            onlineCount={onlineCount}
            onClick={() => setRosterOpen(true)}
          />
          <button
            type="button"
            disabled={matchCooldownMs > 0}
            onClick={runMysteryMatch}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-fuchsia-500/45 bg-fuchsia-500/15 px-3.5 py-2 text-xs font-bold text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.2)] transition hover:border-fuchsia-400/70 active:scale-[0.98] disabled:opacity-45"
          >
            <Dices className="h-3.5 w-3.5" aria-hidden />
            {matchCooldownMs > 0
              ? `Match ${Math.ceil(matchCooldownMs / 1000)}s`
              : "Mystery Match"}
          </button>
          <button
            type="button"
            onClick={endGhostSession}
            className="cursor-pointer rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-200"
          >
            Purge session
          </button>
        </div>
      </div>

      {/* Dual-channel tabs */}
      <div className="relative mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setChannelUrl("lounge")}
          className={cn(
            "cursor-pointer rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition",
            isLounge
              ? "border-violet-500/50 bg-violet-500/20 text-violet-100"
              : "border-zinc-700 text-zinc-400 hover:text-zinc-200"
          )}
        >
          Venue Lounge
        </button>
        {peer ? (
          <button
            type="button"
            onClick={() => setChannelUrl("whisper", peer.id)}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition",
              !isLounge
                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
                : "border-zinc-700 text-zinc-400"
            )}
          >
            Whisper · {peer.alias}
          </button>
        ) : (
          <span className="rounded-full border border-zinc-800 px-3.5 py-1.5 text-[11px] text-zinc-600">
            Open roster to start a 1-on-1 whisper
          </span>
        )}
      </div>

      <div className="relative mt-3 inline-flex max-w-full items-start gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-950/25 px-3 py-2 text-[11px] leading-relaxed text-emerald-100/90">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        100% Encrypted &amp; Anonymized ·{" "}
        {isLounge
          ? "Public lounge wall (aliases only)"
          : `Private thread with ${peer?.alias ?? "ghost"} · Guardrail + Wingman armed`}
      </div>

      <div
        ref={feedRef}
        className="relative mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-800/80 bg-black/30 p-3"
        style={{ minHeight: "280px", maxHeight: "42vh" }}
      >
        {visibleMessages.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            {isLounge
              ? "Lounge is quiet. Broadcast a whisper into the void."
              : `No private whispers with ${peer?.alias ?? "this ghost"} yet.`}
          </p>
        ) : (
          visibleMessages.map((m) => {
            const mine = m.fromId === persona.id;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-sm",
                    m.kind === "system"
                      ? "border-cyan-500/30 bg-cyan-950/40 text-cyan-100"
                      : m.kind === "mystery_nudge"
                        ? "border-amber-500/30 bg-amber-950/30 text-amber-50"
                        : mine
                          ? "border-violet-500/35 bg-violet-600/30 text-violet-50"
                          : "border-zinc-700 bg-zinc-900/90 text-zinc-100"
                  )}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                    {m.fromGlyph} {m.fromAlias}
                    {m.toId ? " · whisper" : " · lounge"} · {m.relative}
                  </p>
                  <p className="mt-1 leading-relaxed">{m.body}</p>
                </div>
              </div>
            );
          })
        )}

        {showTyping && typingGhost ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-zinc-300">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {typingGhost.glyph} {typingGhost.alias}
              </p>
              <p className="mt-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
                </span>
                Ghost is typing…
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {warning ? (
        <div className="relative mt-3 flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{warning}</span>
        </div>
      ) : null}
      {nudgeNote ? (
        <p className="relative mt-2 flex items-center gap-1.5 text-xs text-amber-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {nudgeNote}
        </p>
      ) : null}

      <form
        className="relative mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void sendWhisper();
        }}
      >
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={
            isLounge
              ? "Lounge broadcast — no names, numbers, or meetups…"
              : `Whisper to ${peer?.alias ?? "ghost"} — stay anonymous…`
          }
          className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-900/90 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          maxLength={280}
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 active:scale-[0.98] disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden />
          Send
        </button>
      </form>

      <GhostRosterDrawer
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        ghosts={presenceList}
        selfId={persona.id}
        activeWhisperId={whisperPeerId}
        onlineCount={onlineCount}
        busy={busy}
        matchCooldownMs={matchCooldownMs}
        onMysteryMatch={runMysteryMatch}
        onWhisper={(id) => {
          setChannelUrl("whisper", id);
          setRosterOpen(false);
        }}
        onMysteryDrink={(id) => void sendMysteryTo(id)}
      />
    </div>
  );
}
