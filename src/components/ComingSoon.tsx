import { SparkIcon } from './icons'

/** Future laboratories teased across the product. */
export interface FutureLab {
  title: string
  blurb: string
}

export const FUTURE_LABS: FutureLab[] = [
  { title: 'Word Constellation', blurb: 'See a concept and its words as a living star map.' },
  { title: 'Language Evolution', blurb: 'Watch a sound-world drift and branch over generations.' },
  { title: 'Semantic Map', blurb: 'Place a new meaning next to the words that surround it.' },
  { title: 'Word Relationships', blurb: 'Trace how coined words echo, oppose and inherit.' },
  { title: 'Genome Explorer', blurb: 'Tune a word’s phonetic DNA and hear it change.' },
]

/**
 * A single "future laboratory" card. Reads as a discipline waiting to open, not
 * an unfinished feature — quiet frame, a faint spark, and a "Coming soon" seal.
 */
export function ComingSoonCard({ lab }: { lab: FutureLab }) {
  return (
    <article className="soon-card">
      <div className="soon-spark" aria-hidden>
        <SparkIcon />
      </div>
      <h3 className="soon-title">{lab.title}</h3>
      <p className="soon-blurb">{lab.blurb}</p>
      <span className="soon-seal">Coming soon</span>
    </article>
  )
}

/** A responsive gallery of the future laboratories. */
export function ComingSoonGrid({ labs = FUTURE_LABS }: { labs?: FutureLab[] }) {
  return (
    <div className="soon-grid">
      {labs.map((lab) => (
        <ComingSoonCard key={lab.title} lab={lab} />
      ))}
    </div>
  )
}
