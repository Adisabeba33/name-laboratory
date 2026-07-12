import type { MeaningAnalysis } from '../engine'

/**
 * The Laboratory Interpretation — the Meaning Engine's most important surface.
 *
 * Before any language is shown, the laboratory states what it believes the
 * request is really about, names the hidden concepts it discovered, and draws the
 * concept network. This is what makes the product feel like it is reasoning, not
 * guessing — and lets the user catch a wrong reading before trusting the output.
 */
export function InterpretationPanel({
  analysis,
  source,
}: {
  analysis: MeaningAnalysis
  source?: 'llm' | 'engine'
}) {
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
