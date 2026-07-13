import { useMemo, useRef, useState } from 'react'
import {
  runLaboratory,
  discoverFromAnalysis,
  focusConcepts,
  MODES,
  type CreativeMode,
  type LaboratoryResult,
  type WordPassport,
} from './engine'
import {
  loadLexicon,
  addEntry,
  removeEntry,
  toEntry,
  lexId,
  type LexEntry,
} from './lib/lexicon'
import { analyzeRemote } from './lib/analyze'
import { fetchBespokeMeanings, type WordItem } from './lib/meanings'
import { fetchUsage, hasCachedUsage } from './lib/usage'
import { InterpretationPanel } from './components/InterpretationPanel'
import { ConceptDirections } from './components/ConceptDirections'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Lexicon } from './components/Lexicon'
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
  const [steering, setSteering] = useState(false)
  const [usedLLM, setUsedLLM] = useState(false)
  const [selectedDirections, setSelectedDirections] = useState<string[]>([])
  // Cost control: every LLM call must be confirmed. `llmAllowed` is the
  // "don't ask again this session" escape; `confirm` drives the dialog.
  const [llmAllowed, setLlmAllowed] = useState(false)
  const [confirm, setConfirm] = useState<{ message: string; resolve: (ok: boolean) => void } | null>(
    null,
  )
  // My Lexicon — the user's saved words, persisted on-device (localStorage).
  const [lexicon, setLexicon] = useState<LexEntry[]>(() => loadLexicon())
  const [showLexicon, setShowLexicon] = useState(false)
  const runId = useRef(0)

  // Which of the current results' words are already saved (for this concept).
  const savedKeys = useMemo(() => {
    const b = brief.trim()
    return new Set(lexicon.filter((e) => e.brief === b).map((e) => e.word.toLowerCase()))
  }, [lexicon, brief])

  function toggleSave(p: WordPassport) {
    const b = brief.trim()
    const id = lexId(p.word, b)
    setLexicon((prev) =>
      prev.some((e) => e.id === id)
        ? removeEntry(prev, id)
        : addEntry(prev, toEntry(p, p.family.name, b, new Date().toISOString())),
    )
  }

  /** Ask permission before any AI request. Resolves true if allowed. */
  function confirmLLM(message: string): Promise<boolean> {
    if (llmAllowed) return Promise.resolve(true)
    return new Promise((resolve) => setConfirm({ message, resolve }))
  }

  const keywords = useMemo(
    () =>
      extra
        .split(/[,\n]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    [extra],
  )

  /**
   * Progressive enhancement: have the LLM write a bespoke meaning + usage for
   * each word and swap them in place. Only runs when the LLM is available.
   */
  async function enrich(result: LaboratoryResult, myRun: number, trimmed: string) {
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
              return m
                ? {
                    ...w,
                    meaning: `${m.en} (${m.ru})`,
                    shortMeaning: m.short || w.shortMeaning,
                    partOfSpeech: m.pos || w.partOfSpeech,
                  }
                : w
            }),
          })),
        })
      }
    } finally {
      if (runId.current === myRun) setRefining(false)
    }
  }

  async function run(reseed = false, steer?: string) {
    if (analyzing) return
    const trimmed = brief.trim()
    if (!trimmed) return

    // Ask before any AI request. Declining still gives a free engine result;
    // a steer only makes sense with AI, so a declined steer is a no-op.
    const wantsAI = await confirmLLM(
      steer
        ? 'Re-read this meaning with the chosen emphasis and rewrite the word meanings.'
        : reseed
          ? 'Discover another set — rewrite the word meanings for the new words.'
          : 'Read the meaning and write bespoke word meanings for this prompt.',
    )
    if (!wantsAI && steer) return

    const myRun = ++runId.current
    const seed = reseed ? Math.floor(Math.random() * 1e9) : undefined
    const request = { brief: trimmed || undefined, keywords, mode, count, seed }
    // A steer re-interprets the SAME prompt with an added emphasis, without
    // changing what the user typed. Word synthesis still flows from the analysis.
    const analysisBrief = steer ? `${trimmed}\n\nSteer the reading: ${steer}.` : trimmed

    setAnalyzing(true)
    if (steer) setSteering(true)
    setSelectedDirections([]) // a new reading starts unfocused
    let result: LaboratoryResult
    let remote = false
    try {
      // 1) Let the LLM understand the meaning (server-side) — only if allowed.
      //    Reuse the prior LLM analysis on a reseed so it doesn't re-bill a call.
      const analysis = !wantsAI
        ? null
        : reseed && usedLLM && results && !steer
          ? results.analysis
          : await analyzeRemote(analysisBrief)

      remote = Boolean(analysis)
      // Build immediately with the engine's meanings, so results show fast.
      result = analysis ? discoverFromAnalysis(analysis, request) : runLaboratory(request)
      setResults(result)
      setUsedLLM(remote)
      setNonce((n) => n + 1)
    } finally {
      setAnalyzing(false)
    }

    if (remote) await enrich(result, myRun, trimmed)
    if (runId.current === myRun) setSteering(false)
  }

  /**
   * Focus word discovery on the chosen concept direction(s). Re-uses the current
   * analysis (no new LLM analysis call) — it only re-weights discovery and, if
   * the LLM is on, re-writes the new words' meanings. Toggling with no selection
   * returns to the whole-concept reading.
   */
  async function focusOn(ids: string[]) {
    if (!results || analyzing) return
    const myRun = ++runId.current
    setSelectedDirections(ids)
    const trimmed = brief.trim()
    const request = { brief: trimmed || undefined, keywords, mode, count }
    const focus = focusConcepts(results.analysis.concepts, results.analysis.directions, ids)
    // Re-focusing the words is a free engine step — apply it immediately.
    const result = discoverFromAnalysis(results.analysis, request, focus)
    setResults(result)
    setNonce((n) => n + 1)
    // Rewriting the focused words' meanings is an AI request — ask first.
    if (usedLLM && (await confirmLLM('Rewrite the focused words’ meanings with AI for this angle.'))) {
      await enrich(result, myRun, trimmed)
    }
  }

  /**
   * Lazily write "Use in Language" example sentences for ONE word, on demand —
   * the most expensive step, so it runs only when a user asks to see this word
   * used in a sentence. Free when already cached; otherwise an AI request.
   */
  async function requestUsage(p: WordPassport, language: string): Promise<void> {
    if (!results) return
    const b = brief.trim()
    if (!hasCachedUsage(b, p.word)) {
      const ok = await confirmLLM(`Write example sentences that use “${p.word}” in a real sentence.`)
      if (!ok) return
    }
    const usage = await fetchUsage(b, {
      word: p.word,
      language,
      hint: p.meaning.split(' (')[0],
      translit: p.transliteration,
    })
    if (!usage) return
    setResults((prev) =>
      prev
        ? {
            ...prev,
            families: prev.families.map((f) => ({
              ...f,
              words: f.words.map((w) =>
                w.word === p.word ? { ...w, usage: { en: usage.en, ru: usage.ru } } : w,
              ),
            })),
          }
        : prev,
    )
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
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onCancel={() => {
            confirm.resolve(false)
            setConfirm(null)
          }}
          onAllow={(remember) => {
            if (remember) setLlmAllowed(true)
            confirm.resolve(true)
            setConfirm(null)
          }}
        />
      )}
      <header className="masthead">
        <Logo className="logo" />
        <div>
          <h1>Word Laboratory</h1>
          <p className="tag">
            Describe a meaning. The laboratory works out the rest — the concepts, the
            languages, and the words to name it.
          </p>
        </div>
        <button
          type="button"
          className="btn ghost lex-open"
          onClick={() => setShowLexicon((v) => !v)}
        >
          My Lexicon · {lexicon.length}
        </button>
      </header>

      {showLexicon && (
        <Lexicon
          entries={lexicon}
          onRemove={(id) => setLexicon((prev) => removeEntry(prev, id))}
          onClose={() => setShowLexicon(false)}
        />
      )}

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
            Anything that uses AI asks first — declining still gives a free engine result.
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
          <InterpretationPanel
            analysis={results.analysis}
            source={usedLLM ? 'llm' : 'engine'}
            onSteer={usedLLM ? (label) => run(false, label) : undefined}
            steering={steering}
          />

          {results.analysis.directions.length > 0 && (
            <ConceptDirections
              directions={results.analysis.directions}
              selected={selectedDirections}
              onToggle={focusOn}
            />
          )}

          <div className="results-head">
            <h2>{results.families.length} linguistic species discovered</h2>
            <span className="muted">
              {results.families.reduce((n, f) => n + f.words.length, 0)} native words
              {refining && <span className="refining"> · writing meanings…</span>}
            </span>
          </div>

          <LanguageTree families={results.families} onPick={scrollToWord} />

          {results.families.map((fam) => (
            <LanguageSection
              fam={fam}
              key={fam.id}
              savedWords={savedKeys}
              onToggleSave={toggleSave}
              onRequestUsage={usedLLM ? requestUsage : undefined}
            />
          ))}
        </section>
      )}

      <footer className="footer">
        Word Laboratory understands your meaning first, then invents the languages and words
        to carry it — every word synthesised from a measurable genome, never copied from a
        dictionary.
        <br />
        Meaning → Concept → Language Discovery → Word Evolution → Word.
        <br />
        <span className="build" title="Changes on every deploy — refresh to see if a new build is live">
          v{__APP_VERSION__} · build {__BUILD_SHA__} · {__BUILD_TIME__} UTC
        </span>
      </footer>
    </div>
  )
}
