/**
 * Canonical brand entry — always BrandLockup / maitab-mark.svg.
 * Do not add alternate SVG wordmarks in this file.
 */
export {
  BrandLockup,
  MaiTabLogo,
  MAITabLogo,
  MAITAB_MARK_SRC,
  default,
} from "./brand-lockup";

import { MaiTabLogo as Logo } from "./brand-lockup";

export function FullLogoWithText(props: {
  className?: string;
  onDark?: boolean;
  title?: string;
}) {
  return <Logo variant="FullLogoWithText" {...props} />;
}

export function IconOnly(props: { className?: string; onDark?: boolean }) {
  return <Logo variant="IconOnly" {...props} />;
}

export function Monochrome(props: { className?: string }) {
  return <Logo variant="FullLogoWithText" {...props} />;
}

export function FaviconSVG(props: { className?: string }) {
  return <Logo variant="IconOnly" {...props} />;
}
