import type {
  Concept,
  ConceptVector,
  CreativeMode,
  GenerationRequest,
  WordFamily,
  WordPassport,
} from './types'
import { LANGUAGES, type Language } from './data/languages'
import { DEFAULT_MODE } from './data/modes'
import { buildConceptMap, topConcepts } from './concepts'
import { Rng, hashSeed } from './rng'
import { speakNative } from './synth'
import { computeGenome } from './genome'
import { computeEmotionalDNA } from './emotional'
import { computeLanguageGenome, computeWordEvolution } from './language'
import { ratePronunciation } from './pronunciation'
import { matchBrands } from './brand'
import { IDEAS } from './data/ideas'
import {
  buildAncestry,
  buildDifficulty,
  buildExplanation,
  buildMeaning,
  buildPersonality,
  buildStory,
} from './narrative'

/** Which languages a creative mode leans toward (a soft boost, not a lock). */
const MODE_LANGUAGES: Record<CreativeMode, string[]> = {
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

const WORDS_PER_LANGUAGE = 3

/**
 * The laboratory's front door — now it discovers *languages*.
 *
 * A generation selects several distinct linguistic species that resonate with
 * the brief, gives each a Language Genome, then generates native-speaker words
 * that obey it. Each word is a living specimen — a generation, a mutation, a
 * distance travelled along its language's evolutionary path.
 */
export function generateFamilies(request: GenerationRequest): WordFamily[] {
  const mode: CreativeMode = request.mode ?? DEFAULT_MODE
  const languageCount = Math.max(3, Math.min(8, request.count ?? 6))

  // Step 1 — Meaning → Concept.
  const concepts = buildConceptMap(request.keywords, request.brief)
  const leadConcepts = topConcepts(concepts, 8)

  const seed =
    request.seed ??
    hashSeed(`${request.keywords.join(',')}|${request.brief ?? ''}|${mode}`)
  const rng = new Rng(seed)

  // Step 2 — Language Discovery: choose distinct species.
  const chosen = selectLanguages(concepts, mode, languageCount, rng)

  // Step 3 — for each language, derive its genome and generate native words.
  const families: WordFamily[] = []
  const seenWords = new Set<string>()

  chosen.forEach((language, i) => {
    const { lead, support } = pickConcepts(language, concepts, leadConcepts)
    const vocab = speakNative(language, rng, WORDS_PER_LANGUAGE)
    const fresh = vocab.words.filter((w) => {
      const key = w.toLowerCase()
      if (seenWords.has(key)) return false
      seenWords.add(key)
      return true
    })
    if (fresh.length === 0) return

    const languageGenome = computeLanguageGenome(language, fresh)
    const reference = fresh[0]
    const words = fresh.map((w, gen) =>
      buildPassport(w, language, i, lead, support, concepts, gen + 1, reference, vocab.prototype),
    )

    families.push({
      id: `${language.id}-${i}`,
      name: language.character,
      character: language.character,
      description: language.description,
      nativeCharacteristics: language.nativeCharacteristics,
      genome: languageGenome,
      ancestry: language.families,
      theme: IDEAS[lead].noun,
      words,
    })
  })

  return families
}

/** Backwards-compatible flat list of passports. */
export function generateWords(request: GenerationRequest): WordPassport[] {
  return generateFamilies(request).flatMap((f) => f.words)
}

/** Assemble a full Word Passport for one native-speaker word. */
export function buildPassport(
  word: string,
  language: Language,
  languageIndex: number,
  lead: Concept,
  support: Concept | undefined,
  concepts: ConceptVector,
  generation: number,
  reference: string,
  prototype: string,
): WordPassport {
  const usedConcepts = support && support !== lead ? [lead, support] : [lead]
  const genome = computeGenome(word, usedConcepts)
  const emotionalDNA = computeEmotionalDNA(genome, concepts, language)
  const evolution = computeWordEvolution(word, genome, language, generation, reference, prototype)

  return {
    word,
    family: { id: `${language.id}-${languageIndex}`, name: language.character },
    meaning: buildMeaning(lead, support),
    ancestry: buildAncestry(lead, language),
    evolution,
    emotionalDNA,
    personality: buildPersonality(emotionalDNA),
    pronunciation: ratePronunciation(word, genome),
    difficulty: buildDifficulty(genome),
    brandFit: matchBrands(emotionalDNA),
    story: buildStory(word, lead, language),
    explanation: buildExplanation(lead, support, language),
    genome,
  }
}

/**
 * Choose a diverse set of languages for this brief. Each is scored by how well
 * its concepts resonate with the concept map, boosted by the creative mode. The
 * top distinct species are taken — because the languages are inherently
 * different sound worlds, the discovered set sounds nothing alike.
 */
function selectLanguages(
  concepts: ConceptVector,
  mode: CreativeMode,
  count: number,
  rng: Rng,
): Language[] {
  const favourites = new Set(MODE_LANGUAGES[mode] ?? [])
  const ranked = LANGUAGES.map((l) => {
    const resonance = l.concepts.reduce((sum, c) => sum + (concepts[c] ?? 0), 0)
    const modeBoost = favourites.has(l.id) ? 0.6 : 0
    const jitter = rng.next() * 0.25
    return { language: l, score: resonance + modeBoost + jitter }
  }).sort((x, y) => y.score - x.score)

  return ranked.slice(0, Math.min(count, LANGUAGES.length)).map((r) => r.language)
}

/** Choose the idea a language is discovered around: a lead + distinct support. */
function pickConcepts(
  language: Language,
  concepts: ConceptVector,
  leadConcepts: Concept[],
): { lead: Concept; support?: Concept } {
  const lead =
    leadConcepts.find((c) => language.concepts.includes(c)) ??
    language.concepts.find((c) => (concepts[c] ?? 0) > 0) ??
    language.concepts[0]

  const support =
    leadConcepts.find((c) => c !== lead && language.concepts.includes(c)) ??
    leadConcepts.find((c) => c !== lead) ??
    language.concepts.find((c) => c !== lead)

  return { lead, support }
}
