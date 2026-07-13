import type { ConceptDirection } from '../engine'

/**
 * Concept Directions — distinct angles the same idea could be named from.
 *
 * The lab surfaces several interpretations of the confirmed concept; the user can
 * focus word discovery on one, or combine two, to sharpen the words toward that
 * facet. Selecting nothing keeps the whole-concept reading. This is progressive:
 * words already exist below, choosing a direction just re-focuses them.
 */
export function ConceptDirections({
  directions,
  selected,
  onToggle,
}: {
  directions: ConceptDirection[]
  selected: string[]
  onToggle: (ids: string[]) => void
}) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onToggle(selected.filter((x) => x !== id))
      return
    }
    // Allow combining up to two directions; a third replaces the older one.
    const next = selected.length >= 2 ? [selected[1], id] : [...selected, id]
    onToggle(next)
  }

  return (
    <section className="directions">
      <div className="directions-head">
        <h3>Concept Directions</h3>
        <span className="directions-hint">
          Pick an angle to focus the words on — or combine two.
          {selected.length > 0 && (
            <button type="button" className="dir-clear" onClick={() => onToggle([])}>
              Clear focus
            </button>
          )}
        </span>
      </div>
      <div className="dir-grid">
        {directions.map((d) => {
          const on = selected.includes(d.id)
          return (
            <button
              type="button"
              key={d.id}
              className={`dir-card ${on ? 'on' : ''}`}
              aria-pressed={on}
              onClick={() => toggle(d.id)}
            >
              <span className="dir-title">{d.title}</span>
              <span className="dir-title-ru">{d.titleRu}</span>
              <span className="dir-def">{d.definition}</span>
              {on && <span className="dir-badge">Focused</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
