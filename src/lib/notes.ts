/**
 * Per-word personal notes, on-device (localStorage) — the same no-backend
 * approach as the lexicon. A note is keyed by the word within the concept it was
 * discovered for, so the same word coined for two meanings keeps separate notes.
 */
const KEY = 'wordlab.notes.v1'

function loadAll(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? (data as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function noteKey(word: string, brief: string): string {
  return `${word.toLowerCase()}::${brief.trim().slice(0, 80).toLowerCase()}`
}

export function loadNote(word: string, brief: string): string {
  return loadAll()[noteKey(word, brief)] ?? ''
}

export function saveNote(word: string, brief: string, note: string): void {
  try {
    const all = loadAll()
    const k = noteKey(word, brief)
    if (note.trim()) all[k] = note
    else delete all[k]
    window.localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Private mode / quota — the note still lives in component state this session.
  }
}
