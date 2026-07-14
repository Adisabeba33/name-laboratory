import { NAV_MOBILE, type ViewKey } from './nav'

/**
 * Mobile bottom navigation — the app-shell tab bar (iOS register).
 *
 * Fixed to the safe-area bottom edge so the product reads as a native PWA on a
 * phone. Mirrors a condensed slice of the sidebar's rooms.
 */
export function BottomNav({
  view,
  onNavigate,
}: {
  view: ViewKey
  onNavigate: (v: ViewKey) => void
}) {
  return (
    <nav className="bottomnav" aria-label="Primary (mobile)">
      {NAV_MOBILE.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`bn-item ${view === key ? 'on' : ''}`}
          aria-current={view === key ? 'page' : undefined}
          onClick={() => onNavigate(key)}
        >
          <Icon className="bn-ico" />
          <span className="bn-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
