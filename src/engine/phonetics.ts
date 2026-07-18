/**
 * Phonetic primitives.
 *
 * Everything downstream — the genome, the emotional DNA, pronounceability — leans
 * on a handful of sound facts about a candidate word. This module keeps them in
 * one place, working on the romanised surface form (no IPA required for the MVP).
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'ë', 'ï', 'ö', 'ü'])

/** Consonants that read as "sharp"/hard, used for the sharpness axis. */
const SHARP_CONSONANTS = new Set(['k', 'q', 'x', 't', 'z', 'g', 'c', 'j', 'v'])
/** Consonants that read as "soft"/liquid. */
const SOFT_CONSONANTS = new Set(['l', 'm', 'n', 'r', 'w', 's', 'h', 'f'])

/** Consonant clusters that are comfortable at the start of a syllable. */
const VALID_ONSETS = new Set([
  'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'bl', 'cl', 'fl', 'gl', 'pl', 'sl',
  'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw', 'tw', 'th', 'ch', 'sh', 'ph', 'wh',
  'qu', 'gn', 'kn', 'wr', 'str', 'spr', 'scr', 'thr',
])

export function isVowel(ch: string): boolean {
  return VOWELS.has(ch.toLowerCase())
}

export function normalise(word: string): string {
  return word.toLowerCase().trim()
}

/**
 * Estimate syllable count by counting vowel groups. Adjacent vowels count once
 * (they form a single nucleus), which matches how most of these words are read.
 */
export function countSyllables(word: string): number {
  const w = normalise(word)
  let count = 0
  let inVowel = false
  for (const ch of w) {
    if (isVowel(ch)) {
      if (!inVowel) count++
      inVowel = true
    } else {
      inVowel = false
    }
  }
  return Math.max(1, count)
}

/** The longest run of adjacent vowels — a proxy for how much a word "piles up". */
export function longestVowelRun(word: string): number {
  const w = normalise(word)
  let best = 0
  let run = 0
  for (const ch of w) {
    if (isVowel(ch)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

export function vowelRatio(word: string): number {
  const w = normalise(word)
  const letters = [...w].filter((c) => /[a-zë-ü]/i.test(c))
  if (letters.length === 0) return 0
  const vowels = letters.filter(isVowel).length
  return vowels / letters.length
}

/**
 * Sharpness: fraction of consonants that are hard/plosive versus soft/liquid.
 * 0 = wholly soft, 1 = wholly sharp.
 */
export function sharpness(word: string): number {
  const w = normalise(word)
  let sharp = 0
  let soft = 0
  for (const ch of w) {
    if (SHARP_CONSONANTS.has(ch)) sharp++
    else if (SOFT_CONSONANTS.has(ch)) soft++
  }
  const total = sharp + soft
  if (total === 0) return 0.5
  return sharp / total
}

/**
 * A cluster is problematic if it is 3+ consonants that don't form a known onset,
 * or a 2-consonant run that isn't a valid onset and straddles unusual pairs.
 * Returns the number of awkward clusters — used to penalise pronounceability.
 *
 * `allowed` (optional) is a language's OWN set of legitimate consonant clusters
 * (see {@link collectClusters}). A cluster the language explicitly declares is not
 * awkward FOR THAT LANGUAGE — this is what lets a Slavic "mzh" or a Nordic "skj"
 * survive when its own language wants it, while the global Latin whitelist still
 * governs any language that declares nothing. Without `allowed`, behaviour is
 * exactly as before (global Latin `VALID_ONSETS` only).
 */
export function awkwardClusters(word: string, allowed?: ReadonlySet<string>): number {
  const w = normalise(word)
  let awkward = 0
  let run = ''
  for (const ch of w) {
    if (!isVowel(ch) && /[a-z]/.test(ch)) {
      run += ch
    } else {
      awkward += scoreRun(run, allowed)
      run = ''
    }
  }
  awkward += scoreRun(run, allowed)
  return awkward
}

function scoreRun(run: string, allowed?: ReadonlySet<string>): number {
  if (run.length <= 1) return 0
  // A cluster the language itself owns is comfortable for that language.
  if (allowed?.has(run)) return 0
  const ok = (c: string) => VALID_ONSETS.has(c) || (allowed?.has(c) ?? false)
  if (run.length === 2) return ok(run) ? 0 : 0.5
  // 3+ consonants: only comfortable if it starts with a valid 2/3 onset (global
  // Latin whitelist OR the language's own cluster set).
  const three = run.slice(0, 3)
  const two = run.slice(0, 2)
  if (ok(three) || ok(two)) return run.length >= 4 ? 1 : 0.5
  return run.length - 1
}

/**
 * Build a language's own set of legitimate consonant clusters from its phoneme
 * inventory (onsets + medials + codas). Every consonant-only run of length ≥ 2
 * inside a piece — and all of its ≥2 sub-runs — is registered, so a declared
 * onset like "skj" also licenses "sk"/"kj", and a coda "rn" licenses "rn". This is
 * what `awkwardClusters(word, allowed)` consults so a language's native clusters
 * (and the seams between them) aren't penalised as Latin-awkward.
 */
export function collectClusters(parts: readonly string[]): Set<string> {
  const out = new Set<string>()
  for (const part of parts) {
    const w = normalise(part)
    let run = ''
    const flush = () => {
      if (run.length >= 2) {
        for (let i = 0; i < run.length - 1; i++) {
          for (let j = i + 2; j <= run.length; j++) out.add(run.slice(i, j))
        }
      }
      run = ''
    }
    for (const ch of w) {
      if (!isVowel(ch) && /[a-z]/.test(ch)) run += ch
      else flush()
    }
    flush()
  }
  return out
}

/**
 * Pronounceability across languages, 0–1. Rewards alternating CV structure and
 * open endings; penalises awkward clusters and excessive length.
 */
export function pronounceability(word: string): number {
  const w = normalise(word)
  const syl = countSyllables(w)
  const clusters = awkwardClusters(w)
  const ratio = vowelRatio(w)

  // Ideal vowel ratio sits around 0.45; penalise deviation.
  const ratioScore = 1 - Math.min(1, Math.abs(ratio - 0.45) / 0.45)
  const clusterScore = Math.max(0, 1 - clusters * 0.3)
  const lengthScore = w.length <= 9 ? 1 : Math.max(0.4, 1 - (w.length - 9) * 0.08)
  const syllableScore = syl <= 4 ? 1 : Math.max(0.5, 1 - (syl - 4) * 0.2)
  const endsOpen = isVowel(w[w.length - 1] ?? '') ? 1 : 0.85

  return clamp01(
    ratioScore * 0.3 +
      clusterScore * 0.3 +
      lengthScore * 0.15 +
      syllableScore * 0.15 +
      endsOpen * 0.1,
  )
}

/**
 * A qualitative read of how readily a word enters everyday speech. It blends the
 * three things that actually make a coined word sayable — clean phonotactics,
 * few syllables and modest length — so a long-but-smooth "incantation" is flagged
 * rather than passed as speakable. A band (not a percentage), per the honesty
 * rules: we are not claiming a measured probability of adoption.
 */
export function speakabilityBand(word: string): 'Speakable' | 'Balanced' | 'Ornate' {
  const p = pronounceability(word)
  const syllables = countSyllables(word)
  const length = normalise(word).replace(/[^a-zë-ü]/gi, '').length
  // Length is not penalised on its own — a smooth 4-syllable word is Speakable.
  // Only genuinely hard-to-say shapes (low pronounceability, or a true monster)
  // fall to Balanced/Ornate.
  if (p >= 0.6 && syllables <= 4 && length <= 11) return 'Speakable'
  if (p < 0.45 || syllables >= 6 || length >= 13) return 'Ornate'
  return 'Balanced'
}

/** Left/right symmetry of the written form (palindromic tendency), 0–1. */
export function visualSymmetry(word: string): number {
  const w = normalise(word).replace(/[^a-z]/g, '')
  if (w.length < 2) return 0.5
  let matches = 0
  const half = Math.floor(w.length / 2)
  for (let i = 0; i < half; i++) {
    if (mirrors(w[i], w[w.length - 1 - i])) matches++
  }
  return half === 0 ? 0.5 : matches / half
}

/** Two letters "mirror" if identical or visually balanced (round/round, tall/tall). */
function mirrors(a: string, b: string): boolean {
  if (a === b) return true
  const round = new Set(['o', 'a', 'e', 'c', 's', 'u'])
  const tall = new Set(['l', 'd', 'b', 'k', 'h', 't', 'f', 'i'])
  return (round.has(a) && round.has(b)) || (tall.has(a) && tall.has(b))
}

/**
 * Rhythm: how evenly syllable lengths are distributed. A word whose syllables are
 * of similar size scores higher (feels balanced when spoken).
 */
export function rhythm(word: string): number {
  const groups = syllableSizes(word)
  if (groups.length <= 1) return 0.8
  const mean = groups.reduce((a, b) => a + b, 0) / groups.length
  const variance =
    groups.reduce((a, b) => a + (b - mean) ** 2, 0) / groups.length
  // Lower variance → higher rhythm. Normalise against a variance of ~2.
  return clamp01(1 - variance / 2.5)
}

/** Consistency of syllable shapes — how "harmonious" the syllabification feels. */
export function syllableHarmony(word: string): number {
  const sizes = syllableSizes(word)
  if (sizes.length <= 1) return 0.85
  const unique = new Set(sizes).size
  // Fewer distinct syllable sizes → more harmony.
  return clamp01(1 - (unique - 1) / sizes.length)
}

/** Split a word into rough syllable chunks and return their character lengths. */
function syllableSizes(word: string): number[] {
  const w = normalise(word)
  const sizes: number[] = []
  let current = 0
  let seenVowel = false
  for (const ch of w) {
    current++
    if (isVowel(ch)) {
      if (seenVowel) {
        // second vowel group starts a new syllable boundary before it
        sizes.push(current - 1)
        current = 1
      }
      seenVowel = true
    } else if (seenVowel) {
      // consonant after a vowel: tentative boundary handled by next vowel
    }
  }
  if (current > 0) sizes.push(current)
  return sizes.length ? sizes : [w.length]
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
