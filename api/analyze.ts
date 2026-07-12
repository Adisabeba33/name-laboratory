import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Word Laboratory — LLM Meaning Analysis (server-side).
 *
 * This is the "single seam" the deterministic engine was built around: it replaces
 * the local `analyzeMeaning()` with a real language model that can understand any
 * prompt. It returns the SAME `MeaningAnalysis` shape the engine already consumes
 * (interpretation EN/RU, hidden concepts, concept network, a weighted concept
 * vector in the engine's own vocabulary, and an optional theme), so the rest of
 * the pipeline — language discovery, word synthesis, passports — is unchanged.
 *
 * The ANTHROPIC_API_KEY never leaves the server. If it's missing or the call
 * fails, this returns a non-2xx status and the client silently falls back to the
 * self-contained deterministic engine.
 */

// The engine's concept vocabulary. Keep in sync with src/engine/types.ts `Concept`.
const CONCEPTS = [
  'knowledge', 'healing', 'future', 'precision', 'calm', 'human', 'science',
  'trust', 'intelligence', 'power', 'nature', 'light', 'movement', 'order',
  'elevation', 'depth', 'unity', 'creation', 'luxury', 'energy', 'water', 'fire',
  'earth', 'sky', 'time', 'mystery', 'harmony', 'strength', 'freedom', 'vision',
  'transformation', 'rebirth', 'survival', 'destruction', 'identity', 'resilience',
  'loss', 'memory', 'shadow', 'transcendence', 'longing', 'courage', 'grief', 'hope',
]

// Recognised themes. Keep in sync with src/engine/data/themes.ts ids.
const THEMES = ['metamorphosis', 'grief', 'resilience']

const MODEL = process.env.WORDLAB_MODEL || 'claude-opus-4-8'

// Deep meaning analysis with Opus can approach Vercel's default 10s limit.
// Allow up to 60s (the Hobby ceiling) so a thoughtful reading never times out.
export const config = { maxDuration: 60 }

const NODE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['en', 'ru'],
  properties: { en: { type: 'string' }, ru: { type: 'string' } },
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['interpretation', 'interpretationRu', 'hiddenConcepts', 'network', 'concepts', 'theme'],
  properties: {
    interpretation: { type: 'string' },
    interpretationRu: { type: 'string' },
    hiddenConcepts: { type: 'array', items: NODE_SCHEMA },
    network: { type: 'array', items: NODE_SCHEMA },
    concepts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'weight'],
        properties: {
          name: { type: 'string', enum: CONCEPTS },
          weight: { type: 'number' },
        },
      },
    },
    theme: { type: 'string', enum: [...THEMES, 'none'] },
  },
}

const SYSTEM = `You are the Meaning Analyst of Word Laboratory — a linguistic research lab that invents words for human ideas. Your job is NOT to name anything. Your job is to understand what a request is *really* about, at its deepest human level, before any word is made.

Given a short description, produce a structured analysis:

1. interpretation (English): 1–3 sentences stating the true emotional/philosophical core of the request — not its surface words. If someone describes "becoming different after surviving destruction", say it is about irreversible identity transformation, not about survival. Name what the request is really reaching for.
2. interpretationRu: the same interpretation in fluent, natural Russian (idiomatic, not a word-for-word translation).
3. hiddenConcepts: 4–6 ideas (not keywords) that live beneath the request — each as {en, ru}. These are phrases like "Death without dying" / "Смерть без смерти", not single words.
4. network: 5–7 ordered concept nodes {en, ru} showing how the meaning flows (e.g. Destruction → Survival → Transformation → Identity → Rebirth).
5. concepts: a weighted map onto the lab's fixed vocabulary. Return an array of {name, weight} where name is ONE OF the allowed concepts and weight is 0–1 (1 = central). Include 3–8 of the most relevant. Choose the deep/emotional concepts when they fit (transformation, rebirth, survival, destruction, identity, resilience, loss, memory, shadow, transcendence, longing, courage, grief, hope) — do not default to shallow ones like creation or light unless they are genuinely central.
6. theme: one of "metamorphosis", "grief", "resilience", or "none" if none clearly dominates. metamorphosis = irreversible transformation/rebirth after destruction; grief = loss and love-after-loss; resilience = strength/courage under pressure.

Be precise and profound, not decorative. The interpretation should make the user feel understood.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // No key configured — tell the client to use its local fallback.
    res.status(501).json({ error: 'llm_not_configured' })
    return
  }

  const brief = String((req.body?.brief ?? '')).slice(0, 2000).trim()
  if (!brief) {
    res.status(400).json({ error: 'empty_brief' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content: `Analyse this request and describe what it is really about:\n\n"""${brief}"""`,
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming)

    const textBlock = response.content.find((b) => b.type === 'text') as
      | { type: 'text'; text: string }
      | undefined
    const raw = JSON.parse(textBlock?.text ?? '{}')

    // Fold the {name, weight}[] into a normalised concept vector.
    const concepts: Record<string, number> = {}
    let max = 0
    for (const entry of raw.concepts ?? []) {
      const name = entry?.name
      const weight = Number(entry?.weight)
      if (CONCEPTS.includes(name) && weight > 0) {
        concepts[name] = (concepts[name] ?? 0) + weight
        max = Math.max(max, concepts[name])
      }
    }
    if (max > 0) for (const k of Object.keys(concepts)) concepts[k] = concepts[k] / max

    const analysis = {
      interpretation: String(raw.interpretation ?? ''),
      interpretationRu: String(raw.interpretationRu ?? ''),
      hiddenConcepts: sanitiseNodes(raw.hiddenConcepts),
      network: sanitiseNodes(raw.network),
      concepts,
      theme: raw.theme && raw.theme !== 'none' ? String(raw.theme) : undefined,
    }

    res.setHeader('cache-control', 'no-store')
    res.status(200).json(analysis)
  } catch {
    // Any failure → client falls back to the deterministic engine.
    res.status(502).json({ error: 'analysis_failed' })
  }
}

function sanitiseNodes(input: unknown): Array<{ en: string; ru: string }> {
  if (!Array.isArray(input)) return []
  return input
    .filter((n) => n && typeof n.en === 'string' && typeof n.ru === 'string')
    .slice(0, 8)
    .map((n) => ({ en: String(n.en), ru: String(n.ru) }))
}
