# CLAUDE.md — working notes for agents

**Read [`PROJECT.md`](PROJECT.md) first.** It fully describes what this project is,
why it exists, the architecture, and the roadmap. This file is the short
operational summary.

## What this is

**Word Laboratory** — a dictionary for things humanity has felt but never named.
It understands the deep meaning of a request FIRST, then invents a new word for it
that can be *used inside an existing language* (EN/RU). Not a name generator, not a
fantasy-language builder. Meaning is the product; the word is a vessel for it.

## Non-negotiable invariants

1. **Meaning first, word last.** `Meaning → Concept → … → Word → Use in Language`.
   The `Concept` is the central entity, not the Word.
2. **Engine stays pure.** No React/DOM/network in `src/engine/` (framework-agnostic
   TypeScript). UI and LLM depend on the engine, never the reverse.
3. **Single seam.** `analyzeMeaning()` is the one step the LLM replaces; anything
   the LLM returns must fit the existing `MeaningAnalysis` / `WordPassport` shapes.
4. **Always works without the LLM.** Every LLM call has a deterministic fallback.
   `ANTHROPIC_API_KEY` is server-only, never in the browser.
5. **Determinism.** Engine output is deterministic per seed. No `Date.now()` /
   `Math.random()` in the engine — use the seeded `Rng` in `rng.ts`.
6. **Honesty.** No fake etymology (“constructed using phonetic patterns associated
   with…”, not “comes from Ancient Greek”). No fake precision (prefer qualitative
   bands over invented 97%/100% scores; state when a check wasn't performed).
7. **Keep input simple.** The user wants a single free-text field; richer flow
   (concept directions, confirmation) must be progressive/optional, not forced
   multi-step forms. Confirm before adding mandatory steps.

## Layout

- `src/engine/` — pure engine (see PROJECT.md §6 for the file-by-file map).
- `api/analyze.ts`, `api/meanings.ts` — optional LLM passes (Vercel functions).
- `src/App.tsx`, `src/components/` — thin React UI.
- Roadmap & feature status — PROJECT.md §7.

## Workflow

```bash
npm install
npm test        # vitest engine suite — keep green
npm run build   # tsc -b + vite build — must pass
npm run dev
```

- Add/extend tests in `src/engine/engine.test.ts` for engine changes.
- **Bump `package.json` `version`** on user-visible changes — the footer build
  stamp (`v… · build … · UTC`) is how a live deploy is verified by refreshing.
- Deploy: Vercel serves the static build + `/api`. Set `ANTHROPIC_API_KEY`
  (optional `WORDLAB_MODEL`) in Vercel env. `vercel.json` sets `maxDuration: 60`.
- If you change product direction or architecture, **update PROJECT.md**.
