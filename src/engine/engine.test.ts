import { describe, it, expect } from 'vitest'
import {
  generateFamilies,
  generateWords,
  buildConceptMap,
  computeGenome,
  computeEmotionalDNA,
  computeLanguageGenome,
  estimateUniqueness,
  editDistance,
  ratePronunciation,
  matchBrands,
  speakNative,
  LANGUAGES,
  languageById,
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
    expect(countSyllables('a')).toBe(1)
  })

  it('computes vowel ratio', () => {
    expect(vowelRatio('aeiou')).toBe(1)
    expect(vowelRatio('bcdfg')).toBe(0)
  })
})

describe('native synthesis (diverse speakers of one language)', () => {
  it('speaks distinct, pronounceable native words', () => {
    const rng = new Rng(123)
    const vocab = speakNative(languageById('crystalline'), rng, 3)
    expect(vocab.words.length).toBeGreaterThanOrEqual(2)
    expect(new Set(vocab.words).size).toBe(vocab.words.length)
    for (const w of vocab.words) {
      expect(awkwardClusters(w)).toBeLessThan(1)
      expect(KNOWN_WORDS.has(w.toLowerCase())).toBe(false)
      expect(w.length).toBeLessThanOrEqual(10)
    }
  })

  it('gives a language real internal diversity (not stem mutations)', () => {
    const rng = new Rng(7)
    const vocab = speakNative(languageById('liquid'), rng, 3)
    // Words should not all share the same 3-letter prefix (the old failure mode).
    const prefixes = new Set(vocab.words.map((w) => w.slice(0, 3).toLowerCase()))
    expect(prefixes.size).toBeGreaterThan(1)
  })

  it('does not expose raw source-root fragments', () => {
    const words = generateWords({ ...MEDICINE_REQUEST, count: 8 }).map((w) => w.word.toLowerCase())
    expect(words.filter((w) => /^(lum|iris|nous|reg|leuk)/.test(w))).toEqual([])
  })
})

describe('genome (measurable genetic code)', () => {
  it('produces attributes in range', () => {
    const g = computeGenome('Quantara', ['order', 'elevation'])
    for (const key of ['vowelRatio', 'rhythm', 'pronounceability', 'uniqueness'] as const) {
      expect(g[key]).toBeGreaterThanOrEqual(0)
      expect(g[key]).toBeLessThanOrEqual(1)
    }
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

describe('Language Genome', () => {
  it('describes the language, with sensible fields', () => {
    const rng = new Rng(1)
    const lang = languageById('crystalline')
    const vocab = speakNative(lang, rng, 3)
    const genome = computeLanguageGenome(lang, vocab.words)
    expect(genome.cadence).toBe('Short')
    expect(genome.stressPattern).toBe('Initial')
    expect(genome.preferredEndings.length).toBe(3)
    expect(genome.preferredEndings[0].startsWith('-')).toBe(true)
    // Low-entropy language reads as highly symmetric.
    expect(genome.visualSymmetry).toBeGreaterThan(80)
  })
})

describe('emotional DNA — distinct per language', () => {
  it('scores every axis 0–100', () => {
    const g = computeGenome('Quantara', ['order', 'precision', 'science'])
    const dna = computeEmotionalDNA(g, buildConceptMap(['precision', 'science']), languageById('crystalline'))
    for (const v of Object.values(dna)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('gives clearly different profiles to different languages', () => {
    const concepts = buildConceptMap(['trust', 'precision', 'calm'])
    const g = computeGenome('Selora', ['trust'])
    const crystalline = computeEmotionalDNA(g, concepts, languageById('crystalline'))
    const noble = computeEmotionalDNA(g, concepts, languageById('noble'))
    const verdant = computeEmotionalDNA(g, concepts, languageById('verdant'))
    expect(crystalline.scientific).toBeGreaterThan(noble.scientific + 20)
    expect(noble.premium).toBeGreaterThan(verdant.premium + 20)
    expect(verdant.natural).toBeGreaterThan(crystalline.natural + 20)
  })
})

describe('pronunciation & brand', () => {
  it('rates every language 1–5 stars', () => {
    const ratings = ratePronunciation('Sora', computeGenome('Sora', ['sky']))
    expect(ratings.length).toBeGreaterThanOrEqual(5)
    for (const r of ratings) {
      expect(r.stars).toBeGreaterThanOrEqual(1)
      expect(r.stars).toBeLessThanOrEqual(5)
    }
  })

  it('routes a premium/scientific profile toward strong industries', () => {
    const dna = computeEmotionalDNA(
      computeGenome('Sanicura', ['healing', 'trust']),
      buildConceptMap(['trust', 'precision', 'science']),
      languageById('crystalline'),
    )
    const fit = matchBrands(dna)
    expect(fit.excellentFor.length).toBeGreaterThan(0)
    expect(fit.poorFit.length).toBeGreaterThan(0)
  })
})

describe('generateFamilies (discovering languages)', () => {
  it('discovers several distinct linguistic species', () => {
    const families = generateFamilies(MEDICINE_REQUEST)
    expect(families.length).toBeGreaterThanOrEqual(4)
    const names = families.map((f) => f.character)
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives every language a genome, description and native characteristics', () => {
    for (const fam of generateFamilies(MEDICINE_REQUEST)) {
      expect(fam.description.length).toBeGreaterThan(10)
      expect(fam.nativeCharacteristics.length).toBeGreaterThan(2)
      expect(fam.genome.preferredEndings.length).toBe(3)
      expect(fam.ancestry.length).toBeGreaterThan(0)
      expect(fam.words.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('gives every word an evolution profile that inherits its language', () => {
    const [fam] = generateFamilies(MEDICINE_REQUEST)
    fam.words.forEach((w, i) => {
      expect(w.evolution.parentLanguage).toBe(fam.character)
      expect(w.evolution.generation).toBe(i + 1)
      for (const key of ['mutation', 'visualBalance', 'originality', 'memorability', 'phoneticStability'] as const) {
        expect(w.evolution[key]).toBeGreaterThanOrEqual(0)
        expect(w.evolution[key]).toBeLessThanOrEqual(100)
      }
      expect(w.evolution.evolutionDistance).toBeGreaterThanOrEqual(0)
      expect(w.evolution.evolutionDistance).toBeLessThanOrEqual(1)
    })
    // Generation 1 is the canonical specimen: zero mutation.
    expect(fam.words[0].evolution.mutation).toBe(0)
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
    expect(p.meaning).toBeTruthy()
    expect(p.ancestry.families.length).toBeGreaterThan(0)
    expect(p.ancestry.character).toBe(fam.character)
    expect(p.explanation.toLowerCase()).toContain('imagined to hold')
    expect(p.story).toContain(p.word)
    expect(p.family.id).toBe(fam.id)
  })

  it('spans different languages across creative modes', () => {
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

  it('resolves every language id', () => {
    for (const l of LANGUAGES) expect(languageById(l.id).id).toBe(l.id)
  })
})
