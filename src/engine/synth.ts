import type { Language } from './data/languages'
import { KNOWN_WORDS } from './data/known-words'
import { Rng } from './rng'
import { awkwardClusters, isVowel, normalise } from './phonetics'

/**
 * Native-speaker word synthesis.
 *
 * Words are generated as native speakers of a language: each is assembled from
 * the language's own phoneme inventory and obeys its cadence, so the whole set
 * shares a sound world without being stem-mutations of one another. Internal
 * diversity comes from varying syllable counts, coda presence and endings —
 * "words a native speaker would naturally coin", not "Kaix / Kaon / Kaint".
 */
export interface NativeVocabulary {
  /** Distinct native words, capitalised. */
  words: string[]
  /** The language's canonical minimal specimen (for evolution distance). */
  prototype: string
}

/** Speak `count` distinct native words of a language. */
export function speakNative(lang: Language, rng: Rng, count: number): NativeVocabulary {
  const words: string[] = []
  const seen = new Set<string>()
  const prototype = buildPrototype(lang)

  let guard = 0
  while (words.length < count && guard++ < count * 12) {
    const raw = generateWord(lang, rng)
    const word = tidy(raw)
    const key = word.toLowerCase()
    if (
      key.length >= 4 &&
      key.length <= 10 &&
      !seen.has(key) &&
      !KNOWN_WORDS.has(key) &&
      awkwardClusters(word) < 1 &&
      hasVowel(word)
    ) {
      seen.add(key)
      words.push(capitalise(word))
    }
  }
  return { words, prototype }
}

/** The language's canonical, minimal word — its evolutionary "root form". */
function buildPrototype(lang: Language): string {
  const stem = lang.onsets[0] + lang.nuclei[0]
  return tidy(stem + lang.endings[0])
}

/** Assemble one native word from the language's phonotactics. */
function generateWord(lang: Language, rng: Rng): string {
  const [min, max] = lang.syllables
  const sylCount = min + rng.int(max - min + 1)

  let word = ''
  for (let i = 0; i < sylCount; i++) {
    const first = i === 0
    const onset = rng.pick(first ? lang.onsets : lang.medials)
    const nucleus = rng.pick(lang.nuclei)
    const wantCoda = i < sylCount - 1 || rng.next() < lang.codaBias
    const coda = wantCoda && rng.next() < lang.codaBias ? rng.pick(lang.codas) : ''
    word = joinSyllable(word, onset, nucleus, coda)
  }

  // Sometimes finish on a signature ending instead of the last raw coda.
  if (rng.next() < lang.endingBias) {
    word = attachEnding(word, rng.pick(lang.endings), lang, rng)
  }
  return word
}

/** Append a syllable (onset+nucleus+coda) to the word so far, smoothing seams. */
function joinSyllable(word: string, onset: string, nucleus: string, coda: string): string {
  let piece = onset + nucleus + coda
  if (word === '') return piece

  const prev = word[word.length - 1]
  const next = piece[0]
  // vowel meeting vowel: drop the incoming leading vowel.
  if (isVowel(prev) && isVowel(next)) {
    piece = piece.replace(/^[aeiouyë-ü]+/, '') || piece
  }
  // onset was itself vowel-led (e.g. "ae"): avoid a wall of vowels.
  return word + piece
}

/** Attach a signature ending with euphony (keeps the word pronounceable). */
function attachEnding(word: string, ending: string, lang: Language, rng: Rng): string {
  const wordVowel = isVowel(word[word.length - 1])
  const endVowel = isVowel(ending[0])
  if (wordVowel && endVowel) {
    const trimmed = ending.replace(/^[aeiouyë-ü]+/, '')
    return trimmed.length >= 2 ? word + trimmed : word.slice(0, -1) + ending
  }
  if (!wordVowel && !endVowel) {
    return word + rng.pick(lang.nuclei)[0] + ending
  }
  return word + ending
}

function hasVowel(word: string): boolean {
  return [...word].some(isVowel)
}

/** Collapse triple letters, doubled vowels and stray characters. */
function tidy(word: string): string {
  return normalise(word)
    .replace(/[^a-zë-ü]/gi, '')
    .replace(/(.)\1\1+/g, '$1$1')
    .replace(/(.)\1/g, (m, c: string) => (isVowel(c) ? c : m))
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
