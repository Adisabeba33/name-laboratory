import { useMemo, useState } from 'react'
import { generateFamilies, MODES, type CreativeMode, type WordFamily } from './engine'
import { LanguageSection } from './components/LanguageSection'
import { LanguageTree } from './components/LanguageTree'
import { Logo } from './components/Logo'

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
  const [results, setResults] = useState<WordFamily[] | null>(null)
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
    const families = generateFamilies({
      brief: brief.trim() || undefined,
      keywords: allKeywords,
      mode,
      count,
      seed,
    })
    setResults(families)
    setNonce((n) => n + 1)
  }

  function scrollToWord(word: string) {
    const el = document.getElementById(`word-${word}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('flash')
    window.setTimeout(() => el.classList.remove('flash'), 1200)
  }

  const canRun = allKeywords.length > 0 || brief.trim().length > 0

  return (
    <div className="app">
      <header className="masthead">
        <Logo className="logo" />
        <div>
          <h1>Word Laboratory</h1>
          <p className="tag">
            A laboratory for discovering words that have never existed — several new
            linguistic species at a time, meaning first.
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
            How many families — {count}
          </label>
          <div className="count-control">
            <input
              id="count"
              type="range"
              min={3}
              max={8}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
            <span className="hint" style={{ marginTop: 0 }}>
              each with 2–3 kin words
            </span>
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={() => run(false)} disabled={!canRun}>
            Discover words
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
          Describe what you're naming and press <b>Discover words</b>. Each run
          surfaces several distinct linguistic families — different species of word —
          and every word arrives with a full Word Passport.
        </div>
      ) : results.length === 0 ? (
        <div className="empty">
          Nothing cleared the novelty check for that input. Try adding a keyword or switching modes.
        </div>
      ) : (
        <section className="results" key={nonce}>
          <div className="results-head">
            <h2>{results.length} linguistic species discovered</h2>
            <span className="muted">
              {results.reduce((n, f) => n + f.words.length, 0)} native words · {MODES[mode].label} mode
            </span>
          </div>

          <LanguageTree families={results} onPick={scrollToWord} />

          {results.map((fam) => (
            <LanguageSection fam={fam} key={fam.id} />
          ))}
        </section>
      )}

      <footer className="footer">
        Word Laboratory runs a self-contained linguistic engine — every word is
        synthesised inside a linguistic archetype from a measurable “Word Genome”,
        never copied from any dictionary and never gluing roots together.
        <br />
        Meaning → Concept → Emotional Identity → Linguistic Structure → Phonetics → Word.
      </footer>
    </div>
  )
}
