import type { RejectedForm, WordForm, WordParadigm } from './types'
import { Rng, hashSeed } from './rng'
import { awkwardClusters, isVowel, normalise, pronounceability } from './phonetics'
import { naturalness } from './naturalness'

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

  const adjective = attachSuffix(stem, pick(ADJ_SUFFIXES, rng))
  const candidates: WordForm[] = [
    { role: 'verb', form: cap(attachSuffix(stem, pick(VERB_SUFFIXES, rng))), gloss: `to bring about ${anchor}` },
    { role: 'adjective', form: cap(adjective), gloss: `having the quality of ${anchor}` },
    { role: 'adverb', form: cap(adverbOf(adjective)), gloss: `in a ${anchor} way` },
    { role: 'agent noun', form: cap(attachSuffix(stem, pick(AGENT_SUFFIXES, rng))), gloss: `one who embodies ${anchor}` },
  ]

  // v0.36 P3 — validate each derivation; keep only forms that sound natural, and
  // record the rest as honestly rejected (a word may stay noun-only).
  const forms: WordForm[] = []
  const rejected: RejectedForm[] = []
  for (const c of candidates) {
    const reason = rejectionReason(c.form)
    if (reason) rejected.push({ role: c.role, form: c.form, reason: `no natural ${c.role} — ${reason}` })
    else forms.push(c)
  }
  return { root: cap(word), forms, rejected }
}

/** Why a derived form reads as forced, or null if it is natural enough to keep. */
function rejectionReason(form: string): string | null {
  const w = normalise(form)
  if (w.length > 13) return 'the form runs too long to be usable'
  if (awkwardClusters(w) >= 1) return 'an awkward consonant cluster at the seam'
  if (/(.)\1\1/.test(w)) return 'a run of repeated letters'
  if (pronounceability(w) < 0.5) return 'it is hard to pronounce'
  if (naturalness(form) < 0.58) return 'it sounds artificial'
  return null
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
