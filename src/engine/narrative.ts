import type {
  Concept,
  EmotionalDNA,
  LanguageFamily,
  Lineage,
  WordGenome,
} from './types'
import type { Archetype } from './data/archetypes'
import { IDEAS } from './data/ideas'
import { dominantEmotions } from './emotional'

/**
 * The "explain the word" layer — rebuilt so meaning leads and etymology recedes.
 *
 * The old version narrated ingredients ("the light that gives rise to rainbow").
 * These functions instead state the *idea* a word was imagined to hold, drawn
 * from the concept map, and only then place it in a lineage. The concept always
 * comes before the origin.
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

/** A concept-first, one-line meaning — the idea the word holds. */
export function buildMeaning(lead: Concept, support?: Concept): string {
  const l = IDEAS[lead]
  if (support && support !== lead) {
    const s = IDEAS[support]
    return `${cap(l.noun)} meeting ${s.noun} — ${l.active}.`
  }
  return `${cap(l.noun)} — ${l.active}.`
}

/** Why the word exists, concept first, structure second. */
export function buildExplanation(
  lead: Concept,
  support: Concept | undefined,
  archetype: Archetype,
): string {
  const idea =
    support && support !== lead
      ? `${IDEAS[lead].active}, in service of ${IDEAS[support].noun}`
      : IDEAS[lead].active
  const structure = archetype.sharpness > 0.55
    ? `Its ${archetype.character.toLowerCase()} structure gives the idea a precise, engineered edge`
    : `Its ${archetype.character.toLowerCase()} structure lets the idea read as calm and human rather than clinical`
  return `A word imagined to hold ${IDEAS[lead].noun}: ${idea}. ${structure}.`
}

/** A believable account of how such a word might have evolved. */
export function buildStory(
  word: string,
  lead: Concept,
  archetype: Archetype,
): string {
  return (
    `Though ${word} has never been spoken before, it carries itself like a word ` +
    `with a past. It belongs to a ${archetype.character} lineage — ${lowerFirst(archetype.feel)} — ` +
    `and settles around ${IDEAS[lead].essence}. Said aloud a few times, it feels ` +
    `less invented than remembered.`
  )
}

/** Where the word feels like it came from — character + families, never ingredients. */
export function buildLineage(lead: Concept, archetype: Archetype): Lineage {
  const families = archetype.families.map((f) => FAMILY_LABEL[f])
  const familyPhrase = joinList(families)
  return {
    character: archetype.character,
    families: archetype.families,
    note: `A ${archetype.character}-lineage word, echoing ${familyPhrase} phonetics — shaped around ${IDEAS[lead].essence}.`,
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
