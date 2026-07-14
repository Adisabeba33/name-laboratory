import type { Language } from './data/languages'
import type { Etymology, EtymologyStage } from './types'
import { isVowel, normalise } from './phonetics'

/**
 * Engine V4/V6 — imagined etymology (an evolved root chain).
 *
 * A real word carries its history in its shape. This reconstructs a plausible one
 * for a coined word by running the language's own "sound laws" BACKWARD from the
 * modern form: peel off the signature ending it accreted, open the vowel that
 * later tightened, soften the initial stop that later hardened. The result is a
 * short lineage, oldest → today, each step annotated with the change that produced
 * the younger form.
 *
 * Honesty (invariant #6 — no fake etymology): this is explicitly an IMAGINED
 * lineage of the word's own sound, never a claim that it descends from a real
 * language. The summary and the UI say so. Deterministic and pure: same word →
 * same lineage.
 */

/** Modern high/close vowel → the older, more open vowel it plausibly tightened from. */
const OPENED: Record<string, string> = { i: 'e', e: 'a', y: 'e', u: 'o', o: 'a' }

/** Modern hard stop → the older, softer consonant it plausibly hardened from. */
const SOFTENED: Record<string, string> = { k: 'g', t: 'd', p: 'b', c: 'g', q: 'g' }

interface Edge {
  /** The older form, before this change happened. */
  older: string
  /** The younger form, after it. */
  newer: string
  /** What happened, older → newer. */
  note: string
}

export function computeEtymology(word: string, lang: Language, anchor: string): Etymology {
  const modern = normalise(word)
  const edges: Edge[] = []
  let cur = modern

  // Undo the most-recent change first, walking back in time.
  const accrete = undoEnding(cur, lang)
  if (accrete) {
    edges.unshift({ older: accrete.older, newer: cur, note: accrete.note })
    cur = accrete.older
  }
  const raise = undoVowel(cur)
  if (raise) {
    edges.unshift({ older: raise.older, newer: cur, note: raise.note })
    cur = raise.older
  }
  const harden = undoLenition(cur)
  if (harden) {
    edges.unshift({ older: harden.older, newer: cur, note: harden.note })
    cur = harden.older
  }

  const stages: EtymologyStage[] = []
  const oldest = edges.length ? edges[0].older : modern
  stages.push({ form: cap(oldest), era: 'imagined root', note: '' })
  edges.forEach((e, i) => {
    stages.push({
      form: cap(e.newer),
      era: i === edges.length - 1 ? 'today' : 'older form',
      note: e.note,
    })
  })

  return {
    stages,
    summary:
      `An imagined lineage for a word that carries ${anchor} — how its sound could ` +
      `have drifted into this shape. Not a real historical derivation.`,
  }
}

/**
 * Undo ending accretion: peel off a signature ending the modern word wears, so the
 * older form is the barer stem. Prefers one of the language's own endings; falls
 * back to a short tail. Returns null if there is nothing safe to remove.
 */
function undoEnding(form: string, lang: Language): { older: string; note: string } | null {
  const ending = [...lang.endings]
    .sort((a, b) => b.length - a.length)
    .find((e) => form.length - e.length >= 3 && form.endsWith(e))
  if (ending) {
    return { older: form.slice(0, -ending.length), note: `took the "-${ending}" ending` }
  }
  // Fallback: drop a final unstressed vowel if the word is long enough.
  if (form.length >= 5 && isVowel(form[form.length - 1])) {
    return { older: form.slice(0, -1), note: `grew a final "${form[form.length - 1]}"` }
  }
  return null
}

/**
 * Undo a vowel raising: find the last close vowel that plausibly tightened, and
 * restore its older, more open value.
 */
function undoVowel(form: string): { older: string; note: string } | null {
  for (let i = form.length - 1; i >= 0; i--) {
    const ch = form[i]
    if (OPENED[ch]) {
      const older = form.slice(0, i) + OPENED[ch] + form.slice(i + 1)
      if (older === form) return null
      return { older, note: `its "${OPENED[ch]}" tightened to "${ch}"` }
    }
  }
  return null
}

/** Undo lenition: soften the initial hard stop the modern form hardened into. */
function undoLenition(form: string): { older: string; note: string } | null {
  const first = form[0]
  if (SOFTENED[first]) {
    return {
      older: SOFTENED[first] + form.slice(1),
      note: `its initial "${SOFTENED[first]}" hardened to "${first}"`,
    }
  }
  return null
}

function cap(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
