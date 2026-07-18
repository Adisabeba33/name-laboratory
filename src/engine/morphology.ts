import type { RejectedForm, WordForm, WordParadigm } from './types'
import type { Language } from './data/languages'
import { Rng, hashSeed } from './rng'
import { awkwardClusters, collectClusters, isVowel, normalise, pronounceability } from './phonetics'
import { naturalness, type NaturalnessContext } from './naturalness'

/**
 * Engine V6 — morphological word families.
 *
 * A living word is not one frozen form: a real word bends into a verb, an
 * adjective, an agent noun (and, where the language forms one, an adverb). This
 * grows that paradigm from a coined root so the word can actually be *used*, not
 * just admired.
 *
 * Honesty (invariant #6): these forms are a CONSTRUCTED grammar for the word's own
 * invented sound-world — the coined root taking that language's OWN derivational
 * suffixes (Slavic -nik, Greek -ikos, Japanese -sha…), chosen to echo the real
 * family the accent draws on. They are NOT English inflections and NOT a historical
 * claim; the UI/report label them as the word's native paradigm. Deterministic: the
 * suffix for a given (word, role) is fixed by a seed hashed from the word.
 */

/**
 * Fallback English-deployable suffixes, used only when a word is inflected without
 * a language (a standalone/evolved passport). Every real run passes the language.
 */
const VERB_SUFFIXES = ['ate', 'ify', 'en']
const ADJ_SUFFIXES = ['ic', 'ine', 'al', 'ous']
const AGENT_SUFFIXES = ['ist', 'ian', 'er']

/**
 * Grow a small paradigm from a coined root: verb, adjective, agent noun, and an
 * adverb where the language forms one. `anchor` is a short human label for the
 * meaning, used only to phrase each form's usage gloss. `language` supplies the
 * word's own derivational suffixes and its phonology (so a native cluster at the
 * seam is judged by that language's rules, not a fixed Latin ideal).
 */
export function computeParadigm(word: string, anchor: string, language?: Language): WordParadigm {
  const rng = new Rng(hashSeed(`morph:${word.toLowerCase()}`))
  const stem = rootStem(word)
  const m = language?.morphology

  const adjective = attachSuffix(stem, pick(m?.adjective ?? ADJ_SUFFIXES, rng))
  const candidates: WordForm[] = [
    { role: 'verb', form: cap(attachSuffix(stem, pick(m?.verb ?? VERB_SUFFIXES, rng))), gloss: `to bring about ${anchor}` },
    { role: 'adjective', form: cap(adjective), gloss: `having the quality of ${anchor}` },
  ]
  // Adverb only where the language forms one by suffix (its own suffix, or — for the
  // no-language fallback — the English -ly rule). Many languages form none.
  const adverb = m
    ? (m.adverb?.length ? cap(attachSuffix(stem, pick(m.adverb, rng))) : null)
    : cap(adverbOf(adjective))
  if (adverb) candidates.push({ role: 'adverb', form: adverb, gloss: `in a ${anchor} way` })
  candidates.push({
    role: 'agent noun',
    form: cap(attachSuffix(stem, pick(m?.agent ?? AGENT_SUFFIXES, rng))),
    gloss: `one who embodies ${anchor}`,
  })

  // v0.36 P3 — validate each derivation against the language's own phonology; keep
  // only forms that sound natural for it, record the rest as honestly rejected.
  const ctx = language ? nativePhonology(language) : {}
  const forms: WordForm[] = []
  const rejected: RejectedForm[] = []
  for (const c of candidates) {
    const reason = rejectionReason(c.form, ctx)
    if (reason) rejected.push({ role: c.role, form: c.form, reason: `no natural ${c.role} — ${reason}` })
    else forms.push(c)
  }
  return { root: cap(word), forms, rejected }
}

/** The language's own phonology (clusters + native letters) for form validation. */
function nativePhonology(lang: Language): NaturalnessContext {
  const m = lang.morphology
  const allowed = collectClusters([
    ...lang.onsets, ...lang.medials, ...lang.codas,
    ...m.verb, ...m.adjective, ...m.agent, ...(m.adverb ?? []),
  ])
  const native = new Set<string>()
  for (const piece of [
    ...lang.onsets, ...lang.medials, ...lang.nuclei, ...lang.codas, ...lang.endings,
    ...m.verb, ...m.adjective, ...m.agent, ...(m.adverb ?? []),
  ]) {
    for (const ch of piece.toLowerCase()) if (/[a-zë-ü]/.test(ch)) native.add(ch)
  }
  return { allowed, native }
}

/** Why a derived form reads as forced, or null if it is natural enough to keep. */
function rejectionReason(form: string, ctx: NaturalnessContext): string | null {
  const w = normalise(form)
  if (w.length > 13) return 'the form runs too long to be usable'
  if (awkwardClusters(w, ctx.allowed) >= 1) return 'an awkward consonant cluster at the seam'
  if (/(.)\1\1/.test(w)) return 'a run of repeated letters'
  if (pronounceability(w) < 0.5) return 'it is hard to pronounce'
  if (naturalness(form, ctx) < 0.58) return 'it sounds artificial'
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
