/**
 * Call the server-side meaning writer (`/api/meanings`).
 *
 * Given the finished words and the original brief, returns a map of
 * word → its dictionary entry (meaning, short definition, part of speech), or
 * `null` on absence/failure — in which case the caller keeps the engine's
 * deterministic meanings. The expensive example sentences are written lazily,
 * per word, by `/api/usage` (see ./usage).
 *
 * Results are cached in memory per (brief + word set) so an identical repeat
 * never re-bills the model.
 */
export interface WordItem {
  word: string
  language: string
  hint: string
}

export interface WordMeaning {
  en: string
  ru: string
  short: string
  pos: string
}

const cache = new Map<string, Map<string, WordMeaning>>()

function keyFor(brief: string, words: WordItem[]): string {
  return `${brief}|${words.map((w) => w.word).join(',')}`
}

export async function fetchBespokeMeanings(
  brief: string,
  words: WordItem[],
  timeoutMs = 55_000,
): Promise<Map<string, WordMeaning> | null> {
  if (words.length === 0) return null
  const key = keyFor(brief, words)
  const cached = cache.get(key)
  if (cached) return cached

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/meanings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief, words }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      meanings?: Array<{ word: string; meaning: string; meaningRu: string; short?: string; pos?: string }>
    }
    if (!data || !Array.isArray(data.meanings)) return null
    const map = new Map<string, WordMeaning>()
    for (const m of data.meanings) {
      if (m && typeof m.word === 'string' && m.meaning && m.meaningRu) {
        map.set(m.word.toLowerCase(), {
          en: m.meaning,
          ru: m.meaningRu,
          short: m.short ?? '',
          pos: m.pos ?? '',
        })
      }
    }
    if (map.size === 0) return null
    cache.set(key, map)
    return map
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

/** True if this exact request is already cached (so it costs nothing to serve). */
export function hasCachedMeanings(brief: string, words: WordItem[]): boolean {
  return cache.has(keyFor(brief, words))
}
