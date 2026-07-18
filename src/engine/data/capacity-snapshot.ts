import type { CapacityEstimate } from '../capacity'

/**
 * Committed lexical-capacity snapshot — the honest, reproducible answer to
 * "how many adequate words can the engine coin?".
 *
 * These are not decorative figures: they are the exact output of
 * `estimateCapacity(CAPACITY_SEEDS, CAPACITY_SPEAKABILITY)` on this engine. The
 * UI reads this snapshot (running the measurement live would take ~15s), and
 * `capacity.bench.test.ts` recomputes it and asserts an exact match — so if the
 * synthesiser, phonotactics or naturalness model change, this file must be
 * regenerated or the benchmark fails. That keeps the number true, not stale.
 *
 * To regenerate after an intentional engine change:
 *   npx tsx -e "import {estimateCapacity} from './src/engine/capacity'; \
 *     console.log(JSON.stringify(estimateCapacity(800), null, 2))"
 * then paste the result below.
 */
export const CAPACITY_SEEDS = 800
export const CAPACITY_SPEAKABILITY = 0.7

export const CAPACITY: CapacityEstimate = {
  seeds: 800,
  speakability: 0.7,
  languages: 12,
  uniqueForms: 834963,
  adequate: 701047,
  byBand: {
    Inevitable: 560540,
    Believable: 140507,
    Plausible: 76465,
    Fabricated: 57451,
  },
  distinctSkeletons: 146110,
  perLanguage: [
    { name: 'Verdant', count: 151598 },
    { name: 'Liquid', count: 117269 },
    { name: 'Noble', count: 100226 },
    { name: 'Ethereal', count: 84869 },
    { name: 'Phoenix', count: 81415 },
    { name: 'Ancient', count: 51482 },
    { name: 'Chrysalis', count: 50046 },
    { name: 'Solar', count: 46997 },
    { name: 'Earthen', count: 46972 },
    { name: 'Obsidian', count: 46390 },
    { name: 'Ashen', count: 44522 },
    { name: 'Crystalline', count: 36932 },
  ],
  newInLastFifth: 149132,
  stillGrowing: true,
}
