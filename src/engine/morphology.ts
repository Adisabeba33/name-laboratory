import type { WordForm, WordParadigm } from './types'
import { Rng, hashSeed } from './rng'
import { isVowel, normalise } from './phonetics'

/**
 * Engine V6 — morphological word families.
 *
 * A living word is not one frozen form: a real word bends into a verb, an
 * adjective, an adverb, an agent noun. This grows that paradigm from a coined
 * root so the word can actually be *used* across a sentence, not just admired.
 *
 * Honesty (invariant #6): these are the coined root inflected with the HOST
 * language's (English) derivational morphology — "how this word would bend if it
 * entered English", deployable in a real EN sentence. It is NOT a claim about the
 * grammar of the invented sound-world, and the UI/report say so. Deterministic:
 * the suffix chosen for a given (word, role) is fixed by a seed hashed from the
 * word, so a family is stable across runs.
 */

/** English-deployable derivational suffixes, per grammatical role. */
const VERB_SUFFIXES = ['ate', 'ify', 'en']
const ADJ_SUFFIXES = ['ic', 'ine', 'al', 'ous']
const AGENT_SUFFIXES = ['ist', 'ian', 'er']

/**
 * Grow a small paradigm from a coined root: verb, adjective, adverb, agent noun.
 * `anchor` is a short human label for the meaning (e.g. the lead concept's noun),
 * used only to phrase each form's usage gloss.
 */
export function computeParadigm(word: string, anchor: string): WordParadigm {
  const rng = new Rng(hashSeed(`morph:${word.toLowerCase()}`))
  const stem = rootStem(word)

  const verb = attachSuffix(stem, pick(VERB_SUFFIXES, rng))
  const adjective = attachSuffix(stem, pick(ADJ_SUFFIXES, rng))
  const adverb = adverbOf(adjective)
  const agent = attachSuffix(stem, pick(AGENT_SUFFIXES, rng))

  const forms: WordForm[] = [
    { role: 'verb', form: cap(verb), gloss: `to bring about ${anchor}` },
    { role: 'adjective', form: cap(adjective), gloss: `having the quality of ${anchor}` },
    { role: 'adverb', form: cap(adverb), gloss: `in a ${anchor} way` },
    { role: 'agent noun', form: cap(agent), gloss: `one who embodies ${anchor}` },
  ]
  return { root: cap(word), forms }
}

/**
 * The stem a suffix attaches to. We keep the whole word (it is already the noun),
 * only trimming a single trailing vowel so a vowel-initial suffix does not stack
 * a wall of vowels ("Viava" + "ic" → "Viavic", not "Viavaic").
 */
function rootStem(word: string): string {
  const w = normalise(word)
  return w.length > 3 && isVowel(w[w.length - 1]) ? w.slice(0, -1) : w
}

/** Attach a derivational suffix with light euphony so the seam stays sayable. */
function attachSuffix(stem: string, suffix: string): string {
  const last = stem[stem.length - 1]
  const first = suffix[0]
  // consonant meeting the same consonant: drop the doubling ("...t" + "ta" → "...ta").
  if (last === first && !isVowel(last)) return stem.slice(0, -1) + suffix
  // vowel meeting vowel is already prevented by rootStem, but guard anyway.
  if (isVowel(last) && isVowel(first)) return stem.slice(0, -1) + suffix
  return stem + suffix
}

/**
 * Adverb from the adjective, the way English does it: "-ic" adjectives take
 * "-ally" (basic → basically), everything else takes "-ly".
 */
function adverbOf(adjective: string): string {
  if (adjective.endsWith('ic')) return adjective + 'ally'
  if (adjective.endsWith('le')) return adjective.slice(0, -1) + 'y'
  return adjective + 'ly'
}

function pick(list: string[], rng: Rng): string {
  return list[rng.int(list.length)]
}

function cap(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
