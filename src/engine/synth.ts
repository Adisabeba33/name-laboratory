import type { Language } from './data/languages'
import { KNOWN_WORDS } from './data/known-words'
import { Rng } from './rng'
import { awkwardClusters, countSyllables, isVowel, normalise } from './phonetics'
import { editDistance } from './genome'

/**
 * Native-speaker word synthesis.
 *
 * Words are generated as native speakers of a language: each is assembled from
 * the language's own phoneme inventory and obeys its cadence, so the whole set
 * shares a sound world without being stem-mutations of one another. To guarantee
 * that internal diversity (rather than hope for it), we over-generate a candidate
 * pool and then select the most *mutually different* subset — spreading them
 * across syllable counts, onsets, endings and overall shape — so the result reads
 * as "words a native speaker would coin", never "Kaix / Kaon / Kaint".
 */
export interface NativeVocabulary {
  /** Distinct native words, capitalised. */
  words: string[]
  /** The language's canonical minimal specimen (for evolution distance). */
  prototype: string
}

/** How many candidates to pool per requested word before selecting for diversity. */
const POOL_FACTOR = 5

/** Speak `count` distinct native words of a language. */
export function speakNative(lang: Language, rng: Rng, count: number): NativeVocabulary {
  const prototype = buildPrototype(lang)
  const pool: string[] = []
  const seen = new Set<string>()

  const target = count * POOL_FACTOR
  let guard = 0
  while (pool.length < target && guard++ < target * 12) {
    const word = tidy(generateWord(lang, rng))
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
      pool.push(capitalise(word))
    }
  }

  return { words: selectDiverse(pool, count), prototype }
}

/**
 * Greedily pick the most mutually-different subset (max-min diversity): start
 * from the first candidate, then repeatedly add the candidate whose *closest*
 * already-picked neighbour is the furthest away. This maximises spread and, in
 * particular, avoids two words that share a stem (the "template mutation" smell).
 */
function selectDiverse(pool: string[], count: number): string[] {
  if (pool.length <= count) return pool
  const picked = [pool[0]]
  const rest = pool.slice(1)
  while (picked.length < count && rest.length) {
    let bestIdx = 0
    let bestScore = -Infinity
    for (let i = 0; i < rest.length; i++) {
      let nearest = Infinity
      for (const p of picked) nearest = Math.min(nearest, wordDistance(rest[i], p))
      if (nearest > bestScore) {
        bestScore = nearest
        bestIdx = i
      }
    }
    picked.push(rest.splice(bestIdx, 1)[0])
  }
  return picked
}

/**
 * How different two words are (higher = more different). Blends normalised edit
 * distance with structural signals, and heavily penalises a shared prefix so
 * suffix-variations of one root never both survive.
 */
function wordDistance(a: string, b: string): number {
  const la = normalise(a)
  const lb = normalise(b)
  let d = editDistance(la, lb) / Math.max(la.length, lb.length, 1)
  const prefix = commonPrefixLength(la, lb)
  if (prefix >= 3) d -= 0.6
  else if (prefix === 2) d -= 0.25
  if (countSyllables(la) !== countSyllables(lb)) d += 0.15
  if (la[la.length - 1] !== lb[lb.length - 1]) d += 0.05
  return d
}

function commonPrefixLength(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
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
