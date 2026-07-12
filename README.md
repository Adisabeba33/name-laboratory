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
> semantic map (healing, knowledge, precision, calm…), then discovers several distinct
> **linguistic families** — Crystalline (`Kaint · Kaix · Kaon`), Noble (`Selova · Selelle
> · Selon`), Verdant (`Vaith · Vaia · Vaiwen`)… — each with a full _Word Passport_.

Not a name generator, and not twelve mutations of one pattern. A single run discovers
several **new linguistic species** — different sound worlds — and grows a small family
of kin words inside each. The words are *synthesised* inside a linguistic archetype, so
the source roots inspire the texture but never show through: a word feels **discovered,
not assembled**.

---

## What it does

Every discovered word arrives as a **Word Passport**:

- **Meaning** — a concept-first idea the word was imagined to hold (not its etymology).
- **Lineage** — the linguistic character and the language families it echoes.
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
| `types.ts` | The type system — the central **`WordGenome`**, plus `WordFamily` / `Lineage`. |
| `data/archetypes.ts` | The **linguistic archetypes** — the engine's "species", each a self-contained sound world with its own phoneme inventory and emotional signature. |
| `data/ideas.ts` | Concept → idea vocabulary, so meanings state an idea rather than an etymology. |
| `data/concepts.ts` | Keyword → concept map (the "internal semantic map"). |
| `data/modes.ts` | Creative-mode profiles (bias which archetypes a run favours). |
| `data/known-words.ts` | Blocklist for the novelty check. |
| `concepts.ts` | **Meaning → Concept**: builds the weighted concept vector. |
| `phonetics.ts` | Phonetic primitives — syllables, vowel ratio, clusters, pronounceability, symmetry. |
| `genome.ts` | Computes a word's **Word Genome** and its quality score. |
| `synth.ts` | **Linguistic Structure → Phonetics → Word**: synthesises masked, kin words inside an archetype (no visible root-gluing). |
| `emotional.ts` | **Emotional Identity**: emotional DNA from archetype signature + concepts + genome. |
| `pronunciation.ts` | Cross-language pronounceability ratings. |
| `brand.ts` | Brand / industry matching. |
| `narrative.ts` | Concept-first meaning, explanation, story, lineage, personality, difficulty. |
| `generator.ts` | Orchestrates the family-first pipeline (`generateFamilies`). |
| `rng.ts` | Seeded RNG so results are deterministic and shareable. |

The React UI in [`src/App.tsx`](src/App.tsx) and
[`src/components/PassportCard.tsx`](src/components/PassportCard.tsx) is a thin,
presentational layer over that engine.

### Family-first generation

`generateFamilies()` scores every archetype against the concept map (boosted by the
creative mode), takes the top *distinct* archetypes, and grows a kin family inside each.
Because the archetypes sound genuinely different from one another, a single run reads as
several new linguistic species rather than one repeated formula. Words are synthesised
from an archetype's phoneme inventory — the source roots and languages only inspire the
texture, they never surface as glued fragments.

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
import { generateFamilies } from './src/engine'

const families = generateFamilies({
  brief: 'A premium AI company focused on medicine',
  keywords: ['trust', 'intelligence', 'calm', 'precision', 'future'],
  mode: 'medical',
  count: 6, // number of families to discover
})

const family = families[0]
console.log(family.character)          // e.g. "Crystalline"
console.log(family.words.map((w) => w.word)) // e.g. ["Kaint", "Kaix", "Kaon"]
console.log(family.words[0].meaning)   // e.g. "Living intelligence meeting precision — …"
console.log(family.words[0].emotionalDNA) // { scientific: 96, futuristic: 60, ... }

// generateWords() still returns a flat WordPassport[] if you don't need the grouping.
```

Generation is deterministic for a given request (and optional `seed`), so results are
reproducible and shareable.

---

## Deploy

The app is a static Vite build (no server, no environment variables), so any static
host works. A [`vercel.json`](vercel.json) is included.

**Vercel (recommended)** — the easiest path is the dashboard, no CLI needed:

1. Push this repo to GitHub (already done for the working branch).
2. In Vercel, choose **Add New → Project → Import Git Repository** and pick this repo.
3. Vercel auto-detects the settings from `vercel.json`:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**. Every push to the branch redeploys automatically.

Or via the CLI:

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

Because it's fully static, it also drops straight onto Netlify, Cloudflare Pages,
GitHub Pages, or any bucket — build with `npm run build` and serve `dist/`.

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
