/**
 * Word Laboratory — core type system.
 *
 * The vision insists the generation order is always:
 *
 *   Meaning → Concept → Emotional Identity → Linguistic Structure → Phonetics → Word
 *
 * These types encode that pipeline. The central artifact is the {@link WordGenome}:
 * a measurable "genetic code" for a word, from which the emotional DNA, brand fit
 * and human-readable passport are all derived. Building words *from* the genome
 * (rather than deriving the genome after random assembly) is what lets the product
 * eventually expose the genome as adjustable sliders.
 */

import type { NaturalnessBand } from './naturalness'
export type { NaturalnessBand }

/**
 * The families of human language the linguistic engine draws inspiration from.
 * The engine never copies existing words — it borrows roots, phonetic patterns
 * and morphology, then constructs something original.
 */
export type LanguageFamily =
  | 'latin'
  | 'greek'
  | 'sanskrit'
  | 'proto-indo-european'
  | 'old-norse'
  | 'celtic'
  | 'japanese'
  | 'arabic'
  | 'hebrew'
  | 'finnish'

/**
 * A semantic concept. User keywords are mapped into this shared concept space so
 * that "trust", "calm" and "precision" can be reasoned about together before a
 * single sound is chosen.
 */
export type Concept =
  | 'knowledge'
  | 'healing'
  | 'future'
  | 'precision'
  | 'calm'
  | 'human'
  | 'science'
  | 'trust'
  | 'intelligence'
  | 'power'
  | 'nature'
  | 'light'
  | 'movement'
  | 'order'
  | 'elevation'
  | 'depth'
  | 'unity'
  | 'creation'
  | 'luxury'
  | 'energy'
  | 'water'
  | 'fire'
  | 'earth'
  | 'sky'
  | 'time'
  | 'mystery'
  | 'harmony'
  | 'strength'
  | 'freedom'
  | 'vision'
  // Deep / emotional / philosophical concepts — the Meaning Engine's vocabulary
  // for the human ideas behind a request, not just its surface nouns.
  | 'transformation'
  | 'rebirth'
  | 'survival'
  | 'destruction'
  | 'identity'
  | 'resilience'
  | 'loss'
  | 'memory'
  | 'shadow'
  | 'transcendence'
  | 'longing'
  | 'courage'
  | 'grief'
  | 'hope'

/** A weighted point in concept space — the AI's "internal semantic map". */
export type ConceptVector = Partial<Record<Concept, number>>

/**
 * A morphological root borrowed from a language family. Roots are the raw genetic
 * material words are constructed from. Each carries meaning (its concept tags), a
 * gloss for storytelling, and phonetic hints used during assembly.
 */
export interface Root {
  /** The root morpheme, in a romanised, pronounceable form. */
  form: string
  /** Short human gloss, used in meanings and origin stories. */
  gloss: string
  /** Language family this root is inspired by. */
  family: LanguageFamily
  /** Concepts this root evokes, most salient first. */
  concepts: Concept[]
  /** Whether the root reads more naturally at the head or tail of a word. */
  position: 'head' | 'tail' | 'any'
}

/** The measurable emotional attributes the vision calls "Emotional DNA". */
export type EmotionalAxis =
  | 'premium'
  | 'scientific'
  | 'elegant'
  | 'trustworthy'
  | 'creative'
  | 'natural'
  | 'minimal'
  | 'powerful'
  | 'energetic'
  | 'warm'
  | 'futuristic'
  | 'mystical'
  | 'playful'
  | 'aggressive'

/** Emotional DNA: every axis scored 0–100. */
export type EmotionalDNA = Record<EmotionalAxis, number>

/**
 * The Word Genome — a word's measurable "genetic code". Every attribute is 0–1
 * unless noted. This is the substrate the emotional DNA and passport are built on,
 * and the surface a future slider UI would manipulate.
 */
export interface WordGenome {
  /** Balance of vowels to consonants (0 = all consonants, 1 = all vowels). */
  vowelRatio: number
  /** How evenly stress/weight is distributed across syllables. */
  rhythm: number
  /** Consistency of syllable shapes (CV, CVC…). Higher = more harmonious. */
  syllableHarmony: number
  /** How easy the word is to pronounce across languages (1 = effortless). */
  pronounceability: number
  /** Estimated ease of recall (short, patterned words score higher). */
  memorability: number
  /** Left/right visual symmetry of the written form. */
  visualSymmetry: number
  /** Softness (0) vs. sharpness (1) of the consonant palette. */
  sharpness: number
  /** Perceived weight/gravitas of the sounds. */
  weight: number
  /** How novel the word is versus known vocabulary (1 = never seen). */
  uniqueness: number
  /** How many distinct concepts the construction fuses (normalised 0–1). */
  semanticDepth: number
  /** Number of syllables (raw count, not normalised). */
  syllables: number
  /** Total length in characters (raw count, not normalised). */
  length: number
}

/** A per-language pronounceability rating, 1–5 stars. */
export interface PronunciationRating {
  language: string
  stars: number
}

/** One scored component of the Speech Adoption assessment. */
export interface AdoptionComponent {
  label: string
  /** Points earned, out of `max`. */
  score: number
  max: number
}

/**
 * Speech Adoption — a transparent, rule-based estimate of whether a word could
 * actually enter everyday speech. Qualitative band first, breakdown second; it
 * is a structural heuristic, not an external brand/trademark check.
 */
export interface SpeechAdoption {
  band: 'Low' | 'Moderate' | 'High' | 'Exceptional'
  /** Total across all components, out of 100. */
  score: number
  components: AdoptionComponent[]
  /** What makes it usable, in plain language. */
  strengths: string[]
  /** Concrete adoption risks flagged by the rules (may be empty). */
  risks: string[]
}

/**
 * The offline collision verdict — whether a coined word is actually a known word
 * or a near-miss of one, from a small bundled list. Honest by construction: a
 * `'none'` result means "not in our built-in list", not "verified unused".
 */
export interface Collision {
  match: 'exact' | 'near' | 'none'
  note: string
}

/**
 * Layered collision analysis (Engine v0.36 Phase 4).
 *
 * A single "collision: none" is not credible — it hides which checks actually ran.
 * This separates the layers so the honest ones (internal list, phonetic neighbour,
 * short-word occupancy prior) are computed and the external ones (proper names,
 * brands, domains, trademarks, other languages) are reported as **not checked**
 * rather than silently passed. The overall status stays "Unverified" until real
 * external checks run — the engine never claims a word is clear.
 */
export interface CollisionReport {
  /** Built-in common-word / known-name list — offline and real. */
  internalDictionary: 'clear' | 'near' | 'exact'
  /** Sounds like an existing word despite a different spelling (offline prior). */
  phonetic: 'low' | 'moderate' | 'high'
  /** Short forms are far likelier to be occupied — an occupancy prior (spec §14). */
  shortWordRisk: 'low' | 'moderate' | 'high'
  /** External layers, honestly not performed without live services. */
  properName: 'not_checked'
  brand: 'not_checked'
  domain: 'not_checked'
  trademark: 'not_checked'
  multilingual: 'not_checked'
  /** Overall verdict — never a bare "none"/"clear" while externals are unchecked. */
  status: 'Unverified' | 'Internal collision'
  /** Confidence in the overall picture (low until external checks run). */
  confidence: 'low'
  /** One honest sentence: what was and wasn't checked. */
  summary: string
}

/** Whether a word is a strong or weak fit for a given industry. */
export interface BrandFit {
  excellentFor: string[]
  poorFit: string[]
}

/**
 * Linguistic Ancestry — where a word's *sound* descends from.
 *
 * The product framing is a research lab, not branding software: a word doesn't
 * say "inspired by Greek and Latin", it declares its phonetic ancestry — the
 * language families its sound evolved from. They inspire the texture only; no
 * source ever shows through the surface.
 */
export interface Ancestry {
  /** The linguistic species, e.g. "Crystalline", "Liquid", "Ancient". */
  character: string
  /** The phonetic ancestry — families the sound evolved from. */
  families: LanguageFamily[]
  /** A single sentence placing the word in its ancestry. */
  note: string
}

/**
 * A word's own genome — traits it inherits from and diverges within its parent
 * language. This makes each word feel alive: a measured specimen of its species,
 * with a generation, a mutation from the canonical form, and a distance travelled
 * along the language's evolutionary path.
 */
export interface WordEvolution {
  /** The language this word is a native speaker of. */
  parentLanguage: string
  /** Which generation of the language it belongs to (1 = closest to the root). */
  generation: number
  /** How far it has mutated from its language's canonical specimen (0–100%). */
  mutation: number
  /** Left/right visual balance of the written form (0–100). */
  visualBalance: number
  /** How novel the word is versus known vocabulary (0–100). */
  originality: number
  /** Estimated ease of recall (0–100). */
  memorability: number
  /** How stable/pronounceable the phonetics are (0–100). */
  phoneticStability: number
  /** Distance travelled from the language prototype along its path (0–1). */
  evolutionDistance: number
}

/**
 * An honest account of how the engine actually built a word — grown around one
 * or two ideas, synthesised as a native speaker of a language whose sound is
 * influenced by real families, broken into syllables. It never claims a part is
 * "borrowed from Latin meaning X": the word is invented, the influences shape
 * only its texture.
 */
export interface WordConstruction {
  /** The idea(s) the word was grown around (label + short gloss). */
  ideas: { label: string; gloss: string }[]
  /** The language species the word is a native speaker of. */
  species: string
  /** The phonetic families whose sound influenced it (texture, not derivation). */
  families: string[]
  /** The word split into its written syllables. */
  syllables: string[]
  /** One honest sentence stating how it was made. */
  note: string
}

/**
 * The generation context a word was born from — the concept it carries and the
 * language it belongs to. Kept on the passport so the word can be *evolved*
 * (its sound changed) while its concept and meaning stay fixed.
 */
export interface WordOrigin {
  lead: Concept
  support?: Concept
  concepts: ConceptVector
  /** The language id (species) the word is a native speaker of. */
  languageId: string
  /** Which generation of the word this is (1 = first coined). */
  generation: number
}

/**
 * The "Word Passport" — everything a user receives about a generated word. The
 * user should always understand *why* the word exists, not merely receive a name.
 * Meaning leads; etymology recedes.
 */
export interface WordPassport {
  /** The invented word, capitalised for display. */
  word: string
  /** The language this word is a native speaker of. */
  family: { id: string; name: string }
  /** Concept-first meaning — the idea the word was imagined to hold. */
  meaning: string
  /** A one-line distillation of the meaning, e.g. "Identity reborn through survival." */
  shortMeaning: string
  /** The word's grammatical role, e.g. "noun". Defaults to "noun"; refined by the LLM. */
  partOfSpeech: string
  /** The word written in Cyrillic so it can live in Russian, e.g. "варетис". */
  transliteration: string
  /**
   * How the word actually lives inside existing languages: natural example
   * sentences that teach how it functions. Empty until the LLM writes them.
   */
  usage: { en: string[]; ru: string[] }
  /** A stress-marked spoken guide for saying the word, e.g. "eh-LEE-ah-yeh". */
  pronunciationGuide: string
  /** How readily the word enters everyday speech — a qualitative band. */
  speakability: SpeakabilityBand
  /** How real the word feels — the Engine V3 "inevitable, not fabricated" band. */
  naturalness: NaturalnessBand
  /** The Engine V6 multi-dimensional fitness scorecard (why it survived). */
  fitness: FitnessProfile
  /** v0.36 — could it realistically behave like a lexical item in living language. */
  dictionaryViability: DictionaryViability
  /** v0.36 — the final weighted Lexical Discovery Score + realistic tier. */
  discovery: LexicalDiscoveryScore
  /** The Engine V6 morphological family — the root bent into verb/adj/adv/agent. */
  paradigm: WordParadigm
  /** The imagined etymology — a reconstructed root chain (honest: not historical). */
  etymology: Etymology
  /** v0.36 P3 — whether the word's sound actually expresses its meaning. */
  phonology: Phonology
  /** Semantically-related words in the same run — the navigable lexicon graph (V4). */
  relations: WordRelation[]
  /** Offline collision verdict against the built-in word/brand list. */
  collision: Collision
  /** v0.36 P4 — layered collision analysis; never a bare "none" (honest by layer). */
  collisionReport: CollisionReport
  /** Where the word's sound descends from — species + phonetic ancestry. */
  ancestry: Ancestry
  /** The word's own inherited genome / evolution profile. */
  evolution: WordEvolution
  /** Measurable emotional attributes. */
  emotionalDNA: EmotionalDNA
  /** A handful of personality adjectives. */
  personality: string[]
  /** Cross-language pronounceability. */
  pronunciation: PronunciationRating[]
  /** Rule-based estimate of whether the word could enter everyday speech. */
  adoption: SpeechAdoption
  /** Human-readable difficulty notes. */
  difficulty: string[]
  /** Industries the word naturally fits — and ones it doesn't. */
  brandFit: BrandFit
  /** A believable account of how such a word might have evolved. */
  story: string
  /** A concept-first explanation of why the word exists. */
  explanation: string
  /** The underlying phonetic genome, exposed for transparency and future tooling. */
  genome: WordGenome
  /** An honest breakdown of how the engine assembled this word. */
  construction: WordConstruction
  /** Generation context — the concept + language, so the word can be evolved. */
  origin: WordOrigin
}

/**
 * The Language Genome — a language's own measurable DNA.
 *
 * This describes the *language itself*, not any individual word: its phonotactic
 * tendencies, cadence and rate of evolution. Words are then generated as native
 * speakers that obey this genome.
 */
export interface LanguageGenome {
  consonantDensity: 'Low' | 'Medium' | 'High'
  /** The vowels the language reaches for most, e.g. "A / O". */
  preferredVowels: string
  cadence: 'Short' | 'Measured' | 'Flowing' | 'Irregular'
  stressPattern: 'Initial' | 'Final' | 'Even'
  /** Typical left/right symmetry of its written words (0–100). */
  visualSymmetry: number
  entropy: 'Low' | 'Medium' | 'High'
  mutationRate: 'Low' | 'Medium' | 'High'
  emotionalGravity: 'Low' | 'Medium' | 'High'
  evolutionSpeed: 'Slow' | 'Medium' | 'Fast'
  /** Signature word endings, e.g. ["-an", "-or", "-ix"]. */
  preferredEndings: string[]
}

/**
 * A linguistic species discovered by a single generation.
 *
 * The core shift in the product: a generation doesn't return name variations —
 * it discovers whole *languages*. Each has a description, native characteristics
 * and its own Language Genome; the words are native speakers of it.
 */
export interface WordFamily {
  /** Stable id for the language within this generation. */
  id: string
  /** The language's name, e.g. "Crystalline". */
  name: string
  /** Same as `name`, kept for clarity at call sites. */
  character: string
  /** A short account of the linguistic species. */
  description: string
  /** Bullet-point native traits of the language. */
  nativeCharacteristics: string[]
  /** The language's own measurable DNA. */
  genome: LanguageGenome
  /** The phonetic ancestry this language evolved from. */
  ancestry: LanguageFamily[]
  /** The idea this language was discovered around. */
  theme: string
  /**
   * The distinct semantic angle this language interprets the meaning from — its
   * "civilization's" viewpoint (the event, the person, the feeling…). Assigned so
   * that no two languages in a run share a lens: 18 viewpoints, not 18 synonyms.
   */
  lens: LanguageLens
  /** The lens's semantic role, hoisted for convenience (Engine v0.36). */
  semanticRole: string
  /**
   * True when this family's words directly name the confirmed semantic gap
   * (v0.36): a direct lens whose concept fidelity holds. Adjacent families are
   * valuable discoveries but must not compete with direct answers.
   */
  direct: boolean
  /** How directly this family's words answer the gap (structural, v0.36). */
  fidelity: ConceptFidelity
  /** The meaning's acoustic profile this language's words were shaped by (V5). */
  acoustic: AcousticProfile
  /** This language's slice of the lexical-evolution funnel (V6): what it bred. */
  stats: EvolutionStats
  /**
   * Set when this language declined to translate the meaning (V4). When present,
   * `words` is empty — the language refuses rather than force a word that would lie.
   */
  refusal?: LanguageRefusal
  /** The native-speaker words that prove the language exists. */
  words: WordPassport[]
}

/**
 * A language declining to translate a meaning (Engine V4). Some worldviews cannot
 * hold some feelings; rather than force a word that would lie, the language refuses
 * and says why. Honest by design — a stated limit, not a failure.
 */
export interface LanguageRefusal {
  /** The concept this language's worldview cannot hold. */
  concept: Concept
  /** An in-character, honest reason the language declines. */
  reason: string
}

/** A language's assigned semantic viewpoint on the meaning (anti-convergence). */
export interface LanguageLens {
  /** Short role label, e.g. "the event", "the person", "what emerged". */
  role: string
  /** The question this viewpoint answers, e.g. "Who did you become?". */
  question: string
  /**
   * The lens's semantic role (Engine v0.36), e.g. "direct_target", "actor",
   * "emotional_response", "consequence". Drives direct-vs-adjacent separation.
   */
  semanticRole: string
  /** True when this lens names the meaning itself (a candidate for direct results). */
  direct: boolean
}

/**
 * Concept Fidelity (Engine v0.36) — how directly a family's words answer the
 * confirmed semantic gap, judged structurally by concept overlap.
 *
 * Honest by construction: this is a STRUCTURAL fidelity (which concepts the words
 * carry vs the meaning's core concepts), not an LLM semantic read — the band is
 * the product, the numbers are derived and explained. `direct` families that drift
 * into a recurrent engine archetype (survival / identity …) absent from the prompt
 * are demoted, so a language-and-cognition meaning never surfaces a grief word as
 * a direct answer.
 */
export interface ConceptFidelity {
  /** Qualitative verdict: names the gap, sits nearby, or has drifted off. */
  band: 'direct' | 'adjacent' | 'weak'
  /** Core meaning concepts the words genuinely carry. */
  matched: Concept[]
  /** Core meaning concepts the words do NOT carry (informational). */
  missing: Concept[]
  /** Concepts the words carry that are archetype intrusions absent from the prompt. */
  extraneous: Concept[]
  /** True when a dominant archetype (survival/identity/…) has intruded. */
  driftDetected: boolean
  /** One honest sentence explaining the verdict. */
  note: string
}

/**
 * Semantic Acoustic Profile (Engine V5) — a meaning's "emotional physics" reduced
 * to four phonetic-facing axes (each 0–1) that bias how its word is synthesised.
 */
export interface AcousticProfile {
  /** soft/liquid consonants (0) ↔ hard/plosive (1). */
  hardness: number
  /** bright/front vowels (0) ↔ deep/back/round vowels (1). */
  depth: number
  /** long, flowing shapes (0) ↔ short, abrupt shapes (1). */
  clip: number
  /** closed, hard endings (0) ↔ open, airy, unfinished endings (1). */
  openness: number
}

/**
 * A qualitative rung on a fitness axis (Engine V6). Bands, not fake percentages —
 * the engine reports where a word lands, not an invented "97%".
 */
export type FitnessBand = 'Low' | 'Moderate' | 'Strong' | 'Exceptional'

/**
 * One measured dimension of a word's fitness — the honest "why it survived, and
 * where it is strong or weak". Each axis is derived from a signal the engine
 * already computes (sound structure, emotional DNA, cross-language pronounceability),
 * banded against the real spread that dimension shows across bred words, so two
 * survivors genuinely differ (Strong resonance but Moderate reach, say) instead of
 * every word reading as a uniform 99.
 */
export interface FitnessAxis {
  /** Stable key, e.g. "resonance". */
  key: string
  /** Human label, e.g. "Emotional resonance". */
  label: string
  /** The qualitative rung this word reaches on the axis. */
  band: FitnessBand
  /** One honest sentence on what the axis measures (and that it is structural). */
  note: string
}

/**
 * The Fitness Profile (Engine V6) — a word's multi-dimensional selection scorecard.
 *
 * Only dimensions that genuinely vary between survivors are banded per word;
 * dimensions that saturate among survivors (memorability, phonetic stability — a
 * word cannot survive selection without them) are stated once as a shared floor,
 * not dressed up as per-word variance. So the profile differentiates honestly.
 */
export interface FitnessProfile {
  /** The per-word, genuinely-varying axes (dictionary illusion, resonance, reach). */
  axes: FitnessAxis[]
  /** Label of the word's single strongest axis — its signature strength. */
  strongest: string
  /** Label of its weakest axis — the honest cost, so no word looks maxed-out. */
  weakest: string
}

/**
 * One derived member of a word's morphological family (Engine V6) — the coined
 * root bent into a grammatical role so it can be used across a real sentence.
 */
export interface WordForm {
  /** Grammatical role, e.g. "verb", "adjective", "adverb", "agent noun". */
  role: string
  /** The derived word, capitalised. */
  form: string
  /** A short usage gloss, e.g. "to bring about rebirth". */
  gloss: string
}

/** A derived form the engine generated but rejected as forced/unnatural (v0.36 P3). */
export interface RejectedForm {
  role: string
  form: string
  /** Why it was rejected, e.g. "no stable verb form — awkward at the seam". */
  reason: string
}

/**
 * A word's morphological family (Engine V6, validated in v0.36 Phase 3).
 *
 * Honest by construction: these inflect the coined root with the HOST language's
 * (English) derivational morphology so they are deployable in an EN sentence —
 * NOT a claim about the invented sound-world's own grammar (the UI states this).
 * v0.36: forms are no longer emitted mechanically — each derivation is validated
 * and a forced one is REJECTED (a word may stay noun-only), so the family shows
 * only forms that actually sound natural.
 */
export interface WordParadigm {
  /** The base form (the noun) — the word itself, capitalised. */
  root: string
  /** The derived forms that passed validation (may be empty → noun-only). */
  forms: WordForm[]
  /** Forms the engine generated but rejected as unnatural, with reasons. */
  rejected: RejectedForm[]
}

/**
 * A semantic link from one word to another in the same run (Engine V4). The edge
 * is a real fact about the run — a shared idea, an echoed concept, a kindred
 * sound, or a shared language — so the lexicon can be navigated as a graph.
 */
export interface WordRelation {
  /** The related word (display form). */
  word: string
  /** The related word's language character, for context. */
  language: string
  /** The relation kind, e.g. "kindred idea", "echo", "kindred sound", "sibling". */
  kind: string
  /**
   * Which layer the link lives on (v0.36 P3): a shared MEANING, a shared SOUND, or
   * a shared FORM. Presented separately so "kindred sound" is never dressed up as
   * semantic relatedness.
   */
  relationClass: 'semantic' | 'phonetic' | 'morphological'
  /** One short reason for the link. */
  note: string
}

/**
 * Semantic Phonology validation (v0.36 Phase 3) — does the word's sound actually
 * express its meaning's intended acoustic profile? A modeled judgement (stated as
 * such, not a universal law): the intended profile the word was shaped toward, the
 * observed profile of the final form, a congruence score, and a plain explanation.
 */
export interface Phonology {
  /** The meaning's intended acoustic profile (what the word was shaped toward). */
  intended: AcousticProfile
  /** The observed acoustic profile of the final form. */
  observed: AcousticProfile
  /** 0–1 congruence between intended and observed. */
  congruence: number
  /** Qualitative verdict. */
  band: 'Contradicts' | 'Weak' | 'Fair' | 'High'
  /** One honest sentence on how (or whether) the sound mirrors the meaning. */
  explanation: string
}

/** One stage in a word's imagined lineage (Engine V4/V6) — a form and the change into it. */
export interface EtymologyStage {
  /** The word form at this stage, capitalised. */
  form: string
  /** A short era label, e.g. "imagined root", "older form", "today". */
  era: string
  /** What changed to produce this form from the previous one (empty for the root). */
  note: string
  /** The KIND of change (v0.36 P3), e.g. "phonetic reduction", "suffix accretion". */
  reason: string
}

/**
 * A word's imagined etymology (Engine V4/V6, validated in v0.36 Phase 3).
 *
 * Honest by construction: an *imagined* lineage of the word's own sound, produced
 * by running the language's sound-laws backward — never a claim of descent from a
 * real language (invariant #6). Each stage now states the KIND of change; the
 * lineage is `plausible` only when at least one real change was reconstructed, so
 * the UI can omit a decorative single-form "lineage".
 */
export interface Etymology {
  /** Always "constructed" — never a claim of real descent. */
  lineageType: 'constructed'
  /** True when a real multi-stage chain was reconstructed (else omit in the UI). */
  plausible: boolean
  /** Oldest → today. */
  stages: EtymologyStage[]
  /** One honest line framing the lineage as imagined, not historical. */
  summary: string
}

/**
 * Dictionary Viability (Engine v0.36 Phase 2) — could this realistically behave
 * like a lexical item in a living language, distinct from being merely pretty or
 * novel? A transparent structural heuristic (like Speech Adoption): each dimension
 * is derived from real sound structure, the band is the product, the numbers are
 * explained. NOT an LLM judgement and not a claim of real usage.
 */
export interface DictionaryViability {
  /** 0–1 overall viability. */
  overall: number
  /** Qualitative verdict on the overall. */
  band: 'Low' | 'Moderate' | 'Strong' | 'Exceptional'
  /** Reads like a plausible word, not a fantasy name / product / username (0–1). */
  lexicalAppearance: number
  /** Can be spelled reasonably after hearing (grapheme regularity, 0–1). */
  spokenRecoverability: number
  /** Can be pronounced reasonably after seeing (0–1). */
  visualRecoverability: number
  /** Accepts natural derivations without looking forced (0–1). */
  morphologyFit: number
  /** Could plausibly appear across registers — speech, writing, poetry (0–1). */
  registerFlexibility: number
  /** Would a user believe it already exists (= naturalness, 0–1). */
  dictionaryIllusion: number
  /** Looks evolved rather than assembled instantly (0–1). */
  historicalPlausibility: number
  /** How much explanation/repetition before it becomes usable. */
  adoptionFriction: 'low' | 'moderate' | 'high'
}

/** A realistic quality tier for a discovered word (v0.36 — not everything is a 99). */
export type LexicalClass =
  | 'Exceptional'
  | 'Strong'
  | 'Viable'
  | 'Experimental'
  | 'Weak'
  | 'Rejected'

/** One weighted component of the Lexical Discovery Score, each 0–100. */
export interface ScoreComponent {
  label: string
  score: number
  /** Relative weight (0–1), summing to 1 across components. */
  weight: number
}

/**
 * The Lexical Discovery Score (v0.36 Phase 2) — the single final score for a
 * direct candidate, computed from explicit weighted components (never "LLM
 * enthusiasm"). Beauty is deliberately NOT a major component; concept fidelity and
 * dictionary viability dominate, and a short-word collision-safety prior pulls
 * risky forms down, so the distribution is realistic (few 90+).
 */
export interface LexicalDiscoveryScore {
  /** 0–100 weighted total. */
  score: number
  /** Realistic tier derived from the score + hard gates. */
  classification: LexicalClass
  /** The weighted components, for transparency. */
  components: ScoreComponent[]
  /** Plain-language explanations of the major penalties. */
  penalties: string[]
  /** The structural collision-safety prior used (0–1; low for short forms). */
  collisionSafetyPrior: number
}

/** The creative styles that bias which roots and endings the engine reaches for. */
export type CreativeMode =
  | 'minimal'
  | 'luxury'
  | 'scientific'
  | 'nature'
  | 'fantasy'
  | 'technology'
  | 'medical'
  | 'ancient'
  | 'space'
  | 'japanese'
  | 'scandinavian'
  | 'futuristic'
  | 'organic'
  | 'timeless'

/** A request to the laboratory. */
export interface GenerationRequest {
  /** Free-text description of what is being named (e.g. "premium AI medicine company"). */
  brief?: string
  /** Explicit concept keywords (e.g. ["trust", "precision", "calm"]). */
  keywords: string[]
  /** Creative style. Defaults to a neutral, timeless mode. */
  mode?: CreativeMode
  /** How many words to invent. */
  count?: number
  /**
   * Bias toward everyday speech, 0–1 (default ~0.7). 1 keeps only strictly
   * speakable words; lower values allow more ornate, elaborate shapes. Exposed
   * in the UI as a "Speakable ↔ Ornate" slider.
   */
  speakability?: number
  /** Seed for deterministic generation (useful for tests and shareable results). */
  seed?: number
}

/**
 * A qualitative read of how easily a word enters real speech. Kept as a band
 * (not a fake percentage) per the project's honesty rules.
 */
export type SpeakabilityBand = 'Speakable' | 'Balanced' | 'Ornate'

/** A node in the concept network — a discovered idea, in both languages. */
export interface ConceptNode {
  en: string
  ru: string
}

/**
 * A semantic tension — two opposing forces the concept lives between.
 *
 * Many powerful concepts are not a single feeling but the tension between two:
 * "alive, but no longer the same person" sits between survival and identity
 * death. Naming these is more useful than generic emotional percentages, and it
 * shapes the definitions and word forms downstream.
 */
export interface SemanticTension {
  /** Pole A, a short label (English). */
  a: string
  aRu: string
  /** Pole B, the opposing label (English). */
  b: string
  bRu: string
  /** One human sentence capturing the lived tension between the poles (English). */
  note: string
  noteRu: string
}

/**
 * A concept direction — one distinct interpretation the word could name.
 *
 * A single request usually hides several angles ("the scar-born self", "death
 * without dying", "survivor's grief"). Rather than average them into one blurred
 * word, the lab surfaces 3–5 directions; the user can focus word discovery on one
 * (or combine two). Each carries an `emphasis` that re-weights the concept vector
 * toward its facet. The concept stays stable; the direction sharpens the words.
 */
export interface ConceptDirection {
  /** Stable id within an analysis, e.g. "dir-0". */
  id: string
  /** Short name of the angle (English), e.g. "Scar-born self". */
  title: string
  titleRu: string
  /** One-sentence definition of this angle (English). */
  definition: string
  definitionRu: string
  /** Concepts this direction leans into — used to re-weight discovery. */
  emphasis: ConceptVector
}

/**
 * The Meaning Analysis — the heart of the Meaning Engine.
 *
 * Before any language is discovered, the laboratory states what it believes the
 * request is *really* about. If this reading is wrong, everything downstream is
 * wrong — so it is surfaced to the user for transparency. This is the single seam
 * an LLM meaning-analyzer would replace to reach open-ended understanding.
 */
export interface MeaningAnalysis {
  /** The laboratory's plain-language reading of the request (English). */
  interpretation: string
  /** The same interpretation, in fluent Russian. */
  interpretationRu: string
  /** The hidden conceptual structures discovered — ideas, not keywords. */
  hiddenConcepts: ConceptNode[]
  /** An ordered relationship map explaining how the prompt was understood. */
  network: ConceptNode[]
  /** The opposing forces the concept lives between (may be empty). */
  tensions: SemanticTension[]
  /** Distinct angles the word could name; the user can focus discovery on one. */
  directions: ConceptDirection[]
  /** The dominant meaning-theme, if one was recognised (e.g. "metamorphosis"). */
  theme?: string
  /** The weighted concept map the interpretation produced. */
  concepts: ConceptVector
}

/**
 * The Lexical Evolution funnel (Engine V6) — an HONEST census of the population
 * the engine actually bred for a run.
 *
 * The framing shifts from "we generated N words" to "we explored a population of
 * candidate forms; most failed; only a few survived". Every number here is a real
 * count of real work, never a decorative figure:
 *
 *   generated   — candidate forms synthesised and evaluated against the gates.
 *   rejected    — forms that failed a phonotactic / naturalness gate, collided
 *                 with a real word, or duplicated a survivor already found.
 *   survived    — distinct viable forms that cleared every gate (the gene pool).
 *   recommended — survivors selected and shipped as full passports.
 *   exceptional — the rare standouts among the shipped: near-perfect naturalness,
 *                 colliding with no known word, and compact enough to say in one
 *                 breath (three independent bars, so it stays a genuine few).
 *
 * Invariant: generated ≥ survived ≥ recommended ≥ exceptional, and
 * rejected = generated − survived. If the engine explored 300 forms it reports
 * 300 — never an inflated "3,000" (honesty invariant: no fake precision).
 */
export interface EvolutionStats {
  generated: number
  rejected: number
  survived: number
  recommended: number
  exceptional: number
}

/** The laboratory's full output: what it understood, and what it discovered. */
export interface LaboratoryResult {
  analysis: MeaningAnalysis
  families: WordFamily[]
  /** The run-level lexical-evolution census, summed across all languages (V6). */
  population: EvolutionStats
  /**
   * The laboratory's honest conclusion (v0.36): a short statement of the confirmed
   * gap and how many DIRECT candidates survived — including the honest case where
   * none did ("recommends another evolutionary cycle"). Adjacent families still
   * appear, but this speaks to the direct answers only.
   */
  conclusion: string
}
