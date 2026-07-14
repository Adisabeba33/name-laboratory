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
  version?: string
  /** ISO timestamp; pass one in (the engine forbids Date.now(), so the caller stamps it). */
  stamp?: string
}

export function buildReport({ brief, results, gap, usedLLM, version, stamp }: ReportInput): string {
  const { analysis, families } = results
  const L: string[] = []
  const words = families.flatMap((f) => f.words)

  L.push('# Word Laboratory — run report')
  L.push('')
  L.push(`- **Prompt:** ${brief || '(empty)'}`)
  L.push(`- **Meaning source:** ${usedLLM ? 'LLM (Read by AI)' : 'deterministic engine (no key)'}`)
  if (version) L.push(`- **Build:** v${version}`)
  if (stamp) L.push(`- **Generated:** ${stamp}`)
  L.push(`- **Discovered:** ${words.length} words across ${families.length} languages`)
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

  // ── Words ───────────────────────────────────────────────────────────
  L.push('## Words')
  for (const fam of families) {
    L.push('')
    L.push(`### ${fam.character} — lens: ${fam.lens.role} (${fam.lens.question})`)
    for (const w of fam.words) L.push(wordBlock(w))
  }

  return L.join('\n')
}

function wordBlock(w: WordPassport): string {
  const b: string[] = []
  b.push('')
  b.push(`#### ${w.word}  ·  ${w.transliteration}`)
  b.push(
    `- say: ${w.pronunciationGuide}  ·  ${w.partOfSpeech}` +
      `  ·  speakability: ${w.speakability}  ·  naturalness: ${w.naturalness}`,
  )
  b.push(`- adoption: ${w.adoption.band} (${w.adoption.score}/100)  ·  collision: ${w.collision.match}`)
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
