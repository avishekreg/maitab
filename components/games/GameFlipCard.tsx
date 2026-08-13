"use client";

import { AnimatePresence, motion } from "framer-motion";

export function GameFlipCard({
  flipKey,
  children,
}: {
  flipKey: string;
  children: React.ReactNode;
}) {
  return (
    <div className="perspective-game">
      <AnimatePresence mode="wait">
        <motion.div
          key={flipKey}
          initial={{ rotateY: 90, opacity: 0, scale: 0.94 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1 }}
          exit={{ rotateY: -90, opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="transform-gpu"
          style={{ transformStyle: "preserve-3d" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function PromptRevealCard({
  title,
  body,
  flash,
}: {
  title: string;
  body: string;
  flash?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-white/15 bg-nightlife-elevated p-6 text-center"
    >
      {flash ? (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-accent-violet/30"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ) : null}
      <p className="text-xs uppercase tracking-[0.22em] text-nightlife-muted">
        {title}
      </p>
      <p className="mt-3 font-display text-2xl font-bold text-white">{body}</p>
    </motion.div>
  );
}
