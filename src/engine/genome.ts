import type { Concept, WordGenome } from './types'
import { KNOWN_WORDS } from './data/known-words'
import {
  clamp01,
  countSyllables,
  normalise,
  pronounceability,
  rhythm,
  sharpness,
  syllableHarmony,
  visualSymmetry,
  vowelRatio,
} from './phonetics'

/**
 * Compute a word's {@link WordGenome} — its measurable genetic code.
 *
 * This is the pivot of the whole system: emotional DNA, brand fit and the human
 * passport are all read *off* the genome, and a future slider UI would write
 * *into* it. Keeping the derivation here means the same numbers back every view.
 */
export function computeGenome(
  word: string,
  usedConcepts: Concept[],
): WordGenome {
  const w = normalise(word)
  const syllables = countSyllables(w)
  const length = w.replace(/[^a-zë-ü]/gi, '').length

  const pron = pronounceability(w)
  const memorability = estimateMemorability(w, syllables)
  const uniqueness = estimateUniqueness(w)
  const semanticDepth = clamp01(new Set(usedConcepts).size / 6)

  return {
    vowelRatio: round(vowelRatio(w)),
    rhythm: round(rhythm(w)),
    syllableHarmony: round(syllableHarmony(w)),
    pronounceability: round(pron),
    memorability: round(memorability),
    visualSymmetry: round(visualSymmetry(w)),
    sharpness: round(sharpness(w)),
    weight: round(estimateWeight(w)),
    uniqueness: round(uniqueness),
    semanticDepth: round(semanticDepth),
    syllables,
    length,
  }
}

/** Shorter, well-patterned, easily-said words are easier to remember. */
function estimateMemorability(word: string, syllables: number): number {
  const lengthScore = word.length <= 8 ? 1 : Math.max(0.3, 1 - (word.length - 8) * 0.12)
  const syllableScore = syllables <= 3 ? 1 : Math.max(0.4, 1 - (syllables - 3) * 0.25)
  const repetition = hasPleasantRepetition(word) ? 0.15 : 0
  return clamp01(lengthScore * 0.55 + syllableScore * 0.35 + repetition + 0.05)
}

/** Reward gentle repetition of a letter or a vowel echo (e.g. "Quantara"). */
function hasPleasantRepetition(word: string): boolean {
  const vowels = [...word].filter((c) => 'aeiou'.includes(c))
  const echo = new Set(vowels).size < vowels.length
  return echo
}

/** Perceived gravitas: driven by long/back vowels and voiced/heavy consonants. */
function estimateWeight(word: string): number {
  const backVowels = [...word].filter((c) => 'ouaà'.includes(c)).length
  const heavy = [...word].filter((c) => 'gdbvzmnr'.includes(c)).length
  const total = Math.max(1, word.length)
  return clamp01((backVowels * 0.9 + heavy * 0.7) / total + 0.15)
}

/**
 * Uniqueness: how novel the surface form is. Exact matches against the known-word
 * blocklist score ~0; near-misses are penalised on a sliding scale.
 */
export function estimateUniqueness(word: string): number {
  const w = normalise(word).replace(/[^a-z]/g, '')
  if (KNOWN_WORDS.has(w)) return 0.05

  let closest = Infinity
  for (const known of KNOWN_WORDS) {
    const d = editDistance(w, known)
    const rel = d / Math.max(w.length, known.length)
    closest = Math.min(closest, rel)
    if (closest === 0) break
  }
  // Map the real distance to the nearest known word onto a score that keeps a
  // genuine spread and is deliberately capped below 1.0: this is a *structural*
  // novelty heuristic against a small blocklist, not a verified-unique claim, so
  // it must never read as a perfect "100%" (see the honesty rules in PROJECT.md).
  return clamp01(0.5 + Math.min(closest, 1) * 0.47)
}

/** Classic Levenshtein distance, small-string friendly. */
export function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

/**
 * A single scalar summarising how "good" a genome is, used to rank candidates.
 * Pronounceability and memorability dominate; uniqueness gates out near-misses.
 */
export function genomeQuality(g: WordGenome): number {
  const balance = 1 - Math.abs(g.vowelRatio - 0.45) / 0.45
  return clamp01(
    g.pronounceability * 0.28 +
      g.memorability * 0.22 +
      clamp01(balance) * 0.12 +
      g.rhythm * 0.1 +
      g.syllableHarmony * 0.1 +
      g.uniqueness * 0.18,
  )
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
