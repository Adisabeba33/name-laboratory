import { Logo } from './Logo'
import { NAV_PRIMARY, NAV_SECONDARY, type ViewKey } from './nav'

/**
 * Desktop left navigation — the lab's permanent spine.
 *
 * Quiet, thin-iconed, generous whitespace (Linear register). It names the
 * institute at the top, lists its rooms, and signs off with the current
 * explorer. Future rooms carry a faint "soon" tag but never look unfinished.
 */
export function Sidebar({
  view,
  onNavigate,
  lexiconCount,
}: {
  view: ViewKey
  onNavigate: (v: ViewKey) => void
  lexiconCount: number
}) {
  return (
    <aside className="sidebar">
      <button type="button" className="brand" onClick={() => onNavigate('discover')}>
        <Logo className="brand-mark" />
        <span className="brand-name">
          Word
          <br />
          Laboratory
        </span>
      </button>

      <nav className="nav" aria-label="Primary">
        {NAV_PRIMARY.map(({ key, label, Icon, soon }) => (
          <button
            key={key}
            type="button"
            className={`nav-item ${view === key ? 'on' : ''}`}
            aria-current={view === key ? 'page' : undefined}
            onClick={() => onNavigate(key)}
          >
            <Icon className="nav-ico" />
            <span className="nav-label">{label}</span>
            {key === 'lexicon' && lexiconCount > 0 && (
              <span className="nav-count">{lexiconCount}</span>
            )}
            {soon && <span className="nav-soon">soon</span>}
          </button>
        ))}
      </nav>

      <div className="nav-spacer" />

      <nav className="nav nav-foot" aria-label="Secondary">
        {NAV_SECONDARY.map(({ key, label, Icon, soon }) => (
          <button
            key={key}
            type="button"
            className={`nav-item ${view === key ? 'on' : ''}`}
            aria-current={view === key ? 'page' : undefined}
            onClick={() => onNavigate(key)}
          >
            <Icon className="nav-ico" />
            <span className="nav-label">{label}</span>
            {soon && <span className="nav-soon">soon</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <span className="user-dot" aria-hidden />
        <span className="user-meta">
          <span className="user-name">Anonymous explorer</span>
          <span className="user-sub">Local lexicon</span>
        </span>
      </div>
    </aside>
  )
}
