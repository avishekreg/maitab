export function maitabFaviconDataUri(size = 64): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="g" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8B5CF6"/>
      <stop offset="0.55" stop-color="#A855F7"/>
      <stop offset="1" stop-color="#06B6D4"/>
    </linearGradient>
    <linearGradient id="ai" x1="40" y1="18" x2="56" y2="34" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8B5CF6"/>
      <stop offset="1" stop-color="#06B6D4"/>
    </linearGradient>
  </defs>
  <rect x="4" y="10" width="56" height="44" rx="10" fill="#08090C" stroke="url(#g)" stroke-width="3"/>
  <path d="M16 40V24l7 11 7-11v16" stroke="url(#g)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="48" cy="24" r="3.4" fill="url(#ai)"/>
  <path d="M42 36h12" stroke="url(#g)" stroke-width="2.5" stroke-linecap="round"/>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
