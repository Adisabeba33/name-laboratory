# Word Laboratory

**An AI-powered laboratory that invents new words that have never existed before** —
words carrying a deep semantic structure, an emotional identity, a linguistic logic,
and brand potential. The goal is for every invented word to feel as if it could have
lived in a language for centuries.

Word Laboratory is **not** a name generator. It is a **Meaning Discovery Engine**: it
first works out what you are *really* describing, then invents the languages and words to
name it. Meaning is the product; words are the vessels that carry it.

```
Prompt → Meaning Analysis → Hidden Concepts → Concept Network
       → Language Discovery → Language Genome → Word Evolution → Word
```

> **Meaning first.** For the prompt _“a word for becoming someone completely different
> after surviving something that should have destroyed you,”_ the laboratory doesn't grab
> surface words like *creation* or *light*. It reads the deep idea — **irreversible
> identity transformation after destruction** — names the hidden concepts (_Death without
> dying, Identity reborn, Survivor's metamorphosis…_), draws the concept network
> (Destruction → Survival → Transformation → Identity → Rebirth), and only then discovers
> languages whose philosophy fits (**Ashen, Phoenix, Obsidian, Chrysalis**).

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
| `types.ts` | The type system — `MeaningAnalysis`, `WordGenome`, `LanguageGenome`, `WordEvolution`, `WordFamily`, `Ancestry`. |
| `meaning.ts` | **The Meaning Engine.** `analyzeMeaning()` reads the prompt (keywords + phrase patterns), recognises the human theme, and produces the interpretation, hidden concepts and concept network. The single seam an LLM analyzer would replace. |
| `data/patterns.ts` | Phrase → concept patterns that recover the *implied* meaning behind a prompt. |
| `data/themes.ts` | Recognised human themes (metamorphosis, grief, resilience…) with deep interpretations and preferred languages. |
| `data/languages.ts` | The **languages** — the engine's "species" (incl. meaning-driven Ashen / Phoenix / Obsidian / Chrysalis), each a sound world with its own phoneme inventory, cadence, emotional signature, philosophy-first description and native characteristics. |
| `data/ideas.ts` | Concept → idea vocabulary: clear definitions (EN + RU) plus poetic material for explanations. |
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
| `generator.ts` | Orchestrates the full pipeline (`runLaboratory` → analysis + families). |
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
import { runLaboratory } from './src/engine'

const { analysis, families } = runLaboratory({
  brief: 'a word for becoming someone completely different after surviving something that should have destroyed you',
  keywords: [],
  count: 6, // number of languages to discover
})

console.log(analysis.theme)          // "metamorphosis"
console.log(analysis.interpretation) // "This request is not primarily about survival…"
console.log(analysis.hiddenConcepts.map((c) => c.en)) // ["Death without dying", …]
console.log(analysis.network.map((n) => n.en))        // ["Destruction", "Survival", …]

const language = families[0]
console.log(language.character)              // e.g. "Ashen"
console.log(language.words[0].meaning)       // "What remains standing after what should have ended it. (…)"
console.log(language.words[0].emotionalDNA)  // { mystical: …, powerful: …, … }

// generateFamilies() / generateWords() remain available if you only want words.
```

Generation is deterministic for a given request (and optional `seed`), so results are
reproducible and shareable.

---

## LLM meaning analysis (optional, server-side)

The deterministic engine understands the emotional/philosophical prompts it was tuned
for. To understand **any** prompt as deeply, an LLM can do the Meaning Analysis step
via a serverless function — [`api/analyze.ts`](api/analyze.ts). It's the single seam the
engine was designed around: the LLM returns the same `MeaningAnalysis` shape (interpretation
EN/RU, hidden concepts, concept network, a weighted concept vector in the engine's own
vocabulary, an optional theme), and the rest of the pipeline is unchanged.

- The **API key lives only on the server** (`ANTHROPIC_API_KEY`), never in the browser.
- The client calls `/api/analyze` first; if it's absent (the static Artifact), unconfigured,
  or failing, it **falls back to the self-contained engine** — the app always works.
- A badge on the interpretation shows whether it was **Read by AI** or the built-in engine.

**Enable it on Vercel:** set `ANTHROPIC_API_KEY` in Project → Settings → Environment
Variables. Optionally set `WORDLAB_MODEL` (defaults to `claude-opus-4-8`; `claude-sonnet-5`
or `claude-haiku-4-5` are faster and cheaper for this task — roughly 1–2¢ and <1¢ per
analysis respectively). See [`.env.example`](.env.example).

---

## Deploy

The frontend is a static Vite build; the only server-side piece is the optional
`/api/analyze` function above. A [`vercel.json`](vercel.json) is included, and Vercel
serves `/api` automatically alongside the Vite build.

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
