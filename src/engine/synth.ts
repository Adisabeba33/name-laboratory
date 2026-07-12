import type { Archetype } from './data/archetypes'
import { KNOWN_WORDS } from './data/known-words'
import { Rng } from './rng'
import { awkwardClusters, isVowel, normalise } from './phonetics'

/**
 * Word synthesis.
 *
 * Replaces the old "glue two roots" assembler. A word is grown *inside* an
 * archetype from its phoneme inventory, so nothing of the source roots shows
 * through — the word reads as discovered, not assembled.
 *
 * A family shares a **stem** (its first syllable or two) and differs only in the
 * tail, so its members are unmistakably kin — Kael·on, Kael·ith, Kael·or — while
 * different archetypes yield stems that sound nothing alike.
 */
export interface SynthFamily {
  /** The shared stem, lowercased (e.g. "kael"). */
  stem: string
  /** The kin words, capitalised (e.g. ["Kaelon", "Kaelith", "Kaelor"]). */
  members: string[]
}

/** Grow one family: a shared stem plus `size` distinct, pronounceable kin words. */
export function growFamily(a: Archetype, rng: Rng, size = 3): SynthFamily {
  // Try a few stems; keep the first that yields enough good members.
  for (let attempt = 0; attempt < 6; attempt++) {
    const stem = buildStem(a, rng)
    const members = growMembers(a, stem, rng, size)
    if (members.length >= Math.min(2, size)) {
      return { stem, members }
    }
  }
  // Fallback: a minimal stem with whatever members we can grow.
  const stem = buildStem(a, rng)
  return { stem, members: growMembers(a, stem, rng, size) }
}

/** A stem is one syllable, sometimes closed with a consonant: on·set + nucleus (+ coda). */
function buildStem(a: Archetype, rng: Rng): string {
  const onset = rng.pick(a.onsets)
  const nucleus = rng.pick(a.nuclei)
  let stem = onset + nucleus
  // Some onsets already carry a vowel (e.g. "sol", "ae"); avoid vowel pile-ups.
  if (isVowel(onset[onset.length - 1]) && isVowel(nucleus[0])) {
    stem = onset + nucleus.slice(1)
  }
  if (rng.next() < a.codaBias) {
    stem += rng.pick(a.codas)
  }
  return tidy(stem)
}

/** Grow `size` distinct kin words from a stem by attaching different tails. */
function growMembers(a: Archetype, stem: string, rng: Rng, size: number): string[] {
  const endings = rng.shuffle(a.endings)
  const out: string[] = []
  const seen = new Set<string>()
  // Members must open with the family's shared stem so they read as kin.
  const cohesion = stem.slice(0, Math.min(2, stem.length))

  const tryAdd = (raw: string) => {
    const word = tidy(raw)
    const key = word.toLowerCase()
    if (
      key.length >= 4 &&
      key.length <= 10 &&
      key.startsWith(cohesion) &&
      !seen.has(key) &&
      !KNOWN_WORDS.has(key) &&
      awkwardClusters(word) < 1
    ) {
      seen.add(key)
      out.push(capitalise(word))
      return true
    }
    return false
  }

  // Most members: stem + a distinct ending.
  for (const ending of endings) {
    if (out.length >= size) break
    tryAdd(attach(stem, ending, a, rng))
  }

  // If we still need variety, grow a longer, two-syllable variant.
  let guard = 0
  while (out.length < size && guard++ < 8) {
    const bridge = rng.pick(a.nuclei)
    const extended = attach(stem, bridge + rng.pick(a.codas), a, rng)
    tryAdd(attach(extended, rng.pick(endings), a, rng))
  }

  return out
}

/** Attach a tail to a stem with euphony rules, so the seam never sounds bolted on. */
function attach(stem: string, tail: string, a: Archetype, rng: Rng): string {
  const stemVowel = isVowel(stem[stem.length - 1])
  const tailVowel = isVowel(tail[0])

  if (stemVowel && tailVowel) {
    // vowel + vowel: drop the tail's leading vowel(s) so the *stem* survives
    // intact and the family stays cohesive (ya + ith → yath, ya + iel → yael).
    const trimmed = tail.replace(/^[aeiouyë-ü]+/, '')
    if (trimmed.length >= 2) return stem + trimmed
    // Tail was mostly vowels: drop the stem's final vowel as a fallback.
    return stem.slice(0, -1) + tail
  }
  if (!stemVowel && !tailVowel) {
    // consonant + consonant: bridge with a light vowel from the archetype.
    return stem + rng.pick(a.nuclei)[0] + tail
  }
  return stem + tail
}

/** Collapse triple letters and strip stray characters. */
function tidy(word: string): string {
  return normalise(word)
    .replace(/[^a-zë-ü]/gi, '')
    .replace(/(.)\1\1+/g, '$1$1')
    .replace(/(.)\1/g, (m, c: string) => (isVowel(c) ? c : m)) // no doubled vowels
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
