# The Wargod of Pangea: Design Spec

> **Note:** This is the design spec (vision, pillars, puzzle and skill catalog). It is not a description of the current code. Current state: [ARCHITECTURE.md](ARCHITECTURE.md). Problems: [audit.md](audit.md). Build plan: [ROADMAP.md](ROADMAP.md), which supersedes §11 milestones, §5 repository structure, and §12 agent rules below (those are kept for history). Primitive names in §7 are the design targets; the code currently uses different names and many are not built yet.

## 1. Project Overview

The Wargod of Pangea is a text-forward, brutal war-god RPG that runs in the browser. You are an over-the-top demigod of war on the continent of Pangea, yet every skill is trained through its own short, silly, pretty-and-bubbly mobile-style puzzle minigame. Each skill's puzzle mechanic is the verb of that skill — you aim to train Attack, you block to train Defense, you chop to train Woodcutting. Puzzles are untimed and freely retryable; only successful completions award XP.

Genre: Puzzle-driven MMORPG (solo-first, PvP later).

Player loop: pick skill → pick action → solve procedural puzzle → earn XP + resources → level up → unlock harder puzzles/actions/gear → combine skills to craft gear → fight enemies → repeat.

Visual style: The framing shell is brutal and over-the-top — heavy war-god UI, harsh limited palette, chunky combat typography — but each puzzle play area is the opposite: a silly little classic-mobile game that's pretty and bubbly at a glance (Timberman, Minesweeper, Simon, Tangram, etc.). One puzzle fills the main play area.

Audience: Players who enjoy idle/RuneScape-style progression but want active, skill-specific minigames, wrapped in a brutally themed war-god fantasy.

Non-IP statement
This game is inspired by OSRS-style skill progression but is an original work. All skill names, item names, lore, and UI text must be original. Internal mechanical keys use neutral identifiers (e.g. attack, woodcutting); display names live in locale files and are themed to the Wargod of Pangea setting.

## 2. Core Loop (locked)

Player selects a skill and an action (action requires a minimum level).

A puzzle is generated procedurally from a seeded RNG, sized to the action's tier.

Puzzle is untimed (except PvP). Player may retry freely. Only success awards XP and resources.

XP triggers level-ups, which unlock new actions, higher puzzle tiers, equipment, and combat options.

PvE combat auto-resolves simultaneous turns using gear + skill levels. Combat skills are trained through their own minigames outside of combat, not during it.

PvP is a real-time puzzle race: both players solve skill-appropriate puzzles per round; first to complete wins the round; match ends at a fixed number of round wins.

Skills feed each other: Foraging/Farming → Cooking/Alchemy; Trapping/Hunting → Leatherworking; Mining → Smithing → gear; Woodcutting → Construction/Fletching; Fishing → Cooking → combat food; Traveling → area access; Meditation/Prayer/Summoning → buffs; Transmutation → item conversion; etc.

## 3. Design Pillars

The verb is the minigame. If a skill does X, its puzzle is X. Attack = accuracy; Strength = power; Defense = block; Health = endurance.

One screen, instantly readable. Puzzles must be legible as their classic-mobile ancestor at a glance (Timberman, Minesweeper, Simon, Tangram, etc.).

Scale the parameters, not the rules. Higher levels use the same primitive with tighter zones, faster speeds, bigger boards, more decoys, longer sequences.

Deterministic & testable. All puzzles are seeded. Same seed = same layout. Every primitive has unit tests for win/lose/replay.

Data-driven. Skills, actions, tiers, recipes, enemies, loot, and puzzle parameters live in /data JSON. No magic numbers in code.

No fail-state spiral. Players can always retry; failure costs only time, never resources or XP.

Accessible by default. Keyboard-first, colorblind-safe palettes, reduced-motion, adjustable text size, no information conveyed by audio alone.

## 4. Tech Stack (recommended, AI-agent friendly)

Concern Choice Rationale
Language TypeScript (strict) AI agents excel here; strong types for puzzle configs.
UI shell React + Vite Fast iteration, huge ecosystem, easy screens.
Puzzle rendering HTML5 Canvas 2D Zero-dependency; pixel-perfect retro control; AI-friendly.
Web hosting Static site (GitHub Pages / Netlify / Vercel / Cloudflare Pages) Free, zero-config, global CDN.
State Zustand Minimal, testable, no boilerplate.
Persistence browser localStorage with versioned schema + migrations.
Testing Vitest Fast, works with TS, matches Vite.
Lint/format ESLint + Prettier Enforced in CI/agent workflow.
Audio HTML5 <audio> + Web Audio API for simple loops/SFX.
Dependency policy: All dependencies must be free (MIT/Apache-2.0/BSD). The agent must ask before adding a new dependency and prefer zero-dependency implementations where reasonable. No paid services, no telemetry, no runtime network calls (except the future PvP server, which is a separate milestone).

Commands the agent must keep working:

text
npm run dev # launch Vite dev server
npm run build # production static build (dist/)
npm test # vitest run
npm run lint # eslint
npm run typecheck
npm run preview # preview production build locally

5. Repository Structure (SUPERSEDED: aspirational layout, see ARCHITECTURE.md for the real one) skillbound/
   ├─ .github/workflows/
   │ └─ deploy.yml # GitHub Pages deploy (free)
   ├─ netlify.toml # Netlify deploy config (free)
   ├─ electron/ # legacy Electron shell (archived, no longer used)
   │ └─ main.cjs
   ├─ src/
   │ ├─ main.tsx
   │ ├─ App.tsx
   │ ├─ screens/
   │ │ ├─ MainMenu.tsx
   │ │ ├─ SkillSelect.tsx
   │ │ ├─ ActionSelect.tsx
   │ │ ├─ PuzzleHost.tsx # mounts a primitive to canvas
   │ │ ├─ CombatPve.tsx
   │ │ ├─ CombatPvp.tsx
   │ │ ├─ Inventory.tsx
   │ │ ├─ Bank.tsx
   │ │ ├─ Shop.tsx
   │ │ ├─ Crafting.tsx
   │ │ ├─ Settings.tsx
   │ │ └─ Debug.tsx # dev-only primitive launcher
   │ ├─ core/
   │ │ ├─ puzzles/
   │ │ │ ├─ types.ts # PuzzlePrimitive interface, configs, results
   │ │ │ ├─ rng.ts # seeded PRNG (e.g. mulberry32)
   │ │ │ ├─ engine.ts # mounts primitive, drives update loop
   │ │ │ ├─ registry.ts # primitive id → factory
   │ │ │ └─ primitives/
   │ │ │ ├─ TimingBar.ts
   │ │ │ ├─ AimShot.ts
   │ │ │ ├─ TrajectoryShot.ts
   │ │ │ ├─ TelegraphBlock.ts
   │ │ │ ├─ SustainBar.ts
   │ │ │ ├─ MemorySequence.ts
   │ │ │ ├─ GridReveal.ts
   │ │ │ ├─ MatchSwap.ts
   │ │ │ ├─ PathTrace.ts
   │ │ │ ├─ FitPieces.ts
   │ │ │ ├─ RhythmTap.ts
   │ │ │ ├─ LaneDodge.ts
   │ │ │ ├─ OrderedTap.ts
   │ │ │ └─ MergeCombine.ts
   │ │ ├─ progression/
   │ │ │ ├─ xp.ts # OSRS-style curve, level 1–100
   │ │ │ └─ skills.ts # runtime skill state
   │ │ ├─ combat/
   │ │ │ ├─ resolvePve.ts # simultaneous-turn auto resolver
   │ │ │ ├─ stats.ts # gear + level → derived stats
   │ │ │ └─ options.ts # level-gated abilities
   │ │ ├─ economy/
   │ │ │ ├─ items.ts
   │ │ │ ├─ inventory.ts
   │ │ │ ├─ recipes.ts
   │ │ │ └─ shop.ts
   │ │ ├─ save/
   │ │ │ ├─ schema.ts
   │ │ │ └─ migrations.ts
   │ │ └─ audio/
   │ │ └─ manager.ts
   │ ├─ data/ # JSON skill/action/recipe/enemy data
   │ │ ├─ skills/_.json
   │ │ ├─ actions/_.json
   │ │ ├─ items/_.json
   │ │ ├─ recipes/_.json
   │ │ └─ enemies/*.json
   │ ├─ locales/en.json # themed display names, flavor text
   │ └─ styles/
   │ ├─ tests/
   │ └─ package.json
   Architecture rules:

core/puzzles/primitives/* must not import skill data or React. They are pure logic + canvas draw.

Skills consume primitives

6. Puzzle Primitives
   (The full primitive catalog lives inline in the README source; see sections 7.1–7.14 below.)

7.1 AimShot — Accuracy (Attack)
Fire a projectile along a parabola. Hit the target(s). Decoys appear at higher tiers.

Knobs: gravity, wind, moving target, obstacles/bounces, required hits, projectile speed.
Lose: out of projectiles.

7.2 TelegraphBlock — Block (Defense)
Incoming attacks telegraph from N/E/S/W (and diagonals at higher tiers). Input the matching block direction. Feints appear at higher tiers.

Knobs: attack rate, directions count, feint probability, sequence length, timing window.
Lose: N unblocked hits.

7.3 TimingBar — Power (Strength)
Stop a moving marker inside a green zone.

Knobs: zone width, speed, hit count, miss limit.
Lose: N misses.

7.4 SustainBar — Endurance (Health / Fishing / Firemaking)
Hold a moving value inside a drifting band. Progress fills while in-band, drains while out-of-band.

Modes via params:
fishing: player controls a vertical reel; fish random-walks; band = safe tension.
firemaking: feed fuel to keep flame in a temperature band.
health: spend/regain stamina windows to survive a hazard stream.

Knobs: band width, drift speed, fill rate, drain rate, hazard rate, duration.
Lose: progress reaches 0 (fishing/fire) or HP reaches 0 (health).

7.5 MemorySequence — Invoke (Prayer)
Simon-style: a sequence of lit symbols flashes; repeat it. Sequence grows each round.

Knobs: sequence length, flash speed, symbol count, reversals, interference flashes.
Lose: N wrong inputs.

7.6 GridReveal — Clear (Mining)
Minesweeper on a small grid. Reveal tiles; ore tiles are safe; gas pockets (mines) end the run. Goal: reveal K ore tiles.

Knobs: grid size, gas density, cluster rules, required ore count, numbered hints on/off.
Lose: hit a gas pocket.

7.7 MatchSwap — Tend (Farming)
Match-3: swap adjacent crops to line up 3+. Grown lines clear and count toward harvest.

Knobs: board size, color count, move limit, growth stages.
Lose: out of moves before harvest target.

7.8 PathTrace — Trace / Bind (Magic, Summoning)
Connect nodes with a continuous path.

Modes:
glyph (Magic): visit nodes in the numbered order; lift not allowed mid-glyph.
flow (Summoning): fill every path so all nodes are connected (Flow Free style).

Knobs: node count, decoy nodes, no-lift rule, crossing forbidden.
Lose: N invalid breaks.

7.9 FitPieces — Fit (Crafting, Construction)
Drag/rotate pieces into a silhouette (tangram) or fill a footprint with polyominoes (1010!-style).

Knobs: piece count, rotation allowed, decoy pieces, tolerance, blueprint complexity, grid size.
Lose: N misplacements.

7.10 RhythmTap — Strike (Smithing)
Notes scroll; tap on beat at the hit line. A heat meter drifts and must be corrected with "stoke" taps between hammer hits at higher tiers.

Knobs: tempo, hit count, hit window, heat band width, heat drift, double notes.
Lose: N misses.

7.11 LaneDodge — Chop / Endure (Woodcutting; Health tier-3 variant)
Timberman-style: chop left/right lanes; branches fall on one side — chop the safe side. Health variant: dodge hazard lanes while regenerating.

Knobs: chop speed, branch density, rhythm bonus, hazard count, dodge direction count.
Lose: N collisions.

7.12 OrderedTap — Recipe Sequence (Cooking)
Ingredients/step-icons appear; tap them in the recipe's order, each within a time window. Decoy ingredients appear at higher tiers.

Knobs: step count, window size, decoy count, parallel dishes.
Lose: N wrong taps or missed windows.

7.13 MergeCombine — Measure / Combine (Alchemy / Transmutation)
2048/Little-Alchemy style: merge two adjacent reagent tiles to produce a higher-tier reagent; reach the target reagent.

Knobs: board size, reagent count, merge rules, target tier, move limit.
Lose: out of moves.

## 8. Skill Catalog (launch scope: 23 skills)

Internal IDs are mechanical; themed display names live in locales/en.json.

# Skill ID Primary primitive Themed display name Training action examples Feeds

1 attack AimShot Skullcleaving strike dummy, spar combat accuracy
2 defense TelegraphBlock Ironhide guard drill, shield work combat evasion/block
3 strength TimingBar Bonecrushing heavy lift, power swing combat damage
4 health SustainBar (tier 3: LaneDodge) Guts conditioning, endurance run max HP, regen
5 dungeoneering GridReveal/AimShot Delve clear dungeon rooms combat loot
6 mining GridReveal Orecracking prospect, clear seam ore → smithing
7 smithing RhythmTap Anvil of War forge bar, hammer blade bars → gear
8 woodcutting LaneDodge Timbercleaving chop tree logs → crafting/fire/construction
9 fishing SustainBar (fishing) Gillguttering net, bait, cage, harpoon raw fish → cooking
10 cooking OrderedTap Feast Prep prepare dish food → combat heal
11 farming MatchSwap Field Tilling plant, harvest crops → cooking
12 crafting FitPieces (tangram) Gearforging assemble, stitch, fletch tools, bows, ammo, armor
13 construction FitPieces (1010) Fortraise build room, furnish housing, storage, buffs
14 summoning PathTrace (flow) Daemonbinding bind spirit, link summons pet perks
15 foraging Stub/MergeCombine Rootrip gather nuts, berries, fruit → cooking
16 trapping AimShot/SustainBar Snarecraft set traps hides → leatherworking
17 hunting LaneDodge/AimShot Beaststalking track, down game animal byproducts
18 traveling MemorySequence Road March navigate area access
19 leatherworking FitPieces Hide Tanning work hides leather armor
20 fletching FitPieces Flightshafting fletch shafts bows, arrows, ammo
21 meditation SustainBar Stillness endure, focus buffs, sustain
22 alchemy MergeCombine Vialcraft mix reagent, brew potions → combat buff
23 prayer MemorySequence Zealotry invoke rites buffs, sustain
24 transmutation MergeCombine/PathTrace Soulforge convert items item conversion

Skill data file shape (data/skills/woodcutting.json):

json
{
"id": "woodcutting",
"displayName": "Timbercleaving",
"primitive": "LaneDodge",
"levelCap": 100,
"tiers": [
{ "tier": 1, "unlockLevel": 1, "config": { "required": 3 } },
{ "tier": 2, "unlockLevel": 40, "config": { "required": 4 } },
{ "tier": 3, "unlockLevel": 75, "config": { "required": 5 } }
],
"actions": [{ "id": "train", "minLevel": 1, "xp": 10, "tier": 1 }]
}

Yield bundling: one successful puzzle = one action batch. Batch size scales with level (e.g. yield = 1 + floor(level/20)) so grind stays sane. Yield scaling is defined per action in JSON.

## 9. Progression & XP

Level cap: 100.

XP curve: OSRS formula.
xp(L) = floor( (1/4) * Σ_{n=1}^{L-1} floor(n + 300 * 2^(n/7)) )
Reference points: L50 ≈ 101,333; L75 ≈ 1,210,421; L99 = 13,034,431; L100 ≈ 14,391,160.

Tier unlock levels per skill: tier 1 at L1, tier 2 at L40, tier 3 at L75. Tunable in data/skills/*.json.

Combat options (abilities) unlock at specific skill levels; stored in core/combat/options.ts reading from skill JSON.

Level-ups are per-skill and independent.

## 10. Combat

10.1 PvE — auto-resolved simultaneous turns
Combat is not played with minigames. It resolves automatically turn-by-turn.

Each combatant: stats (derived from skill levels), gear (weapon, armor slots, accessories), options (level-gated abilities with cooldowns/weights), inventory (consumables like food/potions).

Turn resolution: both sides act simultaneously each turn. Order within turn is by priority (weapon speed, ability priority), then tie-broken by seeded RNG.

Standard loop: accuracy roll vs defense, then damage; PvP is a real-time puzzle race.

## 11. Roadmap Milestones (SUPERSEDED by ROADMAP.md)

M0 — Scaffolding (done)
Repo setup, TypeScript strict, Vitest, ESLint, Prettier, seeded RNG, primitive interface, canvas engine, four green commands.

M1 — Primitives (done)
AimShot, TelegraphBlock, TimingBar, SustainBar, GridReveal, MatchSwap, PathTrace, FitPieces, RhythmTap, LaneDodge, OrderedTap, MergeCombine — each with seeded replay/win/lose tests.

M2 — Combat (done)
PvE simultaneous-turn resolver, stats, options.

M3 — Save & migrations (done)
Versioned save schema, migrations, ErrorBoundary.

M4 — Skills remapped (done)
All skill data JSONs + primitive configs for the launch set.

M5 — Items & recipes to JSON (done)
Item registry, recipes, validation.

M6 — Economy (done)
Inventory, bank, shop, item registry, recipes, currency.

M7 — Remaining launch skills (open)
Foraging, Farming, Trapping, Fishing, Hunting, Mining, Woodcutting, Traveling (gathering); Cooking, Leatherworking, Smithing, Construction, Fletching (crafting); Attack, Strength, Defense, Health, Dungeoneering (combat); Meditation, Alchemy, Prayer, Summoning, Transmutation (magic) — each with 3 tiers and at least one action per tier in JSON. Wire all 23 into registry + PlayScreen (currently hardcodes the old 18).
AC: All 23 skills trainable; data JSON complete; tests for every primitive.

M8 — Consumables & resource integration
Food heals in combat, potions buff, ranged ammo consumed, magic catalysts consumed, summoning pouches grant effects.
AC: Combat end-to-end uses crafted consumables and ammo; depletion behaves correctly.

M9 — Audio
Per-skill music loops + SFX, settings sliders, mute/reduce-motion respect.
AC: Audio starts/stops per scene; settings persist; disabled audio never blocks gameplay.

M10 — Quests & NPCs (vertical slice)
Dialogue trees, one complete quest gated by skill level.
AC: Player completes quest from NPC start to reward.

M11 — PvP (local hotseat first)
Two local players race puzzles per round; first completion wins round; best-of-5 match.
AC: Full match playable on one machine; round scoring correct; input split works.

M12 — Web deployment (free static hosting)
Production build to dist/, deploy via GitHub Pages or Netlify (free tiers). Browser localStorage for saves.
AC: Game loads at a public URL; saves persist in browser; all gates green.

## 12. Rules for the AI Agent (carried over; see AGENTS.md for the current version)

Follow milestones in order. Do not implement future-milestone features without approval, even if they seem easy.

One milestone = one PR-sized change set. End with a status report: what was built, tests added, demo path, known gaps.

Ask before adding dependencies. All deps must be free (MIT/Apache/BSD). Prefer zero-dep.

Primitives must not import skill data, React, or Electron. They are pure logic + canvas.

All numbers live in /data JSON. No hardcoded puzzle params, XP values, yields, or prices in code.

Seeded RNG only. Never call Math.random() in game logic — always rng.ts.

Versioned saves. Any save schema change adds a migration + test.

TypeScript strict. No any without a justified eslint-disable comment.

Accessibility is a gate. New screens ship with keyboard nav + aria-labels + colorblind-safe palette tokens.

Every primitive ships with tests for seeded replay, win, and lose.

Keep the four commands green: typecheck, test, lint, build.

No runtime network calls until M11. No telemetry.

When ambiguous, ask. Do not silently guess on design choices.

Log puzzle results in dev builds: {skillId, actionId, seed, tier, durationMs, success} for balance tuning.

## 13. Deferred / Open Decisions (track, don't block)

Display-name localization beyond English.

Music assets — source/compose placeholder loops; final composers TBD.

PvP netcode — protocol, server host, matchmaking (M11+).

Web deployment platform — confirm GitHub Pages vs Netlify vs Cloudflare Pages preference.

Health skill tier-3 variant — confirm LaneDodge variant or replace with second SustainBar mode.

Herblore tier-3 — N/A (herblore retired; alchemy covers MergeCombine).

Magic catalyst source — confirm arcane ore → Crafting/Herblore path.

Trading between players — deferred past launch.

End of spec. Build M0 first; wait for approval before M1.
