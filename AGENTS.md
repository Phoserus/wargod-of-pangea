# Agent rules

Read [docs/ROADMAP.md](docs/ROADMAP.md) for the current phase and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code works. Log problems in [docs/audit.md](docs/audit.md), not in the architecture doc.

- Work phase by phase as laid out in the roadmap. Do not start a later phase without the user's go-ahead.
- Ask before adding a dependency. Dependencies must be free (MIT/Apache/BSD). Approved so far: PixiJS, Howler.js, Zustand, Zod.
- Puzzle logic lives in `src/core` and must not import React, Pixi, or skill data.
- Never call `Math.random()` in game logic; use `src/core/rng.ts`.
- All numbers (puzzle params, XP, yields, prices) live in `src/data` JSON, not in code.
- Any save schema change adds a migration and a test.
- Every puzzle ships tests for seeded replay, win, lose, and "random input rarely wins".
- New screens ship with keyboard support, aria-labels, and colorblind-safe tokens.
- Keep `npm run check` and `npm run build` green; run `npm run format` before committing.
- Update docs when behavior changes: strike through resolved audit items with the date, and keep ARCHITECTURE.md factual.
- Display names and flavor text come from `src/locales/en.json`; keep all content original (no third-party IP).
- When a design choice is ambiguous, ask.
