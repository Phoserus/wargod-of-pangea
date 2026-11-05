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
*Screen.tsx         Play, Combat, Crafting, Economy, Quests (+ PvPHotseat)
PuzzleCanvas.tsx    host for fixed-step puzzles (picks the view by puzzle id)
usePuzzleRun.ts     rAF loop around a Driver; reports won/lost + input log once
puzzleViews/        GridRevealView, RhythmTapView, TargetShotView (DOM, keyboard/aria)
MinigameRunner.tsx  legacy button-driven runner (used by PvPHotseat only)
core/
  puzzles/          NEW contract: Puzzle<S,I,C> = create(seed,cfg) + step(state,input,dt),
                    zod configSchema, RNG state inside puzzle state, fixed 16 ms step.
                    driver.ts (createDriver/replay), registry.ts, solvers.ts (tests only),
                    gridReveal.ts, rhythmTap.ts, targetShot.ts, puzzles.test.ts
  primitive.ts      LEGACY Primitive<TState>: create(seed, config), apply(state, action)
  registry.ts       legacy primitive list + getPrimitive(id) (PvP, Debug)
  primitives/       legacy state machines (+ one test file each)
  skillActions.ts   legacy: primitive id -> string actions / number-action count
  skills.ts, xp.ts  skill state, OSRS XP curve (cap 100), tier by level (1/40/75)
  rng.ts            mulberry32: createRng(seed) closure and pure nextRandom(state)
  save.ts           zod-validated save v2 { skills, inventory, bank, currency, equipment },
                    migration table (1->2), corrupt-save backup key, "WOP2:" export/import string
  content.ts        zod schemas + loaders for items/recipes/skills, cross-reference check,
                    outputQuantity (level-scaled yield), sellPrice (value/2)
  store.ts          Zustand game store: completeAction, buy/sell/move, equip/unequip, loadSave
  persistence.ts    initPersistence(): load on boot, debounced (400 ms) autosave, flush on pagehide
  inventory.ts      pure bag helpers (isQty, hasAll, addItem, removeItem, exchange)
  equipment.ts      equip/unequip (swaps back to inventory), equipmentStats
  config.ts         shallow legacy-primitive config validation
  combat/           resolver.ts: pure seeded resolveFight (simultaneous rounds, structured events,
                    mid-fight eating); player.ts: derivePlayerStats, rollLoot, food from inventory
  economy/          pure buy/sell/move over inventory + bank with positive-integer guards
  items/            craft(inventory, recipeId) over content recipes
  quests/           Quest/DialogueNode types + one DEMO_QUEST
  audio.ts          Web Audio: master/music/sfx gains, beep SFX, single-oscillator "music"
data/               skills/*.json (23), enemies.json (3, zone "Goblin Hollow"), items.json (8), recipes.json (4)
locales/en.json     themed skill display names + a few UI strings
```

## Gameplay flow as implemented

1. **Main menu** → one screen per feature. Game data (skills XP, inventory, bank, gold, equipment) lives in the Zustand store and survives navigation and reloads; Quests still keeps local demo state. A corrupt-save banner (`role="alert"`) shows on the menu.
2. **Play**: skills come from `core/content.ts`. Skills whose `primitive` is in `core/puzzles/registry.ts` (mining, smithing, attack) are playable. Pick an unlocked action (shows inputs, level-scaled outputs, XP), press Start (disabled without materials), `PuzzleCanvas` runs the puzzle with the config of the highest tier whose `unlockLevel` ≤ level (remounted per attempt via `key`). On a win the store consumes inputs, adds outputs and XP atomically; a loss consumes nothing. Every other skill shows "coming soon". In dev builds each result is logged with `{seed, inputs}`.
3. **Puzzles** are pure `step` functions over serialisable state, driven at a fixed 16 ms step; the driver logs inputs per tick, and `replay` re-runs a log. Status is `playing | won | lost`.
4. **Combat**: pick one of 3 Goblin Hollow enemies (`data/enemies.json`: stats, xp, coins, drops). `derivePlayerStats` = skill level + gear (HP = 20 + 2/Health level + gear). `resolveFight` runs simultaneous rounds (hit chance `0.5 + (atk − def)/40` clamped 0.1–0.95, damage 1..strength); the player eats food from the inventory at ≤40% HP (using that round's action); 100-round cap or both dying is a draw (counts as a loss). A win pays seeded coins/drops and XP to attack/strength/defense/health; a loss only costs the food eaten. Fights start at full HP. `CombatScreen` plays the event list back with HP bars (Skip available).
5. **Crafting** lists recipes with have/need counts (items are made by playing the skill). **Inventory & Equipment** (`EconomyScreen`) handles bank, sell (half value), equip/unequip and a shop for `buyable` items (priced at value). **Quests** is a small demo over its core module. **Settings** includes export/import/reset of the save.
6. **PvP hotseat**: two legacy `MinigameRunner`s on the same seed, first to report a result takes the round, first to 3 wins.
7. **Settings**: reduced motion, colorblind palette (CSS vars), text scale, volume sliders/mutes; persisted to `skillbound.settings`.

## Puzzles

- **GridReveal** (Mining): dig a grid for a connected ore vein; numbers show adjacent ore/hazards; limited swings and stability.
- **RhythmTap** (Smithing): strike when a bouncing marker is in a glowing zone that shrinks and moves after each hit.
- **TargetShot** (Attack): shoot real targets, avoid decoys, targets expire; seeded spawns from in-state RNG.

## Legacy primitive inventory (registered in `core/registry.ts`, used by PvP and Debug only)

- **Seeded layout + scored state**: AimShot, TimingBar, SustainBar, TelegraphBlock, MergeCombine, LaneDodge, PathTrace, MemorySequence.
- **Counter-style** (win after N "success" actions, lose on a "fail" action): Mining, Woodcutting, Crafting, Smithing, Fishing, Cooking, Firemaking, Farming, Herblore, Prayer, Magic, Ranged, Construction, Summoning (`extra.ts` holds most).
- **Dev**: `stub`.

## Skill → puzzle mapping (from `data/skills/*.json`)

Migrated: mining → GridReveal · smithing → RhythmTap · attack → TargetShot.
Legacy (coming soon): dungeoneering/trapping → AimShot · defense → TelegraphBlock · strength → TimingBar · health/meditation → SustainBar · woodcutting → Woodcutting · fishing → Fishing · cooking → Cooking · farming → Farming · construction → Construction · summoning → Summoning · prayer → Prayer · fletching/leatherworking → Crafting · hunting → LaneDodge · traveling → MemorySequence · alchemy/foraging/transmutation → MergeCombine.

## Quality gates & tooling

- CI (`deploy.yml`) only runs `npm ci` + `npm run build` before deploying; tests/lint are local.
- `content-lint` checks ≥3 tiers, tier config present, ≥1 action. `validate-data` checks skill / item / recipe shape with Zod.
- `scripts/validate-data.mjs` uses Zod v4 (declared devDependency).
- CI: `.github/workflows/ci.yml` runs typecheck, lint, test, content-lint, validate-data on PRs and is a prerequisite job of `deploy.yml`. `npm run check` runs the same gates locally.
- `stub` primitive and the Debug screen exist only in dev (`import.meta.env.DEV`).

## Accessibility features present

`prefers-reduced-motion` CSS, colorblind token swap (`.colorblind`), text scale var, `:focus-visible` ring, `.sr-only` live-region announcer in each canvas, keyboard handlers in canvases.
