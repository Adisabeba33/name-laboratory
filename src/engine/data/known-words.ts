/**
 * A small blocklist for the novelty check.
 *
 * The system should avoid re-inventing words that already exist. This is not a
 * full dictionary — the MVP checks against common English words, the source roots
 * themselves, and a set of famous brand names so the engine doesn't accidentally
 * hand back "Sony" or "healer". A future version swaps this for a real dictionary
 * plus trademark/domain APIs (see the Word Genome roadmap).
 */
export const KNOWN_WORDS = new Set<string>([
  // Common English words that share the engine's phonetic register.
  'aura', 'nova', 'clarity', 'lumen', 'solar', 'vera', 'cure', 'care', 'heal',
  'healer', 'health', 'human', 'nature', 'natural', 'energy', 'vision', 'order',
  'harmony', 'unity', 'water', 'ocean', 'fire', 'earth', 'sky', 'time', 'light',
  'star', 'wind', 'snow', 'gold', 'moon', 'sun', 'sea', 'song', 'story', 'saga',
  'lion', 'raven', 'forest', 'flower', 'peace', 'hope', 'soul', 'grace', 'wisdom',
  'science', 'medicine', 'future', 'power', 'freedom', 'depth', 'motion', 'growth',
  'balance', 'clear', 'pure', 'bright', 'trust', 'calm', 'noble', 'lyric', 'iris',
  'mint', 'coral', 'amber', 'ivory', 'pearl', 'onyx', 'jade', 'opal',
  // Famous brand names to steer clear of.
  'google', 'kodak', 'sony', 'apple', 'amazon', 'tesla', 'nike', 'adobe', 'intel',
  'oracle', 'cisco', 'nokia', 'canon', 'nikon', 'lego', 'ikea', 'zara', 'gucci',
  'prada', 'chanel', 'rolex', 'omega', 'pfizer', 'moderna', 'bayer', 'roche',
  'verizon', 'sprint', 'uber', 'lyft', 'stripe', 'square', 'slack', 'zoom',
  'spotify', 'netflix', 'disney', 'marvel', 'lexus', 'audi', 'volvo', 'mazda',
])
