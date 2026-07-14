import { HeartIcon } from './icons'
import type { WordPassport } from '../engine'

/**
 * A compact, calm result row. In the redesign a word is not a dense card of
 * data — it's an invitation. This shows only the essentials (word, how to say
 * it, a single line of meaning, its band) and opens the full Word page on click.
 */
export function WordCard({
  p,
  saved,
  onOpen,
  onToggleSave,
}: {
  p: WordPassport
  saved: boolean
  onOpen: () => void
  onToggleSave: () => void
}) {
  const oneLine = (p.shortMeaning || p.meaning).replace(/\s*\(.*$/, '').trim()
  return (
    <article className="wcard" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="wcard-mark" aria-hidden>
        {p.word.slice(0, 1).toUpperCase()}
      </div>
      <div className="wcard-body">
        <div className="wcard-top">
          <span className="wcard-word">{p.word}</span>
          {p.partOfSpeech && <span className="wcard-pos">{p.partOfSpeech}</span>}
          <span className={`band band-${p.adoption.band.toLowerCase()}`}>{p.adoption.band}</span>
          <span className={`nat nat-${p.naturalness.toLowerCase()}`}>{p.naturalness}</span>
          <span className="fitsig" title={`Strongest of ${p.fitness.axes.length} fitness dimensions`}>
            {p.fitness.strongest}
          </span>
        </div>
        <div className="wcard-meta">
          {p.pronunciationGuide && <span className="wcard-say">{p.pronunciationGuide}</span>}
          {p.transliteration && <span className="wcard-translit">{p.transliteration}</span>}
        </div>
        <p className="wcard-mean">{oneLine.length > 96 ? oneLine.slice(0, 96) + '…' : oneLine}</p>
      </div>
      <button
        type="button"
        className={`wcard-save ${saved ? 'on' : ''}`}
        title={saved ? 'Saved to My Lexicon' : 'Save to My Lexicon'}
        aria-pressed={saved}
        onClick={(e) => {
          e.stopPropagation()
          onToggleSave()
        }}
      >
        <HeartIcon filled={saved} />
      </button>
    </article>
  )
}
