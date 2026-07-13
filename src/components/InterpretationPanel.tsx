import type { MeaningAnalysis } from '../engine'

/**
 * The Laboratory Interpretation — the Meaning Engine's most important surface.
 *
 * Before any language is shown, the laboratory states what it believes the
 * request is really about, names the hidden concepts it discovered, and draws the
 * concept network. This is what makes the product feel like it is reasoning, not
 * guessing — and lets the user catch a wrong reading before trusting the output.
 */
/** Optional ways to nudge the reading — offered only when the LLM can re-interpret. */
const TONE_STEERS = ['Warmer', 'Darker', 'More intimate', 'Simpler']

export function InterpretationPanel({
  analysis,
  source,
  onSteer,
  steering,
  showTensions = true,
}: {
  analysis: MeaningAnalysis
  source?: 'llm' | 'engine'
  /** Re-interpret with an emphasis. Only wired when the LLM is available. */
  onSteer?: (label: string) => void
  /** A steer is currently re-running. */
  steering?: boolean
  /** Semantic tensions are meaningful for meanings, not names — hide when naming. */
  showTensions?: boolean
}) {
  const conceptSteers = analysis.hiddenConcepts.slice(0, 3).map((c) => c.en)
  return (
    <section className="interp">
      <div className="interp-head">
        <h3 className="interp-title">Laboratory Interpretation</h3>
        {source && (
          <span className={`interp-source ${source}`}>
            {source === 'llm' ? 'Read by AI' : 'Read by the built-in engine'}
          </span>
        )}
      </div>
      <p className="interp-text">{analysis.interpretation}</p>
      <p className="interp-text ru">{analysis.interpretationRu}</p>

      {showTensions && analysis.tensions.length > 0 && (
        <div className="tensions">
          <h4>Semantic Tensions</h4>
          <ul className="tension-list">
            {analysis.tensions.map((t) => (
              <li className="tension" key={`${t.a}-${t.b}`}>
                <span className="poles">
                  <span className="pole">{t.a}</span>
                  <span className="vs" aria-hidden>↔</span>
                  <span className="pole">{t.b}</span>
                </span>
                <span className="tension-note">{t.note}</span>
                <span className="tension-note ru">{t.noteRu}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onSteer && (
        <div className="steer">
          <span className="steer-label">Refine the reading{steering ? '…' : ''}</span>
          <div className="steer-chips">
            {conceptSteers.map((label) => (
              <button
                type="button"
                key={label}
                className="steer-chip"
                disabled={steering}
                onClick={() => onSteer(`more about "${label}"`)}
              >
                More: {label}
              </button>
            ))}
            {TONE_STEERS.map((label) => (
              <button
                type="button"
                key={label}
                className="steer-chip tone"
                disabled={steering}
                onClick={() => onSteer(label.toLowerCase())}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="interp-cols">
        <div>
          <h4>Hidden Concepts</h4>
          <div className="hidden-concepts">
            {analysis.hiddenConcepts.map((c) => (
              <span className="hc" key={c.en} title={c.ru}>
                <span className="hc-en">{c.en}</span>
                <span className="hc-ru">{c.ru}</span>
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4>Concept Network</h4>
          <div className="network">
            {analysis.network.map((n, i) => (
              <span className="net-node-wrap" key={n.en}>
                <span className="net-node">
                  <span className="net-en">{n.en}</span>
                  <span className="net-ru">{n.ru}</span>
                </span>
                {i < analysis.network.length - 1 && <span className="net-arrow" aria-hidden>→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
