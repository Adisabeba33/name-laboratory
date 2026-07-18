import { describe, it, expect } from 'vitest'
import { toRow, fromRow } from './lexicon-cloud'
import type { LexEntry } from './lexicon'

const entry: LexEntry = {
  id: 'varethis::becoming new after surviving',
  word: 'Varethis',
  transliteration: 'варетис',
  pronunciationGuide: 'vah-REH-tis',
  partOfSpeech: 'noun',
  meaning: 'a survival that reshapes you (переживание, что меняет тебя)',
  shortMeaning: 'reshaped by survival',
  usage: { en: ['I entered Varethis.'], ru: ['Я вошёл в варетис.'] },
  language: 'Ashen',
  adoptionBand: 'Strong',
  adoptionScore: 84,
  brief: 'becoming new after surviving',
  savedAt: '2026-07-18T00:00:00.000Z',
}

describe('cloud lexicon row mapping', () => {
  it('round-trips a LexEntry through the DB row shape', () => {
    const row = toRow(entry, 'user-123')
    expect(row.user_id).toBe('user-123')
    expect(row.entry_key).toBe(entry.id)
    const back = fromRow({ ...row, created_at: entry.savedAt })
    expect(back).toEqual(entry)
  })

  it('fromRow fills sane defaults for a sparse row', () => {
    const back = fromRow({
      entry_key: 'x::y',
      word: 'Xy',
      brief: 'y',
      // everything else missing
    } as never)
    expect(back.word).toBe('Xy')
    expect(back.usage).toEqual({ en: [], ru: [] })
    expect(back.partOfSpeech).toBe('noun')
    expect(back.id).toBe('x::y')
  })
})
