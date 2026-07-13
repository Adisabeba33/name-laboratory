import type { WordPassport } from './types'
import { buildPassport } from './generator'
import { languageById } from './data/languages'
import { computeGenome } from './genome'
import { KNOWN_WORDS } from './data/known-words'
import { Rng } from './rng'
import {
  awkwardClusters,
  countSyllables,
  isVowel,
  normalise,
  pronounceability,
  sharpness,
  vowelRatio,
} from './phonetics'

/**
 * Evolve a word's SOUND while preserving its concept.
 *
 * The word is a vessel for a meaning; evolving it changes how the vessel sounds,
 * never what it holds. Given a direction ("softer", "darker", "easier to say"…),
 * this re-shapes the word's phonetics toward that quality, then rebuilds a full
 * passport for the new form — keeping the original meaning, usage and ancestry
 * verbatim, and recomputing everything that depends on sound (genome, adoption,
 * pronunciation, transliteration). It is deterministic and needs no LLM.
 *
 * A lineage (parent → child, generation, what changed) makes the evolution
 * meaningful rather than a reroll.
 */

export interface EvolveDirection {
  id: string
  label: string
}

export const EVOLVE_DIRECTIONS: EvolveDirection[] = [
  { id: 'softer', label: 'Softer' },
  { id: 'harder', label: 'Harder' },
  { id: 'warmer', label: 'Warmer' },
  { id: 'darker', label: 'Darker' },
  { id: 'simpler', label: 'Simpler' },
  { id: 'easier', label: 'Easier to say' },
  { id: 'natural', label: 'More natural' },
  { id: 'ancient', label: 'More ancient' },
  { id: 'modern', label: 'More modern' },
  { id: 'russian', label: 'Better in Russian' },
  { id: 'english', label: 'Better in English' },
]

export interface WordEvolutionStep {
  /** The evolved word, as a full passport (same concept, new sound). */
  passport: WordPassport
  parentWord: string
  directionLabel: string
  /** Human description of the phonetic/feel changes. */
  changes: string[]
  conceptPreservation: 'High' | 'Moderate' | 'Low'
}

const SOFTEN: Record<string, string> = {
  k: 'l', q: 'l', x: 's', z: 's', g: 'r', c: 's', j: 'l', t: 'n', d: 'n', p: 'm', b: 'm', v: 'w',
}
const HARDEN: Record<string, string> = {
  l: 'r', m: 'n', s: 'z', n: 't', w: 'v', h: 'k', f: 'k',
}
const DARKEN: Record<string, string> = { a: 'o', e: 'o', i: 'u', y: 'u' }
const WARM_V: Record<string, string> = { i: 'a', e: 'a', u: 'o' }
const ANCIENT_ENDINGS = ['us', 'oth', 'aeth', 'or', 'eon', 'ath']

/** Evolve `p` in `dirId`, returning the new word plus its lineage. */
export function evolveWord(p: WordPassport, dirId: string, rng: Rng): WordEvolutionStep {
  const language = languageById(p.origin.languageId)
  const idx = Number((p.family.id.match(/-(\d+)$/) ?? [])[1] ?? 0)
  const parent = p.word
  const parentGenome = computeGenome(parent, usedConcepts(p))
  const label = EVOLVE_DIRECTIONS.find((d) => d.id === dirId)?.label ?? dirId

  // Over-generate variants toward the direction, keep the best usable one.
  let best = ''
  let bestScore = -Infinity
  for (let i = 0; i < 24; i++) {
    const cand = tidy(transform(dirId, normalise(parent), rng))
    const key = cand.toLowerCase()
    if (
      key.length < 4 ||
      key.length > 11 ||
      key === parent.toLowerCase() ||
      KNOWN_WORDS.has(key) ||
      awkwardClusters(cand) > 1.2 ||
      ![...cand].some(isVowel)
    ) {
      continue
    }
    const score = directionScore(dirId, cand, parentGenome) + pronounceability(cand) * 0.25
    if (score > bestScore) {
      bestScore = score
      best = cand
    }
  }
  const changed = best !== ''
  const newWord = capitalise(best || parent)

  const generation = p.origin.generation + 1
  const child = buildPassport(
    newWord,
    language,
    idx,
    p.origin.lead,
    p.origin.support,
    p.origin.concepts,
    generation,
    parent,
    parent,
  )
  // The concept is preserved verbatim — copy the meaning-level fields so any
  // bespoke (LLM) meaning survives the sound change.
  child.meaning = p.meaning
  child.shortMeaning = p.shortMeaning
  child.usage = p.usage
  child.ancestry = p.ancestry

  return {
    passport: child,
    parentWord: parent,
    directionLabel: label,
    changes: changed
      ? describeChanges(parentGenome, child.genome, parent, newWord)
      : [`Already ${label.toLowerCase()} — no further change`],
    conceptPreservation: changed ? preservation(parent, newWord) : 'High',
  }
}

function usedConcepts(p: WordPassport) {
  return p.origin.support && p.origin.support !== p.origin.lead
    ? [p.origin.lead, p.origin.support]
    : [p.origin.lead]
}

/** Apply a direction's phonetic transformation to a lowercased word. */
function transform(dir: string, w: string, rng: Rng): string {
  switch (dir) {
    case 'softer':
      return mapChars(w, (c) => (SOFTEN[c] && rng.next() < 0.65 ? SOFTEN[c] : c))
    case 'harder':
      return mapChars(w, (c) => (HARDEN[c] && rng.next() < 0.65 ? HARDEN[c] : c))
    case 'warmer':
      return mapChars(w, (c) =>
        WARM_V[c] && rng.next() < 0.5 ? WARM_V[c] : SOFTEN[c] && rng.next() < 0.35 ? SOFTEN[c] : c,
      )
    case 'darker':
      return mapChars(w, (c) => (DARKEN[c] && rng.next() < 0.6 ? DARKEN[c] : c))
    case 'simpler':
      return dropSyllable(w)
    case 'easier':
      return ease(w)
    case 'natural':
      return regularise(mapChars(w, (c) => (c === 'x' ? 's' : c === 'z' ? 's' : c === 'q' ? 'k' : c)))
    case 'ancient':
      return withEnding(w, rng.pick(ANCIENT_ENDINGS))
    case 'modern':
      return dropSyllable(stripOrnate(w))
    case 'russian':
      return regularise(w.replace(/th/g, 't').replace(/w/g, 'v').replace(/x/g, 'ks').replace(/ph/g, 'f'))
    case 'english':
      return w.replace(/[ëïöü]/g, (m) => ({ ë: 'e', ï: 'i', ö: 'o', ü: 'u' })[m] ?? m).replace(/(.)\1\1+/g, '$1$1')
    default:
      return w
  }
}

function mapChars(w: string, fn: (c: string) => string): string {
  return [...w].map(fn).join('')
}

/** Drop the final syllable when there's more than one; else drop a trailing coda. */
function dropSyllable(w: string): string {
  const groups = w.match(/[aeiouyë-ü]+|[^aeiouyë-ü]+/gi) ?? [w]
  if (countSyllables(w) > 2) {
    // Remove from the last vowel group to the end.
    let lastVowel = -1
    let pos = 0
    const spans: [number, number][] = []
    for (const g of groups) {
      spans.push([pos, pos + g.length])
      if (isVowel(g[0])) lastVowel = spans.length - 1
      pos += g.length
    }
    if (lastVowel > 0) return w.slice(0, spans[lastVowel][0])
  }
  return isVowel(w[w.length - 1]) ? w : w.slice(0, -1)
}

/** Break the first awkward consonant cluster by dropping a consonant. */
function ease(w: string): string {
  return w.replace(/([^aeiouyë-ü])([^aeiouyë-ü])([^aeiouyë-ü])/i, '$1$3')
}

function stripOrnate(w: string): string {
  return w.replace(/(oth|eth|aeth|us|eon)$/i, '') || w
}

/** Replace the trailing vowel run (or append) with a signature ending. */
function withEnding(w: string, ending: string): string {
  const stem = w.replace(/[aeiouyë-ü]+$/i, '')
  return (stem.length >= 2 ? stem : w) + ending
}

/** Regularise: ensure it doesn't end on an awkward consonant cluster. */
function regularise(w: string): string {
  if (!isVowel(w[w.length - 1]) && !isVowel(w[w.length - 2] ?? 'a')) return w + 'a'
  return w
}

/** Collapse triples and doubled vowels, strip stray characters. */
function tidy(word: string): string {
  return normalise(word)
    .replace(/[^a-zë-ü]/gi, '')
    .replace(/(.)\1\1+/g, '$1$1')
    .replace(/(.)\1/g, (m, c: string) => (isVowel(c) ? c : m))
}

function capitalise(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1)
}

/** Score how well a candidate matches the requested direction. */
function directionScore(dir: string, cand: string, base: { sharpness: number; vowelRatio: number; syllables: number; length: number }): number {
  const s = sharpness(cand)
  const vr = vowelRatio(cand)
  const syl = countSyllables(cand)
  const dark = darkFraction(cand)
  switch (dir) {
    case 'softer': return base.sharpness - s
    case 'harder': return s - base.sharpness
    case 'warmer': return (vr - base.vowelRatio) + (base.sharpness - s) * 0.5
    case 'darker': return dark
    case 'simpler': return (base.syllables - syl) + (base.length - cand.length) * 0.1
    case 'easier': return pronounceability(cand)
    case 'modern': return (base.syllables - syl) + (base.length - cand.length) * 0.1
    case 'natural': return -specialLetters(cand) + (isVowel(cand[cand.length - 1]) ? 0.3 : 0)
    case 'ancient': return ANCIENT_ENDINGS.some((e) => cand.endsWith(e)) ? 1 : 0
    case 'russian': return -ruUnfriendly(cand)
    case 'english': return -(cand.match(/[ëïöü]/g)?.length ?? 0)
    default: return 0
  }
}

function darkFraction(w: string): number {
  const vowels = [...w].filter(isVowel)
  if (!vowels.length) return 0
  return vowels.filter((v) => 'ou'.includes(v)).length / vowels.length
}

function specialLetters(w: string): number {
  return (w.match(/[xzqkj]/g)?.length ?? 0)
}

function ruUnfriendly(w: string): number {
  return (w.match(/w|th|x|ph/g)?.length ?? 0)
}

/** Describe the perceptible changes between parent and child. */
function describeChanges(
  parent: ReturnType<typeof computeGenome>,
  child: ReturnType<typeof computeGenome>,
  pWord: string,
  cWord: string,
): string[] {
  const out: string[] = []
  const d = (a: number, b: number) => b - a
  if (d(parent.sharpness, child.sharpness) < -0.08) out.push('Softer, gentler consonants')
  if (d(parent.sharpness, child.sharpness) > 0.08) out.push('Sharper, harder consonants')
  if (d(parent.vowelRatio, child.vowelRatio) > 0.06) out.push('More open, vowel-forward')
  if (d(parent.vowelRatio, child.vowelRatio) < -0.06) out.push('Tighter, more consonantal')
  if (d(parent.weight, child.weight) > 0.06) out.push('Heavier, darker weight')
  if (d(parent.weight, child.weight) < -0.06) out.push('Lighter weight')
  if (child.syllables < parent.syllables) out.push('Shorter, more minimal')
  if (child.syllables > parent.syllables) out.push('Longer, more elaborate')
  if (d(parent.pronounceability, child.pronounceability) > 0.06) out.push('Easier to pronounce')
  if (cWord.length !== pWord.length && out.length < 4) {
    out.push(cWord.length < pWord.length ? 'Fewer letters' : 'More letters')
  }
  return out.length ? out.slice(0, 4) : ['A subtle shift in texture']
}

/** Meaning is copied verbatim, so the concept is preserved; grade by how far the
 *  sound travelled (a wholly different word is a weaker "descendant"). */
function preservation(parent: string, child: string): 'High' | 'Moderate' | 'Low' {
  const a = parent.toLowerCase()
  const b = child.toLowerCase()
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  const shared = i / Math.max(a.length, b.length)
  return shared >= 0.4 ? 'High' : shared >= 0.2 ? 'Moderate' : 'Moderate'
}
