import type { Concept, EmotionalAxis, LanguageFamily } from '../types'

/**
 * Linguistic archetypes — the engine's "species".
 *
 * The central fix for "every word is a mutation of one formula": instead of
 * gluing two roots together, each generated *family* is grown inside an
 * archetype — a self-contained sound world with its own phoneme inventory and
 * emotional signature. Because the archetypes sound genuinely different from one
 * another (Crystalline vs. Liquid vs. Ancient), a single generation immediately
 * reads as several distinct linguistic species rather than one repeated pattern.
 *
 * Words are *synthesised* from these inventories, so the source roots and
 * languages only inspire the texture — they never show through the surface.
 */
export interface Archetype {
  id: string
  /** Human label for the linguistic character. */
  character: string
  /** One-line description of the sound world. */
  feel: string
  /** Concepts this archetype naturally resonates with. */
  concepts: Concept[]
  /** Language families whose phonetics inspired it (flavour only). */
  families: LanguageFamily[]

  /** Syllable-initial consonants / clusters. */
  onsets: string[]
  /** Vowel nuclei. */
  nuclei: string[]
  /** Syllable-final consonants (used to close a stem or bridge syllables). */
  codas: string[]
  /** Word-final flourishes that give the family its signature. */
  endings: string[]

  /** How often a family stem carries a closing consonant (0–1). */
  codaBias: number
  /** Softness (0) ↔ sharpness (1) of the palette — drives emotional weight. */
  sharpness: number
  /** Perceived gravitas of the palette (0–1). */
  weight: number

  /**
   * The archetype's emotional signature — deltas added to the emotional DNA
   * (0–1 scale). This is what makes families read *differently* from each other
   * instead of all landing on the same premium/scientific/elegant scores.
   */
  emotion: Partial<Record<EmotionalAxis, number>>
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'liquid',
    character: 'Liquid',
    feel: 'Soft, flowing, unhurried — vowels open and consonants melt.',
    concepts: ['calm', 'harmony', 'healing', 'water', 'human', 'trust', 'unity'],
    families: ['latin', 'celtic', 'finnish'],
    onsets: ['l', 'm', 'n', 's', 'v', 'r', 'sel', 'mel', 'lir', 'len', 'sil', 'nel'],
    nuclei: ['a', 'e', 'i', 'ae', 'ia', 'o', 'ei'],
    codas: ['n', 'r', 'l', 's', 'm'],
    endings: ['a', 'ia', 'une', 'ora', 'elle', 'ael', 'ir', 'een'],
    codaBias: 0.5,
    sharpness: 0.2,
    weight: 0.4,
    emotion: { elegant: 0.5, warm: 0.5, trustworthy: 0.4, premium: 0.3, natural: 0.3 },
  },
  {
    id: 'crystalline',
    character: 'Crystalline',
    feel: 'Sharp, precise, engineered — crisp onsets and clean edges.',
    concepts: ['science', 'precision', 'order', 'future', 'intelligence', 'light'],
    families: ['greek', 'latin', 'proto-indo-european'],
    onsets: ['k', 'q', 't', 'kr', 'tr', 'qu', 'kv', 'z', 'x'],
    nuclei: ['a', 'i', 'ua', 'e', 'y', 'ai'],
    codas: ['n', 'x', 'r', 's', 't', 'k'],
    endings: ['is', 'ix', 'on', 'or', 'ar', 'ex', 'ent', 'ys'],
    codaBias: 0.7,
    sharpness: 0.85,
    weight: 0.5,
    emotion: { scientific: 0.7, futuristic: 0.5, minimal: 0.4, premium: 0.3 },
  },
  {
    id: 'noble',
    character: 'Noble',
    feel: 'Rounded, elevated, moneyed — long vowels and a warm close.',
    concepts: ['luxury', 'trust', 'elevation', 'light', 'order', 'time'],
    families: ['latin', 'sanskrit', 'arabic'],
    onsets: ['v', 's', 'd', 'l', 'r', 'so', 'au', 'val', 'ser', 'dor'],
    nuclei: ['o', 'au', 'a', 'e', 'ou', 'oa'],
    codas: ['n', 'r', 's', 'l', 'm'],
    endings: ['on', 'ora', 'elle', 'ova', 'aire', 'or', 'esse', 'ant'],
    codaBias: 0.55,
    sharpness: 0.3,
    weight: 0.7,
    emotion: { premium: 0.8, elegant: 0.6, trustworthy: 0.4, warm: 0.2 },
  },
  {
    id: 'ancient',
    character: 'Ancient',
    feel: 'Deep, weathered, mythic — heavy vowels and old consonants.',
    concepts: ['mystery', 'time', 'depth', 'knowledge', 'power', 'earth'],
    families: ['old-norse', 'greek', 'hebrew'],
    onsets: ['th', 'dr', 'br', 'gr', 'vor', 'thal', 'mor', 'kor', 'dra'],
    nuclei: ['o', 'a', 'au', 'u', 'oa'],
    codas: ['n', 'r', 'th', 'l', 'k', 'rn'],
    endings: ['os', 'oth', 'an', 'ar', 'eth', 'un', 'or', 'ux'],
    codaBias: 0.75,
    sharpness: 0.6,
    weight: 0.85,
    emotion: { mystical: 0.7, powerful: 0.5, premium: 0.3, scientific: 0.1 },
  },
  {
    id: 'ethereal',
    character: 'Ethereal',
    feel: 'Airy, luminous, otherworldly — high vowels and liquid tails.',
    concepts: ['sky', 'light', 'vision', 'mystery', 'freedom', 'creation'],
    families: ['celtic', 'sanskrit', 'finnish'],
    onsets: ['ae', 'y', 'e', 's', 'sy', 'ly', 'el', 'ysh', 'ael', 'ny'],
    nuclei: ['ae', 'e', 'i', 'ia', 'y', 'ei', 'ie'],
    codas: ['n', 'l', 'r', 'th'],
    endings: ['iel', 'ael', 'wyn', 'ys', 'ith', 'aria', 'ael', 'ea'],
    codaBias: 0.45,
    sharpness: 0.3,
    weight: 0.35,
    emotion: { mystical: 0.5, elegant: 0.5, creative: 0.5, futuristic: 0.3 },
  },
  {
    id: 'earthen',
    character: 'Earthen',
    feel: 'Grounded, sturdy, physical — short vowels and firm stops.',
    concepts: ['earth', 'strength', 'power', 'nature', 'energy', 'movement'],
    families: ['old-norse', 'celtic', 'finnish'],
    onsets: ['g', 'b', 'n', 'd', 'br', 'gr', 'dr', 'k', 'nor', 'bar', 'gan'],
    nuclei: ['a', 'o', 'u', 'e'],
    codas: ['n', 'r', 'k', 'g', 'd', 'rn', 'll'],
    endings: ['ek', 'ok', 'an', 'ar', 'un', 'or', 'is', 'ald'],
    codaBias: 0.8,
    sharpness: 0.65,
    weight: 0.75,
    emotion: { powerful: 0.6, natural: 0.5, energetic: 0.4, warm: 0.3 },
  },
  {
    id: 'solar',
    character: 'Solar',
    feel: 'Warm, radiant, moving — bright vowels and an upward lift.',
    concepts: ['fire', 'energy', 'light', 'creation', 'movement', 'vision'],
    families: ['latin', 'sanskrit', 'arabic'],
    onsets: ['s', 'r', 'h', 'f', 'sol', 'ray', 'ser', 'ari', 'sar'],
    nuclei: ['a', 'o', 'e', 'ia', 'ai'],
    codas: ['l', 'r', 'n', 's'],
    endings: ['a', 'io', 'ara', 'eon', 'is', 'iel', 'ova'],
    codaBias: 0.4,
    sharpness: 0.45,
    weight: 0.5,
    emotion: { energetic: 0.5, warm: 0.5, creative: 0.4, premium: 0.3 },
  },
  {
    id: 'verdant',
    character: 'Verdant',
    feel: 'Living, organic, gentle — leafy consonants and even vowels.',
    concepts: ['nature', 'healing', 'creation', 'water', 'human', 'harmony'],
    families: ['finnish', 'celtic', 'latin'],
    onsets: ['v', 'f', 'l', 'm', 'n', 's', 'w', 'ver', 'lan', 'mir'],
    nuclei: ['e', 'a', 'i', 'ai', 'ei'],
    codas: ['n', 'l', 'r', 's'],
    endings: ['en', 'el', 'ia', 'wen', 'is', 'ara', 'eth'],
    codaBias: 0.5,
    sharpness: 0.25,
    weight: 0.45,
    emotion: { natural: 0.7, warm: 0.4, trustworthy: 0.4, elegant: 0.2 },
  },
]

export function archetypeById(id: string): Archetype {
  return ARCHETYPES.find((a) => a.id === id) ?? ARCHETYPES[0]
}
