import type { WordPassport } from '../engine'

/**
 * My Lexicon — a personal, on-device dictionary of saved words.
 *
 * Word Laboratory has no backend, so a user's saved vocabulary lives in the
 * browser's localStorage: it survives refreshes and costs nothing. Each entry
 * keeps everything needed to re-read the word later — its meaning, pronunciation,
 * transliteration, usage sentences, phonetic system, adoption band, the original
 * concept it was discovered for, and when it was saved.
 */

const KEY = 'wordlab.lexicon.v1'

export interface LexEntry {
  /** Stable id: the word within the concept it was discovered for. */
  id: string
  word: string
  transliteration: string
  pronunciationGuide: string
  partOfSpeech: string
  meaning: string
  shortMeaning: string
  usage: { en: string[]; ru: string[] }
  /** The phonetic system / linguistic species the word belongs to. */
  language: string
  adoptionBand: string
  adoptionScore: number
  /** The concept/prompt the word was discovered for. */
  brief: string
  /** ISO date the entry was saved (set at the UI layer, not the engine). */
  savedAt: string
}

/** A word is identified within the concept it was coined for. */
export function lexId(word: string, brief: string): string {
  return `${word.toLowerCase()}::${brief.trim().slice(0, 80).toLowerCase()}`
}

/** Build a lexicon entry from a passport plus its concept context. */
export function toEntry(p: WordPassport, language: string, brief: string, savedAt: string): LexEntry {
  return {
    id: lexId(p.word, brief),
    word: p.word,
    transliteration: p.transliteration,
    pronunciationGuide: p.pronunciationGuide,
    partOfSpeech: p.partOfSpeech,
    meaning: p.meaning,
    shortMeaning: p.shortMeaning,
    usage: p.usage,
    language,
    adoptionBand: p.adoption.band,
    adoptionScore: p.adoption.score,
    brief,
    savedAt,
  }
}

export function loadLexicon(): LexEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? (data as LexEntry[]) : []
  } catch {
    return []
  }
}

function persist(entries: LexEntry[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    // Private mode / quota — the in-memory state still works for this session.
  }
}

/** Add (or move to top) an entry; returns the new list. */
export function addEntry(entries: LexEntry[], entry: LexEntry): LexEntry[] {
  const next = [entry, ...entries.filter((e) => e.id !== entry.id)]
  persist(next)
  return next
}

/** Remove an entry by id; returns the new list. */
export function removeEntry(entries: LexEntry[], id: string): LexEntry[] {
  const next = entries.filter((e) => e.id !== id)
  persist(next)
  return next
}
