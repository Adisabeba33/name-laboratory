import { useMemo, useState } from 'react'
import { LANGUAGES } from '../engine'
import type { LexEntry } from '../lib/lexicon'
import { ComingSoonGrid, type FutureLab } from './ComingSoon'
import { Placeholder } from './Placeholder'
import { LexiconIcon } from './icons'

/* ── Languages room ───────────────────────────────────────────────────── */

/**
 * The catalogue of sound-worlds the lab can discover. Not fictional nations —
 * phonetic architectures, each a way a meaning can sound. Reads like a museum
 * index: quiet rows, a line of character, its cadence and stress.
 */
export function LanguagesView() {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <div className="view">
      <header className="view-head">
        <p className="view-eyebrow">The collection</p>
        <h1 className="view-title">Living languages</h1>
        <p className="view-lede">
          Every discovered word is a native speaker of one of these sound-worlds — a self-consistent
          phonetic architecture with its own cadence, stress and rate of change.
        </p>
      </header>

      <div className="lang-catalog">
        {LANGUAGES.map((l) => {
          const open = openId === l.id
          return (
            <article key={l.id} className={`lang-row ${open ? 'open' : ''}`}>
              <button
                type="button"
                className="lang-row-head"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : l.id)}
              >
                <span className="lang-row-mark" aria-hidden>{l.character.slice(0, 1)}</span>
                <span className="lang-row-body">
                  <span className="lang-row-name">{l.character}</span>
                  <span className="lang-row-feel">{l.feel}</span>
                </span>
                <span className="lang-row-tags">
                  <span className="lang-tag">{l.cadence}</span>
                  <span className="lang-tag">{l.stressPattern} stress</span>
                </span>
              </button>
              {open && (
                <div className="lang-row-detail">
                  <p className="lang-row-desc">{l.description}</p>
                  <ul className="lang-row-traits">
                    {l.nativeCharacteristics.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                  <div className="lang-row-genome">
                    <span><b>Entropy</b> {l.entropy}</span>
                    <span><b>Mutation</b> {l.mutationRate}</span>
                    <span><b>Evolution</b> {l.evolutionSpeed}</span>
                    <span><b>Endings</b> {l.endings.slice(0, 4).join(' ')}</span>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

/* ── Lexicon room ─────────────────────────────────────────────────────── */

/**
 * My Lexicon as a full room — the user's personal dictionary of meanings
 * language never had. Searchable; each entry keeps its meaning, pronunciation
 * and the concept it was coined for.
 */
export function LexiconView({
  entries,
  onOpen,
  onRemove,
  onDiscover,
}: {
  entries: LexEntry[]
  onOpen: (e: LexEntry) => void
  onRemove: (id: string) => void
  onDiscover: () => void
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
    <div className="view">
      <header className="view-head">
        <p className="view-eyebrow">Your dictionary</p>
        <h1 className="view-title">My Lexicon</h1>
        <p className="view-lede">
          The words you kept — a private vocabulary of meanings that had no name before. Stored on
          this device.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="view-empty">
          <LexiconIcon className="view-empty-ico" />
          <p>Nothing saved yet. Discover a meaning, then keep the words that ring true.</p>
          <button type="button" className="btn primary" onClick={onDiscover}>Discover a meaning</button>
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
                <button type="button" className="lex-card-open" onClick={() => onOpen(e)}>
                  <div className="lex-word-row">
                    <span className="lex-word">{e.word}</span>
                    <span className={`band band-${e.adoptionBand.toLowerCase()}`}>{e.adoptionBand}</span>
                  </div>
                  <div className="lex-meta">
                    {e.pronunciationGuide && <span className="wcard-say">{e.pronunciationGuide}</span>}
                    {e.transliteration && <span className="wcard-translit">{e.transliteration}</span>}
                    {e.partOfSpeech && <span className="wcard-pos">{e.partOfSpeech}</span>}
                  </div>
                  <p className="lex-meaning">“{e.meaning}”</p>
                  <p className="lex-brief">for: {e.brief}</p>
                </button>
                <button type="button" className="lex-remove" onClick={() => onRemove(e.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Future-laboratory rooms ──────────────────────────────────────────── */

const ROOM_COPY: Record<string, { eyebrow: string; title: string; lede: string; labs?: FutureLab[] }> = {
  collections: {
    eyebrow: 'Curation',
    title: 'Collections',
    lede: 'Group your discovered words into themed sets — a book of feelings, a palette of brand names, a family of one root.',
    labs: [
      { title: 'Themed sets', blurb: 'Gather words that belong to one mood or project.' },
      { title: 'Shared collections', blurb: 'Publish a set for others to read and adopt.' },
      { title: 'Concept boards', blurb: 'Pin meanings, tensions and words side by side.' },
    ],
  },
  experiments: {
    eyebrow: 'The laboratory',
    title: 'Experiments',
    lede: 'Where new instruments are tested — visualisations and tools for exploring meaning before language.',
  },
  settings: {
    eyebrow: 'Preferences',
    title: 'Settings',
    lede: 'Accounts, sync and preferences will live here once the lab remembers you across devices.',
    labs: [
      { title: 'Accounts & sync', blurb: 'Carry your lexicon to any device.' },
      { title: 'Appearance', blurb: 'Tune the reading environment.' },
      { title: 'Language & region', blurb: 'Choose the languages words should live in.' },
    ],
  },
  help: {
    eyebrow: 'Guidance',
    title: 'Help & docs',
    lede: 'How the laboratory reads meaning, discovers languages and grows words — and how to read a Word page.',
    labs: [
      { title: 'How discovery works', blurb: 'Meaning first, word last — the method explained.' },
      { title: 'Reading a Word page', blurb: 'Usage, meaning, evolution, genome and more.' },
      { title: 'Honesty & limits', blurb: 'What the lab measures, estimates, and does not check.' },
    ],
  },
}

export function RoomView({ room }: { room: keyof typeof ROOM_COPY }) {
  const copy = ROOM_COPY[room]
  return (
    <div className="view">
      <header className="view-head">
        <p className="view-eyebrow">{copy.eyebrow}</p>
        <h1 className="view-title">{copy.title}</h1>
        <p className="view-lede">{copy.lede}</p>
      </header>

      {room === 'experiments' ? (
        <ComingSoonGrid />
      ) : (
        <div className="room-split">
          <ComingSoonGrid labs={copy.labs} />
          <Placeholder width={600} height={400} title="Future room" note="this laboratory is being built" />
        </div>
      )}
    </div>
  )
}
