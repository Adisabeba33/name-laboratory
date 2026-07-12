import type {
  Concept,
  ConceptVector,
  EmotionalDNA,
  LanguageFamily,
  WordGenome,
} from './types'
import type { Candidate } from './assembler'
import { dominantEmotions } from './emotional'
import { topConcepts } from './concepts'
import { isVowel, normalise } from './phonetics'

/**
 * The "explain the word" layer.
 *
 * The vision is emphatic that a user should always understand *why* a word exists
 * — its meaning, its origin, its personality and the design logic behind its
 * sounds. Everything here reads off the roots, genome and emotional DNA that the
 * rest of the engine already computed, so the words and the story never disagree.
 */

const FAMILY_LABEL: Record<LanguageFamily, string> = {
  latin: 'Latin',
  greek: 'Ancient Greek',
  sanskrit: 'Sanskrit',
  'proto-indo-european': 'Proto-Indo-European',
  'old-norse': 'Old Norse',
  celtic: 'Celtic',
  japanese: 'Japanese',
  arabic: 'Arabic',
  hebrew: 'Hebrew',
  finnish: 'Finnish',
}

/** A one-line meaning synthesised from the two source roots. */
export function buildMeaning(candidate: Candidate, concepts: ConceptVector): string {
  const a = nounize(candidate.head.gloss)
  const b = nounize(candidate.tail.gloss)
  const lead = topConcepts(concepts, 1)[0]

  const templates = [
    `The ${a} that gives rise to ${b}.`,
    `Where ${a} meets ${b}.`,
    `The ${b} born of ${a}.`,
    `${capitalise(a)}, carried toward ${b}.`,
  ]
  // Pick deterministically from the word itself so re-renders are stable.
  const idx = candidate.word.length % templates.length
  let meaning = templates[idx]
  if (lead && !meaning.toLowerCase().includes(lead)) {
    meaning = meaning.replace(/\.$/, ` — a sense of ${lead}.`)
  }
  return meaning
}

/** Reduce a gloss to a clean noun-ish phrase: drop "to ", keep the primary sense. */
function nounize(gloss: string): string {
  return gloss.replace(/^to\s+/i, '').split(',')[0].trim()
}

/** Where the word comes from — the roots it was built from. */
export function buildOrigin(candidate: Candidate) {
  const roots = [candidate.head, candidate.tail].map((r) => ({
    form: r.form,
    gloss: r.gloss,
    family: r.family,
  }))
  const fa = FAMILY_LABEL[candidate.head.family]
  const fb = FAMILY_LABEL[candidate.tail.family]
  const families =
    fa === fb ? `${fa} roots` : `${fa} and ${fb} roots`
  const summary = `Inspired by ${families}: "${candidate.head.form}" (${candidate.head.gloss}) and "${candidate.tail.form}" (${candidate.tail.gloss}).`
  return { summary, roots }
}

/** A believable origin story that leans on natural linguistic evolution. */
export function buildStory(candidate: Candidate, genome: WordGenome): string {
  const first = nounize(candidate.head.gloss)
  const second = nounize(candidate.tail.gloss)
  const ending = candidate.ending
    ? `Its ending "${candidate.ending}" gives it a ${endingFeel(candidate.ending)} finish`
    : `Its open ending settles the word gently`
  const cluster = genome.pronounceability > 0.7 ? 'flows without friction' : 'carries a little weight on the tongue'

  return (
    `Although ${candidate.word} has never existed before, its structure follows ` +
    `natural linguistic evolution. Its first part reflects ${first}; its second ` +
    `conveys ${second}. ${ending}, and the whole ${cluster}. Read aloud a few ` +
    `times, it begins to feel like a word a language simply forgot to invent.`
  )
}

/** Plain-language explanation of the phonetic design choices. */
export function buildExplanation(
  candidate: Candidate,
  genome: WordGenome,
  concepts: ConceptVector,
): string {
  const leadConcepts = topConcepts(concepts, 3)
  const consonantNote =
    genome.sharpness > 0.6
      ? 'Its crisp consonants create precision and momentum'
      : 'Its soft consonant structure creates stability'
  const vowelNote =
    genome.vowelRatio > 0.45
      ? 'and its open vowels create warmth and space'
      : 'and its measured vowels keep it grounded'
  const endNote = isVowel(normalise(candidate.word).slice(-1))
    ? 'The vowel ending produces a premium feeling without sounding artificial.'
    : 'The consonant ending gives it a definite, engineered finish.'

  return (
    `This word was designed around ${listConcepts(leadConcepts)}. ` +
    `${consonantNote}, ${vowelNote}. ${endNote}`
  )
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

  // De-duplicate while preserving order, cap at five.
  return [...new Set(traits)].slice(0, 5)
}

/** Human-readable difficulty notes derived from the genome. */
export function buildDifficulty(genome: WordGenome): string[] {
  const notes: string[] = []
  notes.push(
    genome.pronounceability >= 0.7 ? 'Easy to pronounce' : 'Moderately easy to pronounce',
  )
  notes.push(
    genome.memorability >= 0.65 ? 'Easy to remember' : 'Takes a moment to settle',
  )
  notes.push(
    genome.visualSymmetry >= 0.5 ? 'Strong visual balance' : 'Distinctive visual profile',
  )
  return notes
}

function endingFeel(ending: string): string {
  if (/[aeiou]$/.test(ending)) return 'premium, open'
  if (/(ex|ix|yx|iq|on|os)$/.test(ending)) return 'sharp, modern'
  return 'grounded'
}

function listConcepts(concepts: Concept[]): string {
  if (concepts.length === 0) return 'a clear central idea'
  if (concepts.length === 1) return `the concept of ${concepts[0]}`
  const head = concepts.slice(0, -1).join(', ')
  const tail = concepts[concepts.length - 1]
  return `the concepts of ${head} and ${tail}`
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
