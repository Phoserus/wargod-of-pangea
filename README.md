# The Wargod of Pangea

A brutal, over-the-top war-god RPG that runs in the browser. You are a demigod of war on the continent of Pangea, and every skill is trained through its own short, bubbly, mobile-style puzzle minigame: you aim to train Attack, you chop to train Woodcutting. The frame is savage; the puzzles are cute.

**Status:** early prototype. Building a vertical slice first (Mining → Smithing → Attack → auto-resolved combat), then adding skills one at a time. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Quick start

```text
npm install
npm run dev      # Vite dev server
npm run check    # typecheck + lint + test + content-lint + validate-data
npm run build    # production build into dist/
```

Other scripts: `test`, `test:coverage`, `lint`, `typecheck`, `format`, `format:check`, `preview`.

## Docs

| File                                         | What it is                                                       |
| -------------------------------------------- | ---------------------------------------------------------------- |
| [docs/DESIGN.md](docs/DESIGN.md)             | Vision, pillars, puzzle and skill catalog (the spec)             |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the code works today                                         |
| [docs/ROADMAP.md](docs/ROADMAP.md)           | Vertical-slice plan, phases, per-skill definition of done        |
| [docs/audit.md](docs/audit.md)               | Known problems and improvements, by area, ordered by change size |
| [AGENTS.md](AGENTS.md)                       | Rules for AI coding agents working in this repo                  |

## Tech

TypeScript (strict), React 19, Vite, Vitest, Zod. Planned: Zustand (state), PixiJS (puzzle rendering), Howler.js (audio). Static site deployed to GitHub Pages. No telemetry, no runtime network calls.

## Principles

- The verb is the minigame. Puzzles are driven by player input, not buttons that name the outcome.
- Deterministic: all puzzles are seeded; same seed and inputs give the same result.
- Data-driven: skills, items, recipes, enemies live in `src/data` JSON, validated by `npm run validate-data`.
- Original work: display names and text are themed for Pangea, kept in `src/locales`.
- Accessible by default: keyboard, reduced motion, colorblind-safe tokens, scalable text.
