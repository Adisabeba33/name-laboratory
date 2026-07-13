import type {
  Concept,
  ConceptNode,
  ConceptVector,
  MeaningAnalysis,
  SemanticTension,
} from './types'
import { PATTERNS } from './data/patterns'
import { THEMES, type Theme } from './data/themes'
import { IDEAS } from './data/ideas'
import { normaliseVector, resolveKeyword, topConcepts } from './concepts'

/**
 * Meaning Analysis — the heart of the Meaning Engine.
 *
 * Before any language is discovered, the laboratory decides what the request is
 * *really* about. It reads the prompt two ways: literal keywords (what nouns are
 * named) and phrase patterns (what human idea is implied, even when unnamed).
 * The pattern layer is what lets "becoming someone different after surviving
 * something that should have destroyed you" resolve to transformation / rebirth /
 * survival instead of the old creation / light / energy.
 *
 * If a known human theme dominates, the laboratory states a deep interpretation,
 * names the hidden concepts and draws the concept network. Otherwise it builds a
 * generic interpretation from the dominant concepts. This whole function is the
 * single seam an LLM analyzer would replace to reach open-ended understanding.
 */
export function analyzeMeaning(keywords: string[], brief?: string): MeaningAnalysis {
  const text = [brief ?? '', ...keywords].join(' ').toLowerCase()
  const vector: ConceptVector = {}
  const add = (c: Concept, w: number) => {
    vector[c] = (vector[c] ?? 0) + w
  }

  // 1) Literal keywords — the nouns actually named (weighted lower).
  for (const token of text.split(/[^a-z]+/).filter((t) => t.length > 1)) {
    const entry = resolveKeyword(token)
    if (entry) for (const [c, w] of Object.entries(entry) as [Concept, number][]) add(c, w * 0.7)
  }
  // 2) Phrase patterns — the implied human idea (the deep reading).
  for (const p of PATTERNS) {
    if (p.any.some((s) => text.includes(s))) {
      for (const [c, w] of Object.entries(p.concepts) as [Concept, number][]) add(c, w)
    }
  }
  if (Object.keys(vector).length === 0) add('creation', 1)

  const concepts = normaliseVector(vector)
  const theme = matchTheme(concepts)
  const top = topConcepts(concepts, 7)

  return {
    interpretation: theme ? theme.interpretation : genericInterpretation(top),
    interpretationRu: theme ? theme.interpretationRu : genericInterpretationRu(top),
    hiddenConcepts: theme ? theme.hiddenConcepts : genericHidden(top),
    network: theme ? theme.network : genericNetwork(top),
    tensions: theme ? theme.tensions : genericTensions(concepts, top),
    theme: theme?.id,
    concepts,
  }
}

/**
 * Concepts that pull against each other. When both poles are genuinely present
 * in a prompt, the meaning lives in the tension between them — worth naming.
 */
const OPPOSITES: Array<[Concept, Concept]> = [
  ['survival', 'loss'],
  ['strength', 'grief'],
  ['rebirth', 'destruction'],
  ['creation', 'destruction'],
  ['hope', 'shadow'],
  ['light', 'shadow'],
  ['freedom', 'order'],
  ['calm', 'energy'],
  ['identity', 'transformation'],
  ['future', 'memory'],
  ['courage', 'grief'],
  ['unity', 'freedom'],
]

/**
 * Generic semantic tensions: pairs of opposing concepts that are BOTH present in
 * the prompt. Grounded (never invented from thin air), and empty when the prompt
 * carries no real opposition — honest rather than decorative.
 */
function genericTensions(concepts: ConceptVector, top: Concept[]): SemanticTension[] {
  const present = new Set(top)
  const out: SemanticTension[] = []
  for (const [a, b] of OPPOSITES) {
    if (present.has(a) && present.has(b) && (concepts[a] ?? 0) > 0 && (concepts[b] ?? 0) > 0) {
      out.push({
        a: IDEAS[a].label, aRu: IDEAS[a].labelRu,
        b: IDEAS[b].label, bRu: IDEAS[b].labelRu,
        note: `Held between ${IDEAS[a].label.toLowerCase()} and ${IDEAS[b].label.toLowerCase()}.`,
        noteRu: `Между двумя полюсами: ${IDEAS[a].labelRu.toLowerCase()} и ${IDEAS[b].labelRu.toLowerCase()}.`,
      })
    }
    if (out.length >= 2) break
  }
  return out
}

/** The strongest matching theme, if one is clearly present. */
export function matchTheme(concepts: ConceptVector): Theme | undefined {
  let best: Theme | undefined
  let bestScore = 0
  for (const theme of THEMES) {
    if (!theme.core.some((c) => (concepts[c] ?? 0) > 0)) continue
    const score = theme.triggers.reduce((s, c) => s + (concepts[c] ?? 0), 0)
    if (score > bestScore) {
      bestScore = score
      best = theme
    }
  }
  return bestScore >= 0.6 ? best : undefined
}

function genericInterpretation(top: Concept[]): string {
  const lead = top[0]
  const rest = top.slice(1, 3).map((c) => IDEAS[c].label.toLowerCase())
  const tail = rest.length ? `, coloured by ${joinEn(rest)}` : ''
  return `At its core, this request is about ${IDEAS[lead].def}${tail}.`
}

function genericInterpretationRu(top: Concept[]): string {
  const lead = top[0]
  const rest = top.slice(1, 3).map((c) => IDEAS[c].labelRu.toLowerCase())
  const tail = rest.length ? ` Здесь также звучат: ${joinRu(rest)}.` : ''
  return `По сути, это о том, что можно назвать так: ${IDEAS[lead].defRu}.${tail}`
}

function genericHidden(top: Concept[]): ConceptNode[] {
  return top.slice(0, 5).map((c) => ({ en: IDEAS[c].label, ru: IDEAS[c].labelRu }))
}

function genericNetwork(top: Concept[]): ConceptNode[] {
  return top.slice(0, 6).map((c) => ({ en: IDEAS[c].label, ru: IDEAS[c].labelRu }))
}

function joinEn(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function joinRu(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} и ${items[items.length - 1]}`
}
