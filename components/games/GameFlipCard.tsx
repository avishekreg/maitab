"use client";

import { AnimatePresence, motion } from "framer-motion";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

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
          initial={{ rotateY: 72, opacity: 0, scale: 0.96, y: 10 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1, y: 0 }}
          exit={{ rotateY: -56, opacity: 0, scale: 0.97, y: -6 }}
          transition={SPRING}
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
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={SPRING}
      className="relative flex min-h-[140px] w-full flex-col justify-center overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-6 shadow-lg md:p-8"
    >
      {flash ? (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-violet-500/20"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ) : null}
      <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
        {title}
      </p>
      <p className="text-left font-display text-lg font-extrabold leading-relaxed text-white md:text-xl">
        {body}
      </p>
    </motion.div>
  );
}
