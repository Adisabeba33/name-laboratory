import type { Language } from './data/languages'
import { KNOWN_WORDS } from './data/known-words'
import { Rng } from './rng'
import {
  awkwardClusters,
  countSyllables,
  isVowel,
  longestVowelRun,
  normalise,
  pronounceability,
} from './phonetics'
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
const POOL_FACTOR = 6

/**
 * Default bias toward everyday speech. 0 = ornate words allowed (elaborate,
 * "incantation" shapes), 1 = strictly speakable. The default leans speakable so
 * a fresh run reads as words a person could actually say, not a spell.
 */
export const DEFAULT_SPEAKABILITY = 0.7

/**
 * The knobs a given speakability setting unlocks. Everything the synthesiser
 * needs to know derives from one 0–1 dial, so the UI can expose a single slider.
 */
interface SpeakControls {
  /** Minimum {@link pronounceability} a word must clear to be shipped by default. */
  floor: number
  /** Hard cap on syllables (long words read as spells). */
  maxSyllables: number
  /** Longest run of adjacent vowels allowed (vowel walls are unsayable). */
  maxVowelRun: number
  /** `awkwardClusters` must be below this (0.5 = reject any non-onset pair). */
  clusterLimit: number
  /** Maximum romanised length. */
  maxLen: number
  /** Whether vowel runs are collapsed to whitelisted diphthongs only. */
  strict: boolean
}

/** Map the single 0–1 dial onto the concrete phonotactic limits. */
function speakControls(speakability: number): SpeakControls {
  const s = Math.max(0, Math.min(1, speakability))
  const strict = s >= 0.5
  return {
    floor: 0.3 + s * 0.42, // s=1 → 0.72, s=0.7 → ~0.59, s=0 → 0.30
    maxSyllables: s >= 0.66 ? 3 : 4,
    maxVowelRun: strict ? 2 : 3,
    clusterLimit: strict ? 0.5 : 1,
    maxLen: strict ? 9 : 10,
    strict,
  }
}

/**
 * Speak `count` distinct native words of a language.
 *
 * `speakability` (0–1, default {@link DEFAULT_SPEAKABILITY}) biases the whole run
 * toward everyday speech: it sets a pronounceability floor, caps syllables and
 * vowel runs, and tidies vowel walls. Diversity selection then runs *inside* the
 * speakable set, so words stay mutually different without the "incantation" shapes
 * that pure max-diversity selection used to reward. If too few words clear the
 * floor, it relaxes gracefully so a run always yields something.
 */
export function speakNative(
  lang: Language,
  rng: Rng,
  count: number,
  speakability: number = DEFAULT_SPEAKABILITY,
): NativeVocabulary {
  const ctl = speakControls(speakability)
  const prototype = buildPrototype(lang)
  const pool: string[] = []
  const seen = new Set<string>()

  const target = count * POOL_FACTOR
  let guard = 0
  while (pool.length < target && guard++ < target * 16) {
    const word = smoothVowels(tidy(generateWord(lang, rng, ctl.maxSyllables)), ctl)
    const key = word.toLowerCase()
    if (
      key.length >= 4 &&
      key.length <= ctl.maxLen &&
      countSyllables(word) <= ctl.maxSyllables &&
      !seen.has(key) &&
      !KNOWN_WORDS.has(key) &&
      awkwardClusters(word) < ctl.clusterLimit &&
      longestVowelRun(word) <= ctl.maxVowelRun &&
      hasVowel(word)
    ) {
      seen.add(key)
      pool.push(capitalise(word))
    }
  }

  return { words: selectSpeakable(pool, count, ctl.floor), prototype }
}

/**
 * Choose `count` words that are both speakable and mutually different. Words that
 * clear the pronounceability floor are preferred (most speakable first, so ties
 * resolve toward sayable), and diversity is maximised *within* that set. Only if
 * too few clear the floor do we fall back to the wider pool — the run always
 * returns words, but never reaches for a spell-shape while a speakable one exists.
 */
function selectSpeakable(pool: string[], count: number, floor: number): string[] {
  if (pool.length <= count) return pool
  const scored = pool
    .map((w) => ({ w, s: pronounceability(w) }))
    .sort((a, b) => b.s - a.s)
  const speakable = scored.filter((x) => x.s >= floor).map((x) => x.w)
  if (speakable.length >= count) return selectDiverse(speakable, count)
  // Not enough cleared the floor — top up from the most-speakable remainder.
  const ordered = scored.map((x) => x.w)
  return selectDiverse(ordered, count)
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
function generateWord(lang: Language, rng: Rng, maxSyllables: number): string {
  const [min, max] = lang.syllables
  const hi = Math.max(1, Math.min(max, maxSyllables))
  const lo = Math.min(min, hi)
  const sylCount = lo + rng.int(hi - lo + 1)

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

/**
 * Vowel pairs a speaker glides through as one sound. Runs of vowels that are not
 * one of these read as a stumble ("oarlau", "eoa"); we collapse them.
 */
const DIPHTHONGS = new Set([
  'ai', 'ei', 'oi', 'au', 'ou', 'eu', 'ia', 'io', 'ie', 'ea', 'ua', 'ue', 'uo', 'ao', 'oa',
])

/**
 * Tame vowel walls so a word stays sayable. Any run of adjacent vowels is reduced
 * to at most `maxVowelRun`; in strict mode a 2-vowel run survives only if it is a
 * real diphthong, otherwise it drops to a single vowel. This is what turns
 * "Groarlaudo" into "Grondo"-shaped, speakable output.
 */
function smoothVowels(word: string, ctl: SpeakControls): string {
  let out = ''
  let run = ''
  const flush = () => {
    if (run.length <= 1) {
      out += run
    } else {
      const two = run.slice(0, 2).toLowerCase()
      if (ctl.strict) {
        out += DIPHTHONGS.has(two) ? run.slice(0, 2) : run[0]
      } else if (run.length <= ctl.maxVowelRun) {
        out += run
      } else {
        out += DIPHTHONGS.has(two) ? run.slice(0, 2) : run[0]
      }
    }
    run = ''
  }
  for (const ch of word) {
    if (isVowel(ch)) run += ch
    else {
      flush()
      out += ch
    }
  }
  flush()
  return out
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
