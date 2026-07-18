import type { Language } from './data/languages'
import { KNOWN_WORDS } from './data/known-words'
import { Rng } from './rng'
import {
  awkwardClusters,
  clamp01,
  collectClusters,
  countSyllables,
  isVowel,
  longestVowelRun,
  normalise,
  pronounceability,
} from './phonetics'
import { editDistance } from './genome'
import { naturalness, type NaturalnessContext } from './naturalness'
import {
  consonantHardness,
  endsOpen,
  vowelDepth,
  weightedPick,
  type AcousticProfile,
} from './acoustics'

/**
 * Native-speaker word synthesis.
 *
 * Words are generated as native speakers of a language: each is assembled from
 * the language's own phoneme inventory and obeys its cadence, so the whole set
 * shares a sound world without being stem-mutations of one another. To guarantee
 * that internal diversity (rather than hope for it), we over-generate a candidate
 * pool and then select the most *mutually different* subset — spreading them
 * across syllable counts, onsets, endings and overall shape — so the result reads
 * as "words a native speaker would coin", never "Kaix / Kaon / Kaint".
 */
export interface NativeVocabulary {
  /** Distinct native words, capitalised. */
  words: string[]
  /** The language's canonical minimal specimen (for evolution distance). */
  prototype: string
  /** The honest evolution census for this language (Engine V6). */
  census: PopulationCensus
}

/**
 * The per-language slice of the lexical-evolution funnel (Engine V6). These are
 * real counts of the population this language bred, not decorative figures:
 * `generated` forms were synthesised and gate-tested, `rejected` failed a gate or
 * duplicated a survivor, `survived` distinct viable forms cleared every gate.
 * Selection into shipped words happens downstream (the generator adds
 * recommended / exceptional). Invariant: rejected = generated − survived.
 */
export interface PopulationCensus {
  generated: number
  rejected: number
  survived: number
}

/**
 * Engine V6 — how many candidate forms to breed and evaluate per language before
 * selecting the survivors. The engine genuinely synthesises this many words and
 * puts each through the phonotactic / naturalness gates, so the reported funnel
 * ("explored N, most failed, few survived") reflects real work. A wider search
 * also yields better survivors, so this is not busy-work: more candidates → a
 * stronger gene pool to select the shipped words from.
 */
const EVOLUTION_BUDGET = 300

/**
 * Default bias toward everyday speech. 0 = ornate words allowed (elaborate,
 * "incantation" shapes), 1 = strictly speakable. The default leans speakable so
 * a fresh run reads as words a person could actually say, not a spell.
 */
export const DEFAULT_SPEAKABILITY = 0.7

/**
 * The knobs a given speakability setting unlocks. Everything the synthesiser
 * needs to know derives from one 0–1 dial, so the UI can expose a single slider.
 */
interface SpeakControls {
  /** Minimum {@link pronounceability} a word must clear to be shipped by default. */
  floor: number
  /** Generous backstop on syllables (stops an ending stacking into a monster). */
  maxSyllables: number
  /** Longest run of adjacent vowels allowed (vowel walls are unsayable). */
  maxVowelRun: number
  /** `awkwardClusters` must be below this (0.5 = reject any non-onset pair). */
  clusterLimit: number
  /** Maximum romanised length. */
  maxLen: number
  /** Whether vowel runs are collapsed to whitelisted diphthongs only. */
  strict: boolean
}

/** Map the single 0–1 dial onto the concrete phonotactic limits. */
function speakControls(speakability: number): SpeakControls {
  const s = Math.max(0, Math.min(1, speakability))
  const strict = s >= 0.5
  return {
    floor: 0.3 + s * 0.42, // s=1 → 0.72, s=0.7 → ~0.59, s=0 → 0.30
    // Length is NOT capped tightly: real languages DO have long words
    // ("understanding", "inevitability", "недосказанность"), and they are legitimate
    // as long as they stay STRUCTURALLY clean — clear syllables, no wall of vowels,
    // no cluster pile-up, no incantation ending. Those are policed by the vowel-run,
    // cluster, reduplication and (in naturalness) fantasy-ending / sharp-cluster
    // guards below — NOT by a blunt length cap. So the backstop is generous; a long
    // word survives if it reads as a word, and dies only if it reads as a spell.
    maxSyllables: strict ? 6 : 8,
    maxVowelRun: strict ? 2 : 3,
    clusterLimit: strict ? 0.5 : 1,
    maxLen: strict ? 14 : 18,
    strict,
  }
}

/**
 * Speak `count` distinct native words of a language.
 *
 * `speakability` (0–1, default {@link DEFAULT_SPEAKABILITY}) biases the whole run
 * toward everyday speech via *quality*, not length: it sets a pronounceability
 * floor, limits vowel runs, and tidies vowel walls. Word length is deliberately
 * left free — a run mixes 2-, 3- and 4-syllable words, and beauty (not a blunt
 * syllable cap) decides what survives. Diversity selection then runs *inside* the
 * speakable set, so words stay mutually different without the "incantation" shapes
 * that pure max-diversity selection used to reward. If too few words clear the
 * floor, it relaxes gracefully so a run always yields something.
 */
export function speakNative(
  lang: Language,
  rng: Rng,
  count: number,
  speakability: number = DEFAULT_SPEAKABILITY,
  profile?: AcousticProfile,
): NativeVocabulary {
  const ctl = speakControls(speakability)
  const prototype = buildPrototype(lang)
  const pool: string[] = []
  const seen = new Set<string>()

  // Per-language phonotactics (accent fix): the clusters THIS language legitimately
  // owns, and the letters it natively uses. Passed to the gate and to naturalness so
  // a Slavic/Nordic word isn't rejected/penalised against a fixed Latin ideal.
  const ctx = nativePhonology(lang)

  // Engine V6 — breed a fixed population, gate every candidate, keep the survivors.
  // Unlike the old "stop as soon as the pool is full" loop, this explores a full
  // budget so the funnel counts are honest AND the survivor pool is deep enough
  // that selection has real choices (a wider search finds inevitabler words).
  const generated = EVOLUTION_BUDGET
  for (let i = 0; i < generated; i++) {
    const word = smoothVowels(tidy(generateWord(lang, rng, ctl.maxSyllables, profile)), ctl)
    const key = word.toLowerCase()
    if (
      key.length >= 4 &&
      key.length <= ctl.maxLen &&
      countSyllables(word) <= ctl.maxSyllables &&
      !seen.has(key) &&
      !KNOWN_WORDS.has(key) &&
      awkwardClusters(word, ctx.allowed) < ctl.clusterLimit &&
      longestVowelRun(word) <= ctl.maxVowelRun &&
      !reduplicated(word) &&
      hasVowel(word)
    ) {
      seen.add(key)
      pool.push(capitalise(word))
    }
  }

  const survived = pool.length
  return {
    words: selectSpeakable(pool, count, ctl.floor, ctx),
    prototype,
    census: { generated, rejected: generated - survived, survived },
  }
}

/**
 * A language's own phonology as a {@link NaturalnessContext}: the consonant
 * clusters it legitimately owns (from its onsets/medials/codas) and the letters it
 * natively uses (from its whole inventory). This is what makes the phonotactic gate
 * and naturalness ranking judge each language by its own sound world.
 */
function nativePhonology(lang: Language): NaturalnessContext {
  const allowed = collectClusters([...lang.onsets, ...lang.medials, ...lang.codas])
  const native = new Set<string>()
  for (const piece of [...lang.onsets, ...lang.medials, ...lang.nuclei, ...lang.codas, ...lang.endings]) {
    for (const ch of piece.toLowerCase()) if (/[a-zë-ü]/.test(ch)) native.add(ch)
  }
  return { allowed, native }
}

/**
 * Choose `count` words that feel *inevitable* and are mutually different.
 *
 * Engine V3 flips the objective: NATURALNESS is the primary signal (believability
 * beats originality), the speakability floor is a secondary gate, and diversity —
 * the old originality driver — runs LAST, only across the most-natural shortlist,
 * so spreading for variety never reaches down into fabricated / fantasy shapes.
 * Falls back gracefully so a run always returns words.
 */
function selectSpeakable(pool: string[], count: number, floor: number, ctx: NaturalnessContext = {}): string[] {
  if (pool.length <= count) return pool
  const scored = pool
    .map((w) => ({ w, nat: naturalness(w, ctx), say: pronounceability(w) }))
    .sort((a, b) => b.nat - a.nat)

  // Prefer words that clear the speakability floor AND don't read as fabricated.
  const natural = scored.filter((x) => x.say >= floor && x.nat >= 0.5)
  const usable = natural.length >= count ? natural : scored.filter((x) => x.say >= floor)
  const ranked = usable.length >= count ? usable : scored

  // Diversity (originality) is the LAST step — among the top-natural shortlist only.
  const shortlist = ranked.slice(0, Math.max(count, count * 3)).map((x) => x.w)
  return selectDiverse(shortlist, count)
}

/**
 * Greedily pick the most mutually-different subset (max-min diversity): start
 * from the first candidate, then repeatedly add the candidate whose *closest*
 * already-picked neighbour is the furthest away. This maximises spread and, in
 * particular, avoids two words that share a stem (the "template mutation" smell).
 */
function selectDiverse(pool: string[], count: number): string[] {
  if (pool.length <= count) return pool
  const picked = [pool[0]]
  const rest = pool.slice(1)
  while (picked.length < count && rest.length) {
    let bestIdx = 0
    let bestScore = -Infinity
    for (let i = 0; i < rest.length; i++) {
      let nearest = Infinity
      for (const p of picked) nearest = Math.min(nearest, wordDistance(rest[i], p))
      if (nearest > bestScore) {
        bestScore = nearest
        bestIdx = i
      }
    }
    picked.push(rest.splice(bestIdx, 1)[0])
  }
  return picked
}

/**
 * How different two words are (higher = more different). Blends normalised edit
 * distance with structural signals, and heavily penalises a shared prefix so
 * suffix-variations of one root never both survive.
 */
function wordDistance(a: string, b: string): number {
  const la = normalise(a)
  const lb = normalise(b)
  let d = editDistance(la, lb) / Math.max(la.length, lb.length, 1)
  const prefix = commonPrefixLength(la, lb)
  if (prefix >= 3) d -= 0.6
  else if (prefix === 2) d -= 0.25
  if (countSyllables(la) !== countSyllables(lb)) d += 0.15
  if (la[la.length - 1] !== lb[lb.length - 1]) d += 0.05
  return d
}

function commonPrefixLength(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/** The language's canonical, minimal word — its evolutionary "root form". */
function buildPrototype(lang: Language): string {
  const stem = lang.onsets[0] + lang.nuclei[0]
  return tidy(stem + lang.endings[0])
}

/**
 * Assemble one native word from the language's phonotactics. When an acoustic
 * `profile` is given (Engine V5), phoneme and shape choices are *biased* toward
 * the meaning's physics — harder onsets for hard meanings, deeper vowels for
 * heavy ones, more codas / shorter syllables for clipped ones, open endings for
 * airy ones — all still drawn from THIS language's own inventory.
 */
function generateWord(lang: Language, rng: Rng, maxSyllables: number, profile?: AcousticProfile): string {
  const [min, max] = lang.syllables
  let hi = Math.max(1, Math.min(max, maxSyllables))
  const lo = Math.min(min, hi)
  // Clipped meanings pull the upper bound down (short, abrupt); flowing ones keep it.
  if (profile && hi > lo) hi = Math.max(lo, Math.round(hi - profile.clip * (hi - lo)))
  const sylCount = lo + rng.int(hi - lo + 1)

  // Meaning shifts how often a syllable slams shut (clip) vs stays open (openness).
  const codaBias = profile
    ? clamp01(lang.codaBias + (profile.clip - 0.5) * 0.5 - (profile.openness - 0.5) * 0.5)
    : lang.codaBias

  const pickOnset = (list: string[]) =>
    profile ? weightedPick(list, rng, (o) => 1 - Math.abs(profile.hardness - consonantHardness(o))) : rng.pick(list)

  let word = ''
  for (let i = 0; i < sylCount; i++) {
    const first = i === 0
    const onset = pickOnset(first ? lang.onsets : lang.medials)
    const nucleus = profile
      ? weightedPick(lang.nuclei, rng, (n) => 1 - Math.abs(profile.depth - vowelDepth(n)))
      : rng.pick(lang.nuclei)
    const wantCoda = i < sylCount - 1 || rng.next() < codaBias
    const coda = wantCoda && rng.next() < codaBias ? rng.pick(lang.codas) : ''
    word = joinSyllable(word, onset, nucleus, coda)
  }

  // Sometimes finish on a signature ending; airy meanings favour open (vowel) ones.
  if (rng.next() < lang.endingBias) {
    const ending = profile
      ? weightedPick(lang.endings, rng, (e) => (endsOpen(e) ? 0.4 + profile.openness * 0.8 : 0.4 + (1 - profile.openness) * 0.8))
      : rng.pick(lang.endings)
    word = attachEnding(word, ending, lang, rng)
  }
  return word
}

/** Append a syllable (onset+nucleus+coda) to the word so far, smoothing seams. */
function joinSyllable(word: string, onset: string, nucleus: string, coda: string): string {
  let piece = onset + nucleus + coda
  if (word === '') return piece

  const prev = word[word.length - 1]
  const next = piece[0]
  // vowel meeting vowel: drop the incoming leading vowel.
  if (isVowel(prev) && isVowel(next)) {
    piece = piece.replace(/^[aeiouyë-ü]+/, '') || piece
  }
  // onset was itself vowel-led (e.g. "ae"): avoid a wall of vowels.
  return word + piece
}

/** Attach a signature ending with euphony (keeps the word pronounceable). */
function attachEnding(word: string, ending: string, lang: Language, rng: Rng): string {
  const wordVowel = isVowel(word[word.length - 1])
  const endVowel = isVowel(ending[0])
  if (wordVowel && endVowel) {
    const trimmed = ending.replace(/^[aeiouyë-ü]+/, '')
    return trimmed.length >= 2 ? word + trimmed : word.slice(0, -1) + ending
  }
  if (!wordVowel && !endVowel) {
    return word + rng.pick(lang.nuclei)[0] + ending
  }
  return word + ending
}

function hasVowel(word: string): boolean {
  return [...word].some(isVowel)
}

/**
 * True if the word repeats a 2-letter chunk back-to-back (ro·ro, ri·ri, na·na).
 * That immediate reduplication reads sing-song / childish ("Vororonoth"), so we
 * reject it — distinct from the healthy internal variety diversity selection wants.
 */
function reduplicated(word: string): boolean {
  return /(..)\1/.test(normalise(word))
}

/**
 * Vowel pairs a speaker glides through as one sound. Runs of vowels that are not
 * one of these read as a stumble ("oarlau", "eoa"); we collapse them.
 */
const DIPHTHONGS = new Set([
  'ai', 'ei', 'oi', 'au', 'ou', 'eu', 'ia', 'io', 'ie', 'ea', 'ua', 'ue', 'uo', 'ao', 'oa',
  // Korean / additional single-sound vowel pairs, so accents that rely on them
  // (eo, eu, ae, oe) survive strict smoothing instead of collapsing to one vowel.
  'eo', 'ae', 'oe',
])

/**
 * Tame vowel walls so a word stays sayable. Any run of adjacent vowels is reduced
 * to at most `maxVowelRun`; in strict mode a 2-vowel run survives only if it is a
 * real diphthong, otherwise it drops to a single vowel. This is what turns
 * "Groarlaudo" into "Grondo"-shaped, speakable output.
 */
function smoothVowels(word: string, ctl: SpeakControls): string {
  let out = ''
  let run = ''
  const flush = () => {
    if (run.length <= 1) {
      out += run
    } else {
      const two = run.slice(0, 2).toLowerCase()
      if (ctl.strict) {
        out += DIPHTHONGS.has(two) ? run.slice(0, 2) : run[0]
      } else if (run.length <= ctl.maxVowelRun) {
        out += run
      } else {
        out += DIPHTHONGS.has(two) ? run.slice(0, 2) : run[0]
      }
    }
    run = ''
  }
  for (const ch of word) {
    if (isVowel(ch)) run += ch
    else {
      flush()
      out += ch
    }
  }
  flush()
  return out
}

/** Collapse triple letters, doubled vowels and stray characters. */
function tidy(word: string): string {
  return normalise(word)
    .replace(/[^a-zë-ü]/gi, '')
    .replace(/(.)\1\1+/g, '$1$1')
    .replace(/(.)\1/g, (m, c: string) => (isVowel(c) ? c : m))
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
