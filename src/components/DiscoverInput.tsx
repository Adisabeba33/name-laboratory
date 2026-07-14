import { ArrowIcon } from './icons'

/**
 * The workspace's writing surface — a large, quiet editor for a single free-text
 * meaning, plus suggestion pills and the Continue action. No Bootstrap textarea:
 * it should feel like an expensive editor with room to think.
 *
 * The single-input principle holds; advanced controls stay tucked away.
 */
export function DiscoverInput({
  mode,
  brief,
  onBrief,
  onRun,
  running,
  runLabel,
  label,
  placeholder,
  suggestions,
  onPick,
  children,
}: {
  mode: 'discover' | 'name'
  brief: string
  onBrief: (v: string) => void
  onRun: () => void
  running: boolean
  runLabel: string
  label: string
  placeholder: string
  suggestions: string[]
  onPick: (s: string) => void
  /** Advanced options, rendered under the editor. */
  children?: React.ReactNode
}) {
  const canRun = brief.trim().length > 0
  const max = 500
  return (
    <div className="editor">
      <div className="editor-head">
        <span className="editor-kicker">
          {mode === 'name' ? 'Name something' : 'Discover a meaning'}
        </span>
        <span className="editor-label">{label}</span>
      </div>

      <div className="editor-field">
        <textarea
          className="editor-input"
          value={brief}
          maxLength={max}
          onChange={(e) => onBrief(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canRun && !running) onRun()
          }}
          placeholder={placeholder}
          rows={4}
          spellCheck
        />
        <span className="editor-count">
          {brief.length}/{max}
        </span>
      </div>

      <div className="suggests">
        <span className="suggests-label">Try these openings</span>
        <div className="suggests-pills">
          {suggestions.map((s) => (
            <button key={s} type="button" className="pill" onClick={() => onPick(s)}>
              {s.length > 52 ? s.slice(0, 52) + '…' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-actions">
        <button type="button" className="btn primary" onClick={onRun} disabled={!canRun || running}>
          {running ? 'Reading…' : runLabel}
          {!running && <ArrowIcon className="btn-ico" />}
        </button>
        <span className="editor-note">
          ⌘/Ctrl + Enter · anything that uses AI asks first — declining still returns a free result.
        </span>
      </div>

      {children}
    </div>
  )
}
