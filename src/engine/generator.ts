import type {
  Concept,
  ConceptVector,
  CreativeMode,
  GenerationRequest,
  Root,
  WordPassport,
} from './types'
import { ROOTS } from './data/roots'
import { MODES, DEFAULT_MODE } from './data/modes'
import { buildConceptMap, conceptMatch } from './concepts'
import { Rng, hashSeed } from './rng'
import { assemble, type Candidate } from './assembler'
import { computeGenome, genomeQuality, estimateUniqueness } from './genome'
import { computeEmotionalDNA } from './emotional'
import { ratePronunciation } from './pronunciation'
import { matchBrands } from './brand'
import {
  buildDifficulty,
  buildExplanation,
  buildMeaning,
  buildOrigin,
  buildPersonality,
  buildStory,
} from './narrative'

/** Minimum novelty for a candidate to be accepted (0–1). */
const UNIQUENESS_THRESHOLD = 0.35

/**
 * The laboratory's front door.
 *
 * Runs the full vision pipeline for a request:
 *   Meaning → Concept → Emotional Identity → Linguistic Structure → Phonetics → Word
 * and returns a ranked list of {@link WordPassport}s.
 */
export function generateWords(request: GenerationRequest): WordPassport[] {
  const mode: CreativeMode = request.mode ?? DEFAULT_MODE
  const count = Math.max(1, Math.min(24, request.count ?? 6))

  // Step 1 — Meaning → Concept: build the internal semantic map.
  const concepts = buildConceptMap(request.keywords, request.brief)

  // Deterministic seed from the request (or an explicit seed).
  const seed =
    request.seed ??
    hashSeed(`${request.keywords.join(',')}|${request.brief ?? ''}|${mode}`)
  const rng = new Rng(seed)

  // Steps 4–6 — construct many candidates from concept-matched roots.
  const rootPairs = selectRootPairs(concepts, mode, rng)
  const candidates: Candidate[] = []
  for (const [head, tail] of rootPairs) {
    candidates.push(...assemble(head, tail, mode, rng))
  }

  // Score, filter for novelty, dedupe, rank.
  const scored = candidates
    .map((c) => ({ candidate: c, quality: scoreCandidate(c, concepts, mode) }))
    .filter((s) => estimateUniqueness(s.candidate.word) >= UNIQUENESS_THRESHOLD)
    .sort((a, b) => b.quality - a.quality)

  const chosen: Candidate[] = []
  const seenWords = new Set<string>()
  for (const { candidate } of scored) {
    const key = candidate.word.toLowerCase()
    if (seenWords.has(key)) continue
    seenWords.add(key)
    chosen.push(candidate)
    if (chosen.length >= count) break
  }

  return chosen.map((c) => buildPassport(c, concepts, mode))
}

/** Assemble the full Word Passport for a single accepted candidate. */
export function buildPassport(
  candidate: Candidate,
  concepts: ConceptVector,
  mode: CreativeMode,
): WordPassport {
  const usedConcepts = uniqueConcepts([candidate.head, candidate.tail])
  const genome = computeGenome(candidate.word, usedConcepts)
  const emotionalDNA = computeEmotionalDNA(genome, concepts, mode)

  return {
    word: candidate.word,
    meaning: buildMeaning(candidate, concepts),
    origin: buildOrigin(candidate),
    emotionalDNA,
    personality: buildPersonality(emotionalDNA),
    pronunciation: ratePronunciation(candidate.word, genome),
    difficulty: buildDifficulty(genome),
    brandFit: matchBrands(emotionalDNA),
    story: buildStory(candidate, genome),
    explanation: buildExplanation(candidate, genome, concepts),
    genome,
  }
}

/**
 * Choose head/tail root pairs whose meanings match the concept map, biased toward
 * the creative mode's favoured language families.
 */
function selectRootPairs(
  concepts: ConceptVector,
  mode: CreativeMode,
  rng: Rng,
): Array<[Root, Root]> {
  const favoured = new Set(MODES[mode].favourFamilies)

  const ranked = ROOTS.map((root) => {
    const semantic = conceptMatch(concepts, root.concepts)
    const familyBonus = favoured.has(root.family) ? 0.4 : 0
    // A little noise so repeated runs with the same request still vary a touch.
    const jitter = rng.next() * 0.15
    return { root, score: semantic + familyBonus + jitter }
  }).sort((a, b) => b.score - a.score)

  const heads = ranked
    .filter((r) => r.root.position !== 'tail')
    .slice(0, 8)
    .map((r) => r.root)
  const tails = ranked
    .filter((r) => r.root.position !== 'head')
    .slice(0, 8)
    .map((r) => r.root)

  const pairs: Array<[Root, Root]> = []
  for (const head of heads) {
    // Pair each head with a couple of strong, distinct tails.
    let paired = 0
    for (const tail of tails) {
      if (tail.form === head.form) continue
      pairs.push([head, tail])
      if (++paired >= 3) break
    }
  }
  return pairs
}

/** Combined quality: sound (genome) plus how well its roots serve the concepts. */
function scoreCandidate(
  candidate: Candidate,
  concepts: ConceptVector,
  mode: CreativeMode,
): number {
  const usedConcepts = uniqueConcepts([candidate.head, candidate.tail])
  const genome = computeGenome(candidate.word, usedConcepts)
  const soundScore = genomeQuality(genome)

  const semantic =
    (conceptMatch(concepts, candidate.head.concepts) +
      conceptMatch(concepts, candidate.tail.concepts)) /
    2

  // Reward hitting the mode's target syllable range.
  const [minSyl, maxSyl] = MODES[mode].syllables
  const sylFit =
    genome.syllables >= minSyl && genome.syllables <= maxSyl ? 0.1 : 0

  return soundScore * 0.6 + Math.min(1, semantic) * 0.3 + sylFit
}

function uniqueConcepts(roots: Root[]): Concept[] {
  return [...new Set(roots.flatMap((r) => r.concepts))]
}
