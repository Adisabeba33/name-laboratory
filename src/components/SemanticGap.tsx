import type { GapStatus, SemanticGapResult } from '../lib/semantic-search'

/** Human labels + tone for each gap outcome (spec §16). */
const STATUS_META: Record<GapStatus, { label: string; tone: 'named' | 'gap' | 'unknown' }> = {
  existing_word: { label: 'A word already exists', tone: 'named' },
  existing_phrase: { label: 'An expression already exists', tone: 'named' },
  partial_coverage: { label: 'Semantic gap detected', tone: 'gap' },
  inconclusive: { label: 'No close equivalent found', tone: 'unknown' },
}

/**
 * "Does this meaning already have a word?" — the reverse-dictionary panel shown
 * before the invented words. It lists the closest existing concepts (what each
 * covers and misses), the lab's conclusion, and the unnamed remainder — then, only
 * when a real gap remains, invites discovering a word for it. Honest by design:
 * qualitative bands, and a visible note that this is the model's knowledge, not an
 * exhaustive dictionary.
 */
export function SemanticGap({
  result,
  loading,
  onDiscover,
}: {
  result: SemanticGapResult | null
  loading: boolean
  onDiscover: () => void
}) {
  if (loading) {
    return (
      <section className="sg sg-loading">
        <span className="sg-kicker">Does this meaning already have a word?</span>
        <p className="sg-searching">Searching existing vocabulary…</p>
      </section>
    )
  }
  if (!result) return null

  const meta = STATUS_META[result.status]
  const showCTA = result.status === 'partial_coverage' || result.status === 'inconclusive'

  return (
    <section className="sg">
      <div className="sg-head">
        <span className="sg-kicker">Does this meaning already have a word?</span>
        <span className={`sg-verdict sg-${meta.tone}`}>{meta.label}</span>
      </div>

      {result.closest.length > 0 && (
        <div className="sg-list">
          {result.closest.map((c) => (
            <article className="sg-item" key={`${c.lemma}-${c.language}`}>
              <div className="sg-item-head">
                <span className="sg-lemma">{c.lemma}</span>
                <span className="sg-pos">{c.pos}</span>
                {c.language && c.language !== 'English' && (
                  <span className="sg-lang">{c.language}</span>
                )}
                <span className={`sg-cov sg-cov-${c.coverage}`}>{c.coverage}</span>
              </div>
              <p className="sg-def">{c.definition}</p>
              {c.covers.length > 0 && (
                <p className="sg-covers">
                  <span className="sg-tag good">Covers</span> {c.covers.join(' · ')}
                </p>
              )}
              {c.misses.length > 0 && (
                <p className="sg-misses">
                  <span className="sg-tag miss">Doesn’t cover</span> {c.misses.join(' · ')}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {result.conclusion && (
        <div className="sg-conclusion">
          <span className="sg-conc-label">Laboratory conclusion</span>
          <p>{result.conclusion}</p>
        </div>
      )}

      {meta.tone === 'gap' && result.remainder && (
        <div className="sg-gap">
          <span className="sg-gap-label">Semantic gap</span>
          <p>{result.remainder}</p>
        </div>
      )}

      <div className="sg-foot">
        <p className="sg-limits">{result.limitations}</p>
        {showCTA && (
          <button type="button" className="btn primary sm" onClick={onDiscover}>
            {result.status === 'partial_coverage'
              ? 'Discover a word for this gap'
              : 'Continue with experimental discovery'}
          </button>
        )}
      </div>
    </section>
  )
}
