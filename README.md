# Word Laboratory

**An AI-powered laboratory that invents new words that have never existed before** —
words carrying a deep semantic structure, an emotional identity, a linguistic logic,
and brand potential. The goal is for every invented word to feel as if it could have
lived in a language for centuries.

Word Laboratory is **not** a name generator. It doesn't shuffle syllables and check
domains. It generates **meaning first** — the word is only the final result.

```
Meaning → Concept → Emotional Identity → Linguistic Structure → Phonetics → Word
```

> **Example.** Ask for _“a premium AI company focused on medicine”_ with the keywords
> `trust, intelligence, calm, precision, future`, and the lab first builds an internal
> semantic map (healing, knowledge, precision, calm…), then constructs an original word
> such as **Sanicura** and hands back a full _Word Passport_ explaining why it exists.

---

## What it does

Every generated word arrives as a **Word Passport**:

- **Meaning** — a one-line sense synthesised from the roots the word was built from.
- **Origin** — the morphological roots and language families it grew from.
- **Emotional DNA** — measurable attributes (Premium, Scientific, Elegant, Trustworthy,
  Creative, Warm, Futuristic, Mystical, Playful…), each scored 0–100.
- **Personality** — a handful of adjectives read off the emotional DNA.
- **Pronunciation** — 1–5 stars per language (English, Spanish, Russian, Japanese, French).
- **Difficulty** — easy to pronounce / remember / visually balanced.
- **Brand Fit** — industries the word suits (AI, Medicine, Luxury, Finance, Wellness…)
  and ones it doesn't (Toys, Fast food, Comedy…).
- **Explain the word** — a plain-language rationale for the phonetic design choices.
- **Origin story** — a believable account of how such a word might have evolved.
- **Word Genome** — the measurable "genetic code" the whole passport is derived from.

### Creative modes

Minimal · Luxury · Scientific · Nature · Fantasy · Technology · Medical · Ancient ·
Space · Japanese-inspired · Scandinavian · Futuristic · Organic · Timeless.

Each mode biases which language families the engine reaches for, which euphonic endings
it grows, and which emotional axes it leans into — without ever breaking the meaning-first
order.

---

## Architecture

The heart of the project is a **framework-agnostic, pure-TypeScript engine** in
[`src/engine/`](src/engine). It has no React, DOM, or network dependency, so the
meaning-first pipeline is fully unit-testable and ready to be driven later by an LLM
or an interactive slider UI.

| File | Responsibility |
| --- | --- |
| `types.ts` | The type system — including the central **`WordGenome`**. |
| `data/roots.ts` | Morphological roots across 10 language families (Latin, Greek, Sanskrit, Norse, Celtic, Japanese, Arabic, Hebrew, Finnish, PIE). |
| `data/concepts.ts` | Keyword → concept map (the "internal semantic map"). |
| `data/modes.ts` | Creative-mode profiles. |
| `data/known-words.ts` | Blocklist for the novelty check. |
| `concepts.ts` | **Meaning → Concept**: builds the weighted concept vector. |
| `phonetics.ts` | Phonetic primitives — syllables, vowel ratio, clusters, pronounceability, symmetry. |
| `genome.ts` | Computes a word's **Word Genome** and its quality score. |
| `emotional.ts` | **Emotional Identity**: derives emotional DNA from genome + concepts + mode. |
| `assembler.ts` | **Linguistic Structure → Phonetics → Word**: fuses roots into original words. |
| `pronunciation.ts` | Cross-language pronounceability ratings. |
| `brand.ts` | Brand / industry matching. |
| `narrative.ts` | Meaning, origin story, explanation, personality, difficulty. |
| `generator.ts` | Orchestrates the full pipeline and ranks candidates. |
| `rng.ts` | Seeded RNG so results are deterministic and shareable. |

The React UI in [`src/App.tsx`](src/App.tsx) and
[`src/components/PassportCard.tsx`](src/components/PassportCard.tsx) is a thin,
presentational layer over that engine.

### Why the genome is central

Emotional DNA, brand fit, and the human-readable passport are all read **off** the
genome — not invented separately. Building words **from** measurable attributes (rather
than deriving attributes after random assembly) is exactly what makes the long-term
_Word Genome_ vision tractable: a future slider UI writes into the genome, and the same
engine reads it back out.

---

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build
npm test           # run the engine test suite
```

Use the engine directly, without the UI:

```ts
import { generateWords } from './src/engine'

const words = generateWords({
  brief: 'A premium AI company focused on medicine',
  keywords: ['trust', 'intelligence', 'calm', 'precision', 'future'],
  mode: 'medical',
  count: 6,
})

console.log(words[0].word)        // e.g. "Sanicura"
console.log(words[0].meaning)     // e.g. "The healing that gives rise to care…"
console.log(words[0].emotionalDNA) // { premium: 89, trustworthy: 99, ... }
```

Generation is deterministic for a given request (and optional `seed`), so results are
reproducible and shareable.

---

## Roadmap — the Word Genome

The MVP already computes a genome per word. The long-term ambition is to let users
_engineer_ words by adjusting the genome directly:

```
Premium    ←────────●───→ Playful
Scientific ←──────●─────→ Emotional
Minimal    ←────●───────→ Expressive
Ancient    ←──────────●─→ Futuristic
Organic    ←●──────────→ Technological
```

Planned directions:

- **Genome-driven generation** — treat the genome as the _target_ and search for words
  that match it, instead of scoring words after the fact.
- **Optional LLM linguist** — swap the algorithmic assembler for an LLM that proposes
  roots and constructions, keeping the same genome/passport contract.
- **Real uniqueness checks** — a full dictionary plus trademark, domain, and
  negative-meaning / cross-language conflict detection (the current novelty check uses a
  curated blocklist).
- **Shareable passports** — deep links via the deterministic seed.

The engine is deliberately structured so these can be added without rewriting the
meaning-first pipeline.
