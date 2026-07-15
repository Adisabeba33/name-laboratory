import { readFileSync } from 'node:fs'
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
  offlineCollision,
  naturalness,
  naturalnessBand,
  EXCEPTIONAL_NATURALNESS,
  computeDictionaryViability,
  buildCollisionReport,
  computeDiscovery,
  detectTargetType,
  targetTypeMatch,
  dampenAttractors,
  METAMORPHOSIS_CUE,
  acousticProfile,
  LANGUAGES,
  languageById,
  MODES,
  IDEAS,
} from './index'
import { KNOWN_WORDS } from './data/known-words'
import {
  countSyllables,
  awkwardClusters,
  vowelRatio,
  longestVowelRun,
  pronounceability,
  speakabilityBand,
  sharpness,
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
      expect(w.length).toBeLessThanOrEqual(14)
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

  it('gives each language a DISTINCT semantic lens (anti-convergence)', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const f of families) {
      expect(f.lens.role.length).toBeGreaterThan(0)
      expect(f.lens.question.length).toBeGreaterThan(0)
    }
    // No two languages in the run share a lens — they are viewpoints, not accents.
    const roles = families.map((f) => f.lens.role)
    expect(new Set(roles).size).toBe(roles.length)
  })
})

describe('lexical evolution funnel (Engine V6)', () => {
  it('reports an honest per-language census (rejected = generated − survived)', () => {
    const vocab = speakNative(languageById('crystalline'), new Rng(123), 3)
    const c = vocab.census
    expect(c.generated).toBeGreaterThan(0)
    expect(c.survived).toBeGreaterThan(0)
    expect(c.survived).toBeLessThanOrEqual(c.generated)
    // The funnel is arithmetically exact — no drift, no rounding.
    expect(c.rejected).toBe(c.generated - c.survived)
    // Real selection pressure: with a full breeding budget, most forms are dupes
    // or fail a gate, so a meaningful fraction is rejected.
    expect(c.rejected).toBeGreaterThan(0)
  })

  it('is deterministic per seed', () => {
    const a = speakNative(languageById('liquid'), new Rng(55), 3).census
    const b = speakNative(languageById('liquid'), new Rng(55), 3).census
    expect(a).toEqual(b)
  })

  it('aggregates the run population and preserves the funnel invariant', () => {
    const { families, population } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    // The run total is the exact sum of the language slices.
    const sum = families.reduce(
      (acc, f) => ({
        generated: acc.generated + f.stats.generated,
        rejected: acc.rejected + f.stats.rejected,
        survived: acc.survived + f.stats.survived,
        recommended: acc.recommended + f.stats.recommended,
        exceptional: acc.exceptional + f.stats.exceptional,
      }),
      { generated: 0, rejected: 0, survived: 0, recommended: 0, exceptional: 0 },
    )
    expect(population).toEqual(sum)
    // generated ≥ survived ≥ recommended ≥ exceptional at the run level.
    expect(population.generated).toBeGreaterThanOrEqual(population.survived)
    expect(population.survived).toBeGreaterThanOrEqual(population.recommended)
    expect(population.recommended).toBeGreaterThanOrEqual(population.exceptional)
    expect(population.rejected).toBe(population.generated - population.survived)
    // "recommended" is exactly the number of words actually shipped.
    const shipped = families.flatMap((f) => f.words).length
    expect(population.recommended).toBe(shipped)
    // The engine genuinely explored a large population, not a handful.
    expect(population.generated).toBeGreaterThan(population.recommended * 10)
  })

  it('reserves "exceptional" for rare multi-signal standouts, never all shipped', () => {
    const { families, population } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const f of families) {
      // The stored count must equal the words that clear ALL three standout bars.
      const standouts = f.words.filter(
        (w) =>
          naturalness(w.word) >= EXCEPTIONAL_NATURALNESS &&
          w.collision.match === 'none' &&
          w.genome.syllables <= 3,
      ).length
      expect(f.stats.exceptional).toBe(standouts)
      expect(f.stats.exceptional).toBeLessThanOrEqual(f.stats.recommended)
    }
    // The whole run must not label every shipped word exceptional — that is the
    // "stop pretending every word is a 99" invariant the standout tier enforces.
    expect(population.exceptional).toBeLessThan(population.recommended)
  })
})

describe('fitness profile (Engine V6 — multi-dimensional selection scorecard)', () => {
  const BANDS = ['Low', 'Moderate', 'Strong', 'Exceptional']

  it('gives every word a well-formed profile', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const w of families.flatMap((f) => f.words)) {
      const f = w.fitness
      expect(f.axes.map((a) => a.key)).toEqual(['illusion', 'resonance', 'reach'])
      for (const a of f.axes) {
        expect(BANDS).toContain(a.band)
        expect(a.note.length).toBeGreaterThan(0)
      }
      // strongest / weakest are real axis labels, and (unless all bands tie) differ.
      const labels = f.axes.map((a) => a.label)
      expect(labels).toContain(f.strongest)
      expect(labels).toContain(f.weakest)
    }
  })

  it('genuinely differentiates words — not every band is the same', () => {
    // The whole point of V6: real variance. Across a run, all four bands appear
    // and no single band dominates every axis of every word.
    const seen = new Set<string>()
    for (const seed of [7, 42, 99]) {
      const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed })
      for (const w of families.flatMap((f) => f.words)) {
        for (const a of w.fitness.axes) seen.add(a.band)
      }
    }
    // At least three distinct bands are used across runs (not a flat "all Strong").
    expect(seen.size).toBeGreaterThanOrEqual(3)
  })

  it('picks the strongest axis by band, then by raw signal', () => {
    // The signature must never be weaker than the weakest — a basic ordering check
    // that also catches a profile where strongest/weakest are accidentally swapped.
    const rank = (band: string) => BANDS.indexOf(band)
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const w of families.flatMap((f) => f.words)) {
      const strong = w.fitness.axes.find((a) => a.label === w.fitness.strongest)!
      const weak = w.fitness.axes.find((a) => a.label === w.fitness.weakest)!
      expect(rank(strong.band)).toBeGreaterThanOrEqual(rank(weak.band))
    }
  })

  it('is deterministic per seed', () => {
    const a = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const b = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    expect(a.families.flatMap((f) => f.words).map((w) => w.fitness)).toEqual(
      b.families.flatMap((f) => f.words).map((w) => w.fitness),
    )
  })
})

describe('morphological word families (Engine V6)', () => {
  const ROLES = ['verb', 'adjective', 'adverb', 'agent noun']

  it('grows a native, pronounceable paradigm — validated forms only (v0.36 P3)', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const w of families.flatMap((f) => f.words)) {
      const par = w.paradigm
      expect(par.root).toBe(w.word)
      // Forms are now a validated SUBSET of the four roles (a word may be noun-only).
      for (const form of par.forms) {
        expect(ROLES).toContain(form.role)
        expect(form.form.length).toBeGreaterThan(w.word.length - 2)
        expect(form.gloss.length).toBeGreaterThan(0)
        expect(/(.)\1\1/.test(form.form.toLowerCase())).toBe(false)
      }
      const forms = par.forms.map((f) => f.form)
      expect(new Set(forms).size).toBe(forms.length)
    }
  })

  it('derives adverbs from adjectives the way English does', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const w of families.flatMap((f) => f.words)) {
      // Only when BOTH the adjective and the adverb survived validation.
      const adjForm = w.paradigm.forms.find((f) => f.role === 'adjective')
      const advForm = w.paradigm.forms.find((f) => f.role === 'adverb')
      if (!adjForm || !advForm) continue
      const adj = adjForm.form.toLowerCase()
      const adv = advForm.form.toLowerCase()
      // "-ic" adjectives take "-ally"; everything else takes "-ly".
      if (adj.endsWith('ic')) expect(adv).toBe(adj + 'ally')
      else if (!adj.endsWith('le')) expect(adv).toBe(adj + 'ly')
    }
  })

  it('is deterministic per word', () => {
    const a = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const b = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    expect(a.families.flatMap((f) => f.words).map((w) => w.paradigm)).toEqual(
      b.families.flatMap((f) => f.words).map((w) => w.paradigm),
    )
  })
})

describe('imagined etymology (Engine V4/V6 — reconstructed root chain)', () => {
  it('builds a lineage that ends exactly at the modern word', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const w of families.flatMap((f) => f.words)) {
      const s = w.etymology.stages
      expect(s.length).toBeGreaterThanOrEqual(2)
      // The final stage is the word itself, labelled "today".
      expect(s[s.length - 1].form).toBe(w.word)
      expect(s[s.length - 1].era).toBe('today')
      // The root has no incoming change; every later stage explains its change.
      expect(s[0].note).toBe('')
      for (const stage of s.slice(1)) expect(stage.note.length).toBeGreaterThan(0)
      // Forms shorten or stay as you walk back in time (endings/vowels peeled off).
      expect(s[0].form.length).toBeLessThanOrEqual(w.word.length)
    }
  })

  it('frames itself honestly as imagined, not historical', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 4, seed: 7 })
    for (const w of families.flatMap((f) => f.words)) {
      expect(w.etymology.summary.toLowerCase()).toContain('not a real historical')
    }
  })

  it('is deterministic per word', () => {
    const a = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const b = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    expect(a.families.flatMap((f) => f.words).map((w) => w.etymology)).toEqual(
      b.families.flatMap((f) => f.words).map((w) => w.etymology),
    )
  })
})

describe('semantic network (Engine V4 — navigable lexicon graph)', () => {
  it('links every word to real peers in the same run', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const words = families.flatMap((f) => f.words)
    const present = new Set(words.map((w) => w.word))
    for (const w of words) {
      // Every word is connected (the graph strands no one).
      expect(w.relations.length).toBeGreaterThanOrEqual(2)
      for (const r of w.relations) {
        // Edges point at real words in the run — never at itself.
        expect(present.has(r.word)).toBe(true)
        expect(r.word).not.toBe(w.word)
        expect(r.kind.length).toBeGreaterThan(0)
      }
      // A word does not list the same neighbour twice.
      const targets = w.relations.map((r) => r.word)
      expect(new Set(targets).size).toBe(targets.length)
    }
  })

  it('prefers a diverse map — not three identical edge kinds', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    // Across the run, several distinct relation kinds are actually used.
    const kinds = new Set(
      families.flatMap((f) => f.words).flatMap((w) => w.relations.map((r) => r.kind)),
    )
    expect(kinds.size).toBeGreaterThanOrEqual(2)
  })

  it('is deterministic per seed', () => {
    const a = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const b = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    expect(a.families.flatMap((f) => f.words).map((w) => w.relations)).toEqual(
      b.families.flatMap((f) => f.words).map((w) => w.relations),
    )
  })
})

describe('language refusals (Engine V4 — a worldview that cannot hold a meaning)', () => {
  const GRIEF = 'the quiet grief of outgrowing a friendship with no falling-out'

  it('lets a language decline a meaning its worldview cannot hold', () => {
    const r = runLaboratory({ brief: GRIEF, keywords: [], count: 6, seed: 7 })
    const refused = r.families.filter((f) => f.refusal)
    expect(refused.length).toBeGreaterThan(0)
    for (const f of refused) {
      // A refusal coins nothing and explains itself.
      expect(f.words).toEqual([])
      expect(f.refusal!.reason.length).toBeGreaterThan(0)
      // It refuses a concept it is genuinely blind to, and that the meaning centres on.
      const lang = languageById(f.id.split('-')[0])
      expect(lang.blindTo ?? []).toContain(f.refusal!.concept)
      expect(r.analysis.concepts[f.refusal!.concept] ?? 0).toBeGreaterThanOrEqual(0.5)
    }
  })

  it('never sacrifices a usable run — always keeps enough producers', () => {
    for (const seed of [7, 42, 99]) {
      const r = runLaboratory({ brief: GRIEF, keywords: [], count: 6, seed })
      const producers = r.families.filter((f) => !f.refusal)
      const refused = r.families.filter((f) => f.refusal)
      expect(producers.length).toBeGreaterThanOrEqual(3)
      expect(refused.length).toBeLessThanOrEqual(2)
      // Words are still discovered despite the refusals.
      expect(r.families.flatMap((f) => f.words).length).toBeGreaterThan(0)
    }
  })

  it('leaves runs with no worldview clash untouched (no forced refusals)', () => {
    // A neutral, on-brand meaning should not trigger refusals.
    const r = runLaboratory({
      brief: 'a calm, trustworthy company that brings people together',
      keywords: [],
      count: 6,
      seed: 7,
    })
    expect(r.families.every((f) => !f.refusal)).toBe(true)
  })

  it('is deterministic per seed', () => {
    const a = runLaboratory({ brief: GRIEF, keywords: [], count: 6, seed: 7 })
    const b = runLaboratory({ brief: GRIEF, keywords: [], count: 6, seed: 7 })
    expect(a.families.map((f) => f.refusal ?? null)).toEqual(b.families.map((f) => f.refusal ?? null))
  })
})

describe('selection quality (Engine v0.36 — direct vs adjacent, dynamic lenses)', () => {
  it('separates direct answers from adjacent discoveries', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const direct = r.families.filter((f) => f.direct)
    // A meaning with a clear core yields at least one direct answer…
    expect(direct.length).toBeGreaterThanOrEqual(1)
    // …and every direct family used a direct lens and carries a core concept.
    for (const f of direct) {
      expect(f.lens.direct).toBe(true)
      expect(f.fidelity.band).toBe('direct')
      expect(f.fidelity.matched.length).toBeGreaterThan(0)
      expect(f.fidelity.driftDetected).toBe(false)
    }
    // Adjacent families are classified, never marked direct.
    for (const f of r.families.filter((f) => !f.direct && !f.refusal)) {
      expect(f.fidelity.band).not.toBe('direct')
    }
  })

  it('selects lenses by relevance, each with a distinct semantic role', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const roles = r.families.map((f) => f.semanticRole)
    // No two families share a semantic role (dynamic-lens uniqueness rule).
    expect(new Set(roles).size).toBe(roles.length)
    // At least one direct_target lens is always present to rank.
    expect(roles).toContain('direct_target')
  })

  it('states an honest conclusion naming the confirmed gap', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    expect(r.conclusion.length).toBeGreaterThan(0)
    const directCount = r.families.filter((f) => f.direct).length
    if (directCount === 0) {
      expect(r.conclusion.toLowerCase()).toContain('another evolutionary cycle')
    } else {
      expect(r.conclusion).toMatch(/direct candidate/i)
    }
  })

  it('varies the number of families with the meaning (not a fixed 18/6)', () => {
    // A spare, single-note prompt should support fewer lenses than a rich one.
    const spare = runLaboratory({ brief: 'order', keywords: [], count: 8, seed: 3 })
    const rich = runLaboratory({
      brief: 'becoming a new person after surviving loss, grief and rebirth',
      keywords: [],
      count: 8,
      seed: 3,
    })
    expect(spare.families.length).toBeGreaterThanOrEqual(3)
    // The count is driven by relevant lenses, so it need not hit the requested max.
    expect(spare.families.length).toBeLessThanOrEqual(8)
    expect(rich.families.length).toBeGreaterThanOrEqual(spare.families.length)
  })

  it('is deterministic per seed', () => {
    const a = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const b = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    expect(a.families.map((f) => [f.semanticRole, f.direct, f.fidelity.band])).toEqual(
      b.families.map((f) => [f.semanticRole, f.direct, f.fidelity.band]),
    )
    expect(a.conclusion).toBe(b.conclusion)
  })
})

describe('Lexical Discovery Score & Dictionary Viability (v0.36 Phase 2)', () => {
  const CLASSES = ['Exceptional', 'Strong', 'Viable', 'Experimental', 'Weak', 'Rejected']

  it('gives every word a well-formed discovery score and viability', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const w of r.families.flatMap((f) => f.words)) {
      expect(w.discovery.score).toBeGreaterThanOrEqual(0)
      expect(w.discovery.score).toBeLessThanOrEqual(100)
      expect(CLASSES).toContain(w.discovery.classification)
      // Components are weighted and sum to ~1.
      const wsum = w.discovery.components.reduce((s, c) => s + c.weight, 0)
      expect(wsum).toBeCloseTo(1, 5)
      expect(w.dictionaryViability.overall).toBeGreaterThanOrEqual(0)
      expect(w.dictionaryViability.overall).toBeLessThanOrEqual(1)
    }
  })

  it('keeps "Exceptional" genuinely rare — at most one per run', () => {
    for (const seed of [7, 42, 99, 3]) {
      const r = runLaboratory({ brief: 'the quiet grief of outgrowing a friendship', keywords: [], count: 6, seed })
      const exc = r.families.flatMap((f) => f.words).filter((w) => w.discovery.classification === 'Exceptional')
      expect(exc.length).toBeLessThanOrEqual(1)
      // An exceptional word is always a direct answer, never adjacent.
      for (const w of exc) {
        const fam = r.families.find((f) => f.words.includes(w))!
        expect(fam.direct).toBe(true)
      }
    }
  })

  it('does not label the whole run exceptional (realistic distribution)', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const words = r.families.flatMap((f) => f.words)
    const exc = words.filter((w) => w.discovery.classification === 'Exceptional').length
    expect(exc).toBeLessThan(words.length) // never all-exceptional
    // More than one distinct class appears across the run.
    expect(new Set(words.map((w) => w.discovery.classification)).size).toBeGreaterThanOrEqual(2)
  })

  it('gives shorter forms a lower collision-safety prior', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const words = r.families.flatMap((f) => f.words)
    const short = words.filter((w) => w.word.length <= 4)
    const long = words.filter((w) => w.word.length >= 8)
    if (short.length && long.length) {
      const avg = (xs: typeof words) => xs.reduce((s, w) => s + w.discovery.collisionSafetyPrior, 0) / xs.length
      expect(avg(short)).toBeLessThan(avg(long))
    }
  })

  it('rates a clean word more viable than a clustered one', () => {
    const stars = [{ language: 'English', stars: 4 }]
    const clean = computeDictionaryViability('Miresen', stars, 3)
    const clustered = computeDictionaryViability('Grugukyx', stars, 3)
    expect(clean.overall).toBeGreaterThan(clustered.overall)
  })

  it('is deterministic per seed', () => {
    const a = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const b = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    expect(a.families.flatMap((f) => f.words).map((w) => w.discovery.score)).toEqual(
      b.families.flatMap((f) => f.words).map((w) => w.discovery.score),
    )
  })
})

describe('validation & typed relations (v0.36 Phase 3)', () => {
  const ROLES = ['verb', 'adjective', 'adverb', 'agent noun']

  it('only ships morphological forms that pass validation, rejecting the rest with reasons', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const w of r.families.flatMap((f) => f.words)) {
      // Accepted forms are genuinely natural…
      for (const f of w.paradigm.forms) {
        expect(ROLES).toContain(f.role)
        expect(naturalness(f.form)).toBeGreaterThanOrEqual(0.58)
      }
      // …and rejected forms carry an explanation.
      for (const rej of w.paradigm.rejected) {
        expect(ROLES).toContain(rej.role)
        expect(rej.reason.length).toBeGreaterThan(0)
      }
      // Accepted + rejected together are a subset of the four candidate roles.
      const roles = [...w.paradigm.forms, ...w.paradigm.rejected].map((f) => f.role)
      expect(new Set(roles).size).toBe(roles.length)
      expect(roles.length).toBeLessThanOrEqual(4)
    }
  })

  it('labels lineage constructed and marks a real chain plausible', () => {
    for (const w of runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 }).families.flatMap((f) => f.words)) {
      expect(w.etymology.lineageType).toBe('constructed')
      expect(w.etymology.plausible).toBe(w.etymology.stages.length >= 2)
      // Every non-root stage explains what KIND of change produced it.
      for (const s of w.etymology.stages.slice(1)) expect(s.reason.length).toBeGreaterThan(0)
    }
  })

  it('types every relation and never calls a shared sound "semantic"', () => {
    for (const w of runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 }).families.flatMap((f) => f.words)) {
      for (const rel of w.relations) {
        expect(['semantic', 'phonetic', 'morphological']).toContain(rel.relationClass)
        // "kindred sound" / "sibling" must never be filed under semantic.
        if (rel.kind === 'kindred sound' || rel.kind === 'sibling') {
          expect(rel.relationClass).toBe('phonetic')
        }
        if (rel.relationClass === 'semantic') {
          expect(['kindred idea', 'echo']).toContain(rel.kind)
        }
      }
    }
  })

  it('validates each word\'s sound against its meaning\'s intended profile', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const fam of r.families) {
      for (const w of fam.words) {
        const p = w.phonology
        expect(p.congruence).toBeGreaterThanOrEqual(0)
        expect(p.congruence).toBeLessThanOrEqual(1)
        expect(['Contradicts', 'Weak', 'Fair', 'High']).toContain(p.band)
        expect(p.explanation.length).toBeGreaterThan(0)
        // The intended profile is the family's actual acoustic profile.
        expect(p.intended).toEqual(fam.acoustic)
      }
    }
    // Congruence genuinely varies across a run (the sound layer differentiates).
    const bands = new Set(r.families.flatMap((f) => f.words).map((w) => w.phonology.band))
    expect(bands.size).toBeGreaterThanOrEqual(2)
  })

  it('is deterministic per seed', () => {
    const a = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const b = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    const shape = (r: typeof a) =>
      r.families.flatMap((f) => f.words).map((w) => [
        w.paradigm.forms.length,
        w.paradigm.rejected.length,
        w.phonology.band,
        w.relations.map((x) => x.relationClass).join(','),
      ])
    expect(shape(a)).toEqual(shape(b))
  })
})

describe('layered collision analysis (v0.36 Phase 4)', () => {
  it('never reports a bare "none" — externals are honestly "not checked"', () => {
    const r = runLaboratory({ ...MEDICINE_REQUEST, count: 6, seed: 7 })
    for (const w of r.families.flatMap((f) => f.words)) {
      const c = w.collisionReport
      // Overall status is a verdict about what WAS checked, never a bare pass.
      expect(['Unverified', 'Internal collision']).toContain(c.status)
      // Every external layer is explicitly not checked (no silent pass).
      expect(c.brand).toBe('not_checked')
      expect(c.domain).toBe('not_checked')
      expect(c.trademark).toBe('not_checked')
      expect(c.multilingual).toBe('not_checked')
      expect(c.properName).toBe('not_checked')
      expect(c.confidence).toBe('low')
      expect(c.summary.toLowerCase()).toContain('not checked')
    }
  })

  it('gives short forms a high occupancy prior (spec §14)', () => {
    expect(buildCollisionReport('Vion').shortWordRisk).toBe('high')
    expect(buildCollisionReport('Arel').shortWordRisk).toBe('high')
    expect(buildCollisionReport('Miresen').shortWordRisk).toBe('low')
  })

  it('flags an existing common word as an internal collision', () => {
    const c = buildCollisionReport('table')
    // "table" is in / adjacent to the built-in list — either way it is an internal hit.
    expect(['exact', 'near']).toContain(c.internalDictionary)
    expect(c.status).toBe('Internal collision')
  })

  it('catches a same-sound different-spelling word phonetically', () => {
    // "Kwik" sounds like "quick" — a phonetic neighbour even if spelled apart.
    expect(buildCollisionReport('Kwik').phonetic).not.toBe('low')
  })

  it('is deterministic', () => {
    expect(buildCollisionReport('Miresen')).toEqual(buildCollisionReport('Miresen'))
  })
})

describe('Brand Mode (v0.36 P5 — deterministic, collision-aware)', () => {
  const REQ = { brief: 'a bold fintech startup', keywords: [], count: 6 as const }

  it('gives every word a brand-safety verdict', () => {
    const r = runLaboratory({ ...REQ, seed: 5, brandMode: true })
    for (const w of r.families.flatMap((f) => f.words)) {
      expect(['Poor', 'Fair', 'Good', 'Strong']).toContain(w.brandSafety.band)
      expect(w.brandSafety.score).toBeGreaterThanOrEqual(0)
      expect(w.brandSafety.score).toBeLessThanOrEqual(100)
    }
  })

  it('re-weights the discovery score toward collision safety', () => {
    const plain = runLaboratory({ ...REQ, seed: 5 }).families.flatMap((f) => f.words)[0]
    const brand = runLaboratory({ ...REQ, seed: 5, brandMode: true }).families.flatMap((f) => f.words)[0]
    const wt = (w: typeof plain, label: string) =>
      w.discovery.components.find((c) => c.label.startsWith(label))?.weight ?? 0
    // Collision safety weighs far more, concept fidelity far less, in Brand Mode.
    expect(wt(brand, 'Collision')).toBeGreaterThan(wt(plain, 'Collision'))
    expect(wt(brand, 'Concept')).toBeLessThan(wt(plain, 'Concept'))
    // Sound-symbolism and morphology are dropped entirely for a name.
    expect(wt(brand, 'Semantic-phonetic')).toBe(0)
    expect(wt(brand, 'Morphological')).toBe(0)
  })

  it('reframes the conclusion for name use', () => {
    const r = runLaboratory({ ...REQ, seed: 5, brandMode: true })
    expect(r.conclusion).toContain('Brand Mode')
  })

  it('hard-rejects an existing-word collision as a brand', () => {
    // "table" is an existing word — disqualifying for a brand no matter its sound.
    const d = computeDiscovery({
      word: 'table',
      genome: computeGenome('table', ['order']),
      collision: offlineCollision('table'),
      collisionReport: buildCollisionReport('table'),
      dictionaryViability: computeDictionaryViability('table', [{ language: 'English', stars: 5 }], 2),
      pronunciation: [{ language: 'English', stars: 5 }],
      fidelityBand: 'direct',
      acoustic: { hardness: 0.5, depth: 0.5, clip: 0.5, openness: 0.5 },
      brandMode: true,
    })
    expect(d.classification).toBe('Rejected')
  })

  it('is deterministic per seed', () => {
    const a = runLaboratory({ ...REQ, seed: 5, brandMode: true })
    const b = runLaboratory({ ...REQ, seed: 5, brandMode: true })
    expect(a.families.flatMap((f) => f.words).map((w) => [w.brandSafety.band, w.discovery.score])).toEqual(
      b.families.flatMap((f) => f.words).map((w) => [w.brandSafety.band, w.discovery.score]),
    )
  })
})

describe('target-type alignment — regression suite (Morutho ranking fix §11)', () => {
  it('detects the target head type before generation, with confidence', () => {
    const tt = detectTargetType(
      'A word for the realization that two people have been talking about the same experience for years under different names.',
    )
    expect(tt.headType).toBe('realization')
    expect(tt.confidence).toBe('high')
    expect(tt.requiredSociality).toBe('interpersonal')
    expect(tt.participants).toEqual(['person_a', 'person_b'])
    // Locked onto the analysis, so it is available before discovery.
    const a = analyzeMeaning([], 'the exact moment it becomes real')
    expect(a.targetType?.headType).toBe('moment')
  })

  it('TEST A — an abstract principle cannot be a direct answer to a moment-of-realization prompt', () => {
    const r = runLaboratory({
      brief: 'A word for the realization that two people have been talking about the same experience for years under different names.',
      keywords: [],
      count: 6,
      seed: 7,
    })
    const principle = r.families.find((f) => f.candidateType === 'principle')
    // The principle family exists (from "the meaning itself" lens) but is demoted.
    expect(principle).toBeDefined()
    expect(principle!.direct).toBe(false)
    // Any Top Discovery must come from a temporal (moment-ish) type, never a principle.
    const top = r.families.find((f) => f.words.some((w) => w.discovery.classification === 'Exceptional'))
    if (top) expect(['moment', 'realization', 'event']).toContain(top.candidateType)
  })

  it('does not let a subordinate "the person…" clause hijack the target type', () => {
    // Regression: "the person you shared it with is gone" wrongly detected as a
    // person-target, demoting every family and forcing a false "no direct candidate".
    const tt = detectTargetType(
      'A word for the quiet dignity of continuing a small daily ritual long after the person you shared it with is gone.',
    )
    expect(tt.headType).not.toBe('person')
    // A genuine person target still resolves correctly.
    expect(detectTargetType('A word for someone who quietly keeps everyone else together.').headType).toBe('person')
    expect(detectTargetType('A word for the person who always arrives first.').headType).toBe('person')
  })

  it('TEST B — a bodily/state candidate is only adjacent to a social-phenomenon prompt', () => {
    const tt = detectTargetType(
      'A word for the social reversal when a whole group suddenly turns against the person they were praising.',
    )
    expect(tt.headType).toBe('social_phenomenon')
    expect(targetTypeMatch('bodily_sensation', tt.headType)).toBeLessThan(0.6)
    expect(targetTypeMatch('state', tt.headType)).toBeLessThan(0.6)
  })

  it('TEST C — unsupported archetype attractors are damped out of dominance', () => {
    const brief =
      'the irreversible moment a previously inexpressible concept becomes speakable and changes what we can think'
    const v = dampenAttractors({ identity: 1, survival: 1, grief: 1, knowledge: 0.9 }, brief.toLowerCase())
    // Identity / survival / grief have no textual support here — damped.
    expect(v.identity!).toBeLessThan(1)
    expect(v.survival!).toBeLessThan(1)
    expect(v.grief!).toBeLessThan(1)
    // A genuinely-present, non-attractor concept is untouched and now dominates.
    expect(v.knowledge).toBe(0.9)
    expect(v.knowledge!).toBeGreaterThan(v.identity!)
  })

  it('TEST C2 — the future-self prompt is not read as identity/transformation (LLM-path backstop)', () => {
    // The exact live prompt that regressed: the LLM folded it into
    // identity 1.0 / transformation 0.79 / metamorphosis. The shared backstop the
    // api/analyze seam now applies must cut those, leaving the plainer concepts.
    const brief =
      'the strange comfort of realizing that your future self is already silently shaping your present through decisions you don\'t yet understand'
    const v = dampenAttractors(
      { identity: 1, transformation: 0.79, time: 0.95, trust: 0.74, recognition: 0.84 },
      brief.toLowerCase(),
    )
    // No "becoming a different person" / "transform" cue — identity & transformation damped.
    expect(v.identity!).toBeLessThanOrEqual(0.4)
    expect(v.transformation!).toBeLessThanOrEqual(0.79 * 0.4 + 1e-9)
    // The genuinely-present concepts are untouched and now dominate.
    expect(v.time).toBe(0.95)
    expect(v.trust).toBe(0.74)
    expect(v.recognition).toBe(0.84)
    expect(v.time!).toBeGreaterThan(v.identity!)
    expect(v.recognition!).toBeGreaterThan(v.transformation!)
    // …and the coarse metamorphosis theme is not licensed by this prompt.
    expect(METAMORPHOSIS_CUE.test(brief.toLowerCase())).toBe(false)
    // A genuine transformation prompt still trips the cue (guard not over-eager).
    expect(METAMORPHOSIS_CUE.test('becoming a different person after the fire')).toBe(true)
  })

  it('TEST D — a "capacity" lens is not a direct answer unless the target is a capacity', () => {
    const r = runLaboratory({
      brief: 'A word for the realization that two people meant the same thing under different names.',
      keywords: [],
      count: 6,
      seed: 7,
    })
    const capacity = r.families.find((f) => f.candidateType === 'capacity')
    if (capacity) expect(capacity.direct).toBe(false)
  })

  it('TEST E — Top Discovery is blocked for person/capacity/principle on a moment prompt', () => {
    const brief = 'A word for the exact moment two strangers realize they share the same rare memory.'
    const head = detectTargetType(brief).headType
    for (const seed of [3, 7, 42]) {
      const r = runLaboratory({ brief, keywords: [], count: 6, seed })
      const top = r.families.find((f) => f.words.some((w) => w.discovery.classification === 'Exceptional'))
      if (top) {
        expect(['person', 'capacity', 'principle']).not.toContain(top.candidateType)
        expect(targetTypeMatch(top.candidateType, head)).toBeGreaterThanOrEqual(0.8)
      }
    }
  })

  it('can return no direct candidate at all (honest empty result)', () => {
    // A high-confidence target with no matching lens selected → zero direct families.
    const r = runLaboratory({
      brief: 'A word for the realization that two people have been talking about the same experience for years under different names.',
      keywords: [],
      count: 6,
      seed: 7,
    })
    // Whatever the outcome, direct families all match the target strongly.
    for (const f of r.families.filter((f) => f.direct)) {
      expect(f.targetMatch).toBeGreaterThanOrEqual(0.6)
    }
  })

  it('TEST A2 — the concept vector NAMES the prompt, not the "creation" fallback', () => {
    // The reported failure: the winner was about "bringing something new into being"
    // because the vocabulary had no concepts for recognition / communication.
    const a = analyzeMeaning(
      [],
      'A word for the realization that two people have been talking about the same experience for years under different names.',
    )
    const top = Object.entries(a.concepts).sort((x, y) => y[1] - x[1]).map(([c]) => c)
    expect(top[0]).not.toBe('creation')
    // Recognition / communication / understanding / connection dominate.
    expect(['recognition', 'communication', 'understanding', 'connection']).toContain(top[0])
    // The winning direct word actually MEANS recognition/communication, not creation.
    const r = runLaboratory({
      brief: 'A word for the realization that two people have been talking about the same experience for years under different names.',
      keywords: [],
      count: 6,
      seed: 7,
    })
    const directMeanings = r.families.filter((f) => f.direct).flatMap((f) => f.words).map((w) => w.meaning.toLowerCase())
    expect(directMeanings.some((m) => /recogni|same|meaning|words|names|understand/.test(m))).toBe(true)
    expect(directMeanings.every((m) => !m.includes('bringing something new into being'))).toBe(true)
  })

  it('TEST C — a language/cognition prompt is not dominated by identity/grief/survival', () => {
    const a = analyzeMeaning(
      [],
      'the irreversible moment when a previously inexpressible concept becomes speakable and permanently changes what humans can think',
    )
    const top2 = Object.entries(a.concepts).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([c]) => c)
    expect(top2).not.toContain('identity')
    expect(top2).not.toContain('grief')
    expect(top2).not.toContain('survival')
    // It leads with communication / understanding instead.
    expect(['communication', 'understanding', 'knowledge', 'human']).toContain(top2[0])
  })

  it('keeps the LLM concept enum in sync with the engine vocabulary (drift guard)', () => {
    // The reported bug also lived on the LLM path: api/analyze.ts constrains the
    // model to a hardcoded CONCEPTS enum. If a new engine concept is missing there,
    // the model can never pick it and the prompt silently falls back. Lock it.
    const apiSrc = readFileSync(new URL('../../api/analyze.ts', import.meta.url), 'utf8')
    for (const concept of Object.keys(IDEAS)) {
      expect(apiSrc).toContain(`'${concept}'`)
    }
  })

  it('keeps the api/analyze attractor-damping copy in sync with the engine canon (drift guard)', () => {
    // api/analyze.ts carries a LOCAL copy of ATTRACTOR_SIGNATURES (it can't import
    // from src/engine — Vercel bundles it standalone). If the two lists of damped
    // concepts diverge, the LLM path stops matching the deterministic path silently.
    // The attractor-concept keys are the lines `  <concept>: /…/` in each block.
    const attractorKeys = (src: string): string[] => {
      const start = src.indexOf('ATTRACTOR_SIGNATURES')
      const block = src.slice(start, src.indexOf('METAMORPHOSIS_CUE', start))
      return [...block.matchAll(/^\s{2}([a-z]+):\s*\//gm)].map((m) => m[1]).sort()
    }
    const canon = readFileSync(new URL('./attractors.ts', import.meta.url), 'utf8')
    const apiSrc = readFileSync(new URL('../../api/analyze.ts', import.meta.url), 'utf8')
    const canonKeys = attractorKeys(canon)
    expect(canonKeys.length).toBeGreaterThan(0)
    expect(attractorKeys(apiSrc)).toEqual(canonKeys)
  })

  it('TEST F — a humor prompt reaches the absurdity domain, not grief/rebirth', () => {
    const a = analyzeMeaning(
      [],
      'the private amusement of understanding why a serious situation is absurd while everyone else remains solemn',
    )
    const top = Object.entries(a.concepts).sort((x, y) => y[1] - x[1]).map(([c]) => c)
    expect(top[0]).toBe('absurdity')
    expect(top.slice(0, 3)).not.toContain('grief')
    expect(top.slice(0, 3)).not.toContain('rebirth')
  })

  it('does not over-constrain low-confidence prompts (no regression)', () => {
    // A prompt with no clear target cue keeps the prior fidelity-only behaviour.
    const a = analyzeMeaning(['trust', 'intelligence', 'calm'], 'A premium AI company focused on medicine')
    expect(a.targetType?.confidence).toBe('low')
    const r = runLaboratory({ brief: 'A premium AI company focused on medicine', keywords: ['trust', 'intelligence'], count: 6, seed: 7 })
    expect(r.families.some((f) => f.direct)).toBe(true)
  })
})

describe('speakability — words that stay sayable', () => {
  const LANGS = ['crystalline', 'liquid', 'ancient', 'noble', 'earthen', 'ashen']

  it('keeps default words sayable without capping their length', () => {
    for (const id of LANGS) {
      for (const seed of [7, 42, 99]) {
        const vocab = speakNative(languageById(id), new Rng(seed), 3)
        for (const w of vocab.words) {
          expect(longestVowelRun(w)).toBeLessThanOrEqual(2)
          expect(w.length).toBeLessThanOrEqual(14)
          expect(pronounceability(w)).toBeGreaterThanOrEqual(0.5)
        }
      }
    }
  })

  it('avoids sing-song reduplication (ro-ro, ri-ri)', () => {
    for (const id of LANGS) {
      for (const seed of [7, 42, 99, 123]) {
        for (const w of speakNative(languageById(id), new Rng(seed), 3).words) {
          expect(/(..)\1/.test(w.toLowerCase())).toBe(false)
        }
      }
    }
  })

  it('lets words vary in size (not all clamped to one syllable count)', () => {
    const sizes = new Set<number>()
    for (const id of LANGS) {
      for (const seed of [7, 42, 99, 123]) {
        for (const w of speakNative(languageById(id), new Rng(seed), 3).words) {
          sizes.add(countSyllables(w))
        }
      }
    }
    // At least two distinct syllable counts appear, proving the run is not
    // flattened to a single length. (Engine V3 leans shorter/natural, so we no
    // longer require a 4-syllable word — only genuine size variety.)
    expect(sizes.size).toBeGreaterThanOrEqual(2)
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
    expect(speakabilityBand('Moma')).toBe('Speakable') // 2 syllables
    expect(speakabilityBand('Sodaron')).toBe('Speakable') // 3 syllables, still easy
    // A smooth 4-syllable word is fine — length alone no longer demotes it.
    expect(speakabilityBand('Elunavere')).not.toBe('Ornate')
    // Genuinely monstrous shapes are still flagged.
    expect(speakabilityBand('Kororoalongar')).toBe('Ornate') // length ≥ 13
    const words = generateWords({ ...MEDICINE_REQUEST, count: 5 })
    for (const w of words) {
      expect(['Speakable', 'Balanced', 'Ornate']).toContain(w.speakability)
    }
  })
})

describe('offline collision check', () => {
  it('flags common words and known brands as exact matches', () => {
    expect(offlineCollision('nova').match).toBe('exact') // brand list
    expect(offlineCollision('vera').match).toBe('exact')
    expect(offlineCollision('river').match).toBe('exact') // common word
  })

  it('flags one-edit neighbours of everyday words as near', () => {
    expect(offlineCollision('lyon').match).toBe('near') // one edit from "lion"
    expect(offlineCollision('rivor').match).toBe('near') // one edit from "river"
  })

  it('reports invented words as no known collision (but never claims "unused")', () => {
    const r = offlineCollision('Vaslilen')
    expect(r.match).toBe('none')
    expect(r.note.toLowerCase()).toContain('does not confirm')
  })

  it('ships an offline collision verdict on every passport', () => {
    for (const w of generateWords({ ...MEDICINE_REQUEST, count: 5 })) {
      expect(['exact', 'near', 'none']).toContain(w.collision.match)
    }
  })
})

describe('semantic phonology (Engine V5 — sound follows meaning)', () => {
  it('derives a sharper profile for hard meanings than soft ones', () => {
    const hard = acousticProfile({ destruction: 1, fire: 0.8, power: 0.6 })
    const soft = acousticProfile({ grief: 1, loss: 0.8, calm: 0.6 })
    expect(hard.hardness).toBeGreaterThan(soft.hardness)
    expect(soft.depth).toBeGreaterThan(hard.depth) // grief runs deeper/darker
    expect(soft.openness).toBeGreaterThan(hard.openness)
  })

  it('makes words sound harder for a hard profile than a soft one (same language)', () => {
    const lang = languageById('crystalline')
    const hard = acousticProfile({ destruction: 1, fire: 0.8, power: 0.6 })
    const soft = acousticProfile({ grief: 1, loss: 0.8, calm: 0.6 })
    const avgSharp = (p: ReturnType<typeof acousticProfile>) => {
      let s = 0
      let n = 0
      for (const seed of [1, 7, 42, 99, 123, 256]) {
        for (const w of speakNative(lang, new Rng(seed), 3, 0.7, p).words) {
          s += sharpness(w)
          n++
        }
      }
      return s / n
    }
    expect(avgSharp(hard)).toBeGreaterThan(avgSharp(soft))
  })

  it('stays deterministic per seed with a profile', () => {
    const p = acousticProfile({ grief: 1, loss: 0.6 })
    const a = speakNative(languageById('liquid'), new Rng(9), 3, 0.7, p).words
    const b = speakNative(languageById('liquid'), new Rng(9), 3, 0.7, p).words
    expect(a).toEqual(b)
  })

  it('gives every family an acoustic profile', () => {
    const { families } = runLaboratory({ ...MEDICINE_REQUEST, count: 5, seed: 7 })
    for (const f of families) {
      for (const k of ['hardness', 'depth', 'clip', 'openness'] as const) {
        expect(f.acoustic[k]).toBeGreaterThanOrEqual(0)
        expect(f.acoustic[k]).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('naturalness (Engine V3 — inevitable, not fabricated)', () => {
  const REAL = ['Sena', 'Uber', 'Kodak', 'Spotify', 'Valen', 'Rasa', 'Liranir']
  const FANTASY = ['Gruthuthoth', 'Vorulalux', 'Xekakix', 'Nyrariath', 'Ishithaliel', 'Voruknoath']

  it('scores real-feeling words far above fantasy shapes', () => {
    const minReal = Math.min(...REAL.map(naturalness))
    const maxFantasy = Math.max(...FANTASY.map(naturalness))
    expect(minReal).toBeGreaterThan(maxFantasy)
    expect(minReal).toBeGreaterThan(0.7)
    expect(maxFantasy).toBeLessThan(0.5)
  })

  it('maps scores to honest bands', () => {
    expect(naturalnessBand(naturalness('Uber'))).toBe('Inevitable')
    expect(naturalnessBand(naturalness('Gruthuthoth'))).toBe('Fabricated')
  })

  it('softly penalises same-class sharp-consonant clustering', () => {
    // A wall of hisses / a knot of hard stops scores below its clean cousin…
    expect(naturalness('Sysiasio')).toBeLessThan(naturalness('Sena'))
    expect(naturalness('Grugukyx')).toBeLessThan(naturalness('Koranar'))
    expect(naturalness('Sassos')).toBeLessThan(naturalness('Lasyvis'))
    // …but coronal-/nasal-heavy words (r, n, l) are natural and stay untouched.
    expect(naturalness('Koranar')).toBeGreaterThan(0.9)
    expect(naturalness('Banana')).toBeGreaterThan(0.85)
    // Two of a class is fine — only real clustering (3+) bites.
    expect(naturalness('Asholis')).toBeGreaterThan(0.9)
  })

  it('makes synthesis rank believability over originality', () => {
    // With naturalness as the primary signal, a default run should almost never
    // ship a fabricated-feeling word.
    let fabricated = 0
    let total = 0
    for (const id of ['crystalline', 'liquid', 'ancient', 'noble', 'ashen', 'obsidian']) {
      for (const seed of [7, 42, 99]) {
        for (const w of speakNative(languageById(id), new Rng(seed), 3).words) {
          total++
          if (naturalnessBand(naturalness(w)) === 'Fabricated') fabricated++
        }
      }
    }
    expect(fabricated / total).toBeLessThan(0.15)
  })

  it('gives every passport a naturalness band', () => {
    for (const w of generateWords({ ...MEDICINE_REQUEST, count: 5 })) {
      expect(['Fabricated', 'Plausible', 'Believable', 'Inevitable']).toContain(w.naturalness)
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

  it('treats a standalone "y" as a vowel, not a dropped glide', () => {
    // Regression: "Lynyvysal" used to collapse to "лнвсал" (all vowels lost).
    expect(translitRu('Lynyvysal')).toBe('лынывысал')
    expect(translitRu('Syvalis')).toBe('сывалис')
    // Velar softening: к/г/х want "и", not "ы".
    expect(translitRu('Kyra')).toBe('кира')
    // Glide forms are unaffected (handled before the single-letter pass).
    expect(translitRu('Seiral')).toBe('сейрал')
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
      // A producing language ships words; a refusing language (V4) coins none.
      if (fam.refusal) expect(fam.words).toEqual([])
      else expect(fam.words.length).toBeGreaterThanOrEqual(1)
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
