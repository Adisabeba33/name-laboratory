import type { Concept } from '../types'

/**
 * Concept → idea vocabulary.
 *
 * The feedback: explanations were "technically correct but emotionally weak"
 * ("the light that gives rise to rainbow"). Meaning must lead, etymology must
 * recede. So each concept carries richer language than its bare label:
 *
 *  - `noun`     — how the concept names itself as an idea ("clarity", "quiet trust").
 *  - `active`   — what it does, as a verb phrase ("illuminating what was hidden").
 *  - `essence`  — a short evocative gloss for the lineage note.
 *
 * The narrative layer combines a lead concept's `active` with a second concept's
 * `noun` to produce statements of an actual idea:
 *   "A word imagined for intelligence illuminating hidden understanding."
 */
export interface Idea {
  noun: string
  active: string
  essence: string
}

export const IDEAS: Record<Concept, Idea> = {
  knowledge: { noun: 'deep knowledge', active: 'gathering scattered knowing into one place', essence: 'the weight of what is understood' },
  healing: { noun: 'quiet healing', active: 'making what was broken whole again', essence: 'restoration and repair' },
  future: { noun: 'the future', active: 'reaching toward what does not yet exist', essence: 'forward motion' },
  precision: { noun: 'precision', active: 'cutting cleanly through ambiguity', essence: 'exactness without waste' },
  calm: { noun: 'a settled calm', active: 'lowering the noise until only the signal remains', essence: 'stillness' },
  human: { noun: 'the human touch', active: 'keeping the person at the centre', essence: 'warmth and presence' },
  science: { noun: 'rigorous science', active: 'turning the unknown into the measured', essence: 'disciplined inquiry' },
  trust: { noun: 'earned trust', active: 'holding steady when it matters most', essence: 'reliability' },
  intelligence: { noun: 'living intelligence', active: 'illuminating what was hidden in complexity', essence: 'clarity of mind' },
  power: { noun: 'quiet power', active: 'moving the world without strain', essence: 'force held in reserve' },
  nature: { noun: 'the natural world', active: 'growing the way living things grow', essence: 'organic order' },
  light: { noun: 'clear light', active: 'revealing the shape of things', essence: 'illumination' },
  movement: { noun: 'pure movement', active: 'carrying momentum forward', essence: 'motion' },
  order: { noun: 'hidden order', active: 'finding the pattern inside the noise', essence: 'structure' },
  elevation: { noun: 'quiet elevation', active: 'rising above the ordinary', essence: 'ascent' },
  depth: { noun: 'real depth', active: 'reaching beneath the surface', essence: 'the fathomless' },
  unity: { noun: 'wholeness', active: 'drawing many things into one', essence: 'togetherness' },
  creation: { noun: 'the act of creation', active: 'bringing something new into being', essence: 'origination' },
  luxury: { noun: 'effortless luxury', active: 'making the rare feel natural', essence: 'refinement' },
  energy: { noun: 'live energy', active: 'charging everything it touches', essence: 'vitality' },
  water: { noun: 'moving water', active: 'flowing around every obstacle', essence: 'fluidity' },
  fire: { noun: 'contained fire', active: 'burning bright without consuming', essence: 'heat and drive' },
  earth: { noun: 'solid earth', active: 'holding firm beneath everything', essence: 'groundedness' },
  sky: { noun: 'the open sky', active: 'expanding without limit', essence: 'vastness' },
  time: { noun: 'deep time', active: 'enduring long after the moment passes', essence: 'permanence' },
  mystery: { noun: 'a held mystery', active: 'keeping something just beyond reach', essence: 'the unspoken' },
  harmony: { noun: 'true harmony', active: 'bringing opposing forces into balance', essence: 'balance' },
  strength: { noun: 'lasting strength', active: 'bearing weight without breaking', essence: 'endurance' },
  freedom: { noun: 'open freedom', active: 'moving without being held', essence: 'liberty' },
  vision: { noun: 'clear vision', active: 'seeing what others cannot yet see', essence: 'foresight' },
}

/**
 * Build a concept-first idea statement from a lead and (optional) supporting
 * concept — the sentence the word was "imagined to hold".
 */
export function ideaStatement(lead: Concept, support?: Concept): string {
  const l = IDEAS[lead]
  if (!support || support === lead) {
    return `${l.active}`
  }
  const s = IDEAS[support]
  return `${l.active}, in service of ${s.noun}`
}
