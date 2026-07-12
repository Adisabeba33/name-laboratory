import type { Concept } from '../types'

/**
 * Concept → idea vocabulary.
 *
 * Meaning must lead, etymology must recede. Each concept carries richer language
 * than its bare label so the passport can state an actual idea:
 *
 *  - `noun`     — how the concept names itself as an idea ("clarity", "quiet trust").
 *  - `active`   — what it does, as a verb phrase ("illuminating what was hidden").
 *  - `essence`  — a short evocative gloss for the lineage note.
 *  - `ruNoun`   — a natural Russian noun phrase (nominative case, so it composes
 *                 without grammatical agreement problems).
 *  - `ruEssence`— a natural Russian nominative phrase for the idea's essence.
 *
 * The Russian fields power a fluent parenthetical translation of each meaning —
 * idiomatic, not a word-for-word calque.
 */
export interface Idea {
  noun: string
  active: string
  essence: string
  ruNoun: string
  ruEssence: string
}

export const IDEAS: Record<Concept, Idea> = {
  knowledge: { noun: 'deep knowledge', active: 'gathering scattered knowing into one place', essence: 'the weight of what is understood', ruNoun: 'глубокое знание', ruEssence: 'вес понятого' },
  healing: { noun: 'quiet healing', active: 'making what was broken whole again', essence: 'restoration and repair', ruNoun: 'тихое исцеление', ruEssence: 'возвращение целостности' },
  future: { noun: 'the future', active: 'reaching toward what does not yet exist', essence: 'forward motion', ruNoun: 'будущее', ruEssence: 'движение к небывалому' },
  precision: { noun: 'precision', active: 'cutting cleanly through ambiguity', essence: 'exactness without waste', ruNoun: 'точность', ruEssence: 'ясность без лишнего' },
  calm: { noun: 'a settled calm', active: 'lowering the noise until only the signal remains', essence: 'stillness', ruNoun: 'спокойствие', ruEssence: 'тишина за шумом' },
  human: { noun: 'the human touch', active: 'keeping the person at the centre', essence: 'warmth and presence', ruNoun: 'человечность', ruEssence: 'тепло присутствия' },
  science: { noun: 'rigorous science', active: 'turning the unknown into the measured', essence: 'disciplined inquiry', ruNoun: 'строгая наука', ruEssence: 'мера непознанного' },
  trust: { noun: 'earned trust', active: 'holding steady when it matters most', essence: 'reliability', ruNoun: 'доверие', ruEssence: 'надёжность' },
  intelligence: { noun: 'living intelligence', active: 'illuminating what was hidden in complexity', essence: 'clarity of mind', ruNoun: 'живой интеллект', ruEssence: 'свет среди сложного' },
  power: { noun: 'quiet power', active: 'moving the world without strain', essence: 'force held in reserve', ruNoun: 'спокойная сила', ruEssence: 'мощь без усилия' },
  nature: { noun: 'the natural world', active: 'growing the way living things grow', essence: 'organic order', ruNoun: 'живая природа', ruEssence: 'естественный порядок' },
  light: { noun: 'clear light', active: 'revealing the shape of things', essence: 'illumination', ruNoun: 'ясный свет', ruEssence: 'проявление сути' },
  movement: { noun: 'pure movement', active: 'carrying momentum forward', essence: 'motion', ruNoun: 'движение', ruEssence: 'непрерывный ход' },
  order: { noun: 'hidden order', active: 'finding the pattern inside the noise', essence: 'structure', ruNoun: 'скрытый порядок', ruEssence: 'узор внутри хаоса' },
  elevation: { noun: 'quiet elevation', active: 'rising above the ordinary', essence: 'ascent', ruNoun: 'восхождение', ruEssence: 'подъём над обыденным' },
  depth: { noun: 'real depth', active: 'reaching beneath the surface', essence: 'the fathomless', ruNoun: 'настоящая глубина', ruEssence: 'то, что под поверхностью' },
  unity: { noun: 'wholeness', active: 'drawing many things into one', essence: 'togetherness', ruNoun: 'цельность', ruEssence: 'соединение многого в одно' },
  creation: { noun: 'the act of creation', active: 'bringing something new into being', essence: 'origination', ruNoun: 'созидание', ruEssence: 'рождение нового' },
  luxury: { noun: 'effortless luxury', active: 'making the rare feel natural', essence: 'refinement', ruNoun: 'лёгкая роскошь', ruEssence: 'естественность редкого' },
  energy: { noun: 'live energy', active: 'charging everything it touches', essence: 'vitality', ruNoun: 'живая энергия', ruEssence: 'заряд во всём' },
  water: { noun: 'moving water', active: 'flowing around every obstacle', essence: 'fluidity', ruNoun: 'текучая вода', ruEssence: 'путь в обход преград' },
  fire: { noun: 'contained fire', active: 'burning bright without consuming', essence: 'heat and drive', ruNoun: 'сдержанный огонь', ruEssence: 'жар без разрушения' },
  earth: { noun: 'solid earth', active: 'holding firm beneath everything', essence: 'groundedness', ruNoun: 'твёрдая земля', ruEssence: 'опора под всем' },
  sky: { noun: 'the open sky', active: 'expanding without limit', essence: 'vastness', ruNoun: 'открытое небо', ruEssence: 'простор без границ' },
  time: { noun: 'deep time', active: 'enduring long after the moment passes', essence: 'permanence', ruNoun: 'глубокое время', ruEssence: 'то, что остаётся' },
  mystery: { noun: 'a held mystery', active: 'keeping something just beyond reach', essence: 'the unspoken', ruNoun: 'тайна', ruEssence: 'недосказанность' },
  harmony: { noun: 'true harmony', active: 'bringing opposing forces into balance', essence: 'balance', ruNoun: 'гармония', ruEssence: 'равновесие сил' },
  strength: { noun: 'lasting strength', active: 'bearing weight without breaking', essence: 'endurance', ruNoun: 'прочная сила', ruEssence: 'стойкость под грузом' },
  freedom: { noun: 'open freedom', active: 'moving without being held', essence: 'liberty', ruNoun: 'свобода', ruEssence: 'движение без пут' },
  vision: { noun: 'clear vision', active: 'seeing what others cannot yet see', essence: 'foresight', ruNoun: 'ясное видение', ruEssence: 'взгляд за горизонт' },
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
