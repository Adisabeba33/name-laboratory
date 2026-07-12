/**
 * Call the server-side bespoke-meaning writer (`/api/meanings`).
 *
 * Given the finished words and the original brief, returns a map of
 * word → { en, ru } bespoke meanings, or `null` if the endpoint is absent,
 * unconfigured, or failing — in which case the caller keeps the engine's
 * deterministic meanings.
 */
export interface WordItem {
  word: string
  language: string
  hint: string
}

export async function fetchBespokeMeanings(
  brief: string,
  words: WordItem[],
  timeoutMs = 55_000,
): Promise<Map<string, { en: string; ru: string }> | null> {
  if (words.length === 0) return null
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
      meanings?: Array<{ word: string; meaning: string; meaningRu: string }>
    }
    if (!data || !Array.isArray(data.meanings)) return null
    const map = new Map<string, { en: string; ru: string }>()
    for (const m of data.meanings) {
      if (m && typeof m.word === 'string' && m.meaning && m.meaningRu) {
        map.set(m.word.toLowerCase(), { en: m.meaning, ru: m.meaningRu })
      }
    }
    return map.size > 0 ? map : null
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
