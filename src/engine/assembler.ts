import type { CreativeMode, Root } from './types'
import { MODES } from './data/modes'
import { Rng } from './rng'
import { isVowel, normalise } from './phonetics'

/**
 * Steps 4–6 of the pipeline: Linguistic Structure → Phonetics → Word.
 *
 * Given two meaning-bearing roots and a creative mode, fuse them into an original
 * word. This is deliberately *constructive*, not random: roots are overlapped at
 * shared phonemes, awkward junctions get a euphonic vowel, and a mode-appropriate
 * ending is grown so the result reads as if it evolved naturally in a language.
 */
export interface Candidate {
  word: string
  head: Root
  tail: Root
  /** How the ending was produced, for the origin story. */
  ending: string
}

const CONNECTORS = ['a', 'i', 'o', 'e', 'u']

/**
 * Produce several candidate words from a head/tail root pair. Variety comes from
 * different junction strategies and endings; the caller scores and ranks them.
 */
export function assemble(
  head: Root,
  tail: Root,
  mode: CreativeMode,
  rng: Rng,
): Candidate[] {
  const profile = MODES[mode]
  const h = trimHead(normalise(head.form))
  const t = trimTail(normalise(tail.form))

  const candidates: Candidate[] = []
  const junctions = [
    () => fuse(h, t),
    () => fuse(h, t, rng.pick(CONNECTORS)),
    () => overlap(h, t),
  ]

  for (const junction of junctions) {
    const stem = junction()
    if (!stem) continue

    // Variant A: bare fusion (may already end well).
    candidates.push(finish(stem, '', head, tail))

    // Variants B/C: grow a couple of mode-appropriate endings.
    const endings = rng.shuffle(profile.endings).slice(0, 2)
    for (const ending of endings) {
      const grown = growEnding(stem, ending)
      candidates.push(finish(grown.word, grown.ending, head, tail))
    }
  }

  // Dedupe by surface form.
  const seen = new Set<string>()
  return candidates.filter((c) => {
    const key = c.word.toLowerCase()
    if (seen.has(key) || key.length < 3) return false
    seen.add(key)
    return true
  })
}

/** Trim a trailing vowel from the head so the junction stays crisp. */
function trimHead(form: string): string {
  if (form.length > 3 && isVowel(form[form.length - 1])) {
    return form.slice(0, -1)
  }
  return form
}

/** Trim a leading vowel from the tail when the head already ends in a vowel. */
function trimTail(form: string): string {
  return form
}

/** Concatenate head + optional connector + tail, avoiding triple-letter runs. */
function fuse(h: string, t: string, connector = ''): string {
  let mid = connector
  const headEndsVowel = isVowel(h[h.length - 1])
  const tailStartsVowel = isVowel(t[0])

  if (!connector) {
    // Two consonants meeting can be harsh; a soft connector helps.
    if (!headEndsVowel && !tailStartsVowel) mid = ''
    // Two vowels meeting can blur; drop the tail's leading vowel.
    if (headEndsVowel && tailStartsVowel) {
      t = t.slice(1) || t
    }
  } else if (headEndsVowel && !isVowel(connector)) {
    mid = ''
  } else if (headEndsVowel) {
    // Avoid vowel + vowel connector pileups.
    mid = ''
  }

  let word = h + mid + t
  word = word.replace(/(.)\1\1+/g, '$1$1') // collapse triple letters
  return word
}

/** Overlap head and tail on a shared boundary phoneme (e.g. "lum" + "mani"). */
function overlap(h: string, t: string): string | null {
  const last = h[h.length - 1]
  if (t[0] === last) {
    return h + t.slice(1)
  }
  // Overlap on a shared vowel if the head ends and tail starts with vowels.
  if (isVowel(last) && isVowel(t[0])) {
    return h + t.slice(1)
  }
  return null
}

/** Grow a euphonic ending, smoothing the seam so it doesn't sound bolted on. */
function growEnding(stem: string, ending: string): { word: string; ending: string } {
  const stemEndsVowel = isVowel(stem[stem.length - 1])
  const endingStartsVowel = isVowel(ending[0])

  let base = stem
  // Vowel + vowel: drop the stem's final vowel so it flows into the ending.
  if (stemEndsVowel && endingStartsVowel) {
    base = stem.slice(0, -1)
  }
  // Consonant + consonant ending: a light vowel bridge.
  if (!stemEndsVowel && !endingStartsVowel) {
    base = stem + 'a'
  }
  let word = base + ending
  word = word.replace(/(.)\1\1+/g, '$1$1')
  return { word, ending }
}

/** Final tidy-up and capitalisation. */
function finish(word: string, ending: string, head: Root, tail: Root): Candidate {
  let w = word.replace(/[^a-zë-ü]/gi, '')
  // Avoid an ugly cluster of 3+ trailing/leading consonants.
  w = w.replace(/^([^aeiouyë-ü]{3,})/, (m) => m.slice(0, 2))
  const display = w.charAt(0).toUpperCase() + w.slice(1)
  return { word: display, head, tail, ending }
}
