import { ArrowIcon } from './icons'
import { Placeholder } from './Placeholder'

/**
 * The opening statement of the institute.
 *
 * Left: a calm, oversized display-serif headline and a two-line thesis. It sells
 * the philosophy — meaning before language — not a feature. Right: the future
 * interactive artifact, held for now by a precise 700×700 placeholder.
 */
export function Hero({
  onDiscover,
  onLearnMore,
}: {
  onDiscover: () => void
  onLearnMore: () => void
}) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="hero-eyebrow">The institute of unnamed meaning</p>
        <h1 className="hero-title">
          Discover
          <br />
          the words
          <br />
          <span className="hero-em">meaning forgot.</span>
        </h1>
        <p className="hero-lede">
          Word Laboratory uncovers the meanings hidden inside human experience — and
          creates entirely new words capable of carrying them.
        </p>
        <div className="hero-cta">
          <button type="button" className="btn primary" onClick={onDiscover}>
            Discover a meaning
            <ArrowIcon className="btn-ico" />
          </button>
          <button type="button" className="btn link" onClick={onLearnMore}>
            Learn more
          </button>
        </div>
        <div className="hero-flow" aria-hidden>
          <span>Meaning</span>
          <i>→</i>
          <span>Concept</span>
          <i>→</i>
          <span>Language</span>
          <i>→</i>
          <span>Word</span>
        </div>
      </div>

      <div className="hero-art">
        <Placeholder
          width={700}
          height={700}
          title="Future Interactive Artifact"
          note="a living crystal / language tree / semantic sphere"
        />
      </div>
    </section>
  )
}
