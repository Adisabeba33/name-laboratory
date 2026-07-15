import { useMemo, useRef, useState } from 'react'
import {
  runLaboratory,
  discoverFromAnalysis,
  focusConcepts,
  detectTargetType,
  MODES,
  DEFAULT_SPEAKABILITY,
  type CreativeMode,
  type LaboratoryResult,
  type WordFamily,
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
import { fetchSemanticGap, hasCachedGap, type SemanticGapResult } from './lib/semantic-search'
import { SemanticGap } from './components/SemanticGap'
import { buildReport } from './lib/report'
import { InterpretationPanel } from './components/InterpretationPanel'
import { ConceptDirections } from './components/ConceptDirections'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { Hero } from './components/Hero'
import { StepFlow } from './components/StepFlow'
import { EvolutionLoader } from './components/EvolutionLoader'
import { DiscoverInput } from './components/DiscoverInput'
import { LexiconRail } from './components/LexiconRail'
import { WordCard } from './components/WordCard'
import { WordDetail } from './components/WordDetail'
import { LanguagesView, LexiconView, RoomView } from './components/views'
import type { ViewKey } from './components/nav'

const MODE_KEYS = Object.keys(MODES) as CreativeMode[]

/** Tier ordering, so a gap-drift demotion can only ever lower a classification. */
const CLASS_ORDER: Record<string, number> = {
  Rejected: 0, Weak: 1, Experimental: 2, Viable: 3, Strong: 4, Exceptional: 5,
}

/** The two things the lab does: name a meaning, or name a thing. */
type AppMode = 'discover' | 'name'

/** Per-mode copy so the one input reads right for what the user is doing. */
const MODE_COPY: Record<AppMode, {
  tab: string
  label: string
  placeholder: string
  button: string
  examples: string[]
}> = {
  discover: {
    tab: 'Discover a meaning',
    label: 'Describe the meaning you want to uncover',
    placeholder:
      'e.g. the feeling of becoming someone completely different after surviving something that should have destroyed you',
    button: 'Discover words',
    examples: [
      'the quiet joy of returning home after a long time away',
      'the smell of rain on warm dust after a dry summer',
      'a perfect moment ending while you are still inside it',
      'becoming someone new after surviving what should have destroyed you',
    ],
  },
  name: {
    tab: 'Name something',
    label: 'What are you naming?',
    placeholder:
      'e.g. a calm, premium AI company for medicine — or an unusual name for a newborn daughter',
    button: 'Discover names',
    examples: [
      'a calm, premium AI company for medicine',
      'a cozy independent bookstore and coffee house',
      'a bold sportswear brand for climbers',
      'a gentle, luminous name for a newborn daughter',
    ],
  },
}

export default function App() {
  const [view, setView] = useState<ViewKey>('discover')
  const [appMode, setAppMode] = useState<AppMode>('discover')
  const [brief, setBrief] = useState('')
  // Advanced-only controls — most people never open them.
  const [mode, setMode] = useState<CreativeMode>('timeless')
  const [count, setCount] = useState(6)
  const [speakability, setSpeakability] = useState(DEFAULT_SPEAKABILITY)
  const [extra, setExtra] = useState('')

  const [results, setResults] = useState<LaboratoryResult | null>(null)
  const [nonce, setNonce] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [refining, setRefining] = useState(false)
  const [steering, setSteering] = useState(false)
  const [usedLLM, setUsedLLM] = useState(false)
  // True when the bespoke-meanings pass could not run this session — the words
  // fall back to the engine's own definitions and the fidelity gate never fires,
  // so we surface it honestly instead of crowning an unverified winner.
  const [meaningsOutage, setMeaningsOutage] = useState(false)
  const [selectedDirections, setSelectedDirections] = useState<string[]>([])
  const [openWord, setOpenWord] = useState<WordPassport | null>(null)
  // Semantic Gap Search — "does a word already exist for this?" (LLM, discover mode).
  const [gap, setGap] = useState<SemanticGapResult | null>(null)
  const [gapLoading, setGapLoading] = useState(false)
  const [reportCopied, setReportCopied] = useState(false)
  // Cost control: every LLM call must be confirmed. `llmAllowed` is the
  // "don't ask again this session" escape; `confirm` drives the dialog.
  const [llmAllowed, setLlmAllowed] = useState(false)
  const [confirm, setConfirm] = useState<{ message: string; resolve: (ok: boolean) => void } | null>(
    null,
  )
  // My Lexicon — the user's saved words, persisted on-device (localStorage).
  const [lexicon, setLexicon] = useState<LexEntry[]>(() => loadLexicon())
  const runId = useRef(0)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<HTMLDivElement>(null)

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
          lens: f.lens,
        })),
      )
      const tt = detectTargetType(trimmed)
      const context = {
        interpretation: result.analysis.interpretation,
        target: { headType: tt.headType, mechanism: tt.mechanism },
      }
      // One retry before giving up — the usual failure is a 60s timeout writing
      // ~18 bilingual definitions, which a second attempt often clears.
      let map = await fetchBespokeMeanings(trimmed, items, context)
      if (!map && runId.current === myRun) map = await fetchBespokeMeanings(trimmed, items, context)
      if (runId.current !== myRun) return

      if (!map) {
        // Outage (Morutho §3/§6): the meanings pass never ran, so A never anchored
        // and the B fidelity gate can't fire. Keep the engine's own definitions, but
        // DON'T let its acoustic-top word wear an unearned "Exceptional" crown — a
        // winner is only credible once its meaning has been verified against the gap.
        setMeaningsOutage(true)
        setResults({
          ...result,
          families: result.families.map((f) => ({
            ...f,
            words: f.words.map((w) => {
              if (w.discovery.classification !== 'Exceptional') return w
              const penalties = [...w.discovery.penalties]
              if (!penalties.some((p) => p.includes('not verified'))) {
                penalties.push('Meaning not verified — bespoke meanings unavailable this run.')
              }
              return { ...w, discovery: { ...w.discovery, classification: 'Strong', penalties } }
            }),
          })),
        })
        return
      }

      setMeaningsOutage(false)
      if (runId.current === myRun) {
        // Safety net (Morutho §3/§6): re-decide Top Discovery from the WRITTEN
        // meanings. The winner is the strongest DIRECT word that actually names the
        // gap (gapFidelity ≥ 0.8); a word whose meaning drifts is demoted so beauty
        // can't crown an off-meaning word. If none qualifies, there is no winner.
        const gf = (w: WordPassport) => map.get(w.word.toLowerCase())?.gapFidelity ?? 1
        const winner = result.families
          .filter((f) => f.direct)
          .flatMap((f) => f.words)
          .filter((w) => gf(w) >= 0.8)
          .sort((a, b) => b.discovery.score - a.discovery.score)[0]
        const winnerKey = winner?.word.toLowerCase()

        setResults({
          ...result,
          families: result.families.map((f) => ({
            ...f,
            words: f.words.map((w) => {
              const m = map.get(w.word.toLowerCase())
              let word = m
                ? {
                    ...w,
                    meaning: `${m.en} (${m.ru})`,
                    shortMeaning: m.short || w.shortMeaning,
                    partOfSpeech: m.pos || w.partOfSpeech,
                  }
                : w
              const key = w.word.toLowerCase()
              const fid = m?.gapFidelity ?? 1
              let cls = word.discovery.classification
              const penalties = [...word.discovery.penalties]
              if (key === winnerKey) cls = 'Exceptional'
              else if (cls === 'Exceptional') cls = 'Strong' // engine-top, but not the gap-top
              if (fid < 0.45 && cls !== 'Rejected' && CLASS_ORDER[cls] > CLASS_ORDER.Experimental) {
                cls = 'Experimental'
                if (!penalties.some((p) => p.includes('requested meaning'))) {
                  penalties.push('Drifts from the requested meaning.')
                }
              }
              if (cls !== word.discovery.classification || penalties.length !== word.discovery.penalties.length) {
                word = { ...word, discovery: { ...word.discovery, classification: cls, penalties } }
              }
              return word
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
    setOpenWord(null)
    setMeaningsOutage(false)
    if (!reseed && !steer) setGap(null) // a fresh meaning restarts the vocabulary search
    const seed = reseed ? Math.floor(Math.random() * 1e9) : undefined
    const request = { brief: trimmed || undefined, keywords, mode, count, speakability, seed, brandMode: appMode === 'name' }
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
          : await analyzeRemote(analysisBrief, appMode)

      remote = Boolean(analysis)
      // Build immediately with the engine's meanings, so results show fast.
      result = analysis ? discoverFromAnalysis(analysis, request) : runLaboratory(request)
      setResults(result)
      setUsedLLM(remote)
      setNonce((n) => n + 1)
    } finally {
      setAnalyzing(false)
    }

    if (remote) {
      // Reverse-dictionary search runs alongside the word meanings (discover mode
      // only, and not on a reseed/steer of the same meaning). It never blocks the
      // words — it reads *above* them as "did language already have this word?".
      if (appMode === 'discover' && !reseed && !steer) {
        void runGapSearch(trimmed, result.analysis.interpretation, myRun)
      }
      await enrich(result, myRun, trimmed)
    }
    if (runId.current === myRun) setSteering(false)
  }

  /** Search existing vocabulary for the meaning (LLM), then show the gap panel. */
  async function runGapSearch(trimmed: string, interpretation: string, myRun: number) {
    if (!hasCachedGap(trimmed)) setGapLoading(true)
    try {
      const g = await fetchSemanticGap(trimmed, interpretation)
      if (runId.current === myRun) setGap(g)
    } finally {
      if (runId.current === myRun) setGapLoading(false)
    }
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
    const request = { brief: trimmed || undefined, keywords, mode, count, speakability }
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
    const apply = (w: WordPassport): WordPassport =>
      w.word === p.word ? { ...w, usage: { en: usage.en, ru: usage.ru } } : w
    setResults((prev) =>
      prev
        ? {
            ...prev,
            families: prev.families.map((f) => ({ ...f, words: f.words.map(apply) })),
          }
        : prev,
    )
    // Keep the open full-page word in sync too.
    setOpenWord((prev) => (prev ? apply(prev) : prev))
  }

  /**
   * Build a plain-text report of the whole run and copy it to the clipboard (plus
   * offer a .md download) — one shareable document instead of many screenshots.
   */
  async function copyReport() {
    if (!results) return
    const text = buildReport({
      brief: brief.trim(),
      results,
      gap,
      usedLLM,
      meaningsOutage,
      version: __APP_VERSION__,
      stamp: new Date().toISOString(),
    })
    try {
      await navigator.clipboard.writeText(text)
      setReportCopied(true)
      window.setTimeout(() => setReportCopied(false), 2200)
    } catch {
      // Clipboard blocked — fall through to the download below.
    }
    // Also drop a file, so it can be saved/forwarded even where clipboard is denied.
    try {
      const blob = new Blob([text], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `word-lab-report.md`
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch {
      /* ignore */
    }
  }

  /** Navigate to the discovery workspace and scroll it into view. */
  function goDiscover() {
    setView('discover')
    setOpenWord(null)
    window.requestAnimationFrame(() =>
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  /** Open a saved lexicon word: reuse the live passport if it's in the current
   *  results, otherwise take the user back to re-discover its concept. */
  function openLexEntry(e: LexEntry) {
    const match = results?.families.flatMap((f) => f.words).find((w) => w.word === e.word)
    if (match && e.brief === brief.trim()) {
      setView('discover')
      setOpenWord(match)
      return
    }
    setBrief(e.brief)
    setView('discover')
  }

  const copy = MODE_COPY[appMode]
  const allWords = results?.families.flatMap((f) => f.words) ?? []
  const stage = analyzing ? 'concept' : results ? 'word' : brief.trim() ? 'meaning' : 'idea'

  /** One language's card — its words, or its refusal note (v0.36 grouping). */
  const renderFamily = (fam: WordFamily) =>
    fam.refusal ? (
      <div className="langgroup refused" key={fam.id}>
        <div className="langgroup-head">
          <span className="langgroup-name">{fam.character}</span>
          <span className="langgroup-refuse-tag">declines to translate</span>
        </div>
        <p className="refusal-note">{fam.refusal.reason}</p>
      </div>
    ) : (
      <div className="langgroup" key={fam.id}>
        <div className="langgroup-head">
          <span className="langgroup-name">{fam.character}</span>
          <span className="langgroup-lens" title={fam.lens.question}>
            {fam.lens.role}
          </span>
          <span className="langgroup-feel">{fam.description.split('.')[0]}.</span>
        </div>
        <div className="wgrid">
          {fam.words.map((p) => (
            <WordCard
              key={p.word}
              p={p}
              saved={savedKeys.has(p.word.toLowerCase())}
              onOpen={() => setOpenWord(p)}
              onToggleSave={() => toggleSave(p)}
              showBrand={appMode === 'name'}
            />
          ))}
        </div>
      </div>
    )

  return (
    <div className="shell">
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

      <Sidebar view={view} onNavigate={(v) => { setView(v); setOpenWord(null) }} lexiconCount={lexicon.length} />

      <main className="content">
        {view === 'discover' &&
          (openWord ? (
            <WordDetail
              p={openWord}
              brief={brief.trim()}
              saved={savedKeys.has(openWord.word.toLowerCase())}
              onToggleSave={() => toggleSave(openWord)}
              onBack={() => setOpenWord(null)}
              onRequestUsage={usedLLM ? () => requestUsage(openWord, openWord.family.name) : undefined}
              onOpenRelated={(word) => {
                const match = results?.families.flatMap((f) => f.words).find((w) => w.word === word)
                if (match) {
                  setOpenWord(match)
                  document.querySelector('.worddetail')?.scrollTo?.({ top: 0 })
                }
              }}
            />
          ) : (
            <div className="discover">
              {!results && <Hero onDiscover={goDiscover} onLearnMore={goDiscover} />}

              <div className="workspace" ref={workspaceRef}>
                <div className="workspace-grid">
                  <div className="workspace-left">
                    <div className="app-modes" role="tablist">
                      {(Object.keys(MODE_COPY) as AppMode[]).map((m) => (
                        <button
                          type="button"
                          key={m}
                          role="tab"
                          aria-selected={appMode === m}
                          className={`app-mode ${appMode === m ? 'on' : ''}`}
                          onClick={() => setAppMode(m)}
                        >
                          {MODE_COPY[m].tab}
                        </button>
                      ))}
                    </div>

                    <DiscoverInput
                      mode={appMode}
                      brief={brief}
                      onBrief={setBrief}
                      onRun={() => run(false)}
                      running={analyzing}
                      runLabel={copy.button}
                      label={copy.label}
                      placeholder={copy.placeholder}
                      suggestions={copy.examples}
                      onPick={setBrief}
                    >
                      <details className="advanced">
                        <summary>Advanced options</summary>
                        <div className="advanced-body">
                          <div className="field">
                            <label className="lbl">Creative register</label>
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
                            <label className="lbl" htmlFor="speakability">
                              Word style — {speakability >= 0.66 ? 'Speakable' : speakability >= 0.4 ? 'Balanced' : 'Ornate'}
                            </label>
                            <input
                              id="speakability"
                              type="range"
                              min={0}
                              max={1}
                              step={0.1}
                              value={speakability}
                              onChange={(e) => setSpeakability(Number(e.target.value))}
                            />
                          </div>
                          <div className="field">
                            <label className="lbl" htmlFor="count">How many languages — {count}</label>
                            <input
                              id="count"
                              type="range"
                              min={3}
                              max={8}
                              value={count}
                              onChange={(e) => setCount(Number(e.target.value))}
                            />
                          </div>
                          <div className="field">
                            <label className="lbl" htmlFor="extra">Force specific concepts</label>
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
                    </DiscoverInput>
                  </div>

                  <div className="workspace-center">
                    {analyzing ? <EvolutionLoader /> : <StepFlow active={stage} />}
                  </div>

                  <div className="workspace-right">
                    <LexiconRail entries={lexicon} onOpen={openLexEntry} onViewAll={() => setView('lexicon')} />
                  </div>
                </div>
              </div>

              {results && results.families.length > 0 && (
                <section className="results" key={nonce}>
                  <InterpretationPanel
                    analysis={results.analysis}
                    source={usedLLM ? 'llm' : 'engine'}
                    onSteer={usedLLM ? (label) => run(false, label) : undefined}
                    steering={steering}
                    showTensions={appMode === 'discover'}
                  />

                  {appMode === 'discover' && (gapLoading || gap) && (
                    <SemanticGap
                      result={gap}
                      loading={gapLoading}
                      onDiscover={() =>
                        wordsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    />
                  )}

                  {appMode === 'discover' && results.analysis.directions.length > 0 && (
                    <ConceptDirections
                      directions={results.analysis.directions}
                      selected={selectedDirections}
                      onToggle={focusOn}
                    />
                  )}

                  <div className="results-head" ref={wordsRef}>
                    <div>
                      <h2>{allWords.length} words discovered</h2>
                      <p className="results-sub">
                        across {results.families.filter((f) => !f.refusal).length}{' '}
                        {appMode === 'name' ? 'sound-worlds' : 'living languages'}
                        {results.families.some((f) => f.refusal) && (
                          <span className="results-refused">
                            {' '}· {results.families.filter((f) => f.refusal).length} declined to translate
                          </span>
                        )}
                        {refining && <span className="refining"> · writing meanings…</span>}
                        {meaningsOutage && (
                          <span className="meanings-outage">
                            {' '}· bespoke meanings unavailable — showing the engine’s own definitions
                          </span>
                        )}
                      </p>
                      {results.population.generated > 0 && (
                        <p className="evofunnel" title="The engine bred a population of candidate forms and let selection pressure decide which survived. Every count is real.">
                          <span><b>{results.population.generated.toLocaleString('en-US')}</b> bred</span>
                          <span className="evosep">→</span>
                          <span><b>{results.population.survived.toLocaleString('en-US')}</b> survived</span>
                          <span className="evosep">→</span>
                          <span><b>{results.population.recommended}</b> shipped</span>
                          {results.population.exceptional > 0 && (
                            <>
                              <span className="evosep">→</span>
                              <span className="evoexc"><b>{results.population.exceptional}</b> exceptional</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="results-actions">
                      <button className="btn ghost sm" onClick={copyReport} title="Copy the full run as text + download a .md file">
                        {reportCopied ? 'Copied ✓' : 'Copy report'}
                      </button>
                      <button className="btn ghost sm" onClick={() => run(true)} disabled={analyzing}>
                        Try another set
                      </button>
                    </div>
                  </div>

                  {results.conclusion && (
                    <p className="lab-conclusion">{results.conclusion}</p>
                  )}

                  {(() => {
                    const direct = results.families.filter((f) => f.direct)
                    const adjacent = results.families.filter((f) => !f.direct && !f.refusal)
                    const refused = results.families.filter((f) => f.refusal)
                    return (
                      <>
                        {direct.length > 0 ? (
                          <div className="famsection">
                            <h3 className="famsection-title">Direct discoveries</h3>
                            <p className="famsection-sub">These name the confirmed gap itself.</p>
                            {direct.map(renderFamily)}
                          </div>
                        ) : (
                          <div className="famsection">
                            <p className="famsection-none">
                              No candidate named the gap directly. The laboratory recommends another
                              evolutionary cycle — the discoveries below sit adjacent to the meaning.
                            </p>
                          </div>
                        )}

                        {adjacent.length > 0 && (
                          <div className="famsection">
                            <h3 className="famsection-title">Adjacent discoveries</h3>
                            <p className="famsection-sub">
                              Related angles — the person, the feeling, the aftermath — not the meaning itself.
                            </p>
                            {adjacent.map(renderFamily)}
                          </div>
                        )}

                        {refused.length > 0 && (
                          <div className="famsection">
                            <h3 className="famsection-title">Declined</h3>
                            {refused.map(renderFamily)}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </section>
              )}

              {results && results.families.length === 0 && (
                <div className="view-empty">
                  <p>Nothing cleared the novelty check for that input. Try describing it a little differently.</p>
                </div>
              )}
            </div>
          ))}

        {view === 'lexicon' && (
          <LexiconView
            entries={lexicon}
            onOpen={openLexEntry}
            onRemove={(id) => setLexicon((prev) => removeEntry(prev, id))}
            onDiscover={goDiscover}
          />
        )}
        {view === 'languages' && <LanguagesView />}
        {view === 'collections' && <RoomView room="collections" />}
        {view === 'experiments' && <RoomView room="experiments" />}
        {view === 'settings' && <RoomView room="settings" />}
        {view === 'help' && <RoomView room="help" />}

        <footer className="footer">
          <span>Meaning → Concept → Language → Word → Lexicon.</span>
          <span className="build" title="Changes on every deploy — refresh to see if a new build is live">
            v{__APP_VERSION__} · build {__BUILD_SHA__} · {__BUILD_TIME__} UTC
          </span>
        </footer>
      </main>

      <BottomNav view={view} onNavigate={(v) => { setView(v); setOpenWord(null) }} />
    </div>
  )
}
