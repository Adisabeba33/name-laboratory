import type {
  AcousticProfile,
  Collision,
  DictionaryViability,
  LexicalClass,
  LexicalDiscoveryScore,
  PronunciationRating,
  ScoreComponent,
  WordGenome,
} from './types'
import { normalise, pronounceability } from './phonetics'
import { endsOpen } from './acoustics'

/**
 * Engine v0.36 Phase 2 — the Lexical Discovery Score.
 *
 * The single final score for a candidate, computed from EXPLICIT weighted
 * components (never "LLM enthusiasm", per spec §11–12). Beauty is deliberately not
 * a major component: concept fidelity and dictionary viability dominate, and a
 * structural collision-safety prior (which is low for short, easily-occupied
 * forms — spec §14) drags risky candidates down. The result is a realistic
 * distribution with few 90+ and honest hard-gate rejections.
 */

/** Component weights (spec §12). Fidelity + viability dominate; beauty does not. */
const WEIGHTS = {
  fidelity: 0.3,
  viability: 0.2,
  collision: 0.15,
  speakability: 0.1,
  memorability: 0.1,
  morphology: 0.05,
  congruence: 0.05,
  crossLanguage: 0.05,
}

export interface DiscoveryInput {
  word: string
  genome: WordGenome
  collision: Collision
  dictionaryViability: DictionaryViability
  pronunciation: PronunciationRating[]
  /** The family's concept-fidelity band (v0.36 direct/adjacent gate). */
  fidelityBand: 'direct' | 'adjacent' | 'weak'
  /**
   * This WORD's own concept fidelity, 0–100 (how well its carried concepts hit
   * the gap), so two direct words in the same family score differently instead of
   * clustering at one band value — the 30%-weight component that spreads the
   * distribution. Defaults to a band-based estimate when not supplied.
   */
  fidelityScore?: number
  /** The family's intended acoustic profile, for sound-meaning congruence. */
  acoustic: AcousticProfile
}

export function computeDiscovery(input: DiscoveryInput): LexicalDiscoveryScore {
  const { word, genome, collision, dictionaryViability: dv, pronunciation, fidelityBand, acoustic } = input

  const fidelity =
    input.fidelityScore ??
    (fidelityBand === 'direct' ? 78 : fidelityBand === 'adjacent' ? 52 : 30)
  const collisionSafetyPrior = collisionPrior(word, collision)
  const speakability = pronounceability(normalise(word)) * 100
  const memorability = genome.memorability * 100
  const morphology = dv.morphologyFit * 100
  const congruence = soundMeaningCongruence(word, genome, acoustic) * 100
  const crossLanguage = (pronunciation.length
    ? pronunciation.reduce((s, r) => s + r.stars, 0) / pronunciation.length / 5
    : 0.7) * 100

  const components: ScoreComponent[] = [
    { label: 'Concept fidelity', score: round(fidelity), weight: WEIGHTS.fidelity },
    { label: 'Dictionary viability', score: round(dv.overall * 100), weight: WEIGHTS.viability },
    { label: 'Collision safety', score: round(collisionSafetyPrior * 100), weight: WEIGHTS.collision },
    { label: 'Speakability', score: round(speakability), weight: WEIGHTS.speakability },
    { label: 'Memorability', score: round(memorability), weight: WEIGHTS.memorability },
    { label: 'Morphological flexibility', score: round(morphology), weight: WEIGHTS.morphology },
    { label: 'Semantic-phonetic congruence', score: round(congruence), weight: WEIGHTS.congruence },
    { label: 'Cross-language stability', score: round(crossLanguage), weight: WEIGHTS.crossLanguage },
  ]

  const score = round(components.reduce((sum, c) => sum + c.score * c.weight, 0))

  // Hard gates (spec §19): a drifted meaning or an exact known-word collision is
  // rejected outright, no matter how the other components score.
  const rejected = fidelityBand === 'weak' || collision.match === 'exact'
  // NOTE: this per-word classification tops out at "Strong". "Exceptional" is not
  // a per-word threshold — survivor components saturate, so a straight cutoff would
  // crown far too many. It is awarded per RUN to the single strongest direct
  // candidate that clears an absolute bar (see the generator's promotion step),
  // which keeps the top tier genuinely rare (spec §11 + the TOP DISCOVERY idea).
  const classification: LexicalClass = rejected
    ? 'Rejected'
    : score >= 80
      ? 'Strong'
      : score >= 70
        ? 'Viable'
        : score >= 60
          ? 'Experimental'
          : 'Weak'

  const penalties: string[] = []
  if (collision.match === 'exact') penalties.push('Collides exactly with a known word.')
  else if (collisionSafetyPrior < 0.5)
    penalties.push(`Short/​unverified form — high collision-risk prior (${Math.round(collisionSafetyPrior * 100)}/100).`)
  if (fidelityBand === 'adjacent') penalties.push('Adjacent to the gap, not a direct answer.')
  if (fidelityBand === 'weak') penalties.push('Drifted off the confirmed meaning.')
  if (dv.overall < 0.6) penalties.push('Low dictionary viability.')
  if (congruence < 55) penalties.push('Sound does not clearly express the meaning.')

  return { score, classification, components, penalties, collisionSafetyPrior }
}

/**
 * Structural collision-safety prior (spec §14). Short forms are far more likely to
 * be existing names, acronyms, tickers, products or occupied domains, so they get a
 * low prior regardless of the offline list; a confirmed offline match collapses it
 * further. This is a PRIOR, not a verified check — honest by construction.
 */
function collisionPrior(word: string, collision: Collision): number {
  const len = normalise(word).replace(/[^a-zë-ü]/gi, '').length
  const base = len <= 4 ? 0.35 : len === 5 ? 0.55 : len === 6 ? 0.7 : len <= 9 ? 0.85 : 0.78
  const match = collision.match === 'exact' ? 0.15 : collision.match === 'near' ? 0.5 : 1
  return Math.max(0, Math.min(1, base * match))
}

/**
 * A rough sound-meaning congruence (0–1): does the word's observed sound express
 * the meaning's intended acoustic profile? An approximation for Phase 2 — Phase 3
 * replaces it with a validated per-candidate congruence.
 */
function soundMeaningCongruence(word: string, genome: WordGenome, intended: AcousticProfile): number {
  const observed: AcousticProfile = {
    hardness: genome.sharpness,
    depth: genome.weight,
    clip: Math.max(0, Math.min(1, 1 - (genome.syllables - 1) / 4)),
    openness: endsOpen(word) ? 0.8 : 0.3,
  }
  const diff =
    Math.abs(observed.hardness - intended.hardness) +
    Math.abs(observed.depth - intended.depth) +
    Math.abs(observed.clip - intended.clip) +
    Math.abs(observed.openness - intended.openness)
  return Math.max(0, 1 - diff / 4)
}

function round(n: number): number {
  return Math.round(n)
}

/** A neutral profile for standalone passports built without a family context. */
export const NEUTRAL_ACOUSTIC: AcousticProfile = { hardness: 0.5, depth: 0.5, clip: 0.5, openness: 0.5 }

/**
 * Whether a scored candidate is eligible to be promoted to "Exceptional" — the
 * absolute bar the run's top direct candidate must ALSO clear (spec §11). Only one
 * word per run is promoted (the generator picks the strongest eligible), so a run
 * can honestly yield zero exceptional candidates.
 */
export function isExceptionalEligible(d: LexicalDiscoveryScore, viabilityOverall: number): boolean {
  const congruence = d.components.find((c) => c.label.startsWith('Semantic'))?.score ?? 0
  return (
    d.classification !== 'Rejected' &&
    d.score >= 88 &&
    d.collisionSafetyPrior >= 0.85 &&
    congruence >= 75 &&
    viabilityOverall >= 0.85
  )
}
