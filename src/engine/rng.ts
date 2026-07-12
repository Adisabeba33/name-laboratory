/**
 * A tiny deterministic RNG (mulberry32).
 *
 * Generation must be reproducible: the same request + seed always yields the same
 * words, so results are shareable and the engine is unit-testable. `Math.random`
 * is deliberately never used in the engine.
 */
export class Rng {
  private state: number

  constructor(seed: number) {
    // Ensure a non-zero 32-bit state.
    this.state = (seed >>> 0) || 0x9e3779b9
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Integer in [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max)
  }

  /** Pick a random element. */
  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)]
  }

  /** Return a shuffled copy (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[] {
    const arr = [...items]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1)
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
}

/** Derive a stable numeric seed from an arbitrary string. */
export function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
