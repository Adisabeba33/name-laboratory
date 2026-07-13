import { describe, it, expect } from 'vitest'
import {
  runLaboratory,
  analyzeMeaning,
  focusConcepts,
  generateFamilies,
  generateWords,
  buildConceptMap,
  computeGenome,
  computeEmotionalDNA,
  computeLanguageGenome,
  estimateUniqueness,
  editDistance,
  ratePronunciation,
  assessAdoption,
  evolveWord,
  EVOLVE_DIRECTIONS,
  matchBrands,
  speakNative,
  LANGUAGES,
  languageById,
  MODES,
} from './index'
import { KNOWN_WORDS } from './data/known-words'
import {
  countSyllables,
  awkwardClusters,
  vowelRatio,
  longestVowelRun,
  pronounceability,
  speakabilityBand,
} from './phonetics'
import { pronounce } from './pronounce'
import { translitRu } from './translit'
import { Rng } from './rng'

const MEDICINE_REQUEST = {
  brief: 'A premium AI company focused on medicine',
  keywords: ['trust', 'intelligence', 'calm', 'precision', 'future'],
  mode: 'medical' as const,
  count: 6,
}

describe('Meaning Engine — analysis', () => {
  const METAMORPHOSIS =
    'A word for the feeling of becoming someone completely different after surviving something that should have destroyed you.'

  it('reads the deep meaning, not surface keywords', () => {
    const a = analyzeMeaning([], METAMORPHOSIS)
    // The old engine grabbed creation/light/energy; the meaning engine must not.
    const top = Object.entries(a.concepts).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([c]) => c)
    expect(top).toContain('survival')
    expect(top).toContain('transformation')
    expect(top).toContain('destruction')
    expect((a.concepts.creation ?? 0)).toBeLessThan(a.concepts.transformation ?? 0)
  })

  it('recognises the metamorphosis theme and interprets it', () => {
    const a = analyzeMeaning([], METAMORPHOSIS)
    expect(a.theme).toBe('metamorphosis')
    expect(a.interpretation.toLowerCase()).toContain('transformation')
    expect(a.interpretationRu.length).toBeGreaterThan(20)
    expect(a.hiddenConcepts.length).toBeGreaterThan(3)
    expect(a.hiddenConcepts.every((h) => h.en && h.ru)).toBe(true)
    expect(a.network.length).toBeGreaterThan(3)
  })

  it('names the semantic tensions the concept lives between', () => {
    const a = analyzeMeaning([], METAMORPHOSIS)
    expect(a.tensions.length).toBeGreaterThan(0)
    for (const t of a.tensions) {
      expect(t.a && t.b && t.note).toBeTruthy()
      expect(t.aRu && t.bRu && t.noteRu).toBeTruthy()
    }
    // The metamorphosis theme pits survival against identity death.
    expect(a.tensions.some((t) => /identity/i.test(t.b) || /identity/i.test(t.a))).toBe(true)
  })

  it('offers distinct concept directions with concept emphasis', () => {
    const a = analyzeMeaning([], METAMORPHOSIS)
    expect(a.directions.length).toBeGreaterThanOrEqual(3)
    const ids = a.directions.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length) // ids are unique
    for (const d of a.directions) {
      expect(d.title && d.titleRu && d.definition && d.definitionRu).toBeTruthy()
      expect(Object.keys(d.emphasis).length).toBeGreaterThan(0)
    }
  })

  it('focusing on a direction re-weights the concept vector toward it', () => {
    const a = analyzeMeaning([], METAMORPHOSIS)
    const scar = a.directions.find((d) => /scar/i.test(d.title)) ?? a.directions[0]
    const focused = focusConcepts(a.concepts, a.directions, [scar.id])
    // The emphasised concept should rank at least as high as in the base vector.
    const lead = Object.entries(scar.emphasis).sort((x, y) => y[1] - x[1])[0][0] as keyof typeof focused
    expect((focused[lead] ?? 0)).toBeGreaterThanOrEqual((a.concepts[lead] ?? 0))
    // No selection returns the base vector unchanged.
    expect(focusConcepts(a.concepts, a.directions, [])).toBe(a.concepts)
  })

  it('steers language discovery toward the theme languages', () => {
    const { families } = runLaboratory({ keywords: [], brief: METAMORPHOSIS, count: 4 })
    const names = families.map((f) => f.character.toLowerCase())
    expect(names.some((n) => ['ashen', 'phoenix', 'obsidian', 'chrysalis'].includes(n))).toBe(true)
  })

  it('gives words meanings that reflect the interpreted concept', () => {
    const { families } = runLaboratory({ keywords: [], brief: METAMORPHOSIS, count: 4 })
    const meanings = families.flatMap((f) => f.words.map((w) => w.meaning.toLowerCase()))
    // At least one word should land on the emotional core, not a flat gloss.
    expect(meanings.some((m) => /burned away|entered the fire|should have ended|clears the ground/.test(m))).toBe(true)
  })

  it('falls back to a generic interpretation for a plain brief', () => {
    const a = analyzeMeaning(['trust', 'precision'], 'a premium fintech app')
    expect(a.theme).toBeUndefined()
    expect(a.interpretation.length).toBeGreaterThan(10)
    expect(a.network.length).toBeGreaterThan(0)
  })
})

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
    // Across several languages and seeds, the words of one language must never
    // read as suffix-variations of one root: each gets its own 3-letter prefix.
    for (const id of ['crystalline', 'liquid', 'ashen', 'obsidian', 'noble']) {
      for (const seed of [7, 42, 99]) {
        const vocab = speakNative(languageById(id), new Rng(seed), 3)
        const prefixes = new Set(vocab.words.map((w) => w.slice(0, 3).toLowerCase()))
        expect(prefixes.size).toBe(vocab.words.length)
        // And no two words share a long common stem.
        for (let i = 0; i < vocab.words.length; i++) {
          for (let j = i + 1; j < vocab.words.length; j++) {
            const a = vocab.words[i].toLowerCase()
            const b = vocab.words[j].toLowerCase()
            let p = 0
            while (p < a.length && p < b.length && a[p] === b[p]) p++
            expect(p).toBeLessThan(3)
          }
        }
      }
    }
  })

  it('does not expose raw source-root fragments', () => {
    const words = generateWords({ ...MEDICINE_REQUEST, count: 8 }).map((w) => w.word.toLowerCase())
    expect(words.filter((w) => /^(lum|iris|nous|reg|leuk)/.test(w))).toEqual([])
  })
})

describe('speakability — words that stay sayable', () => {
  const LANGS = ['crystalline', 'liquid', 'ancient', 'noble', 'earthen', 'ashen']

  it('keeps default words clear of vowel walls and spell-length', () => {
    for (const id of LANGS) {
      for (const seed of [7, 42, 99]) {
        const vocab = speakNative(languageById(id), new Rng(seed), 3)
        for (const w of vocab.words) {
          expect(longestVowelRun(w)).toBeLessThanOrEqual(2)
          expect(countSyllables(w)).toBeLessThanOrEqual(3)
          expect(w.length).toBeLessThanOrEqual(9)
          expect(pronounceability(w)).toBeGreaterThanOrEqual(0.5)
        }
      }
    }
  })

  it('a strictly-speakable dial beats an ornate one on average', () => {
    const avg = (n: number) => {
      let sum = 0
      let k = 0
      for (const id of LANGS) {
        for (const seed of [3, 11, 23]) {
          for (const w of speakNative(languageById(id), new Rng(seed), 3, n).words) {
            sum += pronounceability(w)
            k++
          }
        }
      }
      return sum / k
    }
    expect(avg(1)).toBeGreaterThan(avg(0))
  })

  it('stays deterministic for a given seed and dial', () => {
    const a = speakNative(languageById('liquid'), new Rng(55), 3, 0.7).words
    const b = speakNative(languageById('liquid'), new Rng(55), 3, 0.7).words
    expect(a).toEqual(b)
  })

  it('maps words to honest bands and ships one on every passport', () => {
    expect(speakabilityBand('Moma')).toBe('Speakable')
    expect(speakabilityBand('Senis')).toBe('Speakable')
    // Long, many-syllable "incantation" shapes are flagged, not passed as sayable.
    expect(speakabilityBand('Kororoalux')).not.toBe('Speakable')
    expect(speakabilityBand('Kororoalongar')).toBe('Ornate') // length ≥ 11
    const words = generateWords({ ...MEDICINE_REQUEST, count: 5 })
    for (const w of words) {
      expect(['Speakable', 'Balanced', 'Ornate']).toContain(w.speakability)
    }
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

  it('writes a stress-marked spoken guide for a word', () => {
    // Even stress → penultimate syllable is the stressed (upper-cased) one.
    expect(pronounce('Eliaye', 'Even')).toBe('eh-LEE-AH-yeh')
    // Digraphs stay whole; ph→f; the stress moves with the pattern.
    expect(pronounce('Ophelith', 'Final')).toBe('oh-feh-LEETH')
    expect(pronounce('Ashka', 'Initial')).toBe('AHSH-kah')
    // Always hyphen-broken with exactly one upper-cased (stressed) syllable.
    for (const w of ['Sora', 'Quorven', 'Sanicura', 'Threnora']) {
      const g = pronounce(w, 'Even')
      expect(g).toMatch(/-/)
      expect(g.split('-').filter((s) => s === s.toUpperCase()).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('gives every generated word a pronunciation guide', () => {
    for (const fam of generateFamilies(MEDICINE_REQUEST)) {
      for (const w of fam.words) {
        expect(w.pronunciationGuide.length).toBeGreaterThan(0)
        expect(w.pronunciationGuide).toMatch(/[a-z]/i)
      }
    }
  })

  it('transliterates a word into readable Cyrillic', () => {
    expect(translitRu('Varethis')).toBe('варетис')
    // Only Cyrillic letters come out, and it is non-empty.
    for (const w of ['Korvain', 'Morakai', 'Threnora', 'Ophelith']) {
      expect(translitRu(w)).toMatch(/^[а-яё]+$/)
    }
  })

  it('gives every generated word a Cyrillic form and a usage slot', () => {
    for (const fam of generateFamilies(MEDICINE_REQUEST)) {
      for (const w of fam.words) {
        expect(w.transliteration).toMatch(/^[а-яё]+$/)
        expect(w.partOfSpeech.length).toBeGreaterThan(0)
        expect(Array.isArray(w.usage.en)).toBe(true)
        expect(Array.isArray(w.usage.ru)).toBe(true)
      }
    }
  })

  it('explains how each word was constructed (honestly)', () => {
    for (const fam of generateFamilies(MEDICINE_REQUEST)) {
      for (const w of fam.words) {
        expect(w.construction.syllables.length).toBeGreaterThan(0)
        expect(w.construction.syllables.join('')).toBe(w.word.toLowerCase())
        expect(w.construction.ideas.length).toBeGreaterThan(0)
        expect(w.construction.species).toBe(fam.character)
        expect(w.construction.families.length).toBeGreaterThan(0)
        // Honesty: never claims a part is borrowed from a real word.
        expect(w.construction.note).toMatch(/no part is copied/i)
      }
    }
  })

  it('assesses speech adoption with a band and a scored breakdown', () => {
    for (const fam of generateFamilies(MEDICINE_REQUEST)) {
      for (const w of fam.words) {
        const a = w.adoption
        expect(['Low', 'Moderate', 'High', 'Exceptional']).toContain(a.band)
        expect(a.score).toBeGreaterThanOrEqual(0)
        expect(a.score).toBeLessThanOrEqual(100)
        // Components sum to the total, and each stays within its own budget.
        const total = a.components.reduce((s, c) => s + c.score, 0)
        expect(total).toBe(a.score)
        for (const c of a.components) {
          expect(c.score).toBeGreaterThanOrEqual(0)
          expect(c.score).toBeLessThanOrEqual(c.max)
        }
      }
    }
  })

  it('evolves a word’s sound while preserving its concept', () => {
    const [fam] = generateFamilies(MEDICINE_REQUEST)
    const base = fam.words[0]
    const rng = new Rng(7)
    for (const d of EVOLVE_DIRECTIONS) {
      const step = evolveWord(base, d.id, rng)
      // The concept (meaning) is preserved verbatim.
      expect(step.passport.meaning).toBe(base.meaning)
      expect(step.passport.origin.lead).toBe(base.origin.lead)
      // The evolved word is a full, valid passport one generation on.
      expect(step.passport.word.length).toBeGreaterThanOrEqual(3)
      expect(step.passport.origin.generation).toBe(base.origin.generation + 1)
      expect(step.parentWord).toBe(base.word)
      expect(step.changes.length).toBeGreaterThan(0)
      expect(['High', 'Moderate', 'Low']).toContain(step.conceptPreservation)
    }
  })

  it('“harder” makes a word sharper than “softer” does', () => {
    const [fam] = generateFamilies(MEDICINE_REQUEST)
    const base = fam.words[0]
    const softer = evolveWord(base, 'softer', new Rng(3)).passport
    const harder = evolveWord(base, 'harder', new Rng(3)).passport
    expect(harder.genome.sharpness).toBeGreaterThanOrEqual(softer.genome.sharpness)
  })

  it('flags a drug-like word as a lower adoption risk than a clean one', () => {
    const clean = assessAdoption('Selora', computeGenome('Selora', ['trust']), ratePronunciation('Selora', computeGenome('Selora', ['trust'])))
    const pharma = assessAdoption('Vaxozole', computeGenome('Vaxozole', ['trust']), ratePronunciation('Vaxozole', computeGenome('Vaxozole', ['trust'])))
    const risk = (a: typeof clean) => a.components.find((c) => c.label === 'Collision resistance')!.score
    expect(risk(pharma)).toBeLessThan(risk(clean))
    expect(pharma.risks.join(' ')).toMatch(/drug|medical/i)
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
