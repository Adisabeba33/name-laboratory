import { CAPACITY } from '../engine'

/** Compact number formatting: 404624 → "404,624", 337671 → "337,671". */
function n(x: number): string {
  return x.toLocaleString('en-US')
}

/**
 * Capacity — an honest, measured answer to "is this a language or a demo?".
 *
 * The figures are not asserted; they are the exact output of the real
 * synthesiser (`estimateCapacity`), committed as a snapshot and re-verified by a
 * benchmark test. This panel presents them with their caveats intact: these are
 * word *forms* (not meanings), a *lower bound* (the space is still growing), and
 * the strict floor collapses vowels so near-twins don't inflate the count.
 */
export function CapacityPanel() {
  const c = CAPACITY
  const maxLang = c.perLanguage[0]?.count || 1
  const bands: { key: keyof typeof c.byBand; label: string; adequate: boolean }[] = [
    { key: 'Inevitable', label: 'Inevitable', adequate: true },
    { key: 'Believable', label: 'Believable', adequate: true },
    { key: 'Plausible', label: 'Plausible', adequate: false },
    { key: 'Fabricated', label: 'Fabricated', adequate: false },
  ]
  const bandTotal = c.uniqueForms

  return (
    <section className="capacity">
      <div className="capacity-hero">
        <span className="capacity-eyebrow">Measured capacity</span>
        <div className="capacity-big">{n(c.adequate)}</div>
        <p className="capacity-claim">
          distinct <b>believable</b> words the engine can already coin across {c.languages} living
          languages — enough to underwrite a real language many times over.
        </p>
        <p className="capacity-caveat">
          A living language is ~50,000 words; a person actively uses 20–35,000. This is a
          <b> lower bound</b> measured over {n(c.seeds)} runs per language — the reachable space was
          still growing when we stopped, so the true ceiling runs into the millions.
        </p>
      </div>

      <div className="capacity-stats">
        <div className="cap-stat">
          <span className="cap-val">{n(c.uniqueForms)}</span>
          <span className="cap-key">unique word-forms reached</span>
        </div>
        <div className="cap-stat">
          <span className="cap-val">{n(c.adequate)}</span>
          <span className="cap-key">adequate (top two naturalness bands)</span>
        </div>
        <div className="cap-stat">
          <span className="cap-val">{n(c.distinctSkeletons)}</span>
          <span className="cap-key">distinct even with vowels collapsed (strict floor)</span>
        </div>
        <div className="cap-stat">
          <span className="cap-val">+{n(c.newInLastFifth)}</span>
          <span className="cap-key">new in the final fifth — not saturated</span>
        </div>
      </div>

      <div className="capacity-cols">
        <div className="cap-card">
          <h4>By believability</h4>
          <div className="cap-bands">
            {bands.map((b) => {
              const v = c.byBand[b.key]
              return (
                <div className="cap-band-row" key={b.key}>
                  <span className="cap-band-name">
                    {b.label}
                    {b.adequate && <span className="cap-band-tag">adequate</span>}
                  </span>
                  <span className="cap-band-bar">
                    <i
                      className={b.adequate ? 'ok' : ''}
                      style={{ width: `${(v / bandTotal) * 100}%` }}
                    />
                  </span>
                  <span className="cap-band-val">{n(v)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="cap-card">
          <h4>Words bred per language</h4>
          <div className="cap-langs">
            {c.perLanguage.map((l) => (
              <div className="cap-lang-row" key={l.name}>
                <span className="cap-lang-name">{l.name}</span>
                <span className="cap-lang-bar">
                  <i style={{ width: `${(l.count / maxLang) * 100}%` }} />
                </span>
                <span className="cap-lang-val">{n(l.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="capacity-method">
        <b>How this is measured — honestly.</b> We run the real word synthesiser across{' '}
        {n(c.seeds)} seeds per language and count the distinct survivors that clear every
        phonotactic gate; “adequate” means a form whose measured <i>naturalness</i> lands in the top
        two bands (it reads like a word a living language could own). These are word{' '}
        <b>forms</b>, not meanings — meaning is assigned per request, so the vessel count bounds
        nothing the product will hit. The figures are the exact output of{' '}
        <code>estimateCapacity()</code>, committed as a snapshot and re-verified by a benchmark test,
        so they update honestly whenever the engine changes.
      </p>
    </section>
  )
}
