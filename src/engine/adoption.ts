import type { PronunciationRating, WordGenome, SpeechAdoption, AdoptionComponent } from './types'
import { awkwardClusters, isVowel, normalise } from './phonetics'

/**
 * Speech Adoption — can this word actually enter human speech?
 *
 * The product's real question is not "how original is this word" but "would a
 * person actually start using it". This assessment answers that with a
 * transparent, RULE-BASED estimate (no LLM, so it's free and always available):
 * six components, each scored out of its own budget, from the word's measurable
 * phonetic properties. It states an honest qualitative band plus the breakdown,
 * and lists concrete strengths and risks — never a fake-precise single number.
 *
 * It is a STRUCTURAL heuristic: it does not perform external brand / drug /
 * trademark checks. The UI says so.
 */

const PHARMA_ENDINGS = [
  'zole', 'sartan', 'pril', 'nib', 'mab', 'vir', 'statin', 'mycin',
  'parin', 'olol', 'pam', 'pram', 'cillin', 'ide', 'ium',
]

const FANTASY_MARKERS = /['’]|(.)\1\1|zz|xx|yx|zx|qx|aeae/i

/** Assess how readily a synthesised word could enter everyday speech. */
export function assessAdoption(
  word: string,
  genome: WordGenome,
  pronunciation: PronunciationRating[],
): SpeechAdoption {
  const w = normalise(word).replace(/[^a-zë-ü]/gi, '')
  const len = w.length
  const clusters = awkwardClusters(w)
  const last = w[w.length - 1] ?? ''

  // 1) Pronunciation (20) — how easily it's said on first sight.
  const pron = clamp01(genome.pronounceability - clusters * 0.15)
  const cPron = Math.round(pron * 20)

  // 2) Memorability (20) — how well it sticks after one hearing.
  const cMem = Math.round(genome.memorability * 20)

  // 3) Sentence fit (20) — drops into an ordinary sentence without friction.
  const lengthFit = len <= 8 ? 1 : Math.max(0.4, 1 - (len - 8) * 0.12)
  const cFit = Math.round((genome.pronounceability * 0.5 + lengthFit * 0.5) * 20)

  // 4) Morphological flexibility (15) — bends into natural derived forms.
  let morph = isVowel(last) ? 1 : 'lrnsm'.includes(last) ? 0.8 : 0.55
  if (len > 9) morph -= 0.15
  const cMorph = Math.round(clamp01(morph) * 15)

  // 5) Cross-language stability (15) — reads consistently across languages.
  const avgStars = pronunciation.length
    ? pronunciation.reduce((s, r) => s + r.stars, 0) / pronunciation.length / 5
    : 0.6
  const ambiguous = (w.match(/[jxwcq]/g)?.length ?? 0) + (w.match(/th/g)?.length ?? 0)
  const cCross = Math.round(clamp01(avgStars - Math.min(0.4, ambiguous * 0.1)) * 15)

  // 6) Collision & resemblance risk (10) — not a drug / brand / fantasy trope.
  const looksPharma = PHARMA_ENDINGS.some((s) => w.endsWith(s))
  const looksFantasy = FANTASY_MARKERS.test(word)
  const tooLong = len > 9
  const nearKnown = genome.uniqueness < 0.5
  let risk = 10
  if (looksPharma) risk -= 4
  if (looksFantasy) risk -= 3
  if (tooLong) risk -= 2
  if (nearKnown) risk -= 3
  const cRisk = Math.max(0, risk)

  const components: AdoptionComponent[] = [
    { label: 'Pronunciation', score: cPron, max: 20 },
    { label: 'Memorability', score: cMem, max: 20 },
    { label: 'Sentence fit', score: cFit, max: 20 },
    { label: 'Morphological flexibility', score: cMorph, max: 15 },
    { label: 'Cross-language stability', score: cCross, max: 15 },
    { label: 'Collision resistance', score: cRisk, max: 10 },
  ]
  const total = components.reduce((s, c) => s + c.score, 0)

  const band: SpeechAdoption['band'] =
    total >= 82 ? 'Exceptional' : total >= 66 ? 'High' : total >= 50 ? 'Moderate' : 'Low'

  const strengths: string[] = []
  if (cPron >= 16) strengths.push('Easy to pronounce on first sight')
  if (cMem >= 15) strengths.push('Sticks after one hearing')
  if (cFit >= 15) strengths.push('Drops cleanly into a sentence')
  if (cMorph >= 12) strengths.push('Bends into natural derived forms')
  if (cCross >= 11) strengths.push('Reads consistently across languages')
  if (cRisk >= 9) strengths.push("Doesn't collide with drugs, brands or fantasy tropes")

  const risks: string[] = []
  if (looksPharma) risks.push('May read like a medical or drug name')
  if (looksFantasy) risks.push('Leans slightly fantasy-flavoured')
  if (tooLong) risks.push('A little long for casual speech')
  if (ambiguous >= 2) risks.push('Pronunciation may drift across languages')
  if (nearKnown) risks.push('Close to an existing word — worth a collision check')
  if (cMorph <= 8) risks.push('Hard to form natural derived words')

  return { band, score: total, components, strengths, risks }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
