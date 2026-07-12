import type { CreativeMode, EmotionalAxis, LanguageFamily } from '../types'

/**
 * A creative mode shapes *how* a word is built without changing the meaning-first
 * order. It biases which language families the engine reaches for, which euphonic
 * endings it grows, and which emotional axes it should lean into.
 */
export interface ModeProfile {
  label: string
  description: string
  /** Families to favour when selecting roots (soft weighting). */
  favourFamilies: LanguageFamily[]
  /** Candidate endings to grow onto a word. First entries are preferred. */
  endings: string[]
  /** Emotional axes this mode should push upward. */
  emphasise: EmotionalAxis[]
  /** Preferred syllable count range for this mode. */
  syllables: [min: number, max: number]
}

export const MODES: Record<CreativeMode, ModeProfile> = {
  minimal: {
    label: 'Minimal',
    description: 'Short, clean, unadorned. Few syllables, open vowels.',
    favourFamilies: ['japanese', 'latin', 'finnish'],
    endings: ['a', 'o', 'i', 'e'],
    emphasise: ['minimal', 'elegant', 'trustworthy'],
    syllables: [2, 3],
  },
  luxury: {
    label: 'Luxury',
    description: 'Elevated, flowing, premium. Soft endings, warm vowels.',
    favourFamilies: ['latin', 'sanskrit', 'arabic'],
    endings: ['ara', 'esse', 'oire', 'ora', 'a'],
    emphasise: ['premium', 'elegant', 'warm'],
    syllables: [3, 4],
  },
  scientific: {
    label: 'Scientific',
    description: 'Precise, structured, credible. Greek/Latin roots, crisp endings.',
    favourFamilies: ['greek', 'latin', 'proto-indo-european'],
    endings: ['ex', 'ix', 'on', 'os', 'a'],
    emphasise: ['scientific', 'minimal', 'trustworthy'],
    syllables: [3, 4],
  },
  nature: {
    label: 'Nature',
    description: 'Grounded, alive, organic. Earthy roots, soft consonants.',
    favourFamilies: ['celtic', 'finnish', 'old-norse'],
    endings: ['a', 'wen', 'el', 'is'],
    emphasise: ['natural', 'warm', 'trustworthy'],
    syllables: [2, 3],
  },
  fantasy: {
    label: 'Fantasy',
    description: 'Evocative, otherworldly, mythic. Liquid consonants, long vowels.',
    favourFamilies: ['celtic', 'old-norse', 'sanskrit'],
    endings: ['iel', 'wyn', 'ara', 'oth', 'ael'],
    emphasise: ['mystical', 'creative', 'elegant'],
    syllables: [3, 4],
  },
  technology: {
    label: 'Technology',
    description: 'Modern, sharp, capable. Crisp onsets, punchy endings.',
    favourFamilies: ['greek', 'latin', 'proto-indo-european'],
    endings: ['ex', 'iq', 'on', 'yx', 'o'],
    emphasise: ['futuristic', 'scientific', 'powerful'],
    syllables: [2, 3],
  },
  medical: {
    label: 'Medical',
    description: 'Calm, trustworthy, precise. Latin/Greek healing roots.',
    favourFamilies: ['latin', 'greek', 'sanskrit'],
    endings: ['a', 'is', 'ora', 'en'],
    emphasise: ['trustworthy', 'scientific', 'premium'],
    syllables: [3, 4],
  },
  ancient: {
    label: 'Ancient',
    description: 'Weathered, timeless, resonant. Old roots, heavy vowels.',
    favourFamilies: ['sanskrit', 'greek', 'hebrew'],
    endings: ['os', 'um', 'ai', 'eth'],
    emphasise: ['mystical', 'premium', 'trustworthy'],
    syllables: [3, 4],
  },
  space: {
    label: 'Space',
    description: 'Vast, luminous, futuristic. Star and sky roots.',
    favourFamilies: ['latin', 'greek', 'proto-indo-european'],
    endings: ['a', 'ara', 'os', 'ix', 'eon'],
    emphasise: ['futuristic', 'mystical', 'elegant'],
    syllables: [3, 4],
  },
  japanese: {
    label: 'Japanese-inspired',
    description: 'Balanced, open, serene. CV syllables, pure vowels.',
    favourFamilies: ['japanese'],
    endings: ['a', 'o', 'i', 'ne', 'ka'],
    emphasise: ['minimal', 'elegant', 'natural'],
    syllables: [2, 3],
  },
  scandinavian: {
    label: 'Scandinavian',
    description: 'Cool, clean, sturdy. Norse and Finnish roots.',
    favourFamilies: ['old-norse', 'finnish'],
    endings: ['a', 'en', 'ë', 'o'],
    emphasise: ['minimal', 'trustworthy', 'natural'],
    syllables: [2, 3],
  },
  futuristic: {
    label: 'Futuristic',
    description: 'Sleek, forward, novel. Unusual onsets, smooth endings.',
    favourFamilies: ['greek', 'proto-indo-european', 'latin'],
    endings: ['a', 'io', 'eon', 'yx', 'ova'],
    emphasise: ['futuristic', 'premium', 'creative'],
    syllables: [3, 4],
  },
  organic: {
    label: 'Organic',
    description: 'Soft, living, human. Warm vowels, gentle consonants.',
    favourFamilies: ['sanskrit', 'celtic', 'finnish'],
    endings: ['a', 'ia', 'el', 'ora'],
    emphasise: ['natural', 'warm', 'trustworthy'],
    syllables: [3, 4],
  },
  timeless: {
    label: 'Timeless',
    description: 'Neutral, enduring, balanced. A safe, universal register.',
    favourFamilies: ['latin', 'greek', 'sanskrit'],
    endings: ['a', 'o', 'ora', 'is'],
    emphasise: ['premium', 'elegant', 'trustworthy'],
    syllables: [3, 4],
  },
}

export const DEFAULT_MODE: CreativeMode = 'timeless'
