# Word Laboratory — Project Guide

> **Read this first.** This is the canonical description of what Word Laboratory
> is, why it exists, how it is built, and where it is going. It is written so that
> any agent or contributor can understand the whole project from the repository
> alone, without prior context. If you change direction, update this file.

---

## 1. What this project is (in one sentence)

**Word Laboratory is a dictionary for things humanity has felt, experienced or
imagined but never precisely named** — it understands the deep meaning of a
request first, then invents a new word for it that can actually be *used inside an
existing human language* (English, Russian, …).

It is **not** a random word generator, **not** a fantasy-language builder, and
**not** just an AI name generator. It does not replace human language — it
**expands** it by adding a new semantic word where ordinary vocabulary runs out.

The core promise to a user:

> Describe what language cannot yet express. The laboratory discovers the
> concept, creates a word for it, and shows you how to use it.

A Russian speaker keeps speaking Russian and says «я прошёл через **варетис**».
An English speaker keeps speaking English and says “I did not recover. I entered
**varethis**.” The invented word carries a concept that would otherwise take
several sentences.

---

## 2. The central principle: meaning first, word last

The generation order is **always**:

```
Meaning → Concept → Emotional Identity → Sound Architecture → Word → Use in Language
```

The most important object in the product is the **Concept**, not the Word and not
the Language. The word is a *vessel* for the concept; the phonetic system decides
how that vessel *sounds*.

If the meaning interpretation is wrong, everything downstream is wrong. So the lab
states its interpretation of the request **before** making any word, and (in the
target design) lets the user confirm or steer it.

Worked example — for the prompt
*“a word for becoming someone completely different after surviving something that
should have destroyed you”* — the lab must NOT grab surface words like *creation*,
*light*, *energy*. The real center is **irreversible identity transformation after
destruction**: death of the former self without physical death, grief for who you
were, strength born from damage. Only after naming that does it build words.

---

## 3. Current product pipeline (what actually runs today)

```
User prompt (one free-text field: "describe a meaning")
   ↓
Meaning Analysis            → api/analyze.ts (LLM) OR src/engine/meaning.ts (fallback)
   ↓
Laboratory Interpretation   → interpretation EN/RU, hidden concepts, concept network
   ↓
Language Discovery          → several distinct "linguistic species" chosen by meaning
   ↓
Language Genome             → each language's measurable DNA
   ↓
Word Synthesis + Evolution  → native-speaker words built from each language's phonotactics
   ↓
Word Passport               → meaning, pronunciation, transliteration, Use in Language,
                              Word Genome, Emotional DNA, personality, brand fit…
```

Results render **immediately** from the deterministic engine, then, if the LLM is
configured, **bespoke per-word meanings and usage sentences swap in progressively**.

### What a word currently ships with

- **Word** + **pronunciation guide** (stress-marked respelling, e.g. `eh-LEE-ah-yeh`).
- **Transliteration** into Cyrillic (e.g. `Varethis → варетис`), always present.
- **Part of speech** and a short one-line definition.
- **Meaning** — a specific, dictionary-style definition (EN with a fluent RU in
  parentheses), tailored to the prompt when the LLM is on.
- **Use in Language** — natural example sentences in English and Russian that show
  how the word actually functions in a sentence (LLM-written).
- **Speakability band** — a qualitative read (Speakable / Balanced / Ornate) of how
  readily the word enters everyday speech. Synthesis is biased toward speakable
  shapes by default; a "Speakable ↔ Ornate" slider (`speakability` on the request)
  lets the user allow more elaborate words.
- **Naturalness band** — the Engine V3 signal (Fabricated / Plausible / Believable /
  Inevitable): could this word already exist in a living human language? It is the
  **primary** selection signal — believability beats originality — so words feel
  discovered, not manufactured.
- **Word Genome / Emotional DNA / Personality / Brand Fit / origin explanation.**

---

## 4. Positioning & voice

Use this language:

- “A dictionary for things humanity has felt but never named.”
- “Describe what language cannot express.”
- Discovery verbs: *Interpreting… · Meaning layers detected · Word discovered.*

Avoid this language:

- “AI name generator”, “random word generator”, “build your own language”,
  “generating names…”, “here are your results”, “inspired by”.

There are **two modes** (a tab picker on the input), which must not be blended
into one generic generator:

- **Meaning Discovery** (primary) — for unnamed human experiences and concepts.
  Optimises for semantic precision, emotional recognition, natural usage. Shows
  semantic tensions and concept directions.
- **Naming** (secondary) — for a company, store, brand, product, or even a
  newborn. Optimises for brand character, memorability, adoption. `api/analyze`
  switches to a naming system prompt; the UI hides tensions/directions and
  relabels results ("name families" / "candidate names").

Both run the same discovery/synthesis pipeline underneath — only the analysis
framing and result copy differ.

---

## 5. Honesty rules (important for trust)

The interface may feel mysterious, but the system must stay honest. Always keep
these distinct and never fake them:

1. **Real etymology** vs **creative linguistic influence.** A newly invented word
   does NOT historically descend from Greek/Latin. Say *“constructed using phonetic
   patterns associated with …”*, never *“comes from Ancient Greek.”*
2. **Measured data** vs **estimated data.** Do not print fake precision
   (“Originality: 100%”, or 97/96/95 on everything). Prefer qualitative bands
   (Low / Moderate / High / Exceptional) unless there is a real scoring basis, and
   state when a check has *not* been performed (e.g. “external collision check not
   yet done”).
3. **AI-generated interpretation** is labelled as such (“Read by AI” badge) vs the
   built-in engine.

---

## 6. Architecture

The heart of the project is a **framework-agnostic, pure-TypeScript engine** in
[`src/engine/`](src/engine): no React, no DOM, no network. This keeps the
meaning-first pipeline fully unit-testable and lets any step be swapped for an LLM
without touching the rest.

### The "single seam"

`analyzeMeaning()` (concept analysis) is the one function an LLM replaces to reach
open-ended understanding. The LLM endpoint returns the **same `MeaningAnalysis`
shape** the engine already consumes, so language discovery, word synthesis and
passports are unchanged whether the analysis came from the LLM or the fallback.

### Engine files

| File | Responsibility |
| --- | --- |
| `types.ts` | The type system — `MeaningAnalysis`, `WordGenome`, `LanguageGenome`, `WordEvolution`, `WordFamily`, `WordPassport`, `Ancestry`. |
| `meaning.ts` | The Meaning Engine fallback. `analyzeMeaning()` reads the prompt, recognises a human theme, produces interpretation + hidden concepts + network. **The single seam.** |
| `concepts.ts` | Meaning → Concept: builds the weighted concept vector. |
| `phonetics.ts` | Phonetic primitives — syllables, vowel ratio, clusters, pronounceability, symmetry. |
| `synth.ts` | Word Evolution → Word: synthesises diverse *native-speaker* words from a language's phonotactics (no root-gluing; real internal diversity). |
| `genome.ts` | Computes a word's phonetic **Word Genome** + quality score. |
| `language.ts` | Computes the **Language Genome** and each word's evolution profile. |
| `emotional.ts` | Emotional DNA from language signature + concepts + genome. |
| `pronounce.ts` | Deterministic spoken **pronunciation guide** (stress-marked respelling). |
| `translit.ts` | Deterministic Latin → **Cyrillic transliteration** (so words can live in Russian). |
| `pronunciation.ts` | Cross-language pronounceability star ratings. |
| `brand.ts` | Brand / industry matching. |
| `narrative.ts` | Concept-first meaning, explanation, story, phonetic ancestry, personality. |
| `generator.ts` | Orchestrates the pipeline: `runLaboratory`, `generateFamilies`, `buildPassport`, `discoverFromAnalysis`. |
| `rng.ts` | Seeded RNG (mulberry32) → deterministic, shareable results. |
| `data/languages.ts` | The languages / "species": 8 original (Crystalline, Liquid, Verdant, Noble, Ancient, Ethereal, Earthen, Solar) + 4 meaning-driven (Ashen, Phoenix, Obsidian, Chrysalis). Each is a sound world with phoneme inventory, cadence, stress, philosophy-first description. |
| `data/ideas.ts` | Concept → idea vocabulary: clear definitions (EN + RU) + poetic material. |
| `data/concepts.ts` | Keyword → concept map. |
| `data/patterns.ts` | Phrase → concept patterns that recover *implied* meaning. |
| `data/themes.ts` | Recognised human themes (metamorphosis, grief, resilience) + preferred languages. |
| `data/modes.ts` | Creative-mode profiles (bias which languages a run favours). |
| `data/known-words.ts` | Blocklist for the novelty check. |

### Server (optional, LLM)

| File | Responsibility |
| --- | --- |
| `api/analyze.ts` | LLM Meaning Analysis. Returns the `MeaningAnalysis` shape. `501` if no key, `502` on failure → client falls back to the engine. |
| `api/meanings.ts` | LLM meaning pass (cheap): per word writes meaning EN/RU, a short definition, and part of speech. Chunked + parallel so it never truncates. |
| `api/usage.ts` | LLM "Use in Language" for ONE word, on demand: 2 EN + 2 RU natural example sentences. Split out and called lazily (per word the user opens) — the most expensive step, so it isn't run for words nobody looks at. |

- The **API key lives only on the server** (`ANTHROPIC_API_KEY`), never in the browser.
- `WORDLAB_MODEL` overrides the model (default `claude-haiku-4-5-20251001` for
  speed/cost; use `claude-sonnet-5` / `claude-opus-4-8` for deeper, slower reads).
- Functions set `maxDuration: 60` (Vercel Hobby ceiling) so the meanings pass does
  not time out. See `vercel.json` and each function's `config`.

### Client (thin presentational layer)

`src/App.tsx` orchestrates the state/data flow (single-input flow, progressive
enhancement) inside the **v4 "laboratory" shell** — a persistent left `Sidebar`
(desktop) / `BottomNav` (mobile PWA feel) around a routed content area with these
rooms: **Discover** (Hero + three-zone workspace + results), **Lexicon**,
**Languages**, and future-laboratory placeholders (Collections, Experiments,
Settings, Help). Design language: near-black canvas (`#090A0F`), barely-there
purple/blue borders, a Fraunces display serif over Inter, generous whitespace and
slow, subtle motion ("Apple meets CERN", not an AI generator).

Key components in `src/components/`:
- **Shell/nav:** `Sidebar`, `BottomNav`, `nav.tsx` (shared model), `icons.tsx`
  (thin line-icon set), `Logo`.
- **Discover flow:** `Hero`, `DiscoverInput` (the writing surface + suggestion
  pills), `StepFlow` (Idea → Meaning → Concept → Language → Word → Lexicon
  narrative), `LexiconRail` (workspace glance), `WordCard` (compact result that
  opens a full page), `InterpretationPanel`, `ConceptDirections`.
- **Word page:** `WordDetail` — a discovered word opens as a **full page with
  tabs** (Usage · Meaning · Evolution · Genome · Translations · Notes) and a held
  space for a future illustration, not a dense card. Notes persist on-device
  (`lib/notes.ts`).
- **Views/placeholders:** `views.tsx` (Languages catalogue, Lexicon room, future
  rooms), `ComingSoon` (future-laboratory teasers), `Placeholder` (labelled
  stand-ins for future visual assets — 700×700 hero artifact, 500×700
  illustration — so images are easy to drop in later).

Build-time constants `__APP_VERSION__` / `__BUILD_SHA__` / `__BUILD_TIME__` are
injected via `vite.config.ts` `buildDefine()` and shown as a footer **build stamp**
so a fresh deploy is detectable by refreshing.

---

## 7. Product direction (the restructure)

The project is mid-transition from "meaning-first name discovery" to the full
**dictionary of unnamed experience**. The end-state pipeline adds a confirmation
loop and a personal lexicon:

```
Prompt → Interpretation → Hidden layers → Semantic tensions → Concept directions
       → (user confirms/steers) → Sound architecture → Words → Word Passport
       → Use in Language → Adoption test → Evolve → Save to Lexicon
```

### Phased plan & status

| Phase | Scope | Status |
| --- | --- | --- |
| — | Meaning-first engine, language discovery, genomes, passports | ✅ done |
| — | LLM meaning analysis via serverless function (key-safe, graceful fallback) | ✅ done |
| — | Bespoke per-word meanings | ✅ done |
| — | Pronunciation guide + Cyrillic transliteration | ✅ done |
| **14** | **Use in Language** — EN/RU usage sentences, part of speech, short def | ✅ done |
| **1** | **Semantic Tensions** + optional "Refine the reading" steer chips (non-blocking, LLM-only) | ✅ done |
| **2** | **Concept Directions** — 3–5 distinct angles; focus word discovery on one or combine two (non-blocking re-weight). `Concept` persistence deferred to Phase 6. | ✅ done |
| **3** | **Diverse word discovery** — over-generate a candidate pool, then max-min-diversity select so a language's words never share a stem (no template mutation) | ✅ done |
| **5** | **Speech Adoption Test** — rule-based, engine-only (free): a qualitative band + scored 6-component breakdown + plain-language strengths & risks (drug/brand/fantasy/length/cross-language) | ✅ done |
| **6** | **My Lexicon** — save words to a personal, on-device dictionary (localStorage); searchable, removable, keeps meaning/pronunciation/concept/adoption. Collections/tags & cross-device sync deferred. | ✅ done |
| **7** | **Evolve the sound** — reshape a word's phonetics toward a direction (softer/darker/simpler/…) while keeping the meaning verbatim; deterministic (free, no LLM), with a parent→child lineage and a "what changed" summary. | ✅ done |
| — | **Cost optimisation** — lazy per-word Use-in-Language (`api/usage.ts`) + in-memory caches for analyze/meanings/usage | ✅ done |
| **21** | **Two modes** — Discover a meaning vs Name something (company/store/brand/newborn); naming uses its own analyst prompt and result framing | ✅ done |
| — | **"How this word was made"** — honest per-word construction breakdown (syllables, ideas fused, species, sound influences); no fake morpheme etymology | ✅ done |
| — | **Speakability bias** — synthesis leans toward everyday-sayable words by default; a "Speakable ↔ Ornate" dial (`speakability` on the request) + a per-word Speakability band, so long "incantation" shapes are avoided or flagged | ✅ done |
| **V3** | **Engine V3 — inevitable, not fabricated.** Naturalness (`naturalness.ts`) becomes the PRIMARY selection signal: real-word structure + endings, multiplicative penalties for fantasy markers (x/z, triple `th`, decorative `-iel/-ath/-yx`, over-length). Originality/diversity runs LAST, only across the most-natural shortlist. Per-word Naturalness band on the passport. Phase 1 (scoring + selection) done. Phase 2 done — `data/languages.ts` inventories tempered: fantasy endings (`-iel/-ael/-oth/-yth/-wyn/-yx`) and exotic `x/z/q` pile-ups removed while each species keeps its character, so the pool is natural at the source (avg naturalness ≈ 0.85–0.93 per language). Phase 3 (LLM-side calibration) to follow. | 🟡 in progress |
| **8** | External checks — dictionary / brand / domain / trademark / cross-language negatives. Shipped: offline collision flag (bundled word/brand list) on every passport + a live per-word check (`api/collision.ts`, key-free: English dictionary via dictionaryapi.dev + domain RDAP). Trademark, social handles & cross-language meaning still to do. | 🟡 in progress |
| A | **Accounts + database** — profiles, cross-device lexicon sync, request history | ⏳ later (see §7a) |
| M | **Monetisation** — free daily limit + paid tier (premium model / higher limits) | ⏳ later (see §7a) |

### 7a. Deferred: accounts, database & monetisation

Explicitly parked for later (do not build without the user's go-ahead) — most
likely done together, since an account is both the sync mechanism *and* the
natural gate for paid tiers.

**Why it's needed.** Today the lexicon lives in the browser's `localStorage`
(`src/lib/lexicon.ts`): it works and is free, but it's per-device / per-browser,
lost if the browser data is cleared, and has no profile or history. Real
profiles, cross-device sync, and durable history require **authentication + a
database** — there's no way around storing a user's words "behind the user".

**Recommended shape** (not started):
- **Stack:** Supabase (auth + Postgres + row-level security) is the lightest fit
  for this Vite SPA — minimal backend code. Alternatives: Neon/Vercel Postgres +
  Auth.js, Firebase, or Clerk.
- **Progressive, non-forced:** anonymous users keep the local lexicon exactly as
  now; on **sign-in**, local words sync up to the cloud and become available on
  any device. Never force login just to use the lab.
- **Auth:** Google / magic-link / email — decide at build time.
- **Data model:** a `lexicon` table keyed by `user_id` (mirrors the `LexEntry`
  shape); later a `history` table of prompts/analyses.
- **Monetisation, on the same foundation:** free daily request limit per account,
  paid tier for higher limits and/or the premium model (`claude-sonnet-5` /
  `claude-opus-4-8` via `WORDLAB_MODEL`). Accounts also enable per-user usage
  metering.
- **Privacy:** storing user data means adding a short privacy note (what's
  stored, where) — required once real accounts exist.
- **Ops note:** the Supabase/DB project and its keys must be created by the
  product owner; the public `anon` key is safe in the browser, the service key
  stays server-only. An agent cannot create those external accounts.

### Design tension to respect

The user has explicitly asked for a **maximally simple single input field**. The
richer flow (concept directions, confirmation) must therefore be **progressive and
optional** — show interpretation + directions as *results* the user can accept or
refine, not as forced steps before any output. Do not reintroduce mandatory
multi-step forms without confirming with the user.

### Quality bars for a good generation

1. The interpretation accurately reflects the prompt (user recognises their idea).
2. Concept directions are meaningfully different.
3. Final words are phonetically diverse — NOT suffix mutations of one root
   (bad: `Vareth / Varethis / Varethon / Varethix`; good: `Varethis / Saelor /
   Korvain / Eluneth / Morakai / Avere`).
4. Every word preserves the selected concept.
5. At least one word is naturally usable in a sentence.
6. Definitions are specific, not generic poetry.
7. Scores and claims are transparent (see Honesty rules).

---

## 8. How to run

```bash
npm install
npm run dev        # dev server
npm run build      # type-check (tsc -b) + production build
npm test           # engine test suite (vitest)
npm run typecheck  # types only
```

Use the engine directly, no UI:

```ts
import { runLaboratory } from './src/engine'

const { analysis, families } = runLaboratory({
  brief: 'a word for the feeling of a perfect moment ending while you are still inside it',
  keywords: [],
  count: 6, // number of languages to discover
})

console.log(analysis.interpretation)
console.log(families[0].words[0].word, families[0].words[0].transliteration)
```

Generation is **deterministic** for a given request (and optional `seed`), so
results are reproducible and shareable. The LLM passes are non-deterministic and
are layered on top progressively.

---

## 9. Deploy & environment

- Static Vite frontend + optional `/api/*` serverless functions. `vercel.json`
  sets framework, build command, output dir, and `maxDuration: 60` for `api/*`.
- **Enable the LLM:** set `ANTHROPIC_API_KEY` in Vercel → Settings → Environment
  Variables. Optional `WORDLAB_MODEL`. See `.env.example`.
- Every push to the production branch redeploys. The footer build stamp
  (`v… · build … · … UTC`) confirms which build is live.
- Because the frontend is fully static, it also runs on Netlify / Cloudflare Pages
  / any bucket (without the LLM passes).

---

## 10. Conventions for agents working here

- **Never break the meaning-first order.** Meaning/Concept comes before any word.
- **Keep the engine pure.** No React/DOM/network inside `src/engine/`. LLM and UI
  live outside it and depend on the engine, never the reverse.
- **Preserve the single seam.** Anything the LLM produces must fit the existing
  `MeaningAnalysis` / passport shapes so the deterministic fallback keeps working.
- **The app must always work without the LLM.** Every LLM call has a graceful
  fallback; the key never reaches the browser.
- **Never call the LLM silently.** Every AI request is gated by a confirmation
  dialog (`ConfirmDialog`) because each call costs money — including the
  secondary ones (steer chips, concept-direction focus). Declining runs the free
  engine instead. A "don't ask again this session" opt-out exists, but the
  default is to ask. Free engine steps (re-discovery, transliteration,
  pronunciation, adoption, evolve) run without asking.
- **Spend as little as possible.** The expensive per-word example sentences
  ("Use in Language") are written lazily — only for the word a user opens, via
  `api/usage.ts`. The client libs (`lib/analyze`, `lib/meanings`, `lib/usage`)
  cache results in memory, so an identical repeat costs nothing (and is served
  without a confirmation prompt, since no request is made).
- **Follow the honesty rules** (section 5). No fake etymology or fake precision.
- **Determinism:** engine output must stay deterministic for a seed. Do not use
  `Date.now()` / `Math.random()` in the engine — use the seeded `Rng`.
- **Tests:** add/extend `src/engine/engine.test.ts` for engine changes
  (36 tests today). Run `npm test` and `npm run build` before committing.
- **Build stamp:** bump `package.json` `version` on user-visible changes so the
  footer stamp shifts and a live deploy is verifiable by refreshing.
- **Docs:** if you change product direction or architecture, update THIS file.

---

## 11. Glossary

- **Concept** — the meaning being named; the central, stable entity. One concept
  can spawn many words.
- **Linguistic species / Language** — a self-consistent sound world with its own
  Language Genome. Repositioned in the target design as a **phonetic / sound
  architecture** (how a meaning sounds), not a fictional nation.
- **Language Genome** — a language's measurable DNA (consonant density, vowels,
  cadence, stress, entropy, mutation rate, emotional gravity, endings…).
- **Word Genome** — a single word's measurable phonetic profile; Emotional DNA and
  brand fit are read *off* it.
- **Word Passport** — the full deliverable for one word.
- **Use in Language** — the section proving the word can enter real speech, with
  natural EN/RU example sentences and a Cyrillic form.
- **Speech Adoption** — the target evaluation: can this word actually enter human
  speech? (More important than raw originality.)
- **Personal Lexicon** — a user's saved vocabulary of discovered concepts/words
  (planned; expected to be a key retention feature).

---

*Long-term ambition: create words so meaningful, natural and useful that some of
them eventually enter real human speech.*
