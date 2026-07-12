import type { Concept, ConceptVector } from '../types'

/**
 * Keyword → concept map.
 *
 * The vision's first step is that the AI builds an *internal semantic map* from
 * the user's keywords before choosing any sounds. This table is that map: a user
 * word like "trust" expands into the concepts it implies, each with a weight.
 *
 * Keys are matched case-insensitively and by stem, so "healing", "heal" and
 * "healer" all resolve here.
 */
export const KEYWORD_CONCEPTS: Record<string, ConceptVector> = {
  trust: { trust: 1, calm: 0.4, order: 0.3 },
  trustworthy: { trust: 1, calm: 0.4 },
  intelligence: { intelligence: 1, knowledge: 0.6, precision: 0.3 },
  intelligent: { intelligence: 1, knowledge: 0.5 },
  smart: { intelligence: 0.9, precision: 0.3 },
  calm: { calm: 1, harmony: 0.4, healing: 0.2 },
  precision: { precision: 1, order: 0.5, science: 0.3 },
  precise: { precision: 1, order: 0.4 },
  future: { future: 1, vision: 0.4, movement: 0.3 },
  futuristic: { future: 1, vision: 0.4 },
  knowledge: { knowledge: 1, intelligence: 0.5 },
  healing: { healing: 1, human: 0.4, calm: 0.3 },
  heal: { healing: 1, human: 0.3 },
  health: { healing: 0.9, human: 0.4, nature: 0.2 },
  medicine: { healing: 1, science: 0.5, human: 0.4 },
  medical: { healing: 1, science: 0.5 },
  science: { science: 1, knowledge: 0.5, precision: 0.4 },
  scientific: { science: 1, precision: 0.4 },
  human: { human: 1, healing: 0.3, calm: 0.2 },
  premium: { luxury: 1, elevation: 0.4, precision: 0.2 },
  luxury: { luxury: 1, elevation: 0.5 },
  elegant: { luxury: 0.7, harmony: 0.5, order: 0.3 },
  power: { power: 1, strength: 0.6, energy: 0.4 },
  powerful: { power: 1, strength: 0.6 },
  strong: { strength: 1, power: 0.5 },
  strength: { strength: 1, power: 0.5 },
  nature: { nature: 1, earth: 0.4, calm: 0.3 },
  natural: { nature: 1, earth: 0.3 },
  organic: { nature: 1, human: 0.3, healing: 0.3 },
  energy: { energy: 1, movement: 0.5, fire: 0.3 },
  energetic: { energy: 1, movement: 0.5 },
  light: { light: 1, vision: 0.5, knowledge: 0.3 },
  bright: { light: 1, vision: 0.4 },
  vision: { vision: 1, future: 0.4, light: 0.3 },
  visionary: { vision: 1, future: 0.5 },
  order: { order: 1, precision: 0.5, harmony: 0.3 },
  harmony: { harmony: 1, calm: 0.4, unity: 0.4 },
  unity: { unity: 1, harmony: 0.4, human: 0.3 },
  creative: { creation: 1, energy: 0.3, vision: 0.3 },
  creation: { creation: 1, vision: 0.3 },
  create: { creation: 1 },
  water: { water: 1, calm: 0.3, movement: 0.3 },
  ocean: { water: 1, depth: 0.5, freedom: 0.3 },
  fire: { fire: 1, energy: 0.6, power: 0.3 },
  earth: { earth: 1, nature: 0.5, strength: 0.3 },
  sky: { sky: 1, freedom: 0.5, elevation: 0.4 },
  space: { sky: 1, future: 0.4, mystery: 0.4 },
  cosmic: { sky: 0.8, mystery: 0.5, order: 0.4 },
  time: { time: 1, order: 0.3, mystery: 0.3 },
  timeless: { time: 1, order: 0.4, luxury: 0.3 },
  mystery: { mystery: 1, depth: 0.4 },
  mystical: { mystery: 1, light: 0.2 },
  freedom: { freedom: 1, sky: 0.4, movement: 0.4 },
  free: { freedom: 1, movement: 0.3 },
  depth: { depth: 1, mystery: 0.4, knowledge: 0.3 },
  deep: { depth: 1, mystery: 0.3 },
  movement: { movement: 1, energy: 0.4 },
  motion: { movement: 1, energy: 0.3 },
  minimal: { order: 0.6, calm: 0.4, precision: 0.4 },
  ai: { intelligence: 1, future: 0.6, science: 0.5, precision: 0.4 },
  tech: { future: 0.8, science: 0.5, precision: 0.4 },
  technology: { future: 0.8, science: 0.6, precision: 0.4 },
  finance: { trust: 0.8, order: 0.6, power: 0.4, precision: 0.4 },
  wellness: { healing: 0.8, calm: 0.6, nature: 0.4, human: 0.4 },
  wisdom: { knowledge: 1, intelligence: 0.5, time: 0.3 },
  wise: { knowledge: 0.9, intelligence: 0.5 },
  growth: { creation: 0.7, nature: 0.5, movement: 0.4, elevation: 0.4 },
  grow: { creation: 0.6, nature: 0.5, elevation: 0.4 },
  balance: { harmony: 1, calm: 0.5, order: 0.4 },
  clarity: { precision: 0.8, light: 0.6, vision: 0.5 },
  clear: { precision: 0.6, light: 0.6 },
  pure: { calm: 0.5, precision: 0.5, light: 0.4 },
  purity: { calm: 0.5, precision: 0.5, light: 0.4 },
}

/**
 * A tiny fallback lexicon so unknown keywords still contribute something.
 * Maps common letters/sounds heuristically is overkill; instead we map a few
 * broad hints and otherwise nudge toward "creation" (the act of naming itself).
 */
export const DEFAULT_CONCEPT: Concept = 'creation'
