/**
 * A bundled list of common words, for the OFFLINE half of the collision check.
 *
 * This is deliberately NOT a full dictionary — it is a few hundred everyday
 * English words in the phonetic register the synthesiser produces, so the engine
 * can honestly flag when a "coined" word is actually an ordinary word (or a very
 * near one) without any network call. It complements `known-words.ts` (which is
 * the synthesis blocklist of common words + famous brands). The authoritative,
 * up-to-date check is the LIVE lookup in `api/collision.ts`; this offline set only
 * catches the obvious cases for free, and its verdict is labelled as such.
 *
 * Honesty: a miss here means "not in our small built-in list", NEVER "verified
 * unused in the world". Only the live check can approach that (see PROJECT.md §8).
 */
export const COMMON_WORDS = new Set<string>([
  // everyday nouns
  'able', 'acre', 'aide', 'aim', 'alto', 'apex', 'aria', 'army', 'aroma', 'atlas',
  'aura', 'auto', 'axis', 'baby', 'band', 'bank', 'barn', 'base', 'bath', 'bay',
  'beam', 'bean', 'bear', 'bell', 'belt', 'bird', 'boat', 'bone', 'book', 'boot',
  'brand', 'bread', 'brick', 'bridge', 'brook', 'cabin', 'cable', 'cake', 'camp',
  'candle', 'cape', 'card', 'care', 'cargo', 'cart', 'cave', 'cell', 'chain',
  'chair', 'charm', 'chart', 'cheese', 'chime', 'city', 'clay', 'cliff', 'cloak',
  'cloud', 'clover', 'coal', 'coast', 'coin', 'comet', 'coral', 'core', 'corn',
  'cove', 'crane', 'crate', 'creek', 'crown', 'cube', 'dawn', 'deer', 'delta',
  'dew', 'dice', 'dock', 'dome', 'door', 'dove', 'dream', 'drum', 'dune', 'dust',
  'eagle', 'east', 'echo', 'ember', 'fable', 'fang', 'farm', 'fawn', 'fern',
  'field', 'flame', 'fleet', 'flint', 'flora', 'fog', 'foot', 'ford', 'forge',
  'fort', 'fox', 'frost', 'fruit', 'gale', 'gate', 'gem', 'glade', 'glass',
  'globe', 'glow', 'grain', 'grove', 'gulf', 'hail', 'hall', 'harbor', 'hare',
  'hawk', 'hazel', 'heart', 'hearth', 'heath', 'hill', 'hive', 'holly', 'home',
  'honey', 'hood', 'hope', 'horn', 'ice', 'iris', 'iron', 'isle', 'ivory', 'ivy',
  'jade', 'kite', 'lace', 'lagoon', 'lake', 'lamp', 'lane', 'lark', 'leaf',
  'ledge', 'lily', 'lime', 'linen', 'lion', 'loft', 'lotus', 'lynx', 'mane',
  'maple', 'marble', 'mare', 'marsh', 'mast', 'meadow', 'mesa', 'mica', 'mint',
  'mist', 'moat', 'moon', 'moss', 'moth', 'nectar', 'nest', 'node', 'north',
  'oak', 'oasis', 'ocean', 'olive', 'onyx', 'opal', 'orbit', 'otter', 'owl',
  'palm', 'pane', 'peak', 'pearl', 'pier', 'pine', 'plain', 'plume', 'pond',
  'pool', 'port', 'prism', 'quartz', 'quill', 'rain', 'raven', 'reed', 'reef',
  'ridge', 'rill', 'ripple', 'river', 'road', 'robin', 'rock', 'root', 'rose',
  'ruby', 'rune', 'sage', 'sail', 'sand', 'sea', 'seal', 'shade', 'shell',
  'shore', 'silk', 'silo', 'sky', 'slate', 'sleet', 'snow', 'soil', 'solstice',
  'song', 'south', 'spark', 'spire', 'spring', 'spruce', 'star', 'stem', 'stone',
  'storm', 'stream', 'summit', 'sun', 'swan', 'tide', 'tiger', 'topaz', 'torch',
  'tower', 'trail', 'tulip', 'tundra', 'vale', 'vapor', 'vault', 'vine', 'wave',
  'well', 'west', 'wharf', 'wheat', 'willow', 'wind', 'wing', 'wolf', 'wood',
  'wren', 'zephyr', 'zenith',
  // common adjectives / qualities
  'able', 'agile', 'ample', 'brave', 'bright', 'brisk', 'calm', 'clean', 'clear',
  'crisp', 'deep', 'fair', 'fine', 'firm', 'fond', 'free', 'fresh', 'glad',
  'grand', 'keen', 'kind', 'lush', 'mild', 'noble', 'pure', 'quiet', 'rare',
  'rich', 'ripe', 'sane', 'sleek', 'smart', 'soft', 'solid', 'swift', 'tender',
  'true', 'vast', 'vivid', 'warm', 'wise',
  // common given names that words can collide with
  'aria', 'clara', 'cora', 'daria', 'elena', 'lena', 'lira', 'lora', 'mara',
  'mira', 'nera', 'nina', 'nora', 'rena', 'sara', 'sela', 'sera', 'tara', 'vera',
])
