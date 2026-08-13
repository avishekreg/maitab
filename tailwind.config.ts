import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-slate-700",
    "bg-gradient-to-r",
    "from-slate-300",
    "to-slate-100",
    "from-amber-500",
    "to-amber-600",
    "from-violet-500",
    "via-fuchsia-500",
    "to-rose-500",
    "text-nightlife-bg",
    "border-slate-700/80",
    "border-slate-700/70",
    "border-slate-300/25",
    "border-slate-300/35",
    "border-amber-400/30",
    "border-amber-400/35",
    "border-violet-400/35",
    "border-rose-400/35",
    "border-champagne/20",
    "bg-amber-500/[0.06]",
    "bg-amber-500/10",
    "bg-violet-500/[0.08]",
    "bg-rose-500/10",
    "bg-white/[0.04]",
    "bg-white/[0.06]",
    "text-slate-200",
    "text-slate-300",
    "text-amber-300",
    "text-rose-200",
    "text-violet-300",
    "stroke-slate-800",
    "stroke-slate-400",
    "stroke-slate-700",
    "stroke-slate-300",
    "stroke-amber-950",
    "stroke-amber-400",
    "stroke-violet-950",
    "stroke-rose-400",
    "animate-tier-pulse",
    "shadow-glow-gold",
  ],
  theme: {
    extend: {
      colors: {
        nightlife: {
          bg: "#12151A",
          elevated: "#1A1E26",
          panel: "#1C2129",
          line: "rgba(226,184,87,0.20)",
          muted: "#CBD5E1",
        },
        champagne: "#E2B857",
        accent: {
          violet: "#8B5CF6",
          gold: "#E2B857",
          emerald: "#10B981",
          ruby: "#F43F5E",
        },
        neon: {
          cyan: "#00F0FF",
          purple: "#8B5CF6",
        },
        status: {
          gold: "#E2B857",
          bronze: "#B45309",
          silver: "#94A3B8",
          titan: "#A855F7",
          ready: "#10B981",
          danger: "#F43F5E",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Syne", "sans-serif"],
        body: ["var(--font-body)", "DM Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 28px rgba(139, 92, 246, 0.32)",
        "glow-violet": "0 0 28px rgba(139, 92, 246, 0.32)",
        "glow-gold": "0 0 24px rgba(226, 184, 87, 0.28)",
        "glow-emerald": "0 0 20px rgba(16, 185, 129, 0.25)",
      },
      backgroundImage: {
        "nightlife-radial":
          "radial-gradient(1000px 520px at 12% -8%, rgba(139,92,246,0.14), transparent 55%), radial-gradient(800px 420px at 88% 0%, rgba(226,184,87,0.10), transparent 50%), linear-gradient(180deg, #12151A 0%, #0C0E12 100%)",
        "luxury-gradient":
          "linear-gradient(135deg, #8B5CF6 0%, #A855F7 45%, #E2B857 100%)",
        "ai-neon":
          "linear-gradient(90deg, #A855F7 0%, #00F0FF 100%)",
        "glass-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.6s ease-in-out infinite",
        "tier-pulse": "tier-pulse 2.2s ease-in-out infinite",
        shimmer: "shimmer 3.2s ease-in-out infinite",
        ticker: "ticker 18s linear infinite",
        "hero-burst": "hero-burst 3s ease-out forwards",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(139,92,246,0.22)" },
          "50%": { boxShadow: "0 0 28px rgba(139,92,246,0.45)" },
        },
        "tier-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 24px rgba(139,92,246,0.25), 0 0 8px rgba(226,184,87,0.15)",
          },
          "50%": {
            boxShadow:
              "0 0 42px rgba(139,92,246,0.45), 0 0 28px rgba(226,184,87,0.28)",
          },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "100%": { transform: "translateX(320%) skewX(-12deg)" },
        },
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "hero-burst": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "15%": { opacity: "1", transform: "scale(1)" },
          "80%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.04)" },
        },
      },
      backdropBlur: {
        glass: "24px",
      },
    },
  },
  plugins: [],
};

export default config;
