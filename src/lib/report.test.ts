import { describe, it, expect } from 'vitest'
import { runLaboratory } from '../engine'
import { buildReport } from './report'

describe('buildReport', () => {
  const results = runLaboratory({
    brief: 'the quiet grief of outgrowing a friendship with no falling-out',
    keywords: [],
    count: 4,
    seed: 7,
  })

  it('produces a copyable report with every section and word', () => {
    const text = buildReport({
      brief: 'the quiet grief of outgrowing a friendship with no falling-out',
      results,
      gap: null,
      usedLLM: false,
      version: '9.9.9',
      stamp: '2026-07-14T00:00:00.000Z',
    })
    expect(text).toContain('# Word Laboratory — run report')
    expect(text).toContain('## Interpretation')
    expect(text).toContain('## Semantic gap search')
    expect(text).toContain('## Words')
    expect(text).toContain('v9.9.9')
    // Every discovered word appears in the report.
    for (const w of results.families.flatMap((f) => f.words)) {
      expect(text).toContain(w.word)
      expect(text).toContain(w.naturalness)
    }
  })

  it('notes when the gap search did not run', () => {
    const text = buildReport({ brief: 'x', results, gap: null, usedLLM: false })
    expect(text).toContain('Not run for this result')
  })
})
