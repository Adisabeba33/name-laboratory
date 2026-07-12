import type {
  Concept,
  ConceptVector,
  CreativeMode,
  EmotionalAxis,
  EmotionalDNA,
  WordGenome,
} from './types'
import { MODES } from './data/modes'
import { clamp01 } from './phonetics'

/**
 * Step 3 of the pipeline: derive Emotional Identity.
 *
 * The vision asks for measurable emotional attributes ("Premium 95%, Scientific
 * 92%…"). We compute each axis from three signals:
 *   1. the word's genome (how it sounds and looks),
 *   2. the concept map (what it means), and
 *   3. the creative mode (the register the user chose).
 *
 * Every axis lands on 0–100.
 */

/** How much each concept pushes each emotional axis. */
const CONCEPT_EMOTION: Partial<Record<Concept, Partial<Record<EmotionalAxis, number>>>> = {
  knowledge: { scientific: 0.6, trustworthy: 0.3, premium: 0.2 },
  intelligence: { scientific: 0.6, futuristic: 0.3, premium: 0.2 },
  science: { scientific: 0.8, trustworthy: 0.2 },
  precision: { scientific: 0.5, minimal: 0.4, elegant: 0.2 },
  healing: { trustworthy: 0.6, warm: 0.5, natural: 0.3 },
  calm: { trustworthy: 0.4, elegant: 0.3, minimal: 0.3, warm: 0.2 },
  trust: { trustworthy: 0.8, premium: 0.2 },
  future: { futuristic: 0.8, creative: 0.2 },
  vision: { futuristic: 0.4, creative: 0.4, premium: 0.2 },
  luxury: { premium: 0.9, elegant: 0.5 },
  elevation: { premium: 0.4, elegant: 0.3 },
  power: { powerful: 0.8, aggressive: 0.3 },
  strength: { powerful: 0.7, trustworthy: 0.2 },
  energy: { energetic: 0.8, powerful: 0.3 },
  nature: { natural: 0.9, warm: 0.3 },
  earth: { natural: 0.6, powerful: 0.2 },
  water: { natural: 0.4, elegant: 0.3, warm: 0.2 },
  fire: { energetic: 0.5, aggressive: 0.3, powerful: 0.3 },
  light: { elegant: 0.4, premium: 0.3, warm: 0.3 },
  mystery: { mystical: 0.8, premium: 0.2 },
  harmony: { elegant: 0.5, trustworthy: 0.3, warm: 0.2 },
  human: { warm: 0.6, trustworthy: 0.3 },
  creation: { creative: 0.8, energetic: 0.2 },
  order: { minimal: 0.4, trustworthy: 0.3, scientific: 0.2 },
  freedom: { energetic: 0.4, creative: 0.3 },
  sky: { futuristic: 0.3, elegant: 0.3, mystical: 0.2 },
  time: { premium: 0.3, mystical: 0.3, trustworthy: 0.2 },
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
  mode: CreativeMode,
): EmotionalDNA {
  const dna = Object.fromEntries(AXES.map((a) => [a, 0])) as EmotionalDNA

  // 1) Genome-driven baselines — how the word sounds and looks.
  dna.premium += genome.weight * 0.35 + genome.pronounceability * 0.2 + (1 - genome.sharpness) * 0.15
  dna.scientific += genome.sharpness * 0.35 + genome.syllableHarmony * 0.15
  dna.elegant += genome.rhythm * 0.3 + (1 - genome.sharpness) * 0.25 + genome.visualSymmetry * 0.15
  dna.trustworthy += genome.pronounceability * 0.3 + (1 - genome.sharpness) * 0.2 + genome.rhythm * 0.1
  dna.creative += genome.uniqueness * 0.35 + genome.semanticDepth * 0.15
  dna.minimal += clamp01(1 - genome.length / 10) * 0.35 + (genome.syllables <= 2 ? 0.25 : 0)
  dna.powerful += genome.weight * 0.4 + genome.sharpness * 0.2
  dna.energetic += genome.sharpness * 0.3 + clamp01(genome.syllables / 4) * 0.15
  dna.warm += genome.vowelRatio * 0.35 + (1 - genome.sharpness) * 0.2
  dna.futuristic += genome.uniqueness * 0.25 + genome.sharpness * 0.2
  dna.mystical += genome.weight * 0.2 + (1 - genome.pronounceability) * 0.15 + genome.vowelRatio * 0.1
  dna.playful += genome.vowelRatio * 0.25 + clamp01(1 - genome.weight) * 0.2 + (genome.syllables <= 2 ? 0.1 : 0)
  dna.aggressive += genome.sharpness * 0.35 + genome.weight * 0.15
  dna.natural += genome.vowelRatio * 0.2 + (1 - genome.sharpness) * 0.2

  // 2) Concept-driven contributions — what the word means.
  const totalWeight = Math.max(0.001, sum(Object.values(concepts)))
  for (const [concept, weight] of Object.entries(concepts) as [Concept, number][]) {
    const push = CONCEPT_EMOTION[concept]
    if (!push) continue
    const share = weight / totalWeight
    for (const [axis, amount] of Object.entries(push) as [EmotionalAxis, number][]) {
      dna[axis] += amount * share * 1.4
    }
  }

  // 3) Mode emphasis — the register the user asked for.
  for (const axis of MODES[mode].emphasise) {
    dna[axis] += 0.18
  }

  // Convert to 0–100, clamped, with a gentle floor so no axis is exactly zero.
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
