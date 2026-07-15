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
        required: ['word', 'meaning', 'meaningRu', 'short', 'pos', 'gapFidelity'],
        properties: {
          word: { type: 'string' },
          meaning: { type: 'string' },
          meaningRu: { type: 'string' },
          short: { type: 'string' },
          pos: { type: 'string' },
          // How directly THIS definition names the confirmed meaning (0–1).
          gapFidelity: { type: 'number' },
        },
      },
    },
  },
}

const SYSTEM = `You are the Lexicographer of Word Laboratory. A person is naming ONE SPECIFIC human idea — the CONFIRMED MEANING, given to you below — with new words that can be USED inside existing human languages. For each word, write its dictionary entry AS A FACET OF THAT EXACT MEANING.

WRITE IT AS IF THE WORD ALREADY EXISTS — a word the language has quietly owned for years, not a fresh invention. Define it the way an actual dictionary would: plainly, precisely, with no fantasy, mystical or magical framing.

THE ONE RULE THAT OVERRIDES EVERYTHING: every definition must be about the CONFIRMED MEANING and nothing else. It must name the SAME KIND OF THING the target asks for (a "moment" meaning gets a moment; a "feeling" gets a feeling; a "realization" gets the click of realizing) AND the SAME SUBJECT (if the meaning is about two people recognizing a shared experience, EVERY definition is about that — recognition, shared meaning, the two speakers — not about anything else).

DO NOT DRIFT to the engine's stock archetypes. Words like "survival becomes strength", "rebirth from the ashes", "the core self beneath all change", "identity reborn", "endurance", "transformation" are DEFAULT DRIFT — write them ONLY if the confirmed meaning is genuinely about survival/rebirth/identity. If the meaning is about, say, a future self shaping the present, a definition about "when endurance becomes settled strength" is WRONG — it names a different idea. Reject that reflex.

Each word carries a "lens" — the distinct angle its language takes. Use the lens to pick WHICH FACET of the confirmed meaning to define — never to change the subject, but ALSO never to collapse every entry into the same shape. The lenses must name DIFFERENT KINDS of thing:
- "the meaning itself" / "what is it" → name the ACT or QUALITY itself (e.g. "the quiet dignity of…", "the act of…") — NOT a person.
- "the feeling" → name the inner SENSATION itself ("the ache of…", "the steadiness of…").
- "the threshold" / "the moment" → name the exact INSTANT it happens.
- "the aftermath" → name what ORDINARY LIFE becomes.
- "the cost" → name what it TAKES from you.
- "the person" / "the observer" → only THIS lens names a person.
CRITICAL: do NOT write "a person who…" for every word. If most of your entries begin "A person who…", you have collapsed the lenses and failed — most words name an act, a feeling, a moment or a state, not an agent.

For every word return:
- meaning: one English sentence — a real, specific dictionary definition of the confirmed meaning from this word's lens.
- meaningRu: the same in fluent, idiomatic Russian.
- short: a 3–6 word English distillation.
- pos: usually "noun"; "verb"/"adjective" only if it truly reads that way.
- gapFidelity: AFTER writing, rate 0–1, critically and adversarially, how directly THIS definition names the confirmed meaning. 1.0 = names the exact thing asked for; 0.7 = a true facet of it; 0.5 = related but a DIFFERENT KIND of thing (a neighbour); below 0.4 = drifted to another idea. Be harsh — reserve 0.9+ for a definition that nails the precise gap; if you wrote a stock archetype, score it low honestly.

Return one entry per word, echoing the word exactly, every definition genuinely distinct.`

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
  const interpretation = String(req.body?.interpretation ?? '').slice(0, 2000).trim()
  const target = req.body?.target && typeof req.body.target === 'object'
    ? {
        headType: String((req.body.target as { headType?: unknown }).headType ?? '').slice(0, 40),
        mechanism: String((req.body.target as { mechanism?: unknown }).mechanism ?? '').slice(0, 200),
      }
    : null
  const words = Array.isArray(req.body?.words) ? req.body.words.slice(0, MAX_WORDS) : []
  if (!brief || words.length === 0) {
    res.status(400).json({ error: 'bad_request' })
    return
  }
  // The confirmed meaning the definitions must stay anchored to (falls back to the brief).
  const confirmed = interpretation || brief

  // Compact, sanitised list for the model.
  const list = words
    .filter((w: unknown) => w && typeof (w as { word?: unknown }).word === 'string')
    .map((w: { word: string; language?: string; hint?: string; lens?: { role?: string; question?: string } }) => ({
      word: String(w.word).slice(0, 40),
      language: String(w.language ?? '').slice(0, 40),
      hint: String(w.hint ?? '').slice(0, 160),
      lens: w.lens
        ? `${String(w.lens.role ?? '').slice(0, 40)} — ${String(w.lens.question ?? '').slice(0, 80)}`
        : '',
    }))

  try {
    const client = new Anthropic({ apiKey })
    // Split into small chunks written in parallel — no truncation, faster, and a
    // failed chunk doesn't lose the others. (Usage example sentences are written
    // lazily, per word, by /api/usage — this cheap pass is meanings only.)
    const chunks: (typeof list)[] = []
    for (let i = 0; i < list.length; i += CHUNK_SIZE) chunks.push(list.slice(i, i + CHUNK_SIZE))

    const settled = await Promise.allSettled(chunks.map((chunk) => writeEntries(client, confirmed, target, chunk)))
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
  gapFidelity: number
}

/** Write dictionary entries (meaning + short + pos + gapFidelity) for one chunk. */
async function writeEntries(
  client: Anthropic,
  confirmed: string,
  target: { headType: string; mechanism: string } | null,
  list: Array<{ word: string; language: string; hint: string; lens: string }>,
): Promise<WordEntry[]> {
  const targetLine = target?.headType
    ? `\nTARGET TYPE — the kind of thing every definition must name: "${target.headType}"${
        target.mechanism ? ` · mechanism: "${target.mechanism}"` : ''
      }.\n`
    : '\n'
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [
      {
        role: 'user',
        content:
          `THE CONFIRMED MEANING every definition must be a facet of:\n"""${confirmed}"""\n` +
          targetLine +
          `\nWrite the dictionary entry for each invented word below. Use its lens to choose ` +
          `WHICH facet of the confirmed meaning to define — never to change the subject. The ` +
          `"hint" is only the engine's rough concept; if it points away from the confirmed ` +
          `meaning, IGNORE it and stay on the confirmed meaning. Rate gapFidelity honestly.\n` +
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
          gapFidelity: clampUnit(m.gapFidelity),
        }))
    : []
}

/** Coerce the model's self-rating to a 0–1 number (default 0.7 when absent/bad). */
function clampUnit(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return 0.7
  return Math.max(0, Math.min(1, v))
}
