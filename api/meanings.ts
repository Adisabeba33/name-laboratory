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
/** Words per model call — small enough that a full-entry batch never truncates. */
const CHUNK_SIZE = 6

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
        required: ['word', 'meaning', 'meaningRu', 'short', 'pos'],
        properties: {
          word: { type: 'string' },
          meaning: { type: 'string' },
          meaningRu: { type: 'string' },
          short: { type: 'string' },
          pos: { type: 'string' },
        },
      },
    },
  },
}

const SYSTEM = `You are the Lexicographer of Word Laboratory. A person is naming one specific human idea with new words that can be USED inside existing human languages. For each word below, write its dictionary entry.

WRITE IT AS IF THE WORD ALREADY EXISTS — a word the language has quietly owned for years, not a fresh invention. The reader should think "wait… is this already a real word?" Define it the way an actual dictionary would: plainly, precisely, with no fantasy, mystical or magical framing. These are ordinary words a language was simply missing.

For every word return:
- meaning: one sentence in English — a real, specific definition ("the moment when…", "the quiet ache of…"), the way a dictionary states it. Not a restatement of the idea, not decorative poetry.
- meaningRu: the same meaning in fluent, natural Russian a native speaker would actually feel (idiomatic, not word-for-word).
- short: a 3–6 word English distillation ("Identity reborn through survival.").
- pos: the word's natural grammatical role — usually "noun"; use "verb"/"adjective" only if it truly reads that way.

Rules:
- Make every word's meaning DISTINCT — each names a different facet of the idea.
- Stay faithful to the request's register: a concrete/sensory idea gets a grounded, sensory definition; an emotional one reaches for its deep core. Never inflate a plain image into philosophy.
- Let the word's language character shade the tone, lightly — but the entry must always read as ordinary language, never fantasy.
- Return one entry per word, echoing the word exactly.`

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
    // Split into small chunks written in parallel — no truncation, faster, and a
    // failed chunk doesn't lose the others. (Usage example sentences are written
    // lazily, per word, by /api/usage — this cheap pass is meanings only.)
    const chunks: (typeof list)[] = []
    for (let i = 0; i < list.length; i += CHUNK_SIZE) chunks.push(list.slice(i, i + CHUNK_SIZE))

    const settled = await Promise.allSettled(chunks.map((chunk) => writeEntries(client, brief, chunk)))
    const meanings = settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []))
    const anyOk = settled.some((s) => s.status === 'fulfilled')

    if (!anyOk) {
      res.status(502).json({ error: 'meanings_failed' })
      return
    }
    res.setHeader('cache-control', 'no-store')
    res.status(200).json({ meanings })
  } catch {
    res.status(502).json({ error: 'meanings_failed' })
  }
}

interface WordEntry {
  word: string
  meaning: string
  meaningRu: string
  short: string
  pos: string
}

/** Write dictionary entries (meaning + short + pos) for one small chunk of words. */
async function writeEntries(
  client: Anthropic,
  brief: string,
  list: Array<{ word: string; language: string; hint: string }>,
): Promise<WordEntry[]> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1600,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [
      {
        role: 'user',
        content:
          `The idea being named:\n"""${brief}"""\n\n` +
          `Write the dictionary entry for each of these invented words, using each ` +
          `word's language character and concept hint:\n` +
          JSON.stringify(list),
      },
    ],
  } as Anthropic.MessageCreateParamsNonStreaming)

  const textBlock = response.content.find((b) => b.type === 'text') as
    | { type: 'text'; text: string }
    | undefined
  const raw = JSON.parse(textBlock?.text ?? '{}')

  return Array.isArray(raw.meanings)
    ? raw.meanings
        .filter(
          (m: unknown) =>
            m &&
            typeof (m as { word?: unknown }).word === 'string' &&
            typeof (m as { meaning?: unknown }).meaning === 'string' &&
            typeof (m as { meaningRu?: unknown }).meaningRu === 'string',
        )
        .map((m: Partial<WordEntry>) => ({
          word: String(m.word),
          meaning: String(m.meaning),
          meaningRu: String(m.meaningRu),
          short: String(m.short ?? '').slice(0, 120),
          pos: String(m.pos ?? '').slice(0, 24),
        }))
    : []
}
