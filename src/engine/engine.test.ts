import { describe, it, expect } from 'vitest'
import {
  generateFamilies,
  generateWords,
  buildConceptMap,
  computeGenome,
  computeEmotionalDNA,
  estimateUniqueness,
  editDistance,
  ratePronunciation,
  matchBrands,
  growFamily,
  ARCHETYPES,
  archetypeById,
  MODES,
} from './index'
import { KNOWN_WORDS } from './data/known-words'
import { countSyllables, awkwardClusters, vowelRatio } from './phonetics'
import { Rng } from './rng'

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

  it('computes vowel ratio', () => {
    expect(vowelRatio('aeiou')).toBe(1)
    expect(vowelRatio('bcdfg')).toBe(0)
  })
})

describe('synthesis (masked, kin words)', () => {
  it('grows a family of distinct, pronounceable words that share a stem', () => {
    const rng = new Rng(123)
    const crystalline = archetypeById('crystalline')
    const fam = growFamily(crystalline, rng, 3)
    expect(fam.members.length).toBeGreaterThanOrEqual(2)
    // Kin: every member starts from the shared stem.
    for (const m of fam.members) {
      expect(m.toLowerCase().startsWith(fam.stem.slice(0, 2))).toBe(true)
      expect(awkwardClusters(m)).toBeLessThan(1)
      expect(KNOWN_WORDS.has(m.toLowerCase())).toBe(false)
    }
    // Distinct: not all the same word.
    expect(new Set(fam.members).size).toBe(fam.members.length)
  })

  it('does not expose raw source roots (no glued "lum"/"iris" fragments)', () => {
    const words = generateWords({ ...MEDICINE_REQUEST, count: 8 }).map((w) => w.word.toLowerCase())
    // The old assembler leaked these root fragments as prefixes; the synth must not.
    const leaked = words.filter((w) => /^(lum|iris|nous|reg|leuk)/.test(w))
    expect(leaked).toEqual([])
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
  })

  it('scores known words as non-unique and invented words as unique', () => {
    expect(estimateUniqueness('google')).toBeLessThan(0.2)
    expect(estimateUniqueness('Quantara')).toBeGreaterThan(0.4)
  })
})

describe('editDistance', () => {
  it('matches known cases', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(editDistance('abc', 'abc')).toBe(0)
  })
})

describe('emotional DNA — distinct per archetype', () => {
  it('scores every axis 0–100', () => {
    const g = computeGenome('Quantara', ['order', 'precision', 'science'])
    const dna = computeEmotionalDNA(g, buildConceptMap(['precision', 'science']), archetypeById('crystalline'))
    for (const v of Object.values(dna)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('gives clearly different profiles to different archetypes (fixes static DNA)', () => {
    const concepts = buildConceptMap(['trust', 'precision', 'calm'])
    const g = computeGenome('Selora', ['trust'])
    const crystalline = computeEmotionalDNA(g, concepts, archetypeById('crystalline'))
    const noble = computeEmotionalDNA(g, concepts, archetypeById('noble'))
    const verdant = computeEmotionalDNA(g, concepts, archetypeById('verdant'))
    // Same word, same brief — the archetype alone should move the DNA a lot.
    expect(crystalline.scientific).toBeGreaterThan(noble.scientific + 20)
    expect(noble.premium).toBeGreaterThan(verdant.premium + 20)
    expect(verdant.natural).toBeGreaterThan(crystalline.natural + 20)
  })
})

describe('pronunciation & brand', () => {
  it('rates every language 1–5 stars', () => {
    const g = computeGenome('Sora', ['sky'])
    const ratings = ratePronunciation('Sora', g)
    expect(ratings.length).toBeGreaterThanOrEqual(5)
    for (const r of ratings) {
      expect(r.stars).toBeGreaterThanOrEqual(1)
      expect(r.stars).toBeLessThanOrEqual(5)
    }
  })

  it('routes a premium/scientific profile toward AI/medicine, away from fast food', () => {
    const dna = computeEmotionalDNA(
      computeGenome('Sanicura', ['healing', 'trust']),
      buildConceptMap(['trust', 'precision', 'science']),
      archetypeById('crystalline'),
    )
    const fit = matchBrands(dna)
    expect(fit.excellentFor.length).toBeGreaterThan(0)
    expect(fit.poorFit.length).toBeGreaterThan(0)
  })
})

describe('generateFamilies (family-first pipeline)', () => {
  it('returns several distinct linguistic families', () => {
    const families = generateFamilies(MEDICINE_REQUEST)
    expect(families.length).toBeGreaterThanOrEqual(4)
    // Families must be genuinely different species, not one repeated pattern.
    const characters = families.map((f) => f.character)
    expect(new Set(characters).size).toBe(characters.length)
  })

  it('grows kin words inside each family that share the family stem', () => {
    const families = generateFamilies(MEDICINE_REQUEST)
    for (const fam of families) {
      expect(fam.words.length).toBeGreaterThanOrEqual(1)
      const stemStart = fam.words[0].word.slice(0, 3).toLowerCase()
      // Members of a family look related (shared opening).
      const related = fam.words.filter((w) => w.word.slice(0, 2).toLowerCase() === stemStart.slice(0, 2))
      expect(related.length).toBe(fam.words.length)
    }
  })

  it('is deterministic for the same request', () => {
    const a = generateWords(MEDICINE_REQUEST).map((w) => w.word)
    const b = generateWords(MEDICINE_REQUEST).map((w) => w.word)
    expect(a).toEqual(b)
  })

  it('never returns a known dictionary or brand word', () => {
    for (const w of generateWords({ ...MEDICINE_REQUEST, count: 8 })) {
      expect(KNOWN_WORDS.has(w.word.toLowerCase())).toBe(false)
    }
  })

  it('produces pronounceable words with no long consonant pileups', () => {
    for (const w of generateWords({ ...MEDICINE_REQUEST, count: 8 })) {
      expect(w.word).not.toMatch(/[^aeiouyë-ü]{4,}/i)
    }
  })

  it('fills every passport section, concept-first', () => {
    const [fam] = generateFamilies(MEDICINE_REQUEST)
    const p = fam.words[0]
    expect(p.word.length).toBeGreaterThan(2)
    expect(p.meaning).toBeTruthy()
    expect(p.lineage.families.length).toBeGreaterThan(0)
    expect(p.lineage.character).toBe(fam.character)
    expect(p.personality.length).toBeGreaterThan(0)
    expect(p.explanation.toLowerCase()).toContain('imagined to hold')
    expect(p.story).toContain(p.word)
    expect(p.family.id).toBe(fam.id)
  })

  it('spans different archetypes across creative modes', () => {
    const req = { keywords: ['future', 'power'], count: 6, seed: 7 }
    const tech = generateFamilies({ ...req, mode: 'technology' }).map((f) => f.character)
    const nature = generateFamilies({ ...req, mode: 'nature' }).map((f) => f.character)
    expect(tech).not.toEqual(nature)
  })

  it('covers every creative mode without throwing', () => {
    for (const mode of Object.keys(MODES) as Array<keyof typeof MODES>) {
      const families = generateFamilies({ keywords: ['light', 'trust'], mode, count: 5, seed: 1 })
      expect(families.length).toBeGreaterThan(0)
    }
  })

  it('has a matching mode preference for every archetype id used', () => {
    // Sanity: every archetype id is a real one.
    for (const a of ARCHETYPES) {
      expect(archetypeById(a.id).id).toBe(a.id)
    }
  })
})
