import type { MeaningAnalysis } from '../engine'

/**
 * Call the server-side LLM meaning analyzer (`/api/analyze`).
 *
 * Returns the LLM's {@link MeaningAnalysis}, or `null` if the endpoint is absent
 * (e.g. the static Artifact), unconfigured (no API key), or failing — in which
 * case the caller falls back to the self-contained deterministic engine. The API
 * key lives only on the server; the browser never sees it.
 */
export async function analyzeRemote(
  brief: string,
  timeoutMs = 25_000,
): Promise<MeaningAnalysis | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief }),
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
    return data as MeaningAnalysis
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
