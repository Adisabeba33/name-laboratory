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
  /** The native-speaker words that prove the language exists. */
  words: WordPassport[]
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
  /** Seed for deterministic generation (useful for tests and shareable results). */
  seed?: number
}

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

/** The laboratory's full output: what it understood, and what it discovered. */
export interface LaboratoryResult {
  analysis: MeaningAnalysis
  families: WordFamily[]
}
