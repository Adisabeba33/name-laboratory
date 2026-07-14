import { useState, type ReactNode } from 'react'
import {
  EVOLVE_DIRECTIONS,
  evolveWord,
  Rng,
  hashSeed,
  type EmotionalAxis,
  type WordPassport,
  type WordEvolutionStep,
} from '../engine'
import { fetchCollision, type CollisionResult } from '../lib/collision'

/** The order emotional axes are shown in — most brand-relevant first. */
const DNA_ORDER: EmotionalAxis[] = [
  'premium', 'scientific', 'elegant', 'trustworthy', 'creative', 'natural',
  'futuristic', 'warm', 'minimal', 'powerful', 'energetic', 'mystical',
  'playful', 'aggressive',
]

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} out of 5`}>
      {'★'.repeat(n)}
      <span className="off">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

/**
 * A single "Word Passport" — the vision's core deliverable. The user should
 * always understand *why* the word exists, so meaning, origin, emotional DNA,
 * brand fit, story and explanation are all on the card (the last two tucked into
 * a details disclosure to keep the grid scannable).
 */
export function PassportCard({
  p,
  savedWords,
  onToggleSave,
  onRequestUsage,
}: {
  p: WordPassport
  savedWords?: Set<string>
  onToggleSave?: (p: WordPassport) => void
  onRequestUsage?: () => Promise<void>
}) {
  const topDNA = DNA_ORDER.filter((axis) => p.emotionalDNA[axis] >= 8).slice(0, 8)
  const [lineage, setLineage] = useState<WordEvolutionStep[]>([])
  const [usageLoading, setUsageLoading] = useState(false)
  const [collision, setCollision] = useState<CollisionResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkFailed, setCheckFailed] = useState(false)

  async function runCollisionCheck() {
    setChecking(true)
    setCheckFailed(false)
    try {
      const r = await fetchCollision(p.word)
      if (r) setCollision(r)
      else setCheckFailed(true)
    } finally {
      setChecking(false)
    }
  }

  const hasUsage = p.usage.en.length > 0 || p.usage.ru.length > 0
  async function loadUsage() {
    if (!onRequestUsage) return
    setUsageLoading(true)
    try {
      await onRequestUsage()
    } finally {
      setUsageLoading(false)
    }
  }
  const isSaved = (w: string) => savedWords?.has(w.toLowerCase()) ?? false

  // Evolving acts on the current tip of the lineage (chain multiple times).
  const tip = lineage.length ? lineage[lineage.length - 1].passport : p
  function evolveBy(dirId: string) {
    const step = evolveWord(tip, dirId, new Rng(hashSeed(`${tip.word}|${dirId}|${lineage.length}`)))
    setLineage((prev) => [...prev, step])
  }

  const e = p.evolution
  return (
    <article className="passport" id={`word-${p.word}`}>
      <div className="word-row">
        <div className="word">{p.word}</div>
        <div className="word-actions">
          {onToggleSave && (
            <button
              type="button"
              className={`save-btn ${isSaved(p.word) ? 'on' : ''}`}
              onClick={() => onToggleSave(p)}
              title={isSaved(p.word) ? 'Saved to My Lexicon' : 'Save to My Lexicon'}
            >
              {isSaved(p.word) ? '★ Saved' : '☆ Save'}
            </button>
          )}
          <span className="gen-badge" title="Generation within its language">
            gen {e.generation}
          </span>
        </div>
      </div>
      <div className="word-meta">
        {p.pronunciationGuide && (
          <span className="say" title="How to say it — the stressed syllable is capitalised">
            <span className="say-key">say</span>
            <span className="say-val">{p.pronunciationGuide}</span>
          </span>
        )}
        {p.transliteration && (
          <span className="translit" title="Cyrillic form — how it looks inside Russian">
            {p.transliteration}
          </span>
        )}
        {p.partOfSpeech && <span className="pos">{p.partOfSpeech}</span>}
        <span
          className={`speak speak-${p.speakability.toLowerCase()}`}
          title="How readily this word enters everyday speech (a qualitative band, not a score)"
        >
          {p.speakability}
        </span>
        <span
          className={`nat nat-${p.naturalness.toLowerCase()}`}
          title="How real the word feels — could it already exist in a living human language? (a qualitative band, not a score)"
        >
          {p.naturalness}
        </span>
      </div>
      <div className="meaning-block">
        <span className="meaning-label">Meaning</span>
        <p className="meaning">“{p.meaning}”</p>
        {p.shortMeaning && <p className="short-meaning">{p.shortMeaning}</p>}
      </div>

      {hasUsage ? (
        <div className="sec use">
          <h4>Use in language</h4>
          {p.usage.en.length > 0 && (
            <div className="use-lang">
              <span className="use-tag">EN</span>
              <ul>
                {p.usage.en.map((s, i) => (
                  <li key={`en-${i}`}>{highlight(s, p.word)}</li>
                ))}
              </ul>
            </div>
          )}
          {p.usage.ru.length > 0 && (
            <div className="use-lang">
              <span className="use-tag">RU</span>
              <ul>
                {p.usage.ru.map((s, i) => (
                  <li key={`ru-${i}`}>{highlight(s, p.transliteration)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        onRequestUsage && (
          <div className="sec use">
            <button type="button" className="use-load" disabled={usageLoading} onClick={loadUsage}>
              {usageLoading ? 'Writing sentences…' : 'Show it in a sentence (AI)'}
            </button>
          </div>
        )
      )}

      <div className="origin">{p.ancestry.note}</div>

      <div className="sec build">
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
        <div className="build-species">
          <span className="build-key">species</span>
          <span>
            {p.construction.species} · sound influenced by {p.construction.families.join(', ')}
          </span>
        </div>
        <p className="wg-note">{p.construction.note}</p>
      </div>

      <div className="sec adoption">
        <div className="adoption-head">
          <h4>Speech Adoption</h4>
          <span className={`adopt-band ${p.adoption.band.toLowerCase()}`}>
            {p.adoption.band} · {p.adoption.score}/100
          </span>
        </div>
        <div className="adopt-components">
          {p.adoption.components.map((c) => (
            <div className="adopt-row" key={c.label}>
              <span className="adopt-name">{c.label}</span>
              <span className="adopt-bar">
                <i style={{ width: `${(c.score / c.max) * 100}%` }} />
              </span>
              <span className="adopt-val">{c.score}/{c.max}</span>
            </div>
          ))}
        </div>
        {p.adoption.strengths.length > 0 && (
          <ul className="adopt-list good">
            {p.adoption.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        {p.adoption.risks.length > 0 && (
          <ul className="adopt-list risk">
            {p.adoption.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <p className="wg-note">
          Can this word actually enter speech? A rule-based estimate from its sound — not an
          external brand, drug or trademark check.
        </p>
      </div>

      <div className="sec collision">
        <h4>Availability</h4>
        <div className={`collide-offline match-${p.collision.match}`}>{p.collision.note}</div>
        {collision ? (
          <div className="collide-live">
            <div className="collide-line">
              <span className="collide-key">Dictionary</span>
              <span>
                {collision.dictionary.isWord
                  ? 'Already an English word'
                  : 'Not found in the English dictionary'}
              </span>
            </div>
            {collision.dictionary.definition && (
              <div className="collide-def">“{collision.dictionary.definition}”</div>
            )}
            <div className="collide-domains">
              {collision.domains.map((d) => (
                <span key={d.tld} className={`dom dom-${d.status}`}>
                  .{d.tld} · {d.status}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="use-load"
            disabled={checking}
            onClick={runCollisionCheck}
          >
            {checking ? 'Checking dictionary & domains…' : 'Check dictionary & domains (live)'}
          </button>
        )}
        {checkFailed && !collision && (
          <p className="wg-note">Live check unavailable right now — try again in a moment.</p>
        )}
        <p className="wg-note">
          Live check covers the English dictionary and domain registration only — not trademarks,
          social handles or meanings in other languages.
        </p>
      </div>

      <div className="sec evolve">
        <div className="evolve-head">
          <h4>Evolve the sound</h4>
          {lineage.length > 0 && (
            <button type="button" className="dir-clear" onClick={() => setLineage([])}>
              Reset
            </button>
          )}
        </div>
        <p className="evolve-hint">
          Reshape how the word sounds — the meaning stays. Free, no AI.
        </p>
        <div className="evolve-chips">
          {EVOLVE_DIRECTIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="steer-chip"
              onClick={() => evolveBy(d.id)}
            >
              {d.label}
            </button>
          ))}
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
                  <span className="say-val">{s.passport.pronunciationGuide}</span>
                  <span className="translit">{s.passport.transliteration}</span>
                  {onToggleSave && (
                    <button
                      type="button"
                      className={`save-btn ${isSaved(s.passport.word) ? 'on' : ''}`}
                      onClick={() => onToggleSave(s.passport)}
                    >
                      {isSaved(s.passport.word) ? '★ Saved' : '☆ Save'}
                    </button>
                  )}
                </div>
                <div className="evolved-meta">
                  <span className="evolved-dir">{s.directionLabel}</span>
                  <span className="evolved-preserve">
                    concept preserved: <b>{s.conceptPreservation}</b>
                  </span>
                  <span className={`adopt-band ${s.passport.adoption.band.toLowerCase()}`}>
                    {s.passport.adoption.band}
                  </span>
                </div>
                <div className="evolved-changes">{s.changes.join(' · ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sec">
        <h4>Word Genome</h4>
        <div className="wg">
          <div className="wg-cell"><span>Parent language</span><b>{e.parentLanguage}</b></div>
          <div className="wg-cell"><span>Mutation</span><b>{e.mutation}%</b></div>
          <div className="wg-cell"><span>Visual balance</span><b>{e.visualBalance}</b></div>
          <div className="wg-cell"><span>Structural originality</span><b>{e.originality}</b></div>
          <div className="wg-cell"><span>Memorability</span><b>{e.memorability}</b></div>
          <div className="wg-cell"><span>Phonetic stability</span><b>{e.phoneticStability}</b></div>
          <div className="wg-cell"><span>Evolution distance</span><b>{e.evolutionDistance.toFixed(2)}</b></div>
          <div className="wg-cell"><span>Syllables</span><b>{p.genome.syllables}</b></div>
        </div>
        <p className="wg-note">
          Structural heuristics. For real-world collisions see Availability above (dictionary +
          domains); trademark and cross-language checks are still not performed.
        </p>
      </div>

      <div className="sec">
        <h4>Emotional DNA</h4>
        {topDNA.map((axis) => (
          <div className="dna-row" key={axis}>
            <span className="name">{axis}</span>
            <span className="bar">
              <i style={{ width: `${p.emotionalDNA[axis]}%` }} />
            </span>
            <span className="val">{p.emotionalDNA[axis]}%</span>
          </div>
        ))}
      </div>

      <div className="sec">
        <h4>Personality</h4>
        <div className="tags">
          {p.personality.map((t) => (
            <span className="t" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="sec">
        <h4>Pronunciation</h4>
        <div className="pron">
          {p.pronunciation.map((r) => (
            <div className="p" key={r.language}>
              <span>{r.language}</span>
              <Stars n={r.stars} />
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <h4>Brand Fit</h4>
        <div className="fit">
          <div className="line">
            <span className="k">Excellent for:</span> {p.brandFit.excellentFor.join(', ')}
          </div>
          <div className="line">
            <span className="k bad">Poor fit:</span> {p.brandFit.poorFit.join(', ')}
          </div>
        </div>
      </div>

      <div className="sec">
        <h4>Difficulty</h4>
        <div className="tags">
          {p.difficulty.map((d) => (
            <span className="t" key={d}>
              {d}
            </span>
          ))}
        </div>
      </div>

      <details className="more">
        <summary>Explain this word</summary>
        <div className="sec">
          <h4>Why it exists</h4>
          <p className="explain">{p.explanation}</p>
        </div>
        <div className="sec">
          <h4>Origin story</h4>
          <p className="story">{p.story}</p>
        </div>
        <div className="sec">
          <h4>Phonetic profile</h4>
          <div className="pron">
            <div className="p"><span>Pronounceability</span><span>{pct(p.genome.pronounceability)}</span></div>
            <div className="p"><span>Rhythm</span><span>{pct(p.genome.rhythm)}</span></div>
            <div className="p"><span>Syllable harmony</span><span>{pct(p.genome.syllableHarmony)}</span></div>
            <div className="p"><span>Sharpness</span><span>{pct(p.genome.sharpness)}</span></div>
            <div className="p"><span>Vowel ratio</span><span>{pct(p.genome.vowelRatio)}</span></div>
            <div className="p"><span>Weight</span><span>{pct(p.genome.weight)}</span></div>
          </div>
        </div>
      </details>
    </article>
  )
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

/**
 * Emphasise the invented word wherever it appears in an example sentence,
 * matching its inflected forms too (a shared stem of the word), so the reader's
 * eye lands on how the new word sits inside an ordinary sentence.
 */
function highlight(sentence: string, word: string): ReactNode {
  const stem = word.trim().slice(0, Math.max(3, word.trim().length - 2))
  if (!stem) return sentence
  const parts = sentence.split(new RegExp(`(${escapeRe(stem)}\\p{L}*)`, 'giu'))
  return parts.map((part, i) =>
    part.toLowerCase().startsWith(stem.toLowerCase()) && part.length >= stem.length ? (
      <b className="coined" key={i}>
        {part}
      </b>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
