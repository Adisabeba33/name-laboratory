import { LexiconIcon } from './icons'
import type { LexEntry } from '../lib/lexicon'

/**
 * The workspace's right column — a compact glance at My Lexicon.
 *
 * One line per saved word: a small mark, the word, a single line of meaning.
 * Nothing more — depth lives in the full Lexicon room. This keeps the discovery
 * screen calm while quietly showing the collection growing.
 */
export function LexiconRail({
  entries,
  onOpen,
  onViewAll,
}: {
  entries: LexEntry[]
  onOpen: (e: LexEntry) => void
  onViewAll: () => void
}) {
  return (
    <aside className="lexrail">
      <div className="lexrail-head">
        <h3>
          My Lexicon <span className="lexrail-count">{entries.length}</span>
        </h3>
        {entries.length > 0 && (
          <button type="button" className="btn link sm" onClick={onViewAll}>
            View all
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="lexrail-empty">
          <LexiconIcon className="lexrail-empty-ico" />
          <p>Words you keep will gather here — a personal dictionary of meanings language never had.</p>
        </div>
      ) : (
        <ul className="lexrail-list">
          {entries.slice(0, 7).map((e) => (
            <li key={e.id}>
              <button type="button" className="lexrail-item" onClick={() => onOpen(e)}>
                <span className="lexrail-mark" aria-hidden>
                  {e.word.slice(0, 1).toUpperCase()}
                </span>
                <span className="lexrail-body">
                  <span className="lexrail-word">{e.word}</span>
                  <span className="lexrail-mean">{oneLine(e.shortMeaning || e.meaning)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

/** First clause of a meaning, trimmed to one calm line. */
function oneLine(s: string): string {
  const clean = s.replace(/\s*\(.*$/, '').trim()
  return clean.length > 58 ? clean.slice(0, 58) + '…' : clean
}
