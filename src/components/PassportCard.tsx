import type { EmotionalAxis, WordPassport } from '../engine'

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
export function PassportCard({ p }: { p: WordPassport }) {
  const topDNA = DNA_ORDER.filter((axis) => p.emotionalDNA[axis] >= 8).slice(0, 8)

  return (
    <article className="passport">
      <div className="word">{p.word}</div>
      <div className="meaning">“{p.meaning}”</div>
      <div className="origin">{p.lineage.note}</div>

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
          <h4>Word Genome</h4>
          <div className="pron">
            <div className="p"><span>Pronounceability</span><span>{pct(p.genome.pronounceability)}</span></div>
            <div className="p"><span>Memorability</span><span>{pct(p.genome.memorability)}</span></div>
            <div className="p"><span>Uniqueness</span><span>{pct(p.genome.uniqueness)}</span></div>
            <div className="p"><span>Rhythm</span><span>{pct(p.genome.rhythm)}</span></div>
            <div className="p"><span>Visual symmetry</span><span>{pct(p.genome.visualSymmetry)}</span></div>
            <div className="p"><span>Syllables</span><span>{p.genome.syllables}</span></div>
          </div>
        </div>
      </details>
    </article>
  )
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}
