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
  showBrand = false,
}: {
  p: WordPassport
  saved: boolean
  onOpen: () => void
  onToggleSave: () => void
  showBrand?: boolean
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
          <span
            className={`disc disc-${p.discovery.classification.toLowerCase()}`}
            title={`Lexical Discovery Score ${p.discovery.score}/100 — computed from weighted components, not enthusiasm`}
          >
            {p.discovery.classification} {p.discovery.score}
          </span>
          {showBrand && (
            <span
              className={`brandsafe brandsafe-${p.brandSafety.band.toLowerCase()}`}
              title={
                p.brandSafety.warnings[0] ||
                p.brandSafety.strengths[0] ||
                'Collision-aware brand safety'
              }
            >
              brand: {p.brandSafety.band}
            </span>
          )}
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
