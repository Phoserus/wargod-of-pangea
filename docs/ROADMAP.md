# Roadmap: Vertical Slice, Then Skills One at a Time

Supersedes the README milestone list (M0–M12). Problems each step addresses are referenced by audit ID (see [audit.md](audit.md)). Current state: [ARCHITECTURE.md](ARCHITECTURE.md).

## Principle

Build one thin, fully playable, fully themed path through every system before widening. A skill is "done" only when its puzzle is real (player input decides the outcome), seeded, tested, themed, has sound, yields items, and feeds something.

## The slice: "Ore to Blade to Blood"

One loop a player can finish in ~10 minutes:

**Mine ore → smith a blade → equip it → train Attack → fight a zone enemy → get loot/XP → saved and reloadable.**

| Skill    | Puzzle (verb)                                              | Replaces           | Output        |
| -------- | ---------------------------------------------------------- | ------------------ | ------------- |
| Mining   | Grid-reveal (minesweeper-style: find ore, avoid gas)       | counter `Mining`   | ore           |
| Smithing | Timing bar / heat-and-strike (stop marker in zone, N hits) | counter `Smithing` | bar → blade   |
| Attack   | Aim shot (hit target, ignore decoys)                       | button `AimShot`   | accuracy stat |

Combat stays auto-resolved. It reads Attack level + equipped blade, and drops ore/coin. Everything else (the other 20 skills, quests, PvP, MMO) is parked.

## Phases

### Phase 0 — Safety net (≈1 day)

- D-3 `git init`, `.gitignore`, `.editorconfig`, `.prettierrc`, push a remote.
- D-2 declare `zod`; decide on `zustand` (we will use it in Phase 2).
- D-1 CI workflow running typecheck, lint, test, content-lint, validate-data; deploy depends on it.
- D-4 delete `scripts/fix-skills.mjs`; L-11/F-10 gate `stub` and Debug behind `import.meta.env.DEV`.
- P-2 ~~update the README structure section~~ done: README slimmed, spec moved to `docs/DESIGN.md`, `AGENTS.md` added (P-4).

**Done when:** a fresh clone passes all gates in CI.

### Phase 1 — New primitive contract (≈3–5 days)

- L-1/L-7 Change `Primitive` to `create(seed, config)` → `step(state, input, dt)` → `view(state)` with a typed input union per primitive and a fixed-timestep driver.
- L-4 Keep RNG state in primitive state; no `Math.random`.
- L-5/D-6/TS-5 Every primitive declares `configSchema`; a data test instantiates every skill tier; content-lint verifies keys.
- Rebuild **TimingBar** and **AimShot** on the new contract, build **GridReveal**.
- F-4 One `PuzzleCanvas` host replaces `MinigameRunner` and the 17 orphan canvases (delete the old ones for slice skills; legacy skills fall back to a "coming soon" card, not fake buttons).
- TS-1 Solver-based tests: a perfect input script wins, perfect-minus-one loses, same seed + same inputs = same result, random input rarely wins.
- L-12 Dev puzzle-result logging.

**Done when:** the three puzzles are genuinely playable by mouse, touch, and keyboard, and replay deterministically from `{seed, config, inputs}`.

### Phase 2 — State, items, yields (≈3–4 days)

- Y-1/E-1 One Zustand store: skills XP, inventory, bank, currency, equipment, settings, quest stub. Zod-validated load, debounced autosave, migration v1→v2.
- Y-2 Corrupt-save backup + recovery message. Y-3 export/import save string.
- E-2/E-3/E-4 Real item and recipe data (category, value, equip slot, stats; recipes with skill/level/XP), cross-reference validation, positive-integer quantity guards.
- S-1/S-2 Skill actions are selectable and define inputs and outputs (yield scales with level). S-4 tier from JSON only; S-7 precomputed XP table.

**Done when:** mining gives ore, smithing consumes ore and gives a blade, and everything survives a reload.

### Phase 3 — Combat that matters (≈3 days)

- C-1/C-3 `derivePlayerStats(skills, equipment)`; one zone with 3 enemies in validated JSON (id, level, drops).
- C-5/C-6 Clamp hit chance, damage variance, structured events, genuinely simultaneous turns.
- C-4 Food is consumed from inventory and heals mid-fight (data-driven buffs).
- Combat playback UI (HP bars, event log) driven by the event list.

**Done when:** the loop above is playable end to end and a better blade measurably changes outcomes.

### Phase 4 — Look, feel, sound (≈1 week, can overlap Phase 3)

- V-1/T-3 Decide art direction and tokens (`--frame-*` brutal, `--puzzle-*` cute); pick asset kit (I-3) and fonts (V-4); `CREDITS.md`.
- I-1 Add the rendering layer (recommend PixiJS first, Phaser if we want its scene/audio stack). Needs your approval before adding the dependency.
- F-1 Hash-router shell with HUD (currency, HP, skill levels), delete duplicated "Back" screens, mobile layout (F-8).
- T-1/S-8 `t()` helper over `locales/en.json`; themed names and Pangea-voice text everywhere visible.
- A-1/A-2/I-5 Audio manager (Howler or Tone) with SFX for hit/miss/win/level-up and one music loop per scene; autoplay unlock.
- V-2 Juice: hit flashes, level-up moment, reduced-motion respected (X-2).

**Done when:** a stranger can open the URL, understand the loop, and it looks and sounds like the game.

### Phase 5 — Ship the slice

- TS-2 UI tests for Play/Combat/Settings plus a Playwright smoke test of the built site; TS-4 coverage threshold.
- X-1/X-3 Accessibility pass on the three puzzles.
- Deploy (resolve GitHub Pages vs Netlify; delete the other config). Gather feedback and tuning data (S-3).

## Then: add skills one at a time

Queue ordered so each new skill feeds something already in the game. Do one per cycle; do not start the next until the checklist passes.

| #   | Skill                                                                                                   | Feeds                         | Puzzle (reuse or new)                                                     |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| 1   | Defense                                                                                                 | combat damage reduction       | TelegraphBlock (rebuild on new contract)                                  |
| 2   | Strength                                                                                                | combat damage                 | TimingBar variant (power swing)                                           |
| 3   | Woodcutting                                                                                             | logs → fletching/construction | LaneDodge (rebuild)                                                       |
| 4   | Fishing → Cooking                                                                                       | food for combat               | SustainBar → ordered-tap                                                  |
| 5   | Health                                                                                                  | max HP                        | SustainBar variant                                                        |
| 6   | Foraging/Farming → Alchemy                                                                              | potions                       | MergeCombine on a real 2-D grid (L-6)                                     |
| 7   | Crafting/Leatherworking/Fletching                                                                       | gear, ammo                    | fit-pieces                                                                |
| 8+  | Prayer, Meditation, Summoning, Traveling, Hunting, Trapping, Construction, Dungeoneering, Transmutation | buffs, areas, housing         | decided per skill; merge or cut any that can't earn a distinct verb (L-3) |

### Per-skill checklist ("Definition of Done")

1. Puzzle is driven by player input; outcome derived by rules; seeded; has `configSchema`.
2. Three tiers in JSON; content-lint and data test pass.
3. Solver tests (win / lose / determinism) pass.
4. Yields and consumes items defined in item/recipe JSON; feeds at least one other system.
5. Themed name and flavour text in `locales/en.json`.
6. SFX/visual feedback; keyboard and touch input; screen-reader instructions.
7. Entry added to [ARCHITECTURE.md](ARCHITECTURE.md); relevant audit items struck through.

## Deliberately deferred

Quests/dialogue (Q-1..3), world content (Q-2), lore doc (T-2, write alongside Phase 4), PvP and backend (B-1..5; async PvP + cloud saves come after the slice because they need the deterministic replay from Phase 1), idle progression (Y-5), packaging (I-8).

## Decisions (resolved 2026-11-04)

1. Slice skills: Mining, Smithing, Attack. **Confirmed.**
2. Rendering layer: **PixiJS** (MIT, rendering only; React stays the shell, primitives stay pure TS).
3. Audio: **Howler.js** (MIT).
4. Hosting: **GitHub Pages** (workflow in place; `netlify.toml` removed).
5. Public name: **The Wargod of Pangea** ("skillbound" stays the internal package/repo id).

## Progress

- **Phase 0:** done 2026-11-04, including README/DESIGN/AGENTS docs and first commit. Pending: GitHub repo creation and remote (needs the user's GitHub login; `gh` is not installed here).
