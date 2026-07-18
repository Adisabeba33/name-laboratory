/**
 * Naturalness — the Engine V3 signal.
 *
 * The old engine optimised for *unusualness*, which drifts into fantasy: words
 * that read as elf kingdoms or RPG spells ("Gruthuthoth", "Vorulalux"). This
 * scores the opposite target — how much a coined word feels like a word a real
 * human language could already own ("Sena", "Uber", "Kodak"). A high score means
 * the word feels *inevitable*, not manufactured.
 *
 * It is a transparent structural heuristic (like Speech Adoption), not a measured
 * probability. Its job is to become the PRIMARY ranking signal so believability
 * beats originality — originality is the last step, not the first.
 */
import {
  awkwardClusters,
  countSyllables,
  longestVowelRun,
  normalise,
  pronounceability,
  rhythm,
  syllableHarmony,
} from './phonetics'

/** A qualitative read of how real the word feels. Band, not a fake percentage. */
export type NaturalnessBand = 'Fabricated' | 'Plausible' | 'Believable' | 'Inevitable'

/** Endings that scream "invented / fantasy" — decorative, rarely in real words. */
const FANTASY_ENDING = /(iel|yth|ath|aith|oth|eth|yx|ux|ax|ox|ix|aer|eol|wyn)$/
/** Letters that read as exotic when they appear, worse when they pile up. */
const RARE_LETTERS = new Set(['x', 'z', 'q'])

/**
 * Sharp consonant classes whose over-repetition reads as a tongue-twister. Only
 * the *marked* classes are here — sibilants (s/z/x) and velars (k/g/q). Coronals
 * (t/d/n/l/r) and nasals are the most common sounds in real speech, so a word
 * leaning on them is natural, not awkward, and is deliberately left exempt.
 */
const SHARP_CLASS: Record<string, string> = {
  s: 'sibilant', z: 'sibilant', x: 'sibilant',
  k: 'velar', g: 'velar', q: 'velar',
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/**
 * Optional language context so `naturalness` judges a word by ITS OWN language's
 * phonology, not a fixed Latin/English ideal. `allowed` = the language's legitimate
 * consonant clusters (so its native clusters aren't marked awkward); `native` = the
 * set of letters that belong to the language (so `z`/`x`/`q` aren't "rare" for a
 * language that genuinely uses them). Omitted → the original global judgement.
 */
export interface NaturalnessContext {
  allowed?: ReadonlySet<string>
  native?: ReadonlySet<string>
}

/**
 * 0–1 naturalness. A `base` captures articulation + shape (could a mouth say it,
 * does it sit in a real word's size), then MULTIPLICATIVE penalties knock down
 * anything wearing fantasy markers — a decorative ending, exotic letters, a wall
 * of `th`, or sheer length. Multiplying (not averaging) is what gives real
 * separation: "Uber" ≈ 0.98, "Gruthuthoth" ≈ 0.12.
 *
 * With a {@link NaturalnessContext} the cluster / rare-letter / sharp-class
 * penalties become language-aware, so a Slavic or Nordic word isn't punished for
 * sounds its own language legitimately owns.
 */
export function naturalness(word: string, ctx: NaturalnessContext = {}): number {
  const w = normalise(word).replace(/[^a-zë-ü]/gi, '')
  if (w.length < 2) return 0
  const len = w.length
  const syl = countSyllables(w)

  // Base — how easily it's said and how ordinary its shape is (no fantasy markers yet).
  const ease = pronounceability(w)
  const flow = (rhythm(w) + syllableHarmony(w)) / 2
  // Up to four syllables reads as an ordinary word ("understanding", "inevitable");
  // only beyond that does a coined word start to feel over-long, and gently.
  const syllableScore = syl <= 4 ? (syl === 1 ? 0.85 : 1) : Math.max(0.45, 1 - (syl - 4) * 0.22)
  const clusterScore = Math.max(0, 1 - awkwardClusters(w, ctx.allowed) * 0.4)
  const base = clamp01(ease * 0.4 + flow * 0.2 + syllableScore * 0.2 + clusterScore * 0.2)

  // Multiplicative penalties — each fantasy tell scales the score down. Letters the
  // language natively uses are not "rare" for it (a Slavic z, a Nordic k-heavy palette).
  const rare = [...w].filter((c) => RARE_LETTERS.has(c) && !ctx.native?.has(c)).length
  const thCount = (w.match(/th/g) ?? []).length
  // Length is a GENTLE penalty, not a cliff: long words are legitimate when they
  // stay clean (real words run to 13–16 letters). The incantation smell is caught
  // by the fantasy-ending, rare-letter, th-wall, vowel-run and sharp-cluster
  // penalties — not by length itself. So a long, well-structured word stays natural.
  const lengthPenalty =
    len <= 9 ? 1 : len <= 11 ? 0.95 : len <= 13 ? 0.88 : len <= 16 ? 0.8 : 0.7
  const penalty =
    (FANTASY_ENDING.test(w) ? 0.5 : 1) *
    Math.max(0.3, 1 - rare * 0.35) *
    (thCount >= 2 ? 0.55 : 1) *
    lengthPenalty *
    (longestVowelRun(w) >= 3 ? 0.75 : 1) *
    sharpClusterPenalty(w, ctx.native)

  return clamp01(base * penalty)
}

/**
 * Soft penalty for piling up same-class SHARP consonants — a wall of hisses
 * ("Sysiasio") or a knot of hard stops ("Grugukyx"). Gentle and multiplicative:
 * three of one class ≈ 0.86, four ≈ 0.72; a single sharp letter repeated three or
 * more times shaves a touch more. Floored at 0.6 so it only *nudges* ranking (a
 * soft signal), never erases an otherwise fine word. Two of a class is fine, so
 * ordinary words ("Kodak", "Asholis") are untouched — only real clustering bites.
 */
function sharpClusterPenalty(w: string, native?: ReadonlySet<string>): number {
  const classCounts: Record<string, number> = {}
  const letterCounts: Record<string, number> = {}
  for (const c of w) {
    const cls = SHARP_CLASS[c]
    if (!cls) continue
    // A letter the language natively leans on (a Slavic z, a Nordic k) is not a
    // "tongue-twister" pile-up for that language — exempt it from the sharp count.
    if (native?.has(c)) continue
    classCounts[cls] = (classCounts[cls] ?? 0) + 1
    letterCounts[c] = (letterCounts[c] ?? 0) + 1
  }
  let factor = 1
  for (const n of Object.values(classCounts)) {
    if (n >= 3) factor *= Math.max(0.6, 1 - (n - 2) * 0.14)
  }
  const maxLetter = Math.max(0, ...Object.values(letterCounts))
  if (maxLetter >= 3) factor *= 0.88
  return factor
}

/** Map the 0–1 score to an honest band. */
export function naturalnessBand(score: number): NaturalnessBand {
  if (score >= 0.8) return 'Inevitable'
  if (score >= 0.66) return 'Believable'
  if (score >= 0.5) return 'Plausible'
  return 'Fabricated'
}

/**
 * The naturalness a word must reach to even be *considered* for the "exceptional"
 * standout tier (Engine V6). This sits high inside the Inevitable band (0.8+): a
 * word at 0.95 reads as indistinguishable from real vocabulary. The exceptional
 * tier requires more than this alone (see {@link engine} — it also demands the word
 * collides with nothing and stays compact), so it names only the rare few, never
 * "every word is a 99". Kept as an explicit, documented cut so the honesty is
 * auditable rather than an arbitrary hair-trigger near the metric's ceiling.
 */
export const EXCEPTIONAL_NATURALNESS = 0.95
