import { describe, it, expect } from 'vitest'
import { findSimilarEntries, formSimilarity } from './dedupe'
import type { LexEntry } from './lexicon'

function entry(word: string, meaning: string, brief: string): LexEntry {
  return {
    id: `${word.toLowerCase()}::${brief.toLowerCase()}`,
    word,
    transliteration: '',
    pronunciationGuide: '',
    partOfSpeech: 'noun',
    meaning,
    shortMeaning: meaning,
    usage: { en: [], ru: [] },
    language: 'Ashen',
    adoptionBand: 'Strong',
    adoptionScore: 80,
    brief,
    savedAt: '2026-07-18T00:00:00.000Z',
  }
}

describe('lexicon de-duplication (proof of meaning)', () => {
  it('formSimilarity is 1 for identical and for homophones, low for unrelated', () => {
    expect(formSimilarity('Varethis', 'Varethis')).toBe(1)
    expect(formSimilarity('Kwik', 'Quick')).toBe(1) // phonetic key collision
    expect(formSimilarity('Varethis', 'Boneshimu')).toBeLessThan(0.4)
  })

  it('flags a near-identical FORM saved for a different concept', () => {
    const lex = [entry('Varethis', 'a survival that reshapes you', 'becoming someone new after surviving')]
    const hits = findSimilarEntries(
      { word: 'Varethas', meaningText: 'a bright morning feeling', brief: 'the joy of a fresh start' },
      lex,
    )
    expect(hits.length).toBe(1)
    expect(hits[0].kind).toBe('form')
  })

  it('flags the SAME IDEA under a different word across concepts', () => {
    const lex = [
      entry(
        'Soshunik',
        'the quiet ache of losing the childhood language you once thought in',
        'losing your first language',
      ),
    ]
    const hits = findSimilarEntries(
      {
        word: 'Zaruchim',
        meaningText: 'the quiet ache of losing the childhood language you once thought in',
        brief: 'no longer thinking in your childhood language',
      },
      lex,
    )
    expect(hits.length).toBe(1)
    expect(hits[0].kind === 'meaning' || hits[0].kind === 'both').toBe(true)
  })

  it('does NOT flag meaning overlap for words saved from the SAME prompt (variants)', () => {
    const brief = 'the ache of outgrowing a friendship'
    const lex = [entry('Broatha', 'the slow drift of a friendship fading', brief)]
    const hits = findSimilarEntries(
      { word: 'Kanirisar', meaningText: 'the slow drift of a friendship fading', brief },
      lex,
    )
    // Same concept → sibling variation, not a duplicate.
    expect(hits.length).toBe(0)
  })

  it('leaves a genuinely new, distinct word alone', () => {
    const lex = [entry('Varethis', 'a survival that reshapes you', 'becoming new after surviving')]
    const hits = findSimilarEntries(
      { word: 'Koaraha', meaningText: 'the warm anticipation before a journey', brief: 'the night before a trip' },
      lex,
    )
    expect(hits.length).toBe(0)
  })
})
