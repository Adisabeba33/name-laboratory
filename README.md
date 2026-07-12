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
> **languages** — Crystalline (`Zaittyrar · Kekynar · Qerkysix`), Noble (`Lodounova ·
> Doradount · Sosnovoava`), Verdant (`Lerolis · Narilelvis · Mirermia`)… — each with its
> own **Language Genome**, and populated with native-speaker words.

Not a name generator, and not twelve mutations of one pattern. **The laboratory discovers
languages.** A single run surfaces several new linguistic species — each with a
description, native characteristics and a measurable Language Genome — then generates
native-speaker words that obey it. A word is *evidence the language exists*: synthesised
from the language's own phonotactics, it feels **discovered, not assembled**.

---

## What it does

Each run discovers several **languages**, shown as a **Language Tree**. Every language has:

- **A description & Native Characteristics** — what kind of linguistic species it is
  (e.g. Crystalline: prefers K/T/X, avoids long vowels, low phonetic entropy…).
- **A Language Genome** — the language's own DNA: consonant density, preferred vowels,
  cadence, stress pattern, visual symmetry, entropy, mutation rate, emotional gravity,
  evolution speed and signature endings.

Every native-speaker word then arrives as a **Word Passport**:

- **Meaning** — a concept-first idea the word was imagined to hold (not its etymology).
- **Phonetic Ancestry** — the species it belongs to and the families its sound descends
  from (research-lab framing, never "inspired by").
- **Word Genome** — the word's own evolution profile: parent language, generation,
  mutation %, visual balance, originality, memorability, phonetic stability, evolution
  distance.
- **Emotional DNA** — measurable attributes (Premium, Scientific, Elegant, Trustworthy,
  Creative, Warm, Futuristic, Mystical, Playful…), each scored 0–100.
- **Personality**, **Pronunciation** (1–5 stars per language), **Difficulty**,
  **Brand Fit**, an **explanation** and an **origin story**.

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
| `types.ts` | The type system — `WordGenome`, `LanguageGenome`, `WordEvolution`, `WordFamily`, `Ancestry`. |
| `data/languages.ts` | The **languages** — the engine's "species", each a self-contained sound world with its own phoneme inventory, cadence, emotional signature, description and native characteristics. |
| `data/ideas.ts` | Concept → idea vocabulary, so meanings state an idea rather than an etymology. |
| `data/concepts.ts` | Keyword → concept map (the "internal semantic map"). |
| `data/modes.ts` | Creative-mode profiles (bias which languages a run favours). |
| `data/known-words.ts` | Blocklist for the novelty check. |
| `concepts.ts` | **Meaning → Concept**: builds the weighted concept vector. |
| `phonetics.ts` | Phonetic primitives — syllables, vowel ratio, clusters, pronounceability, symmetry. |
| `genome.ts` | Computes a word's phonetic **Word Genome** and its quality score. |
| `synth.ts` | **Word Evolution → Word**: synthesises diverse *native-speaker* words from a language's phonotactics (no root-gluing, real internal diversity). |
| `language.ts` | Computes the **Language Genome** (from a sample) and each word's **evolution profile**. |
| `emotional.ts` | **Emotional Identity**: emotional DNA from language signature + concepts + genome. |
| `pronunciation.ts` | Cross-language pronounceability ratings. |
| `brand.ts` | Brand / industry matching. |
| `narrative.ts` | Concept-first meaning, explanation, story, phonetic ancestry, personality. |
| `generator.ts` | Orchestrates the language-discovery pipeline (`generateFamilies`). |
| `rng.ts` | Seeded RNG so results are deterministic and shareable. |

The React UI (`src/App.tsx`, `src/components/LanguageTree.tsx`,
`LanguageSection.tsx`, `PassportCard.tsx`) is a thin, presentational layer over that
engine.

### Discovering languages

```
Meaning → Concept → Emotional Identity → Language Discovery → Language Genome
        → Language Rules → Word Evolution → Word
```

`generateFamilies()` scores every language against the concept map (boosted by the
creative mode), takes the top *distinct* species, derives each one's Language Genome, and
generates native-speaker words that obey it. Because the languages are genuinely different
sound worlds, a run reads as several new linguistic species; and because words are drawn
from a language's full phonotactics (varying length, rhythm and structure), they show
real internal diversity while still sounding native to the same language.

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
