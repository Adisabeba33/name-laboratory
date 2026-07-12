import type { PronunciationRating, WordGenome } from './types'
import { awkwardClusters, isVowel, normalise } from './phonetics'

/**
 * Cross-language pronounceability, rendered as 1–5 stars per language.
 *
 * Each language has a light model of what it finds easy: some tolerate consonant
 * clusters, some prefer strict CV syllables, some struggle with particular
 * letters. This is intentionally approximate — enough to warn a founder that a
 * name is hard in, say, Japanese, without pretending to be a phonology engine.
 */
interface LangModel {
  language: string
  /** Letters this language handles poorly. */
  hard: string[]
  /** Penalty per awkward consonant cluster. */
  clusterPenalty: number
  /** Bonus for words that end in an open vowel. */
  prefersOpenEnding: boolean
}

const LANGUAGES: LangModel[] = [
  { language: 'English', hard: [], clusterPenalty: 0.4, prefersOpenEnding: false },
  { language: 'Spanish', hard: ['w', 'k'], clusterPenalty: 0.5, prefersOpenEnding: true },
  { language: 'Russian', hard: [], clusterPenalty: 0.2, prefersOpenEnding: false },
  { language: 'Japanese', hard: ['l', 'v', 'x', 'q'], clusterPenalty: 1.1, prefersOpenEnding: true },
  { language: 'French', hard: [], clusterPenalty: 0.5, prefersOpenEnding: true },
]

export function ratePronunciation(word: string, genome: WordGenome): PronunciationRating[] {
  const w = normalise(word)
  const clusters = awkwardClusters(w)
  const endsOpen = isVowel(w[w.length - 1] ?? '')

  return LANGUAGES.map((lang) => {
    let score = 5

    // Base difficulty from the word's own pronounceability.
    score -= (1 - genome.pronounceability) * 2

    // Awkward clusters bite harder in some languages.
    score -= clusters * lang.clusterPenalty

    // Hard letters cost half a star each (once).
    const hardHits = lang.hard.filter((h) => w.includes(h)).length
    score -= hardHits * 0.75

    // Open-ending preference.
    if (lang.prefersOpenEnding && !endsOpen) score -= 0.75
    if (lang.prefersOpenEnding && endsOpen) score += 0.25

    const stars = Math.max(1, Math.min(5, Math.round(score)))
    return { language: lang.language, stars }
  })
}
