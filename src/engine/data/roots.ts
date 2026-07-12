import type { Root } from '../types'

/**
 * The linguistic engine's raw genetic material.
 *
 * Each entry is *inspired by* a real morpheme from a language family — its sound
 * shape and meaning — but the engine never emits these roots verbatim. It fuses
 * them, overlaps their phonemes and grows euphonic endings so the final word is
 * original while still following natural linguistic evolution.
 *
 * `position` is a soft hint: `head` roots read better at the start of a word,
 * `tail` roots as an ending, `any` works either way.
 */
export const ROOTS: Root[] = [
  // ── Latin ───────────────────────────────────────────────────────────────
  { form: 'lum', gloss: 'light', family: 'latin', concepts: ['light', 'vision', 'knowledge'], position: 'head' },
  { form: 'vera', gloss: 'truth', family: 'latin', concepts: ['trust', 'knowledge'], position: 'any' },
  { form: 'sana', gloss: 'healing', family: 'latin', concepts: ['healing', 'calm', 'human'], position: 'head' },
  { form: 'cura', gloss: 'care', family: 'latin', concepts: ['healing', 'trust', 'human'], position: 'any' },
  { form: 'nova', gloss: 'new', family: 'latin', concepts: ['future', 'creation'], position: 'tail' },
  { form: 'aura', gloss: 'breeze, glow', family: 'latin', concepts: ['light', 'calm', 'luxury'], position: 'tail' },
  { form: 'firm', gloss: 'steadfast', family: 'latin', concepts: ['trust', 'strength', 'order'], position: 'head' },
  { form: 'sol', gloss: 'sun', family: 'latin', concepts: ['light', 'fire', 'energy'], position: 'head' },
  { form: 'mont', gloss: 'mountain', family: 'latin', concepts: ['earth', 'strength'], position: 'head' },
  { form: 'clar', gloss: 'clear, bright', family: 'latin', concepts: ['light', 'precision', 'vision'], position: 'head' },
  { form: 'grav', gloss: 'weight, gravity', family: 'latin', concepts: ['power', 'depth'], position: 'head' },
  { form: 'ver', gloss: 'spring, green', family: 'latin', concepts: ['nature', 'creation'], position: 'head' },

  // ── Greek ───────────────────────────────────────────────────────────────
  { form: 'soph', gloss: 'wisdom', family: 'greek', concepts: ['knowledge', 'intelligence'], position: 'head' },
  { form: 'chron', gloss: 'time', family: 'greek', concepts: ['time', 'order'], position: 'head' },
  { form: 'phos', gloss: 'light', family: 'greek', concepts: ['light', 'vision'], position: 'head' },
  { form: 'gen', gloss: 'origin, birth', family: 'greek', concepts: ['creation', 'human'], position: 'any' },
  { form: 'therm', gloss: 'heat', family: 'greek', concepts: ['fire', 'energy'], position: 'head' },
  { form: 'aer', gloss: 'air', family: 'greek', concepts: ['sky', 'freedom'], position: 'head' },
  { form: 'cosm', gloss: 'order, universe', family: 'greek', concepts: ['order', 'sky', 'harmony'], position: 'head' },
  { form: 'bio', gloss: 'life', family: 'greek', concepts: ['nature', 'human', 'healing'], position: 'head' },
  { form: 'nous', gloss: 'mind', family: 'greek', concepts: ['intelligence', 'knowledge'], position: 'tail' },
  { form: 'arch', gloss: 'first, origin', family: 'greek', concepts: ['creation', 'order', 'power'], position: 'head' },
  { form: 'ther', gloss: 'wild, beast', family: 'greek', concepts: ['nature', 'strength'], position: 'tail' },
  { form: 'iris', gloss: 'rainbow', family: 'greek', concepts: ['light', 'vision', 'harmony'], position: 'tail' },

  // ── Sanskrit ────────────────────────────────────────────────────────────
  { form: 'veda', gloss: 'knowledge', family: 'sanskrit', concepts: ['knowledge', 'mystery'], position: 'tail' },
  { form: 'shanti', gloss: 'peace', family: 'sanskrit', concepts: ['calm', 'harmony'], position: 'tail' },
  { form: 'agni', gloss: 'fire', family: 'sanskrit', concepts: ['fire', 'energy'], position: 'head' },
  { form: 'jala', gloss: 'water', family: 'sanskrit', concepts: ['water', 'calm'], position: 'any' },
  { form: 'deva', gloss: 'radiant, divine', family: 'sanskrit', concepts: ['light', 'mystery', 'luxury'], position: 'tail' },
  { form: 'amrit', gloss: 'immortal nectar', family: 'sanskrit', concepts: ['healing', 'time', 'luxury'], position: 'head' },
  { form: 'surya', gloss: 'sun', family: 'sanskrit', concepts: ['light', 'fire', 'energy'], position: 'any' },
  { form: 'mani', gloss: 'jewel', family: 'sanskrit', concepts: ['luxury', 'light'], position: 'any' },
  { form: 'ananda', gloss: 'bliss', family: 'sanskrit', concepts: ['calm', 'harmony', 'human'], position: 'tail' },
  { form: 'ojas', gloss: 'vital energy', family: 'sanskrit', concepts: ['energy', 'strength', 'healing'], position: 'tail' },

  // ── Proto-Indo-European ───────────────────────────────────────────────────
  { form: 'dyeu', gloss: 'sky, day', family: 'proto-indo-european', concepts: ['sky', 'light'], position: 'head' },
  { form: 'wed', gloss: 'water', family: 'proto-indo-european', concepts: ['water', 'movement'], position: 'head' },
  { form: 'gene', gloss: 'genesis', family: 'proto-indo-european', concepts: ['creation', 'human'], position: 'head' },
  { form: 'leuk', gloss: 'brightness', family: 'proto-indo-european', concepts: ['light', 'vision'], position: 'head' },
  { form: 'ster', gloss: 'star', family: 'proto-indo-european', concepts: ['sky', 'light', 'vision'], position: 'any' },
  { form: 'ana', gloss: 'up, rising', family: 'proto-indo-european', concepts: ['elevation', 'movement'], position: 'tail' },
  { form: 'reg', gloss: 'order, rule', family: 'proto-indo-european', concepts: ['order', 'power', 'precision'], position: 'head' },

  // ── Old Norse ─────────────────────────────────────────────────────────────
  { form: 'fjall', gloss: 'mountain', family: 'old-norse', concepts: ['earth', 'strength'], position: 'head' },
  { form: 'skei', gloss: 'radiance', family: 'old-norse', concepts: ['light', 'energy'], position: 'head' },
  { form: 'vind', gloss: 'wind', family: 'old-norse', concepts: ['sky', 'movement', 'freedom'], position: 'head' },
  { form: 'norn', gloss: 'fate, weaver', family: 'old-norse', concepts: ['time', 'mystery', 'order'], position: 'tail' },
  { form: 'eld', gloss: 'fire', family: 'old-norse', concepts: ['fire', 'energy'], position: 'head' },
  { form: 'fross', gloss: 'frost', family: 'old-norse', concepts: ['calm', 'precision', 'depth'], position: 'head' },
  { form: 'saga', gloss: 'story', family: 'old-norse', concepts: ['knowledge', 'time', 'mystery'], position: 'tail' },

  // ── Celtic ────────────────────────────────────────────────────────────────
  { form: 'bran', gloss: 'raven', family: 'celtic', concepts: ['mystery', 'vision'], position: 'head' },
  { form: 'gwyn', gloss: 'white, blessed', family: 'celtic', concepts: ['light', 'trust', 'calm'], position: 'head' },
  { form: 'tir', gloss: 'land', family: 'celtic', concepts: ['earth', 'nature'], position: 'any' },
  { form: 'mor', gloss: 'sea', family: 'celtic', concepts: ['water', 'depth', 'freedom'], position: 'head' },
  { form: 'aval', gloss: 'apple, orchard', family: 'celtic', concepts: ['nature', 'healing', 'mystery'], position: 'tail' },
  { form: 'lyr', gloss: 'song, lyre', family: 'celtic', concepts: ['harmony', 'creation'], position: 'any' },

  // ── Japanese ──────────────────────────────────────────────────────────────
  { form: 'hikari', gloss: 'light', family: 'japanese', concepts: ['light', 'vision'], position: 'tail' },
  { form: 'sora', gloss: 'sky', family: 'japanese', concepts: ['sky', 'freedom', 'calm'], position: 'tail' },
  { form: 'kaze', gloss: 'wind', family: 'japanese', concepts: ['movement', 'freedom'], position: 'tail' },
  { form: 'yuki', gloss: 'snow', family: 'japanese', concepts: ['calm', 'precision'], position: 'tail' },
  { form: 'kai', gloss: 'ocean, meeting', family: 'japanese', concepts: ['water', 'unity'], position: 'any' },
  { form: 'hana', gloss: 'flower', family: 'japanese', concepts: ['nature', 'harmony'], position: 'tail' },
  { form: 'rei', gloss: 'grace, spirit', family: 'japanese', concepts: ['calm', 'mystery', 'luxury'], position: 'any' },
  { form: 'mori', gloss: 'forest', family: 'japanese', concepts: ['nature', 'depth', 'calm'], position: 'tail' },

  // ── Arabic ────────────────────────────────────────────────────────────────
  { form: 'nur', gloss: 'light', family: 'arabic', concepts: ['light', 'knowledge', 'trust'], position: 'head' },
  { form: 'sama', gloss: 'sky, heaven', family: 'arabic', concepts: ['sky', 'elevation'], position: 'any' },
  { form: 'safa', gloss: 'purity, clarity', family: 'arabic', concepts: ['calm', 'precision', 'trust'], position: 'any' },
  { form: 'qamar', gloss: 'moon', family: 'arabic', concepts: ['light', 'calm', 'mystery'], position: 'tail' },
  { form: 'zahr', gloss: 'blossom', family: 'arabic', concepts: ['nature', 'creation'], position: 'head' },
  { form: 'aman', gloss: 'safety, trust', family: 'arabic', concepts: ['trust', 'calm', 'human'], position: 'any' },

  // ── Hebrew ────────────────────────────────────────────────────────────────
  { form: 'or', gloss: 'light', family: 'hebrew', concepts: ['light', 'knowledge'], position: 'any' },
  { form: 'shalom', gloss: 'peace, wholeness', family: 'hebrew', concepts: ['calm', 'harmony', 'unity'], position: 'tail' },
  { form: 'nefesh', gloss: 'soul, breath', family: 'hebrew', concepts: ['human', 'creation'], position: 'tail' },
  { form: 'tikva', gloss: 'hope', family: 'hebrew', concepts: ['future', 'trust'], position: 'tail' },
  { form: 'ari', gloss: 'lion', family: 'hebrew', concepts: ['strength', 'power'], position: 'any' },

  // ── Finnish ───────────────────────────────────────────────────────────────
  { form: 'valo', gloss: 'light', family: 'finnish', concepts: ['light', 'vision'], position: 'tail' },
  { form: 'tahti', gloss: 'star', family: 'finnish', concepts: ['sky', 'vision', 'future'], position: 'tail' },
  { form: 'meri', gloss: 'sea', family: 'finnish', concepts: ['water', 'depth', 'freedom'], position: 'tail' },
  { form: 'lumi', gloss: 'snow', family: 'finnish', concepts: ['calm', 'precision'], position: 'tail' },
  { form: 'ilma', gloss: 'air, weather', family: 'finnish', concepts: ['sky', 'freedom'], position: 'tail' },
  { form: 'kulta', gloss: 'gold, dear', family: 'finnish', concepts: ['luxury', 'light'], position: 'tail' },
]
