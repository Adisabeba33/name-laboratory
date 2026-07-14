import type {
  EmotionalDNA,
  FitnessAxis,
  FitnessBand,
  FitnessProfile,
  PronunciationRating,
} from './types'
import { naturalness } from './naturalness'

/**
 * Engine V6 — the Fitness Profile.
 *
 * A word that survives selection is measured across several dimensions so the run
 * can say *why* it survived and, honestly, where it is only middling. The crucial
 * discipline here is honesty (project invariant #6): we band ONLY the dimensions
 * that genuinely vary between survivors, and we band them against the real spread
 * that dimension shows in practice — not against an abstract 0–1 line that would
 * make every survivor "Exceptional".
 *
 * Empirically (measured across many runs), among the words that survive selection:
 *   - emotional resonance, dictionary illusion and cross-language reach VARY — a
 *     word can be Strong on one and Moderate on another. These we band per word.
 *   - memorability and phonetic stability are near-uniformly high — a form cannot
 *     survive the gates *without* them. Banding those per word would manufacture
 *     differences that are not there, so they are reported once as a shared floor
 *     (see {@link SURVIVOR_FLOOR}), not as per-word variance.
 *
 * Every axis is a STRUCTURAL, sound-based estimate — not a semantic judgement of
 * how precisely the word fits its meaning (that needs the LLM and is stated as
 * such elsewhere). The bands are qualitative on purpose; no invented percentages.
 */

/** Order of the bands, weakest → strongest, for picking the signature axis. */
const BAND_RANK: Record<FitnessBand, number> = {
  Low: 0,
  Moderate: 1,
  Strong: 2,
  Exceptional: 3,
}

/**
 * Per-axis band cut points `[Moderate, Strong, Exceptional]`, calibrated to the
 * real distribution each signal shows across bred words (its quartiles), so the
 * bands actually spread where the signal spreads. Kept explicit and documented so
 * the calibration is auditable rather than a hidden magic number.
 */
const CUTS = {
  // naturalness among survivors clusters high (~0.78–0.98); the top rung is genuinely rare.
  illusion: [0.85, 0.93, 0.97] as const,
  // top-two emotional-DNA strength spreads widely (~0.53–0.89) — the best discriminator.
  resonance: [0.6, 0.7, 0.8] as const,
  // mean cross-language pronounceability (~0.80–1.00).
  reach: [0.82, 0.88, 0.95] as const,
}

/**
 * The honest shared floor: dimensions every survivor clears, stated once instead
 * of faked as per-word bands. Surfaced next to the profile so the picture is
 * complete without pretending these vary.
 */
export const SURVIVOR_FLOOR =
  'Every survivor also clears a high structural floor — memorability and phonetic ' +
  'stability — because a form cannot pass selection without them.'

/**
 * Build a word's fitness profile from signals the passport already carries.
 * Deterministic and pure: same inputs → same profile.
 */
export function computeFitness(
  word: string,
  emotionalDNA: EmotionalDNA,
  pronunciation: PronunciationRating[],
): FitnessProfile {
  const raw = [
    {
      key: 'illusion',
      label: 'Dictionary illusion',
      value: naturalness(word),
      cuts: CUTS.illusion,
      note: 'How readily it passes as a word that already exists in a real language.',
    },
    {
      key: 'resonance',
      label: 'Emotional resonance',
      value: emotionalResonance(emotionalDNA),
      cuts: CUTS.resonance,
      note: 'How pronounced the emotional signature of its sound is (structural, not semantic).',
    },
    {
      key: 'reach',
      label: 'Cultural reach',
      value: culturalReach(pronunciation),
      cuts: CUTS.reach,
      note: 'How easily speakers across different languages can pronounce it.',
    },
  ]

  const axes: FitnessAxis[] = raw.map((r) => ({
    key: r.key,
    label: r.label,
    band: bandOf(r.value, r.cuts),
    note: r.note,
  }))

  // Strongest / weakest by band first, then by the raw value within a band tie.
  const byStrength = raw
    .map((r, i) => ({ label: r.label, rank: BAND_RANK[axes[i].band], value: r.value }))
    .sort((a, b) => b.rank - a.rank || b.value - a.value)

  return {
    axes,
    strongest: byStrength[0].label,
    weakest: byStrength[byStrength.length - 1].label,
  }
}

/** Strength of a word's emotional identity — the mean of its two loudest axes (0–1). */
function emotionalResonance(dna: EmotionalDNA): number {
  const vals = Object.values(dna).sort((a, b) => b - a)
  return (vals[0] + (vals[1] ?? 0)) / 200
}

/** Mean cross-language pronounceability, normalised from 1–5 stars to 0–1. */
function culturalReach(pronunciation: PronunciationRating[]): number {
  if (pronunciation.length === 0) return 0
  const mean = pronunciation.reduce((sum, r) => sum + r.stars, 0) / pronunciation.length
  return mean / 5
}

/** Place a 0–1 value onto its axis's calibrated band. */
function bandOf(value: number, cuts: readonly [number, number, number]): FitnessBand {
  if (value >= cuts[2]) return 'Exceptional'
  if (value >= cuts[1]) return 'Strong'
  if (value >= cuts[0]) return 'Moderate'
  return 'Low'
}
