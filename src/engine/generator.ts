import type {
  Concept,
  ConceptVector,
  CreativeMode,
  GenerationRequest,
  WordFamily,
  WordPassport,
} from './types'
import { ARCHETYPES, type Archetype } from './data/archetypes'
import { DEFAULT_MODE } from './data/modes'
import { buildConceptMap, topConcepts } from './concepts'
import { Rng, hashSeed } from './rng'
import { growFamily } from './synth'
import { computeGenome } from './genome'
import { computeEmotionalDNA } from './emotional'
import { ratePronunciation } from './pronunciation'
import { matchBrands } from './brand'
import { IDEAS } from './data/ideas'
import {
  buildDifficulty,
  buildExplanation,
  buildLineage,
  buildMeaning,
  buildPersonality,
  buildStory,
} from './narrative'

/** Which archetypes a creative mode leans toward (a soft boost, not a lock). */
const MODE_ARCHETYPES: Record<CreativeMode, string[]> = {
  minimal: ['liquid', 'crystalline'],
  luxury: ['noble', 'solar'],
  scientific: ['crystalline'],
  nature: ['verdant', 'earthen'],
  fantasy: ['ethereal', 'ancient'],
  technology: ['crystalline', 'ethereal'],
  medical: ['liquid', 'verdant', 'crystalline'],
  ancient: ['ancient'],
  space: ['ethereal', 'crystalline', 'solar'],
  japanese: ['liquid', 'ethereal'],
  scandinavian: ['earthen', 'crystalline'],
  futuristic: ['crystalline', 'ethereal'],
  organic: ['verdant', 'liquid'],
  timeless: ['noble', 'ancient', 'liquid'],
}

const WORDS_PER_FAMILY = 3

/**
 * The laboratory's front door — now family-first.
 *
 * A generation doesn't return a flat list of near-identical names. It selects
 * several *distinct* linguistic archetypes that resonate with the brief, then
 * grows a small family of kin words inside each. The result reads as several
 * new linguistic species discovered at once.
 */
export function generateFamilies(request: GenerationRequest): WordFamily[] {
  const mode: CreativeMode = request.mode ?? DEFAULT_MODE
  const familyCount = Math.max(3, Math.min(8, request.count ?? 6))

  // Step 1 — Meaning → Concept.
  const concepts = buildConceptMap(request.keywords, request.brief)
  const leadConcepts = topConcepts(concepts, 8)

  const seed =
    request.seed ??
    hashSeed(`${request.keywords.join(',')}|${request.brief ?? ''}|${mode}`)
  const rng = new Rng(seed)

  // Step 2 — choose a diverse set of archetypes (the "species").
  const chosen = selectArchetypes(concepts, mode, familyCount, rng)

  // Step 3 — grow a kin family inside each archetype.
  const families: WordFamily[] = []
  const seenWords = new Set<string>()

  chosen.forEach((archetype, i) => {
    const { lead, support } = pickConcepts(archetype, concepts, leadConcepts)
    const grown = growFamily(archetype, rng, WORDS_PER_FAMILY)

    const words = grown.members
      .filter((w) => {
        const key = w.toLowerCase()
        if (seenWords.has(key)) return false
        seenWords.add(key)
        return true
      })
      .map((w) => buildPassport(w, archetype, i, grown.stem, lead, support, concepts))

    if (words.length === 0) return
    families.push({
      id: `${archetype.id}-${i}`,
      name: cap(grown.stem) + '‑',
      character: archetype.character,
      theme: IDEAS[lead].noun,
      words,
    })
  })

  return families
}

/**
 * Backwards-compatible flat list of passports, if a caller just wants words.
 * The UI uses {@link generateFamilies}; this keeps the engine easy to embed.
 */
export function generateWords(request: GenerationRequest): WordPassport[] {
  return generateFamilies(request).flatMap((f) => f.words)
}

/** Assemble a full Word Passport for one synthesised word. */
export function buildPassport(
  word: string,
  archetype: Archetype,
  familyIndex: number,
  stem: string,
  lead: Concept,
  support: Concept | undefined,
  concepts: ConceptVector,
): WordPassport {
  const usedConcepts = support && support !== lead ? [lead, support] : [lead]
  const genome = computeGenome(word, usedConcepts)
  const emotionalDNA = computeEmotionalDNA(genome, concepts, archetype)

  return {
    word,
    family: { id: `${archetype.id}-${familyIndex}`, name: cap(stem) + '‑' },
    meaning: buildMeaning(lead, support),
    lineage: buildLineage(lead, archetype),
    emotionalDNA,
    personality: buildPersonality(emotionalDNA),
    pronunciation: ratePronunciation(word, genome),
    difficulty: buildDifficulty(genome),
    brandFit: matchBrands(emotionalDNA),
    story: buildStory(word, lead, archetype),
    explanation: buildExplanation(lead, support, archetype),
    genome,
  }
}

/**
 * Pick a diverse set of archetypes for this brief. Each archetype is scored by
 * how well its concepts resonate with the concept map, boosted by the creative
 * mode. We then take the top distinct archetypes — because the archetypes are
 * inherently different, the resulting families sound nothing alike.
 */
function selectArchetypes(
  concepts: ConceptVector,
  mode: CreativeMode,
  count: number,
  rng: Rng,
): Archetype[] {
  const modeFavourites = new Set(MODE_ARCHETYPES[mode] ?? [])
  const ranked = ARCHETYPES.map((a) => {
    const resonance = a.concepts.reduce((sum, c) => sum + (concepts[c] ?? 0), 0)
    const modeBoost = modeFavourites.has(a.id) ? 0.6 : 0
    const jitter = rng.next() * 0.25
    return { archetype: a, score: resonance + modeBoost + jitter }
  }).sort((x, y) => y.score - x.score)

  return ranked.slice(0, Math.min(count, ARCHETYPES.length)).map((r) => r.archetype)
}

/**
 * Choose the idea a family is grown around: a lead concept the archetype
 * resonates with, plus a distinct supporting concept from the brief.
 */
function pickConcepts(
  archetype: Archetype,
  concepts: ConceptVector,
  leadConcepts: Concept[],
): { lead: Concept; support?: Concept } {
  // Lead: the brief's strongest concept this archetype can naturally carry.
  const lead =
    leadConcepts.find((c) => archetype.concepts.includes(c)) ??
    archetype.concepts.find((c) => (concepts[c] ?? 0) > 0) ??
    archetype.concepts[0]

  // Support: prefer another concept this archetype resonates with (keeps the
  // pairing on-theme and, because it differs per archetype, stops every family
  // from reading "meeting <the same concept>"). Fall back to the brief's next
  // strongest concept, then to a second archetype concept.
  const support =
    leadConcepts.find((c) => c !== lead && archetype.concepts.includes(c)) ??
    leadConcepts.find((c) => c !== lead) ??
    archetype.concepts.find((c) => c !== lead)

  return { lead, support }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
