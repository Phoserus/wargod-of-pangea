# The Wargod of Pangea — Audit

Problems, gaps, and improvement opportunities only. How things currently work → [ARCHITECTURE.md](ARCHITECTURE.md). Vision/spec → [DESIGN.md](DESIGN.md). Build plan (vertical slice, then skills) → [ROADMAP.md](ROADMAP.md).

**Last audited:** 2026-11-04 · **Gates at audit time:** typecheck, lint, test (98), content-lint, validate-data, build all green. Green gates mostly prove the code compiles and that shallow tests pass; see **L-1** and **TS-1**.

## How to read this

- Items are grouped by area and ordered **most drastic → least drastic** within each area.
- Severity = size of the change, not urgency:
  - 🔴 **Drastic** — redesign, new direction, or a scope change
  - 🟠 **Major** — multi-module rework, or a missing system
  - 🟡 **Moderate** — contained change to one module plus tests/data
  - 🟢 **Minor** — local fix or cleanup
- Tags: **[Bug]** wrong now · **[Gap]** promised/expected but missing · **[Opp]** improvement or out-of-scope idea worth considering.
- IDs are stable (`L-3` etc.). When done, strike through the item with the date and move it to a "Resolved" list at the bottom.

## Index

1. [Logic & Minigames](#1-logic--minigames) · 2. [Combat](#2-combat) · 3. [Skills & Progression](#3-skills--progression) · 4. [Items, Economy & Crafting](#4-items-economy--crafting) · 5. [Quests & Content](#5-quests--content) · 6. [Theme & Narrative](#6-theme--narrative) · 7. [Frontend / UI](#7-frontend--ui) · 8. [Visuals](#8-visuals) · 9. [Sounds & Music](#9-sounds--music) · 10. [Save & System Management](#10-save--system-management) · 11. [Backend, Multiplayer & PvP](#11-backend-multiplayer--pvp) · 12. [Integrations](#12-integrations-engines-libraries-services) · 13. [Accessibility](#13-accessibility) · 14. [Build, Tooling & CI](#14-build-tooling--ci) · 15. [Testing](#15-testing) · 16. [Scope & Docs](#16-scope--docs)

---

## 1. Logic & Minigames

- 🔴 **L-1 [Gap] The core pillar ("the verb is the minigame") is not implemented.** _Partly resolved 2026-11-04: Mining, Smithing, Attack now run on the player-input contract (`src/core/puzzles/`); the other skills still show "coming soon" until migrated._ Primitives are reducers fed by _buttons that name the outcome_: AimShot has `hit`/`miss`, SustainBar `tick`/`fail`, Mining `mine`/`collapse`, Cooking `cook`/`burn`. `MinigameRunner` renders those buttons, so a player wins by clicking `hit` three times, and a literal "fail" button exists. There is no aiming, timing, tracking, or board interaction in the live game. The logic layer must own _player input_ (a click at x,y; a keypress at time t; a swap of tiles) and derive the outcome from rules.
  Opportunity: change the primitive contract to `create(seed, config)` → `step(state, input, dt)` → `view(state)`, with a typed input union per primitive. Rebuild one primitive at a time, starting with the closest (TimingBar, AimShot, SustainBar, MergeCombine, MemorySequence).
- 🔴 **L-2 [Gap] 14 of 22 registered primitives are counters, not puzzles** (`extra.ts` ×9, `mining`, `woodcutting`, `smithing`, `fishing`, `crafting`). The 10 in `extra.ts` + `crafting` ignore the seed entirely (7 skills: cooking, farming, construction, summoning, prayer, fletching, leatherworking); the other four only randomize a count. "Same seed = same layout" is vacuous for them. The README catalog (GridReveal, MatchSwap, FitPieces, RhythmTap, OrderedTap) does not exist in code. Decide the final catalog (**L-3**) and replace the counters.
- 🔴 **L-3 [Opp] Re-think "one bespoke puzzle per skill" at 23 skills.** It is the biggest cost driver in the project, and 8 skills already share a primitive. Options: (a) ~10 strong reusable primitives with skill-specific skins/params; (b) cut launch scope to ~12 skills and add the rest post-launch; (c) wrap existing open-source puzzle logic (**I-2**). Recommend (a)+(b): fewer, better puzzles.
- 🟠 **L-4 [Bug] Non-determinism.** _New puzzles keep RNG in state (done); legacy `mergeCombine`/`laneDodge` still use `Math.random()` until migrated._ `mergeCombine.ts` refills with `Math.random()` and `laneDodge.ts` picks the next branch side with `Math.random()` (2 places). This breaks seeded replay and "same puzzle for both players". Keep an RNG state/draw counter in primitive state.
- 🟠 **L-5 [Bug] Config keys in data don't match what primitives read.** `strength.json` gives `{window}` but TimingBar reads `zoneWidth/requiredHits/missLimit`; `defense.json` gives `{telegraphMs}` (TelegraphBlock reads none); `health.json`/`meditation.json` give `{drainRate, sustainTarget}`/`{target}` but SustainBar reads `bandWidth/targetProgress`. Everything silently falls back to code defaults (also violating "no magic numbers in code"), so tier scaling does nothing for these skills. TimingBar, SustainBar, TelegraphBlock have no `configSchema`, so nothing flags it.
- 🟠 **L-6 [Bug] `MergeCombine` is a 1-D strip, not a board,** and its win target formula (`min(reagentCount + targetTier − 1, reagentCount × 2)`) ignores geometry. Refills are random 1–4, so reaching high tiers is luck. Rebuild as a 2-D grid (2048 / Little-Alchemy style).
- 🟠 **L-7 [Bug] Time-based mechanics have no clock.** _New contract has `dt` + fixed-step driver (done 2026-11-04); legacy primitives still lack it._ `TimingBar.position` changes only when the caller sends a number; `SustainBar` only changes on `tick` and has no drift/hazard; `LaneDodge` ignores `chopSpeed`/`branchDensity`; `TelegraphBlock` has no timing window. Add a `dt` input and a fixed-timestep driver (needed by **F-4**).
- 🟡 **L-8 [Bug] Number-action counts are fixed in `skillActions.ts`** (MergeCombine 5, PathTrace 8, MemorySequence 4) instead of coming from state/config, so a larger tier board still shows 5 buttons.
- 🟡 **L-9 [Bug] Legal actions live in a `switch` on primitive id with `default: ["tick","fail"]`.** Unknown ids silently get a "fail" button, and the knowledge is duplicated from the primitives. Put it on the primitive, or delete it with **L-1**.
- 🟡 **L-10 [Gap] Retired-skill primitives still registered:** Firemaking, Herblore, Magic, Ranged (plus canvases and `skillActions` entries) have no skill JSON. Remove, or repurpose as combat styles (**C-3**).
- ~~🟢 **L-11 [Bug] Dev-only `stub` primitive is in the production registry**~~ Resolved 2026-11-04: registered only when `import.meta.env.DEV`.
- ~~🟢 **L-12 [Gap] Dev puzzle-result logging**~~ Done 2026-11-04 (dev-only `console.info` with seed, config, status, input log); duration/tier fields still to add. Original: (`{skillId, actionId, seed, tier, durationMs, success}`) does not exist; needed to tune **L-5** and **S-3**.

## 2. Combat

- 🔴 **C-1 [Opp] Combat is a toy: one hardcoded player, one enemy, one seed.** `CombatScreen` builds `{attack:10, defense:5, strength:6, hp:30}` and fights `enemies[0]`. Nothing connects to skill levels, gear, food, or the save, so the README loop "combine skills → gear → fight" has no link. Needed: `derivePlayerStats(skillXp, equipment)`, enemy tables with zones/drops, consequences (loot, XP, retry), and persistent player state.
- 🔴 **C-2 [Opp] Consider an interactive layer on top of auto-resolve.** A log of text lines will feel flat. In-scope options: pre-fight loadout (food/potions/ability), "interventions" at HP thresholds (eat, switch stance), and a playback screen with HP bars. Keep the resolver pure and seeded.
- 🟠 **C-3 [Gap] Missing combat model.** No gear slots, weapon speed/priority, abilities/cooldowns, damage types, or level-gated combat options (README §9–10; `combat/options.ts`, `stats.ts` don't exist). `Combatant.health` is unused. "Simultaneous turns" are actually sequential: A always strikes first and can win before B acts. Ranged/Magic have no home.
- 🟠 **C-4 [Bug] Consumables are wrong in several ways.** Applied once at fight start (no mid-fight healing, never removed from inventory, no count limit); potion buffs are a hardcoded `+2` in the resolver; ammo/catalyst/pouch have no combat effect (M8 unmet); `CONSUMABLES` is a code constant with 3 entries.
- 🟡 **C-5 [Bug] Balance math unclamped.** Hit chance `0.5 + (a − d)/100` can exceed 1 or go below 0; damage is a flat `strength` (no variance/armor); on the 100-round cap the "winner" is `ha > 0`, so a stalemate favours A.
- 🟡 **C-6 [Gap] Resolver returns only `winner` + strings.** Return structured events (`{turn, actor, kind, amount, hpAfter}`) for UI, audio, and tests.
- 🟢 **C-7 [Gap] `enemies.json` has no id/level/loot/zone and is not validated** by `validate-data` or `content-lint`.

## 3. Skills & Progression

- 🟠 **S-1 [Gap] Skills produce nothing.** A win only adds XP: no resource yields, no drops, no level-scaled yield (spec §8), no Mining → Smithing → gear chain. "Skills feed each other" doesn't exist.
- 🟠 **S-2 [Gap] Actions aren't selectable.** The UI picks the first action matching the tier, so `spar` in `attack.json` is unreachable at tier 1. Add action selection; let each action carry its own config override, input items, and outputs.
- 🟠 **S-3 [Bug] OSRS XP curve with puzzle-speed wins.** At 10 XP/win and L99 = 13 M XP, one skill needs ~1.3 M wins. Flatten the curve or scale XP per tier; tune using **L-12** data.
- 🟡 **S-4 [Bug] Tier is derived two ways.** `PlayScreen` uses hardcoded `tierForLevel()` (40/75) to choose the _action_ but `unlockLevel` from JSON for the _config_; they can disagree. Use JSON only.
- 🟡 **S-5 [Gap] `crafting` is in the README catalog (24 skills listed, "23" stated), in locales, and has primitives, but has no `crafting.json`.** Reconcile.
- 🟡 **S-6 [Gap] `levelCap` in JSON is unused (cap is hardcoded 100).** No total level, progress bar, or level-up feedback beyond a text line.
- 🟢 **S-7 [Bug] `xpForLevel` re-sums on every call and `levelFromXp` loops it,** called per skill on every render. Precompute a 101-entry table.
- 🟢 **S-8 [Bug] UI shows JSON `displayName` ("Attack"); the themed names in `locales/en.json` are never read** (see **T-1**).

## 4. Items, Economy & Crafting

- 🔴 **E-1 [Gap] No unified game state.** Economy, Crafting, Consumables, and Combat each hold private `useState` with hardcoded starts (`ore: 5`, `bread: 2`, `currency: 0`) and lose it on navigation. See **Y-1**.
- 🟠 **E-2 [Gap] Item/recipe data is a stub** (3 items, 2 recipes; no skill, level, tool, XP, category, value, equip slot/stats). `validate-data` doesn't cross-check references (recipe inputs, consumables, drops).
- 🟠 **E-3 [Bug] Economy accepts invalid quantities.** `buy`/`sell`/`moveItem` don't validate `qty`: negative `qty` in `buy` increases currency, negative in `sell` drains it; fractional quantities pass; `sell` trusts a caller-supplied price. Shop prices are hardcoded in `EconomyScreen`; no stock limits.
- 🟡 **E-4 [Bug] `craft()` leaves zero-quantity keys;** the UI hardcodes "smelt"/"forge" instead of listing recipes from data, and gives no feedback on missing inputs.
- 🟡 **E-5 [Gap] No inventory capacity, equipment, or item-use flow** (Consumables = an "Eat bread" button).
- 🟢 **E-6 [Opp] Define currency sinks** (repairs, travel, upgrades) before any trading is added.

## 5. Quests & Content

- 🟠 **Q-1 [Gap] Quests are one demo with no state.** `QuestsScreen` calls `canStartQuest(DEMO_QUEST, 1)` with a constant level, "Accept" just shows another node, and the reward XP is displayed but never granted. Needs a quest state machine, objectives (skill/items/kills), rewards via the shared store, and quest JSON validated by script.
- 🟠 **Q-2 [Gap] World content is nearly absent:** 1 enemy, 1 quest, 3 items, 2 recipes, no locations (`locales.ui.locations` is unused), NPCs, or areas ("Traveling → area access"). Build a content pipeline (schemas + authoring doc) before more systems.
- 🟡 **Q-3 [Opp] Use an existing dialogue runtime** (Ink/inkjs, Yarn) if quest count will grow (**I-4**).
- 🟢 **Q-4 [Bug] `QuestsScreen` uses `find(...)!`;** a bad `startNode` crashes. Validate quest data at load.

## 6. Theme & Narrative

- 🟠 **T-1 [Bug] The brutal war-god theme is almost absent from the running game.** Locale names are never loaded (no i18n code), the UI says "Attack / Play / Economy", the menu is default buttons, `styles.css` is accessibility-only, and content is generic fantasy ("Goblin", "Player", "Welcome, adventurer"), closer to the OSRS flavour the non-IP rule wants to avoid. Add a `t(key)` helper over `en.json`, move all visible strings into it, and rewrite flavour in the Pangea voice.
- 🟡 **T-2 [Gap] No lore/world bible.** Pangea, factions, regions, and the in-world meaning of 23 skills are one sentence. Write `docs/WORLD.md` (tone, naming rules, regions, enemy families) to keep content consistent and original.
- 🟡 **T-3 [Gap] The two-tone concept (brutal frame / cute puzzle) has no design tokens.** Define `--frame-*` and `--puzzle-*` sets (**V-1**).
- 🟢 **T-4 [Bug] Name inconsistency:** repo/package/storage keys say "skillbound", UI/docs say "The Wargod of Pangea".

## 7. Frontend / UI

- 🔴 **F-1 [Opp] There is no game shell.** Navigation is a `useState<Screen>` with one `if` per screen and a duplicated "Back" button; screens unmount on every navigation (state loss); Play uses a fixed `100vh` inline-styled grid; Debug is on the main menu. Add routing (hash router), a persistent layout (HUD: currency/HP/levels, nav, content, log). This is the most visible improvement available.
- 🟠 **F-2 [Bug] `PlayScreen` correctness problems.**
  - `handleNumberAction` casts XP skill state to `PrimitiveState` (`skillState as unknown as PrimitiveState`) and feeds it to `primitive.apply`, so the 4 number-action skills (alchemy, foraging, transmutation, traveling) never run their real puzzle.
  - Side effects (`saveAllSkills`, `setMsg`, `setSeed`) run inside `setSkillStates` updater functions, which StrictMode runs twice in dev.
  - `saveAllSkills` hardcodes `version: 1` instead of `SAVE_VERSION`, and writes only the skills in memory, overwriting any others in the save when there was no prior save loaded.
  - `MinigameRunner` creates state once in `useState`; `PlayScreen` doesn't pass a `key`, so after `seed` changes the puzzle stays on the finished state.
  - `fontSize: 0.9` is a no-op (no unit).
- 🟠 **F-3 [Gap] `PlayScreen` and `PvPHotseat` duplicate a 23-import `SKILL_DATA` map and `SkillData` type.** Build one data registry (e.g. `import.meta.glob`) with Zod-validated types shared by game, scripts, tests.
- ~~🟠 **F-4 [Gap] The 17 `*Canvas.tsx` components are orphaned.**~~ Resolved 2026-11-04: all deleted; `PuzzleCanvas` + `puzzleViews/` host the new puzzles. (Rendering will move to PixiJS in Phase 4.) No screen imports any (only `AimShotCanvas`/`MiningCanvas` tests do); `PlayScreen` uses button-based `MinigameRunner`. They are near-identical boilerplate (own `render`, `speak`, `onKey`), three are for retired skills, and they drive counter primitives. Replace with one `PuzzleCanvas` host that draws a primitive's `view(state)` (**L-1**) and delete the rest.
- 🟡 **F-5 [Bug] `MinigameRunner` displays `JSON.stringify(state)` and re-fires `onResult` on every click after the game ends** (state stays `won`/`lost`, and the handler reports it again).
- 🟡 **F-6 [Bug] Dead/unsafe components.** `PuzzleHost` calls `p.create()` and `onState` during render and is unused; `ChatBox` is unused (local echo placeholder). Delete or fix.
- 🟡 **F-7 [Gap] No reset/export save control, no confirm on destructive actions, no loading/empty states.**
- 🟡 **F-8 [Gap] Not responsive/mobile-ready** though the style target is classic-mobile: no touch/pointer handling, fixed canvas pixel sizes (320×120), `index.html` lacks description, theme-color, icons, favicon, manifest.
- 🟢 **F-9 [Bug] Inline styles and hardcoded colors (`#555`, `#444`) bypass the colorblind tokens.**
- ~~🟢 **F-10 [Bug] Debug launcher is shipped to players**~~ Resolved 2026-11-04 (menu entry and screen are DEV-only). Remaining: the launcher still only prints status text instead of rendering the puzzle (fold into Phase 1 `PuzzleCanvas`).

## 8. Visuals

- 🔴 **V-1 [Opp] No art direction exists.** Default buttons and `#111` canvases with circles. The "cute puzzle in a brutal frame" contrast is the game's visual hook; decide palette, type, icon set, and puzzle shape language _before_ rebuilding primitives, and source an asset kit (**I-3**).
- 🟠 **V-2 [Gap] No feedback/animation layer:** hit/miss flashes, particles, shake (gated by reduced motion), level-up celebration, transitions.
- 🟠 **V-3 [Gap] No asset pipeline:** sprites, atlases, preloading, devicePixelRatio-aware canvas (currently raw circles at fixed sizes).
- 🟡 **V-4 [Gap] No chunky typography** from the spec (system font). Use a self-hosted OFL font.
- 🟢 **V-5 [Bug] Colorblind mode swaps only `--color-ok`/`--color-bad`,** and nothing uses `--color-bad`. Add shape/pattern cues, not only hue.

## 9. Sounds & Music

- 🟠 **A-1 [Gap] Audio is never played.** `playSfx`/`startMusic` have no callers; only `applySettings` runs. No SFX for hit/miss/win/level-up, no scene music. M9 unmet in practice despite sliders.
- 🟠 **A-2 [Gap] Engine is a single oscillator drone.** Needs real assets (OGG sprites), a manager (preload, pooling, crossfade, scene loops, ducking), and the autoplay unlock flow: `AudioContext` is created from a `useEffect` before any gesture and `resume()` is never called.
- 🟡 **A-3 [Bug] `applySettings` sets `gain.value` directly** (zipper noise on slider drag; use `setTargetAtTime`); music mute only zeroes gain while the oscillator keeps running; `stopMusic` swallows errors.
- 🟡 **A-4 [Gap] Sources/licensing undecided.** Choose CC0/CC-BY and track attribution in `CREDITS.md`.
- 🟢 **A-5 [Opp] Pair every sound with a visual cue** ("no information by audio alone" pillar).

## 10. Save & System Management

- 🔴 **Y-1 [Gap] No game-state architecture.** Save holds only `{version, skills: id→xp}`; inventory, bank, currency, equipment, quest state, and stats aren't saved; there's no central store (**E-1**). Introduce one typed store (Zustand is already a dependency but unused), Zod-validated load, debounced autosave, and real migrations.
- 🟠 **Y-2 [Bug] Save robustness.** `loadGame()` swallows every error (`catch { return null }`) and the next `saveGame` overwrites a corrupted/newer save, destroying player data. No backup slot, no handling of saves from a newer version, no quota/private-mode handling. Keep the unreadable blob under a backup key and show recovery UI.
- 🟠 **Y-3 [Gap] No export/import or cloud save.** A downloadable save file/string is the minimum safety net for a static-hosted game.
- 🟡 **Y-4 [Bug] Settings load spreads unvalidated JSON** (wrong types survive; no clamping of sliders).
- 🟡 **Y-5 [Opp] Decide on offline/idle progression** if the "idle/RuneScape-style" audience is real.
- 🟢 **Y-6 [Gap] No dev telemetry hooks** (see **L-12**).

## 11. Backend, Multiplayer & PvP

- 🔴 **B-1 [Opp] Decide multiplayer scope now.** README says "Puzzle-driven MMORPG", yet nothing in the client is structured for it. A realistic path: ship single-player first; add **async PvP** (both players solve the same seeded puzzle, submit input logs, a server verifies by replaying the deterministic reducer) and **cloud saves** before any real-time race. Deterministic replay (**L-1**, **L-4**) is the prerequisite and the architecture's best asset. Backend candidates: Supabase/Firebase free tiers, Cloudflare Workers + D1/Durable Objects, or Colyseus/PartyKit for realtime rooms (**I-1**).
- 🟠 **B-2 [Bug] PvP hotseat awards the round to whoever _fails_ first.** `MinigameRunner` calls `onResult("won" | "lost")`; `PvPHotseat` ignores the argument and scores a win either way. A loss should end that player's attempt, not score.
- 🟠 **B-3 [Gap] Hotseat isn't really hotseat:** shared mouse/buttons, no input split (keyboard zones), no simultaneous timing, always tier 1, no fairness rule across skill levels, no match persistence. Because the primitives auto-win, the "race" is a button-clicking race (**L-1**).
- 🟡 **B-4 [Gap] Identity, rate limiting, anti-cheat, and chat moderation are unplanned.**
- 🟢 **B-5 [Gap] README forbids runtime network calls;** if **B-1** is accepted, update the policy and add a privacy note.

## 12. Integrations (engines, libraries, services)

- 🔴 **I-1 [Opp] Adopt a rendering/engine layer for puzzles.** Hand-rolled Canvas 2D ×17 near-duplicates won't scale to polished puzzles. Options: **Phaser 3** (MIT: scenes, input, tweens, audio, asset loading; embeddable in a React shell), **PixiJS** (MIT, rendering only, lighter), or a full engine (Godot web export) only if a rewrite is acceptable, which is not recommended given the TS logic base. Recommendation: keep React for the shell and pure TS for primitives; add Pixi or Phaser purely for rendering/animation. Dependency-approval rule applies.
- 🟠 **I-2 [Opp] Reuse open-source puzzle logic** (MIT/Apache) for match-3/2048 merges, minesweeper grids, flow/path solvers, tangram/polyomino packing, rhythm scheduling, behind the `Primitive` interface.
- 🟠 **I-3 [Opp] Asset sources:** Kenney.nl (CC0 UI/sprites/SFX), OpenGameArt, Freesound CC0, self-hosted OFL fonts; add `CREDITS.md`.
- 🟡 **I-4 [Opp] Dialogue/quests:** inkjs (MIT) or Yarn-style JSON (**Q-3**).
- 🟡 **I-5 [Opp] Audio library:** Howler.js (MIT) or Tone.js to replace the hand-written `audio.ts` (**A-2**).
- 🟡 **I-6 [Opp] Finish adopting what's installed:** Zustand for **Y-1**; Zod (undeclared, **D-2**) at runtime for data/save validation, replacing `content-lint`.
- 🟡 **I-7 [Opp] i18n:** `i18next` or a ~20-line helper over `en.json` (**T-1**).
- 🟢 **I-8 [Opp] Packaging:** ~~delete `electron/`~~ (deleted 2026-11-04). Tauri or a PWA install remains an option if a desktop/Steam build is ever wanted.

## 13. Accessibility

- 🟠 **X-1 [Bug] Pillar not met by the live game.** The keyboard/aria-live canvases aren't mounted (**F-4**); the live runner has unlabeled number buttons ("0", "1"…), no live status region, and no instructions.
- 🟡 **X-2 [Bug] The in-app `reducedMotion` setting is stored but never applied.** Only the OS media query is honored.
- 🟡 **X-3 [Gap] Text scale only affects `body` font-size;** inline pixel sizes and canvas text ignore it. No high-contrast mode, key remapping, or per-puzzle screen-reader instructions; Play screen lacks landmark structure (`<main>` nested in a grid `div` beside an `<aside>`).
- 🟢 **X-4 [Gap] Sliders lack value readouts;** inconsistent label/input structure in Settings.

## 14. Build, Tooling & CI

- ~~🟠 **D-1 [Gap] CI doesn't run the gates.**~~ Resolved 2026-11-04: `.github/workflows/ci.yml` (typecheck, lint, test, content-lint, validate-data) runs on PRs and `deploy.yml` depends on it. Not yet exercised on GitHub (no remote, see D-3).
- ~~🟠 **D-2 [Bug] `zod` undeclared**~~ Resolved 2026-11-04: `zod@^4.6.7` declared; `validate-data` updated to the v4 `z.record(key, value)` form; `@types/node` declared (it had been coming from the Electron typings). `zustand` is still declared but unused until Phase 2.
- 🟡 **D-3 [Gap] Repository hygiene.** Done 2026-11-04: `.prettierrc`, `.editorconfig`, `.gitignore`, `.prettierignore`, `format:check` and `check` scripts. Remaining: this folder is still not a git repository (no history/backup); needs `git init` and a remote. No pre-commit hook yet.
- ~~🟡 **D-4 [Bug] `scripts/fix-skills.mjs` is stale and destructive**~~ Deleted 2026-11-04.
- 🟡 **D-5 [Gap] Lint config is basic:** no `eslint-plugin-jsx-a11y` despite accessibility being a "gate". (Electron mismatch resolved 2026-11-04 by deleting `electron/`.)
- 🟡 **D-6 [Gap] `content-lint` is shallow** (≥3 tiers, config present, ≥1 action). It doesn't check that the primitive exists, that config keys match `configSchema` (**L-5**), that unlock levels are monotonic, or that locale names exist.
- 🟢 **D-7 [Gap] Single 261 kB chunk,** no code splitting by screen, and `tsconfig.tsbuildinfo` sits in the project root (should be ignored).

## 15. Testing

- 🟠 **TS-1 [Gap] Tests prove reducers, not gameplay.** The "win/lose/replay" pattern for counter primitives asserts only that sending the win action wins, so it can't catch **L-1/L-2**. Add property-based tests (fast-check) for seeded determinism and "random play rarely wins", and solver-based tests (perfect script wins; perfect-minus-one loses).
- 🟠 **TS-2 [Gap] No UI/integration tests for screens.** `App.test.tsx` is a single smoke test; Play, PvP, Combat, Economy, Settings, save/restore are untested. Add Testing Library flows and a Playwright smoke test of the built site.
- 🟡 **TS-3 [Gap] Economy/crafting/consumables tests skip invalid input** (negative/zero/fractional qty, insufficient funds, zero-key cleanup), which is how **E-3** slipped through.
- 🟡 **TS-4 [Gap] No coverage threshold** although the coverage plugin is installed.
- 🟢 **TS-5 [Gap] No data test.** _Done for migrated skills 2026-11-04 (`puzzles.test.ts` parses every tier with zod and solves it); extend as skills migrate._ A test that loads every skill JSON, runs `validateConfig` and `create` for each tier, would have caught **L-5**.

## 16. Scope & Docs

- 🔴 **P-1 [Opp] Re-baseline scope against reality.** README marks M0–M6 "done", but acceptance is met only at module level (M1 "primitives" = reducers that auto-win; M2 "combat" = a toy). Treat the repo as a **systems prototype** and plan a vertical slice: _3 real puzzles → 3 skills with yields → 1 crafted item → 1 equippable → 1 combat zone with drops → saved state → themed UI → deployed_. Park the other ~20 skills, quests, PvP, and MMO until the slice is fun. **Accepted 2026-11-04: see [ROADMAP.md](ROADMAP.md) (slice = Mining → Smithing → Attack → combat).**
- ~~🟠 **P-2 [Bug] README is out of date vs the code.**~~ Resolved 2026-11-04: root `README.md` is now a short overview; the spec moved to `docs/DESIGN.md` with its stale structure/milestone/agent-rule sections marked superseded. (Spec primitive names still differ from code names until Phase 1.)
- 🟡 **P-3 [Gap] No contributor docs:** how to add a skill/primitive/item/quest, data schema reference, release checklist.
- ~~🟡 **P-4 [Bug] README §12 "Rules for the AI Agent (Cline)"**~~ Resolved 2026-11-04: current rules live in `AGENTS.md`.
- 🟢 **P-5 [Gap] Open decisions** (resolve, then delete): localization beyond English, Health tier-3 variant, Magic catalyst source, player trading, music sourcing, PvP netcode. (Hosting = GitHub Pages and name = The Wargod of Pangea decided 2026-11-04.)

---

## Suggested order of attack

1. **P-1** (slice scope), then **D-1/D-2/D-3** (git, CI, deps) so the work is safe.
2. **L-1, L-4, L-5, L-7** on 3 primitives (TimingBar, AimShot, MemorySequence), plus **F-2/F-4** so they're playable, with **TS-1**.
3. **Y-1/E-1** (one store, full save) → **S-1/S-2** (yields, actions) → **E-2**, **C-1/C-3** (stats from skills + gear).
4. **T-1, V-1, F-1** (theme, art direction, shell), then **A-1/A-2**.
5. Only then: **Q-1/Q-2**, **B-1** (async PvP / cloud saves), and the remaining skills.
