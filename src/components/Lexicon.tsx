import { useMemo, useState } from 'react'
import type { LexEntry } from '../lib/lexicon'

/**
 * My Lexicon — the user's saved vocabulary of discovered words.
 *
 * A personal dictionary the user builds over time. This is a strong retention
 * surface: people return not only to discover words, but to revisit the meanings
 * they've collected. Entries are searchable and removable; each shows the word,
 * its meaning, how to say it, the concept it names, and when it was saved.
 */
export function Lexicon({
  entries,
  onRemove,
  onClose,
}: {
  entries: LexEntry[]
  onRemove: (id: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.word.toLowerCase().includes(q) ||
        e.transliteration.includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.brief.toLowerCase().includes(q),
    )
  }, [entries, query])

  return (
    <section className="lexicon">
      <div className="lexicon-head">
        <h2>My Lexicon <span className="muted">· {entries.length}</span></h2>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          Your saved words appear here. On any word, press <b>Save</b> to add it to your
          personal dictionary — it stays on this device.
        </div>
      ) : (
        <>
          <input
            type="text"
            className="lex-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your words, meanings or concepts…"
          />
          <div className="lex-grid">
            {filtered.map((e) => (
              <article className="lex-card" key={e.id}>
                <div className="lex-word-row">
                  <span className="lex-word">{e.word}</span>
                  <button
                    type="button"
                    className="lex-remove"
                    title="Remove from lexicon"
                    onClick={() => onRemove(e.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="lex-meta">
                  {e.pronunciationGuide && <span className="say-val">{e.pronunciationGuide}</span>}
                  {e.transliteration && <span className="translit">{e.transliteration}</span>}
                  {e.partOfSpeech && <span className="pos">{e.partOfSpeech}</span>}
                </div>
                <p className="lex-meaning">“{e.meaning}”</p>
                <div className="lex-foot">
                  <span className="lex-lang">{e.language}</span>
                  <span className={`adopt-band ${e.adoptionBand.toLowerCase()}`}>
                    {e.adoptionBand}
                  </span>
                </div>
                <p className="lex-brief">for: {e.brief}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
