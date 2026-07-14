import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  EVOLVE_DIRECTIONS,
  evolveWord,
  Rng,
  hashSeed,
  SURVIVOR_FLOOR,
  type EmotionalAxis,
  type WordPassport,
  type WordEvolutionStep,
} from '../engine'
import { fetchCollision, type CollisionResult } from '../lib/collision'
import { loadNote, saveNote } from '../lib/notes'
import { BackIcon, HeartIcon, SoundIcon } from './icons'
import { Placeholder } from './Placeholder'

const DNA_ORDER: EmotionalAxis[] = [
  'premium', 'scientific', 'elegant', 'trustworthy', 'creative', 'natural',
  'futuristic', 'warm', 'minimal', 'powerful', 'energetic', 'mystical',
  'playful', 'aggressive',
]

const TABS = ['Usage', 'Meaning', 'Evolution', 'Genome', 'Translations', 'Notes'] as const
type Tab = (typeof TABS)[number]

/**
 * A discovered word opens not as a card but as a full page — the way a museum
 * gives one object its own room. A quiet oversized title, pronunciation and a
 * one-line reading up top; the deep material (usage, meaning, evolution, genome,
 * translations, notes) organised behind tabs; a held space for a future
 * illustration on the right (500×700 placeholder).
 */
export function WordDetail({
  p,
  brief,
  saved,
  onToggleSave,
  onBack,
  onRequestUsage,
  onOpenRelated,
}: {
  p: WordPassport
  brief: string
  saved: boolean
  onToggleSave: () => void
  onBack: () => void
  onRequestUsage?: () => Promise<void>
  onOpenRelated?: (word: string) => void
}) {
  const [tab, setTab] = useState<Tab>('Usage')
  const hasUsage = p.usage.en.length > 0 || p.usage.ru.length > 0

  useEffect(() => {
    // Opening a different word resets to the first tab and scrolls to top.
    setTab('Usage')
    document.querySelector('.worddetail')?.scrollTo?.({ top: 0 })
  }, [p.word])

  function speak() {
    try {
      const u = new SpeechSynthesisUtterance(p.word)
      u.rate = 0.9
      window.speechSynthesis?.cancel()
      window.speechSynthesis?.speak(u)
    } catch {
      /* speech synthesis unavailable — silent no-op */
    }
  }

  return (
    <div className="worddetail">
      <button type="button" className="wd-back" onClick={onBack}>
        <BackIcon className="btn-ico" /> Back to discoveries
      </button>

      <div className="wd-layout">
        <div className="wd-main">
          <header className="wd-head">
            <div className="wd-titlerow">
              <h1 className="wd-title">{p.word}</h1>
              <button
                type="button"
                className={`wd-save ${saved ? 'on' : ''}`}
                onClick={onToggleSave}
                aria-pressed={saved}
              >
                <HeartIcon filled={saved} /> {saved ? 'Saved' : 'Save'}
              </button>
            </div>
            <div className="wd-pron">
              {p.pronunciationGuide && <span className="wd-say">[{p.pronunciationGuide}]</span>}
              {p.partOfSpeech && <span className="wd-pos">{p.partOfSpeech}</span>}
              <button type="button" className="wd-speak" onClick={speak} title="Hear it">
                <SoundIcon />
              </button>
            </div>
            <p className="wd-lede">{p.meaning}</p>
            <div className="wd-badges">
              <span
                className={`disc disc-${p.discovery.classification.toLowerCase()}`}
                title="Lexical Discovery Score — computed from weighted components against real thresholds, not enthusiasm"
              >
                {p.discovery.classification} · {p.discovery.score}/100
              </span>
              <span className={`speak speak-${p.speakability.toLowerCase()}`}>{p.speakability}</span>
              <span className="wd-origin-species">{p.construction.species}</span>
            </div>
            {onOpenRelated &&
              (['semantic', 'phonetic'] as const).map((cls) => {
                const rels = p.relations.filter((r) => r.relationClass === cls)
                if (rels.length === 0) return null
                return (
                  <div className="wd-related" key={cls}>
                    <span className="wd-related-label">
                      {cls === 'semantic' ? 'Related in meaning' : 'Related in sound'}
                    </span>
                    {rels.map((r) => (
                      <button
                        type="button"
                        key={r.word}
                        className="rel-chip"
                        title={`${r.kind} — ${r.note} · ${r.language}`}
                        onClick={() => onOpenRelated(r.word)}
                      >
                        {r.word}
                        <span className="rel-kind">{r.kind}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
          </header>

          <nav className="wd-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`wd-tab ${tab === t ? 'on' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="wd-panel">
            {tab === 'Usage' && (
              <UsageTab p={p} hasUsage={hasUsage} onRequestUsage={onRequestUsage} />
            )}
            {tab === 'Meaning' && <MeaningTab p={p} />}
            {tab === 'Evolution' && <EvolutionTab p={p} saved={saved} />}
            {tab === 'Genome' && <GenomeTab p={p} />}
            {tab === 'Translations' && <TranslationsTab p={p} />}
            {tab === 'Notes' && <NotesTab p={p} brief={brief} />}
          </div>
        </div>

        <div className="wd-aside">
          <Placeholder width={500} height={700} title="Future Illustration" note="crystal · symbol · visual meaning" />
        </div>
      </div>
    </div>
  )
}

/* ── Tabs ──────────────────────────────────────────────────────────────── */

function UsageTab({
  p,
  hasUsage,
  onRequestUsage,
}: {
  p: WordPassport
  hasUsage: boolean
  onRequestUsage?: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  async function load() {
    if (!onRequestUsage) return
    setLoading(true)
    try {
      await onRequestUsage()
    } finally {
      setLoading(false)
    }
  }
  return (
    <section className="tabsec">
      <p className="tabsec-lead">How the word sits inside a real sentence — the proof it can enter speech.</p>
      {hasUsage ? (
        <div className="usage-cols">
          <div className="usage-col">
            <span className="usage-lang">In English</span>
            <ul>
              {p.usage.en.map((s, i) => (
                <li key={`en-${i}`}>{highlight(s, p.word)}</li>
              ))}
            </ul>
          </div>
          {p.usage.ru.length > 0 && (
            <div className="usage-col">
              <span className="usage-lang">In Russian</span>
              <ul>
                {p.usage.ru.map((s, i) => (
                  <li key={`ru-${i}`}>{highlight(s, p.transliteration)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : onRequestUsage ? (
        <button type="button" className="btn ghost" disabled={loading} onClick={load}>
          {loading ? 'Writing sentences…' : 'Show it in a sentence (AI)'}
        </button>
      ) : (
        <p className="tabsec-muted">
          Example sentences are written by AI on request — enable AI to see “{p.word}” used in English and Russian.
        </p>
      )}
      <div className="adopt">
        <div className="adopt-head">
          <h4>Speech adoption</h4>
          <span className={`band band-${p.adoption.band.toLowerCase()}`}>
            {p.adoption.band} · {p.adoption.score}/100
          </span>
        </div>
        <div className="adopt-components">
          {p.adoption.components.map((c) => (
            <div className="adopt-row" key={c.label}>
              <span className="adopt-name">{c.label}</span>
              <span className="adopt-bar"><i style={{ width: `${(c.score / c.max) * 100}%` }} /></span>
              <span className="adopt-val">{c.score}/{c.max}</span>
            </div>
          ))}
        </div>
        {p.adoption.strengths.length > 0 && (
          <ul className="adopt-list good">{p.adoption.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        )}
        {p.adoption.risks.length > 0 && (
          <ul className="adopt-list risk">{p.adoption.risks.map((r) => <li key={r}>{r}</li>)}</ul>
        )}
        <p className="tabsec-muted">
          A rule-based read of the sound — not an external brand, drug or trademark check.
        </p>
      </div>
    </section>
  )
}

function MeaningTab({ p }: { p: WordPassport }) {
  return (
    <section className="tabsec">
      <div className="meaning-lead">
        <p className="meaning-quote">“{p.meaning}”</p>
        {p.shortMeaning && <p className="meaning-short">{p.shortMeaning}</p>}
      </div>

      <div className="tabgrid">
        <div className="tabcard">
          <h4>Why it exists</h4>
          <p>{p.explanation}</p>
        </div>
        <div className="tabcard">
          <h4>Origin story</h4>
          <p>{p.story}</p>
        </div>
      </div>

      <div className="build">
        <h4>How this word was made</h4>
        <div className="build-syl">
          {p.construction.syllables.map((s, i) => (
            <span className="syl-chunk" key={i}>
              {s}
              {i < p.construction.syllables.length - 1 && <span className="syl-dot" aria-hidden>·</span>}
            </span>
          ))}
        </div>
        <div className="build-ideas">
          <span className="build-key">grown around</span>
          {p.construction.ideas.map((idea) => (
            <span className="build-idea" key={idea.label}>
              <b>{idea.label}</b> — {idea.gloss}
            </span>
          ))}
        </div>
        <p className="build-species">
          <span className="build-key">species</span>
          {p.construction.species} · sound influenced by {p.construction.families.join(', ')}
        </p>
        <p className="tabsec-muted">{p.construction.note}</p>
      </div>

      {p.etymology.plausible && (
        <div className="etym">
          <h4>Imagined lineage <span className="etym-tag">constructed</span></h4>
          <div className="etym-chain">
            {p.etymology.stages.map((s, i) => (
              <span className="etym-stage" key={i}>
                {i > 0 && <span className="etym-arrow" aria-hidden>→</span>}
                <span className="etym-form">
                  <b>{s.form}</b>
                  <span className="etym-era">{s.era}</span>
                </span>
              </span>
            ))}
          </div>
          <ul className="etym-notes">
            {p.etymology.stages
              .filter((s) => s.note)
              .map((s, i) => (
                <li key={i}>
                  <b>{s.form}</b> — {s.note} {s.reason && <span className="etym-reason">· {s.reason}</span>}
                </li>
              ))}
          </ul>
          <p className="tabsec-muted">{p.etymology.summary}</p>
        </div>
      )}

      <div className="family">
        <h4>Word family</h4>
        {p.paradigm.forms.length > 0 ? (
          <>
            <p className="tabsec-lead">The root bent into the roles that sound natural. Forced forms are rejected, not shown as real.</p>
            <div className="family-grid">
              <div className="family-form">
                <span className="family-role">noun</span>
                <b className="family-word">{p.paradigm.root}</b>
                <span className="family-gloss">{p.meaning.replace(/\s*\(.*$/, '').trim()}</span>
              </div>
              {p.paradigm.forms.map((f) => (
                <div className="family-form" key={f.role}>
                  <span className="family-role">{f.role}</span>
                  <b className="family-word">{f.form}</b>
                  <span className="family-gloss">{f.gloss}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="tabsec-lead">This word stays <b>noun-only</b> — no derivation sounded natural enough to recommend.</p>
        )}
        {p.paradigm.rejected.length > 0 && (
          <ul className="family-rejected">
            {p.paradigm.rejected.map((r) => (
              <li key={r.role}>
                <s>{r.form}</s> — {r.reason}
              </li>
            ))}
          </ul>
        )}
        <p className="tabsec-muted">
          Invented morphology — the coined root inflected the way English derives words. Not a
          grammar of the invented sound-world.
        </p>
      </div>

      <div className="origin-note">{p.ancestry.note}</div>
    </section>
  )
}

function EvolutionTab({ p, saved }: { p: WordPassport; saved: boolean }) {
  const [lineage, setLineage] = useState<WordEvolutionStep[]>([])
  useEffect(() => setLineage([]), [p.word])
  const tip = lineage.length ? lineage[lineage.length - 1].passport : p
  function evolveBy(dirId: string) {
    const step = evolveWord(tip, dirId, new Rng(hashSeed(`${tip.word}|${dirId}|${lineage.length}`)))
    setLineage((prev) => [...prev, step])
  }
  const e = p.evolution
  return (
    <section className="tabsec">
      <div className="fitprofile">
        <div className="fitprofile-head">
          <h4>Fitness profile</h4>
          <span className="fitprofile-sig">
            signature: <b>{p.fitness.strongest}</b> · weakest: {p.fitness.weakest}
          </span>
        </div>
        <div className="fitrows">
          {p.fitness.axes.map((a) => (
            <div className="fitrow" key={a.key} title={a.note}>
              <span className="fitname">{a.label}</span>
              <span className={`fitband fitband-${a.band.toLowerCase()}`}>{a.band}</span>
            </div>
          ))}
        </div>
        <p className="tabsec-muted">{SURVIVOR_FLOOR}</p>
      </div>

      <div className="phon">
        <div className="phon-head">
          <h4>Sound ↔ meaning</h4>
          <span className={`phon-band phon-${p.phonology.band.toLowerCase()}`}>
            {p.phonology.band} · {Math.round(p.phonology.congruence * 100)}
          </span>
        </div>
        <p className="phon-explain">{p.phonology.explanation}</p>
        <div className="phon-axes">
          {(['hardness', 'depth', 'clip', 'openness'] as const).map((k) => (
            <div className="phon-axis" key={k}>
              <span className="phon-name">{k}</span>
              <span className="phon-track">
                <i className="phon-want" style={{ left: `${p.phonology.intended[k] * 100}%` }} title="intended" />
                <i className="phon-got" style={{ left: `${p.phonology.observed[k] * 100}%` }} title="observed" />
              </span>
            </div>
          ))}
        </div>
        <p className="tabsec-muted">
          Intended (○) vs observed (●). A modeled judgement of sound symbolism, not a universal law.
        </p>
      </div>

      <p className="tabsec-lead">Reshape how the word sounds — the meaning stays verbatim. Free, no AI.</p>
      <div className="evolve-chips">
        {EVOLVE_DIRECTIONS.map((d) => (
          <button type="button" key={d.id} className="chip" onClick={() => evolveBy(d.id)}>
            {d.label}
          </button>
        ))}
        {lineage.length > 0 && (
          <button type="button" className="chip clear" onClick={() => setLineage([])}>
            Reset
          </button>
        )}
      </div>

      {lineage.length > 0 && (
        <div className="lineage">
          <div className="lineage-chain">
            <span className="lin-orig">{p.word}</span>
            {lineage.map((s, i) => (
              <span className="lin-step" key={i}>
                <span className="lin-arrow" aria-hidden>→</span>
                <span className="lin-word">{s.passport.word}</span>
              </span>
            ))}
          </div>
          {lineage.map((s, i) => (
            <div className="evolved" key={i}>
              <div className="evolved-top">
                <span className="evolved-word">{s.passport.word}</span>
                <span className="wcard-say">{s.passport.pronunciationGuide}</span>
                <span className="wcard-translit">{s.passport.transliteration}</span>
              </div>
              <div className="evolved-meta">
                <span className="evolved-dir">{s.directionLabel}</span>
                <span>concept preserved: <b>{s.conceptPreservation}</b></span>
                <span className={`band band-${s.passport.adoption.band.toLowerCase()}`}>
                  {s.passport.adoption.band}
                </span>
              </div>
              <div className="evolved-changes">{s.changes.join(' · ')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="wg" style={{ marginTop: 22 }}>
        <div className="wg-cell"><span>Parent language</span><b>{e.parentLanguage}</b></div>
        <div className="wg-cell"><span>Generation</span><b>{e.generation}</b></div>
        <div className="wg-cell"><span>Mutation</span><b>{e.mutation}%</b></div>
        <div className="wg-cell"><span>Evolution distance</span><b>{e.evolutionDistance.toFixed(2)}</b></div>
      </div>
      {!saved && <p className="tabsec-muted">Tip: save this word first if you want to keep an evolved form alongside it.</p>}
    </section>
  )
}

function GenomeTab({ p }: { p: WordPassport }) {
  const [collision, setCollision] = useState<CollisionResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [failed, setFailed] = useState(false)
  const topDNA = DNA_ORDER.filter((axis) => p.emotionalDNA[axis] >= 8).slice(0, 8)
  const e = p.evolution
  async function check() {
    setChecking(true)
    setFailed(false)
    try {
      const r = await fetchCollision(p.word)
      if (r) setCollision(r)
      else setFailed(true)
    } finally {
      setChecking(false)
    }
  }
  const d = p.discovery
  const dv = p.dictionaryViability
  return (
    <section className="tabsec">
      <div className="disc-block">
        <div className="disc-head">
          <div>
            <span className={`disc disc-${d.classification.toLowerCase()}`}>{d.classification}</span>
            <span className="disc-score">{d.score}<span className="disc-of">/100</span></span>
          </div>
          <span className="disc-label">Lexical Discovery Score</span>
        </div>
        <div className="disc-components">
          {d.components.map((c) => (
            <div className="disc-row" key={c.label}>
              <span className="disc-name">{c.label}</span>
              <span className="disc-bar"><i style={{ width: `${c.score}%` }} /></span>
              <span className="disc-val">{c.score}</span>
              <span className="disc-wt">×{Math.round(c.weight * 100)}%</span>
            </div>
          ))}
        </div>
        {d.penalties.length > 0 && (
          <ul className="disc-penalties">{d.penalties.map((x) => <li key={x}>{x}</li>)}</ul>
        )}
        <p className="tabsec-muted">
          Computed from explicit weighted components — not enthusiasm. Dictionary viability:{' '}
          <b>{dv.band}</b> ({Math.round(dv.overall * 100)}/100) · adoption friction: {dv.adoptionFriction}.
          Collision safety is a structural prior, not a verified external check.
        </p>
      </div>

      <div className="tabgrid">
        <div className="tabcard">
          <h4>Word Genome</h4>
          <div className="wg">
            <div className="wg-cell"><span>Visual balance</span><b>{e.visualBalance}</b></div>
            <div className="wg-cell"><span>Structural originality</span><b>{e.originality}</b></div>
            <div className="wg-cell"><span>Memorability</span><b>{e.memorability}</b></div>
            <div className="wg-cell"><span>Phonetic stability</span><b>{e.phoneticStability}</b></div>
            <div className="wg-cell"><span>Syllables</span><b>{p.genome.syllables}</b></div>
            <div className="wg-cell"><span>Pronounceability</span><b>{pct(p.genome.pronounceability)}</b></div>
            <div className="wg-cell"><span>Rhythm</span><b>{pct(p.genome.rhythm)}</b></div>
            <div className="wg-cell"><span>Vowel ratio</span><b>{pct(p.genome.vowelRatio)}</b></div>
          </div>
        </div>
        <div className="tabcard">
          <h4>Emotional DNA</h4>
          {topDNA.map((axis) => (
            <div className="dna-row" key={axis}>
              <span className="name">{axis}</span>
              <span className="bar"><i style={{ width: `${p.emotionalDNA[axis]}%` }} /></span>
              <span className="val">{p.emotionalDNA[axis]}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tabgrid">
        <div className="tabcard">
          <h4>Personality</h4>
          <div className="tags">
            {p.personality.map((t) => <span className="t" key={t}>{t}</span>)}
          </div>
          <h4 style={{ marginTop: 18 }}>Brand fit</h4>
          <p className="fit-line"><span className="k">Excellent for:</span> {p.brandFit.excellentFor.join(', ')}</p>
          <p className="fit-line"><span className="k bad">Poor fit:</span> {p.brandFit.poorFit.join(', ')}</p>
        </div>
        <div className="tabcard">
          <h4>Collision status: {collision ? 'Partly checked' : p.collisionReport.status}</h4>
          <div className="collide-layers">
            <CollisionLayer label="Internal dictionary" value={p.collisionReport.internalDictionary} />
            <CollisionLayer label="Phonetic (sounds-like)" value={p.collisionReport.phonetic} />
            <CollisionLayer label="Short-word prior" value={p.collisionReport.shortWordRisk} />
            <CollisionLayer
              label="Proper names"
              value={collision ? 'not_checked' : p.collisionReport.properName}
            />
            <CollisionLayer
              label="Dictionary (live)"
              value={collision ? (collision.dictionary.isWord ? 'exact' : 'clear') : 'not_checked'}
            />
            <CollisionLayer label="Brand / company" value="not_checked" />
            <CollisionLayer
              label="Domains"
              value={collision ? (collision.domains.some((d) => d.status === 'taken') ? 'taken' : 'some free') : 'not_checked'}
            />
            <CollisionLayer label="Trademark" value="not_checked" />
            <CollisionLayer label="Other languages" value="not_checked" />
          </div>
          {collision?.dictionary.definition && <div className="collide-def">“{collision.dictionary.definition}”</div>}
          {collision && (
            <div className="collide-domains">
              {collision.domains.map((d) => (
                <span key={d.tld} className={`dom dom-${d.status}`}>.{d.tld} · {d.status}</span>
              ))}
            </div>
          )}
          {!collision && (
            <button type="button" className="btn ghost sm" disabled={checking} onClick={check}>
              {checking ? 'Checking…' : 'Run live dictionary & domain check'}
            </button>
          )}
          {failed && !collision && <p className="tabsec-muted">Live check unavailable right now — try again shortly.</p>}
          <p className="tabsec-muted">
            Confidence: {p.collisionReport.confidence}. {p.collisionReport.summary}
          </p>
          <div className="brandsafe-block">
            <div className="brandsafe-head">
              <h4>Brand safety</h4>
              <span className={`brandsafe brandsafe-${p.brandSafety.band.toLowerCase()}`}>
                {p.brandSafety.band} · {p.brandSafety.score}
              </span>
            </div>
            {p.brandSafety.strengths.length > 0 && (
              <ul className="brandsafe-list good">{p.brandSafety.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            )}
            {p.brandSafety.warnings.length > 0 && (
              <ul className="brandsafe-list risk">{p.brandSafety.warnings.map((s) => <li key={s}>{s}</li>)}</ul>
            )}
            <p className="tabsec-muted">Collision-aware — "Strong" clears every check we can run offline, not a trademark clearance.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function TranslationsTab({ p }: { p: WordPassport }) {
  return (
    <section className="tabsec">
      <p className="tabsec-lead">The same word, ready to live inside other languages.</p>
      <div className="translit-hero">
        <div className="translit-pair">
          <span className="translit-lang">Latin</span>
          <span className="translit-word">{p.word}</span>
        </div>
        <span className="translit-arrow" aria-hidden>→</span>
        <div className="translit-pair">
          <span className="translit-lang">Cyrillic</span>
          <span className="translit-word">{p.transliteration}</span>
        </div>
      </div>
      <div className="tabcard">
        <h4>Pronounceability across languages</h4>
        <div className="pron">
          {p.pronunciation.map((r) => (
            <div className="p" key={r.language}>
              <span>{r.language}</span>
              <span className="stars" aria-label={`${r.stars} of 5`}>
                {'★'.repeat(r.stars)}<span className="off">{'★'.repeat(5 - r.stars)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      {p.difficulty.length > 0 && (
        <div className="tabcard">
          <h4>Where it is harder to say</h4>
          <div className="tags">{p.difficulty.map((d) => <span className="t" key={d}>{d}</span>)}</div>
        </div>
      )}
    </section>
  )
}

function NotesTab({ p, brief }: { p: WordPassport; brief: string }) {
  const initial = useMemo(() => loadNote(p.word, brief), [p.word, brief])
  const [note, setNote] = useState(initial)
  const [savedFlash, setSavedFlash] = useState(false)
  useEffect(() => setNote(loadNote(p.word, brief)), [p.word, brief])
  function persist() {
    saveNote(p.word, brief, note)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1400)
  }
  return (
    <section className="tabsec">
      <p className="tabsec-lead">Keep your own reading of this word — what it means to you, where you'd use it.</p>
      <textarea
        className="notes-area"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={persist}
        placeholder="A private note about this word — stays on this device."
        rows={7}
      />
      <div className="notes-foot">
        <button type="button" className="btn ghost sm" onClick={persist}>Save note</button>
        {savedFlash && <span className="notes-saved">Saved</span>}
      </div>
    </section>
  )
}

/* ── helpers ───────────────────────────────────────────────────────────── */

/** One row of the layered collision report — a check and its honest status. */
function CollisionLayer({ label, value }: { label: string; value: string }) {
  const checked = value !== 'not_checked'
  const risky = ['exact', 'near', 'high', 'taken'].includes(value)
  const tone = !checked ? 'unchecked' : risky ? 'risk' : 'ok'
  return (
    <div className={`collide-layer collide-${tone}`}>
      <span className="collide-key">{label}</span>
      <span className="collide-status">{checked ? value.replace('_', ' ') : 'not checked'}</span>
    </div>
  )
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

function highlight(sentence: string, word: string): ReactNode {
  const stem = word.trim().slice(0, Math.max(3, word.trim().length - 2))
  if (!stem) return sentence
  const parts = sentence.split(new RegExp(`(${escapeRe(stem)}\\p{L}*)`, 'giu'))
  return parts.map((part, i) =>
    part.toLowerCase().startsWith(stem.toLowerCase()) && part.length >= stem.length ? (
      <b className="coined" key={i}>{part}</b>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
