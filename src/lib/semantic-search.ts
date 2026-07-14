/**
 * Call the server-side Semantic Gap Search (`/api/semantic-search`).
 *
 * Reverse dictionary: the user's meaning in, the closest EXISTING words/phrases
 * out, plus an honest verdict on whether language already has a word for it. Run
 * before word discovery so the lab can say "we searched for the word humanity may
 * already have" before inventing one. Cached per (brief) so re-runs are free.
 */
export type Coverage = 'exact' | 'strong' | 'partial' | 'related'
export type GapStatus = 'existing_word' | 'existing_phrase' | 'partial_coverage' | 'inconclusive'
export type GapConfidence = 'low' | 'moderate' | 'high'

export interface ClosestConcept {
  lemma: string
  pos: string
  language: string
  definition: string
  covers: string[]
  misses: string[]
  coverage: Coverage
}

export interface SemanticGapResult {
  normalizedMeaning: string
  closest: ClosestConcept[]
  status: GapStatus
  confidence: GapConfidence
  conclusion: string
  remainder: string
  limitations: string
}

const cache = new Map<string, SemanticGapResult>()

function keyFor(brief: string): string {
  return brief.trim().toLowerCase()
}

/** True if a gap search for this meaning is already cached (so it costs nothing). */
export function hasCachedGap(brief: string): boolean {
  return cache.has(keyFor(brief))
}

export async function fetchSemanticGap(
  brief: string,
  interpretation = '',
  timeoutMs = 45_000,
): Promise<SemanticGapResult | null> {
  const key = keyFor(brief)
  const cached = cache.get(key)
  if (cached) return cached

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/semantic-search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief, interpretation }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as SemanticGapResult
    if (!data || !Array.isArray(data.closest)) return null
    cache.set(key, data)
    return data
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
