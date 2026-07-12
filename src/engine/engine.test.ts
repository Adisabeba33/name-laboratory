import { describe, it, expect } from 'vitest'
import {
  generateWords,
  buildConceptMap,
  computeGenome,
  computeEmotionalDNA,
  estimateUniqueness,
  editDistance,
  ratePronunciation,
  matchBrands,
  MODES,
} from './index'
import { KNOWN_WORDS } from './data/known-words'
import { countSyllables, pronounceability, vowelRatio } from './phonetics'

const MEDICINE_REQUEST = {
  brief: 'A premium AI company focused on medicine',
  keywords: ['trust', 'intelligence', 'calm', 'precision', 'future'],
  mode: 'medical' as const,
  count: 6,
}

describe('concept mapping (Meaning → Concept)', () => {
  it('expands keywords into a weighted concept map', () => {
    const map = buildConceptMap(['trust', 'precision'])
    expect(map.trust).toBeGreaterThan(0)
    expect(map.precision).toBeGreaterThan(0)
  })

  it('normalises so the top concept is 1', () => {
    const map = buildConceptMap(['luxury', 'trust', 'calm'])
    expect(Math.max(...Object.values(map))).toBeCloseTo(1)
  })

  it('handles simple inflections via stemming', () => {
    const map = buildConceptMap(['healing'])
    const map2 = buildConceptMap(['heal'])
    expect(map.healing).toBeGreaterThan(0)
    expect(map2.healing).toBeGreaterThan(0)
  })

  it('falls back to a default concept for unknown input', () => {
    const map = buildConceptMap(['zzqqxx'])
    expect(Object.keys(map).length).toBeGreaterThan(0)
  })
})

describe('phonetics', () => {
  it('counts vowel groups as syllables', () => {
    expect(countSyllables('quantara')).toBe(3)
    expect(countSyllables('sora')).toBe(2)
    expect(countSyllables('a')).toBe(1)
  })

  it('rates open, alternating words as easy to pronounce', () => {
    expect(pronounceability('sanara')).toBeGreaterThan(pronounceability('sthrkxvn'))
  })

  it('computes vowel ratio', () => {
    expect(vowelRatio('aeiou')).toBe(1)
    expect(vowelRatio('bcdfg')).toBe(0)
  })
})

describe('genome (measurable genetic code)', () => {
  it('produces every attribute in range', () => {
    const g = computeGenome('Quantara', ['order', 'elevation'])
    for (const key of ['vowelRatio', 'rhythm', 'pronounceability', 'uniqueness'] as const) {
      expect(g[key]).toBeGreaterThanOrEqual(0)
      expect(g[key]).toBeLessThanOrEqual(1)
    }
    expect(g.syllables).toBe(3)
    expect(g.length).toBe(8)
  })

  it('scores known words as non-unique', () => {
    expect(estimateUniqueness('google')).toBeLessThan(0.2)
    expect(estimateUniqueness('nova')).toBeLessThan(0.2)
  })

  it('scores invented words as highly unique', () => {
    expect(estimateUniqueness('Quantara')).toBeGreaterThan(0.4)
  })
})

describe('editDistance', () => {
  it('matches known cases', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(editDistance('abc', 'abc')).toBe(0)
    expect(editDistance('', 'abc')).toBe(3)
  })
})

describe('emotional DNA (Emotional Identity)', () => {
  it('scores every axis 0–100', () => {
    const g = computeGenome('Quantara', ['order', 'precision', 'science'])
    const dna = computeEmotionalDNA(g, buildConceptMap(['precision', 'science']), 'scientific')
    for (const v of Object.values(dna)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('makes trust-led briefs score trustworthy highly', () => {
    const g = computeGenome('Verasol', ['trust', 'light'])
    const dna = computeEmotionalDNA(g, buildConceptMap(['trust', 'calm']), 'medical')
    expect(dna.trustworthy).toBeGreaterThan(50)
  })
})

describe('pronunciation', () => {
  it('gives every configured language a 1–5 star rating', () => {
    const g = computeGenome('Sora', ['sky'])
    const ratings = ratePronunciation('Sora', g)
    expect(ratings.length).toBeGreaterThanOrEqual(5)
    for (const r of ratings) {
      expect(r.stars).toBeGreaterThanOrEqual(1)
      expect(r.stars).toBeLessThanOrEqual(5)
    }
  })
})

describe('brand matching', () => {
  it('routes a premium/scientific profile toward AI/medicine, away from fast food', () => {
    const dna = computeEmotionalDNA(
      computeGenome('Sanicura', ['healing', 'trust', 'science']),
      buildConceptMap(['trust', 'precision', 'science']),
      'medical',
    )
    const fit = matchBrands(dna)
    expect(fit.excellentFor.length).toBeGreaterThan(0)
    expect(fit.poorFit.length).toBeGreaterThan(0)
    expect(fit.poorFit.join(' ').toLowerCase()).toMatch(/fast food|comedy|toys/)
  })
})

describe('generateWords (full pipeline)', () => {
  it('returns the requested number of passports', () => {
    const words = generateWords(MEDICINE_REQUEST)
    expect(words.length).toBe(6)
  })

  it('is deterministic for the same request', () => {
    const a = generateWords(MEDICINE_REQUEST).map((w) => w.word)
    const b = generateWords(MEDICINE_REQUEST).map((w) => w.word)
    expect(a).toEqual(b)
  })

  it('never returns a known dictionary or brand word', () => {
    const words = generateWords({ ...MEDICINE_REQUEST, count: 12 })
    for (const w of words) {
      expect(KNOWN_WORDS.has(w.word.toLowerCase())).toBe(false)
    }
  })

  it('produces pronounceable words (no long consonant pileups)', () => {
    const words = generateWords({ ...MEDICINE_REQUEST, count: 12 })
    for (const w of words) {
      expect(w.genome.pronounceability).toBeGreaterThan(0.4)
      expect(w.word).not.toMatch(/[^aeiouyë-ü]{4,}/i)
    }
  })

  it('fills every passport section', () => {
    const [passport] = generateWords(MEDICINE_REQUEST)
    expect(passport.word.length).toBeGreaterThan(2)
    expect(passport.meaning).toBeTruthy()
    expect(passport.origin.roots.length).toBe(2)
    expect(passport.personality.length).toBeGreaterThan(0)
    expect(passport.pronunciation.length).toBeGreaterThan(0)
    expect(passport.difficulty.length).toBe(3)
    expect(passport.story).toContain(passport.word)
    expect(passport.explanation).toBeTruthy()
  })

  it('respects the requested creative mode families', () => {
    const words = generateWords({
      keywords: ['calm', 'nature'],
      mode: 'japanese',
      count: 6,
      seed: 42,
    })
    expect(words.length).toBeGreaterThan(0)
    // Japanese mode favours Japanese roots; at least one should surface.
    const families = words.flatMap((w) => w.origin.roots.map((r) => r.family))
    expect(families).toContain('japanese')
  })

  it('varies output across different creative modes', () => {
    const req = { keywords: ['future', 'power'], count: 6, seed: 7 }
    const tech = generateWords({ ...req, mode: 'technology' }).map((w) => w.word)
    const luxury = generateWords({ ...req, mode: 'luxury' }).map((w) => w.word)
    expect(tech).not.toEqual(luxury)
  })

  it('covers every creative mode without throwing', () => {
    for (const mode of Object.keys(MODES) as Array<keyof typeof MODES>) {
      const words = generateWords({ keywords: ['light', 'trust'], mode, count: 4, seed: 1 })
      expect(words.length).toBeGreaterThan(0)
    }
  })
})
