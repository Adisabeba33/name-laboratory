import type {
  Concept,
  ConceptVector,
  EmotionalAxis,
  EmotionalDNA,
  WordGenome,
} from './types'
import type { Language } from './data/languages'
import { clamp01 } from './phonetics'

/**
 * Derive Emotional Identity.
 *
 * The feedback was that emotional DNA felt static — every word scoring ~the same
 * premium/scientific/elegant. The fix is to give the *archetype* a strong, and
 * strongly distinct, emotional signature. A Crystalline family and a Verdant
 * family now start from very different places, so families read as genuinely
 * different personalities. Concepts tilt it toward the brief; the word's own
 * genome adds the fine, per-word variation within a family.
 */

/** How much each concept pushes each emotional axis. */
const CONCEPT_EMOTION: Partial<Record<Concept, Partial<Record<EmotionalAxis, number>>>> = {
  knowledge: { scientific: 0.5, trustworthy: 0.3 },
  intelligence: { scientific: 0.5, futuristic: 0.3 },
  science: { scientific: 0.7 },
  precision: { scientific: 0.4, minimal: 0.4 },
  healing: { trustworthy: 0.5, warm: 0.5, natural: 0.3 },
  calm: { trustworthy: 0.3, elegant: 0.3, minimal: 0.3 },
  trust: { trustworthy: 0.7 },
  future: { futuristic: 0.7, creative: 0.2 },
  vision: { futuristic: 0.4, creative: 0.4 },
  luxury: { premium: 0.8, elegant: 0.5 },
  elevation: { premium: 0.4, elegant: 0.3 },
  power: { powerful: 0.7, aggressive: 0.3 },
  strength: { powerful: 0.6, trustworthy: 0.2 },
  energy: { energetic: 0.7, powerful: 0.3 },
  nature: { natural: 0.8, warm: 0.3 },
  earth: { natural: 0.5, powerful: 0.2 },
  water: { natural: 0.3, elegant: 0.3 },
  fire: { energetic: 0.5, aggressive: 0.3, powerful: 0.3 },
  light: { elegant: 0.3, premium: 0.3, warm: 0.3 },
  mystery: { mystical: 0.7 },
  harmony: { elegant: 0.4, trustworthy: 0.3, warm: 0.2 },
  human: { warm: 0.6, trustworthy: 0.3 },
  creation: { creative: 0.7, energetic: 0.2 },
  order: { minimal: 0.4, trustworthy: 0.3, scientific: 0.2 },
  freedom: { energetic: 0.4, creative: 0.3 },
  sky: { futuristic: 0.3, elegant: 0.3, mystical: 0.2 },
  time: { premium: 0.3, mystical: 0.3 },
  depth: { mystical: 0.4, premium: 0.2 },
  movement: { energetic: 0.5, futuristic: 0.2 },
  unity: { trustworthy: 0.4, warm: 0.3 },
}

const AXES: EmotionalAxis[] = [
  'premium', 'scientific', 'elegant', 'trustworthy', 'creative', 'natural',
  'minimal', 'powerful', 'energetic', 'warm', 'futuristic', 'mystical',
  'playful', 'aggressive',
]

export function computeEmotionalDNA(
  genome: WordGenome,
  concepts: ConceptVector,
  language: Language,
): EmotionalDNA {
  const dna = Object.fromEntries(AXES.map((a) => [a, 0])) as EmotionalDNA

  // 1) Language signature — the dominant, species-defining term.
  for (const [axis, amount] of Object.entries(language.emotion) as [EmotionalAxis, number][]) {
    dna[axis] += amount * 0.9
  }

  // 2) Concept tilt — pulls the family toward the brief.
  const totalWeight = Math.max(0.001, sum(Object.values(concepts)))
  for (const [concept, weight] of Object.entries(concepts) as [Concept, number][]) {
    const push = CONCEPT_EMOTION[concept]
    if (!push) continue
    const share = weight / totalWeight
    for (const [axis, amount] of Object.entries(push) as [EmotionalAxis, number][]) {
      dna[axis] += amount * share * 1.1
    }
  }

  // 3) Genome fine-tuning — the per-word variation *within* a family. Small, so
  //    kin words stay close while different archetypes stay far apart.
  dna.premium += genome.weight * 0.15 + (1 - genome.sharpness) * 0.05
  dna.scientific += genome.sharpness * 0.15
  dna.elegant += genome.rhythm * 0.1 + genome.visualSymmetry * 0.05
  dna.minimal += clamp01(1 - genome.length / 10) * 0.15
  dna.powerful += genome.weight * 0.12
  dna.energetic += genome.sharpness * 0.1
  dna.warm += genome.vowelRatio * 0.12
  dna.mystical += (1 - genome.pronounceability) * 0.08
  dna.playful += genome.vowelRatio * 0.1 + (genome.syllables <= 2 ? 0.06 : 0)
  dna.creative += genome.uniqueness * 0.1
  dna.aggressive += genome.sharpness * 0.12

  for (const axis of AXES) {
    dna[axis] = Math.round(clamp01(dna[axis]) * 100)
  }
  return dna
}

/** The strongest emotional axes, most salient first. */
export function dominantEmotions(dna: EmotionalDNA, n = 4): EmotionalAxis[] {
  return (Object.entries(dna) as [EmotionalAxis, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([a]) => a)
}

function sum(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0)
}
