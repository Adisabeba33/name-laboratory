import type {
  Concept,
  ConceptFidelity,
  ConceptVector,
  CreativeMode,
  EvolutionStats,
  GenerationRequest,
  LaboratoryResult,
  LanguageLens,
  LanguageRefusal,
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
import { offlineCollision, buildCollisionReport } from './collision'
import { naturalness, naturalnessBand, EXCEPTIONAL_NATURALNESS } from './naturalness'
import { computeFitness } from './fitness'
import { computeDictionaryViability } from './dictionary-viability'
import { computeBrandSafety } from './brand-safety'
import { computeDiscovery, isExceptionalEligible, NEUTRAL_ACOUSTIC } from './lexical-score'
import { computeParadigm } from './morphology'
import { computeEtymology } from './etymology'
import { computePhonology } from './phonology'
import { computeSemanticNetwork } from './network'
import { targetTypeMatch, detectTargetType } from './target-type'
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
 * Semantic viewpoints (anti-convergence, v0.36 dynamic-lens pool). Each lens has a
 * distinct `semanticRole`, and adjacent lenses declare the concepts they `requires`
 * — a lens is only offered when the meaning actually contains one of them, so
 * "the cost / the observer / the person" no longer force irrelevant angles onto a
 * prompt that has nothing to do with them. DIRECT lenses (which name the meaning
 * itself) carry no requirement and are always eligible, so a run always has at
 * least one direct answer to rank.
 *
 * The deterministic engine SELECTS from this pool by relevance; the LLM path can
 * later generate truly bespoke lenses into the same shape.
 */
interface LensDef extends LanguageLens {
  /** Concepts that must be present for an adjacent lens to be offered (empty = always). */
  requires: Concept[]
}

const LENS_POOL: LensDef[] = [
  // Direct lenses — name the meaning itself; always eligible. Their OUTPUT TYPE is
  // what the ranking fix keys on: "the meaning itself" yields a principle, "the
  // threshold" yields a moment — so a moment prompt makes the moment lens direct
  // and demotes the principle lens, and vice versa.
  { role: 'the meaning itself', question: 'What is it, named directly?', semanticRole: 'direct_target', direct: true, outputType: 'principle', requires: [] },
  { role: 'the threshold', question: 'The exact moment it becomes real?', semanticRole: 'event', direct: true, outputType: 'moment', requires: [] },
  // Process — a general, always-eligible fallback so a run can always be filled.
  { role: 'the process', question: 'How does it unfold?', semanticRole: 'process', direct: false, outputType: 'process', requires: [] },
  // Adjacent lenses — offered only when the meaning supports them.
  { role: 'the capacity', question: 'What new ability does it grant?', semanticRole: 'consequence', direct: false, outputType: 'capacity', requires: ['future', 'creation', 'knowledge', 'intelligence', 'transformation', 'vision'] },
  { role: 'the person', question: 'Who did you become?', semanticRole: 'actor', direct: false, outputType: 'person', requires: ['human', 'identity'] },
  { role: 'the feeling', question: 'What does it feel like from the inside?', semanticRole: 'emotional_response', direct: false, outputType: 'feeling', requires: ['grief', 'hope', 'longing', 'loss', 'courage', 'calm'] },
  { role: 'the cost', question: 'What did it take from you?', semanticRole: 'cost', direct: false, outputType: 'state', requires: ['loss', 'grief', 'survival'] },
  { role: 'the observer', question: 'What would someone else notice?', semanticRole: 'observer', direct: false, outputType: 'state', requires: ['human', 'vision'] },
  { role: 'the aftermath', question: 'What does ordinary life become now?', semanticRole: 'aftermath', direct: false, outputType: 'state', requires: ['transformation', 'future', 'memory', 'rebirth'] },
]

/** A family whose type matches the target this well (or better) can be a direct answer. */
const DIRECT_TARGET_MATCH = 0.6
/** A family must match the target this well to be eligible for Top Discovery (§6). */
const TOP_TARGET_MATCH = 0.8

/** Concepts that are recurrent engine archetypes — drift when a prompt did not ask for them. */
const ARCHETYPE_ATTRACTORS: Concept[] = [
  'survival', 'identity', 'rebirth', 'grief', 'loss', 'shadow',
  'destruction', 'resilience', 'memory', 'transformation',
]

/** A concept counts as "present" in the meaning above this weight. */
const PRESENT_THRESHOLD = 0.25

/**
 * Choose the lenses for this meaning (v0.36). Direct lenses lead and are always
 * kept; adjacent lenses are added only when the meaning contains a concept they
 * require; each semantic role appears at most once. Returns at most `max` lenses,
 * so a meaning with few relevant angles yields few families (variable output).
 */
function selectLenses(concepts: ConceptVector, max: number): LensDef[] {
  const present = (c: Concept) => (concepts[c] ?? 0) >= PRESENT_THRESHOLD
  const chosen: LensDef[] = []
  const roles = new Set<string>()
  const take = (lens: LensDef) => {
    if (roles.has(lens.semanticRole) || chosen.length >= max) return
    roles.add(lens.semanticRole)
    chosen.push(lens)
  }
  // Direct lenses first (always eligible).
  for (const lens of LENS_POOL) if (lens.direct) take(lens)
  // Then relevant adjacent lenses, strongest-supported first.
  const adjacent = LENS_POOL.filter((l) => !l.direct)
    .map((l) => ({ l, weight: l.requires.length === 0 ? 0.2 : Math.max(...l.requires.map((c) => concepts[c] ?? 0)) }))
    .filter((x) => x.l.requires.length === 0 || x.l.requires.some(present))
    .sort((a, b) => b.weight - a.weight)
  for (const { l } of adjacent) take(l)
  return chosen
}

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
  return {
    analysis,
    families,
    population: aggregatePopulation(families),
    conclusion: buildConclusion(families, analysis, request.brandMode),
  }
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
  // the words sharpen toward the selected angle. If the (LLM) analysis carries no
  // target type, detect it from the brief so the ranking gate still applies.
  const withTarget: MeaningAnalysis = analysis.targetType
    ? analysis
    : { ...analysis, targetType: detectTargetType(request.brief ?? '') }
  const forDiscovery = focus ? { ...withTarget, concepts: focus } : withTarget
  const families = discoverFamilies(request, forDiscovery)
  return {
    analysis,
    families,
    population: aggregatePopulation(families),
    conclusion: buildConclusion(families, analysis, request.brandMode),
  }
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

  // Morutho ranking fix — the locked target type, decided before generation.
  const target = analysis.targetType
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

  // Step 2 — Dynamic lenses (v0.36): choose only the viewpoints this meaning
  // actually supports. Fewer relevant lenses → fewer families (variable output),
  // never fewer than the always-eligible direct + process lenses.
  const lenses = selectLenses(concepts, languageCount)
  const effectiveCount = lenses.length

  // Step 2 — Language Discovery: languages whose philosophy fits the meaning.
  const chosen = selectLanguages(concepts, mode, effectiveCount, rng, analysis.theme)

  // Step 2b — Refusals (V4): a language whose worldview cannot hold a strong strand
  // of this meaning declines to translate it, rather than force a word that would
  // lie. Kept rare and never at the expense of a usable run: at most a couple of
  // languages refuse, and at least MIN_PRODUCERS always produce words.
  const refusals = planRefusals(chosen, concepts, effectiveCount)

  // Step 3 — for each language, derive its genome and generate native words.
  const families: WordFamily[] = []
  const seenWords = new Set<string>()

  chosen.forEach((language, i) => {
    // Anti-convergence: this language leads with its OWN distinct primary angle
    // (round-robin over the spread, so families don't all pick the same concept),
    // and takes a distinct semantic lens (the event / the person / the feeling…).
    const primary = anglePool.length ? anglePool[i % anglePool.length] : leadConcepts[0]
    const lens = lenses[i % lenses.length]
    // V5 — this language's sound leans toward its own angle, anchored to the whole
    // meaning, so a grief-angle language sounds different from a fire-angle one.
    const acoustic = blendAcoustic(conceptAcoustic(primary), meaningAcoustic, 0.6)

    // V4 — if this language refuses the meaning, record the refusal and coin nothing.
    const refusal = refusals.get(i)
    if (refusal) {
      families.push({
        id: `${language.id}-${i}`,
        name: language.character,
        character: language.character,
        description: language.description,
        nativeCharacteristics: language.nativeCharacteristics,
        genome: computeLanguageGenome(language, []),
        ancestry: language.families,
        theme: IDEAS[refusal.concept].noun,
        lens,
        semanticRole: lens.semanticRole,
        candidateType: lens.outputType,
        targetMatch: target ? targetTypeMatch(lens.outputType, target.headType) : 1,
        direct: false,
        fidelity: {
          band: 'weak',
          matched: [],
          missing: [],
          extraneous: [],
          driftDetected: false,
          note: 'This language declined to translate the meaning.',
        },
        acoustic,
        stats: { generated: 0, rejected: 0, survived: 0, recommended: 0, exceptional: 0 },
        refusal,
        words: [],
      })
      return
    }
    // The concepts this language can carry, in brief-priority order. Each word
    // takes a different lead/support pair from this list, so every word gets its
    // own shade of meaning while staying on the language's distinct angle.
    const langConcepts = pickLanguageConcepts(language, concepts, leadConcepts, primary)
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

    // v0.36 — how directly this family answers the confirmed gap, and whether it
    // has drifted into a recurrent archetype the prompt never asked for.
    const fidelity = computeFidelity(lens, langConcepts, concepts)

    // Morutho ranking fix — target-type gate. A family is direct only if its
    // ontological type matches the prompt's target (when the target is confidently
    // known), so an abstract principle can never pose as a direct moment. When the
    // target is uncertain (low confidence), we don't over-constrain: fidelity alone
    // decides, exactly as before.
    const candidateType = lens.outputType
    const targetMatch = target ? targetTypeMatch(candidateType, target.headType) : 1
    const typeOk = !target || target.confidence === 'low' || targetMatch >= DIRECT_TARGET_MATCH
    const direct = fidelity.band === 'direct' && typeOk

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
      semanticRole: lens.semanticRole,
      candidateType,
      targetMatch,
      direct,
      fidelity,
      acoustic,
      stats,
      words,
    })
  })

  // V4 — now that every word exists, wire the semantic network between them so the
  // lexicon is a navigable graph (each word links to its most-related peers).
  const network = computeSemanticNetwork(families)
  const coreSet = new Set(topConcepts(concepts, 6))
  for (const family of families) {
    for (const word of family.words) {
      word.relations = network.get(word.word.toLowerCase()) ?? []
      // v0.36 P3 — validate the sound against the family's intended acoustic profile.
      word.phonology = computePhonology(word.word, word.genome, family.acoustic)
      // v0.36 — finalise the Lexical Discovery Score now that the family's concept
      // fidelity (direct/adjacent/weak) and intended acoustic profile are known.
      // Per-word fidelity (band base + a bonus for each of THIS word's concepts
      // that hits the gap's core) spreads two words in one family apart.
      const base = family.fidelity.band === 'direct' ? 70 : family.fidelity.band === 'adjacent' ? 45 : 22
      const wordConcepts = [word.origin.lead, word.origin.support].filter(Boolean) as Concept[]
      const inCore = wordConcepts.filter((c) => coreSet.has(c)).length
      word.discovery = computeDiscovery({
        word: word.word,
        genome: word.genome,
        collision: word.collision,
        dictionaryViability: word.dictionaryViability,
        pronunciation: word.pronunciation,
        fidelityBand: family.fidelity.band,
        fidelityScore: Math.min(100, base + inCore * 13),
        acoustic: family.acoustic,
        brandMode: request.brandMode,
        collisionReport: word.collisionReport,
      })
    }
  }

  // v0.36 + Morutho fix — award "Exceptional" (the Top Discovery) to at most ONE
  // word per run: the strongest DIRECT candidate that also clears the absolute
  // bar AND, when the target type is confidently known, strongly matches it (§6).
  // So an adjacent principle can never be crowned over a direct moment, and many
  // runs honestly crown no one.
  const eligibleFamilies = families.filter(
    (f) => f.direct && (!target || target.confidence === 'low' || f.targetMatch >= TOP_TARGET_MATCH),
  )
  const directWords = eligibleFamilies.flatMap((f) => f.words)
  let top: WordPassport | undefined
  for (const w of directWords) {
    if (!isExceptionalEligible(w.discovery, w.dictionaryViability.overall)) continue
    if (!top || w.discovery.score > top.discovery.score) top = w
  }
  if (top) top.discovery = { ...top.discovery, classification: 'Exceptional' }

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
  const collision = offlineCollision(word)
  const collisionReport = buildCollisionReport(word)
  const etymology = computeEtymology(word, language, IDEAS[lead].essence)
  // v0.36 — could it behave like a real lexical item, and how strong is it overall.
  const dictionaryViability = computeDictionaryViability(word, pronunciation, etymology.stages.length)
  const brandSafety = computeBrandSafety({ word, collisionReport, dictionaryViability, genome, pronunciation })
  // The discovery score is finalised in the family post-pass with real fidelity;
  // here it is computed with a neutral (adjacent) context so a standalone or
  // evolved passport still carries a sensible score.
  const discovery = computeDiscovery({
    word, genome, collision, dictionaryViability, pronunciation,
    fidelityBand: 'adjacent', acoustic: NEUTRAL_ACOUSTIC,
  })
  // Phonology is finalised in the post-pass against the family's real acoustic
  // profile; a neutral intended profile here keeps standalone passports sensible.
  const phonology = computePhonology(word, genome, NEUTRAL_ACOUSTIC)

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
    dictionaryViability,
    discovery,
    paradigm: computeParadigm(word, IDEAS[lead].label.toLowerCase(), language),
    etymology,
    phonology,
    relations: [],
    collision,
    collisionReport,
    brandSafety,
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
 * Concept Fidelity (v0.36) — how directly a family answers the confirmed gap,
 * judged structurally. `matched` = the meaning's core concepts the family carries;
 * `extraneous` = archetype attractors it carries that the prompt never raised;
 * `driftDetected` when such an intrusion dominates. A family is `direct` only if
 * its lens is a direct one, it carries a core concept, and it has NOT drifted —
 * so a language-and-cognition meaning never lets a grief/survival word pose as a
 * direct answer. This is a structural read (concept overlap), stated as such.
 */
function computeFidelity(lens: LensDef, carried: Concept[], concepts: ConceptVector): ConceptFidelity {
  const core = topConcepts(concepts, 6)
  const coreSet = new Set(core)
  const matched = carried.filter((c) => coreSet.has(c))
  const missing = core.filter((c) => !carried.includes(c))
  const extraneous = carried.filter(
    (c) => ARCHETYPE_ATTRACTORS.includes(c) && !coreSet.has(c),
  )
  const driftDetected = extraneous.length > 0 && matched.length === 0

  let band: ConceptFidelity['band']
  let note: string
  if (driftDetected) {
    band = 'weak'
    note = `Drifted into ${extraneous[0]} — a theme the prompt did not raise.`
  } else if (lens.direct && matched.length > 0) {
    band = 'direct'
    note = `Names the gap directly through ${matched.slice(0, 2).join(' / ')}.`
  } else {
    band = 'adjacent'
    note = lens.direct
      ? 'A direct viewpoint, but only loosely tied to the core concepts.'
      : `An adjacent viewpoint (${lens.role}) on the meaning, not the meaning itself.`
  }
  return { band, matched, missing, extraneous, driftDetected, note }
}

/**
 * The laboratory's honest conclusion (v0.36). States the confirmed gap and how
 * many DIRECT candidates survived — including the honest empty case, which is a
 * strength: the engine would rather recommend another cycle than dress up an
 * adjacent word as a direct answer.
 */
function buildConclusion(families: WordFamily[], analysis: MeaningAnalysis, brandMode = false): string {
  const direct = families.filter((f) => f.direct).length
  const gap = (analysis.interpretation || '').trim().replace(/\s+/g, ' ')
  const gapLine = gap ? `Confirmed gap: ${gap}` : 'Confirmed gap identified.'
  if (brandMode) {
    const words = families.flatMap((f) => f.words)
    const safe = words.filter((w) => w.brandSafety.band === 'Strong' || w.brandSafety.band === 'Good').length
    return (
      `${gapLine} — Brand Mode: scoring for real-world name use, so collision safety outweighs meaning. ` +
      (safe > 0
        ? `${safe} name${safe === 1 ? '' : 's'} clear every collision check we can run offline (external brand / domain / trademark still unverified).`
        : `No name cleared the offline collision checks strongly — try another cycle. External checks remain unverified.`)
    )
  }
  if (direct === 0) {
    return `${gapLine} — No candidate passed every required gate as a direct answer; the laboratory recommends another evolutionary cycle. Adjacent discoveries are shown below.`
  }
  return `${gapLine} — ${direct} direct candidate${direct === 1 ? '' : 's'} survived; the rest are adjacent discoveries.`
}

/** Concept weight above which a meaning is "centred on" a concept (refusal gate). */
const REFUSE_THRESHOLD = 0.55
/** Never leave a run with fewer than this many producing languages. */
const MIN_PRODUCERS = 3

/**
 * Decide which discovered languages refuse this meaning (V4). A language refuses
 * when the meaning carries — strongly — a concept its worldview is blind to. Kept
 * deliberately rare: capped at one or two per run, and never enough to drop the
 * run below {@link MIN_PRODUCERS} producing languages. Deterministic (walks the
 * chosen order), so the same meaning always refuses in the same places.
 */
function planRefusals(
  chosen: Language[],
  concepts: ConceptVector,
  count: number,
): Map<number, LanguageRefusal> {
  const refusals = new Map<number, LanguageRefusal>()
  const maxRefusals = Math.min(count >= 5 ? 2 : 1, Math.max(0, chosen.length - MIN_PRODUCERS))
  if (maxRefusals === 0) return refusals

  // Only the meaning's genuinely central concepts can justify a refusal (§9).
  const core = new Set(topConcepts(concepts, 2))
  chosen.forEach((language, i) => {
    if (refusals.size >= maxRefusals) return
    const blind = blindConcept(language, concepts, core)
    if (blind) refusals.set(i, { concept: blind, reason: refusalReason(language, blind) })
  })
  return refusals
}

/**
 * The concept this language is blind to that the meaning is genuinely CENTRED on
 * (Morutho fix §9). Restricted to the meaning's core so a language never refuses
 * over a secondary emotion ("no shape for hope" when hope is a footnote) — the
 * refusal must be about the actual target.
 */
function blindConcept(language: Language, concepts: ConceptVector, core: Set<Concept>): Concept | null {
  let best: Concept | null = null
  let bestValue = REFUSE_THRESHOLD
  for (const c of language.blindTo ?? []) {
    if (!core.has(c)) continue
    const v = concepts[c] ?? 0
    if (v >= bestValue) {
      bestValue = v
      best = c
    }
  }
  return best
}

/**
 * An honest, in-character sentence for a refusal (§9). References the ACTUAL
 * central concept the language cannot hold, and frames the decline as a worldview
 * mismatch rather than a failure.
 */
function refusalReason(language: Language, concept: Concept): string {
  const c = IDEAS[concept].label.toLowerCase()
  return (
    `${language.character} does not lexicalize ${c} as a single word. ${language.feel} ` +
    `Its worldview renders ${c} only obliquely, so it declines rather than force a word that would misname the meaning.`
  )
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
