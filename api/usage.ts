import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Word Laboratory — "Use in Language" for a single word (server-side, on demand).
 *
 * Writing example sentences for every discovered word is the most expensive part
 * of the pipeline, and most words are never looked at closely. So this is split
 * out and called LAZILY — only for the one word a user actually wants to see used
 * in a sentence. Returns { usageEn: [2], usageRu: [2] }.
 */

const MODEL = process.env.WORDLAB_MODEL || 'claude-haiku-4-5-20251001'

export const config = { maxDuration: 60 }

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['usageEn', 'usageRu'],
  properties: {
    usageEn: { type: 'array', items: { type: 'string' } },
    usageRu: { type: 'array', items: { type: 'string' } },
  },
}

const SYSTEM = `You are the Lexicographer of Word Laboratory. Given one word, its meaning, and the idea it names, write natural example sentences that show the word living inside real speech.

Use the word AS IF IT WERE COMPLETELY ORDINARY — an established word the speaker reaches for without thinking, dropped into an everyday situation. The sentences should make the reader forget it was ever invented. No grand, poetic or fantastical showcase lines — just ordinary people saying ordinary things, with this one word doing quiet, natural work.

Return:
- usageEn: EXACTLY 2 natural English sentences that USE the word (keep the given spelling) and teach how it functions — real, human, conversational, never awkward "She felt X" templates.
- usageRu: EXACTLY 2 natural Russian sentences that USE the word. Use the given Cyrillic spelling verbatim, lower-case, declined naturally into the sentence like any everyday word.

The sentences must sound like something a real person would actually say in passing.`

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
  const word = String(req.body?.word ?? '').slice(0, 40).trim()
  const translit = String(req.body?.translit ?? '').slice(0, 40).trim()
  const hint = String(req.body?.hint ?? '').slice(0, 240).trim()
  const language = String(req.body?.language ?? '').slice(0, 40).trim()
  if (!brief || !word) {
    res.status(400).json({ error: 'bad_request' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content:
            `The idea being named:\n"""${brief}"""\n\n` +
            `Word: ${word}\n` +
            (language ? `Language character: ${language}\n` : '') +
            (hint ? `Its meaning: ${hint}\n` : '') +
            (translit ? `Russian (Cyrillic) spelling to use: ${translit}\n` : ''),
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming)

    const textBlock = response.content.find((b) => b.type === 'text') as
      | { type: 'text'; text: string }
      | undefined
    const raw = JSON.parse(textBlock?.text ?? '{}')

    const asSentences = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((s) => typeof s === 'string' && s.trim()).map((s) => String(s).slice(0, 400)).slice(0, 3)
        : []

    res.setHeader('cache-control', 'no-store')
    res.status(200).json({ usageEn: asSentences(raw.usageEn), usageRu: asSentences(raw.usageRu) })
  } catch {
    res.status(502).json({ error: 'usage_failed' })
  }
}
