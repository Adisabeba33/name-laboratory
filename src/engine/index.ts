/**
 * Word Laboratory engine — public surface.
 *
 * The engine is framework-agnostic pure TypeScript: no React, no DOM, no network.
 * That keeps the meaning-first pipeline testable in isolation and ready to be
 * driven later by an LLM or an interactive "Word Genome" slider UI.
 */
export * from './types'
export { generateWords, buildPassport } from './generator'
export { buildConceptMap, topConcepts, conceptMatch } from './concepts'
export { computeGenome, genomeQuality, estimateUniqueness, editDistance } from './genome'
export { computeEmotionalDNA, dominantEmotions } from './emotional'
export { matchBrands } from './brand'
export { ratePronunciation } from './pronunciation'
export { MODES, DEFAULT_MODE } from './data/modes'
export type { ModeProfile } from './data/modes'
export { ROOTS } from './data/roots'
export { Rng, hashSeed } from './rng'
