import type { DictionaryViability, PronunciationRating } from './types'
import { isVowel, longestVowelRun, normalise, pronounceability } from './phonetics'
import { naturalness } from './naturalness'

/**
 * Engine v0.36 Phase 2 — Dictionary Viability.
 *
 * Distinct from "is it pretty" or "is it novel": could this form realistically
 * behave like a word in a living language — spelled after hearing, pronounced
 * after seeing, inflected without strain, believed to already exist? A transparent
 * structural heuristic; each dimension is derived from real sound structure and
 * stated as such, never an LLM judgement of usage.
 */

/** Vowel pairs a reader glides through as one sound — spelling stays recoverable. */
const CLEAN_DIPHTHONGS = new Set([
  'ai', 'ei', 'oi', 'au', 'ou', 'eu', 'ia', 'io', 'ie', 'ea', 'ua', 'ue', 'ao', 'oa',
])
/** Digraphs whose sound is ambiguous from spelling (hurt spoken recoverability). */
const AMBIGUOUS = ['ph', 'gh', 'ough', 'eau', 'yx', 'x', 'q']

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export function computeDictionaryViability(
  word: string,
  pronunciation: PronunciationRating[],
  etymologyStages: number,
): DictionaryViability {
  const w = normalise(word).replace(/[^a-zë-ü]/gi, '')
  const len = w.length
  const nat = naturalness(word)

  // Looks like a plausible word — naturalness, minus an "acronym/username" read
  // for very short forms and a "generated sequence" read for very long ones.
  const lengthShape = len <= 4 ? 0.8 : len <= 9 ? 1 : 0.85
  const lexicalAppearance = clamp01(nat * lengthShape)

  // Spelled after hearing — grapheme regularity: ambiguous digraphs and non-clean
  // vowel walls make a heard word hard to write down.
  const ambiguity =
    AMBIGUOUS.reduce((n, g) => n + (w.includes(g) ? 1 : 0), 0) + nonCleanVowelPairs(w)
  const spokenRecoverability = clamp01(1 - ambiguity * 0.18 - Math.max(0, longestVowelRun(w) - 2) * 0.2)

  // Pronounced after seeing — this is what pronounceability already models.
  const visualRecoverability = clamp01(pronounceability(w))

  // Inflects without strain — a form ending in a vowel or a single clean consonant
  // takes suffixes cleanly; a hard cluster or a doubled ending resists them.
  const morphologyFit = clamp01(suffixability(w))

  // Register flexibility — mid-length, natural words travel across speech, writing
  // and poetry; very short reads as brand/slang, very long as technical only.
  const registerFlexibility = clamp01(nat * (1 - Math.abs(len - 6) * 0.05))

  const dictionaryIllusion = clamp01(nat)

  // Looks evolved, not assembled — a word with a plausible multi-stage lineage and
  // real naturalness reads as historically grown.
  const historicalPlausibility = clamp01(nat * (etymologyStages >= 3 ? 1 : 0.9))

  const overall = clamp01(
    lexicalAppearance * 0.22 +
      spokenRecoverability * 0.16 +
      visualRecoverability * 0.16 +
      morphologyFit * 0.12 +
      registerFlexibility * 0.1 +
      dictionaryIllusion * 0.14 +
      historicalPlausibility * 0.1,
  )

  const stars = pronunciation.length
    ? pronunciation.reduce((s, r) => s + r.stars, 0) / pronunciation.length / 5
    : 0.7
  const adoptionFriction: DictionaryViability['adoptionFriction'] =
    overall >= 0.8 && len >= 5 && len <= 9 && stars >= 0.8
      ? 'low'
      : overall >= 0.62 && len <= 11
        ? 'moderate'
        : 'high'

  return {
    overall,
    band: overall >= 0.85 ? 'Exceptional' : overall >= 0.7 ? 'Strong' : overall >= 0.55 ? 'Moderate' : 'Low',
    lexicalAppearance,
    spokenRecoverability,
    visualRecoverability,
    morphologyFit,
    registerFlexibility,
    dictionaryIllusion,
    historicalPlausibility,
    adoptionFriction,
  }
}

/** Count adjacent vowel pairs that are NOT clean diphthongs (spelling stumbles). */
function nonCleanVowelPairs(w: string): number {
  let count = 0
  for (let i = 0; i < w.length - 1; i++) {
    if (isVowel(w[i]) && isVowel(w[i + 1]) && !CLEAN_DIPHTHONGS.has(w.slice(i, i + 2))) count++
  }
  return count
}

/** How cleanly a word takes a suffix, from its final sound(s). */
function suffixability(w: string): number {
  if (w.length < 2) return 0.5
  const last = w[w.length - 1]
  const prev = w[w.length - 2]
  if (isVowel(last)) return 0.85 // vowel-final — very suffixable
  if (!isVowel(prev)) return 0.6 // consonant cluster at the end — resists suffixing
  return 0.9 // single consonant after a vowel — ideal stem
}
