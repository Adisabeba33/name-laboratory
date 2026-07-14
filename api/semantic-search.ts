import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Word Laboratory — Semantic Gap Search (server-side, LLM MVP).
 *
 * Before inventing a word, the lab must ask: does an existing word already say
 * this? This is a REVERSE dictionary — meaning in, existing words out — run
 * against the model's lexical knowledge (English first, plus notable terms /
 * idioms / borrowings from any language). It returns the closest existing
 * concepts, what each covers and misses, and an honest gap verdict.
 *
 * Honesty is the whole point (spec §2): the result is QUALITATIVE — no fake
 * "81% covered" precision — and it is explicitly based on the model's knowledge,
 * NOT an exhaustive, indexed dictionary corpus. A future version swaps this seam
 * for a licensed lexical corpus + embeddings; the shape stays the same.
 *
 * The ANTHROPIC_API_KEY never leaves the server. Missing key → 501 and the client
 * simply skips the panel (the app still works without it).
 */

const MODEL = process.env.WORDLAB_MODEL || 'claude-haiku-4-5-20251001'
export const config = { maxDuration: 60 }

const COVERAGE = ['exact', 'strong', 'partial', 'related'] as const
const STATUS = ['existing_word', 'existing_phrase', 'partial_coverage', 'inconclusive'] as const
const CONFIDENCE = ['low', 'moderate', 'high'] as const

const CONCEPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lemma', 'pos', 'language', 'definition', 'covers', 'misses', 'coverage'],
  properties: {
    lemma: { type: 'string' },
    pos: { type: 'string' },
    language: { type: 'string' },
    definition: { type: 'string' },
    covers: { type: 'array', items: { type: 'string' } },
    misses: { type: 'array', items: { type: 'string' } },
    coverage: { type: 'string', enum: COVERAGE },
  },
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['normalizedMeaning', 'closest', 'status', 'confidence', 'conclusion', 'remainder', 'limitations'],
  properties: {
    normalizedMeaning: { type: 'string' },
    closest: { type: 'array', items: CONCEPT_SCHEMA },
    status: { type: 'string', enum: STATUS },
    confidence: { type: 'string', enum: CONFIDENCE },
    conclusion: { type: 'string' },
    remainder: { type: 'string' },
    limitations: { type: 'string' },
  },
}

const SYSTEM = `You are the Lexical Scout of Word Laboratory. Before the lab invents a new word, you search EXISTING vocabulary to see whether language already has a word for the user's meaning. This is a reverse dictionary: meaning in → existing words out.

Search your knowledge of real vocabulary for the closest EXISTING words or phrases: ordinary dictionary words, common phrases, psychology / philosophy / social-science terms, idioms, and borrowed or culturally specific words from any language that English speakers actually use. Multi-word expressions count (e.g. "post-traumatic growth", "anticipatory grief", "survivor's guilt", "saudade").

For each closest concept return:
- lemma: the existing word or phrase.
- pos: its grammatical role ("noun", "noun phrase", …).
- language: "English", or the source language for a borrowed/foreign term.
- definition: one plain sentence — the real dictionary sense.
- covers: 1–3 short phrases naming which parts of the user's meaning it DOES capture.
- misses: 1–3 short phrases naming which parts it does NOT capture.
- coverage: one of exact | strong | partial | related.

Then judge the whole request:
- status: "existing_word" (a single ordinary word already fully expresses it), "existing_phrase" (an established multi-word expression does), "partial_coverage" (several concepts each catch part, but none the whole — the ideal case for the lab), or "inconclusive" (you genuinely can't find close matches).
- confidence: low | moderate | high.
- conclusion: 1–2 plain sentences on what existing vocabulary does and doesn't do here.
- remainder: one sentence naming the UNNAMED remainder — the distinct meaning that no existing item captures (empty string if status is existing_word/existing_phrase).
- normalizedMeaning: one clear sentence restating the user's meaning precisely.

HARD RULES — honesty:
- Be QUALITATIVE. Never output percentages or invent a coverage number.
- Do NOT fabricate words. Only list words/phrases you actually know to exist; if unsure, leave them out. For a foreign term, only include it if it is real, and note its nuance in "misses".
- If you find a genuine exact match (e.g. "fear of open spaces" → agoraphobia; "pleasure at another's misfortune" → schadenfreude), SAY SO with status existing_word — do not manufacture a gap.
- limitations: always state that this is based on your own lexical knowledge, not an exhaustive indexed dictionary, so absence of a match does not prove no word exists.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(501).json({ error: 'llm_not_configured' })
    return
  }

  const brief = String(req.body?.brief ?? '').slice(0, 2000).trim()
  const interpretation = String(req.body?.interpretation ?? '').slice(0, 1000).trim()
  if (!brief) {
    res.status(400).json({ error: 'empty_brief' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content:
            `The meaning to search for:\n"""${brief}"""\n\n` +
            (interpretation ? `The lab reads this as: ${interpretation}\n\n` : '') +
            `Find the closest existing words/phrases and judge whether language already has a word for it.`,
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming)

    const textBlock = response.content.find((b) => b.type === 'text') as
      | { type: 'text'; text: string }
      | undefined
    const raw = JSON.parse(textBlock?.text ?? '{}')

    const asStrings = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((s) => typeof s === 'string' && s.trim()).map((s) => String(s).slice(0, 120)).slice(0, 3) : []

    const closest = Array.isArray(raw.closest)
      ? raw.closest
          .filter((c: unknown) => c && typeof (c as { lemma?: unknown }).lemma === 'string')
          .slice(0, 8)
          .map((c: Record<string, unknown>) => ({
            lemma: String(c.lemma).slice(0, 80),
            pos: String(c.pos ?? 'noun').slice(0, 30),
            language: String(c.language ?? 'English').slice(0, 30),
            definition: String(c.definition ?? '').slice(0, 300),
            covers: asStrings(c.covers),
            misses: asStrings(c.misses),
            coverage: (COVERAGE as readonly string[]).includes(String(c.coverage)) ? c.coverage : 'related',
          }))
      : []

    const status = (STATUS as readonly string[]).includes(String(raw.status)) ? raw.status : 'inconclusive'
    const confidence = (CONFIDENCE as readonly string[]).includes(String(raw.confidence)) ? raw.confidence : 'low'

    res.setHeader('cache-control', 'no-store')
    res.status(200).json({
      normalizedMeaning: String(raw.normalizedMeaning ?? '').slice(0, 500),
      closest,
      status,
      confidence,
      conclusion: String(raw.conclusion ?? '').slice(0, 600),
      remainder: String(raw.remainder ?? '').slice(0, 400),
      limitations: String(
        raw.limitations ??
          'Based on the model’s lexical knowledge, not an exhaustive indexed dictionary — absence of a match does not prove no word exists.',
      ).slice(0, 400),
    })
  } catch {
    res.status(502).json({ error: 'semantic_search_failed' })
  }
}
