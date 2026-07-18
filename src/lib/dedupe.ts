import { editDistance, phoneticKey } from '../engine'
import type { LexEntry } from './lexicon'

/**
 * Lexicon de-duplication — a first, on-device prototype of "proof of meaning".
 *
 * Before a word is added to the personal lexicon, we check it against what is
 * already saved so the collection never fills up with the same idea under two
 * spellings, or two words that mean the same thing. Two independent checks:
 *
 *  • FORM — does the new word look/sound like one already saved? (edit distance +
 *    a crude phonetic key, so "Varethis" ≈ "Varethas" and "Kwik" ≈ "Quick").
 *  • MEANING — does it name the same idea as a word saved for a DIFFERENT concept?
 *    (token overlap of the meaning + brief). Words saved from the SAME prompt are
 *    deliberate variations of one idea, so meaning-overlap there is expected and
 *    NOT flagged; only cross-concept meaning collisions count as duplicates.
 *
 * Pure and deterministic — no network, no LLM — so it is fully unit-testable and
 * the same logic can later run server-side against the shared dictionary.
 */

export interface SimilarityHit {
  entry: LexEntry
  /** 0–1 form similarity (spelling + sound). */
  form: number
  /** 0–1 meaning similarity (token overlap across a different concept). */
  meaning: number
  /** Which check(s) tripped. */
  kind: 'form' | 'meaning' | 'both'
}

/** A candidate word to be added, and the meaning context to compare against. */
export interface DedupeCandidate {
  word: string
  /** The word's meaning text (short + full definition). */
  meaningText: string
  /** The concept/prompt it was discovered for. */
  brief: string
}

/** Form similarity at/above this reads as "too close to an existing word". */
export const FORM_THRESHOLD = 0.72
/** Meaning overlap at/above this reads as "the same idea, differently spelled". */
export const MEANING_THRESHOLD = 0.5

/** Common EN/RU words that carry no distinguishing meaning — ignored in overlap. */
const STOP = new Set([
  'the', 'and', 'that', 'this', 'with', 'from', 'your', 'you', 'for', 'not', 'but',
  'into', 'when', 'while', 'before', 'after', 'which', 'what', 'who', 'they', 'them',
  'have', 'has', 'had', 'are', 'was', 'were', 'been', 'being', 'its', 'his', 'her',
  'their', 'our', 'out', 'off', 'over', 'under', 'still', 'only', 'ever', 'once',
  'как', 'что', 'это', 'того', 'когда', 'уже', 'ещё', 'или', 'так', 'все', 'всё',
  'его', 'она', 'они', 'был', 'быть', 'тот', 'себя', 'своё', 'свою', 'этот', 'чего',
  'кто', 'том', 'при', 'без', 'над', 'под', 'про', 'для', 'нет', 'даже', 'потому',
])

/** Meaningful tokens (length > 3, not a stop word), lower-cased, EN + RU. */
function tokens(text: string): Set<string> {
  const out = new Set<string>()
  for (const t of text.toLowerCase().split(/[^a-zа-яё]+/i)) {
    if (t.length > 3 && !STOP.has(t)) out.add(t)
  }
  return out
}

/** How alike two words look and sound, 0–1 (1 = identical or homophonous). */
export function formSimilarity(a: string, b: string): number {
  const x = a.toLowerCase().replace(/[^a-zà-ÿа-яё]/gi, '')
  const y = b.toLowerCase().replace(/[^a-zà-ÿа-яё]/gi, '')
  if (!x || !y) return 0
  if (phoneticKey(x) && phoneticKey(x) === phoneticKey(y)) return 1
  const dist = editDistance(x, y)
  return Math.max(0, 1 - dist / Math.max(x.length, y.length))
}

/** Jaccard overlap of two meaning-token sets, 0–1. */
function meaningSimilarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = a.size + b.size - inter
  return union ? inter / union : 0
}

/**
 * Entries already in the lexicon that are too close to `candidate` to add cleanly.
 * Sorted strongest-first. Empty array ⇒ the word is genuinely new and safe to add.
 */
export function findSimilarEntries(candidate: DedupeCandidate, entries: LexEntry[]): SimilarityHit[] {
  const candTokens = tokens(`${candidate.meaningText} ${candidate.brief}`)
  const candBrief = candidate.brief.trim().toLowerCase()
  const candWord = candidate.word.toLowerCase()
  const hits: SimilarityHit[] = []

  for (const e of entries) {
    // Never flag the exact same saved word/concept (that path is handled as unsave).
    if (e.word.toLowerCase() === candWord && e.brief.trim().toLowerCase() === candBrief) continue

    const form = formSimilarity(candidate.word, e.word)
    // Meaning overlap only counts across a DIFFERENT concept — same-prompt variants
    // are meant to be similar in meaning, so we don't punish them.
    const sameBrief = e.brief.trim().toLowerCase() === candBrief
    const meaning = sameBrief
      ? 0
      : meaningSimilarity(candTokens, tokens(`${e.shortMeaning} ${e.meaning} ${e.brief}`))

    const formHit = form >= FORM_THRESHOLD
    const meaningHit = meaning >= MEANING_THRESHOLD
    if (formHit || meaningHit) {
      hits.push({ entry: e, form, meaning, kind: formHit && meaningHit ? 'both' : formHit ? 'form' : 'meaning' })
    }
  }

  return hits.sort((a, b) => Math.max(b.form, b.meaning) - Math.max(a.form, a.meaning))
}
