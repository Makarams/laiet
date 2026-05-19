# CLAUDE.md — LA-IET.EXE

> "la-iet" = small animal / insect, in Khmer.

## What this project is

LA-IET.EXE is a **generational insect colony simulation** in the browser. The player is a caretaker — they cannot command the colony, only tend it. The colony breeds, mutates, bonds, fractures across tribes, evolves a shared symbolic language, and over many generations becomes aware it is being watched.

The simulation is **continuous and open-ended**. The only hard termination is extinction. Awareness stages 1–5 are gradient bands derived from the colony's actual creature distribution, not narrative gates.

Inspired by: Black Mirror S7E4 "Plaything" and Dwarf Fortress.
Free forever. Passion project. Built by Sammakara Mak.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite 6 + TypeScript 5 |
| Styling | Styled Components v6 (with the unified token system in `src/ui/theme.ts`) |
| State | Zustand v5 (one flat store) |
| Auth | Supabase email + password |
| Persistence | IndexedDB (local) + Supabase JSONB (cloud) |
| Rendering | HTML Canvas 2D — isometric 480×480 grid |
| Audio | Web Audio API — see `docs/audio.md` |
| Deploy | Vercel (`vercel.json` handles SPA routing) |

---

## Project structure

```
src/
├── types/index.ts          Canonical types — read this first
├── engine/
│   ├── constants.ts        Every tuning value — never hardcode elsewhere
│   ├── genetics.ts         Trait pools, inheritance, mutation, adaptation
│   ├── messages.ts         Chronicle-composed colony speech (no authored prose)
│   ├── profile.ts          CaretakerProfile → SimModifiers (orthogonal axes)
│   ├── speech.ts           Emoji vocabulary tiers, composer pipeline
│   ├── chronicle.ts        Colony's real event memory (bounded ring)
│   └── tick.ts             Main simulation loop (tickSimulation)
├── world/worldGen.ts       Procedural 240×240 world, seeded RNG
├── creatures/
│   ├── factory.ts          spawn, createOffspring, createAsexualOffspring
│   └── behavior.ts         Drive selector, AI state machine, movement
├── ui/
│   ├── theme.ts            DESIGN TOKENS (colors, space, motion, glow, radius)
│   ├── components/         App, GameLayout, GameCanvas, Toolbar, screens, EventPopup
│   ├── panels/             ColonyStatsPanel, DossierPanel, MessageLogPanel
│   └── renderer/           Canvas drawing (tiles, creatures, overlays, utils)
├── audio/chiptune.ts       Adaptive music + weather ambient
├── db/                     Supabase client + IndexedDB persistence
└── store/gameStore.ts      Zustand store; all caretaker actions
```

---

## Key files

**`src/types/index.ts`** — Start here. Defines: `Creature` (drives, feared map, lastAttackerId, biomeResidence), `Genome` (diploid alleles + morphology + adaptations + race + latentAncestry), `Tile`, `GameState` (chronicle, awarenessStage, cognitionPressure, tribes), `CaretakerProfile` (6 orthogonal axes), `SimModifiers` (17 fields), `WeatherState` (10 states), `EnrichmentItem`, `CommunityRole`, `MicroAnimType`, `ChronicleEvent`/`ChronicleEventKind`.

**`src/engine/constants.ts`** — Single source of truth for all tuning values. Includes: time/world/needs, reproduction, awareness floors, sentience growth, weather durations (incl. windstorm/bloom/ashfall), snow/puddles/healroot/enrichment caps, vegetation lifecycle, drive seeds, fear-memory windows, tribe formation thresholds.

**`src/engine/tick.ts` → `tickSimulation(state)`** — Main loop order:
```
tickTime → tickWeather → tickTiles → tickCreatures → tickReproduction
→ tickTribeFormation → tickTribes → tickEnrichment → tickNaturalEnrichment
→ awareness stage evaluator (distribution-based with persistence hysteresis)
→ tickCaretaker → checkEndgame
```

**`src/creatures/behavior.ts`** — AI. `tickBehavior()` returns `Partial<Creature>` — never mutate directly. Decision flow: dying → sick → seeking healroot → fear response → critical survival → Dreaming/Sentinel mind hooks → drive-pattern catalogue → personality/role hooks → drive-weighted action selector → bond formation. No per-role switch any more.

**`src/engine/profile.ts`** — `computeSimModifiers(profile)`. Each axis is orthogonal: presence (caretaker capability) · world (environment) · evolution (genetic rates) · focus (social emphasis) · expectation (narrative bias) · visibility (caretaker perception). No two settings affect the same modifier.

**`src/engine/messages.ts`** — Composer pipeline. `coreAtom → recurrenceAtom → caretakerAtom → spatialPatternAtom → integrationAtom`. Every claim traces to engine state. Stage-5 closer cites the speaker's *oldest* personal observation. Sentience message gates derive from colony quantile.

**`src/engine/speech.ts`** — Emoji tiers (T0–T3), procedurally composed utterances via `deriveSpeechFocus` + `composeUtterance`. Utterance length capped by sentience + vocabulary depth, not mind class. ROLE_EMOJI deleted; vocabulary grows from EXPERIENTIAL_SYMBOL_TABLE.

**`src/ui/theme.ts`** — Unified design token system. Every styled-component pulls from this: colour palette (surfaces, text, semantic states, body/season/weather/biome/stage), spacing scale (xxs–xxxl), radius (xs–pill), shadow + glow tiers (amber/alive/water/threat/death), motion (durations + easings), typography scale (xs–hero). Never use a raw hex / radius / duration in a component — always reference the token.

**`src/ui/renderer/`** — Pure canvas. Import from `@/ui/renderer`. `drawAtmosphere()` is the **single combined weather+phase call** — never split them back out.

**`src/store/gameStore.ts`** — `initNewWorld`, caretaker actions (`dropFood`, `healCreature`, `redirectRiver`, `thunderStrike`, `igniteFire`, `placeEnrichment`), `startTicking`/`stopTicking`, absence hardship computation.

---

## Design constraints (must preserve)

- Player **cannot command** creatures — only place things
- **Caretaker actions are unlimited.** No daily charges, no per-tool cooldowns. The only balancer is `CaretakerState.actionLoad` (soft pressure that decays and bleeds ambient stress above threshold). Never re-introduce charge caps or per-tool cooldown gates.
- **Field Log surfaces three categories.** Every `ColonyMessage` is bucketed into `general` / `important` / `event`. Producers may set `msg.category` explicitly (`legendaryMessage`, `neglectWarningMessage`, `generateRaceRevivalMessage`, the extinction line in tick.ts → `important`; `generateAbsenceMessage`, store's thunder/fire messages → `event`); untagged messages are categorised in MessageLogPanel by stage and keyword. The single "All / Obs / Aware / Death" filter row was deleted.
- **Extinction generates a downloadable report.** `src/engine/extinctionReport.ts` composes a plain-text summary (cause, peak pop, death-cause breakdown, race populations, tribes formed, notable chronicle events, kind totals, top family lines) from `GameState`. The endgame overlay's "↓ Download Report" button calls `downloadExtinctionReport(state, fossil)`.
- **Camera frames only after the canvas has real dimensions.** `GameCanvas` waits for the first ResizeObserver measurement before initial framing. Subsequent resizes re-frame on creatures if the user hasn't moved the camera; otherwise the pan shifts in lock-step with the viewport size delta. Never re-pans to world midpoint.
- **Creature positions are clamped defensively after every movement tick.** Every behaviour path that writes `targetX/Y` clamps to `[0, WORLD_SIZE-1]`, and `tickCreatures` re-clamps `c.x/c.y` after `tickMovement` as belt-and-braces against any future regression. The renderer treats out-of-bounds creatures as a hard invariant violation.
- **No O(WORLD_SIZE²) pre-scans per tick.** `tickTiles` reads vegetation counts from `state.tileTypeCount` (maintained incrementally, plus a full resync every `TILE_COUNT_RESYNC_TICKS` to absorb drift from store actions / death-site writes) and writes them back at the end. `tickCreatures` reads `healrootCount` from the same cache. The snow-accumulation tally only runs in winter or while snow lingers; `mountain`/`cliff`/`rock` counts come from the cache, not a scan. Future scans that need a full-grid pass must either (a) use the cached counter, (b) be gated to a slower cadence, or (c) be triggered by an explicit event — never run every tick.
- **Territory claims keep spacing.** A creature won't claim its current tile if another creature's `territoryClaim` is within 8 tiles. This prevents pile-on conflict at the same spot.
- **Crowded creatures with low sociality bias their wander toward open space.** Adds soft repulsion without scripted dispersal.
- **Founders spawn in a tight cluster** (`STARTER_SPAWN_RADIUS = 6` around world center) with pre-seeded bonds at `STARTER_BOND_STRENGTH` between every pair, so the colony reliably reaches its first birth before Gen 0 ages out
- **Early-generation cohesion** extends through `EARLY_GEN_MAX = 3` cohorts — Gen 1–3 still get the homing bias on a 480-tile world
- **Camera frames on creature centroid** at world start and on `0`-recenter; never re-pans to the geometric world midpoint
- **Natural enrichment spawning never stops post–Gen 0** — when the colony is tiny or extinct it falls back to world-centered anchors so zones keep appearing
- Simulation is **continuous** — no designed completion state
- **Awareness is distribution-based** — evaluated from real creature state (median sentience, role diversity, lineage depth) with persistence hysteresis (HOLD 80 / FAIL 200 ticks)
- Sentience growth is **deliberately slow** — many generations of accumulated experience before stage 5
- Colony **survives without the player** — passive ticks on return (cap 240); absence imprint only fires when real hardship occurred during the gap
- **Fossil records persist** across extinctions
- **Asexual reproduction is Spore-only** — other body types must bond
- **Weather and day phase are inseparable** — always render via `drawAtmosphere()` together
- **Roles are emergent labels, not behaviour drivers** — drive-pattern catalogue replaces the per-role behavior switch
- **Speech is composed from chronicle** — never authored prose making claims the engine never computed
- **Tribes are derived from cluster + bond density** — tribe names come from the lineage's family-name evolution
- **Fear is per-witness, per-target** — no global apex tag; combat deaths attribute via `lastAttackerId`, witnesses gain personal `feared[id] = day`
- **Bloom and ashfall are state-triggered**, not random — bloom needs 12 peaceful days during rain; ashfall fires when total burned tiles in 12 days crosses threshold
- **UI tokens only** — every styled-component must pull from `src/ui/theme.ts`. Raw hex/radius/duration in a component is a code smell.
- **Performance gates.** Per-tick `Object.values(creatures).filter` should be reused, not rebuilt — `tickSimulation` computes alive baselines once and threads them. Per-creature radius queries (witnesses, conflict, rivals) MUST use the `CreatureGrid` from `src/engine/spatial.ts` once it's available in the calling phase; never re-introduce O(N²) scans. The `mark()` calls in `tickSimulation` feed the in-game profiler HUD (toggle: backtick) — if you add a new phase, time it the same way.

---

## Caretaker profile axes (orthogonal)

| Axis | Options | Primary modifiers |
|---|---|---|
| World | fertile / varied / scarce | foodRegrowMult, droughtDurationMult, weatherSeverityMult, diseasePressureMult |
| Evolution | fast / drift / slow | mutationChance, morphologyDriftMult, adaptationInheritMult |
| Focus | bonds / survival / awareness | bondSpeedMult, tribeFormationMult, enrichmentSpawnMult, sentienceGrowthMult |
| Expectation | persistence / adaptation / fracture | lineageHostilityBaseline, fractureEligibilityMult, adaptationInheritMult |
| Visibility | attentive / neutral / hidden | caretakerVisibilityMult, awarenessMessageMult |
| **Lifespan** | brief / standard / long | lifespanMult — multiplies MAX_AGE_BY_BODY for every spawn (0.60 / 1.0 / 1.80) |

The **Presence** axis was deleted in v3.2 — caretaker actions are unlimited, balanced only by `CaretakerState.actionLoad`. Each remaining axis touches a distinct slice; no two settings affect the same primary modifier. The sixth axis (**Lifespan**) was added in v3.3 and threads through `createStarterCreatures`, `createOffspring`, and `createAsexualOffspring` via the optional `lifespanMult` parameter on `spawnCreature`.

---

## Caretaker tools (9 active tools + heal — all unlimited)

| Tool | Key | Limit |
|---|---|---|
| Observe | `1` | Unlimited |
| Feed | `2` | Unlimited (220 ms anti-spam floor only) |
| Plant | `3` | Unlimited |
| River | `4` | Unlimited |
| Strike | `5` | Unlimited |
| Ignite | `6` | Unlimited |
| Enrich | `7` | Unlimited (8 enrichment types via dropdown) |
| **Build** | `8` | Unlimited (fence / cairn / nest / watch post) |
| **Bush** | `9` | Unlimited — pick up bush from a tile, or replant the carried one |
| Heal | Dossier panel | Unlimited (only gated by creature.health < 80) |

### Action pressure (replaces all charge caps)
- One unified soft curve `CaretakerState.actionLoad` (0..100). Every action adds its `ACTION_LOAD_WEIGHTS[tool]` weight (`heal: 7`, `thunder: 22`, `fire: 16`, `nest: 10`, `cairn: 5`, etc.). Load decays by `ACTION_LOAD_DECAY_PER_TICK` every tick.
- Above `ACTION_LOAD_STRESS_THRESHOLD = 55`, the engine adds `ACTION_LOAD_STRESS_PER_TICK` ambient stress to creatures within `ACTION_LOAD_STRESS_RADIUS` of the caretaker's most-recent action site — the only world-visible cost of heavy intervention.
- Anti-spam floor `ACTION_BASE_COOLDOWN_MS = 220` is the only timing gate (prevents double-firing on a single click). Same value for every tool.
- The Presence (Role) axis of CaretakerProfile was removed entirely; field kept as `presence?` only for save-file compatibility. `SimModifiers.healCharges` / `foodDropCooldownMs` are no longer set or read.

### Build kit details
- **Fence** — wooden barrier; slow decay (storms accelerate); already a tile type before v3.1
- **Cairn** — stacked-stone marker; CAIRN_STRESS_RELIEF aura over CAIRN_STRESS_RADIUS; weathers after CAIRN_DECAY_DAYS; placement on a death_site inherits cairnFor/cairnFamily/cairnGeneration so it becomes a real memorial
- **Nest** — breeding zone; if either parent within NEST_RADIUS, reproduction gets a second roll at NEST_BREED_MULT and offspring spawn with +NEST_OFFSPRING_HEALTH; fades after NEST_DECAY_DAYS
- **Watch post** — vigilance amplifier; drifts every creature within WATCH_POST_RADIUS toward vigilance 1.0 at WATCH_POST_VIGILANCE_DRIFT/tick

## Camera controls

| Input | Action |
|---|---|
| Scroll / `+` `-` | Zoom (0.18×–5.0×) |
| Drag (middle or Shift+left) | Pan |
| `Q` / `E` | Rotate 90° CCW / CW |
| `0` | Recenter (ZOOM_INIT = 1.0×) |

## Keyboard shortcuts

`Space` pause/resume · `1-9` tools · `Q/E` rotate · `+/-` zoom · `0` recenter (refocuses on creature centroid) · `Ctrl+S` save

---

## Save system

1. Auto-save every 30s to Supabase (`colonies` table, JSONB)
2. IndexedDB local fallback on every cloud save
3. `Ctrl+S` manual save
4. On tab close: `markSessionEnd()` writes `lastSessionEnd`
5. On load: `computePassiveTicks()` → batch-apply passive ticks (cap 240) before live loop; chronicle window during absence computes `absenceHardship` for imprint scaling

---

## Database

```sql
colonies(world_id uuid pk, user_id uuid, state jsonb, updated_at timestamptz)
fossil_records(id uuid pk, user_id uuid, fossil jsonb, created_at timestamptz)
```

Both tables have RLS. `reset_user_data()` (SECURITY DEFINER) deletes user's data; `admin_reset_all_app_data()` (service role only).

---

## Environment variables

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Running locally

```bash
npm install
cp .env.example .env  # fill in Supabase URL + anon key
npm run dev           # http://localhost:5173
npm run build
```

(`npm run lint` is currently broken — repo uses ESLint 9, config needs migration to `eslint.config.js`.)

---

## Deploy

```bash
vercel  # add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY when prompted
```

---

## UI design system (`src/ui/theme.ts`)

The "Bioluminescent Specimen Cabinet" — a dark field-laboratory aesthetic with:

- **Layered surfaces** (`bg → bgPanelTop → bgPanel → bgDeep`) for subtle depth via gradients
- **Bioluminescent glow** halos on active tools, key values, focus rings (`THEME.glow.amber` etc.)
- **Semantic colour glow** keyed to meaning (alive/water/threat/death/stage1–5)
- **Spacing scale** at 4px base (xxs/xs/sm/md/lg/xl/xxl/xxxl)
- **Type scale** (xs/sm/base/md/lg/xl/xxl/title/hero) all in Space Grotesk
- **Motion** with consistent ease-out curves (0.12 / 0.18 / 0.32 / 0.5s)
- **Radius scale** (xs/sm/md/lg/xl/pill)
- **Shadow tiers** (panel inset highlight, pop, soft)
- **Specialty surfaces** — `panelGradient`, `panelGradientHi`, `amberSurface`

Helper functions: `creatureColor(body)`, `stageColor(stage)`, `awarenessColor(level)`, `weatherColor(weather)`.

---

## Known stubs / cleanups

- **`ascension` EndgameType** — already removed from `EndgameType`; one comment in `gameStore.loadWorld` references it for migration only
- **ESLint config** — repo has ESLint 9 but config is in old v8 format; `npm run lint` errors
- **Subspecies recognition** — chronicle event kind exists with composer support, but no emitter wired yet

## Pending refactor: full tick.ts split

`src/engine/tick.ts` is still ~3,800 lines. Partial extractions already done:
`passiveTicks.ts`, `profiler.ts`, `spatial.ts`. The remaining split (deferred —
must be done with verification, never in one shot) is the target structure:

```
src/engine/tick/
├── index.ts            tickSimulation (orchestrator only)
├── time.ts             tickTime
├── weather.ts          tickWeather + state-trigger logic (ashfall, bloom)
├── tiles.ts            tickTiles + write-on-copy + fire spread
├── creatures.ts        tickCreatures + EXPERIENTIAL_SYMBOL_TABLE + fear decay
├── reproduction.ts     tickReproduction + hasNestNear + checkBoneMemory
├── tribes.ts           tickTribeFormation + tickTribes + pickTribeName
├── enrichment.ts       tickEnrichment + tickNaturalEnrichment + spawnNaturalNearby
├── caretaker.ts        tickCaretaker + action-load decay
├── awareness.ts        evaluateStageConditions + persistence hysteresis
└── endgame.ts          inferExtinctionCause + checkEndgame + createEvent + defaultOptions
```

`behavior.ts` (~1,650 lines) target structure:

```
src/creatures/behavior/
├── index.ts            tickBehavior orchestrator
├── drives.ts           drive selector + decision weights
├── needs.ts            tickNeeds
├── seek.ts             food/water/warmth/healroot seek
├── social.ts           bond formation, territory, conflict, mourning
├── movement.ts         tickMovement + terrain cost
└── traits.ts           personality/role hooks (build, harvest, etc.)
```

When you split, do it one folder at a time, run `npx tsc --noEmit` between
each module move, and never re-introduce O(N²) creature scans or unguarded
`Object.values+filter` per phase (see the **Performance gates** rule above).

---

## Detailed references

| Topic | File |
|---|---|
| Sim mechanics (time, weather, AI, reproduction, needs) | `docs/sim-mechanics.md` |
| Genetics, morphology, visual system, adding traits/tiles | `docs/genetics-visual.md` |
| Audio system, music contexts, weather ambient | `docs/audio.md` |
