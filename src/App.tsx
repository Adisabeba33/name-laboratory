import { useMemo, useRef, useState } from 'react'
import {
  runLaboratory,
  discoverFromAnalysis,
  MODES,
  type CreativeMode,
  type LaboratoryResult,
} from './engine'
import { analyzeRemote } from './lib/analyze'
import { fetchBespokeMeanings, type WordItem } from './lib/meanings'
import { InterpretationPanel } from './components/InterpretationPanel'
import { LanguageSection } from './components/LanguageSection'
import { LanguageTree } from './components/LanguageTree'
import { Logo } from './components/Logo'

const MODE_KEYS = Object.keys(MODES) as CreativeMode[]

/** A few starting prompts, to show the one thing the lab wants: a described meaning. */
const EXAMPLES = [
  'the feeling of becoming someone completely different after surviving something that should have destroyed you',
  'a calm, premium AI company for medicine',
  'the quiet joy of returning home after a long time away',
  'a luxury fragrance that smells like rain on warm stone',
]

export default function App() {
  const [brief, setBrief] = useState(
    'A word for the feeling of becoming someone completely different after surviving something that should have destroyed you.',
  )
  // Advanced-only controls — most people never open them.
  const [mode, setMode] = useState<CreativeMode>('timeless')
  const [count, setCount] = useState(6)
  const [extra, setExtra] = useState('')

  const [results, setResults] = useState<LaboratoryResult | null>(null)
  const [nonce, setNonce] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [refining, setRefining] = useState(false)
  const [usedLLM, setUsedLLM] = useState(false)
  const runId = useRef(0)

  const keywords = useMemo(
    () =>
      extra
        .split(/[,\n]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    [extra],
  )

  async function run(reseed = false) {
    if (analyzing) return
    const myRun = ++runId.current
    const trimmed = brief.trim()
    const seed = reseed ? Math.floor(Math.random() * 1e9) : undefined
    const request = { brief: trimmed || undefined, keywords, mode, count, seed }

    setAnalyzing(true)
    let result: LaboratoryResult
    let remote = false
    try {
      // 1) Let the LLM understand the meaning (server-side). Reuse the prior
      //    LLM analysis on a reseed so "Try another set" doesn't re-bill a call.
      const analysis =
        reseed && usedLLM && results
          ? results.analysis
          : await analyzeRemote(trimmed)

      remote = Boolean(analysis)
      // Build immediately with the engine's meanings, so results show fast.
      result = analysis ? discoverFromAnalysis(analysis, request) : runLaboratory(request)
      setResults(result)
      setUsedLLM(remote)
      setNonce((n) => n + 1)
    } finally {
      setAnalyzing(false)
    }

    // 2) Progressive enhancement: have the LLM write a bespoke meaning for each
    //    word, then swap them in place. Only when the LLM is actually available.
    if (remote) {
      setRefining(true)
      try {
        const items: WordItem[] = result.families.flatMap((f) =>
          f.words.map((w) => ({
            word: w.word,
            language: f.character,
            hint: w.meaning.split(' (')[0],
          })),
        )
        const map = await fetchBespokeMeanings(trimmed, items)
        if (map && runId.current === myRun) {
          setResults({
            ...result,
            families: result.families.map((f) => ({
              ...f,
              words: f.words.map((w) => {
                const m = map.get(w.word.toLowerCase())
                return m ? { ...w, meaning: `${m.en} (${m.ru})` } : w
              }),
            })),
          })
        }
      } finally {
        if (runId.current === myRun) setRefining(false)
      }
    }
  }

  function scrollToWord(word: string) {
    const el = document.getElementById(`word-${word}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('flash')
    window.setTimeout(() => el.classList.remove('flash'), 1200)
  }

  const canRun = brief.trim().length > 0

  return (
    <div className="app">
      <header className="masthead">
        <Logo className="logo" />
        <div>
          <h1>Word Laboratory</h1>
          <p className="tag">
            Describe a meaning. The laboratory works out the rest — the concepts, the
            languages, and the words to name it.
          </p>
        </div>
      </header>

      <section className="lab">
        <div className="field">
          <label className="lbl" htmlFor="brief">
            Describe the word you want
          </label>
          <textarea
            id="brief"
            className="hero-input"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canRun) run(false)
            }}
            placeholder="e.g. the feeling of becoming someone completely different after surviving something that should have destroyed you"
            rows={3}
          />
          <p className="hint">
            Just the meaning or feeling — no keywords, no settings needed. Press ⌘/Ctrl + Enter to run.
          </p>

          <div className="examples">
            <span className="examples-label">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                type="button"
                key={ex}
                className="example"
                onClick={() => setBrief(ex)}
              >
                {ex.length > 46 ? ex.slice(0, 46) + '…' : ex}
              </button>
            ))}
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={() => run(false)} disabled={!canRun || analyzing}>
            {analyzing ? 'Reading the meaning…' : 'Discover words'}
          </button>
          {results && !analyzing && (
            <button className="btn ghost" onClick={() => run(true)}>
              Try another set
            </button>
          )}
        </div>

        <details className="advanced">
          <summary>Advanced options</summary>
          <div className="advanced-body">
            <div className="field">
              <label className="lbl">Creative register (optional)</label>
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
              <p className="hint">
                Leave as-is to let the meaning choose. A register only nudges which languages surface.
              </p>
            </div>

            <div className="field">
              <label className="lbl" htmlFor="count">
                How many languages — {count}
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
                  each with 2–3 native words
                </span>
              </div>
            </div>

            <div className="field">
              <label className="lbl" htmlFor="extra">
                Force specific concepts (optional)
              </label>
              <input
                id="extra"
                type="text"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="e.g. rebirth, memory, fire — comma-separated"
              />
            </div>
          </div>
        </details>
      </section>

      {results === null ? (
        <div className="empty">
          Describe a meaning and press <b>Discover words</b>. The laboratory reads what you
          really mean, then surfaces several new languages — each with native-speaker words.
        </div>
      ) : results.families.length === 0 ? (
        <div className="empty">
          Nothing cleared the novelty check for that input. Try describing it a little differently.
        </div>
      ) : (
        <section className="results" key={nonce}>
          <InterpretationPanel analysis={results.analysis} source={usedLLM ? 'llm' : 'engine'} />

          <div className="results-head">
            <h2>{results.families.length} linguistic species discovered</h2>
            <span className="muted">
              {results.families.reduce((n, f) => n + f.words.length, 0)} native words
              {refining && <span className="refining"> · writing meanings…</span>}
            </span>
          </div>

          <LanguageTree families={results.families} onPick={scrollToWord} />

          {results.families.map((fam) => (
            <LanguageSection fam={fam} key={fam.id} />
          ))}
        </section>
      )}

      <footer className="footer">
        Word Laboratory understands your meaning first, then invents the languages and words
        to carry it — every word synthesised from a measurable genome, never copied from a
        dictionary.
        <br />
        Meaning → Concept → Language Discovery → Word Evolution → Word.
      </footer>
    </div>
  )
}
