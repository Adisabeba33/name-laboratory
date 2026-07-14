/**
 * Naturalness — the Engine V3 signal.
 *
 * The old engine optimised for *unusualness*, which drifts into fantasy: words
 * that read as elf kingdoms or RPG spells ("Gruthuthoth", "Vorulalux"). This
 * scores the opposite target — how much a coined word feels like a word a real
 * human language could already own ("Sena", "Uber", "Kodak"). A high score means
 * the word feels *inevitable*, not manufactured.
 *
 * It is a transparent structural heuristic (like Speech Adoption), not a measured
 * probability. Its job is to become the PRIMARY ranking signal so believability
 * beats originality — originality is the last step, not the first.
 */
import {
  awkwardClusters,
  countSyllables,
  longestVowelRun,
  normalise,
  pronounceability,
  rhythm,
  syllableHarmony,
} from './phonetics'

/** A qualitative read of how real the word feels. Band, not a fake percentage. */
export type NaturalnessBand = 'Fabricated' | 'Plausible' | 'Believable' | 'Inevitable'

/** Endings that scream "invented / fantasy" — decorative, rarely in real words. */
const FANTASY_ENDING = /(iel|yth|ath|aith|oth|eth|yx|ux|ax|ox|ix|aer|eol|wyn)$/
/** Letters that read as exotic when they appear, worse when they pile up. */
const RARE_LETTERS = new Set(['x', 'z', 'q'])

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/**
 * 0–1 naturalness. A `base` captures articulation + shape (could a mouth say it,
 * does it sit in a real word's size), then MULTIPLICATIVE penalties knock down
 * anything wearing fantasy markers — a decorative ending, exotic letters, a wall
 * of `th`, or sheer length. Multiplying (not averaging) is what gives real
 * separation: "Uber" ≈ 0.98, "Gruthuthoth" ≈ 0.12.
 */
export function naturalness(word: string): number {
  const w = normalise(word).replace(/[^a-zë-ü]/gi, '')
  if (w.length < 2) return 0
  const len = w.length
  const syl = countSyllables(w)

  // Base — how easily it's said and how ordinary its shape is (no fantasy markers yet).
  const ease = pronounceability(w)
  const flow = (rhythm(w) + syllableHarmony(w)) / 2
  const syllableScore = syl <= 3 ? (syl === 1 ? 0.85 : 1) : Math.max(0.4, 1 - (syl - 3) * 0.25)
  const clusterScore = Math.max(0, 1 - awkwardClusters(w) * 0.4)
  const base = clamp01(ease * 0.4 + flow * 0.2 + syllableScore * 0.2 + clusterScore * 0.2)

  // Multiplicative penalties — each fantasy tell scales the score down.
  const rare = [...w].filter((c) => RARE_LETTERS.has(c)).length
  const thCount = (w.match(/th/g) ?? []).length
  const lengthPenalty =
    len <= 7 ? 1 : len <= 8 ? 0.9 : len <= 9 ? 0.78 : len <= 10 ? 0.66 : 0.55
  const penalty =
    (FANTASY_ENDING.test(w) ? 0.5 : 1) *
    Math.max(0.3, 1 - rare * 0.35) *
    (thCount >= 2 ? 0.55 : 1) *
    lengthPenalty *
    (longestVowelRun(w) >= 3 ? 0.75 : 1)

  return clamp01(base * penalty)
}

/** Map the 0–1 score to an honest band. */
export function naturalnessBand(score: number): NaturalnessBand {
  if (score >= 0.8) return 'Inevitable'
  if (score >= 0.66) return 'Believable'
  if (score >= 0.5) return 'Plausible'
  return 'Fabricated'
}
