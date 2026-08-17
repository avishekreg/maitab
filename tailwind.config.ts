import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-secondary",
    "bg-muted",
    "bg-accent",
    "bg-card",
    "text-foreground",
    "text-muted-foreground",
    "border-border",
    "border-amber-700/40",
    "border-slate-300/50",
    "border-[#E2B857]",
    "border-violet-500",
    "shadow-amber-900/10",
    "shadow-slate-400/20",
    "shadow-[#E2B857]/20",
    "shadow-violet-500/30",
    "animate-tier-pulse",
    "shadow-glow-gold",
    "shadow-glow-violet",
    "shadow-glow-mint",
    "from-violet-100",
    "to-cyan-50",
    "from-rose-100",
    "to-orange-50",
    "from-emerald-100",
    "to-teal-50",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          // product accents (mAITab semantics)
          violet: "var(--brand-violet)",
          gold: "var(--type-gold, #a38b5e)",
          emerald: "var(--brand-mint)",
          ruby: "var(--brand-ruby)",
          peach: "var(--brand-gold)",
          mint: "var(--brand-mint)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Keep nightlife.* working for the whole codebase
        nightlife: {
          bg: "var(--nightlife-bg)",
          elevated: "var(--nightlife-elevated)",
          panel: "var(--nightlife-panel)",
          line: "var(--border)",
          muted: "var(--muted-foreground)",
          ink: "var(--nightlife-ink)",
        },
        champagne: "var(--champagne)",
        neon: {
          cyan: "var(--brand-cyan)",
          purple: "var(--brand-violet)",
        },
        status: {
          gold: "var(--brand-gold)",
          bronze: "#a16207",
          silver: "#78716c",
          titan: "var(--brand-violet)",
          ready: "var(--brand-mint)",
          danger: "var(--brand-ruby)",
        },
        pastel: {
          lavender: "#efe8ff",
          mint: "#dcfce7",
          peach: "#ffedd5",
          rose: "#fce7f3",
          sky: "#e0f2fe",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "var(--font-display-wide)",
          "Syne",
          "Space Grotesk",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 12px 40px rgba(8, 5, 3, 0.05)",
        glow: "0 10px 28px rgba(124, 58, 237, 0.18)",
        "glow-violet": "0 10px 28px rgba(124, 58, 237, 0.20)",
        "glow-gold": "0 10px 24px rgba(217, 119, 6, 0.18)",
        "glow-emerald": "0 10px 24px rgba(5, 150, 105, 0.18)",
        "glow-mint": "0 10px 24px rgba(5, 150, 105, 0.18)",
      },
      backgroundImage: {
        "nightlife-radial":
          "radial-gradient(900px 480px at 12% -8%, rgba(124,58,237,0.18), transparent 55%), radial-gradient(780px 420px at 92% 0%, rgba(6,182,212,0.12), transparent 50%), linear-gradient(180deg, #09090b 0%, #18181b 100%)",
        "luxury-gradient":
          "linear-gradient(135deg, #7c3aed 0%, #06b6d4 55%, #d97706 100%)",
        "ai-neon": "linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)",
        "glass-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.35))",
        "pastel-party":
          "linear-gradient(135deg, #fce7f3 0%, #efe8ff 45%, #dcfce7 100%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.6s ease-in-out infinite",
        "tier-pulse": "tier-pulse 2.2s ease-in-out infinite",
        shimmer: "shimmer 3.2s ease-in-out infinite",
        ticker: "ticker 18s linear infinite",
        "hero-burst": "hero-burst 3s ease-out forwards",
        "party-float": "party-float 4s ease-in-out infinite",
        "char-in": "char-in 0.45s ease-out both",
      },
      keyframes: {
        "char-in": {
          "0%": { opacity: "0", transform: "translateY(0.55em)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 6px 16px rgba(124,58,237,0.12)" },
          "50%": { boxShadow: "0 10px 28px rgba(124,58,237,0.24)" },
        },
        "tier-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 8px 28px rgba(139,92,246,0.18), 0 0 0 1px rgba(139,92,246,0.35)",
            opacity: "0.92",
          },
          "50%": {
            boxShadow:
              "0 14px 42px rgba(139,92,246,0.38), 0 0 0 1px rgba(139,92,246,0.65)",
            opacity: "1",
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
        "party-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
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
