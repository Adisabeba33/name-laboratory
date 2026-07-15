import type { ConceptVector } from '../types'

/**
 * Phrase → concept patterns.
 *
 * Keyword lookup alone reads a prompt shallowly: "becoming someone different
 * after surviving something that should have destroyed you" has almost no
 * concept-named keywords, so the old engine fell back to creation/light. These
 * patterns recover the *implied* meaning — the ideas behind the words — by
 * matching phrases and word-stems against the whole prompt.
 *
 * `any` is matched as case-insensitive substrings against the full prompt, so
 * include stems ("transform" catches transformed/transformation).
 */
export interface Pattern {
  any: string[]
  concepts: ConceptVector
}

export const PATTERNS: Pattern[] = [
  { any: ['surviv', 'outlast', 'made it through', 'pulled through', 'still here'], concepts: { survival: 1, resilience: 0.6 } },
  { any: ['destroy', 'destruction', 'ruin', 'shatter', 'annihilat', 'obliterat', 'wreck'], concepts: { destruction: 1 } },
  { any: ['should have destroyed', 'should have killed', 'should have ended', 'almost died', 'nearly died', 'meant to break', 'left for dead'], concepts: { destruction: 0.9, survival: 0.8, transcendence: 0.3 } },
  { any: ['become', 'becoming', 'someone else', 'someone different', 'completely different', 'no longer the same', 'never the same', 'different person', 'transform', 'metamorphos', 'changed into'], concepts: { transformation: 1, identity: 0.6, rebirth: 0.4 } },
  { any: ['reborn', 'rebirth', 'from the ashes', 'rise again', 'risen', 'born again', 'renewed', 'phoenix', 'new self', 'second self'], concepts: { rebirth: 1, transcendence: 0.4 } },
  { any: ['trauma', 'wound', 'scar', 'broken', 'broke me', 'shattered me', 'suffering', 'the pain', 'hurt'], concepts: { loss: 0.6, memory: 0.6, resilience: 0.5 } },
  { any: ['identity', 'who i am', 'who i was', 'former self', 'old self', 'true self', 'sense of self', 'myself'], concepts: { identity: 1 } },
  { any: ['death', ' die', 'dying', ' dead', 'mortal', 'the end of', 'ending'], concepts: { destruction: 0.5, transcendence: 0.4, mystery: 0.3 } },
  { any: ['grief', 'grieving', 'mourning', 'mourn', 'lost someone', 'passed away', 'bereave'], concepts: { grief: 0.9, loss: 0.8 } },
  { any: ['memory', 'memories', 'remember', 'remembering', 'the past', 'what remains', 'echoes of'], concepts: { memory: 0.9, time: 0.3 } },
  { any: ['shadow', 'darkness', 'the dark', 'the night', 'unseen', 'hidden side'], concepts: { shadow: 0.8, mystery: 0.4 } },
  { any: ['hope', 'hopeful', 'keep going', 'hold on', 'against all odds', 'never give up'], concepts: { hope: 0.8, resilience: 0.4 } },
  { any: ['courage', 'brave', 'bravery', 'fearless', 'despite fear', 'in spite of fear', 'dare'], concepts: { courage: 0.9 } },
  { any: ['longing', 'yearn', 'ache for', 'long for', 'nostalg', 'homesick', 'missing'], concepts: { longing: 0.9 } },
  { any: ['alone', 'lonely', 'solitude', 'isolation', 'on my own'], concepts: { longing: 0.4, shadow: 0.3, mystery: 0.3 } },
  { any: ['rise above', 'rose above', 'overcome', 'overcame', 'transcend', 'ascend', 'beyond limit', 'surpass'], concepts: { transcendence: 0.8, resilience: 0.4 } },
  { any: ['fire', 'flame', 'burned', 'burning', 'ash', 'ashes', 'forged', 'the furnace'], concepts: { destruction: 0.5, rebirth: 0.5, fire: 0.5 } },
  { any: ['strength', 'strong', 'unbreak', 'withstand', 'endur'], concepts: { resilience: 0.6, strength: 0.6 } },
  { any: ['freedom', 'free from', 'break free', 'liberat', 'unbound'], concepts: { freedom: 0.9, transcendence: 0.3 } },
  { any: ['love', 'beloved', 'heart', 'tender', 'devotion'], concepts: { human: 0.5, longing: 0.4 } },
  { any: ['growth', 'grow', 'bloom', 'flourish', 'evolve', 'becoming more'], concepts: { creation: 0.5, transformation: 0.5, nature: 0.4 } },
  { any: ['wisdom', 'wise', 'learned', 'understanding earned'], concepts: { knowledge: 0.7, time: 0.3 } },
  { any: ['peace', 'stillness', 'serenity', 'quiet mind', 'at rest'], concepts: { calm: 0.9, harmony: 0.4 } },
  // Cognitive / relational / communicative structures (Morutho fix §7) — these
  // recover recognition / understanding / communication / connection so a prompt
  // about "the same experience under different names" no longer falls to creation.
  // NOTE: `any` entries are matched as plain substrings, so no regex alternation.
  { any: ['realiz', 'realis', 'recogni', 'dawns on', 'it hits you', 'all along', 'meant the same', 'been the same', 'same thing all along'], concepts: { recognition: 1, understanding: 0.6 } },
  { any: ['different names', 'different words', 'under different', 'same experience', 'same thing', 'been calling', 'talking about the same', 'two words for', 'one experience'], concepts: { communication: 0.9, recognition: 0.8, connection: 0.5 } },
  { any: ['two people', 'between two', 'each other', 'one another', 'both of us', 'both of them', 'we both', 'they both', 'strangers'], concepts: { connection: 0.9, human: 0.4 } },
  { any: ['understand', 'understanding', 'make sense', 'made sense', 'comprehend', 'it clicked', 'finally understood', 'finally saw', 'grasp'], concepts: { understanding: 1 } },
  { any: ['shared experience', 'shared meaning', 'in common', 'relate to', 'related to', 'mutual', 'shareable', 'others have felt'], concepts: { connection: 0.8, understanding: 0.5 } },
  { any: ['inexpressible', 'unspeakable', 'no word for', 'becomes speakable', 'put into words', 'no name for'], concepts: { communication: 0.8, understanding: 0.5 } },
  { any: ['absurd', 'ridiculous', 'ironic', 'irony', 'the comedy of', 'private amusement', 'private joke', 'no one else finds', 'while everyone else'], concepts: { absurdity: 1, understanding: 0.3 } },
]
