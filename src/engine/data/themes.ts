import type { Concept, ConceptNode, SemanticTension } from '../types'

/**
 * Meaning themes — recognised human ideas.
 *
 * When a request's concept map clusters around a known human theme, the
 * laboratory can state a genuinely deep interpretation, name the hidden concepts,
 * draw the concept network, and steer toward the languages whose philosophy fits.
 * Unrecognised prompts fall back to a generic interpretation built from the
 * dominant concepts (see meaning.ts).
 */
export interface Theme {
  id: string
  name: string
  /** At least one of these must be present for the theme to apply. */
  core: Concept[]
  /** Concepts whose summed weight scores the theme (higher = stronger match). */
  triggers: Concept[]
  interpretation: string
  interpretationRu: string
  hiddenConcepts: ConceptNode[]
  network: ConceptNode[]
  /** The opposing forces the theme lives between. */
  tensions: SemanticTension[]
  /** Languages (by id) whose philosophy fits this theme. */
  preferredLanguages: string[]
}

export const THEMES: Theme[] = [
  {
    id: 'metamorphosis',
    name: 'Metamorphosis',
    core: ['transformation', 'rebirth'],
    triggers: ['transformation', 'rebirth', 'destruction', 'survival', 'identity', 'resilience'],
    interpretation:
      'This request is not primarily about survival. It is about irreversible identity transformation after destruction — becoming someone who can never return to who they were. The emotional centre is not fear, but the quiet finality of that change.',
    interpretationRu:
      'Речь здесь не столько о выживании, сколько о необратимом преображении личности после разрушения — о превращении в того, кто уже никогда не вернётся к себе прежнему. Эмоциональный центр — не страх, а тихая окончательность этой перемены.',
    hiddenConcepts: [
      { en: 'Death without dying', ru: 'Смерть без смерти' },
      { en: 'Identity reborn', ru: 'Возрождённая личность' },
      { en: "Survivor's metamorphosis", ru: 'Метаморфоза уцелевшего' },
      { en: 'The scar-born self', ru: 'Я, рождённое из шрама' },
      { en: 'Permanent becoming', ru: 'Необратимое становление' },
      { en: 'The second self', ru: 'Второе «я»' },
    ],
    network: [
      { en: 'Destruction', ru: 'Разрушение' },
      { en: 'Survival', ru: 'Выживание' },
      { en: 'Transformation', ru: 'Преображение' },
      { en: 'Identity', ru: 'Личность' },
      { en: 'Rebirth', ru: 'Возрождение' },
      { en: 'Purpose', ru: 'Смысл' },
      { en: 'Wisdom', ru: 'Мудрость' },
    ],
    tensions: [
      {
        a: 'Survival', aRu: 'Выживание', b: 'Identity death', bRu: 'Смерть личности',
        note: 'Alive, but no longer the same person.',
        noteRu: 'Жив, но уже не тот же человек.',
      },
      {
        a: 'Strength', aRu: 'Сила', b: 'Grief', bRu: 'Скорбь',
        note: 'Stronger now, but permanently marked by what it cost.',
        noteRu: 'Теперь сильнее, но навсегда отмечен тем, чего это стоило.',
      },
      {
        a: 'Rebirth', aRu: 'Возрождение', b: 'Damage', bRu: 'Разрушение',
        note: 'Reborn, yet carrying the memory of the destruction that made it.',
        noteRu: 'Возрождён — и всё же несёт память о разрушении, что его создало.',
      },
    ],
    preferredLanguages: ['ashen', 'phoenix', 'obsidian', 'chrysalis'],
  },
  {
    id: 'grief',
    name: 'Grief & Loss',
    core: ['grief', 'loss'],
    triggers: ['grief', 'loss', 'memory', 'longing'],
    interpretation:
      'At its centre this is not sadness but love with nowhere left to go — the way an absence keeps reshaping everything that remains. It is about carrying what can no longer be held.',
    interpretationRu:
      'В центре здесь не грусть, а любовь, которой больше некуда идти — то, как утрата продолжает менять форму всего, что осталось. Это о том, как нести то, что уже нельзя удержать.',
    hiddenConcepts: [
      { en: 'Love after loss', ru: 'Любовь после утраты' },
      { en: 'The shape of absence', ru: 'Форма пустоты' },
      { en: 'What memory keeps', ru: 'Что хранит память' },
      { en: 'Tenderness toward the gone', ru: 'Нежность к ушедшему' },
      { en: 'The weight we carry', ru: 'Ноша, которую несут' },
    ],
    network: [
      { en: 'Loss', ru: 'Утрата' },
      { en: 'Grief', ru: 'Скорбь' },
      { en: 'Memory', ru: 'Память' },
      { en: 'Longing', ru: 'Тоска' },
      { en: 'Acceptance', ru: 'Принятие' },
      { en: 'Peace', ru: 'Покой' },
    ],
    tensions: [
      {
        a: 'Love', aRu: 'Любовь', b: 'Absence', bRu: 'Отсутствие',
        note: 'Love that continues with nowhere left to go.',
        noteRu: 'Любовь, которой больше некуда идти.',
      },
      {
        a: 'Holding on', aRu: 'Удержать', b: 'Letting go', bRu: 'Отпустить',
        note: 'Carrying what can no longer be held.',
        noteRu: 'Нести то, что уже нельзя удержать.',
      },
      {
        a: 'Memory', aRu: 'Память', b: 'Time passing', bRu: 'Ход времени',
        note: 'Keeping someone present as everything else moves on.',
        noteRu: 'Хранить кого-то рядом, пока всё остальное идёт дальше.',
      },
    ],
    preferredLanguages: ['ashen', 'obsidian', 'chrysalis'],
  },
  {
    id: 'resilience',
    name: 'Resilience & Courage',
    core: ['resilience', 'courage', 'survival'],
    triggers: ['resilience', 'courage', 'survival', 'strength', 'hope'],
    interpretation:
      'This is about the strength that only appears under pressure — going forward while still afraid, bending without breaking. Its centre is not the hardship but who you become by withstanding it.',
    interpretationRu:
      'Это о силе, что проявляется только под давлением — о том, чтобы идти вперёд, всё ещё боясь, гнуться, но не ломаться. Центр здесь — не сами трудности, а тот, кем ты становишься, выдержав их.',
    hiddenConcepts: [
      { en: 'Strength from hardship', ru: 'Сила из трудностей' },
      { en: 'Forward through fear', ru: 'Вперёд сквозь страх' },
      { en: 'Unbroken under weight', ru: 'Несломленность под грузом' },
      { en: 'The tempered self', ru: 'Закалённое «я»' },
    ],
    network: [
      { en: 'Struggle', ru: 'Борьба' },
      { en: 'Courage', ru: 'Мужество' },
      { en: 'Endurance', ru: 'Стойкость' },
      { en: 'Strength', ru: 'Сила' },
      { en: 'Purpose', ru: 'Смысл' },
    ],
    tensions: [
      {
        a: 'Fear', aRu: 'Страх', b: 'Courage', bRu: 'Мужество',
        note: 'Moving forward while still afraid.',
        noteRu: 'Идти вперёд, всё ещё боясь.',
      },
      {
        a: 'Pressure', aRu: 'Давление', b: 'Endurance', bRu: 'Стойкость',
        note: 'Bending under the weight without breaking.',
        noteRu: 'Гнуться под грузом, но не ломаться.',
      },
      {
        a: 'Hardship', aRu: 'Испытание', b: 'Becoming', bRu: 'Становление',
        note: 'The point is not the hardship but who you become by withstanding it.',
        noteRu: 'Дело не в самих трудностях, а в том, кем ты становишься, выдержав их.',
      },
    ],
    preferredLanguages: ['obsidian', 'ashen', 'phoenix'],
  },
]
