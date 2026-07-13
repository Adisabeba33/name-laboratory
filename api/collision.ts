import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Word Laboratory — LIVE collision check for a single word (server-side, on demand).
 *
 * This is the authoritative half of the novelty check the offline engine flag
 * only hints at. It runs entirely on PUBLIC, key-free sources, so it needs no
 * ANTHROPIC_API_KEY and costs nothing per call:
 *
 *   • Dictionary — api.dictionaryapi.dev: is it already a real English word?
 *   • Domains   — RDAP (rdap.org bootstrap): is <word>.<tld> registered?
 *
 * It is called lazily, for the one word a user wants to vet, not for every result.
 * Every source is wrapped so a slow/unavailable one degrades to "unknown" rather
 * than failing the whole check. Honesty: this covers dictionary + domain only —
 * NOT trademark, app-store, social handles or cross-language meaning.
 */

export const config = { maxDuration: 60 }

// TLDs with reliable RDAP coverage in the IANA bootstrap, so a 404 genuinely
// means "unregistered". `.ai` is deliberately excluded: it has no RDAP server,
// so rdap.org 404s for it regardless — which would read as a false "available".
const TLDS = ['com', 'io', 'app', 'co'] as const
type DomainStatus = 'available' | 'taken' | 'unknown'

/** fetch with a hard timeout so one slow source can't stall the whole check. */
async function timedFetch(url: string, opts: RequestInit = {}, ms = 6000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Is the word already in an English dictionary? Returns a short definition too. */
async function checkDictionary(word: string): Promise<{ isWord: boolean; definition: string | null }> {
  try {
    const res = await timedFetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    )
    if (res.status === 404) return { isWord: false, definition: null }
    if (!res.ok) return { isWord: false, definition: null }
    const data = (await res.json()) as Array<{
      meanings?: Array<{ definitions?: Array<{ definition?: string }> }>
    }>
    const def = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? null
    return { isWord: true, definition: def ? String(def).slice(0, 200) : null }
  } catch {
    return { isWord: false, definition: null }
  }
}

/** RDAP: 404 → available, 200 → registered, anything else → unknown. */
async function checkDomain(word: string, tld: string): Promise<DomainStatus> {
  try {
    const res = await timedFetch(`https://rdap.org/domain/${encodeURIComponent(word)}.${tld}`)
    if (res.status === 404) return 'available'
    if (res.status === 200) return 'taken'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const raw = String(req.body?.word ?? '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 40)
  if (raw.length < 2) {
    res.status(400).json({ error: 'bad_request' })
    return
  }

  try {
    const [dictionary, ...domainStatuses] = await Promise.all([
      checkDictionary(raw),
      ...TLDS.map((tld) => checkDomain(raw, tld)),
    ])
    const domains = TLDS.map((tld, i) => ({ tld, status: domainStatuses[i] }))
    // A light cache: the world doesn't change second-to-second, and this keeps
    // repeat clicks / shared results cheap without ever storing anything private.
    res.setHeader('cache-control', 'public, max-age=3600')
    res.status(200).json({ word: raw, dictionary, domains })
  } catch {
    res.status(502).json({ error: 'collision_failed' })
  }
}
