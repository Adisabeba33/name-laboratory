import type {
  Ancestry,
  Concept,
  EmotionalDNA,
  LanguageFamily,
  WordGenome,
} from './types'
import type { Language } from './data/languages'
import { IDEAS } from './data/ideas'
import { dominantEmotions } from './emotional'

/**
 * The "explain the word" layer — meaning leads, ancestry reads like research.
 *
 * The framing is a linguistic laboratory, not branding software: a word doesn't
 * say "inspired by Greek and Latin", it states its *phonetic ancestry* — the
 * families its sound descends from — and the idea it was discovered to carry.
 * The concept always comes before the ancestry.
 */

const FAMILY_LABEL: Record<LanguageFamily, string> = {
  latin: 'Latin',
  greek: 'Greek',
  sanskrit: 'Sanskrit',
  'proto-indo-european': 'Proto-Indo-European',
  'old-norse': 'Old Norse',
  celtic: 'Celtic',
  japanese: 'Japanese',
  arabic: 'Arabic',
  hebrew: 'Hebrew',
  finnish: 'Finnish',
}

export function familyLabel(family: LanguageFamily): string {
  return FAMILY_LABEL[family]
}

/**
 * A clear, dictionary-style definition of what the word means — plain language,
 * not abstract poetry — followed by a fluent (not word-for-word) Russian
 * rendering in parentheses. Each word in a language leads on a different concept,
 * so each gets its own definition.
 */
export function buildMeaning(lead: Concept, _support?: Concept): string {
  const l = IDEAS[lead]
  return `${cap(l.def)}. (${cap(l.defRu)}.)`
}

/** Why the word exists, concept first, structure second. */
export function buildExplanation(
  lead: Concept,
  support: Concept | undefined,
  language: Language,
): string {
  const idea =
    support && support !== lead
      ? `${IDEAS[lead].active}, in service of ${IDEAS[support].noun}`
      : IDEAS[lead].active
  const structure = language.sharpness > 0.55
    ? `Its ${language.character} phonology gives the idea a precise, engineered edge`
    : `Its ${language.character} phonology lets the idea read as calm and human rather than clinical`
  return `A word imagined to hold ${IDEAS[lead].noun}: ${idea}. ${structure}.`
}

/** A believable account of how such a word might have evolved. */
export function buildStory(word: string, lead: Concept, language: Language): string {
  return (
    `Though ${word} has never been spoken before, it carries itself like a native ` +
    `word of a real language. It descends from the ${language.character} species — ` +
    `${lowerFirst(language.feel)} — and settles around ${IDEAS[lead].essence}. Said ` +
    `aloud a few times, it feels less invented than remembered.`
  )
}

/** Phonetic ancestry — species + families the sound descends from, never ingredients. */
export function buildAncestry(lead: Concept, language: Language): Ancestry {
  const families = language.families.map((f) => FAMILY_LABEL[f])
  return {
    character: language.character,
    families: language.families,
    note: `${language.character} — constructed using phonetic patterns associated with ${joinList(families)}, shaped around ${IDEAS[lead].essence}.`,
  }
}

/** A handful of personality adjectives, read off the emotional DNA. */
export function buildPersonality(dna: EmotionalDNA): string[] {
  const map: Partial<Record<keyof EmotionalDNA, string>> = {
    premium: 'Premium',
    scientific: 'Precise',
    elegant: 'Elegant',
    trustworthy: 'Trustworthy',
    creative: 'Visionary',
    natural: 'Organic',
    minimal: 'Minimal',
    powerful: 'Powerful',
    energetic: 'Energetic',
    warm: 'Warm',
    futuristic: 'Futuristic',
    mystical: 'Timeless',
    playful: 'Playful',
    aggressive: 'Bold',
  }
  const traits = dominantEmotions(dna, 5)
    .map((a) => map[a])
    .filter((x): x is string => Boolean(x))
  return [...new Set(traits)].slice(0, 5)
}

/** Human-readable difficulty notes derived from the genome. */
export function buildDifficulty(genome: WordGenome): string[] {
  return [
    genome.pronounceability >= 0.7 ? 'Easy to pronounce' : 'Moderately easy to pronounce',
    genome.memorability >= 0.6 ? 'Easy to remember' : 'Takes a moment to settle',
    genome.visualSymmetry >= 0.5 ? 'Strong visual balance' : 'Distinctive visual profile',
  ]
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
