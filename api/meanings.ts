import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Word Laboratory — bespoke word meanings (server-side).
 *
 * Second LLM pass. The words are synthesised deterministically after the meaning
 * analysis, so this endpoint takes the finished words plus the original brief and
 * writes a meaning tailored to *that* request for each one — instead of the
 * engine's generic per-concept definition. Each meaning is distinct, shaded by
 * the word's language character, and true to the user's idea.
 *
 * Returns { meanings: [{word, meaning, meaningRu}] }. On any failure the client
 * keeps the deterministic meanings, so the app always works.
 */

const MODEL = process.env.WORDLAB_MODEL || 'claude-haiku-4-5-20251001'
const MAX_WORDS = 30

// Writing ~18 bespoke bilingual definitions with Opus takes well over Vercel's
// default 10s function limit. Allow up to 60s (the Hobby ceiling) so the call
// actually completes instead of timing out into the deterministic fallback.
export const config = { maxDuration: 60 }

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['meanings'],
  properties: {
    meanings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'meaning', 'meaningRu'],
        properties: {
          word: { type: 'string' },
          meaning: { type: 'string' },
          meaningRu: { type: 'string' },
        },
      },
    },
  },
}

const SYSTEM = `You are the Meaning Analyst of Word Laboratory. A person is inventing words for one specific human idea. For each invented word below, write its meaning — a clear, evocative, dictionary-style definition of what that word means, written specifically for this idea.

For every word return:
- meaning: one sentence in English. A real definition ("a person who…", "the moment when…", "the quiet ache of…"), not a restatement of the idea.
- meaningRu: the same meaning in fluent, natural Russian (idiomatic, not word-for-word).

Rules:
- Make every word's meaning DISTINCT — each names a different facet of the idea.
- Let the word's language character shade the tone (e.g. a sombre language → heavier meaning; a tender/transforming language → gentler, evolving meaning).
- Stay true to the user's idea; never drift to a generic gloss.
- Keep each to a single sentence. Return one entry per word, echoing the word exactly.`

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
  const words = Array.isArray(req.body?.words) ? req.body.words.slice(0, MAX_WORDS) : []
  if (!brief || words.length === 0) {
    res.status(400).json({ error: 'bad_request' })
    return
  }

  // Compact, sanitised list for the model.
  const list = words
    .filter((w: unknown) => w && typeof (w as { word?: unknown }).word === 'string')
    .map((w: { word: string; language?: string; hint?: string }) => ({
      word: String(w.word).slice(0, 40),
      language: String(w.language ?? '').slice(0, 40),
      hint: String(w.hint ?? '').slice(0, 160),
    }))

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2600,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content:
            `The idea being named:\n"""${brief}"""\n\n` +
            `Write a bespoke meaning for each of these invented words ` +
            `(each with its language character and a rough concept hint):\n` +
            JSON.stringify(list),
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming)

    const textBlock = response.content.find((b) => b.type === 'text') as
      | { type: 'text'; text: string }
      | undefined
    const raw = JSON.parse(textBlock?.text ?? '{}')

    const meanings = Array.isArray(raw.meanings)
      ? raw.meanings
          .filter(
            (m: unknown) =>
              m &&
              typeof (m as { word?: unknown }).word === 'string' &&
              typeof (m as { meaning?: unknown }).meaning === 'string' &&
              typeof (m as { meaningRu?: unknown }).meaningRu === 'string',
          )
          .map((m: { word: string; meaning: string; meaningRu: string }) => ({
            word: String(m.word),
            meaning: String(m.meaning),
            meaningRu: String(m.meaningRu),
          }))
      : []

    res.setHeader('cache-control', 'no-store')
    res.status(200).json({ meanings })
  } catch {
    res.status(502).json({ error: 'meanings_failed' })
  }
}
