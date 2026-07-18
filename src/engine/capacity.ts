import { LANGUAGES } from './data/languages'
import { speakNative, DEFAULT_SPEAKABILITY } from './synth'
import { naturalness, naturalnessBand, type NaturalnessBand } from './naturalness'
import { Rng } from './rng'

/**
 * Lexical capacity — how many distinct, *adequate* words the engine can actually
 * coin. This answers a real product question ("is this a language or a demo?"),
 * so it must be measured, not asserted: we run the real synthesiser across many
 * seeds and count the unique survivors, exactly as a discovery run would breed
 * them. The result is a deterministic **lower bound** — the reachable space keeps
 * growing past any finite sample — reported honestly as such.
 *
 * What is counted: distinct romanised word-*forms* that clear every phonotactic
 * gate. `adequate` = forms whose {@link naturalness} lands in the top two bands
 * (Believable / Inevitable) — i.e. they read like words a living language could
 * already own. `distinctSkeletons` collapses vowels (a deliberately harsh
 * "are these genuinely different words" proxy) as a conservative floor.
 *
 * What is NOT counted: meanings. A form is a vessel; meaning is assigned per
 * request. Capacity of vessels bounds nothing the product will hit soon.
 */
export interface CapacityEstimate {
  /** Seeds run per language (the sample size behind the lower bound). */
  seeds: number
  /** Speakability dial the sample was bred at. */
  speakability: number
  /** Living languages in the sample. */
  languages: number
  /** Distinct speakable word-forms reached (lower bound). */
  uniqueForms: number
  /** Forms in the top two naturalness bands (Believable + Inevitable). */
  adequate: number
  /** Forms per naturalness band. */
  byBand: Record<NaturalnessBand, number>
  /** Distinct consonant skeletons among adequate forms — a harsh distinctness floor. */
  distinctSkeletons: number
  /** Distinct forms bred by each language. */
  perLanguage: { name: string; count: number }[]
  /** New forms found in the final fifth of the sample (0 ⇒ saturating). */
  newInLastFifth: number
  /** True while the sample was still discovering materially more forms at the end. */
  stillGrowing: boolean
}

const VOWELS = /[aeiouyëäöü]/gi

/**
 * Run the real synthesiser over `seeds` deterministic runs per language and
 * accumulate the distinct survivors. Deterministic: same engine + args ⇒ same
 * numbers, which is what lets the benchmark test catch drift.
 *
 * Heavy (hundreds of thousands of forms) — intended for Node / the benchmark, not
 * the browser. The UI reads a committed snapshot instead.
 */
export function estimateCapacity(
  seeds = 800,
  speakability: number = DEFAULT_SPEAKABILITY,
): CapacityEstimate {
  const perLang = LANGUAGES.map(() => new Set<string>())
  const global = new Set<string>()
  const fifthMark = Math.floor(seeds * 0.8)
  let sizeAtFifthMark = 0

  for (let s = 0; s < seeds; s++) {
    LANGUAGES.forEach((lang, i) => {
      // count 400 > the per-run breeding budget, so selection returns the whole
      // survivor pool for this seed rather than a diverse subset.
      const { words } = speakNative(lang, new Rng(s * 1009 + i * 31 + 7), 400, speakability)
      for (const w of words) {
        const key = w.toLowerCase()
        perLang[i].add(key)
        global.add(key)
      }
    })
    if (s + 1 === fifthMark) sizeAtFifthMark = global.size
  }

  const byBand: Record<NaturalnessBand, number> = {
    Inevitable: 0,
    Believable: 0,
    Plausible: 0,
    Fabricated: 0,
  }
  const skeletons = new Set<string>()
  for (const w of global) {
    const band = naturalnessBand(naturalness(w))
    byBand[band]++
    if (band === 'Believable' || band === 'Inevitable') skeletons.add(w.replace(VOWELS, ''))
  }

  const newInLastFifth = global.size - sizeAtFifthMark
  return {
    seeds,
    speakability,
    languages: LANGUAGES.length,
    uniqueForms: global.size,
    adequate: byBand.Believable + byBand.Inevitable,
    byBand,
    distinctSkeletons: skeletons.size,
    perLanguage: LANGUAGES.map((l, i) => ({ name: l.character, count: perLang[i].size })).sort(
      (a, b) => b.count - a.count,
    ),
    newInLastFifth,
    // "materially" = the final fifth still added >2% of the running total.
    stillGrowing: newInLastFifth > global.size * 0.02,
  }
}
