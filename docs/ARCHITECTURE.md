# Architecture & Current State

What the project **is today**. Design intent lives in [DESIGN.md](DESIGN.md) (spec / vision). Problems and improvements live in [audit.md](audit.md). Build plan: [ROADMAP.md](ROADMAP.md). Keep this file factual: update it when the code changes, never log problems here.

_Last verified: 2026-11-04. Gates: typecheck, lint, test (98 tests / 26 files), content-lint, validate-data, build all pass._

## Stack

| Concern                   | Actual                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------- |
| Language / build          | TypeScript (strict), Vite 6, React 19                                                   |
| Tests                     | Vitest + jsdom + Testing Library (coverage via `npm run test:coverage`)                 |
| Lint / format             | ESLint 9 flat config, Prettier (`.prettierrc`, `.editorconfig`; `npm run format:check`) |
| Data validation           | `scripts/validate-data.mjs` (Zod), `scripts/content-lint.mjs`                           |
| Persistence               | `localStorage` (`skillbound.save`, `skillbound.settings`)                               |
| Hosting                   | Static `dist/`; GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`)          |
| Not used (despite README) | Zustand (declared in `package.json`, never imported; planned for Phase 2)               |

Commands: `npm run dev | build | test | lint | typecheck | content-lint | validate-data | format | preview`.

## Layout (`src/`)

```
main.tsx            entry: StrictMode > ErrorBoundary > App
App.tsx             screen switcher (useState), settings, debug launcher, main menu
*Screen.tsx         Play, Combat, Crafting, Economy, Consumables, Quests (+ PvPHotseat)
MinigameRunner.tsx  generic button-driven runner for any primitive
*Canvas.tsx         per-primitive canvas widgets (keyboard + aria-live)
core/
  primitive.ts      Primitive<TState> interface: create(seed, config), apply(state, action)
  registry.ts       flat list of primitives + getPrimitive(id)
  primitives/       pure-logic puzzle state machines (+ one test file each)
  skillActions.ts   primitive id -> list of string actions / number-action count
  skills.ts, xp.ts  skill state, OSRS XP curve (cap 100), tier by level (1/40/75)
  rng.ts            mulberry32 seeded RNG
  save.ts           versioned save (v1: { skills: id -> xp }) + migration table (empty)
  config.ts         shallow primitive-config schema validation
  combat/           resolveCombat(seed, a, b) auto-resolver
  consumables/      food/potion/ammo table + apply/consume helpers
  economy/          currency + inventory + bank + buy/sell/move
  items/            items.json/recipes.json loader + craft()
  quests/           Quest/DialogueNode types + one DEMO_QUEST
  audio.ts          Web Audio: master/music/sfx gains, beep SFX, single-oscillator "music"
data/               skills/*.json (23), enemies.json (1), items.json (3), recipes.json (2)
locales/en.json     themed skill display names + a few UI strings
```

## Gameplay flow as implemented

1. **Main menu** → one screen per feature; no shared state between screens (each screen owns local state and is unmounted on navigation).
2. **Play**: pick a skill (23 from `data/skills`), the skill's `primitive` is looked up in the registry, the tier config is chosen by level (tier 1 <40, tier 2 40–74, tier 3 ≥75), `MinigameRunner` renders one button per action from `skillActions.ts`. Winning awards the XP of the first matching action in the skill JSON and writes all skill XP to `localStorage`. The seed increments after every attempt.
3. **Primitives** are deterministic reducers over a state object. Each reports `playing | won | lost`.
4. **Combat**: `resolveCombat` runs alternating attack rolls (hit chance `0.5 + (attack − enemy.defense)/100`, damage = strength, max 100 rounds). Consumables in the list add HP / +2 strength / +2 attack up front. `CombatScreen` fights a hardcoded player against `enemies[0]`.
5. **Crafting / Economy / Consumables / Quests** screens are small demos over their core modules with hardcoded starting inventories.
6. **PvP hotseat**: two `MinigameRunner`s on the same seed, first to report a result takes the round, first to 3 wins.
7. **Settings**: reduced motion, colorblind palette (CSS vars), text scale, volume sliders/mutes; persisted to `skillbound.settings`.

## Primitive inventory (registered in `core/registry.ts`)

- **Seeded layout + scored state**: AimShot, TimingBar, SustainBar, TelegraphBlock, MergeCombine, LaneDodge, PathTrace, MemorySequence.
- **Counter-style** (win after N "success" actions, lose on a "fail" action): Mining, Woodcutting, Crafting, Smithing, Fishing, Cooking, Firemaking, Farming, Herblore, Prayer, Magic, Ranged, Construction, Summoning (`extra.ts` holds most).
- **Dev**: `stub`.

## Skill → primitive mapping (from `data/skills/*.json`)

attack/dungeoneering/trapping → AimShot · defense → TelegraphBlock · strength → TimingBar · health/meditation → SustainBar · mining → Mining · smithing → Smithing · woodcutting → Woodcutting · fishing → Fishing · cooking → Cooking · farming → Farming · construction → Construction · summoning → Summoning · prayer → Prayer · fletching/leatherworking → Crafting · hunting → LaneDodge · traveling → MemorySequence · alchemy/foraging/transmutation → MergeCombine.

## Quality gates & tooling

- CI (`deploy.yml`) only runs `npm ci` + `npm run build` before deploying; tests/lint are local.
- `content-lint` checks ≥3 tiers, tier config present, ≥1 action. `validate-data` checks skill / item / recipe shape with Zod.
- `scripts/validate-data.mjs` uses Zod v4 (declared devDependency).
- CI: `.github/workflows/ci.yml` runs typecheck, lint, test, content-lint, validate-data on PRs and is a prerequisite job of `deploy.yml`. `npm run check` runs the same gates locally.
- `stub` primitive and the Debug screen exist only in dev (`import.meta.env.DEV`).

## Accessibility features present

`prefers-reduced-motion` CSS, colorblind token swap (`.colorblind`), text scale var, `:focus-visible` ring, `.sr-only` live-region announcer in each canvas, keyboard handlers in canvases.
