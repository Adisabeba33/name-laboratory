/**
 * The Sianelara mark — an abstract glyph hinting at an unknown letter from an
 * undiscovered alphabet (an emblem for an institute of meaning, deliberately not
 * an hourglass). Five independent elements, uniform stroke, champagne gold:
 *
 *   · inverted top triangle with an intentionally broken right corner
 *   · the dominant descending diagonal
 *   · an independent ascending diagonal that touches nothing
 *   · the base, joined only to the diagonal and the stem
 *   · a floating circle on a stem that meets the base but not the circle
 *
 * Rebuilt as clean vector so it recolours and scales from favicon to hero.
 * Inlined as SVG so the app makes zero external asset requests.
 */
export function Logo({
  className,
  gradientId = 'sianelara-gold',
}: {
  className?: string
  gradientId?: string
}) {
  return (
    <svg className={className} viewBox="0 0 100 108" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="50" y1="0" x2="50" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8D3B3" />
          <stop offset="1" stopColor="#C9A57A" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradientId})`} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        {/* broken top-right stroke → top edge → dominant diagonal → base */}
        <path d="M56 50 L85 8 L23 8 L85 97 L31 97" />
        {/* independent ascending diagonal (touches nothing) */}
        <path d="M15 100 L46 56" />
        {/* stem — meets the base, not the circle */}
        <path d="M53 97 L53 74" />
      </g>
      {/* floating circle */}
      <circle cx="53" cy="67" r="5" fill={`url(#${gradientId})`} />
    </svg>
  )
}
