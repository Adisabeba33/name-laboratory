import type { SimilarityHit } from '../lib/dedupe'

/**
 * "This may already exist" gate for adding a word to the lexicon.
 *
 * A first, on-device prototype of proof-of-meaning: before a word joins the
 * collection we warn if it is too close to something already saved — by form
 * (spelling/sound) or by meaning (the same idea for a different concept) — and let
 * the user add it anyway or cancel. The collection stays a set of distinct ideas.
 */
export function DuplicateDialog({
  word,
  hits,
  onAdd,
  onCancel,
}: {
  word: string
  hits: SimilarityHit[]
  onAdd: () => void
  onCancel: () => void
}) {
  const label = (h: SimilarityHit) =>
    h.kind === 'both' ? 'similar form & meaning' : h.kind === 'form' ? 'similar form' : 'same idea'
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">“{word}” may already be in your lexicon</h3>
        <p className="modal-body">
          A dictionary is only useful if every entry is distinct. These saved words are close:
        </p>
        <ul className="dup-list">
          {hits.slice(0, 4).map((h) => (
            <li key={h.entry.id} className="dup-item">
              <span className="dup-word">{h.entry.word}</span>
              <span className={`dup-tag dup-${h.kind}`}>{label(h)}</span>
              <span className="dup-brief">{h.entry.brief}</span>
            </li>
          ))}
        </ul>
        <p className="modal-note">
          Add it anyway if it truly names a different thing — otherwise keep the collection lean.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={onAdd}>
            Add anyway
          </button>
        </div>
      </div>
    </div>
  )
}
