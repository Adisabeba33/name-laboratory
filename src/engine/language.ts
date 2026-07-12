import type { LanguageGenome, WordEvolution, WordGenome } from './types'
import type { Language } from './data/languages'
import { editDistance } from './genome'
import { vowelRatio, visualSymmetry } from './phonetics'

/**
 * Language-level DNA and per-word evolution.
 *
 * The Language Genome describes the *language itself* — its phonotactic
 * tendencies and rate of change — measured from a sample of its native words
 * plus its authored descriptors. Each word then gets an evolution profile: how
 * far it has travelled from the language's canonical form, which makes a word
 * read as a living specimen of its species rather than an isolated invention.
 */
export function computeLanguageGenome(lang: Language, sample: string[]): LanguageGenome {
  const avgVowel =
    sample.length > 0
      ? sample.reduce((s, w) => s + vowelRatio(w), 0) / sample.length
      : 0.45
  const avgSymmetry =
    sample.length > 0
      ? sample.reduce((s, w) => s + visualSymmetry(w), 0) / sample.length
      : 0.5

  // Language-level symmetry reads as *structural regularity*: a low-entropy
  // language is highly symmetric. Anchor on entropy, nudge by the sample.
  const symmetryBase = { Low: 90, Medium: 74, High: 60 }[lang.entropy]
  const symmetry = clampInt(symmetryBase + Math.round((avgSymmetry - 0.5) * 16), 45, 96)

  return {
    consonantDensity: avgVowel < 0.4 ? 'High' : avgVowel < 0.48 ? 'Medium' : 'Low',
    preferredVowels: preferredVowels(lang),
    cadence: lang.cadence,
    stressPattern: lang.stressPattern,
    visualSymmetry: symmetry,
    entropy: lang.entropy,
    mutationRate: lang.mutationRate,
    emotionalGravity: lang.weight > 0.65 ? 'High' : lang.weight > 0.45 ? 'Medium' : 'Low',
    evolutionSpeed: lang.evolutionSpeed,
    preferredEndings: lang.endings.slice(0, 3).map((e) => `-${e}`),
  }
}

/** The two vowels the language reaches for most, formatted "A / I". */
function preferredVowels(lang: Language): string {
  const seen: string[] = []
  for (const nucleus of lang.nuclei) {
    const v = nucleus[0].toUpperCase()
    if (!seen.includes(v)) seen.push(v)
    if (seen.length >= 2) break
  }
  return seen.join(' / ')
}

/** Build a word's evolution profile relative to its language. */
export function computeWordEvolution(
  word: string,
  genome: WordGenome,
  lang: Language,
  generation: number,
  reference: string,
  prototype: string,
): WordEvolution {
  const w = word.toLowerCase()
  // Scaled so the numbers read as within-language variation, not disjoint words:
  // mutation is divergence from the language's canonical (generation-1) specimen,
  // evolution distance is travel from its root prototype.
  const mutation = relativeDistance(w, reference.toLowerCase()) * 45
  const evolutionDistance = relativeDistance(w, prototype.toLowerCase()) * 0.45

  // Visual balance reads as overall written poise, not strict mirroring — blend
  // symmetry with rhythmic and syllabic evenness so it's meaningful per word.
  const visualBalance =
    genome.visualSymmetry * 0.25 + genome.rhythm * 0.45 + genome.syllableHarmony * 0.3

  return {
    parentLanguage: lang.character,
    generation,
    mutation: Math.round(mutation),
    visualBalance: Math.round(visualBalance * 100),
    originality: Math.round(genome.uniqueness * 100),
    memorability: Math.round(genome.memorability * 100),
    phoneticStability: Math.round(genome.pronounceability * 100),
    evolutionDistance: Math.round(evolutionDistance * 100) / 100,
  }
}

/** Edit distance normalised by the longer string (0 = identical, 1 = disjoint). */
function relativeDistance(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  if (max === 0) return 0
  return Math.min(1, editDistance(a, b) / max)
}

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
