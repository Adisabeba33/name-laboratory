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
  /**
   * Concepts this language's worldview cannot hold. If a meaning centres on one of
   * these, the language declines to coin a word for it rather than force one that
   * would lie — the "sometimes a language refuses a translation" behaviour (V4).
   */
  blindTo?: Concept[]
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
    feel: 'Hard, angular, northern — clustered onsets and clipped, stone-cold codas.',
    description:
      'A precision-oriented species with a northern, weather-hardened sound. Built around consonant clusters, closed syllables and short, clipped rhythmic units.',
    nativeCharacteristics: [
      'clustered onsets (sk / skj / kv / hv / fj)',
      'closed syllables with hard codas (-rn, -ld, -kt)',
      'short, clipped cadence',
      'few, plain vowels',
      'strong initial stress',
      'analytical emotional profile',
    ],
    concepts: ['science', 'precision', 'order', 'future', 'intelligence', 'light', 'recognition', 'understanding'],
    blindTo: ['grief', 'longing', 'shadow'],
    families: ['old-norse', 'proto-indo-european', 'greek'],
    onsets: ['sk', 'skj', 'st', 'sp', 'sn', 'sl', 'kv', 'hv', 'fj', 'fl', 'tr', 'br', 'gr', 'h', 'k', 't', 'b', 'v', 'r'],
    medials: ['k', 't', 'r', 'n', 'ld', 'nd', 'ng', 'st'],
    nuclei: ['a', 'o', 'u', 'e', 'i', 'ei', 'au', 'y'],
    codas: ['rn', 'ld', 'nd', 'kt', 'st', 'sk', 'ng', 'r', 'n', 'k', 't'],
    endings: ['nd', 'ard', 'vik', 'sen', 'rn', 'ir', 'ur', 'st', 'ald'],
    syllables: [2, 3],
    codaBias: 0.75,
    endingBias: 0.6,
    sharpness: 0.85,
    weight: 0.55,
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
    feel: 'Open, syllabic, gentle — every sound a clean consonant-vowel beat.',
    description:
      'A language evolved around emotional continuity and open, syllabic pronunciation. Its words move in clean consonant-vowel beats — nothing clusters, nothing closes hard.',
    nativeCharacteristics: [
      'strict consonant-vowel syllables',
      'pure, open vowels (a i u e o)',
      'no consonant clusters',
      'only a soft -n ever closes a syllable',
      'even, unhurried mora-timed rhythm',
      'calm emotional profile',
    ],
    concepts: ['calm', 'harmony', 'healing', 'water', 'human', 'trust', 'unity', 'connection', 'communication'],
    blindTo: ['destruction', 'shadow', 'power'],
    families: ['japanese', 'finnish', 'celtic'],
    onsets: ['k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'sh', 'ch', 'g', 'j', 'b'],
    medials: ['k', 's', 't', 'n', 'm', 'r', 'w', 'y', 'sh', 'g'],
    nuclei: ['a', 'i', 'u', 'e', 'o'],
    codas: ['n'],
    endings: ['ka', 'ko', 'mi', 'no', 'ra', 'to', 'na', 'sa', 'ne', 'ri', 'mu', 'shi'],
    syllables: [2, 4],
    codaBias: 0.12,
    endingBias: 0.55,
    sharpness: 0.35,
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
    feel: 'Living, open, sunlit — Polynesian vowels and soft, breathing consonants.',
    description:
      'A language evolved around growth and biology, with an open, island sound. Every syllable ends on a vowel; long vowels and gentle consonants give it a warm, breathing cadence.',
    nativeCharacteristics: [
      'open, vowel-final syllables',
      'long vowels and diphthongs (oa / ua / ae)',
      'soft consonants (h k l m n p w)',
      'no consonant clusters, no hard codas',
      'warm, breathing rhythm',
      'high warmth',
    ],
    concepts: ['nature', 'healing', 'creation', 'water', 'human', 'harmony'],
    blindTo: ['destruction', 'shadow', 'loss'],
    families: ['polynesian', 'finnish', 'celtic'],
    onsets: ['h', 'k', 'l', 'm', 'n', 'p', 'w', 'f', 'r'],
    medials: ['h', 'k', 'l', 'm', 'n', 'w', 'r'],
    nuclei: ['a', 'e', 'i', 'o', 'u', 'ai', 'au', 'oa', 'ae'],
    codas: ['n'],
    endings: ['oa', 'ua', 'ani', 'alo', 'ea', 'ika', 'ano', 'iwa'],
    syllables: [2, 4],
    codaBias: 0.05,
    endingBias: 0.6,
    sharpness: 0.15,
    weight: 0.4,
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
    feel: 'Warm, rounded, Italianate — open vowels, doubled consonants and a musical close.',
    description:
      'A ceremonial, Romance language evolved around status and refinement, with a warm Italian sound. Open vowels, doubled consonants (ll / tt / zz) and singing -ezza / -oro / -ella endings give it a musical, unhurried gravity.',
    nativeCharacteristics: [
      'open A / E / I / O / U vowels',
      'doubled consonants (ll / tt / ss / zz)',
      'soft gl / gn, warm r and l',
      'musical, stately cadence',
      'singing -ezza / -oro / -ella endings',
      'premium emotional profile',
    ],
    concepts: ['luxury', 'trust', 'elevation', 'light', 'order', 'time'],
    blindTo: ['grief', 'loss', 'shadow'],
    families: ['latin', 'greek', 'arabic'],
    onsets: ['b', 'k', 'd', 'f', 'g', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'br', 'tr', 'gr', 'fr', 'pr', 'fl', 'gl'],
    medials: ['ll', 'tt', 'ss', 'zz', 'nt', 'ng', 'r', 'n', 'l', 'v', 'm'],
    nuclei: ['a', 'e', 'i', 'o', 'u', 'ia', 'io', 'ie'],
    codas: ['n', 'r', 'l', 's'],
    endings: ['ezza', 'oro', 'ella', 'ino', 'etto', 'ata', 'ione', 'ana'],
    syllables: [2, 4],
    codaBias: 0.35,
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
    feel: 'Deep, mythic, Sanskritic — aspirated consonants and long, resonant vowels.',
    description:
      'A weathered, liturgical language evolved around memory and endurance, with a Sanskrit sound. Aspirated consonants (bh / dh / kh), retroflex weight and long vowels give it a deep, chanted gravity.',
    nativeCharacteristics: [
      'aspirated consonants (bh / dh / gh / kh)',
      'clusters like sv / dv / kṣ (ksh)',
      'long, resonant A / I / U vowels',
      'slow, chanted cadence',
      '-a / -tva / -ana endings',
      'mythic emotional profile',
    ],
    concepts: ['mystery', 'time', 'depth', 'knowledge', 'power', 'earth'],
    blindTo: ['future', 'hope'],
    families: ['sanskrit', 'greek', 'hebrew'],
    onsets: ['bh', 'dh', 'gh', 'kh', 'th', 'ph', 'br', 'pr', 'kr', 'tr', 'sv', 'dv', 'v', 'n', 'm', 's', 'h', 'd', 'k', 'g', 'r'],
    medials: ['dh', 'bh', 'ksh', 'sh', 'r', 'n', 'm', 'v', 't', 'd'],
    nuclei: ['a', 'i', 'u', 'e', 'o', 'ai', 'au'],
    codas: ['n', 'm', 'r', 'sh', 't'],
    endings: ['a', 'tra', 'tva', 'va', 'ana', 'ika', 'aya', 'am'],
    syllables: [2, 4],
    codaBias: 0.5,
    endingBias: 0.6,
    sharpness: 0.55,
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
    feel: 'Airy, luminous, Finnic — clear vowels, liquid tails and soft doubled stops.',
    description:
      'A luminous language evolved around light and distance, with a Finnic sound. Clear vowels and diphthongs, liquid l / r, soft doubled consonants and gentle -nen / -la endings give it a light, even cadence.',
    nativeCharacteristics: [
      'clear vowels and diphthongs (uo / ie / ai)',
      'liquid L / R / N tails',
      'soft doubled stops (kk / tt / ll)',
      'light, even cadence',
      'gentle -nen / -inen / -la endings',
      'visionary emotional profile',
    ],
    concepts: ['sky', 'light', 'vision', 'mystery', 'freedom', 'creation'],
    blindTo: ['grief', 'earth', 'destruction'],
    families: ['finnish', 'celtic', 'sanskrit'],
    onsets: ['k', 't', 'p', 's', 'h', 'l', 'm', 'n', 'r', 'v', 'j'],
    medials: ['kk', 'tt', 'll', 'nn', 'mm', 'r', 'l', 'n', 's', 'v', 'h'],
    nuclei: ['a', 'e', 'i', 'o', 'u', 'uo', 'ie', 'ai', 'ei'],
    codas: ['n', 'r', 'l', 's', 't', 'k'],
    endings: ['nen', 'inen', 'la', 'ala', 'sto', 'va', 'ainen', 'ari'],
    syllables: [2, 4],
    codaBias: 0.4,
    endingBias: 0.65,
    sharpness: 0.2,
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
    feel: 'Grounded, sturdy, Turkic — vowel-harmonic, firm stops and agglutinative tails.',
    description:
      'A sturdy language evolved around land and labour, with a Turkic sound. Plain harmonic vowels, firm q / k / g stops and stacked -lar / -gan / -uk endings give it a planted, hammered cadence.',
    nativeCharacteristics: [
      'plain, harmonic A / E / I / O / U vowels',
      'firm q / k / g / t stops',
      'ch / sh and -k / -z / -t codas',
      'short, hammered cadence',
      'agglutinative -lar / -gan / -uk endings',
      'grounded emotional profile',
    ],
    concepts: ['earth', 'strength', 'power', 'nature', 'energy', 'movement'],
    blindTo: ['transcendence', 'mystery', 'vision'],
    families: ['turkic', 'old-norse', 'finnish'],
    onsets: ['b', 'd', 'g', 'k', 'q', 't', 's', 'y', 'ch', 'sh', 'm', 'n', 'r'],
    medials: ['ld', 'nd', 'rk', 'ch', 'sh', 'k', 't', 'g', 'r', 'n', 'l', 'z'],
    nuclei: ['a', 'e', 'i', 'o', 'u'],
    codas: ['n', 'k', 'z', 't', 'r', 'ch', 'sh', 'q'],
    endings: ['lar', 'lik', 'gan', 'uk', 'dagh', 'iz', 'tan', 'man'],
    syllables: [2, 3],
    codaBias: 0.6,
    endingBias: 0.6,
    sharpness: 0.6,
    weight: 0.7,
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
    feel: 'Warm, radiant, Arabic — guttural onsets over bright open vowels.',
    description:
      'A radiant language evolved around heat and motion, with an Arabic sound. Guttural kh / gh / q, hushing sh and open -ah / -iya endings give it a bright, rising, desert warmth.',
    nativeCharacteristics: [
      'guttural kh / gh / q / h onsets',
      'hushing sh / dh',
      'bright, open A / I / U vowels',
      'rising, energetic cadence',
      'open -ah / -iya / -un endings',
      'energetic emotional profile',
    ],
    concepts: ['fire', 'energy', 'light', 'creation', 'movement', 'vision'],
    blindTo: ['grief', 'shadow', 'loss'],
    families: ['arabic', 'sanskrit', 'hebrew'],
    onsets: ['h', 'kh', 'gh', 'q', 'sh', 's', 'r', 'l', 'm', 'n', 'f', 'b', 'd', 't', 'z', 'w', 'j'],
    medials: ['sh', 'kh', 'r', 'l', 'm', 'n', 's', 'b', 'd', 'q', 'h'],
    nuclei: ['a', 'i', 'u', 'ai', 'ay'],
    codas: ['n', 'r', 'l', 'm', 'sh', 'q', 'd'],
    endings: ['ah', 'un', 'iya', 'an', 'im', 'ar', 'al'],
    syllables: [2, 3],
    codaBias: 0.5,
    endingBias: 0.6,
    sharpness: 0.5,
    weight: 0.55,
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
    feel: 'Muted, weighted, Hebraic — hushing sibilants and grief-grey vowels.',
    description:
      'A language that evolved around survival after irreversible destruction, with a Hebraic sound. Hushing sh / ch / kh, the ts sound and sombre -im / -oth / -el endings carry memory and the weight of what was lost.',
    nativeCharacteristics: [
      'hushing sh / ch / kh sibilants',
      'the ts / tz sound',
      'low, grief-grey vowels',
      'slow, weighted cadence',
      'sombre -im / -oth / -el endings',
      'sombre emotional profile',
    ],
    concepts: ['survival', 'loss', 'memory', 'destruction', 'resilience', 'shadow'],
    blindTo: ['hope', 'light', 'future'],
    families: ['hebrew', 'old-norse', 'arabic'],
    onsets: ['sh', 'ch', 'kh', 'ts', 'h', 'v', 'z', 's', 'r', 'l', 'm', 'n', 'b', 'd', 'g', 't', 'k', 'y'],
    medials: ['sh', 'ch', 'kh', 'ts', 'r', 'l', 'n', 'm', 'v', 'z', 'h'],
    nuclei: ['a', 'e', 'o', 'i', 'u'],
    codas: ['n', 'r', 'l', 'm', 'sh', 'ch', 'ts', 'v'],
    endings: ['im', 'oth', 'el', 'ah', 'on', 'ai', 'it'],
    syllables: [2, 3],
    codaBias: 0.6,
    endingBias: 0.6,
    sharpness: 0.45,
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
    feel: 'Bright, rising, Hellenic — ph / th / kh onsets lifting to classical endings.',
    description:
      'A language that evolved around rebirth from fire, with a classical Greek sound. Aspirated ph / th / kh, the chr / ps clusters and -os / -eus / -ia endings make its words rise and begin again.',
    nativeCharacteristics: [
      'aspirated ph / th / kh onsets',
      'classical clusters (chr / ps / rh)',
      'bright vowels and ai / ei diphthongs',
      'ascending cadence',
      '-os / -on / -eus / -ia endings',
      'hopeful emotional profile',
    ],
    concepts: ['rebirth', 'transcendence', 'fire', 'transformation', 'hope', 'energy'],
    blindTo: ['grief', 'loss', 'shadow'],
    families: ['greek', 'sanskrit', 'arabic'],
    onsets: ['ph', 'th', 'kh', 'ps', 'rh', 'chr', 'pr', 'tr', 'kr', 'st', 'sp', 'p', 't', 'k', 's', 'l', 'm', 'n', 'r', 'h'],
    medials: ['ph', 'th', 'kh', 'st', 'r', 'l', 'n', 'm', 's', 't', 'k'],
    nuclei: ['a', 'e', 'i', 'o', 'ai', 'ei', 'oi', 'eu'],
    codas: ['n', 'r', 's', 'x', 'th', 'ps'],
    endings: ['os', 'on', 'eus', 'is', 'ma', 'ia', 'tes', 'ios'],
    syllables: [2, 4],
    codaBias: 0.4,
    endingBias: 0.7,
    sharpness: 0.5,
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
    feel: 'Dense, Slavic-dark — hissing sibilants and consonant knots over deep vowels.',
    description:
      'A language that evolved around what hardens under pressure, with a dense Slavic sound. Its words knot consonants together — zv, mzh, zgr — and close on blunt, hissing codas.',
    nativeCharacteristics: [
      'dense Slavic consonant clusters (zv / vl / mzh / zgr)',
      'hissing sibilants (zh / sh / ch)',
      'deep, closed vowels',
      'heavy, hammered cadence',
      'blunt -ov / -sk / -nik endings',
      'unyielding emotional profile',
    ],
    concepts: ['strength', 'depth', 'shadow', 'memory', 'destruction', 'identity', 'resilience'],
    blindTo: ['hope', 'light', 'calm'],
    families: ['slavic', 'old-norse', 'greek'],
    onsets: ['zv', 'sv', 'vl', 'vr', 'zl', 'sm', 'zn', 'st', 'skr', 'str', 'zgr', 'mzh', 'zhd', 'tr', 'dr', 'br', 'zh', 'sh', 'ch', 'v', 'z', 's', 'r', 'm', 'n'],
    medials: ['zh', 'sh', 'ch', 'st', 'sk', 'zv', 'str', 'r', 'n', 'l', 'v', 'z', 's', 't', 'd'],
    nuclei: ['o', 'a', 'e', 'i', 'u', 'y'],
    codas: ['sk', 'st', 'v', 'n', 'r', 'l', 'zh', 'ch', 'ts'],
    endings: ['ov', 'ev', 'sk', 'nik', 'ska', 'na', 'yn', 'ich', 'ost', 'ar'],
    syllables: [2, 3],
    codaBias: 0.7,
    endingBias: 0.55,
    sharpness: 0.8,
    weight: 0.9,
    cadence: 'Measured',
    stressPattern: 'Initial',
    entropy: 'Medium',
    mutationRate: 'Low',
    evolutionSpeed: 'Slow',
    emotion: { powerful: 0.6, mystical: 0.4, premium: 0.3, aggressive: 0.2 },
  },
  {
    id: 'chrysalis',
    character: 'Chrysalis',
    feel: 'Soft, unfolding, Korean — eo / eu vowels folding into gentle -ng tails.',
    description:
      'A language that evolved around slow metamorphosis, with a Korean sound. The eo / eu / ae vowels, soft g / j / b consonants and -eon / -song / -eun endings make its words fold inward and emerge changed.',
    nativeCharacteristics: [
      'eo / eu / ae vowels',
      'soft g / j / b / d consonants',
      'gentle -ng / -n / -m codas',
      'even, evolving cadence',
      '-eon / -song / -eun endings',
      'tender emotional profile',
    ],
    concepts: ['transformation', 'rebirth', 'creation', 'identity', 'longing', 'healing'],
    blindTo: ['destruction', 'strength', 'power'],
    families: ['korean', 'sanskrit', 'finnish'],
    onsets: ['g', 'j', 'b', 'd', 's', 'm', 'n', 'h', 'k', 't', 'p', 'ch', 'r', 'y', 'w'],
    medials: ['ng', 'n', 'm', 'l', 'r', 's', 'g', 'j', 'k', 'b'],
    nuclei: ['a', 'e', 'i', 'o', 'u', 'eo', 'eu', 'ae', 'wa', 'wi'],
    codas: ['ng', 'n', 'm', 'k', 'l', 'p', 't'],
    endings: ['eon', 'wi', 'song', 'han', 'mi', 'eun', 'ju', 'ok'],
    syllables: [2, 3],
    codaBias: 0.5,
    endingBias: 0.6,
    sharpness: 0.35,
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
