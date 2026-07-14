import type {
  BrandSafety,
  CollisionReport,
  DictionaryViability,
  PronunciationRating,
  WordGenome,
} from './types'
import { normalise } from './phonetics'

/**
 * Engine v0.36 Phase 5 (deterministic half) — Brand Safety.
 *
 * Is a coined word safe and usable as a real-world NAME? This is collision-first:
 * an existing or look-alike word is disqualifying for a brand no matter how lovely
 * it sounds. Built from the layered collision report plus distinctiveness,
 * spellability, length and cross-language reach. Honest: the external collision
 * layers are still unverified, so even "Strong" means "clears every check we can
 * run offline", never "trademark-clear".
 */

export interface BrandSafetyInput {
  word: string
  collisionReport: CollisionReport
  dictionaryViability: DictionaryViability
  genome: WordGenome
  pronunciation: PronunciationRating[]
}

export function computeBrandSafety(input: BrandSafetyInput): BrandSafety {
  const { word, collisionReport: c, dictionaryViability: dv, genome, pronunciation } = input
  const len = normalise(word).replace(/[^a-zë-ü]/gi, '').length

  const strengths: string[] = []
  const warnings: string[] = []

  // Collision clearance dominates a brand verdict.
  let clearance: number
  if (c.internalDictionary !== 'clear') {
    clearance = 0.1
    warnings.push('Collides with an existing word or name — not usable as a brand.')
  } else if (c.phonetic === 'high') {
    clearance = 0.4
    warnings.push('Sounds like an existing word — risks confusion.')
  } else if (c.shortWordRisk === 'high') {
    clearance = 0.5
    warnings.push('Very short — short names are usually already taken (companies, tickers, domains).')
  } else {
    clearance = c.phonetic === 'moderate' || c.shortWordRisk === 'moderate' ? 0.75 : 0.95
    strengths.push('Clears every collision check we can run offline.')
  }

  const distinctiveness = genome.uniqueness
  if (distinctiveness >= 0.8) strengths.push('Distinctive — unlikely to blur into other names.')

  const spellability = (dv.spokenRecoverability + dv.visualRecoverability) / 2
  if (spellability >= 0.8) strengths.push('Easy to spell from hearing and say from reading.')
  else if (spellability < 0.6) warnings.push('Hard to spell after hearing it — adds friction to a name.')

  const reach = pronunciation.length
    ? pronunciation.reduce((s, r) => s + r.stars, 0) / pronunciation.length / 5
    : 0.7
  if (reach >= 0.85) strengths.push('Pronounceable across languages — travels globally.')

  // Brand-length sweet spot: 5–10 characters.
  const lengthFit = len >= 5 && len <= 10 ? 1 : len <= 4 ? 0.5 : 0.7
  if (len <= 4) warnings.push('Under 5 letters — a crowded, mostly-occupied namespace.')

  const score = Math.round(
    (clearance * 0.45 + distinctiveness * 0.2 + spellability * 0.15 + reach * 0.1 + lengthFit * 0.1) * 100,
  )
  const band: BrandSafety['band'] =
    c.internalDictionary !== 'clear'
      ? 'Poor'
      : score >= 82
        ? 'Strong'
        : score >= 68
          ? 'Good'
          : score >= 52
            ? 'Fair'
            : 'Poor'

  return { band, score, strengths, warnings }
}
