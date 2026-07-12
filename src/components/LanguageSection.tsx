import type { WordFamily } from '../engine'
import { PassportCard } from './PassportCard'

/**
 * A discovered language and its native speakers.
 *
 * The header presents the species itself — description, native characteristics
 * and its Language Genome — before the word passports, so the words read as
 * evidence the language exists.
 */
export function LanguageSection({ fam }: { fam: WordFamily }) {
  const g = fam.genome
  return (
    <section className="language" id={`lang-${fam.id}`}>
      <div className="language-head">
        <div className="language-title">
          <span className="language-name">{fam.character}</span>
          <span className="language-theme">discovered around {fam.theme}</span>
        </div>
        <p className="language-desc">{fam.description}</p>

        <div className="language-body">
          <div className="native">
            <h4>Native Characteristics</h4>
            <ul>
              {fam.nativeCharacteristics.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="lang-genome">
            <h4>Language Genome</h4>
            <dl>
              <div><dt>Consonant density</dt><dd>{g.consonantDensity}</dd></div>
              <div><dt>Preferred vowels</dt><dd>{g.preferredVowels}</dd></div>
              <div><dt>Cadence</dt><dd>{g.cadence}</dd></div>
              <div><dt>Stress pattern</dt><dd>{g.stressPattern}</dd></div>
              <div><dt>Visual symmetry</dt><dd>{g.visualSymmetry}</dd></div>
              <div><dt>Entropy</dt><dd>{g.entropy}</dd></div>
              <div><dt>Mutation rate</dt><dd>{g.mutationRate}</dd></div>
              <div><dt>Emotional gravity</dt><dd>{g.emotionalGravity}</dd></div>
              <div><dt>Evolution speed</dt><dd>{g.evolutionSpeed}</dd></div>
              <div><dt>Preferred endings</dt><dd>{g.preferredEndings.join('  ')}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div className="grid">
        {fam.words.map((p) => (
          <PassportCard p={p} key={p.word} />
        ))}
      </div>
    </section>
  )
}
