/**
 * Spoken-form pronunciation guide.
 *
 * The words are invented, so no dictionary can tell a reader how to say them.
 * But because they're synthesised from a regular romanised inventory, we can
 * derive a readable respelling ourselves: normalise the spelling, split the word
 * into syllables (keeping digraphs like "sh"/"th" whole), sound out each vowel
 * nucleus, and mark the stressed syllable from the language's own stress pattern.
 * The result is a dictionary-style guide like "eh-LEE-ah-yeh" — no IPA needed,
 * and it works with or without the LLM.
 */

type Stress = 'Initial' | 'Final' | 'Even'

/** Base vowels (excludes `y`, which is treated as a glide before a vowel). */
const BASE_VOWEL = /[aeiouëïöü]/i

/** Consonant clusters comfortable at the start of a syllable — kept intact. */
const ONSET = new Set([
  'sh', 'ch', 'th', 'wh', 'kw',
  'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'bl', 'cl', 'fl', 'gl', 'pl', 'sl',
  'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw', 'tw', 'gn', 'kn', 'wr',
  'str', 'spr', 'scr', 'thr', 'shr', 'chr',
])

/** Vowel groups → an English-reader respelling. Clarity over strict phonetics. */
const NUCLEUS: Record<string, string> = {
  a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo', y: 'ee',
  ë: 'eh', ï: 'ee', ö: 'oh', ü: 'oo',
  // True diphthongs read as one sound.
  ai: 'eye', ay: 'ay', ae: 'ay', au: 'ow', aw: 'aw',
  ei: 'ay', ey: 'ay', eu: 'yoo', ea: 'ee', ee: 'ee',
  oi: 'oy', oy: 'oy', oo: 'oo', ou: 'oo', oa: 'oh', oe: 'oh',
  // Rising groups read as two beats, clearest for a reader.
  ia: 'ee-ah', ie: 'ee-eh', io: 'ee-oh', iu: 'ee-oo',
  ua: 'oo-ah', ue: 'oo-eh', ui: 'oo-ee', uo: 'oo-oh',
}

const SINGLE: Record<string, string> = {
  a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo', y: 'ee',
  ë: 'eh', ï: 'ee', ö: 'oh', ü: 'oo',
}

interface Syl {
  onset: string
  nucleus: string
  coda: string
}

/** A romanised word → a stress-marked spoken guide, e.g. "so-LEE-ar-lye". */
export function pronounce(word: string, stressPattern: Stress): string {
  const w = normaliseSpelling(word.toLowerCase().replace(/[^a-zë-ü]/gi, ''))
  if (!w) return word
  const parts = syllabify(w).map(say).filter(Boolean)
  if (parts.length === 0) return word
  const idx = stressIndex(parts.length, stressPattern)
  parts[idx] = parts[idx].toUpperCase()
  return parts.join('-')
}

/** Regularise orthography so the sounder sees phonetic spellings only. */
function normaliseSpelling(w: string): string {
  return w
    .replace(/qu/g, 'kw')
    .replace(/x/g, 'ks')
    .replace(/ph/g, 'f')
    .replace(/c(?!h)/g, 'k') // hard c → k, but leave the "ch" digraph
}

/** Is this character a vowel *here*? `y` is a vowel unless it glides onto one. */
function vowelAt(w: string, i: number): boolean {
  const ch = w[i]
  if (ch === 'y') return !BASE_VOWEL.test(w[i + 1] ?? '')
  return BASE_VOWEL.test(ch)
}

/** Break the word into onset/nucleus/coda syllables, keeping digraphs intact. */
function syllabify(w: string): Syl[] {
  // Alternating vowel / consonant runs.
  const tokens: { vowel: boolean; s: string }[] = []
  for (let i = 0; i < w.length; i++) {
    const vowel = vowelAt(w, i)
    const last = tokens[tokens.length - 1]
    if (last && last.vowel === vowel) last.s += w[i]
    else tokens.push({ vowel, s: w[i] })
  }

  const out: Syl[] = []
  let onset = ''
  tokens.forEach((t, i) => {
    if (t.vowel) {
      out.push({ onset, nucleus: t.s, coda: '' })
      onset = ''
      return
    }
    if (out.length === 0) {
      onset = t.s // leading consonants open the first syllable
    } else if (i === tokens.length - 1) {
      out[out.length - 1].coda += t.s // trailing consonants close the last
    } else {
      const [coda, next] = splitCluster(t.s)
      out[out.length - 1].coda += coda
      onset = next
    }
  })
  if (onset && out.length) out[out.length - 1].coda += onset
  return out.length ? out : [{ onset: '', nucleus: w, coda: '' }]
}

/** Divide a medial consonant cluster into [coda, nextOnset], preserving onsets. */
function splitCluster(cluster: string): [string, string] {
  const c = cluster.toLowerCase()
  if (c.length <= 1 || ONSET.has(c)) return ['', cluster]
  if (cluster.length >= 3 && ONSET.has(c.slice(-3))) {
    return [cluster.slice(0, -3), cluster.slice(-3)]
  }
  if (ONSET.has(c.slice(-2))) return [cluster.slice(0, -2), cluster.slice(-2)]
  return [cluster.slice(0, -1), cluster.slice(-1)] // lone consonant to next onset
}

/** Sound out one syllable. */
function say(s: Syl): string {
  return s.onset + sayNucleus(s.nucleus.toLowerCase()) + s.coda
}

function sayNucleus(v: string): string {
  if (NUCLEUS[v]) return NUCLEUS[v]
  return [...v].map((c) => SINGLE[c] ?? c).join('-') // unknown run → beat by beat
}

/** Which syllable carries the stress, from the language's pattern. */
function stressIndex(n: number, pattern: Stress): number {
  if (n <= 1) return 0
  if (pattern === 'Initial') return 0
  if (pattern === 'Final') return n - 1
  return Math.max(0, n - 2) // Even → penultimate reads most naturally
}
