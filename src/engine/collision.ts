import type { Collision } from './types'
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
