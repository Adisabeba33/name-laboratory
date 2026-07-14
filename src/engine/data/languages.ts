import type { Concept, EmotionalAxis, LanguageFamily } from '../types'

/**
 * Linguistic species — the languages the laboratory discovers.
 *
 * The milestone shift: the engine no longer generates isolated words, it
 * discovers *languages*. Each language is a self-contained sound world — its own
 * phoneme inventory, cadence, stress and rate of evolution — plus a description
 * and native characteristics that make it read as a genuine linguistic species.
 * Words are then generated as *native speakers* that obey the language's rules,
 * so a word is evidence the language exists rather than a one-off invention.
 */
export interface Language {
  id: string
  /** The language's name / linguistic character. */
  character: string
  /** One-line feel of the sound world. */
  feel: string
  /** A short account of the species (shown under its name). */
  description: string
  /** Native phonetic/rhythmic traits, as bullet points. */
  nativeCharacteristics: string[]
  /** Concepts this language naturally resonates with. */
  concepts: Concept[]
  /** Phonetic ancestry — families the sound evolved from (flavour only). */
  families: LanguageFamily[]

  /** Syllable-initial consonants / clusters. */
  onsets: string[]
  /** Simpler consonants used inside a word (non-initial syllables). */
  medials: string[]
  /** Vowel nuclei. */
  nuclei: string[]
  /** Syllable-final consonants. */
  codas: string[]
  /** Signature word-final flourishes. */
  endings: string[]

  /** Preferred syllable-count range for native words (drives internal diversity). */
  syllables: [min: number, max: number]
  /** How often a syllable closes on a consonant (0–1). */
  codaBias: number
  /** How often a native word takes a signature ending (0–1). */
  endingBias: number
  /** Softness (0) ↔ sharpness (1) of the palette. */
  sharpness: number
  /** Perceived gravitas of the palette (0–1). */
  weight: number

  // Authored Language-Genome descriptors.
  cadence: 'Short' | 'Measured' | 'Flowing' | 'Irregular'
  stressPattern: 'Initial' | 'Final' | 'Even'
  entropy: 'Low' | 'Medium' | 'High'
  mutationRate: 'Low' | 'Medium' | 'High'
  evolutionSpeed: 'Slow' | 'Medium' | 'Fast'

  /** Emotional signature — deltas added to the emotional DNA (0–1 scale). */
  emotion: Partial<Record<EmotionalAxis, number>>
}

export const LANGUAGES: Language[] = [
  {
    id: 'crystalline',
    character: 'Crystalline',
    feel: 'Sharp, precise, engineered — crisp onsets and clean edges.',
    description:
      'A precision-oriented linguistic species. Built around symmetry, short rhythmic units, sharp consonants and geometric stress patterns.',
    nativeCharacteristics: [
      'prefers K / T / X sounds',
      'avoids long flowing vowels',
      'high consonant symmetry',
      'low phonetic entropy',
      'structured, clipped cadence',
      'analytical emotional profile',
    ],
    concepts: ['science', 'precision', 'order', 'future', 'intelligence', 'light'],
    families: ['greek', 'latin', 'proto-indo-european'],
    onsets: ['k', 't', 'kr', 'tr', 'qu', 'st', 'sk', 'kv'],
    medials: ['t', 'k', 'r', 'n', 's'],
    nuclei: ['a', 'i', 'e', 'y', 'ai', 'ua'],
    codas: ['n', 'r', 's', 't', 'k'],
    endings: ['is', 'on', 'or', 'ar', 'en', 'ic', 'it', 'ex'],
    syllables: [2, 3],
    codaBias: 0.7,
    endingBias: 0.6,
    sharpness: 0.85,
    weight: 0.5,
    cadence: 'Short',
    stressPattern: 'Initial',
    entropy: 'Low',
    mutationRate: 'Medium',
    evolutionSpeed: 'Slow',
    emotion: { scientific: 0.7, futuristic: 0.5, minimal: 0.4, premium: 0.3 },
  },
  {
    id: 'liquid',
    character: 'Liquid',
    feel: 'Soft, flowing, unhurried — vowels open and consonants melt.',
    description:
      'A language evolved around emotional continuity, soft transitions and flowing pronunciation. Its words pour rather than click.',
    nativeCharacteristics: [
      'connected, open vowels',
      'minimal hard consonants',
      'melodic rhythm',
      'fluid syllable transitions',
      'even, unhurried stress',
      'calm emotional profile',
    ],
    concepts: ['calm', 'harmony', 'healing', 'water', 'human', 'trust', 'unity'],
    families: ['latin', 'celtic', 'finnish'],
    onsets: ['l', 'm', 'n', 's', 'v', 'r', 'sel', 'mel', 'lir', 'len', 'sil', 'nel'],
    medials: ['l', 'r', 'n', 'm', 'v', 's'],
    nuclei: ['a', 'e', 'i', 'ae', 'ia', 'o', 'ei'],
    codas: ['n', 'r', 'l', 's', 'm'],
    endings: ['a', 'ia', 'une', 'ora', 'elle', 'ena', 'ir', 'een'],
    syllables: [2, 4],
    codaBias: 0.4,
    endingBias: 0.55,
    sharpness: 0.2,
    weight: 0.4,
    cadence: 'Flowing',
    stressPattern: 'Even',
    entropy: 'Medium',
    mutationRate: 'Medium',
    evolutionSpeed: 'Medium',
    emotion: { elegant: 0.5, warm: 0.5, trustworthy: 0.4, premium: 0.3, natural: 0.3 },
  },
  {
    id: 'verdant',
    character: 'Verdant',
    feel: 'Living, organic, gentle — leafy consonants and uneven, natural rhythm.',
    description:
      'A language evolved around growth, repair, biology and natural asymmetry. It grows the way living things grow — never quite regular.',
    nativeCharacteristics: [
      'organic, breathing cadence',
      'irregular natural rhythm',
      'soft consonants',
      'gentle, open pronunciation',
      'varied word lengths',
      'high warmth',
    ],
    concepts: ['nature', 'healing', 'creation', 'water', 'human', 'harmony'],
    families: ['finnish', 'celtic', 'latin'],
    onsets: ['v', 'f', 'l', 'm', 'n', 's', 'w', 'ver', 'lan', 'mir'],
    medials: ['l', 'n', 'r', 'm', 'v', 'w'],
    nuclei: ['e', 'a', 'i', 'ai', 'ei', 'o'],
    codas: ['n', 'l', 'r', 's'],
    endings: ['en', 'el', 'ia', 'an', 'is', 'ara', 'a'],
    syllables: [2, 4],
    codaBias: 0.5,
    endingBias: 0.5,
    sharpness: 0.25,
    weight: 0.45,
    cadence: 'Irregular',
    stressPattern: 'Even',
    entropy: 'High',
    mutationRate: 'High',
    evolutionSpeed: 'Fast',
    emotion: { natural: 0.7, warm: 0.4, trustworthy: 0.4, elegant: 0.2 },
  },
  {
    id: 'noble',
    character: 'Noble',
    feel: 'Rounded, elevated, moneyed — long vowels and a warm close.',
    description:
      'A ceremonial language evolved around status, permanence and refinement. Its words are long-voweled, rounded and unhurried.',
    nativeCharacteristics: [
      'prefers O / A / OU vowels',
      'rounded, resonant consonants',
      'measured, stately cadence',
      'strong final flourishes',
      'high emotional gravity',
      'premium emotional profile',
    ],
    concepts: ['luxury', 'trust', 'elevation', 'light', 'order', 'time'],
    families: ['latin', 'sanskrit', 'arabic'],
    onsets: ['v', 's', 'd', 'l', 'r', 'so', 'val', 'ser', 'dor', 'aur'],
    medials: ['r', 'l', 'n', 's', 'd', 'v'],
    nuclei: ['o', 'au', 'a', 'e', 'ou', 'oa'],
    codas: ['n', 'r', 's', 'l', 'm'],
    endings: ['on', 'ora', 'elle', 'ova', 'aire', 'or', 'esse', 'ant'],
    syllables: [3, 4],
    codaBias: 0.5,
    endingBias: 0.75,
    sharpness: 0.3,
    weight: 0.7,
    cadence: 'Measured',
    stressPattern: 'Final',
    entropy: 'Medium',
    mutationRate: 'Low',
    evolutionSpeed: 'Slow',
    emotion: { premium: 0.8, elegant: 0.6, trustworthy: 0.4, warm: 0.2 },
  },
  {
    id: 'ancient',
    character: 'Ancient',
    feel: 'Deep, weathered, mythic — heavy vowels and old consonants.',
    description:
      'A weathered language evolved around memory, myth and endurance. Its words are heavy, closed and slow to change.',
    nativeCharacteristics: [
      'prefers O / A / U vowels',
      'heavy, closed consonants',
      'slow, weighted cadence',
      'strong initial stress',
      'very high emotional gravity',
      'mythic emotional profile',
    ],
    concepts: ['mystery', 'time', 'depth', 'knowledge', 'power', 'earth'],
    families: ['old-norse', 'greek', 'hebrew'],
    onsets: ['th', 'dr', 'br', 'gr', 'vor', 'thal', 'mor', 'kor', 'dra'],
    medials: ['r', 'th', 'n', 'l', 'd', 'g'],
    nuclei: ['o', 'a', 'au', 'u', 'oa'],
    codas: ['n', 'r', 'th', 'l', 'k', 'rn'],
    endings: ['os', 'an', 'ar', 'un', 'or', 'um', 'ad'],
    syllables: [2, 3],
    codaBias: 0.75,
    endingBias: 0.6,
    sharpness: 0.6,
    weight: 0.85,
    cadence: 'Measured',
    stressPattern: 'Initial',
    entropy: 'Medium',
    mutationRate: 'Low',
    evolutionSpeed: 'Slow',
    emotion: { mystical: 0.7, powerful: 0.5, premium: 0.3, scientific: 0.1 },
  },
  {
    id: 'ethereal',
    character: 'Ethereal',
    feel: 'Airy, luminous, otherworldly — high vowels and liquid tails.',
    description:
      'A luminous language evolved around light, distance and the barely-said. Its words rise and thin toward their endings.',
    nativeCharacteristics: [
      'prefers high AE / I / Y vowels',
      'liquid L / R tails',
      'light, ascending cadence',
      'soft, trailing endings',
      'low emotional gravity',
      'visionary emotional profile',
    ],
    concepts: ['sky', 'light', 'vision', 'mystery', 'freedom', 'creation'],
    families: ['celtic', 'sanskrit', 'finnish'],
    onsets: ['ae', 'y', 'e', 's', 'sy', 'ly', 'el', 'li', 'ny', 'ne'],
    medials: ['l', 'r', 'n', 'th', 'y'],
    nuclei: ['ae', 'e', 'i', 'ia', 'y', 'ei', 'ie'],
    codas: ['n', 'l', 'r', 'th'],
    endings: ['ia', 'ea', 'aria', 'ie', 'en', 'el', 'a', 'ine'],
    syllables: [2, 4],
    codaBias: 0.4,
    endingBias: 0.7,
    sharpness: 0.3,
    weight: 0.35,
    cadence: 'Flowing',
    stressPattern: 'Even',
    entropy: 'High',
    mutationRate: 'High',
    evolutionSpeed: 'Fast',
    emotion: { mystical: 0.5, elegant: 0.5, creative: 0.5, futuristic: 0.3 },
  },
  {
    id: 'earthen',
    character: 'Earthen',
    feel: 'Grounded, sturdy, physical — short vowels and firm stops.',
    description:
      'A sturdy language evolved around land, labour and strength. Its words are short, firm and planted.',
    nativeCharacteristics: [
      'prefers A / O / U vowels',
      'firm, stopped consonants',
      'short, hammered cadence',
      'strong initial stress',
      'high emotional gravity',
      'grounded emotional profile',
    ],
    concepts: ['earth', 'strength', 'power', 'nature', 'energy', 'movement'],
    families: ['old-norse', 'celtic', 'finnish'],
    onsets: ['g', 'b', 'n', 'd', 'br', 'gr', 'dr', 'k', 'nor', 'bar', 'gan'],
    medials: ['r', 'n', 'd', 'g', 'l', 'k'],
    nuclei: ['a', 'o', 'u', 'e'],
    codas: ['n', 'r', 'k', 'g', 'd', 'rn', 'll'],
    endings: ['ek', 'ok', 'an', 'ar', 'un', 'or', 'is', 'ald'],
    syllables: [2, 3],
    codaBias: 0.8,
    endingBias: 0.5,
    sharpness: 0.65,
    weight: 0.75,
    cadence: 'Short',
    stressPattern: 'Initial',
    entropy: 'Low',
    mutationRate: 'Medium',
    evolutionSpeed: 'Medium',
    emotion: { powerful: 0.6, natural: 0.5, energetic: 0.4, warm: 0.3 },
  },
  {
    id: 'solar',
    character: 'Solar',
    feel: 'Warm, radiant, moving — bright vowels and an upward lift.',
    description:
      'A radiant language evolved around heat, motion and creation. Its words are bright, open and lifting.',
    nativeCharacteristics: [
      'prefers A / O / IA vowels',
      'warm S / R / L consonants',
      'rising, energetic cadence',
      'open, vowel-led endings',
      'medium emotional gravity',
      'energetic emotional profile',
    ],
    concepts: ['fire', 'energy', 'light', 'creation', 'movement', 'vision'],
    families: ['latin', 'sanskrit', 'arabic'],
    onsets: ['s', 'r', 'h', 'f', 'sol', 'ray', 'ser', 'ari', 'sar'],
    medials: ['r', 'l', 's', 'n', 'h'],
    nuclei: ['a', 'o', 'e', 'ia', 'ai'],
    codas: ['l', 'r', 'n', 's'],
    endings: ['a', 'io', 'ara', 'eon', 'is', 'ion', 'ova'],
    syllables: [2, 4],
    codaBias: 0.4,
    endingBias: 0.6,
    sharpness: 0.45,
    weight: 0.5,
    cadence: 'Flowing',
    stressPattern: 'Final',
    entropy: 'Medium',
    mutationRate: 'Medium',
    evolutionSpeed: 'Medium',
    emotion: { energetic: 0.5, warm: 0.5, creative: 0.4, premium: 0.3 },
  },

  // ── Meaning-driven species (emerge from deep/emotional concepts) ──────────
  {
    id: 'ashen',
    character: 'Ashen',
    feel: 'Muted, weighted, sombre — soft consonants over ash-grey vowels.',
    description:
      'A language that evolved around survival after irreversible destruction. Its words carry memory, ash and the weight of what was lost.',
    nativeCharacteristics: [
      'soft, muted consonants',
      'ash-grey, low vowels',
      'slow, weighted cadence',
      'endings that trail into silence',
      'words that hold memory',
      'sombre emotional profile',
    ],
    concepts: ['survival', 'loss', 'memory', 'destruction', 'resilience', 'shadow'],
    families: ['old-norse', 'hebrew', 'latin'],
    onsets: ['ash', 'vel', 'mor', 'sel', 'th', 'v', 's', 'n', 'ren', 'hal'],
    medials: ['sh', 'l', 'r', 'n', 'm', 'th', 'v'],
    nuclei: ['a', 'e', 'o', 'ae', 'u'],
    codas: ['sh', 'n', 'r', 'l', 'th', 's'],
    endings: ['en', 'ar', 'ur', 'a', 'is', 'al'],
    syllables: [2, 3],
    codaBias: 0.6,
    endingBias: 0.6,
    sharpness: 0.4,
    weight: 0.72,
    cadence: 'Measured',
    stressPattern: 'Initial',
    entropy: 'Medium',
    mutationRate: 'Low',
    evolutionSpeed: 'Slow',
    emotion: { mystical: 0.5, trustworthy: 0.3, warm: 0.2, natural: 0.2, premium: 0.2 },
  },
  {
    id: 'phoenix',
    character: 'Phoenix',
    feel: 'Bright, rising, warm — luminous vowels lifting toward the ending.',
    description:
      'A language that evolved around rebirth from fire. Its words rise, brighten and begin again.',
    nativeCharacteristics: [
      'bright, rising vowels',
      'warm liquid consonants',
      'ascending cadence',
      'open, luminous endings',
      'words that begin again',
      'hopeful emotional profile',
    ],
    concepts: ['rebirth', 'transcendence', 'fire', 'transformation', 'hope', 'energy'],
    families: ['greek', 'sanskrit', 'arabic'],
    onsets: ['pyr', 'ray', 'sol', 'ser', 'ra', 'ari', 'vi', 'sy', 'ph'],
    medials: ['r', 'l', 'n', 's', 'y', 'v'],
    nuclei: ['a', 'i', 'e', 'ia', 'ae', 'io'],
    codas: ['n', 'r', 'l', 's'],
    endings: ['ion', 'ara', 'ea', 'is', 'a', 'ia', 'ova'],
    syllables: [3, 4],
    codaBias: 0.35,
    endingBias: 0.7,
    sharpness: 0.45,
    weight: 0.5,
    cadence: 'Flowing',
    stressPattern: 'Final',
    entropy: 'Medium',
    mutationRate: 'Medium',
    evolutionSpeed: 'Fast',
    emotion: { creative: 0.5, energetic: 0.4, mystical: 0.4, warm: 0.3, premium: 0.3 },
  },
  {
    id: 'obsidian',
    character: 'Obsidian',
    feel: 'Dark, dense, unbreakable — hard clusters over deep, closed vowels.',
    description:
      'A language that evolved around what hardens under pressure. Its words are dark, dense and almost unbreakable.',
    nativeCharacteristics: [
      'dense consonant clusters',
      'deep, closed vowels',
      'heavy, hammered cadence',
      'hard, blunt endings',
      'words that resist erosion',
      'unyielding emotional profile',
    ],
    concepts: ['strength', 'depth', 'shadow', 'memory', 'destruction', 'identity', 'resilience'],
    families: ['old-norse', 'greek', 'hebrew'],
    onsets: ['obs', 'dra', 'gron', 'kor', 'th', 'vor', 'br', 'dr', 'gr'],
    medials: ['r', 'th', 'd', 'g', 'n', 'k'],
    nuclei: ['o', 'a', 'u', 'oa'],
    codas: ['n', 'r', 'th', 'k', 'rn'],
    endings: ['ar', 'un', 'or', 'al', 'os', 'on'],
    syllables: [2, 3],
    codaBias: 0.8,
    endingBias: 0.55,
    sharpness: 0.75,
    weight: 0.9,
    cadence: 'Measured',
    stressPattern: 'Initial',
    entropy: 'Low',
    mutationRate: 'Low',
    evolutionSpeed: 'Slow',
    emotion: { powerful: 0.6, mystical: 0.4, premium: 0.3, aggressive: 0.2 },
  },
  {
    id: 'chrysalis',
    character: 'Chrysalis',
    feel: 'Soft, unfolding, translucent — high vowels folding into long tails.',
    description:
      'A language that evolved around slow metamorphosis. Its words fold inward and emerge changed.',
    nativeCharacteristics: [
      'soft, unfolding consonants',
      'high, delicate vowels',
      'gentle, evolving cadence',
      'trailing, translucent endings',
      'words that transform as they lengthen',
      'tender emotional profile',
    ],
    concepts: ['transformation', 'rebirth', 'creation', 'identity', 'longing', 'healing'],
    families: ['celtic', 'sanskrit', 'finnish'],
    onsets: ['chry', 'sel', 'ly', 'vy', 'ny', 'lae', 'mir', 'sy', 'li'],
    medials: ['l', 'r', 'n', 's', 'y', 'v', 'th'],
    nuclei: ['i', 'ae', 'ia', 'y', 'e', 'ei'],
    codas: ['n', 'l', 'r', 's', 'th'],
    endings: ['is', 'ine', 'ise', 'ya', 'une', 'ia', 'ir'],
    syllables: [3, 4],
    codaBias: 0.4,
    endingBias: 0.7,
    sharpness: 0.3,
    weight: 0.4,
    cadence: 'Flowing',
    stressPattern: 'Even',
    entropy: 'High',
    mutationRate: 'High',
    evolutionSpeed: 'Fast',
    emotion: { creative: 0.5, elegant: 0.4, mystical: 0.4, warm: 0.2 },
  },
]

export function languageById(id: string): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0]
}
