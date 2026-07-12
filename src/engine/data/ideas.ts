import type { Concept } from '../types'

/**
 * Concept → idea vocabulary.
 *
 * Meaning must be *understandable*, not just evocative. Each concept therefore
 * carries a plain, dictionary-style definition (EN + a fluent, idiomatic RU) that
 * says what a word built around it actually means. The older poetic fields are
 * kept for the "why it exists" explanation and the lineage note:
 *
 *  - `def` / `defRu` — a clear one-line definition (the word's meaning).
 *  - `noun`         — how the concept names itself as an idea (used in explanations).
 *  - `active`       — what it does, as a verb phrase (used in explanations).
 *  - `essence`      — a short gloss for the lineage note.
 */
export interface Idea {
  def: string
  defRu: string
  noun: string
  active: string
  essence: string
}

export const IDEAS: Record<Concept, Idea> = {
  knowledge: { def: 'a deep understanding gathered from many places', defRu: 'глубокое понимание, собранное из многих источников', noun: 'deep knowledge', active: 'gathering scattered knowing into one place', essence: 'the weight of what is understood' },
  healing: { def: 'the power to make what was broken whole again', defRu: 'способность возвращать целостность тому, что было разрушено', noun: 'quiet healing', active: 'making what was broken whole again', essence: 'restoration and repair' },
  future: { def: 'a reach toward what does not exist yet', defRu: 'устремление к тому, чего ещё не существует', noun: 'the future', active: 'reaching toward what does not yet exist', essence: 'forward motion' },
  precision: { def: 'the skill of getting something exactly right, with nothing wasted', defRu: 'умение делать точно и без лишнего', noun: 'precision', active: 'cutting cleanly through ambiguity', essence: 'exactness without waste' },
  calm: { def: 'a deep steadiness that quiets the noise around it', defRu: 'глубокое спокойствие, что заглушает шум вокруг', noun: 'a settled calm', active: 'lowering the noise until only the signal remains', essence: 'stillness' },
  human: { def: 'a warmth that keeps the person at the centre', defRu: 'теплота, что ставит человека в центр', noun: 'the human touch', active: 'keeping the person at the centre', essence: 'warmth and presence' },
  science: { def: 'the discipline of turning the unknown into the measured', defRu: 'строгость, что превращает неизвестное в измеримое', noun: 'rigorous science', active: 'turning the unknown into the measured', essence: 'disciplined inquiry' },
  trust: { def: 'a reliability you can lean on when it matters', defRu: 'надёжность, на которую можно опереться в важный момент', noun: 'earned trust', active: 'holding steady when it matters most', essence: 'reliability' },
  intelligence: { def: 'a clear mind that finds order where others see chaos', defRu: 'ясный ум, который находит порядок там, где другие видят хаос', noun: 'living intelligence', active: 'illuminating what was hidden in complexity', essence: 'clarity of mind' },
  power: { def: 'a strength that moves things without strain', defRu: 'сила, что движет всё без напряжения', noun: 'quiet power', active: 'moving the world without strain', essence: 'force held in reserve' },
  nature: { def: 'the living, growing order of the natural world', defRu: 'живой, растущий порядок природы', noun: 'the natural world', active: 'growing the way living things grow', essence: 'organic order' },
  light: { def: 'a clarity that reveals the true shape of things', defRu: 'ясность, что открывает истинную форму вещей', noun: 'clear light', active: 'revealing the shape of things', essence: 'illumination' },
  movement: { def: 'a steady momentum that keeps moving forward', defRu: 'ровное движение, что не останавливается', noun: 'pure movement', active: 'carrying momentum forward', essence: 'motion' },
  order: { def: 'the hidden pattern found inside the noise', defRu: 'скрытый узор, найденный внутри хаоса', noun: 'hidden order', active: 'finding the pattern inside the noise', essence: 'structure' },
  elevation: { def: 'a quiet rise above the ordinary', defRu: 'тихий подъём над обыденным', noun: 'quiet elevation', active: 'rising above the ordinary', essence: 'ascent' },
  depth: { def: 'a reach far beneath the surface', defRu: 'проникновение далеко под поверхность', noun: 'real depth', active: 'reaching beneath the surface', essence: 'the fathomless' },
  unity: { def: 'the drawing of many things into one whole', defRu: 'соединение многого в единое целое', noun: 'wholeness', active: 'drawing many things into one', essence: 'togetherness' },
  creation: { def: 'the act of bringing something new into being', defRu: 'рождение чего-то нового', noun: 'the act of creation', active: 'bringing something new into being', essence: 'origination' },
  luxury: { def: 'an effortless refinement that makes the rare feel natural', defRu: 'лёгкая изысканность, что делает редкое естественным', noun: 'effortless luxury', active: 'making the rare feel natural', essence: 'refinement' },
  energy: { def: 'a live charge that animates everything it touches', defRu: 'живой заряд, что оживляет всё вокруг', noun: 'live energy', active: 'charging everything it touches', essence: 'vitality' },
  water: { def: 'a fluid ease that flows around every obstacle', defRu: 'текучая лёгкость, что обходит любые преграды', noun: 'moving water', active: 'flowing around every obstacle', essence: 'fluidity' },
  fire: { def: 'a contained heat that burns bright without consuming', defRu: 'сдержанный жар, что горит ярко, но не разрушает', noun: 'contained fire', active: 'burning bright without consuming', essence: 'heat and drive' },
  earth: { def: 'a solid ground that holds firm beneath everything', defRu: 'твёрдая опора, что держит всё под собой', noun: 'solid earth', active: 'holding firm beneath everything', essence: 'groundedness' },
  sky: { def: 'an open expanse that stretches without limit', defRu: 'открытый простор без границ', noun: 'the open sky', active: 'expanding without limit', essence: 'vastness' },
  time: { def: 'an endurance that lasts long after the moment passes', defRu: 'постоянство, что остаётся, когда миг прошёл', noun: 'deep time', active: 'enduring long after the moment passes', essence: 'permanence' },
  mystery: { def: 'something meaningful kept just beyond reach', defRu: 'нечто важное, оставленное недосказанным', noun: 'a held mystery', active: 'keeping something just beyond reach', essence: 'the unspoken' },
  harmony: { def: 'a balance that brings opposing forces together', defRu: 'равновесие, что соединяет противоположности', noun: 'true harmony', active: 'bringing opposing forces into balance', essence: 'balance' },
  strength: { def: 'an endurance that bears weight without breaking', defRu: 'стойкость, что несёт груз, не ломаясь', noun: 'lasting strength', active: 'bearing weight without breaking', essence: 'endurance' },
  freedom: { def: 'a freedom to move without being held', defRu: 'свобода двигаться без пут', noun: 'open freedom', active: 'moving without being held', essence: 'liberty' },
  vision: { def: 'the foresight to see what others cannot yet see', defRu: 'дальновидность видеть то, чего другие ещё не видят', noun: 'clear vision', active: 'seeing what others cannot yet see', essence: 'foresight' },
}

/**
 * Build a concept-first idea statement from a lead and (optional) supporting
 * concept — used by the "why it exists" explanation.
 */
export function ideaStatement(lead: Concept, support?: Concept): string {
  const l = IDEAS[lead]
  if (!support || support === lead) return l.active
  return `${l.active}, in service of ${IDEAS[support].noun}`
}
