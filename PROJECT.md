# Word Laboratory — Project Guide

> **Read this first.** This is the canonical description of what Word Laboratory
> is, why it exists, how it is built, and where it is going. It is written so that
> any agent or contributor can understand the whole project from the repository
> alone, without prior context. If you change direction, update this file.

> **Public brand:** the product's public identity is **Sianelara — Institute of
> Meaning** (gold glyph mark, `src/components/Logo.tsx`; PWA name in
> `public/manifest.webmanifest`). "Word Laboratory" remains the internal/engine
> codename used throughout the codebase and docs.

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
| **V3** | **Engine V3 — inevitable, not fabricated.** Naturalness (`naturalness.ts`) becomes the PRIMARY selection signal: real-word structure + endings, multiplicative penalties for fantasy markers (x/z, triple `th`, decorative `-iel/-ath/-yx`, over-length, and same-class **sharp-consonant clustering** — a wall of sibilants s/z/x or velars k/g/q as in "Sysiasio"/"Grugukyx"; coronals t/d/n/l/r and nasals stay exempt as they are natural). Originality/diversity runs LAST, only across the most-natural shortlist. Per-word Naturalness band on the passport. Phase 1 (scoring + selection) done. Phase 2 done — `data/languages.ts` inventories tempered: fantasy endings (`-iel/-ael/-oth/-yth/-wyn/-yx`) and exotic `x/z/q` pile-ups removed while each species keeps its character, so the pool is natural at the source (avg naturalness ≈ 0.85–0.93 per language). Phase 3 done — the LLM passes now write as a lexicographer: `api/meanings.ts` defines each word "as if it already exists" (dictionary illusion, no fantasy framing, register-faithful) and `api/usage.ts` uses it "as if completely ordinary" (everyday sentences, no showcase lines). | ✅ done |
| **GAP** | **Semantic Gap Search — search before inventing.** Before the invented words, the lab asks "does language already have a word for this?". `api/semantic-search.ts` is an LLM reverse-dictionary (meaning → closest existing words/phrases, what each covers/misses, an honest gap verdict: existing_word / existing_phrase / partial_coverage / inconclusive). Shown in `SemanticGap.tsx` above the words (discover mode); qualitative only (no fake %), explicitly "the model's knowledge, not an exhaustive corpus". **Phase 1 (LLM MVP) done** — no DB. Later: a licensed lexical corpus + embeddings behind the same seam (§7a database still deferred), multilingual, benchmark eval, strict "search-first" gating of word discovery. | 🟡 in progress |
| **V5** | **Semantic Phonology — sound follows meaning.** The word's sound now emerges from the meaning's "emotional physics", not only the language. `acoustics.ts` reduces a concept vector to a Semantic Acoustic Profile (`hardness / depth / clip / openness`), and `synth.ts` biases phoneme + shape selection toward it *within* each language's inventory — a grief word leans soft/deep/open, a destruction word hard/clipped, even in the same language (measured: higher avg sharpness for a hard profile). Per-family profile (its angle blended with the whole meaning) on `WordFamily.acoustic`, shown in the report. Phase 1 (deterministic bias) done. Next: surface the profile in the UI; per-word (not per-family) profiles; feed the profile into the LLM word-meaning tone. | 🟡 in progress |
| **V4** | **Linguistic civilizations, not accents.** Fixing semantic convergence (all languages restating "the core / what remains"). Phase 1 done — each discovered language gets a DISTINCT primary concept + a distinct **lens** (`WordFamily.lens`: the event / the person / the feeling / the turning point / the cost / the observer / what emerged / the aftermath), threaded into the LLM meanings pass so the set reads as many viewpoints, not synonyms; shown in the language header. Deterministic fallback still converges (narrow built-in `IDEAS` vocabulary). Per-word grammar forms now shipped under V6 (word families). **Imagined etymology now shipped** (`etymology.ts`, `WordPassport.etymology`): a reconstructed root chain built by running the language's sound-laws BACKWARD from the modern form (peel the accreted ending, open the vowel that tightened, soften the initial stop that hardened), oldest → today, each step annotated. Honest — framed as an *imagined* lineage of the word's own sound, never descent from a real language (invariant #6); shown as an "Imagined lineage" block on the Meaning tab and per-word in the report. **Semantic network now shipped** (`network.ts`, `WordPassport.relations`): once every word exists, the run is wired into a navigable graph — each word links to its most-related peers (kindred idea = shared lead concept, echo = a concept threading through both, kindred sound = near-identical acoustic profile across languages, sibling = same language), with diversity-preferring selection so the map shows distinct kinds, not three identical edges. Shown as a clickable "Related" strip under the word header (opens the peer) and per-word in the report. **Refusals now shipped** (`Language.blindTo`, `WordFamily.refusal`): each language declares the concepts its worldview cannot hold; when a meaning centres strongly on one, that language *declines to translate* — coining nothing and saying why (e.g. a Phoenix language refusing pure grief, an Ashen language refusing hope) — rather than force a word that would lie. Kept rare and honest: capped at 1–2 refusals per run and never below `MIN_PRODUCERS` (3) producing languages, deterministic. Shown as a distinct "declines to translate" card + a run subtitle note, and in the report. **All four V4 sub-features now complete** (grammar forms, etymology, semantic networks, refusals). | ✅ done |
| **V6** | **Lexical evolution — from generation to selection.** The framing shifts from "we generated N words" to "we bred a population; most failed; a few survived". `synth.ts` now breeds a fixed budget (`EVOLUTION_BUDGET = 300`) of candidate forms per language and gates each, returning an honest `census` (generated / rejected / survived). The generator closes the funnel per language (recommended = shipped, exceptional = rare standouts) and sums a run-level `population: EvolutionStats` on `LaboratoryResult`. **Exceptional is deliberately strict** — a word must clear three independent bars at once (naturalness ≥ `EXCEPTIONAL_NATURALNESS` 0.95, zero collision, ≤ 3 syllables), so the engine stops labelling every word a "99" (typically ~5 of 18, varying 0–2 per language). Every number is real work — an 1,800-form run reports 1,800, never an inflated figure. Surfaced as a funnel strip in the results header and a "Lexical evolution" section (run-level + per-language) in the copy report. Phase 1 (deterministic funnel + honest variance) done. **Phase 2 done — multi-dimensional Fitness Profile** (`fitness.ts`, `WordPassport.fitness`): each word is banded across the dimensions that *genuinely vary between survivors* — Dictionary illusion (naturalness), Emotional resonance (top-2 emotional-DNA strength), Cultural reach (cross-language pronounceability) — with per-axis cuts calibrated to each signal's real quartiles, plus a `strongest`/`weakest` signature. Crucially honest: memorability and phonetic stability **saturate** among survivors (a form can't pass the gates without them), so they are stated once as a shared `SURVIVOR_FLOOR`, never faked as per-word bands (invariant #6). Shown on the Evolution tab, as a signature chip on the card, and per-word in the report. **Phase 3 done — morphological word families** (`morphology.ts`, `WordPassport.paradigm`): each word grows a paradigm — verb / adjective / adverb / agent noun — by inflecting the coined root with the HOST language's (English) derivational morphology (deterministic suffix per role, euphony at the seam, English adverb rule `-ic → -ically`), so the forms are usable in a real sentence. Honest: framed as invented morphology deployable in EN, NOT a grammar of the invented sound-world. Closes the old "per-word grammar forms" task. Shown as a "Word family" block on the Meaning tab and per-word in the report. **Phase 4 done — evolution-themed loading** (`EvolutionLoader.tsx`): while a run is in flight the workspace narrates the real pipeline (read the meaning → breed a population → apply selection pressure → survivors emerge → name them) instead of a blank spinner; UI-only timing, honest copy (the actual breed → gate → survive → passport stages). Remaining: Semantic Precision axis (needs the LLM). | 🟡 in progress |
| **v0.36 P1** | **Selection quality — direct vs adjacent, dynamic lenses.** The engine stops presenting many weak/adjacent forms as equally successful. **Dynamic lenses** (`LENS_POOL` + `selectLenses` in `generator.ts`): the fixed 8-lens round-robin is replaced by relevance selection — direct lenses (`direct_target`, `event`) are always eligible, adjacent lenses (`the cost / observer / person / feeling / capacity / aftermath`) are offered only when the meaning contains a concept they `require`, each semantic role appears at most once, and the family count follows the number of relevant lenses (a spare prompt yields 3 families, a rich one up to 8 — real variable output). **Semantic roles + direct/adjacent** (`WordFamily.semanticRole/direct`): every family is classified; only direct-lens families that carry a core concept and have not drifted are `direct`. **Concept Fidelity gate** (`ConceptFidelity`, structural): `matched`/`missing`/`extraneous` concepts vs the meaning's top-6; a family that drifts into a recurrent archetype (survival/identity/…) absent from the prompt is demoted (`driftDetected`). **Honest conclusion** (`LaboratoryResult.conclusion`): states the confirmed gap and how many direct candidates survived — including the honest empty case ("recommends another evolutionary cycle"). UI groups results into **Direct discoveries / Adjacent discoveries / Declined** with a conclusion banner; the report mirrors it. Deterministic; the offline concept extraction is the ceiling (the split is only as sharp as the analyzer), so the split is at its best on the LLM path. Phases 2–5 (Dictionary Viability + realistic Lexical Discovery Score, morphology/lineage/relations validation, layered collision, brand mode, benchmarks) still to do. **Phase 2 done** — **Dictionary Viability** (`dictionary-viability.ts`, `WordPassport.dictionaryViability`): a structural read of whether a form could behave like a real lexical item — lexical appearance, spoken/visual recoverability, morphology fit, register flexibility, dictionary illusion, historical plausibility, adoption friction. **Lexical Discovery Score** (`lexical-score.ts`, `WordPassport.discovery`): a single 0–100 score from EXPLICIT weighted components (Concept fidelity 30 · Dictionary viability 20 · Collision safety 15 · Speakability 10 · Memorability 10 · Morphology 5 · Semantic-phonetic congruence 5 · Cross-language 5 — beauty is not a component), with a structural **short-word collision-safety prior** (spec §14) and per-word concept fidelity so the distribution is realistic. **Realistic classification** (`LexicalClass`: Exceptional/Strong/Viable/Experimental/Weak/Rejected): hard-gate Rejected on drift or exact collision; **Exceptional is awarded per RUN to at most one word** — the strongest direct candidate clearing an absolute bar — so runs honestly yield ~1 or zero exceptional (spec §11, §17), not a wall of 99s. Shown as a classification+score chip on the card, a full component breakdown + viability on the Genome tab, and per-word + **Top discovery** + **Rejected highlights** in the report. **Phase 3 done** — **morphology validation** (`morphology.ts`): derivations are no longer emitted mechanically — each verb/adj/adverb/agent form is validated (naturalness, cluster, pronounceability) and a forced one is REJECTED with a reason; a word may stay **noun-only** (`WordParadigm.forms`/`rejected`). **Lineage validation** (`etymology.ts`): each stage now states the KIND of change (`reason`: phonetic reduction / suffix accretion / consonant hardening), the whole chain is labelled `lineageType: 'constructed'`, and `plausible` is false when no real chain exists so the UI omits a decorative single form. **Typed relations** (`network.ts`, `WordRelation.relationClass`): links are split into `semantic` (kindred idea / echo) vs `phonetic` (kindred sound / sibling), shown as separate "Related in meaning" / "Related in sound" strips — a shared sound is never dressed up as semantic. **Semantic-phonology validation** (`phonology.ts`, `WordPassport.phonology`): intended vs observed acoustic profile, a congruence score + band (Contradicts/Weak/Fair/High) and a plain explanation per word, shown as a "Sound ↔ meaning" block (a modeled judgement, not a universal law). **Phase 4 (offline half) done** — **layered collision analysis** (`collision.ts` `buildCollisionReport`, `WordPassport.collisionReport`): the not-credible single `collision: none` is replaced by separate layers. The offline-checkable ones are computed — internal built-in list (exact/near/clear), **phonetic neighbour** (a sounds-like key so "Kwik"~"quick" is caught even with different spelling), and a **short-word occupancy prior** (spec §14). The external ones — proper names, brand/company, domains, trademark, other languages — are reported as **not checked**, never silently passed. Overall status stays `Unverified` (or `Internal collision`) with `confidence: low`, so the engine never claims a word is clear (criterion #11). Shown as a layered "Collision status" card (each check + its honest status; the existing live dictionary/domain check fills its rows when deployed) and per-word in the report. **Phases 1–4 complete (everything realisable offline).** | 🟡 in progress |
| **v0.36 P5** | **Brand Mode done (deterministic half); external integrations still DEFERRED.** **Brand Mode** (`GenerationRequest.brandMode`, wired to the "Name something" mode) is a distinct, collision-aware scoring path: the Lexical Discovery Score switches to `BRAND_WEIGHTS` (collision safety 30 · cross-language 15 · memorability 15 · fidelity 15 · viability 15 · speakability 10 — sound-symbolism and morphology drop to 0, since a name is not inflected in a sentence), and brand hard-gates apply — any internal collision (exact OR near) is **Rejected** (a name cannot be an existing word), a high short-word occupancy prior is capped at Experimental, and a phonetic look-alike at Viable. Every word also carries a **collision-aware `brandSafety`** verdict (`brand-safety.ts`: clearance-dominant band + strengths/warnings), shown as a chip on the card in name mode, a Brand-safety block in the detail, and per-word in the report; the conclusion reframes for name use. Honest: even "Strong" means "clears every check we can run offline", never trademark-clear. **Still deferred (needs live services / an LLM key):** real external brand & company search, live domain + trademark integrations, and the **LLM benchmark suite** (§21). The layered `collisionReport` already exposes the seams (`brand`/`domain`/`trademark`/`multilingual` = `not_checked`) that live checks will fill. | 🟡 in progress (external integrations waiting) |
| **RANK** | **Target-type alignment at the decision layer (Morutho ranking fix).** The architectural fix for "a semantically-related but ontologically-wrong candidate outranks the right one" (an abstract *principle* winning a *moment* prompt). **Target Type Detection** (`target-type.ts`, `MeaningAnalysis.targetType`): before generation, `detectTargetType` reads the brief for the KIND of thing asked for — `moment / realization / feeling / person / capacity / relationship / principle / process / social_phenomenon / bodily_sensation / …` — with participants, temporality, sociality and a **confidence**. **Target gate** (`WordFamily.candidateType/targetMatch`): each lens declares its ontological `outputType` ("the meaning itself" → principle, "the threshold" → moment), and a family is `direct` only if its type matches the target (`targetTypeMatch ≥ 0.6`) — so a principle is demoted to adjacent on a moment prompt. **Top Discovery** additionally requires a strong match (≥ 0.8), and can crown no one ("No direct candidate survived this cycle"). The gate only bites at **high** detection confidence, so vague prompts are not over-constrained (no regression). **§7 attractor damping** (`dampenAttractors`): identity/hope/longing/transformation/memory/survival/grief/rebirth are damped to 40% when the prompt contains none of their signature phrases, so the vector stops defaulting to engine favourites. **§9 refusal fix**: a language only refuses over a genuinely central (top-2) concept, and the reason names the actual concept ("Obsidian does not lexicalize X…"). **§10 label calibration**: the always-maxed "Naturalness: Inevitable" / "Adoption: Exceptional" chips are removed from the card and detail header — the thresholded Lexical Discovery classification (Strong/Viable/Experimental/Weak, Exceptional only per-run) leads instead. **§11 regression suite**: TESTS A–E lock the prior failures (principle-beats-moment, bodily-in-social, attractor-dominant vector, capacity-not-direct, person/capacity/principle blocked from a moment's Top Discovery). Deterministic; the gate prevents the class of error regardless of detection quality. | ✅ done |
| **RANK-2** | **The real root cause: the concept vocabulary was empty for these prompts.** The re-report exposed that the ranking gate alone wasn't enough — the winning word still MEANT the wrong thing ("bringing something new into being") because the prompt fell to the `creation` fallback: the `Concept` union had no words for recognition, understanding, communication, connection, or absurdity. **Vocabulary expansion (§7 root fix):** added those five concepts (`types.ts` + `IDEAS`), plus keyword mappings (`data/concepts.ts`) and phrase patterns (`data/patterns.ts`) so "the realization that two people talked about the same experience under different names" resolves to `recognition:1.00 communication:0.94 understanding:0.71 connection:0.54` — not `creation:1.00`. The interpretation now reads "the sudden click of seeing that two things were the same all along", and the direct **moment** family's words MEAN recognition/communication. **LLM path fixed too:** `api/analyze.ts` had a hardcoded `CONCEPTS` enum out of sync — the model literally could not pick the new concepts; now synced, with a filesystem **drift-guard test** so it can't silently fall out of sync again. New content-regression tests (A2 vector-names-the-prompt, C not-identity/grief-dominant, F absurdity-domain). 125 tests green. | ✅ done |
| **RANK-3** | **Gap-anchored meanings + winner gate (A+B), and honest word length.** The v0.42 run proved the deeper failure: the target-type gate picked the right *kind* (moment lens direct) but the winning word still MEANT the wrong thing ("survival becomes settled strength") — because the LLM wrote each definition from the family's stock concept hint, drifting to the metamorphosis/survival archetype, while the genuinely on-meaning words sat in *adjacent*. **A — gap-anchored meanings** (`api/meanings.ts`): the meaning writer is now given the CONFIRMED MEANING + target head type + mechanism and must write every definition as a *facet of that exact meaning* through its lens, explicitly forbidding drift to stock archetypes (survival/rebirth/core-self) unless the meaning is really about them; the concept "hint" is demoted to a rough suggestion to ignore when it points away. **B — winner gate** (`WordMeaning.gapFidelity`): the writer returns an adversarial 0–1 self-rating of how directly each definition names the gap; the client (`App.enrich`) re-decides Top Discovery from the *written* meanings — the winner is the strongest DIRECT word with `gapFidelity ≥ 0.8`, a drifting word (`< 0.45`) is demoted, and if none qualifies there is no winner. **§10** — the report stops parading the near-universal "Inevitable"/"Exceptional" adoption+naturalness labels; the thresholded Lexical Discovery classification leads. **Honest length** (`synth.ts`, `naturalness.ts`, flowing languages → 5 syllables): the blunt length cap is relaxed (long words are legitimate — "understanding", "недосказанность") and the length/syllable penalties softened, so a long word survives when it stays structurally clean and dies only when it reads as an incantation (the fantasy-ending / cluster / reduplication / sharp-cluster guards still bite). **A+B are LLM-path — verifiable only on deploy** (no key in-sandbox); the length change is deterministic and tested. 125 tests green. | 🟡 A+B deploy-verify |
| **RANK-3b** | **Live A+B run — fixes from the deploy report.** The v0.43 grief-ritual run confirmed A worked (every word genuinely about continuing a ritual for someone gone — zero survival/rebirth drift) but exposed two faults. **(1) Target-detection false positive** (`target-type.ts`): the person cue matched a subordinate clause — "the person you shared it with is gone" → wrongly `headType: person` → all families demoted → a FALSE "No direct candidate survived". Fixed: the person cue now requires the target to be defined by "who …", so a subordinate "the person you…" no longer hijacks it; the same prompt now resolves to `principle`/low-confidence and direct answers return (regression test added). **(2) Lens convergence** (`api/meanings.ts`): over-anchoring collapsed all 18 definitions into "A person who…"; the prompt now forbids that and pins each lens to a DIFFERENT KIND of entry (the act / the feeling / the moment / the aftermath / the cost — only the person-lens names a person). 126 tests green. | 🟡 (2) deploy-verify |
| **RANK-3c** | **The future-self regression — two compounding faults.** The v0.44 run of "the strange comfort of realizing that your future self is already silently shaping your present" failed twice at once. **(1) The LLM reading mis-fired.** `api/analyze.ts` returned `identity 1.00 · transformation 0.79 · metamorphosis` — because the LLM path had **no attractor damping** (unlike the engine path) and the analyze prompt's own calibration taught the metamorphosis reflex. Fixed: the §7 `dampenAttractors` logic is extracted to a dependency-free `src/engine/attractors.ts` and now **also applied server-side** to the LLM concept vector (invariant #4 lets the LLM seam depend on the engine; esbuild bundles it clean), so an unsupported identity/transformation is cut to 40% even when the model over-reads; the discover prompt gains an explicit anti-archetype rule + a worked temporal-agency/self-continuity example; and a **theme guard** drops `metamorphosis` unless the brief contains a real becoming/rebirth cue (`METAMORPHOSIS_CUE`). **(2) The meanings pass failed silently.** `/api/meanings` timed out → deterministic duplicated glosses shown AND A/B never ran, so the engine's acoustic-top word wore an unearned "Exceptional 93/100" crown. Fixed (`App.enrich`): one retry, then on outage keep the engine glosses but **withhold the crown** (any Exceptional → Strong + "meaning not verified"), flag `meaningsOutage` in the UI sub-line, and surface it honestly in the report (`report.ts`) so duplicated glosses + a confident winner can never masquerade as a finished result. Deterministic parts tested (TEST C2 + report outage); prompt/theme hardening verifiable on deploy. 128 tests green. | 🟡 reading deploy-verify |
| **ACCENT** | **Per-language phonotactics — real accent diversity (v0.46).** Every invented word read as pseudo-Latin regardless of which "language" produced it, because three global Latin-shaped forces homogenized the output: the single `VALID_ONSETS` whitelist (`phonetics.ts`), the hard synth gate `awkwardClusters(word) < clusterLimit` (`synth.ts`), and the `RARE_LETTERS {x,z,q}` / `sharpClusterPenalty` in `naturalness.ts`. All three rejected anything non-European (Slavic `mzh`, Nordic `skj`) as "unpronounceable". **Fix — phonotactics become per-language:** a new `collectClusters()` (`phonetics.ts`) harvests each language's OWN legitimate consonant clusters from its onsets/medials/codas; `awkwardClusters(word, allowed?)` and `naturalness(word, ctx?)` take that context, so a cluster/letter a language natively owns is not "awkward"/"rare" FOR THAT LANGUAGE, while the global Latin default still governs languages that declare nothing (`synth.ts:nativePhonology`). **Data — accents assigned:** liquid → Japanese (strict CV, open vowels, only -n coda), crystalline → Nordic (skj/kv/hv onsets, -rn/-ld/-kt codas), obsidian → Slavic (zv/vl/mzh/zgr clusters, zh/sh/ch, -ov/-sk/-nik). Latin stays as one accent (noble/ancient). Latin grammatical suffixes (`-ify/-ous/-ian`) deliberately left global for now (honesty invariant + secondary to the root). **All 12 languages now carry a distinct accent (v0.50):** liquid=Japanese, crystalline=Nordic, obsidian=Slavic, verdant=Polynesian, noble=Italian/Romance, ancient=Sanskrit, ethereal=Finnish, earthen=Turkic, solar=Arabic, ashen=Hebrew, phoenix=Greek, chrysalis=Korean. Korean/Finnish single-sound vowel pairs (eo/eu/ae) added to the diphthong set so strict smoothing doesn't collapse them. `LanguageFamily` gains slavic/polynesian/turkic/korean. 6 new regression tests; every accent still breeds a viable pool. 135 tests green. **Part 3 done (v0.51):** grammatical derivations are now **per-language too** — each `Language` carries its OWN `morphology` (verb/adjective/agent/optional adverb suffixes echoing its family: Slavic -nik/-ov, Greek -ikos/-tes, Japanese -sha, Korean -hada, Arabic -iyy…), `computeParadigm` takes the language + validates each form against that language's own phonology (so a native cluster at the seam isn't rejected as Latin-awkward), and languages with no adverb suffix form none. Honesty copy updated: forms are labelled a **constructed native paradigm**, not English inflection (was: "how it bends in English"). Slavic/Korean words that used to fall to "noun-only" now bend properly. | 🟡 deploy-verify |
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
