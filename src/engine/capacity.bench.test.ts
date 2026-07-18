import { describe, it, expect, beforeAll } from 'vitest'
import { estimateCapacity, type CapacityEstimate } from './capacity'
import { CAPACITY, CAPACITY_SEEDS, CAPACITY_SPEAKABILITY } from './data/capacity-snapshot'

/**
 * Capacity benchmark — the product claim ("this can underwrite a real language,
 * not a 2–3k demo") is only honest if it stays true as the engine evolves. So we
 * recompute the exact measurement and hold the engine to it.
 *
 * This run breeds hundreds of thousands of words, so it is the slow test in the
 * suite (~15s) — deliberately, because it is the one that proves the number.
 * If an intentional engine change moves the figures, regenerate the snapshot
 * (see capacity-snapshot.ts) rather than loosening the assertions.
 */
describe('lexical capacity', () => {
  let live: CapacityEstimate

  beforeAll(() => {
    live = estimateCapacity(CAPACITY_SEEDS, CAPACITY_SPEAKABILITY)
  }, 120_000)

  it('reproduces the committed snapshot exactly (drift guard)', () => {
    // Deterministic engine ⇒ identical numbers. A mismatch means the engine
    // changed and the snapshot (and the in-app Capacity block) must be updated.
    expect(live).toEqual(CAPACITY)
  })

  it('holds the internal invariants of the measurement', () => {
    const bandTotal =
      live.byBand.Inevitable + live.byBand.Believable + live.byBand.Plausible + live.byBand.Fabricated
    expect(bandTotal).toBe(live.uniqueForms)
    expect(live.adequate).toBe(live.byBand.Inevitable + live.byBand.Believable)
    expect(live.adequate).toBeLessThanOrEqual(live.uniqueForms)
    expect(live.distinctSkeletons).toBeLessThanOrEqual(live.adequate)
    expect(live.perLanguage).toHaveLength(live.languages)
    // per-language counts sum to at least the global (languages overlap little)
    const perLangSum = live.perLanguage.reduce((n, l) => n + l.count, 0)
    expect(perLangSum).toBeGreaterThanOrEqual(live.uniqueForms)
  })

  it('clears the "this is a language" bar with margin', () => {
    // A living language is ~50k words; a person actively uses ~20–35k. Even the
    // harsh distinctness floor (vowels collapsed) must clear 50k, and adequate
    // forms must clear it by a wide margin — at a sample that is still growing.
    expect(live.adequate).toBeGreaterThan(50_000)
    expect(live.distinctSkeletons).toBeGreaterThan(50_000)
    expect(live.stillGrowing).toBe(true)
  })
})
