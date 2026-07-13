/**
 * Call the server-side live collision check (`/api/collision`) for one word.
 *
 * The engine ships an offline hint (is it in our built-in word list?); this is
 * the authoritative pass — a real dictionary + live domain (RDAP) lookup, run
 * lazily only for the word a user wants to vet. Cached in memory per word so
 * re-checking the same word never re-hits the network.
 */
export type DomainStatus = 'available' | 'taken' | 'unknown'

export interface CollisionResult {
  word: string
  dictionary: { isWord: boolean; definition: string | null }
  domains: Array<{ tld: string; status: DomainStatus }>
}

const cache = new Map<string, CollisionResult>()

export function hasCachedCollision(word: string): boolean {
  return cache.has(word.toLowerCase())
}

export async function fetchCollision(
  word: string,
  timeoutMs = 20_000,
): Promise<CollisionResult | null> {
  const key = word.toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/collision', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as CollisionResult
    if (!data || !Array.isArray(data.domains)) return null
    cache.set(key, data)
    return data
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
