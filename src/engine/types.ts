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

/** Whether a word is a strong or weak fit for a given industry. */
export interface BrandFit {
  excellentFor: string[]
  poorFit: string[]
}

/**
 * A word's lineage — where it *feels* like it came from.
 *
 * Roots and language families inspire the sound, but they must never show through
 * the surface (no "lum + iris" glue). So the passport exposes a lineage — the
 * linguistic character and the families it echoes — rather than its ingredients.
 */
export interface Lineage {
  /** The linguistic character, e.g. "Crystalline", "Liquid", "Ancient". */
  character: string
  /** Language families whose phonetics inspired it (for flavour, not copying). */
  families: LanguageFamily[]
  /** A single sentence placing the word in its lineage. */
  note: string
}

/**
 * The "Word Passport" — everything a user receives about a generated word. The
 * user should always understand *why* the word exists, not merely receive a name.
 * Meaning leads; etymology recedes.
 */
export interface WordPassport {
  /** The invented word, capitalised for display. */
  word: string
  /** The linguistic family this word belongs to within its generation. */
  family: { id: string; name: string }
  /** Concept-first meaning — the idea the word was imagined to hold. */
  meaning: string
  /** Where the word feels like it came from (character + families), not its parts. */
  lineage: Lineage
  /** Measurable emotional attributes. */
  emotionalDNA: EmotionalDNA
  /** A handful of personality adjectives. */
  personality: string[]
  /** Cross-language pronounceability. */
  pronunciation: PronunciationRating[]
  /** Human-readable difficulty notes. */
  difficulty: string[]
  /** Industries the word naturally fits — and ones it doesn't. */
  brandFit: BrandFit
  /** A believable account of how such a word might have evolved. */
  story: string
  /** A concept-first explanation of why the word exists. */
  explanation: string
  /** The underlying genome, exposed for transparency and future tooling. */
  genome: WordGenome
}

/**
 * A linguistic family produced by a single generation.
 *
 * The core shift in the product: a generation doesn't return a flat list of
 * name variations — it discovers several distinct "linguistic species", each
 * with its own sound world, then grows kin words inside each.
 */
export interface WordFamily {
  /** Stable id for the family (its archetype id + index). */
  id: string
  /** Display name for the family (its shared stem, e.g. "Kael-"). */
  name: string
  /** The linguistic character of this family, e.g. "Crystalline". */
  character: string
  /** The idea this family was grown around. */
  theme: string
  /** The kin words in this family (2–3 variations that clearly belong together). */
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
