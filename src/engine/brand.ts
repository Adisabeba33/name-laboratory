import type { BrandFit, EmotionalDNA } from './types'

/**
 * Estimate which industries a word naturally fits — and which it doesn't.
 *
 * Each industry has an ideal emotional profile. We score the word's emotional DNA
 * against every industry's profile; the best fits become "excellent for", the
 * worst become "poor fit". This mirrors the vision's brand-matching section
 * ("Excellent for: AI, Medicine, Luxury… Poor fit: Toys, Fast food, Comedy").
 */
interface IndustryProfile {
  name: string
  /** Emotional axes that should be high for this industry. */
  wants: Array<keyof EmotionalDNA>
  /** Emotional axes that should be low for this industry. */
  avoids: Array<keyof EmotionalDNA>
}

const INDUSTRIES: IndustryProfile[] = [
  { name: 'AI', wants: ['scientific', 'futuristic', 'premium'], avoids: ['playful'] },
  { name: 'Medicine', wants: ['trustworthy', 'scientific', 'warm'], avoids: ['aggressive', 'playful'] },
  { name: 'Luxury products', wants: ['premium', 'elegant'], avoids: ['playful', 'aggressive'] },
  { name: 'Finance', wants: ['trustworthy', 'premium', 'powerful'], avoids: ['playful'] },
  { name: 'Wellness', wants: ['warm', 'natural', 'trustworthy'], avoids: ['aggressive'] },
  { name: 'Technology', wants: ['futuristic', 'scientific', 'minimal'], avoids: ['mystical'] },
  { name: 'Fashion', wants: ['elegant', 'premium', 'creative'], avoids: ['scientific'] },
  { name: 'Nature & outdoors', wants: ['natural', 'warm', 'energetic'], avoids: ['scientific'] },
  { name: 'Space & aerospace', wants: ['futuristic', 'powerful', 'mystical'], avoids: ['playful'] },
  { name: 'Toys & kids', wants: ['playful', 'warm', 'energetic'], avoids: ['premium', 'scientific'] },
  { name: 'Fast food', wants: ['playful', 'energetic', 'warm'], avoids: ['premium', 'elegant'] },
  { name: 'Comedy & entertainment', wants: ['playful', 'creative', 'energetic'], avoids: ['premium', 'scientific'] },
  { name: 'Gaming', wants: ['creative', 'energetic', 'futuristic'], avoids: ['trustworthy'] },
  { name: 'Beauty', wants: ['elegant', 'premium', 'warm'], avoids: ['aggressive'] },
]

export function matchBrands(dna: EmotionalDNA): BrandFit {
  const scored = INDUSTRIES.map((ind) => ({
    name: ind.name,
    score: scoreIndustry(dna, ind),
  })).sort((a, b) => b.score - a.score)

  const excellentFor = scored
    .filter((s) => s.score >= 55)
    .slice(0, 5)
    .map((s) => s.name)

  const poorFit = scored
    .filter((s) => s.score <= 35)
    .slice(-3)
    .map((s) => s.name)

  // Always surface at least one of each so the passport never looks empty.
  if (excellentFor.length === 0) excellentFor.push(scored[0].name)
  if (poorFit.length === 0) poorFit.push(scored[scored.length - 1].name)

  return { excellentFor, poorFit }
}

function scoreIndustry(dna: EmotionalDNA, ind: IndustryProfile): number {
  const wantAvg = avg(ind.wants.map((a) => dna[a]))
  const avoidAvg = ind.avoids.length ? avg(ind.avoids.map((a) => dna[a])) : 0
  // High where the word has what the industry wants and lacks what it avoids.
  return Math.max(0, Math.min(100, wantAvg - avoidAvg * 0.6))
}

function avg(ns: number[]): number {
  return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0
}
