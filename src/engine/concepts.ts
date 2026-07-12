import type { Concept, ConceptVector } from './types'
import { KEYWORD_CONCEPTS, DEFAULT_CONCEPT } from './data/concepts'

/**
 * Step 1 of the pipeline: Meaning → Concept.
 *
 * Turn the user's free-text brief and keywords into the AI's "internal semantic
 * map" — a weighted {@link ConceptVector}. This happens before any sound is
 * chosen, honouring the vision's insistence on meaning first.
 */
export function buildConceptMap(
  keywords: string[],
  brief?: string,
): ConceptVector {
  const tokens = [
    ...keywords.flatMap(tokenise),
    ...(brief ? tokenise(brief) : []),
  ]

  const vector: ConceptVector = {}
  let matched = false

  for (const token of tokens) {
    const entry = resolveKeyword(token)
    if (!entry) continue
    matched = true
    for (const [concept, weight] of Object.entries(entry) as [Concept, number][]) {
      vector[concept] = (vector[concept] ?? 0) + weight
    }
  }

  // If nothing matched, seed with the neutral "creation" concept so downstream
  // steps still have something to build from.
  if (!matched) {
    vector[DEFAULT_CONCEPT] = 1
  }

  return normaliseVector(vector)
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length > 1)
}

/** Resolve a token to concepts, tolerating simple plural/suffix variation. */
export function resolveKeyword(token: string): ConceptVector | undefined {
  if (KEYWORD_CONCEPTS[token]) return KEYWORD_CONCEPTS[token]

  // Try a few light stemming steps.
  const stems = [
    token.replace(/(ing|ed|es|s|ly|ness|ity|tion|al)$/, ''),
    token.replace(/s$/, ''),
  ]
  for (const stem of stems) {
    if (stem.length > 2 && KEYWORD_CONCEPTS[stem]) return KEYWORD_CONCEPTS[stem]
  }

  // Try prefix match against known keys (e.g. "innovate" → "innovat…").
  for (const key of Object.keys(KEYWORD_CONCEPTS)) {
    if (key.length > 3 && (token.startsWith(key) || key.startsWith(token))) {
      return KEYWORD_CONCEPTS[key]
    }
  }
  return undefined
}

/** Scale a vector so its largest component is 1. */
export function normaliseVector(vector: ConceptVector): ConceptVector {
  const max = Math.max(0, ...Object.values(vector))
  if (max === 0) return vector
  const out: ConceptVector = {}
  for (const [k, v] of Object.entries(vector) as [Concept, number][]) {
    out[k] = v / max
  }
  return out
}

/** The concepts with the highest weight, most salient first. */
export function topConcepts(vector: ConceptVector, n = 5): Concept[] {
  return (Object.entries(vector) as [Concept, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([c]) => c)
}

/** Score how well a set of concepts matches the target vector (0–1-ish). */
export function conceptMatch(
  target: ConceptVector,
  concepts: Concept[],
): number {
  if (concepts.length === 0) return 0
  let score = 0
  concepts.forEach((c, i) => {
    // Earlier concepts in a root's list are more salient.
    const salience = 1 - i * 0.25
    score += (target[c] ?? 0) * Math.max(0.25, salience)
  })
  return score
}
