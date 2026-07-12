import { useMemo, useState } from 'react'
import { generateWords, MODES, type CreativeMode, type WordPassport } from './engine'
import { PassportCard } from './components/PassportCard'

/** Suggested keyword chips — a quick way to seed the concept map. */
const SUGGESTED_KEYWORDS = [
  'trust', 'intelligence', 'calm', 'precision', 'future', 'healing', 'luxury',
  'nature', 'power', 'light', 'vision', 'harmony', 'energy', 'clarity', 'wisdom',
]

const MODE_KEYS = Object.keys(MODES) as CreativeMode[]

export default function App() {
  const [brief, setBrief] = useState('A premium AI company focused on medicine')
  const [keywords, setKeywords] = useState<string[]>([
    'trust', 'intelligence', 'calm', 'precision', 'future',
  ])
  const [freeInput, setFreeInput] = useState('')
  const [mode, setMode] = useState<CreativeMode>('medical')
  const [count, setCount] = useState(6)
  const [results, setResults] = useState<WordPassport[] | null>(null)
  const [nonce, setNonce] = useState(0)

  const allKeywords = useMemo(() => {
    const extra = freeInput
      .split(/[,\n]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    return [...new Set([...keywords, ...extra])]
  }, [keywords, freeInput])

  function toggleKeyword(k: string) {
    setKeywords((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    )
  }

  function run(reseed = false) {
    const seed = reseed ? Math.floor(Math.random() * 1e9) : undefined
    const words = generateWords({
      brief: brief.trim() || undefined,
      keywords: allKeywords,
      mode,
      count,
      seed,
    })
    setResults(words)
    setNonce((n) => n + 1)
  }

  const canRun = allKeywords.length > 0 || brief.trim().length > 0

  return (
    <div className="app">
      <header className="masthead">
        <img className="logo" src="/favicon.svg" alt="" aria-hidden />
        <div>
          <h1>Word Laboratory</h1>
          <p className="tag">
            An AI laboratory that invents new, meaningful words — meaning first, word last.
          </p>
        </div>
      </header>

      <nav className="pipeline" aria-label="Generation pipeline">
        <span className="step">Meaning</span>
        <span className="arrow">→</span>
        <span className="step">Concept</span>
        <span className="arrow">→</span>
        <span className="step">Emotional Identity</span>
        <span className="arrow">→</span>
        <span className="step">Linguistic Structure</span>
        <span className="arrow">→</span>
        <span className="step">Phonetics</span>
        <span className="arrow">→</span>
        <span className="step last">Word</span>
      </nav>

      <section className="lab">
        <div className="field">
          <label className="lbl" htmlFor="brief">
            What are you naming?
          </label>
          <textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. A premium AI company focused on medicine"
          />
          <p className="hint">
            Describe the thing and its spirit. The lab reads meaning from this before choosing a single sound.
          </p>
        </div>

        <div className="field">
          <label className="lbl">Concept keywords</label>
          <div className="chips">
            {SUGGESTED_KEYWORDS.map((k) => (
              <button
                type="button"
                key={k}
                className={`chip ${keywords.includes(k) ? 'on' : ''}`}
                onClick={() => toggleKeyword(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={freeInput}
            onChange={(e) => setFreeInput(e.target.value)}
            placeholder="Add your own, comma-separated…"
            style={{ marginTop: 10 }}
          />
        </div>

        <div className="field">
          <label className="lbl">Creative mode</label>
          <div className="modes">
            {MODE_KEYS.map((key) => (
              <button
                type="button"
                key={key}
                className={`mode ${mode === key ? 'on' : ''}`}
                onClick={() => setMode(key)}
              >
                <b>{MODES[key].label}</b>
                <span>{MODES[key].description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="lbl" htmlFor="count">
            How many words — {count}
          </label>
          <div className="count-control">
            <input
              id="count"
              type="range"
              min={1}
              max={12}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={() => run(false)} disabled={!canRun}>
            Invent words
          </button>
          {results && (
            <button className="btn ghost" onClick={() => run(true)}>
              Try another batch
            </button>
          )}
        </div>
      </section>

      {results === null ? (
        <div className="empty">
          Describe what you're naming and press <b>Invent words</b>. Each result
          arrives with a full Word Passport — meaning, emotional DNA, brand fit and a story.
        </div>
      ) : results.length === 0 ? (
        <div className="empty">
          No words cleared the novelty check for that input. Try adding a keyword or switching modes.
        </div>
      ) : (
        <section className="results" key={nonce}>
          <div className="results-head">
            <h2>{results.length} invented words</h2>
            <span className="muted">
              {MODES[mode].label} mode · built from {allKeywords.length} concept
              {allKeywords.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid">
            {results.map((p) => (
              <PassportCard p={p} key={p.word} />
            ))}
          </div>
        </section>
      )}

      <footer className="footer">
        Word Laboratory runs a self-contained linguistic engine — every word is
        constructed from a measurable “Word Genome”, not copied from any dictionary.
        <br />
        Meaning → Concept → Emotional Identity → Linguistic Structure → Phonetics → Word.
      </footer>
    </div>
  )
}
