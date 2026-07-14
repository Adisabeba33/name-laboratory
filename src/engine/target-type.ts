import type { TargetType, HeadType } from './types'

/**
 * Target Type Detection (Morutho ranking fix §1) — what KIND of lexical object is
 * the user asking for? A word for a *moment* is a different thing from a word for a
 * *principle*, even when they are semantically close. Detecting the head type
 * before generation lets the decision layer gate on granularity, not just meaning,
 * so an abstract principle can never outrank a direct moment (§2).
 *
 * Deterministic structural cue detection with an explicit `confidence`: the target
 * gate only bites when a clear cue is present, so vague prompts are not
 * over-constrained. The LLM path can override into the same shape.
 */

interface Cue {
  head: HeadType
  test: RegExp
  temporality?: TargetType['requiredTemporality']
  subtype?: string
}

// Ordered — the first matching cue wins (most specific first). Stems are matched
// without a trailing word boundary so "realiz" hits "realization".
const CUES: Cue[] = [
  { head: 'realization', test: /\b(realiz|realis|recogni|dawns on|it hits you|sudden understanding|the moment (you|we|they|two))/, temporality: 'instantaneous', subtype: 'recognition' },
  { head: 'moment', test: /\b(moment|the instant|split[- ]second|the second (you|we|they|when)|the point at which)/, temporality: 'instantaneous' },
  { head: 'bodily_sensation', test: /\b(bodily|physical sensation|in your (body|chest|stomach|throat)|the slight (movement|gesture|flinch))/, temporality: 'instantaneous' },
  { head: 'social_phenomenon', test: /\b(social (reversal|dynamic|phenomenon)|when everyone|the collective|a whole (group|room|culture))/ },
  { head: 'relationship', test: /\b(the (bond|relationship|connection) between|between two people|each other|one another|the way (two|people|we|they))/ },
  { head: 'capacity', test: /\b(the ability|the capacity|being able to|the skill of|the power to)/, temporality: 'timeless' },
  { head: 'person', test: /\b(a person who|someone who|the (kind of )?person|the one who|a man who|a woman who)/ },
  { head: 'trait', test: /\b(the (habit|tendency|trait|quirk|disposition) (of|to)|the way someone (always|tends))/, temporality: 'timeless' },
  { head: 'process', test: /\b(the (process|act) of|gradually|slowly (becoming|turning|drifting)|the slow )/, temporality: 'durative' },
  { head: 'feeling', test: /\b(the feeling|the ache|the sense of|the emotion|feeling of|the quiet (grief|joy|dread|sorrow)|the private (amusement|joy|grief))/ },
  { head: 'condition', test: /\b(the state of|the condition of|being (in a state|stuck|caught) )/ },
]

function testAll(text: string, re: RegExp): boolean {
  return re.test(text)
}

export function detectTargetType(brief: string): TargetType {
  const text = (brief ?? '').toLowerCase()

  let head: HeadType = 'principle'
  let temporality: TargetType['requiredTemporality'] = 'unspecified'
  let subtype: string | undefined
  let confidence: TargetType['confidence'] = 'low'

  for (const cue of CUES) {
    if (testAll(text, cue.test)) {
      head = cue.head
      temporality = cue.temporality ?? 'unspecified'
      subtype = cue.subtype
      confidence = 'high'
      break
    }
  }

  // Sociality — who the meaning is between.
  const interpersonal = /\b(two people|between (two|us|them)|each other|one another|they both|we both|both of (us|them))\b/.test(text)
  const collective = /\b(everyone|society|a (group|crowd|room|culture)|people|the public|collective)\b/.test(text)
  const sociality: TargetType['requiredSociality'] = interpersonal
    ? 'interpersonal'
    : collective
      ? 'collective'
      : 'individual'
  const participants = interpersonal ? ['person_a', 'person_b'] : collective ? ['group'] : []

  // Mechanism — a light structural note (the "because / under different names" clause).
  if (!subtype && /\b(same (thing|experience|meaning)|equivalent|under different (names|words)|different (words|names) for)\b/.test(text)) {
    subtype = 'equivalence'
  }
  const mechanism = /\bbecause\b/.test(text)
    ? text.split('because')[1]?.trim().slice(0, 80)
    : subtype === 'equivalence'
      ? 'different words revealing the same experience'
      : undefined

  const targetType = subtype ? `${head}_of_${subtype}` : head

  return {
    targetType,
    headType: head,
    subtype,
    participants,
    mechanism,
    requiredTemporality: temporality,
    requiredSociality: sociality,
    confidence,
  }
}

/* ── Ontological compatibility ─────────────────────────────────────────── */

const GROUPS: Record<HeadType, string> = {
  moment: 'temporal',
  event: 'temporal',
  realization: 'temporal',
  action: 'temporal',
  process: 'durative',
  state: 'stative',
  condition: 'stative',
  feeling: 'stative',
  trait: 'stative',
  principle: 'abstract',
  capacity: 'abstract',
  person: 'entity',
  object: 'entity',
  relationship: 'social',
  social_phenomenon: 'social',
  cultural_phenomenon: 'social',
  bodily_sensation: 'bodily',
}

/** Groups that partly overlap — a middling (not full, not alien) match. */
const RELATED: Array<[string, string]> = [
  ['temporal', 'durative'],
  ['stative', 'abstract'],
  ['stative', 'bodily'],
  ['social', 'entity'],
  ['temporal', 'stative'],
]

/**
 * 0–1 match between the KIND of thing a lens produces and the KIND the prompt asks
 * for. Exact head → 1; same ontological group → 0.82; related groups → 0.55; alien
 * → 0.25. This is what lets a moment prompt reject a principle from direct ranking.
 */
export function targetTypeMatch(candidate: HeadType, target: HeadType): number {
  if (candidate === target) return 1
  const gc = GROUPS[candidate]
  const gt = GROUPS[target]
  if (gc === gt) return 0.82
  if (RELATED.some(([a, b]) => (a === gc && b === gt) || (a === gt && b === gc))) return 0.55
  return 0.25
}
