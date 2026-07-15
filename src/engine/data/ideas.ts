import type { Concept } from '../types'

/**
 * Concept → idea vocabulary.
 *
 * Meaning must be understandable *and* reach the emotional core. Each concept
 * carries:
 *  - `label` / `labelRu` — a short name for concept networks and hidden concepts.
 *  - `def` / `defRu`     — a clear one-line definition (the word's meaning).
 *  - `noun` / `active` / `essence` — poetic material for the "why it exists"
 *    explanation and the lineage note.
 *
 * The deep/emotional concepts carry deliberately evocative definitions so a word
 * built around them lands on the human core ("a person who no longer resembles
 * the one who entered the fire") rather than a flat gloss.
 */
export interface Idea {
  label: string
  labelRu: string
  def: string
  defRu: string
  noun: string
  active: string
  essence: string
}

export const IDEAS: Record<Concept, Idea> = {
  knowledge: { label: 'Knowledge', labelRu: 'Знание', def: 'a deep understanding gathered from many places', defRu: 'глубокое понимание, собранное из многих источников', noun: 'deep knowledge', active: 'gathering scattered knowing into one place', essence: 'the weight of what is understood' },
  healing: { label: 'Healing', labelRu: 'Исцеление', def: 'the power to make what was broken whole again', defRu: 'способность возвращать целостность тому, что было разрушено', noun: 'quiet healing', active: 'making what was broken whole again', essence: 'restoration and repair' },
  future: { label: 'Future', labelRu: 'Будущее', def: 'a reach toward what does not exist yet', defRu: 'устремление к тому, чего ещё не существует', noun: 'the future', active: 'reaching toward what does not yet exist', essence: 'forward motion' },
  precision: { label: 'Precision', labelRu: 'Точность', def: 'the skill of getting something exactly right, with nothing wasted', defRu: 'умение делать точно и без лишнего', noun: 'precision', active: 'cutting cleanly through ambiguity', essence: 'exactness without waste' },
  calm: { label: 'Calm', labelRu: 'Спокойствие', def: 'a deep steadiness that quiets the noise around it', defRu: 'глубокое спокойствие, что заглушает шум вокруг', noun: 'a settled calm', active: 'lowering the noise until only the signal remains', essence: 'stillness' },
  human: { label: 'Humanity', labelRu: 'Человечность', def: 'a warmth that keeps the person at the centre', defRu: 'теплота, что ставит человека в центр', noun: 'the human touch', active: 'keeping the person at the centre', essence: 'warmth and presence' },
  science: { label: 'Science', labelRu: 'Наука', def: 'the discipline of turning the unknown into the measured', defRu: 'строгость, что превращает неизвестное в измеримое', noun: 'rigorous science', active: 'turning the unknown into the measured', essence: 'disciplined inquiry' },
  trust: { label: 'Trust', labelRu: 'Доверие', def: 'a reliability you can lean on when it matters', defRu: 'надёжность, на которую можно опереться в важный момент', noun: 'earned trust', active: 'holding steady when it matters most', essence: 'reliability' },
  intelligence: { label: 'Intelligence', labelRu: 'Интеллект', def: 'a clear mind that finds order where others see chaos', defRu: 'ясный ум, который находит порядок там, где другие видят хаос', noun: 'living intelligence', active: 'illuminating what was hidden in complexity', essence: 'clarity of mind' },
  power: { label: 'Power', labelRu: 'Сила', def: 'a strength that moves things without strain', defRu: 'сила, что движет всё без напряжения', noun: 'quiet power', active: 'moving the world without strain', essence: 'force held in reserve' },
  nature: { label: 'Nature', labelRu: 'Природа', def: 'the living, growing order of the natural world', defRu: 'живой, растущий порядок природы', noun: 'the natural world', active: 'growing the way living things grow', essence: 'organic order' },
  light: { label: 'Light', labelRu: 'Свет', def: 'a clarity that reveals the true shape of things', defRu: 'ясность, что открывает истинную форму вещей', noun: 'clear light', active: 'revealing the shape of things', essence: 'illumination' },
  movement: { label: 'Movement', labelRu: 'Движение', def: 'a steady momentum that keeps moving forward', defRu: 'ровное движение, что не останавливается', noun: 'pure movement', active: 'carrying momentum forward', essence: 'motion' },
  order: { label: 'Order', labelRu: 'Порядок', def: 'the hidden pattern found inside the noise', defRu: 'скрытый узор, найденный внутри хаоса', noun: 'hidden order', active: 'finding the pattern inside the noise', essence: 'structure' },
  elevation: { label: 'Elevation', labelRu: 'Восхождение', def: 'a quiet rise above the ordinary', defRu: 'тихий подъём над обыденным', noun: 'quiet elevation', active: 'rising above the ordinary', essence: 'ascent' },
  depth: { label: 'Depth', labelRu: 'Глубина', def: 'a reach far beneath the surface', defRu: 'проникновение далеко под поверхность', noun: 'real depth', active: 'reaching beneath the surface', essence: 'the fathomless' },
  unity: { label: 'Unity', labelRu: 'Единство', def: 'the drawing of many things into one whole', defRu: 'соединение многого в единое целое', noun: 'wholeness', active: 'drawing many things into one', essence: 'togetherness' },
  creation: { label: 'Creation', labelRu: 'Созидание', def: 'the act of bringing something new into being', defRu: 'рождение чего-то нового', noun: 'the act of creation', active: 'bringing something new into being', essence: 'origination' },
  luxury: { label: 'Luxury', labelRu: 'Роскошь', def: 'an effortless refinement that makes the rare feel natural', defRu: 'лёгкая изысканность, что делает редкое естественным', noun: 'effortless luxury', active: 'making the rare feel natural', essence: 'refinement' },
  energy: { label: 'Energy', labelRu: 'Энергия', def: 'a live charge that animates everything it touches', defRu: 'живой заряд, что оживляет всё вокруг', noun: 'live energy', active: 'charging everything it touches', essence: 'vitality' },
  water: { label: 'Water', labelRu: 'Вода', def: 'a fluid ease that flows around every obstacle', defRu: 'текучая лёгкость, что обходит любые преграды', noun: 'moving water', active: 'flowing around every obstacle', essence: 'fluidity' },
  fire: { label: 'Fire', labelRu: 'Огонь', def: 'a contained heat that burns bright without consuming', defRu: 'сдержанный жар, что горит ярко, но не разрушает', noun: 'contained fire', active: 'burning bright without consuming', essence: 'heat and drive' },
  earth: { label: 'Earth', labelRu: 'Земля', def: 'a solid ground that holds firm beneath everything', defRu: 'твёрдая опора, что держит всё под собой', noun: 'solid earth', active: 'holding firm beneath everything', essence: 'groundedness' },
  sky: { label: 'Sky', labelRu: 'Небо', def: 'an open expanse that stretches without limit', defRu: 'открытый простор без границ', noun: 'the open sky', active: 'expanding without limit', essence: 'vastness' },
  time: { label: 'Time', labelRu: 'Время', def: 'an endurance that lasts long after the moment passes', defRu: 'постоянство, что остаётся, когда миг прошёл', noun: 'deep time', active: 'enduring long after the moment passes', essence: 'permanence' },
  mystery: { label: 'Mystery', labelRu: 'Тайна', def: 'something meaningful kept just beyond reach', defRu: 'нечто важное, оставленное недосказанным', noun: 'a held mystery', active: 'keeping something just beyond reach', essence: 'the unspoken' },
  harmony: { label: 'Harmony', labelRu: 'Гармония', def: 'a balance that brings opposing forces together', defRu: 'равновесие, что соединяет противоположности', noun: 'true harmony', active: 'bringing opposing forces into balance', essence: 'balance' },
  strength: { label: 'Strength', labelRu: 'Стойкость', def: 'an endurance that bears weight without breaking', defRu: 'стойкость, что несёт груз, не ломаясь', noun: 'lasting strength', active: 'bearing weight without breaking', essence: 'endurance' },
  freedom: { label: 'Freedom', labelRu: 'Свобода', def: 'a freedom to move without being held', defRu: 'свобода двигаться без пут', noun: 'open freedom', active: 'moving without being held', essence: 'liberty' },
  vision: { label: 'Vision', labelRu: 'Видение', def: 'the foresight to see what others cannot yet see', defRu: 'дальновидность видеть то, чего другие ещё не видят', noun: 'clear vision', active: 'seeing what others cannot yet see', essence: 'foresight' },

  // ── Deep / emotional / philosophical concepts ─────────────────────────────
  transformation: { label: 'Transformation', labelRu: 'Преображение', def: 'the self that is left after everything else has burned away', defRu: 'то, что остаётся от человека, когда всё остальное сгорело', noun: 'irreversible transformation', active: 'becoming someone the past cannot survive into', essence: 'irreversible change' },
  rebirth: { label: 'Rebirth', labelRu: 'Возрождение', def: 'a person who no longer resembles the one who entered the fire', defRu: 'человек, который больше не похож на того, кто вошёл в огонь', noun: 'a hard rebirth', active: 'rising as someone new from what ended you', essence: 'rising anew' },
  survival: { label: 'Survival', labelRu: 'Выживание', def: 'what remains standing after what should have ended it', defRu: 'то, что уцелело после того, что должно было всё оборвать', noun: 'hard survival', active: 'enduring past the point that should have been the end', essence: 'enduring the unendurable' },
  destruction: { label: 'Destruction', labelRu: 'Разрушение', def: 'the ending that clears the ground for what comes next', defRu: 'разрушение, что расчищает место для нового', noun: 'necessary destruction', active: 'breaking down what can no longer hold', essence: 'the clearing ending' },
  identity: { label: 'Identity', labelRu: 'Личность', def: 'the self that persists even when everything else changes', defRu: 'то «я», что остаётся, когда меняется всё вокруг', noun: 'the self', active: 'holding a self together through change', essence: 'who one truly is' },
  resilience: { label: 'Resilience', labelRu: 'Устойчивость', def: 'the strength that grows out of what tried to break you', defRu: 'сила, что вырастает из того, что пыталось тебя сломать', noun: 'quiet resilience', active: 'bending without breaking', essence: 'strength from hardship' },
  loss: { label: 'Loss', labelRu: 'Утрата', def: 'the absence that reshapes everything around it', defRu: 'утрата, что меняет форму всего вокруг', noun: 'deep loss', active: 'carrying what is no longer there', essence: 'what is gone but felt' },
  memory: { label: 'Memory', labelRu: 'Память', def: 'what the body keeps long after the mind moves on', defRu: 'то, что тело хранит, когда разум уже отпустил', noun: 'kept memory', active: 'holding what time tries to erase', essence: 'the past that stays' },
  shadow: { label: 'Shadow', labelRu: 'Тень', def: 'the part of the self that was shaped in darkness', defRu: 'часть себя, рождённая в темноте', noun: 'the shadow self', active: 'carrying the dark that made you', essence: 'the hidden half' },
  transcendence: { label: 'Transcendence', labelRu: 'Превосхождение', def: 'rising past the limit that once defined you', defRu: 'выход за предел, что когда-то тебя определял', noun: 'transcendence', active: 'moving beyond what once contained you', essence: 'beyond the old limit' },
  longing: { label: 'Longing', labelRu: 'Тоска', def: 'a reaching for something just out of reach', defRu: 'тяга к тому, что чуть дальше, чем можно достать', noun: 'quiet longing', active: 'reaching for what stays just beyond', essence: 'yearning' },
  courage: { label: 'Courage', labelRu: 'Мужество', def: 'the choice to go forward while still afraid', defRu: 'выбор идти вперёд, всё ещё боясь', noun: 'quiet courage', active: 'moving forward through fear', essence: 'brave in spite of fear' },
  grief: { label: 'Grief', labelRu: 'Скорбь', def: 'love with nowhere left to go', defRu: 'любовь, которой больше некуда идти', noun: 'carried grief', active: 'loving what can no longer be held', essence: 'love after loss' },
  hope: { label: 'Hope', labelRu: 'Надежда', def: 'a light kept alive against the odds', defRu: 'свет, что хранят вопреки всему', noun: 'stubborn hope', active: 'believing in what is not yet visible', essence: 'faith in what may come' },
  recognition: { label: 'Recognition', labelRu: 'Узнавание', def: 'the sudden click of seeing that two things were the same all along', defRu: 'внезапное узнавание того, что две вещи были одним и тем же', noun: 'the moment of recognition', active: 'seeing at last that two things are one', essence: 'the click of seeing clearly' },
  understanding: { label: 'Understanding', labelRu: 'Понимание', def: 'the moment a meaning finally comes into focus', defRu: 'миг, когда смысл наконец проясняется', noun: 'shared understanding', active: 'grasping what was there but unseen', essence: 'sense made at last' },
  communication: { label: 'Communication', labelRu: 'Общение', def: 'meaning carried between people through words and names', defRu: 'смысл, что передаётся между людьми через слова и имена', noun: 'the bridge of words', active: 'carrying meaning across the gap between minds', essence: 'meaning passed between people' },
  connection: { label: 'Connection', labelRu: 'Связь', def: 'the quiet bond of being understood by another', defRu: 'тихая связь того, что тебя понимает другой', noun: 'the bond between two', active: 'meeting another in shared meaning', essence: 'understood by another' },
  absurdity: { label: 'Absurdity', labelRu: 'Абсурд', def: 'the quiet comedy of a situation no one else finds funny', defRu: 'тихая комедия положения, которое больше никто не находит смешным', noun: 'the private absurd', active: 'seeing the comedy others miss', essence: 'the comic seen alone' },
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
