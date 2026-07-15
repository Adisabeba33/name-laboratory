import type { Concept, ConceptVector } from './types'

/**
 * Attractor damping (Morutho fix §7) — a tiny, dependency-free module so BOTH the
 * deterministic engine (`meaning.ts`) and the LLM seam (`api/analyze.ts`) can share
 * one canonical copy. Keeping it standalone (types-only imports) means the
 * serverless analyze function can import it without pulling the whole engine graph.
 *
 * "Engine favourite" concepts and the prompt cues that would justify them. When one
 * appears in the vector but the prompt contains none of its signature phrases, it is
 * a broad emotional association the reader reached for, not something the user asked
 * for — so it is damped. This stops identity / transformation / hope from dominating
 * a prompt that never named them.
 */
export const ATTRACTOR_SIGNATURES: Partial<Record<Concept, RegExp>> = {
  identity: /\b(identity|who i (am|was)|the person i (was|am|became)|myself|sense of self|(become|becoming|became) (someone|a (different|new) person)|different person)\b/,
  hope: /\b(hope|hopeful|optimis|looking forward|a better (day|future|life))\b/,
  longing: /\b(long(ing)?|yearn|ache for|miss(ing)?|nostalg)\b/,
  transformation: /\b(transform|becom(e|ing)|became|change(d|s)? into|metamorph|turn(ed|ing) into)\b/,
  memory: /\b(memor|remember|recall|forget|reminisc|the past)\b/,
  survival: /\b(surviv|endur|made it through|lived through|barely)\b/,
  grief: /\b(grief|griev|mourn|loss|bereave|sorrow)\b/,
  rebirth: /\b(rebirth|reborn|born again|renew|from the ashes)\b/,
}

/**
 * Cue for a genuine transformation/rebirth register — used to guard the coarse
 * `metamorphosis` theme so it can't flatten a prompt that never named becoming.
 */
export const METAMORPHOSIS_CUE =
  /\b(transform|becom(e|ing)|became|metamorph|rebirth|reborn|born again|from the ashes|a (different|new) person|change(d|s)? into|turn(ed|ing) into)\b/

/**
 * Damp any attractor concept the prompt does not actually support (§7). Pure:
 * returns a new vector. An unsupported attractor keeps 40% of its weight (so a
 * faint, still-traceable echo survives) rather than dominating.
 */
export function dampenAttractors(vector: ConceptVector, text: string): ConceptVector {
  const out: ConceptVector = { ...vector }
  for (const [concept, signature] of Object.entries(ATTRACTOR_SIGNATURES) as [Concept, RegExp][]) {
    if (out[concept] != null && !signature.test(text)) {
      out[concept] = (out[concept] as number) * 0.4
    }
  }
  return out
}
