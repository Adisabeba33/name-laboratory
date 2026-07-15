import type { LaboratoryResult, WordPassport } from '../engine'
import type { SemanticGapResult } from './semantic-search'

/**
 * Build a plain-text (Markdown) report of a whole run — the meaning, the reading,
 * the semantic-gap search, and every word with its full detail. One copyable
 * document instead of dozens of screenshots, so a run can be pasted to another
 * agent (or back to us) to inspect the engine's logic end to end.
 *
 * Pure and deterministic: given the same inputs it produces the same text.
 */
export interface ReportInput {
  brief: string
  results: LaboratoryResult
  gap: SemanticGapResult | null
  usedLLM: boolean
  /** True when the bespoke-meanings pass could not run — definitions are the engine's. */
  meaningsOutage?: boolean
  version?: string
  /** ISO timestamp; pass one in (the engine forbids Date.now(), so the caller stamps it). */
  stamp?: string
}

export function buildReport({ brief, results, gap, usedLLM, meaningsOutage, version, stamp }: ReportInput): string {
  const { analysis, families, population, conclusion } = results
  const L: string[] = []
  const words = families.flatMap((f) => f.words)

  L.push('# Word Laboratory — run report')
  L.push('')
  L.push(`- **Prompt:** ${brief || '(empty)'}`)
  L.push(`- **Meaning source:** ${usedLLM ? 'LLM (Read by AI)' : 'deterministic engine (no key)'}`)
  if (meaningsOutage) {
    L.push(
      `- **⚠ Bespoke meanings unavailable this run:** definitions below are the engine's own ` +
        `deterministic glosses (which repeat across words sharing a concept), and the meaning-` +
        `fidelity gate did not run — so no word is crowned a verified winner.`,
    )
  }
  if (version) L.push(`- **Build:** v${version}`)
  if (stamp) L.push(`- **Generated:** ${stamp}`)
  L.push(`- **Discovered:** ${words.length} words across ${families.length} languages`)
  L.push('')

  // ── Laboratory conclusion (v0.36) ───────────────────────────────────
  if (conclusion) {
    L.push('## Laboratory conclusion')
    L.push('')
    L.push(conclusion)
    L.push('')
  }

  // ── Top discovery (v0.36 + Morutho fix) ─────────────────────────────
  const directWords = families.filter((f) => f.direct).flatMap((f) => f.words)
  const top = [...directWords].sort((a, b) => b.discovery.score - a.discovery.score)[0]
  L.push('## Top discovery')
  L.push('')
  if (meaningsOutage) {
    L.push('_Withheld — the bespoke-meanings pass did not run, so no candidate could be verified against the gap. The engine\'s strongest form by sound is shown among the direct discoveries below, unverified._')
  } else if (top) {
    L.push(`**${top.word}** — ${top.discovery.classification}, ${top.discovery.score}/100`)
    if (top.shortMeaning || top.meaning) L.push(`\n${top.shortMeaning || top.meaning}`)
    if (top.discovery.penalties.length) L.push(`\n_Risks: ${top.discovery.penalties.join(' ')}_`)
  } else {
    L.push('_No direct candidate survived this cycle — the winning word must name the exact kind of thing asked for, and none did._')
  }
  L.push('')

  // ── Lexical evolution (Engine V6) ───────────────────────────────────
  // The honest funnel: the engine bred a population, most forms failed, a few
  // survived, fewer were shipped. Every count is real work, not decoration.
  L.push('## Lexical evolution')
  L.push('')
  const p = population
  L.push(
    `Explored **${fmt(p.generated)}** candidate forms · ` +
      `rejected **${fmt(p.rejected)}** (unpronounceable, colliding, or redundant) · ` +
      `**${fmt(p.survived)}** survived the gates · ` +
      `**${fmt(p.recommended)}** recommended · ` +
      `**${fmt(p.exceptional)}** exceptional (near-perfect, collision-free, compact).`,
  )
  if (p.generated > 0) {
    const rejectPct = Math.round((p.rejected / p.generated) * 100)
    L.push(`\n_Selection pressure: ${rejectPct}% of everything the engine tried did not survive._`)
  }
  L.push('')

  // ── Interpretation ──────────────────────────────────────────────────
  L.push('## Interpretation')
  L.push('')
  L.push(`**EN:** ${analysis.interpretation || '—'}`)
  L.push('')
  L.push(`**RU:** ${analysis.interpretationRu || '—'}`)
  if (analysis.theme) L.push(`\n**Theme:** ${analysis.theme}`)
  if (analysis.hiddenConcepts?.length) {
    L.push('\n**Hidden concepts:**')
    for (const c of analysis.hiddenConcepts) L.push(`- ${c.en} / ${c.ru}`)
  }
  if (analysis.tensions?.length) {
    L.push('\n**Semantic tensions:**')
    for (const t of analysis.tensions) L.push(`- ${t.a} ↔ ${t.b} — ${t.note}`)
  }
  if (analysis.directions?.length) {
    L.push('\n**Concept directions:**')
    for (const d of analysis.directions) L.push(`- ${d.title} — ${d.definition}`)
  }
  const topConcepts = Object.entries(analysis.concepts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => `${k} ${v.toFixed(2)}`)
  if (topConcepts.length) L.push(`\n**Concept vector:** ${topConcepts.join(', ')}`)
  L.push('')

  // ── Semantic gap search ─────────────────────────────────────────────
  L.push('## Semantic gap search')
  L.push('')
  if (!gap) {
    L.push('_Not run for this result (requires the LLM / a network connection)._')
  } else {
    L.push(`**Verdict:** ${gap.status}  ·  confidence: ${gap.confidence}`)
    if (gap.normalizedMeaning) L.push(`\n**Normalized meaning:** ${gap.normalizedMeaning}`)
    if (gap.closest?.length) {
      L.push('\n**Closest existing concepts:**')
      for (const c of gap.closest) {
        L.push(`\n- **${c.lemma}** _(${c.pos}${c.language && c.language !== 'English' ? `, ${c.language}` : ''})_ — coverage: ${c.coverage}`)
        if (c.definition) L.push(`    - ${c.definition}`)
        if (c.covers?.length) L.push(`    - Covers: ${c.covers.join(' · ')}`)
        if (c.misses?.length) L.push(`    - Doesn't cover: ${c.misses.join(' · ')}`)
      }
    }
    if (gap.conclusion) L.push(`\n**Conclusion:** ${gap.conclusion}`)
    if (gap.remainder) L.push(`\n**Semantic gap (unnamed remainder):** ${gap.remainder}`)
    if (gap.limitations) L.push(`\n_Limitations: ${gap.limitations}_`)
  }
  L.push('')

  // ── Words, grouped by directness (v0.36) ────────────────────────────
  const direct = families.filter((f) => f.direct)
  const adjacent = families.filter((f) => !f.direct && !f.refusal)
  const refused = families.filter((f) => f.refusal)

  const familyBlock = (fam: (typeof families)[number]) => {
    L.push('')
    L.push(`### ${fam.character} — lens: ${fam.lens.role} (${fam.lens.question})`)
    L.push(
      `_role: ${fam.semanticRole} · fidelity: ${fam.fidelity.band}` +
        (fam.fidelity.matched.length ? ` (carries ${fam.fidelity.matched.join(', ')})` : '') +
        (fam.fidelity.driftDetected ? ` · DRIFT: ${fam.fidelity.extraneous.join(', ')}` : '') +
        `_`,
    )
    const a = fam.acoustic
    L.push(
      `_acoustic: hardness ${a.hardness.toFixed(2)} · depth ${a.depth.toFixed(2)} · ` +
        `clip ${a.clip.toFixed(2)} · openness ${a.openness.toFixed(2)}_`,
    )
    const s = fam.stats
    L.push(
      `_evolution: bred ${fmt(s.generated)} · survived ${fmt(s.survived)} · ` +
        `shipped ${fmt(s.recommended)} · exceptional ${fmt(s.exceptional)}_`,
    )
    for (const w of fam.words) L.push(wordBlock(w))
  }

  L.push('## Words')
  L.push('')
  L.push('### Direct discoveries')
  if (direct.length) direct.forEach(familyBlock)
  else L.push('\n_No candidate named the gap directly — the laboratory recommends another cycle._')

  if (adjacent.length) {
    L.push('')
    L.push('### Adjacent discoveries')
    adjacent.forEach(familyBlock)
  }

  if (refused.length) {
    L.push('')
    L.push('### Declined')
    for (const fam of refused) {
      L.push('')
      L.push(`#### ${fam.character} — declines to translate`)
      L.push(`_${fam.refusal!.reason}_`)
    }
  }

  // ── Rejected highlights (v0.36) — transparent, educational ───────────
  const rejects = words
    .filter((w) => w.discovery.classification === 'Rejected' || w.discovery.classification === 'Weak')
    .sort((a, b) => a.discovery.score - b.discovery.score)
    .slice(0, 6)
  if (rejects.length) {
    L.push('')
    L.push('## Rejected highlights')
    for (const w of rejects) {
      L.push('')
      L.push(`- **${w.word}** (${w.discovery.classification}, ${w.discovery.score}/100) — ${w.discovery.penalties.join(' ') || 'below the viability bar.'}`)
    }
  }

  return L.join('\n')
}

function wordBlock(w: WordPassport): string {
  const b: string[] = []
  b.push('')
  b.push(`#### ${w.word}  ·  ${w.transliteration}`)
  // §10 — lead with the thresholded discovery classification; do NOT parade the
  // near-universal "Inevitable"/"Exceptional" adoption+naturalness labels.
  b.push(`- say: ${w.pronunciationGuide}  ·  ${w.partOfSpeech}  ·  speakability: ${w.speakability}`)
  const cr = w.collisionReport
  b.push(
    `- collision: **${cr.status}** (confidence ${cr.confidence}) — internal ${cr.internalDictionary} · ` +
      `phonetic ${cr.phonetic} · short-word ${cr.shortWordRisk} · ` +
      `brand/domain/trademark/multilingual: not checked`,
  )
  b.push(
    `- brand safety: ${w.brandSafety.band} (${w.brandSafety.score}/100)` +
      (w.brandSafety.warnings.length ? ` — ${w.brandSafety.warnings.join(' ')}` : ''),
  )
  b.push(
    `- **discovery: ${w.discovery.classification} — ${w.discovery.score}/100**` +
      `  ·  dictionary viability: ${w.dictionaryViability.band} (${Math.round(w.dictionaryViability.overall * 100)})` +
      `  ·  collision-safety prior: ${Math.round(w.discovery.collisionSafetyPrior * 100)}`,
  )
  if (w.discovery.penalties.length) b.push(`  - penalties: ${w.discovery.penalties.join(' ')}`)
  b.push(
    `- fitness: ${w.fitness.axes.map((a) => `${a.label} ${a.band}`).join(' · ')}` +
      `  (signature: ${w.fitness.strongest})`,
  )
  const family = w.paradigm.forms.length
    ? `${w.paradigm.root} (noun) · ` + w.paradigm.forms.map((f) => `${f.form} (${f.role})`).join(' · ')
    : `${w.paradigm.root} (noun-only — no natural derivations)`
  b.push(`- family: ${family}`)
  if (w.paradigm.rejected.length) {
    b.push(`  - rejected: ${w.paradigm.rejected.map((r) => `${r.form} (${r.reason})`).join(' · ')}`)
  }
  if (w.etymology.plausible) {
    b.push(
      `- lineage (constructed): ` +
        w.etymology.stages.map((s) => (s.reason ? `${s.form} [${s.reason}]` : s.form)).join(' → '),
    )
  }
  b.push(
    `- phonology: ${w.phonology.band} congruence (${Math.round(w.phonology.congruence * 100)}) — ${w.phonology.explanation}`,
  )
  const semantic = w.relations.filter((r) => r.relationClass === 'semantic')
  const phonetic = w.relations.filter((r) => r.relationClass === 'phonetic')
  if (semantic.length) b.push(`- related (semantic): ${semantic.map((r) => `${r.word} (${r.kind})`).join(' · ')}`)
  if (phonetic.length) b.push(`- related (phonetic): ${phonetic.map((r) => `${r.word} (${r.kind})`).join(' · ')}`)
  b.push(`- meaning: ${w.meaning}`)
  if (w.shortMeaning) b.push(`- short: ${w.shortMeaning}`)
  if (w.usage.en.length || w.usage.ru.length) {
    if (w.usage.en.length) b.push(`- use (EN): ${w.usage.en.join(' | ')}`)
    if (w.usage.ru.length) b.push(`- use (RU): ${w.usage.ru.join(' | ')}`)
  }
  const g = w.genome
  b.push(
    `- genome: pronounceability ${pct(g.pronounceability)}, rhythm ${pct(g.rhythm)}, ` +
      `syllables ${g.syllables}, uniqueness ${pct(g.uniqueness)}`,
  )
  return b.join('\n')
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

/** Group digits with thin separators so a large population reads at a glance. */
function fmt(n: number): string {
  return n.toLocaleString('en-US')
}
