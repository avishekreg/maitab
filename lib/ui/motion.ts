/**
 * Shared Framer Motion presets — visual-only; no business logic.
 * Easing: cubic-bezier(0.16, 1, 0.3, 1) — snappy decelerate.
 */

export const LUX_EASE = [0.16, 1, 0.3, 1] as const;

export const luxTransition = {
  duration: 0.28,
  ease: LUX_EASE,
};

export const luxFast = {
  duration: 0.18,
  ease: LUX_EASE,
};

export const pageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: LUX_EASE },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: luxTransition,
  },
};

export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: luxFast,
};
