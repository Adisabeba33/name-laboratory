import type { AcousticProfile, Phonology, WordGenome } from './types'
import { endsOpen } from './acoustics'

/**
 * Engine v0.36 Phase 3 — Semantic Phonology validation.
 *
 * The meaning shapes the word's sound (Engine V5); this checks whether the FINAL
 * form actually expresses that intention. It compares the intended acoustic profile
 * (what the word was shaped toward) with the observed profile of the coined form,
 * and returns a congruence score with a plain explanation. A modeled judgement,
 * stated as such — not a proven universal law of sound symbolism.
 */

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** Read the observed acoustic profile off a finished word + its genome. */
export function observedProfile(word: string, genome: WordGenome): AcousticProfile {
  return {
    hardness: clamp01(genome.sharpness),
    depth: clamp01(genome.weight),
    // Fewer syllables read as more clipped/abrupt; more as flowing.
    clip: clamp01(1 - (genome.syllables - 1) / 4),
    openness: endsOpen(word) ? 0.8 : 0.3,
  }
}

export function computePhonology(
  word: string,
  genome: WordGenome,
  intended: AcousticProfile,
): Phonology {
  const observed = observedProfile(word, genome)
  const diff =
    Math.abs(observed.hardness - intended.hardness) +
    Math.abs(observed.depth - intended.depth) +
    Math.abs(observed.clip - intended.clip) +
    Math.abs(observed.openness - intended.openness)
  const congruence = clamp01(1 - diff / 4)

  const band: Phonology['band'] =
    congruence >= 0.8 ? 'High' : congruence >= 0.65 ? 'Fair' : congruence >= 0.5 ? 'Weak' : 'Contradicts'

  return { intended, observed, congruence, band, explanation: explain(observed, intended, band) }
}

/** A human sentence about how the sound mirrors (or misses) the meaning. */
function explain(observed: AcousticProfile, intended: AcousticProfile, band: Phonology['band']): string {
  // Name the axis where intended and observed agree most, and where they diverge most.
  const axes: [keyof AcousticProfile, string, string][] = [
    ['hardness', 'a hard, plosive attack', 'a soft, liquid attack'],
    ['depth', 'deep, rounded vowels', 'bright, front vowels'],
    ['clip', 'a short, abrupt shape', 'a long, flowing shape'],
    ['openness', 'an open, unfinished ending', 'a closed, firm ending'],
  ]
  const scored = axes.map(([k, hi, lo]) => ({
    k, hi, lo,
    agree: 1 - Math.abs(observed[k] - intended[k]),
    lean: observed[k] >= 0.5 ? hi : lo,
  }))
  const best = [...scored].sort((a, b) => b.agree - a.agree)[0]
  const worst = [...scored].sort((a, b) => a.agree - b.agree)[0]

  if (band === 'High' || band === 'Fair') {
    return `The form leans into ${best.lean}, mirroring the meaning's intended physics.`
  }
  if (band === 'Weak') {
    return `The sound only loosely tracks the meaning — it carries ${best.lean} but wants more of the intended ${worst.k}.`
  }
  return `The sound works against the meaning: it reads as ${worst.lean} where the meaning asks for the opposite.`
}
