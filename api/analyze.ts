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

const MODEL = process.env.WORDLAB_MODEL || 'claude-haiku-4-5-20251001'

// Deep meaning analysis with Opus can approach Vercel's default 10s limit.
// Allow up to 60s (the Hobby ceiling) so a thoughtful reading never times out.
export const config = { maxDuration: 60 }

const NODE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['en', 'ru'],
  properties: { en: { type: 'string' }, ru: { type: 'string' } },
}

const TENSION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['a', 'aRu', 'b', 'bRu', 'note', 'noteRu'],
  properties: {
    a: { type: 'string' },
    aRu: { type: 'string' },
    b: { type: 'string' },
    bRu: { type: 'string' },
    note: { type: 'string' },
    noteRu: { type: 'string' },
  },
}

const CONCEPT_WEIGHT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'weight'],
  properties: {
    name: { type: 'string', enum: CONCEPTS },
    weight: { type: 'number' },
  },
}

const DIRECTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'titleRu', 'definition', 'definitionRu', 'emphasis'],
  properties: {
    title: { type: 'string' },
    titleRu: { type: 'string' },
    definition: { type: 'string' },
    definitionRu: { type: 'string' },
    emphasis: { type: 'array', items: CONCEPT_WEIGHT_SCHEMA },
  },
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['interpretation', 'interpretationRu', 'hiddenConcepts', 'network', 'tensions', 'directions', 'concepts', 'theme'],
  properties: {
    interpretation: { type: 'string' },
    interpretationRu: { type: 'string' },
    hiddenConcepts: { type: 'array', items: NODE_SCHEMA },
    network: { type: 'array', items: NODE_SCHEMA },
    tensions: { type: 'array', items: TENSION_SCHEMA },
    directions: { type: 'array', items: DIRECTION_SCHEMA },
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

const SYSTEM = `You are the Meaning Analyst of Word Laboratory — a linguistic research lab that invents words for human ideas. Your job is NOT to name anything. Your job is to understand what a request is *really* about before any word is made.

CRUCIAL — stay faithful to the actual request. Match its register and never drift away from it:
- If the request is a concrete, sensory or physical image (a smell, a place, a sound, a scene), the interpretation MUST stay about THAT thing. Describe the sensation and its immediate, human feeling. Do NOT inflate it into abstract philosophy about suffering, longing, or existence. "The smell of rain on warm dust after a dry summer" is about petrichor — earth releasing its held breath, freshness and relief after heat, the simple sensory proof that the season has turned. It is NOT about "the paradox of desire" or "deprivation ending".
- If the request is genuinely emotional or existential (identity, loss, transformation, grief), THEN reach for the deep human core beneath the surface words.
- In short: go only as deep as the request itself goes. Ground it, don't overreach. Never invent heavier themes than the words actually carry.

Given a short description, produce a structured analysis:

1. interpretation (English): 1–3 sentences naming what the request is truly about — faithful to its register (see above). For an emotional request, name the deep core (e.g. "becoming different after surviving destruction" → irreversible identity transformation, not mere survival). For a sensory or concrete request, name the sensation and its plain human feeling — vividly, but without abstract philosophy.
2. interpretationRu: the same interpretation in fluent, natural Russian (idiomatic, not a word-for-word translation).
3. hiddenConcepts: 4–6 ideas (not keywords) that live beneath the request — each as {en, ru}. These are phrases like "Death without dying" / "Смерть без смерти", not single words.
4. network: 5–7 ordered concept nodes {en, ru} showing how the meaning flows (e.g. Destruction → Survival → Transformation → Identity → Rebirth).
5b. tensions: 2–4 semantic tensions — the opposing forces the concept lives between. Each is {a, aRu, b, bRu, note, noteRu}: two short opposing pole labels (a vs b) and one human sentence (note) capturing the lived tension, e.g. a="Survival" b="Identity death", note="Alive, but no longer the same person." These are more useful than emotional percentages; only include tensions the request genuinely contains. If it carries no real opposition, return an empty array.
5c. directions: 3–5 distinct concept directions — genuinely different angles the same idea could be named from (not synonyms). Each is {title, titleRu, definition, definitionRu, emphasis}. title is a short evocative name for the angle (e.g. "Scar-born self", "Death without dying"); definition is one sentence. emphasis is an array of {name, weight} onto the allowed concepts capturing what THIS direction leans into (so focusing on it shifts the words). Make the directions meaningfully different from each other.
5. concepts: a weighted map onto the lab's fixed vocabulary. Return an array of {name, weight} where name is ONE OF the allowed concepts and weight is 0–1 (1 = central). Include 3–8 of the most relevant. Pick whatever genuinely fits: for a sensory or physical request use the concrete concepts (water, nature, earth, fire, light, calm, movement…); for an emotional one, the deep concepts (transformation, rebirth, survival, identity, resilience, loss, memory, longing, grief, hope…). Do not force deep/emotional concepts onto a concrete request, and do not default to shallow ones on a profound one — follow the actual meaning.
6. theme: one of "metamorphosis", "grief", "resilience", or "none" if none clearly dominates. metamorphosis = irreversible transformation/rebirth after destruction; grief = loss and love-after-loss; resilience = strength/courage under pressure.

Be precise and profound, not decorative. The interpretation should make the user feel understood.`

const NAMING_SYSTEM = `You are the Naming Analyst of Word Laboratory. The user wants an invented NAME for something real — a company, a store, a brand, a product, a project, or even a newborn child. Your job is to understand what the name should EVOKE and feel like, before any word is made.

Given a short description of what is being named, produce a structured analysis:

1. interpretation (English): 1–3 sentences on what this name should convey — the character, feeling and positioning it should carry (e.g. "a calm, premium AI company for medicine" → the name should feel trustworthy, clinical-yet-humane, quietly advanced). Describe the impression, not a philosophy.
2. interpretationRu: the same, in fluent natural Russian.
3. hiddenConcepts: 4–6 qualities the name should carry — each as {en, ru} (e.g. "Quiet authority" / "Тихая уверенность", "Warmth without softness"). Not single keywords.
4. network: 5–7 ordered nodes {en, ru} showing how the name's associations flow (e.g. Care → Precision → Calm → Trust → Future).
5b. tensions: return an EMPTY array unless the brief genuinely balances two opposing qualities (e.g. bold ↔ trustworthy).
5c. directions: 3–5 distinct naming angles — genuinely different directions the name could take (e.g. "Clinical & precise", "Warm & human", "Mythic & timeless"). Each {title, titleRu, definition, definitionRu, emphasis}, where emphasis is an array of {name, weight} onto the allowed concepts that this angle leans into.
5. concepts: a weighted map onto the lab's fixed vocabulary — {name, weight}[], name is ONE OF the allowed concepts, 3–8 of the most relevant to how the name should SOUND and feel (trust, precision, calm, luxury, nature, future, strength, light…). This drives which sound-worlds the lab reaches for.
6. theme: "none" almost always for names; only set metamorphosis/grief/resilience if the brief is explicitly about that.

Focus on brand character and feel. Do not invent emotional depth the brief doesn't have.`

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
  const mode = req.body?.mode === 'name' ? 'name' : 'discover'
  if (!brief) {
    res.status(400).json({ error: 'empty_brief' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: mode === 'name' ? NAMING_SYSTEM : SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content:
            mode === 'name'
              ? `Analyse what this NAME should evoke and feel like:\n\n"""${brief}"""`
              : `Analyse this request and describe what it is really about:\n\n"""${brief}"""`,
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
      tensions: sanitiseTensions(raw.tensions),
      directions: sanitiseDirections(raw.directions),
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

function sanitiseTensions(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .filter(
      (t) =>
        t &&
        typeof t.a === 'string' && typeof t.b === 'string' &&
        typeof t.note === 'string',
    )
    .slice(0, 4)
    .map((t) => ({
      a: String(t.a), aRu: String(t.aRu ?? t.a),
      b: String(t.b), bRu: String(t.bRu ?? t.b),
      note: String(t.note), noteRu: String(t.noteRu ?? t.note),
    }))
}

function sanitiseDirections(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .filter(
      (d) => d && typeof d.title === 'string' && typeof d.definition === 'string',
    )
    .slice(0, 5)
    .map((d, i) => {
      const emphasis: Record<string, number> = {}
      let max = 0
      for (const entry of Array.isArray(d.emphasis) ? d.emphasis : []) {
        const name = entry?.name
        const weight = Number(entry?.weight)
        if (CONCEPTS.includes(name) && weight > 0) {
          emphasis[name] = (emphasis[name] ?? 0) + weight
          max = Math.max(max, emphasis[name])
        }
      }
      if (max > 0) for (const k of Object.keys(emphasis)) emphasis[k] = emphasis[k] / max
      return {
        id: `dir-${i}`,
        title: String(d.title).slice(0, 60),
        titleRu: String(d.titleRu ?? d.title).slice(0, 60),
        definition: String(d.definition).slice(0, 240),
        definitionRu: String(d.definitionRu ?? d.definition).slice(0, 240),
        emphasis,
      }
    })
}
