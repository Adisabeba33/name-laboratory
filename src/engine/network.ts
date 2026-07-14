import type { WordFamily, WordRelation } from './types'
import { IDEAS } from './data/ideas'

/**
 * Engine V4 — the semantic network between words.
 *
 * A run is not a flat list of 18 unrelated coinages; the words share ideas,
 * sounds and languages. This computes, for each word, the handful of peers it is
 * most genuinely related to — so a lexicon can be *navigated* (open one word, step
 * to its kin) instead of merely scrolled.
 *
 * Every edge is derived from real passport data — the concepts a word was grown
 * around (`origin.lead/support`), its language, and its family's acoustic profile —
 * so a relation is a fact about the run, not decoration. Pure and deterministic.
 */

/** How many related words to surface per word. */
const MAX_RELATIONS = 3
/** Acoustic distance (0–1) under which two different languages count as kindred sound. */
const KINDRED_SOUND = 0.16

interface Node {
  key: string
  word: string
  language: string
  familyId: string
  lead: string
  support?: string
  acoustic: { hardness: number; depth: number; clip: number; openness: number }
}

/** Returns a map from each word (lowercased) to its ordered list of relations. */
export function computeSemanticNetwork(families: WordFamily[]): Map<string, WordRelation[]> {
  const nodes: Node[] = families.flatMap((f) =>
    f.words.map((w) => ({
      key: w.word.toLowerCase(),
      word: w.word,
      language: f.character,
      familyId: f.id,
      lead: w.origin.lead,
      support: w.origin.support,
      acoustic: f.acoustic,
    })),
  )

  const map = new Map<string, WordRelation[]>()
  for (const a of nodes) {
    const scored = nodes
      .filter((b) => b.key !== a.key)
      .map((b) => ({ b, rel: relate(a, b) }))
      .filter((x): x is { b: Node; rel: Scored } => x.rel !== null)
      .sort((x, y) => y.rel.strength - x.rel.strength || x.b.word.localeCompare(y.b.word))

    // Prefer a DIVERSE map: lead with the strongest link, then favour distinct
    // relation kinds so a word shows (say) a kindred idea, an echo and a sibling
    // rather than three identical edges — every pick is still a real relation.
    let picks = diversify(scored, MAX_RELATIONS)
    // Guarantee navigability: if a word is only weakly connected, still link it to
    // its acoustically nearest neighbours so the graph never leaves it stranded.
    if (picks.length < 2) {
      const filler = nodes
        .filter((b) => b.key !== a.key && !picks.some((p) => p.b.key === b.key))
        .map((b) => ({
          b,
          rel: {
            kind: 'related sound',
            note: 'the nearest sound in this run',
            strength: 1 - acousticDistance(a.acoustic, b.acoustic),
          } as Scored,
        }))
        .sort((x, y) => y.rel.strength - x.rel.strength || x.b.word.localeCompare(y.b.word))
      picks = [...picks, ...filler].slice(0, MAX_RELATIONS)
    }

    map.set(
      a.key,
      picks.map(({ b, rel }) => ({
        word: b.word,
        language: b.language,
        kind: rel.kind,
        note: rel.note,
      })),
    )
  }
  return map
}

interface Scored {
  kind: string
  note: string
  strength: number
}

/**
 * Pick up to `n` relations that lead with strength but spread across kinds: a
 * first pass takes the strongest of each not-yet-seen kind, a second pass fills
 * any remaining slots by raw strength. Input must already be sorted by strength.
 */
function diversify(scored: { b: Node; rel: Scored }[], n: number): { b: Node; rel: Scored }[] {
  const picks: { b: Node; rel: Scored }[] = []
  const seenKinds = new Set<string>()
  for (const item of scored) {
    if (picks.length >= n) break
    if (!seenKinds.has(item.rel.kind)) {
      picks.push(item)
      seenKinds.add(item.rel.kind)
    }
  }
  for (const item of scored) {
    if (picks.length >= n) break
    if (!picks.includes(item)) picks.push(item)
  }
  return picks
}

/** The single strongest relation from `a` to `b`, or null if they are unrelated. */
function relate(a: Node, b: Node): Scored | null {
  if (a.lead === b.lead) {
    return { kind: 'kindred idea', note: `both grown around ${label(a.lead)}`, strength: 1 }
  }
  if (a.lead === b.support || a.support === b.lead) {
    const shared = a.lead === b.support ? a.lead : b.lead
    return { kind: 'echo', note: `${label(shared)} threads through both`, strength: 0.8 }
  }
  const dist = acousticDistance(a.acoustic, b.acoustic)
  if (a.familyId !== b.familyId && dist < KINDRED_SOUND) {
    return { kind: 'kindred sound', note: 'almost the same sound-world', strength: 0.6 + (KINDRED_SOUND - dist) }
  }
  if (a.familyId === b.familyId) {
    return { kind: 'sibling', note: `a native of ${a.language}`, strength: 0.5 }
  }
  return null
}

/** Euclidean distance between two acoustic profiles, normalised to 0–1. */
function acousticDistance(a: Node['acoustic'], b: Node['acoustic']): number {
  const d =
    (a.hardness - b.hardness) ** 2 +
    (a.depth - b.depth) ** 2 +
    (a.clip - b.clip) ** 2 +
    (a.openness - b.openness) ** 2
  return Math.sqrt(d) / 2
}

function label(concept: string): string {
  return IDEAS[concept as keyof typeof IDEAS]?.label.toLowerCase() ?? concept
}
