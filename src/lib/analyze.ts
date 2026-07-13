import type { MeaningAnalysis } from '../engine'

/**
 * Call the server-side LLM meaning analyzer (`/api/analyze`).
 *
 * Returns the LLM's {@link MeaningAnalysis}, or `null` if the endpoint is absent
 * (e.g. the static Artifact), unconfigured (no API key), or failing — in which
 * case the caller falls back to the self-contained deterministic engine. The API
 * key lives only on the server; the browser never sees it.
 */
export type AnalyzeMode = 'discover' | 'name'

const cache = new Map<string, MeaningAnalysis>()
const keyFor = (brief: string, mode: AnalyzeMode) => `${mode}|${brief}`

/** True if this exact prompt was already analysed (so it costs nothing to serve). */
export function hasCachedAnalysis(brief: string, mode: AnalyzeMode = 'discover'): boolean {
  return cache.has(keyFor(brief, mode))
}

export async function analyzeRemote(
  brief: string,
  mode: AnalyzeMode = 'discover',
  timeoutMs = 55_000,
): Promise<MeaningAnalysis | null> {
  const cached = cache.get(keyFor(brief, mode))
  if (cached) return cached
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief, mode }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<MeaningAnalysis>
    // Shape check — only trust a well-formed analysis.
    if (
      !data ||
      typeof data.interpretation !== 'string' ||
      !data.concepts ||
      Object.keys(data.concepts).length === 0
    ) {
      return null
    }
    // Tolerate an older endpoint that doesn't return tensions/directions.
    if (!Array.isArray(data.tensions)) data.tensions = []
    if (!Array.isArray(data.directions)) data.directions = []
    const analysis = data as MeaningAnalysis
    cache.set(keyFor(brief, mode), analysis)
    return analysis
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
