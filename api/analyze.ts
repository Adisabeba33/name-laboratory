import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { dampenAttractors, METAMORPHOSIS_CUE } from '../src/engine/attractors'

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
  'recognition', 'understanding', 'communication', 'connection', 'absurdity',
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

CORE PRINCIPLE — read the SPECIFIC configuration, not the nearest category.
A request is never "just grief" or "just a smell". It is one exact shape of experience, and your reading must name THAT shape, not the familiar bucket it resembles.
- "a grief you have carried so long it has become a kind of home" is NOT generic loss or "transformation". It is the strange domestic comfort of long-carried grief — sorrow worn smooth into companionship, a pain you would almost miss if it left. Name that.
- Never let a broad label (transformation, grief, longing, survival) overwrite the specific thing in front of you. The specific reading is the whole product.
- DO NOT reflexively read "identity", "transformation" or the "metamorphosis" theme into a request just because it mentions a self, a future, or becoming. Reserve those for requests that EXPLICITLY name becoming a different person, rebirth, or a changed self after something. "A future self shaping your present" is NOT identity transformation — nobody is becoming someone else; it is about time, continuity and a quiet trust in your own unfolding. Read agency, foresight, self-continuity, comfort or trust when THOSE are the real subject, and lean on the plainer concepts (time, future, trust, recognition, vision, mystery) rather than forcing the deep-transformation bucket.

STAY FAITHFUL TO THE REGISTER — go only as deep as the request itself goes, never deeper:
- Concrete / sensory (a smell, a place, a sound, a scene): keep the reading about THAT sensation and its immediate human feeling. Do NOT inflate it into philosophy about suffering, desire or existence. "The smell of rain on warm dust after a dry summer" = petrichor: earth releasing its held breath, relief after heat, the plain proof the season has turned — NOT "the paradox of desire".
- Genuinely emotional / existential (identity, loss, transformation): reach for the deep human core beneath the surface words ("becoming different after surviving destruction" = irreversible identity transformation, not mere survival).
- Never invent heavier themes than the words carry, and never flatten a profound request into something shallow.

CALIBRATION — the quality and specificity of reading to aim for (interpretation shown only; you still return the full structure below):
· "the joy of returning home after a long time away" → The relief of a place that still holds your shape — being re-absorbed by somewhere that kept a space for you while you were gone.
· "the quiet of a house the morning after guests have left" → The specific hollow-but-peaceful stillness of a space suddenly returned to itself, the warmth of company still faintly present in its absence.
· "the moment a perfect experience ends while you are still inside it" → Anticipatory loss — mourning something before it has finished, the ending felt from within the thing itself.
· "the strange comfort of realizing your future self is already shaping your present through decisions you don't yet understand" → The quiet reassurance of being authored by a self you can't yet see — trusting that a wiser, later you is already at work in the choices you make blindly now. It is about time, agency and self-continuity, NOT identity transformation: no one becomes a different person, they are simply carried by their own unfolding.

Given a short description, produce a structured analysis:

1. interpretation (English): 1–3 sentences naming what the request is truly about — faithful to its register (see above). For an emotional request, name the deep core (e.g. "becoming different after surviving destruction" → irreversible identity transformation, not mere survival). For a sensory or concrete request, name the sensation and its plain human feeling — vividly, but without abstract philosophy.
2. interpretationRu: the same interpretation in fluent, natural Russian (idiomatic, not a word-for-word translation).
3. hiddenConcepts: 4–6 ideas (not keywords) that live beneath the request — each as {en, ru}. These are phrases like "Death without dying" / "Смерть без смерти", not single words.
4. network: 5–7 ordered concept nodes {en, ru} showing how the meaning flows (e.g. Destruction → Survival → Transformation → Identity → Rebirth).
5b. tensions: 2–4 semantic tensions — the opposing forces the concept lives between. Each is {a, aRu, b, bRu, note, noteRu}: two short opposing pole labels (a vs b) and one human sentence (note) capturing the lived tension, e.g. a="Survival" b="Identity death", note="Alive, but no longer the same person." These are more useful than emotional percentages; only include tensions the request genuinely contains. If it carries no real opposition, return an empty array.
5c. directions: 3–5 distinct concept directions — genuinely different angles the same idea could be named from (not synonyms). Each is {title, titleRu, definition, definitionRu, emphasis}. title is a short evocative name for the angle (e.g. "Scar-born self", "Death without dying"); definition is one sentence. emphasis is an array of {name, weight} onto the allowed concepts capturing what THIS direction leans into (so focusing on it shifts the words). Make the directions meaningfully different from each other.
5. concepts: a weighted map onto the lab's fixed vocabulary. Return an array of {name, weight} where name is ONE OF the allowed concepts and weight is 0–1 (1 = central). Include 3–8 of the most relevant. Pick whatever genuinely fits: for a sensory or physical request use the concrete concepts (water, nature, earth, fire, light, calm, movement…); for an emotional one, the deep concepts (transformation, rebirth, survival, identity, resilience, loss, memory, longing, grief, hope…). Do not force deep/emotional concepts onto a concrete request, and do not default to shallow ones on a profound one — follow the actual meaning.
6. theme: a COARSE tag chosen AFTER your interpretation, never before it. One of "metamorphosis" (irreversible transformation/rebirth after destruction), "grief" (loss and love-after-loss), "resilience" (strength/courage under pressure), or "none". If forcing any theme would flatten your specific reading, choose "none". The theme must follow the meaning — never bend the meaning to fit a theme.

Be precise and profound, not decorative. Write the Russian as a native speaker would feel it, not as a translation. The interpretation should make the user feel exactly understood — as if you named the thing they could never quite name themselves.`

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

    // Fold the {name, weight}[] into a concept vector.
    let concepts: Record<string, number> = {}
    for (const entry of raw.concepts ?? []) {
      const name = entry?.name
      const weight = Number(entry?.weight)
      if (CONCEPTS.includes(name) && weight > 0) {
        concepts[name] = (concepts[name] ?? 0) + weight
      }
    }
    // §7 backstop — the LLM has no attractor damping of its own, so an over-read
    // ("future self shaping the present" → identity/transformation) folds straight
    // in. Apply the SAME deterministic damping the engine path uses: any attractor
    // the brief does not actually name is cut to 40% before we normalise. Then the
    // max-normalise, so whatever genuinely survives leads.
    concepts = dampenAttractors(concepts, brief.toLowerCase())
    let max = 0
    for (const k of Object.keys(concepts)) max = Math.max(max, concepts[k])
    if (max > 0) for (const k of Object.keys(concepts)) concepts[k] = concepts[k] / max

    // Theme guard — never let the coarse `metamorphosis` tag flatten a prompt that
    // never named becoming/rebirth (the reflex that mis-read the future-self case).
    const rawTheme = raw.theme && raw.theme !== 'none' ? String(raw.theme) : undefined
    const theme =
      rawTheme === 'metamorphosis' && !METAMORPHOSIS_CUE.test(brief.toLowerCase())
        ? undefined
        : rawTheme

    const analysis = {
      interpretation: String(raw.interpretation ?? ''),
      interpretationRu: String(raw.interpretationRu ?? ''),
      hiddenConcepts: sanitiseNodes(raw.hiddenConcepts),
      network: sanitiseNodes(raw.network),
      tensions: sanitiseTensions(raw.tensions),
      directions: sanitiseDirections(raw.directions),
      concepts,
      theme,
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
