/**
 * Call the server-side "living dictionary" writer (`/api/meanings`).
 *
 * Given the finished words and the original brief, returns a map of
 * word → its full usage entry (meaning, short definition, part of speech, and
 * natural example sentences in English and Russian), or `null` if the endpoint
 * is absent, unconfigured, or failing — in which case the caller keeps the
 * engine's deterministic meanings and shows no example sentences.
 */
export interface WordItem {
  word: string
  language: string
  hint: string
  /** The exact Cyrillic spelling the Russian sentences should use. */
  translit: string
}

export interface WordUsage {
  en: string
  ru: string
  short: string
  pos: string
  usageEn: string[]
  usageRu: string[]
}

export async function fetchBespokeMeanings(
  brief: string,
  words: WordItem[],
  timeoutMs = 55_000,
): Promise<Map<string, WordUsage> | null> {
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
      meanings?: Array<{
        word: string
        meaning: string
        meaningRu: string
        short?: string
        pos?: string
        usageEn?: string[]
        usageRu?: string[]
      }>
    }
    if (!data || !Array.isArray(data.meanings)) return null
    const map = new Map<string, WordUsage>()
    for (const m of data.meanings) {
      if (m && typeof m.word === 'string' && m.meaning && m.meaningRu) {
        map.set(m.word.toLowerCase(), {
          en: m.meaning,
          ru: m.meaningRu,
          short: m.short ?? '',
          pos: m.pos ?? '',
          usageEn: Array.isArray(m.usageEn) ? m.usageEn : [],
          usageRu: Array.isArray(m.usageRu) ? m.usageRu : [],
        })
      }
    }
    return map.size > 0 ? map : null
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
