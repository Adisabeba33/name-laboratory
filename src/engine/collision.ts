import type { Collision, CollisionReport } from './types'
import { COMMON_WORDS } from './data/dictionary'
import { KNOWN_WORDS } from './data/known-words'
import { editDistance } from './genome'
import { normalise } from './phonetics'

/**
 * The OFFLINE half of the collision check — free, deterministic, no network.
 *
 * It answers one honest question from a small bundled list: is this "coined" word
 * actually a common word / known name, or a near-miss of one? A negative result
 * means only "not in our built-in list" — never "verified unused in the world".
 * The authoritative check is the live lookup in `api/collision.ts`.
 */
export function offlineCollision(word: string): Collision {
  const w = normalise(word).replace(/[^a-zë-ü]/gi, '')
  if (COMMON_WORDS.has(w) || KNOWN_WORDS.has(w)) {
    return {
      match: 'exact',
      note: 'This is already a common word or known name in the built-in list.',
    }
  }
  // A one-edit neighbour of an everyday word reads as "basically that word".
  for (const known of COMMON_WORDS) {
    if (known.length >= 4 && editDistance(w, known) === 1) {
      return {
        match: 'near',
        note: `Very close to the everyday word "${known}" — may not read as new.`,
      }
    }
  }
  return {
    match: 'none',
    note: 'Not in the built-in word list. This does not confirm it is unused — run the live check.',
  }
}

/**
 * A crude phonetic key — how the word *sounds*, so a different spelling of an
 * existing word ("Kwik" ~ "quick") is caught. Deliberately simple, not IPA.
 */
export function phoneticKey(word: string): string {
  return normalise(word)
    .replace(/[^a-z]/g, '')
    .replace(/qu/g, 'kw')
    .replace(/ck/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/x/g, 'ks')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/y/g, 'i')
    .replace(/(.)\1+/g, '$1') // collapse doublings
    .replace(/e$/, '') // drop a silent final e
}

/** Precomputed sound-keys of every everyday word, for O(1) phonetic lookup. */
const PHONETIC_KEYS: Set<string> = new Set([...COMMON_WORDS].map(phoneticKey))

/**
 * Engine v0.36 Phase 4 — layered collision analysis.
 *
 * Replaces the not-credible single "collision: none" with separate layers. The
 * offline-checkable ones (built-in list, phonetic neighbour, short-word occupancy
 * prior) are computed; the external ones (proper names, brands, domains,
 * trademarks, other languages) are honestly reported as not checked. The overall
 * status stays "Unverified" until real external checks run.
 */
export function buildCollisionReport(word: string): CollisionReport {
  const w = normalise(word).replace(/[^a-zë-ü]/gi, '')
  const internal = offlineCollision(word).match

  // Phonetic: sounds like an everyday word (different spelling) → higher prior.
  const key = phoneticKey(w)
  const phonetic: CollisionReport['phonetic'] =
    internal !== 'none' || PHONETIC_KEYS.has(key)
      ? 'high'
      : [...PHONETIC_KEYS].some((k) => k.length >= 4 && editDistance(key, k) === 1)
        ? 'moderate'
        : 'low'

  // Short-word occupancy prior (spec §14): short forms are far likelier to be taken.
  const shortWordRisk: CollisionReport['shortWordRisk'] =
    w.length <= 4 ? 'high' : w.length <= 6 ? 'moderate' : 'low'

  const internalHit = internal === 'exact' || internal === 'near'
  const status: CollisionReport['status'] = internalHit ? 'Internal collision' : 'Unverified'

  const summary = internalHit
    ? `Collides with the built-in list (${internal}). External brand / domain / trademark / cross-language checks were not performed.`
    : `Clear against the built-in list only. Proper names, brands, domains, trademarks and other languages were NOT checked — treat as unverified${
        shortWordRisk === 'high' ? '; short forms are especially likely to be occupied' : ''
      }.`

  return {
    internalDictionary: internal === 'none' ? 'clear' : internal,
    phonetic,
    shortWordRisk,
    properName: 'not_checked',
    brand: 'not_checked',
    domain: 'not_checked',
    trademark: 'not_checked',
    multilingual: 'not_checked',
    status,
    confidence: 'low',
    summary,
  }
}
