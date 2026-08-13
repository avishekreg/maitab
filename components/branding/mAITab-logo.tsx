import { cn } from "@/lib/utils";

type LogoVariant = "FullLogoWithText" | "IconOnly" | "Monochrome" | "FaviconSVG";

interface MAITabLogoProps {
  variant?: LogoVariant;
  className?: string;
  title?: string;
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
        <stop offset="1" stopColor="#E2B857" />
      </linearGradient>
      {/* Electric Amethyst → Cyan — ONLY for letters A + I */}
      <linearGradient
        id={`${idPrefix}-ai`}
        x1="0"
        y1="0"
        x2="80"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#00F0FF" />
      </linearGradient>
      <filter
        id={`${idPrefix}-glow`}
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feGaussianBlur stdDeviation="1.8" result="blur" />
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
        <feGaussianBlur stdDeviation="2.8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Bar-tab receipt mark with a small AI-engine accent node. */
function IconMark({
  monochrome = false,
  idPrefix,
}: {
  monochrome?: boolean;
  idPrefix: string;
}) {
  const stroke = monochrome ? "currentColor" : `url(#${idPrefix}-brand)`;
  const fillCard = monochrome ? "currentColor" : "#12151A";
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
  x = 78,
  y = 40,
}: {
  monochrome?: boolean;
  idPrefix: string;
  x?: number;
  y?: number;
}) {
  // Soft Slate · Electric Amethyst→Cyan (AI only) · Champagne Gold
  const mFill = monochrome ? "currentColor" : "#94A3B8";
  const aiFill = monochrome ? "currentColor" : `url(#${idPrefix}-ai)`;
  const tabFill = monochrome ? "currentColor" : "#E2B857";

  return (
    <text
      x={x}
      y={y}
      fontFamily="Syne, sans-serif"
      fontSize="30"
      fontWeight="700"
      letterSpacing="0.02em"
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
}: MAITabLogoProps) {
  const idPrefix = `maitab-${variant.toLowerCase()}`;

  if (variant === "IconOnly" || variant === "FaviconSVG") {
    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label={title}
        className={cn("h-10 w-10", className)}
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
        viewBox="0 0 240 64"
        role="img"
        aria-label={title}
        className={cn("h-10 w-auto text-white", className)}
      >
        <title>{title}</title>
        <g transform="translate(0,0)">
          <IconMark monochrome idPrefix={`${idPrefix}-m`} />
        </g>
        <Wordmark monochrome idPrefix={`${idPrefix}-m`} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 260 64"
      role="img"
      aria-label={title}
      className={cn("h-11 w-auto", className)}
    >
      <title>{title}</title>
      <GradientDefs idPrefix={idPrefix} />
      <g transform="translate(0,0)">
        <IconMark idPrefix={idPrefix} />
      </g>
      <Wordmark idPrefix={idPrefix} y={42} />
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
