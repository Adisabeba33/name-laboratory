import type { AcousticProfile, Concept, ConceptVector } from './types'
import type { Rng } from './rng'
import { isVowel, normalise } from './phonetics'

export type { AcousticProfile }

/**
 * Semantic Phonology (Engine V5).
 *
 * The sound of a word should emerge from the *meaning*, not only from the
 * language. A concept is first reduced to its "emotional physics" — a Semantic
 * Acoustic Profile — and that profile then biases which phonemes and shapes the
 * synthesiser reaches for inside its language's inventory. So a grief word leans
 * soft/deep/open; a destruction word leans hard/clipped — even in the same
 * language. The word starts to *carry* the meaning, not just label it.
 *
 * Four phonetic-facing axes, each 0–1 (0.5 = neutral):
 * - hardness: soft/liquid consonants (0) ↔ hard/plosive (1)
 * - depth:    bright/front vowels (0) ↔ deep/back/round vowels (1)
 * - clip:     long, flowing shapes (0) ↔ short, abrupt shapes (1)
 * - openness: closed, hard endings (0) ↔ open, airy, unfinished endings (1)
 *
 * (`AcousticProfile` lives in types.ts and is re-exported above.)
 */

const NEUTRAL: AcousticProfile = { hardness: 0.5, depth: 0.5, clip: 0.5, openness: 0.5 }

/** Per-concept acoustic tendencies. Any axis left unset defaults to 0.5. */
const CONCEPT_ACOUSTICS: Partial<Record<Concept, Partial<AcousticProfile>>> = {
  destruction: { hardness: 0.9, clip: 0.85, openness: 0.2 },
  fire: { hardness: 0.85, clip: 0.8, depth: 0.4 },
  power: { hardness: 0.8, depth: 0.7, clip: 0.6, openness: 0.3 },
  energy: { hardness: 0.75, clip: 0.8, openness: 0.35 },
  strength: { hardness: 0.75, depth: 0.65, clip: 0.55 },
  courage: { hardness: 0.7, clip: 0.6 },
  precision: { hardness: 0.75, clip: 0.75, openness: 0.25 },
  science: { hardness: 0.7, clip: 0.7, openness: 0.3 },
  order: { hardness: 0.65, clip: 0.6, openness: 0.35 },
  intelligence: { hardness: 0.6, clip: 0.6 },
  knowledge: { hardness: 0.5, clip: 0.5 },
  grief: { hardness: 0.2, depth: 0.8, clip: 0.15, openness: 0.8 },
  loss: { hardness: 0.2, depth: 0.75, clip: 0.2, openness: 0.85 },
  longing: { hardness: 0.25, depth: 0.7, clip: 0.2, openness: 0.85 },
  shadow: { hardness: 0.35, depth: 0.8, clip: 0.3, openness: 0.6 },
  memory: { hardness: 0.3, depth: 0.6, clip: 0.25, openness: 0.7 },
  depth: { hardness: 0.4, depth: 0.9, clip: 0.2, openness: 0.5 },
  time: { hardness: 0.35, depth: 0.75, clip: 0.2, openness: 0.6 },
  mystery: { hardness: 0.35, depth: 0.7, clip: 0.3, openness: 0.6 },
  calm: { hardness: 0.15, depth: 0.45, clip: 0.2, openness: 0.7 },
  water: { hardness: 0.15, clip: 0.25, openness: 0.75, depth: 0.45 },
  healing: { hardness: 0.2, clip: 0.3, openness: 0.65 },
  harmony: { hardness: 0.25, clip: 0.35, openness: 0.6 },
  unity: { hardness: 0.3, openness: 0.55 },
  trust: { hardness: 0.3, clip: 0.4 },
  human: { hardness: 0.35, clip: 0.4 },
  luxury: { hardness: 0.3, depth: 0.55, openness: 0.5 },
  light: { hardness: 0.4, depth: 0.15, openness: 0.75 },
  hope: { hardness: 0.35, depth: 0.2, openness: 0.7 },
  sky: { hardness: 0.3, depth: 0.2, openness: 0.8 },
  freedom: { hardness: 0.4, depth: 0.25, openness: 0.8, clip: 0.4 },
  transcendence: { hardness: 0.3, depth: 0.25, openness: 0.85 },
  elevation: { hardness: 0.4, depth: 0.3, openness: 0.7 },
  vision: { hardness: 0.4, depth: 0.3, openness: 0.65 },
  future: { hardness: 0.45, depth: 0.5, clip: 0.45, openness: 0.6 },
  transformation: { hardness: 0.5, clip: 0.5, openness: 0.5 },
  rebirth: { hardness: 0.45, openness: 0.6 },
  creation: { hardness: 0.5, openness: 0.55 },
  movement: { hardness: 0.5, clip: 0.6 },
  earth: { hardness: 0.55, depth: 0.75, clip: 0.45 },
  nature: { hardness: 0.4, depth: 0.55, openness: 0.55 },
  survival: { hardness: 0.55, depth: 0.6, clip: 0.5 },
  resilience: { hardness: 0.55, depth: 0.6, clip: 0.45 },
  identity: { depth: 0.55 },
}

function axis(a: Partial<AcousticProfile> | undefined, k: keyof AcousticProfile): number {
  return a && a[k] !== undefined ? (a[k] as number) : 0.5
}

/** Reduce a whole concept vector to its Semantic Acoustic Profile (weighted mean). */
export function acousticProfile(concepts: ConceptVector): AcousticProfile {
  let h = 0
  let d = 0
  let c = 0
  let o = 0
  let total = 0
  for (const [concept, weight] of Object.entries(concepts) as [Concept, number][]) {
    if (!weight || weight <= 0) continue
    const a = CONCEPT_ACOUSTICS[concept]
    h += axis(a, 'hardness') * weight
    d += axis(a, 'depth') * weight
    c += axis(a, 'clip') * weight
    o += axis(a, 'openness') * weight
    total += weight
  }
  if (total === 0) return { ...NEUTRAL }
  return { hardness: h / total, depth: d / total, clip: c / total, openness: o / total }
}

/** The profile of a single concept (its meaning in sound). */
export function conceptAcoustic(concept: Concept): AcousticProfile {
  return acousticProfile({ [concept]: 1 } as ConceptVector)
}

/** Blend two profiles (t = weight of `a`). */
export function blendAcoustic(a: AcousticProfile, b: AcousticProfile, t: number): AcousticProfile {
  const m = (x: number, y: number) => x * t + y * (1 - t)
  return {
    hardness: m(a.hardness, b.hardness),
    depth: m(a.depth, b.depth),
    clip: m(a.clip, b.clip),
    openness: m(a.openness, b.openness),
  }
}

// ── Phoneme classifiers ────────────────────────────────────────────────
const HARD = new Set(['k', 'q', 't', 'd', 'g', 'b', 'p', 'x', 'c', 'z'])
const SOFT = new Set(['l', 'm', 'n', 'r', 's', 'v', 'w', 'h', 'f', 'y'])
const DEEP_V = new Set(['o', 'u'])
const FRONT_V = new Set(['i', 'e', 'y'])

/** 0 (all soft) → 1 (all hard) over the consonants in a cluster; 0.5 if none. */
export function consonantHardness(cluster: string): number {
  let hard = 0
  let soft = 0
  for (const ch of normalise(cluster)) {
    if (HARD.has(ch)) hard++
    else if (SOFT.has(ch)) soft++
  }
  const total = hard + soft
  return total === 0 ? 0.5 : hard / total
}

/** 0 (front/bright) → 1 (back/deep) over the vowels in a nucleus; 0.5 if mixed/`a`. */
export function vowelDepth(nucleus: string): number {
  let deep = 0
  let front = 0
  for (const ch of normalise(nucleus)) {
    if (DEEP_V.has(ch)) deep++
    else if (FRONT_V.has(ch)) front++
  }
  const total = deep + front
  return total === 0 ? 0.5 : deep / total
}

/**
 * Weighted random pick from `items` using the seeded rng — items scoring higher
 * on `weightOf` are more likely, but every item keeps a floor so variety stays.
 */
export function weightedPick<T>(items: readonly T[], rng: Rng, weightOf: (t: T) => number): T {
  if (items.length === 0) throw new Error('weightedPick: empty')
  const weights = items.map((it) => Math.max(0.06, weightOf(it)))
  const sum = weights.reduce((a, b) => a + b, 0)
  let r = rng.next() * sum
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

/** True if a token ends on a vowel (an open, airy ending). */
export function endsOpen(token: string): boolean {
  const w = normalise(token)
  return w.length > 0 && isVowel(w[w.length - 1])
}
