import { cn } from "@/lib/utils";

type LogoVariant = "FullLogoWithText" | "IconOnly" | "Monochrome" | "FaviconSVG";

interface MAITabLogoProps {
  variant?: LogoVariant;
  className?: string;
  title?: string;
  /** When true, `m` + `Tab` render pure white for dark hero/nav surfaces */
  onDark?: boolean;
}

function GradientDefs({ idPrefix }: { idPrefix: string }) {
  return (
    <defs>
      <linearGradient
        id={`${idPrefix}-brand`}
        x1="0"
        y1="0"
        x2="64"
        y2="64"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#8B5CF6" />
        <stop offset="0.55" stopColor="#A855F7" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient
        id={`${idPrefix}-ai`}
        x1="0"
        y1="0"
        x2="100"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
      <filter
        id={`${idPrefix}-glow`}
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feGaussianBlur stdDeviation="1.6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter
        id={`${idPrefix}-ai-glow`}
        x="-80%"
        y="-80%"
        width="260%"
        height="260%"
      >
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Signature bar-tab card with AI-node accent */
function IconMark({
  monochrome = false,
  idPrefix,
}: {
  monochrome?: boolean;
  idPrefix: string;
}) {
  const stroke = monochrome ? "currentColor" : `url(#${idPrefix}-brand)`;
  const fillCard = monochrome ? "currentColor" : "#0a0a0c";
  const aiNode = monochrome ? "currentColor" : `url(#${idPrefix}-ai)`;

  return (
    <g filter={monochrome ? undefined : `url(#${idPrefix}-glow)`}>
      <rect
        x="4"
        y="12"
        width="56"
        height="40"
        rx="10"
        fill={fillCard}
        fillOpacity={monochrome ? 0.08 : 1}
        stroke={stroke}
        strokeWidth="3"
      />
      <path
        d="M16 42V22l7 12 7-12v20"
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="48"
        cy="24"
        r="3.4"
        fill={aiNode}
        filter={monochrome ? undefined : `url(#${idPrefix}-ai-glow)`}
      />
      <path
        d="M42 36h12"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M48 20.5v-3.2M48 30.7v-3.2M44.2 24h-3.2M55 24h-3.2"
        stroke={aiNode}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity={monochrome ? 0.7 : 0.95}
      />
    </g>
  );
}

function Wordmark({
  monochrome,
  idPrefix,
  onDark = false,
  x = 72,
  y = 42,
}: {
  monochrome?: boolean;
  idPrefix: string;
  onDark?: boolean;
  x?: number;
  y?: number;
}) {
  // Dark surfaces: pure white m/Tab. Light chrome: ink (never gold/orange).
  const ink = onDark ? "#FFFFFF" : "#080503";
  const mFill = monochrome ? "currentColor" : ink;
  const aiFill = monochrome ? "currentColor" : `url(#${idPrefix}-ai)`;
  const tabFill = monochrome ? "currentColor" : ink;

  return (
    <text
      x={x}
      y={y}
      fontFamily="Syne, 'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, sans-serif"
      fontSize="36"
      fontWeight="800"
      letterSpacing="-0.03em"
    >
      <tspan fill={mFill}>m</tspan>
      <tspan
        fill={aiFill}
        filter={monochrome ? undefined : `url(#${idPrefix}-ai-glow)`}
      >
        AI
      </tspan>
      <tspan fill={tabFill}>Tab</tspan>
    </text>
  );
}

export function MAITabLogo({
  variant = "FullLogoWithText",
  className,
  title = "mAITab",
  onDark = false,
}: MAITabLogoProps) {
  const idPrefix = `maitab-${variant.toLowerCase()}-${onDark ? "dark" : "light"}`;

  if (variant === "IconOnly" || variant === "FaviconSVG") {
    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label={title}
        className={cn("h-10 w-10 shrink-0", className)}
      >
        <title>{title}</title>
        <GradientDefs idPrefix={idPrefix} />
        <IconMark idPrefix={idPrefix} />
      </svg>
    );
  }

  if (variant === "Monochrome") {
    return (
      <svg
        viewBox="0 0 268 64"
        role="img"
        aria-label={title}
        className={cn("h-10 w-auto shrink-0 text-foreground", className)}
      >
        <title>{title}</title>
        <g transform="translate(0,2) scale(0.88)">
          <IconMark monochrome idPrefix={`${idPrefix}-m`} />
        </g>
        <Wordmark monochrome idPrefix={`${idPrefix}-m`} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 268 64"
      role="img"
      aria-label={title}
      className={cn("h-9 w-auto shrink-0 overflow-visible sm:h-10", className)}
    >
      <title>{title}</title>
      <GradientDefs idPrefix={idPrefix} />
      {/* Slightly smaller icon badge so wordmark reads at text-xl/2xl weight */}
      <g transform="translate(0,2) scale(0.88)">
        <IconMark idPrefix={idPrefix} />
      </g>
      <Wordmark idPrefix={idPrefix} onDark={onDark} />
    </svg>
  );
}

/** Alias kept for existing call sites */
export const MaiTabLogo = MAITabLogo;

export function FullLogoWithText(props: Omit<MAITabLogoProps, "variant">) {
  return <MAITabLogo variant="FullLogoWithText" {...props} />;
}

export function IconOnly(props: Omit<MAITabLogoProps, "variant">) {
  return <MAITabLogo variant="IconOnly" {...props} />;
}

export function Monochrome(props: Omit<MAITabLogoProps, "variant">) {
  return <MAITabLogo variant="Monochrome" {...props} />;
}

export function FaviconSVG(props: Omit<MAITabLogoProps, "variant">) {
  return <MAITabLogo variant="FaviconSVG" {...props} />;
}

export default MAITabLogo;
