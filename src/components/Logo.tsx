/**
 * The lab mark, inlined as SVG so the app has zero external asset requests —
 * important for the single-file / Artifact build where a CSP blocks other hosts.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="wl-logo" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b7cff" />
          <stop offset="1" stopColor="#4dd0e1" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="#11131f" />
      <path
        d="M19 9h10v2h-2v9.2l7.7 12.9A4 4 0 0 1 31.3 39H16.7a4 4 0 0 1-3.4-5.9L21 20.2V11h-2V9Z"
        stroke="url(#wl-logo)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M17.5 27h13" stroke="url(#wl-logo)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="31.5" r="1.6" fill="#8b7cff" />
      <circle cx="27" cy="34" r="1.3" fill="#4dd0e1" />
    </svg>
  )
}
