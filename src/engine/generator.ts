import type {
  Concept,
  ConceptVector,
  CreativeMode,
  EvolutionStats,
  GenerationRequest,
  LaboratoryResult,
  LanguageLens,
  MeaningAnalysis,
  WordFamily,
  WordPassport,
} from './types'
import { LANGUAGES, type Language } from './data/languages'
import { THEMES } from './data/themes'
import { DEFAULT_MODE } from './data/modes'
import { topConcepts } from './concepts'
import { analyzeMeaning } from './meaning'
import { Rng, hashSeed } from './rng'
import { speakNative } from './synth'
import { computeGenome } from './genome'
import { speakabilityBand } from './phonetics'
import { offlineCollision } from './collision'
import { naturalness, naturalnessBand, EXCEPTIONAL_NATURALNESS } from './naturalness'
import { computeFitness } from './fitness'
import { acousticProfile, blendAcoustic, conceptAcoustic } from './acoustics'
import { computeEmotionalDNA } from './emotional'
import { computeLanguageGenome, computeWordEvolution } from './language'
import { ratePronunciation } from './pronunciation'
import { assessAdoption } from './adoption'
import { pronounce } from './pronounce'
import { translitRu } from './translit'
import { matchBrands } from './brand'
import { IDEAS } from './data/ideas'
import {
  buildAncestry,
  buildDifficulty,
  buildExplanation,
  buildMeaning,
  buildPersonality,
  buildStory,
  buildConstruction,
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
 * Semantic viewpoints (anti-convergence). Each discovered language is assigned a
 * DIFFERENT lens so the run reads as several civilizations looking at the same
 * meaning from different sides — not one observation restated 18 times. These
 * deliberately point away from the convergence trap ("what remains / the core").
 */
const LENSES: LanguageLens[] = [
  { role: 'the event', question: 'What actually happened?' },
  { role: 'the person', question: 'Who did you become?' },
  { role: 'the feeling', question: 'What does it feel like from the inside?' },
  { role: 'the turning point', question: 'The exact moment it changed?' },
  { role: 'the cost', question: 'What did it take from you?' },
  { role: 'the observer', question: 'What would someone else notice?' },
  { role: 'what emerged', question: 'What is new that was not there before?' },
  { role: 'the aftermath', question: 'What does ordinary life become now?' },
]

/**
 * The laboratory's front door — the full Meaning Engine pipeline.
 *
 *   Meaning Analysis → Hidden Concepts → Concept Network → Language Discovery
 *   → Language Genome → Word Evolution → Word
 *
 * It first decides what the request is really about (analyzeMeaning), then
 * discovers the languages whose philosophy fits that meaning, and grows
 * native-speaker words. The interpretation is returned alongside the words.
 */
export function runLaboratory(request: GenerationRequest): LaboratoryResult {
  const analysis = analyzeMeaning(request.keywords, request.brief)
  const families = discoverFamilies(request, analysis)
  return { analysis, families, population: aggregatePopulation(families) }
}

/** Discover just the languages (the UI uses {@link runLaboratory}). */
export function generateFamilies(request: GenerationRequest): WordFamily[] {
  return runLaboratory(request).families
}

/**
 * Build a full result from an externally-supplied analysis — e.g. one produced
 * by the LLM meaning analyzer instead of the local `analyzeMeaning()`. The rest
 * of the pipeline (language discovery, word synthesis, passports) is identical.
 */
export function discoverFromAnalysis(
  analysis: MeaningAnalysis,
  request: GenerationRequest,
  focus?: ConceptVector,
): LaboratoryResult {
  // A focus (from chosen concept directions) re-weights discovery without
  // changing the analysis the UI shows — the interpretation stays stable while
  // the words sharpen toward the selected angle.
  const forDiscovery = focus ? { ...analysis, concepts: focus } : analysis
  const families = discoverFamilies(request, forDiscovery)
  return { analysis, families, population: aggregatePopulation(families) }
}

/**
 * Sum the per-language census slices into the run-level lexical-evolution funnel.
 * Every field is additive, so the totals stay honest: the run explored exactly the
 * forms the languages explored, rejected exactly the ones they rejected, and so on.
 */
function aggregatePopulation(families: WordFamily[]): EvolutionStats {
  return families.reduce<EvolutionStats>(
    (acc, f) => ({
      generated: acc.generated + f.stats.generated,
      rejected: acc.rejected + f.stats.rejected,
      survived: acc.survived + f.stats.survived,
      recommended: acc.recommended + f.stats.recommended,
      exceptional: acc.exceptional + f.stats.exceptional,
    }),
    { generated: 0, rejected: 0, survived: 0, recommended: 0, exceptional: 0 },
  )
}

function discoverFamilies(request: GenerationRequest, analysis: MeaningAnalysis): WordFamily[] {
  const mode: CreativeMode = request.mode ?? DEFAULT_MODE
  const languageCount = Math.max(3, Math.min(8, request.count ?? 6))

  const concepts = analysis.concepts
  const leadConcepts = topConcepts(concepts, 8)
  // A wide, distinct spread of angles so each language can lead with a DIFFERENT
  // primary concept instead of all converging on the single strongest one.
  const anglePool = topConcepts(concepts, Math.max(languageCount, 8))
  // Engine V5 — the meaning's overall acoustic physics, blended per-language below.
  const meaningAcoustic = acousticProfile(concepts)

  const seed =
    request.seed ??
    hashSeed(`${request.keywords.join(',')}|${request.brief ?? ''}|${mode}`)
  const rng = new Rng(seed)

  // Step 2 — Language Discovery: languages whose philosophy fits the meaning.
  const chosen = selectLanguages(concepts, mode, languageCount, rng, analysis.theme)

  // Step 3 — for each language, derive its genome and generate native words.
  const families: WordFamily[] = []
  const seenWords = new Set<string>()

  chosen.forEach((language, i) => {
    // Anti-convergence: this language leads with its OWN distinct primary angle
    // (round-robin over the spread, so families don't all pick the same concept),
    // and takes a distinct semantic lens (the event / the person / the feeling…).
    const primary = anglePool.length ? anglePool[i % anglePool.length] : leadConcepts[0]
    const lens = LENSES[i % LENSES.length]
    // The concepts this language can carry, in brief-priority order. Each word
    // takes a different lead/support pair from this list, so every word gets its
    // own shade of meaning while staying on the language's distinct angle.
    const langConcepts = pickLanguageConcepts(language, concepts, leadConcepts, primary)
    // V5 — this language's sound leans toward its own angle, anchored to the whole
    // meaning, so a grief-angle language sounds different from a fire-angle one.
    const acoustic = blendAcoustic(conceptAcoustic(primary), meaningAcoustic, 0.6)
    const vocab = speakNative(language, rng, WORDS_PER_LANGUAGE, request.speakability, acoustic)
    const fresh = vocab.words.filter((w) => {
      const key = w.toLowerCase()
      if (seenWords.has(key)) return false
      seenWords.add(key)
      return true
    })
    if (fresh.length === 0) return

    const languageGenome = computeLanguageGenome(language, fresh)
    const reference = fresh[0]
    const words = fresh.map((w, idx) => {
      const lead = langConcepts[idx % langConcepts.length]
      const support =
        langConcepts.length > 1
          ? langConcepts[(idx + 1) % langConcepts.length]
          : undefined
      return buildPassport(w, language, i, lead, support, concepts, idx + 1, reference, vocab.prototype)
    })

    // V6 — close this language's funnel: the shipped words are the "recommended"
    // survivors; the rare standouts are "exceptional". A standout must clear THREE
    // independent bars at once — near-perfect naturalness, colliding with no known
    // word, and compact enough to say in one breath — so it names the genuine few,
    // never "every word is a 99". The census's generated/rejected/survived came
    // straight from synthesis.
    const stats: EvolutionStats = {
      generated: vocab.census.generated,
      rejected: vocab.census.rejected,
      survived: vocab.census.survived,
      recommended: words.length,
      exceptional: words.filter(
        (w) =>
          naturalness(w.word) >= EXCEPTIONAL_NATURALNESS &&
          w.collision.match === 'none' &&
          w.genome.syllables <= 3,
      ).length,
    }

    families.push({
      id: `${language.id}-${i}`,
      name: language.character,
      character: language.character,
      description: language.description,
      nativeCharacteristics: language.nativeCharacteristics,
      genome: languageGenome,
      ancestry: language.families,
      theme: IDEAS[langConcepts[0]].noun,
      lens,
      acoustic,
      stats,
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
  const pronunciation = ratePronunciation(word, genome)

  return {
    word,
    family: { id: `${language.id}-${languageIndex}`, name: language.character },
    meaning: buildMeaning(lead, support),
    shortMeaning: '',
    partOfSpeech: 'noun',
    transliteration: translitRu(word),
    usage: { en: [], ru: [] },
    pronunciationGuide: pronounce(word, language.stressPattern),
    speakability: speakabilityBand(word),
    naturalness: naturalnessBand(naturalness(word)),
    fitness: computeFitness(word, emotionalDNA, pronunciation),
    collision: offlineCollision(word),
    ancestry: buildAncestry(lead, language),
    evolution,
    emotionalDNA,
    personality: buildPersonality(emotionalDNA),
    pronunciation,
    adoption: assessAdoption(word, genome, pronunciation),
    difficulty: buildDifficulty(genome),
    brandFit: matchBrands(emotionalDNA),
    story: buildStory(word, lead, language),
    explanation: buildExplanation(lead, support, language),
    genome,
    construction: buildConstruction(word, lead, support, language),
    origin: { lead, support, concepts, languageId: language.id, generation },
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
  themeId?: string,
): Language[] {
  const favourites = new Set(MODE_LANGUAGES[mode] ?? [])
  // A recognised theme steers strongly toward the languages whose philosophy
  // fits its meaning (so a rebirth prompt surfaces Ashen/Phoenix, not Solar).
  const themePreferred = new Set(
    themeId ? THEMES.find((t) => t.id === themeId)?.preferredLanguages ?? [] : [],
  )
  const ranked = LANGUAGES.map((l) => {
    const resonance = l.concepts.reduce((sum, c) => sum + (concepts[c] ?? 0), 0)
    const modeBoost = favourites.has(l.id) ? 0.4 : 0
    const themeBoost = themePreferred.has(l.id) ? 1.2 : 0
    const jitter = rng.next() * 0.2
    return { language: l, score: resonance + modeBoost + themeBoost + jitter }
  }).sort((x, y) => y.score - x.score)

  return ranked.slice(0, Math.min(count, LANGUAGES.length)).map((r) => r.language)
}

/**
 * The ordered set of concepts a language can carry for this brief. The brief's
 * strongest concepts the language resonates with come first, then its next
 * strongest, then the language's own concepts as a fallback — so there is always
 * enough distinct material to give each word its own meaning.
 */
function pickLanguageConcepts(
  language: Language,
  concepts: ConceptVector,
  leadConcepts: Concept[],
  primary: Concept,
): Concept[] {
  const ordered: Concept[] = []
  const add = (c: Concept | undefined) => {
    if (c && !ordered.includes(c)) ordered.push(c)
  }

  // 0) the language's ASSIGNED distinct angle leads — this is what keeps families
  //    from all converging on the single strongest brief concept.
  add(primary)
  // 1) the language's own concepts that the brief also touched (its native shade).
  for (const c of language.concepts) if ((concepts[c] ?? 0) > 0) add(c)
  // 2) brief concepts the language natively resonates with.
  for (const c of leadConcepts) if (language.concepts.includes(c)) add(c)
  // 3) remaining brief concepts, then the language's defaults.
  for (const c of leadConcepts) add(c)
  for (const c of language.concepts) add(c)

  return ordered.slice(0, 4)
}
