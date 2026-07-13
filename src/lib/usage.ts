/**
 * Call the server-side "Use in Language" writer (`/api/usage`) for one word.
 *
 * Example sentences are the most expensive part of the pipeline and most words
 * are never looked at closely, so they're written lazily — only for the word a
 * user asks to see used in a sentence. Cached in memory per (brief + word) so
 * re-opening the same word never re-bills the model.
 */
export interface UsageItem {
  word: string
  language: string
  hint: string
  translit: string
}

export interface WordUsage {
  en: string[]
  ru: string[]
}

const cache = new Map<string, WordUsage>()

function keyFor(brief: string, word: string): string {
  return `${brief}|${word.toLowerCase()}`
}

export async function fetchUsage(
  brief: string,
  item: UsageItem,
  timeoutMs = 45_000,
): Promise<WordUsage | null> {
  const key = keyFor(brief, item.word)
  const cached = cache.get(key)
  if (cached) return cached

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/usage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        brief,
        word: item.word,
        language: item.language,
        hint: item.hint,
        translit: item.translit,
      }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as { usageEn?: string[]; usageRu?: string[] }
    if (!data) return null
    const usage: WordUsage = {
      en: Array.isArray(data.usageEn) ? data.usageEn : [],
      ru: Array.isArray(data.usageRu) ? data.usageRu : [],
    }
    if (usage.en.length === 0 && usage.ru.length === 0) return null
    cache.set(key, usage)
    return usage
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

/** True if usage for this word is already cached (so it costs nothing). */
export function hasCachedUsage(brief: string, word: string): boolean {
  return cache.has(keyFor(brief, word))
}
