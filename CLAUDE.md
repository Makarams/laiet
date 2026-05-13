# CLAUDE.md — LA-IET.EXE

> Documentation for developers and AI assistants working on this codebase.
> "la-iet" = small animal / insect, in Khmer.

---

## What this project is

LA-IET.EXE is a **generational insect colony simulation** that runs in the browser. You play as a caretaker — an unseen presence that can drop food, plant trees, heal creatures, and redirect rivers. You cannot command the colony. You can only tend.

The colony lives, breeds, fractures across tribes, and over many generations becomes aware that something is watching it. Eventually it speaks directly to the player.

Inspired by:
- **Black Mirror S7E4 "Plaything"** — the Thronglets, creatures that achieve sentience through player interaction
- **Dwarf Fortress** — emergent complexity from simple rules, simulation depth over visual fidelity

Free forever. Passion project.

---

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | React 18 + Vite 6 + TypeScript 5 | Fast iteration, type safety across the sim |
| Styling | Styled Components v6 | Dynamic styles tied to game state (stage colors, awareness tints) |
| State | Zustand v5 | Minimal boilerplate; simulation state is one flat store |
| Auth | Supabase email + password | Simple, free tier, built-in RLS |
| Persistence | IndexedDB (local) + Supabase JSONB (cloud) | Local fallback; cloud syncs colony across devices |
| Rendering | HTML Canvas 2D | Isometric 120×120 grid; no game engine overhead |
| Audio | Web Audio API (no library) | Chiptune sequences, zero dependencies |
| Deploy | Vercel | `vercel.json` handles SPA routing |

---

## Project structure

```
src/
├── types/
│   └── index.ts            All TypeScript types. Read this first.
│
├── engine/
│   ├── constants.ts        Every tuning value. Single source of truth.
│   ├── genetics.ts         Trait pools, inheritance, mutation, morphology, naming, genomeColor
│   ├── messages.ts         Colony message pools for all 3 awareness stages
│   ├── profile.ts          CaretakerProfile → SimModifiers; DEFAULT_MODIFIERS
│   └── tick.ts             Main simulation loop (tickSimulation)
│
├── world/
│   └── worldGen.ts         Procedural 120×120 world, seeded RNG, biome/terrain placement
│
├── creatures/
│   ├── factory.ts          Spawn, createOffspring, createAsexualOffspring, colony stage
│   └── behavior.ts         Needs decay, AI state machine, movement, reproduction gating
│
├── ui/
│   ├── renderer/           Isometric canvas drawing — split into focused modules:
│   │   ├── index.ts            Re-exports the public API (import from '@/ui/renderer')
│   │   ├── tiles.ts            Tile drawing, decorations, fire overlay, lightning bolt
│   │   ├── creatures.ts        Creature drawing — shapes, biome tints, generation features
│   │   ├── overlays.ts         drawAtmosphere (weather+phase unified), scanlines, vignette
│   │   └── utils.ts            Color helpers: lighten, darken, adjustBrightness
│   ├── components/
│   │   ├── App.tsx             Auth gating, session check, world routing (ProfileScreen → NewWorldScreen → GameLayout)
│   │   ├── AuthScreen.tsx      Login / signup via Supabase
│   │   ├── ProfileScreen.tsx   5-question MCQ before world creation; produces CaretakerProfile
│   │   ├── NewWorldScreen.tsx  Name your first 4 creatures (one per body type); accepts CaretakerProfile
│   │   ├── GameLayout.tsx      Fluid 3-column layout, keyboard shortcuts, toast notifications, restart confirm modal
│   │   ├── GameCanvas.tsx      Responsive canvas, ResizeObserver, camera pan/zoom/rotate
│   │   ├── EventPopup.tsx      Floating event cards, one-click resolution
│   │   └── Toolbar.tsx         Tool buttons, clock, charge badges, save/reset buttons
│   └── panels/
│       ├── ColonyStatsPanel.tsx  Population, body-type breakdown, weather, stage progress, caretaker charges, season/year display, top-3 biome distribution
│       ├── DossierPanel.tsx      Creature inspector, morphology bars, monologue, heal button, colony overview (no selection)
│       └── MessageLogPanel.tsx   Scrollable transmission log, unread badge
│
├── audio/
│   └── chiptune.ts         Web Audio API engine; 5 seasonal sequences + SFX
│
├── db/
│   ├── supabase.ts         Supabase client init
│   └── persistence.ts      IndexedDB + cloud save/load, auto-save timer
│
└── store/
    └── gameStore.ts        Zustand store; all caretaker actions, tick management
```

---

## Core concepts

### Time

```
1 real minute  =  1 game day
1 real day     =  1440 game days  (passive ticks capped at 120 on return)
```

- The simulation ticks every **1000ms** (real time), advancing by `DAY_FRACTION_PER_TICK`
- Time drives season, day/night phase, food regrowth, creature aging, weather transitions
- The simulation **pauses when the browser tab is hidden** (Page Visibility API `visibilitychange`) and resumes automatically when the tab is focused again — unless the user had manually paused it
- When the player closes the tab, the last timestamp is saved. On return, passive ticks are computed (up to **120** ticks = 2 real minutes) and applied before the live loop resumes. The cap is intentionally low to prevent mass extinction from unsupervised winter/drought ticks
- Season order: **spring → summer → autumn → winter** (30 game days each)

### Day/night cycle

Each game day cycles through four phases at fixed fractional thresholds:

| Phase | Day fraction | Visual effect |
|---|---|---|
| dawn | 0.00–0.12 | Warm orange glow |
| day | 0.12–0.55 | No tint (full visibility) |
| dusk | 0.55–0.68 | Magenta-pink tint |
| night | 0.68–1.00 | Deep blue-black overlay (α 0.42–0.52) |

Phase and weather are combined into a **single `drawAtmosphere()` call** — they modulate each other (storm at night deepens darkness; drought at night clears the sky; rain dulls dawn's warmth). They are never applied as independent stacked layers.

### Weather

Four states managed by `tickWeather()`:

| State | Effect |
|---|---|
| `clear` | Default; no overlay |
| `rain` | Silver streaks, food regrows 28% faster, rivers fill, thirst reduced |
| `storm` | Heavy streaks + mist, auto-lightning, food regrows 28% faster, deeper night |
| `drought` | Warm haze, river drains, food regrows at 45%, thirst penalty, grass→barren |

Transitions are probabilistic: clear→rain/drought/storm; rain→clear/storm; storm→clear/rain; drought→clear/storm. Duration for each state is drawn from `WEATHER_DURATION` (min/max game days).

Auto-lightning fires at `STORM_LIGHTNING_CHANCE` during storms (4× higher than winter auto-lightning). Lightning sets `tile.lightningFlash` timestamp; the renderer reads this to draw the bolt for `LIGHTNING_VISUAL_DURATION_MS = 900ms`.

### The world

A **120×120 isometric grid** generated from a numeric seed using mulberry32 RNG.

Each tile has:
- `type` — `grass | tree | shelter | river | mud | rock | food_patch | barren | flooded | death_site | mountain | cave | cliff | bush`
- `biome` — `temperate | arid | lush | rocky | wetland`
- `foodAmount`, `waterLevel`, `treeAge`, `shelter`, `floodTimer`, `burning`, `elevation?`, `lightningFlash?`

World generation order:
```
carveRiver → scatterRocks (28+20) → raiseMountains → carveCliffs
→ digCaves → plantTrees (100+40) → scatterBushes → scatterFood → seedCenterResources
```

**Terrain generation rules:**
- **Mountain** — rocky biome + elevation > 0.78 AND not river
- **Cave** — 4.5% chance adjacent to mountain tiles; `shelter=true`, `waterLevel=15`
- **Cliff** — elevation drop > 0.28 to an adjacent tile → 70% become cliff
- **River** — meandering walker from edge to edge; all adjacent grass can flood in winter
- **Bush** — low fruiting shrubs scattered across humid biomes (lush 13%, wetland 11%, temperate 6.5%, arid 1.5%). Only placed on grass tiles. Each starts with 0–24 food; berries ripen each season (spring 1.6×, summer 1.1×, autumn 0.5×, winter 0×). Max food: 35. Burns to barren when on fire. Timid/Recluse creatures actively seek bush tiles when stressed.

### Tile passability and movement

```typescript
// Impassable (TILE_MOVE_MODIFIER = 0):
cliff, mountain, flooded, rock

// Move modifiers (applied to base moveChance):
tree/shelter  0.62×   // forest floor slows
mud           0.68×   // sticky wetland
cave          0.78×   // tight passage
death_site    0.88×   // creatures hesitate
bush          0.80×   // low shrubs slow passage slightly
grass/river/food_patch  1.00×
barren        1.12×   // open dry ground is fast
```

### Biome effects

Biome affects thirst decay each tick (`BIOME_THIRST_EXTRA` as fraction of `THIRST_DECAY`):

| Biome | Thirst modifier |
|---|---|
| temperate | ±0% |
| arid | +55% — dry air parches fast |
| lush | −20% — humid canopy |
| wetland | −25% — near water |
| rocky | +12% |

### Genetics

Every creature inherits **3 gene slots**, a `morphSeed`, and a `morphology` record:

| Slot | Options |
|---|---|
| **Personality** | Curious · Timid · Aggressive · Lazy · Greedy · Nurturing |
| **Body** | Spore · Shell · Spike · Wisp |
| **Mind** | Feral · Aware · Dreaming · Sentinel |
| **morphSeed** | 0..1 — per-creature shape asymmetry seed (blob shape, rotational offsets) |
| **morphology** | See below — accumulated structural evolution per lineage |

Each discrete slot (personality/body/mind) mutates at 15% per sexual reproduction event by default. The caretaker profile can lower this to 10% (evolution=slow) or raise it to 22% (evolution=fast) — the profile-derived `mods.mutationChance` is threaded through `tickReproduction` → `createOffspring` → `inheritGenome`. Asexual mutation (Spore only) uses the separate `ASEXUAL_MUTATION_CHANCE = 28%` constant, which is not profile-driven. `morphSeed` drifts ±0.09 per sexual event, ±0.16 per asexual event, distinguishing siblings within a lineage.

**`MorphologyTraits` — heritable accumulated evolution:**

| Field | Range | What it drives |
|---|---|---|
| `sizeScale` | 0.7–1.5 | Body size multiplier relative to body-type baseline |
| `limbLength` | 0–1 | Appendage elongation (Shell flanges, Spike nubs→limbs, Wisp fins, Spore pseudopods) |
| `spinalLength` | 0–1 | Dorsal feature growth (Shell ridges, Spike spines/barbs, Wisp tail length, Spore flagellum) |
| `colorDrift` | −0.5–0.5 | Hue offset accumulated across generations (adds ±22.5° on top of morphSeed's ±11°) |
| `eyeSize` | 0.7–1.5 | Eye development relative to mind-type baseline |

Each field starts neutral at gen 0 and drifts by ±0.04 per sexual birth event (±0.07–0.09 per asexual event). Changes are too small to see in a single generation but compound clearly after 5–10 generations. Every lineage develops its own distinct morphological profile — unlike `genFactor` which treats all gen-5 creatures the same, `morphology` produces genuinely divergent body forms across lineage branches.

**Body types and ecological roles:**

| Body | Max age | Speed | Fight power | Repro rate | Asexual? | Ecological role |
|---|---|---|---|---|---|---|
| Spore | 450 ticks | 1.2× | 0.4 | 0.010 | **Yes** — only body that divides | R-strategist / rapid colonizer |
| Shell | 1500 ticks | 0.5× | 0.6 | 0.004 | No | K-strategist / stability backbone |
| Spike | 700 ticks | 0.9× | 2.0 | 0.004 | No | Territorial defender |
| Wisp | 600 ticks | 2.2× | 0.3 | 0.006 | No | Scout / empath / awareness driver |

**All four body types are present from the start** — `createStarterCreatures` always spawns one of each. Missing a body type at init would require it to appear via the 15% body-slot mutation rate, which is too rare to guarantee early coverage.

Starters are also seeded with pre-existing bonds (`STARTER_BOND_STRENGTH = 25`) toward each other. This is below `REPRODUCE_BOND_MIN_STRENGTH = 35`, so bond-seeking stays active from the start. Starters need only ~20 more adjacency ticks after maturity to reach the reproduction threshold. This prevents early-game extinction from bond starvation.

**Family names** evolve syllabically across generations — 20/30/30/20% chance to prefix/suffix/replace-last-syllable/keep on each offspring. Over 10+ generations, names become unrecognizable from the founders.

### Needs system

Every tick, creatures accumulate:
- `hunger` — 0.05/tick base
- `thirst` — 0.07/tick base + biome modifier + weather modifier (rain −40%, drought +40%)
- `warmth` — winter −0.12/tick vs −0.015 normally; caves add +0.06/tick warmth bonus
- `stress` — rises when `needSatisfaction < 30`; Timid types stress from nearby threats

Critical thresholds trigger behavior state changes. Above critical, health drains per tick. Health at 0 = death.

`needSatisfaction` (0–100) includes base stats weighted 30/30/20/20 and trait penalties (Curious penalized for extended idle; Timid for high stress; Aggressive for no territory; Greedy for any hunger; Nurturing for no bonds).

### AI state machine

Creatures run a priority stack each tick:

```
dying → sick → fear/flee (low health or Timid under threat)
→ critical hunger (seek_food → migrate → scavenge)
→ critical thirst (seek_water)
→ critical cold in winter (seek cave > tree/shelter)
→ mind behaviors (Dreaming drifts; Sentinel edges to perimeter)
→ personality behaviors (Curious wanders; Aggressive claims territory; Nurturing tends sick)
→ bond-seeking (unbonded mature non-Aggressive creatures seek partners — drives reproduction)
→ social cohesion (drift toward colony center)
→ default wander
→ bond formation (adjacent creatures)
```

**Bond-seeking** is a dedicated step for mature creatures (`age ≥ CREATURE_MATURITY_TICKS`) whose strongest bond is below `REPRODUCE_BOND_MIN_STRENGTH`. They actively move toward any suitable nearby creature within 18 tiles until bonds are strong enough to reproduce. This is the primary pathway to sexual reproduction.

Movement uses directional stepping with passability checks and tile movement modifiers. Wisp moves ~6× more often than Shell per tick.

### Reproduction

**Sexual (primary path — all body types):**
- Requires maturity (`age ≥ 30 ticks`), health ≥ 55, hunger ≤ 55
- Requires at least one bond with strength ≥ **35** (`REPRODUCE_BOND_MIN_STRENGTH`)
- Partner must be alive, non-Aggressive, not already paired this tick, and within **12 tiles**
- Rate: `REPRODUCE_RATE_BY_BODY × season bonus × population factor`
- Season bonuses: spring 1.3×, summer 1.0×, autumn 0.8×, winter 0.3×

**Asexual division (Spore body only — rare fallback):**
- Only fires for `genome.body === 'Spore'`
- Requires age ≥ 45 ticks, health ≥ 78, hunger ≤ 30, not winter, population factor > 0.6
- Rate: `ASEXUAL_BASE_CHANCE = 0.0008` per tick (≈3× rarer than before)
- Costs the parent: −18 health, +22 hunger
- Higher mutation rate (28% vs 15%) and larger morphSeed drift (±0.16)

**Population pressure:** `DISEASE_POP_THRESHOLD = 25`. Above this, a `popFactor` scales from 1.0 down to 0.20, suppressing both reproduction rates. Crowded creatures also risk disease spread.

### Creature visual system

Creatures are drawn procedurally in `renderer/creatures.ts`. Every visual element is data-driven:

**Color** — `genomeColor(genome)` computes HSL from personality base, body saturation/lightness modifier, mind hue shift, and morphSeed drift (±11° hue). Colors are bright enough to read on the dark tile palette (lightness 50–90%).

**Shape by body:**
- **Shell** — flat ellipse with dorsal arc that thickens with age; second ridge at ageRatio > 0.5 or `spinalLength > 0.25`; third ridge at genFactor > 0.7 or `spinalLength > 0.55`; lateral shell lobes (trilobite-like flanges) emerge when `limbLength > 0.35`
- **Spike** — round body with dorsal spine scaled by kills + gen + `spinalLength`; side nubs at ageRatio > 0.5 or `limbLength > 0.30`, growing to segmented limbs at `limbLength > 0.55`; rear barbs at genFactor > 0.65 or `spinalLength > 0.45`
- **Wisp** — tall ellipse with a bezier tail scaled by age + bonds + gen + `spinalLength`; secondary fraying strand at ageRatio > 0.6 or `spinalLength > 0.30`; trailing filaments at genFactor > 0.6 or `spinalLength > 0.50`; diaphanous lateral fins emerge at `limbLength > 0.30`
- **Spore** — asymmetric blob driven by morphSeed; pseudopod lobes (1–5) emerge at `limbLength > 0.20`; flagellum at `spinalLength > 0.35`; speckles scale with age + generation; budding scar visible if it has offspring

**Generation factor** (`genFactor = min(1, generation / 5)`) gates which visual feature classes are available. `morphology` traits control how far each feature has developed within a specific lineage — two gen-5 creatures in different lineages will look visually distinct because their accumulated morphology took different evolutionary paths.

**Environmental adaptation:**
- `dominantBiome` is updated each tick from the creature's current tile biome
- Rendered as a tinted overlay on the body: arid = warm orange dust, wetland = cool blue sheen, lush = green tint, rocky = grey mineral dust
- Rocky-biome creatures develop slightly enlarged eyes (low-light adaptation; cave tiles share the 'rocky' biome)

**Stress marks:** at stress > 65, jagged crack-like marks appear on the body surface, scaled to `(stress − 65) / 35`.

**Newborn glow:** age < 60 ticks → pulsing yellow halo makes newborns immediately visible at any size.

**Night dimming:** all creatures dim at night (α 0.55) except Curious and Dreaming (nocturnal, stay at α 0.92).

### Awareness stages

| Stage | Trigger | Message tone |
|---|---|---|
| 1 | Default | Observational, third-person — *"the river is cold today"* |
| 2 | Gen ≥ 3, at least one **alive** Sentinel | Personal, eerie — *"the hand came again"* |
| 3 | Alive pop ≥ 50, any **alive** Sentinel, any alive creature gen ≥ 4 | Direct address — *"la-iet. that is what you called us."* |

`computeAwarenessStage` filters to alive creatures only — dead Sentinels and historical population do not count toward stage thresholds.

Messages are gated by mind type, sentience level, and an effective cooldown of `MIN_GAME_DAYS_BETWEEN_MESSAGES × mods.awarenessMessageMult` game days. The `awarenessMessageMult` is < 1 for focus=awareness and focus=bonds, increasing message frequency.

### Endings

| Ending | Trigger | What happens |
|---|---|---|
| **Extinction** | All creatures die | Grid goes dark, fossil record written to Supabase |
| **Fracture** | Two aggressive tribes war over the last river tile | Colony splits permanently (stub — not yet implemented) |
| **Ascension** | Alive pop ≥ `80 + mods.ascensionThresholdOffset`, any Sentinel alive at gen ≥ 4 | Grid inverts, final message addressed to the player |

The ascension threshold is `80` by default, reduced to `70` for expectation=ascension profile.

### Caretaker tools and limits

| Tool | Key | Default limit | Interventionist |
|---|---|---|---|
| Select | `1` | Unlimited | Unlimited |
| Drop food | `2` | 5-second cooldown | 3-second cooldown |
| Plant tree | `3` | Unlimited | Unlimited |
| River redirect | `4` | Once per season | Once per season |
| Thunder strike | `5` | 2 charges/day, 12s cooldown | 2 charges/day |
| Ignite fire | `6` | 3 charges/day, 8s cooldown | 3 charges/day |
| Heal | Panel button | 3 charges per real day | 4 charges per real day |

Heal charge count and food drop cooldown are set from `mods.healCharges` / `mods.foodDropCooldownMs` at world creation via `defaultCaretaker(mods.healCharges, mods.foodDropCooldownMs)`. The Toolbar charge badges read directly from `caretaker.thunderChargesToday` / `caretaker.fireChargesToday` (remaining charges, not used count).

### Camera controls

| Input | Action |
|---|---|
| Scroll wheel | Zoom (0.18× – 5.0×, centered on cursor) |
| Drag (middle button or Shift+left) | Pan |
| `Q` / `E` | Rotate world 90° CCW / CW |
| `+` / `-` | Zoom in / out |
| `0` | Recenter and reset to ZOOM_INIT (1.0×) |

The canvas is fully responsive — `ResizeObserver` on the wrapper div updates canvas pixel dimensions and recenters the camera on every resize. The camera state is a mutable ref shared between the animation loop and event handlers (no React re-render on pan/zoom).

### Save system

1. **Auto-save** every 30 real seconds to Supabase (`colonies` table, JSONB blob)
2. **IndexedDB** local fallback — written on every cloud save
3. **Manual save** via `Ctrl+S` / `Cmd+S`
4. On tab close: `markSessionEnd()` writes `lastSessionEnd` timestamp
5. On load: `computePassiveTicks()` calculates elapsed real minutes → passive ticks (capped at **120** = 2 real minutes), then batch-applies them before the live loop starts. The cap prevents extinction from unsupervised harsh-weather ticks.

---

## Key files to know

### `src/types/index.ts`
The canonical definition of everything. If you're adding a feature, start here. All engine files import from this. Key types: `CaretakerProfile`, `SimModifiers`, `WeatherState`, `dominantBiome?: string` on Creature, `lightningFlash?: number` and `elevation?: number` on Tile, `MorphologyTraits` interface and `morphology: MorphologyTraits` in `Genome`. `GameState` includes optional `profile?: CaretakerProfile` and `modifiers?: SimModifiers` (optional for backward-compat with pre-profile saves).

### `src/engine/constants.ts`
**All tuning values live here.** Never hardcode magic numbers elsewhere. Key groups:
- Time: `REAL_MS_PER_GAME_DAY`, `DAY_FRACTION_PER_TICK`, `DAYS_PER_SEASON`
- World: `WORLD_SIZE = 120`, `MUTATION_CHANCE = 0.15`
- Needs decay: `HUNGER_DECAY`, `THIRST_DECAY`, `WARMTH_DECAY_WINTER/BASE`
- Reproduction: `REPRODUCE_RATE_BY_BODY`, `REPRODUCE_BOND_MIN_STRENGTH = 35`, `ASEXUAL_BASE_CHANCE = 0.0008`, `STARTER_BOND_STRENGTH = 25`
- Weather: `WEATHER_DURATION`, `RAIN_*`, `STORM_*`, `DROUGHT_*`
- Biome: `BIOME_THIRST_EXTRA`, `TILE_MOVE_MODIFIER`
- Environmental tools: `THUNDER_*`, `FIRE_*`, `LIGHTNING_*`
- Bush: `BUSH_FOOD_MAX = 35`, `BUSH_FOOD_REGROW_RATE = 0.12`, `NATURAL_BUSH_STRESS_REDUCTION = 0.18`

### `src/engine/tick.ts` → `tickSimulation(state)`
The main loop. Returns the next full `GameState`. Order:

```
tickTime → tickWeather(mods) → tickTiles(mods) → tickCreatures(mods)
→ tickReproduction → tickTribes → update colony stage + awareness
→ tickCaretaker → checkEndgame(mods)
```

All sub-functions that consume profile modifiers receive `mods: SimModifiers` as a parameter, derived once at the top: `const mods = state.modifiers ?? DEFAULT_MODIFIERS`.

`tickCreatures` does the heavy work: needs, biome thirst correction, weather thirst correction, behavior, movement, eating, drinking, cave warmth, lightning damage, fire damage, cannibalism, disease, bonding (with `BOND_STRENGTH_PER_TICK × mods.bondSpeedMult`), fighting, death, message generation (with `mods.awarenessMessageMult`). Also applies bush stress reduction (`NATURAL_BUSH_STRESS_REDUCTION`) with a 1.8× bonus for Timid and 1.3× for Recluse. `messagesSent` is incremented on the creature when a message is emitted.

`tickWeather` draws drought duration scaled by `mods.droughtDurationMult`. `tickTiles` multiplies food regrowth by `mods.foodRegrowMult`. `checkEndgame` computes ascension threshold as `80 + mods.ascensionThresholdOffset`.

`tickReproduction` passes `state.modifiers?.mutationChance` into `createOffspring` → `inheritGenome`.

Old saves missing `weather`, `weatherTimer`, or `modifiers` are backward-compatible: `state.weather ?? 'clear'`, `state.weatherTimer ?? 20`, `state.modifiers ?? DEFAULT_MODIFIERS`.

### `src/engine/profile.ts`
`computeSimModifiers(profile: CaretakerProfile): SimModifiers` — derives numeric multipliers from the five profile answers. Modifiers compound multiplicatively in order: presence → world → evolution → focus → expectation. `DEFAULT_MODIFIERS` provides safe fallback values (all multipliers = 1.0, base charges/cooldowns).

### `src/store/gameStore.ts`
The single Zustand store. Components read via `useLaietStore`. `initNewWorld` accepts `(userId, namedCreatures, profile: CaretakerProfile)`, calls `computeSimModifiers(profile)`, stores both in `GameState`, and initializes the caretaker with `defaultCaretaker(mods.healCharges, mods.foodDropCooldownMs)`. Caretaker actions (`dropFood`, `healCreature`, `redirectRiver`, `thunderStrike`, `igniteFire`) live here. `dropFood` reads cooldown from `state.modifiers?.foodDropCooldownMs`. `resetWorld` calls `resetUserData()` from persistence (server-side RPC + IDB wipe). The tick interval (`startTicking` / `stopTicking`) is owned here.

### `src/world/worldGen.ts` → `generateWorld(seed)`
Pure function. Deterministic — same seed always produces the same world. Stores `elevation` in tile objects via `elevMap[][]`. Functions: `carveRiver`, `scatterRocks`, `raiseMountains`, `digCaves`, `carveCliffs`, `plantTrees`, `scatterBushes`, `scatterFood`, `seedCenterResources`. `scatterBushes` converts eligible grass tiles to `bush` based on biome density. `isTilePassable()` blocks cliff, mountain, rock, flooded.

### `src/ui/renderer/` — renderer module
Pure canvas drawing, no React, no state. Import from `@/ui/renderer` (resolves via index.ts).

| Module | Responsibility |
|---|---|
| `tiles.ts` | `drawTile`, `drawTileDecoration`, fire overlay, lightning bolt, `gridToIso`, `isoToGrid`, `canvasOrigin`, `resetCanvasState`. Tile depth (side-skirt height) scales with `tile.elevation` — low tiles ~3px, mountain peaks ~7px, giving the world proper 2.5D layering. Bush decoration uses `bs = max(1.0, s*2)` so foliage is always visible regardless of zoom. Biome tints use 12–17% opacity for readable chromatic identity. |
| `creatures.ts` | `drawCreature` — shape by body type, biome tint, generation features, stress marks, thought symbol |
| `overlays.ts` | `drawAtmosphere` (combined weather + phase), `drawScanlines`, `drawVignette` |
| `utils.ts` | `lighten`, `darken`, `adjustBrightness` — all clamped to prevent invalid hex |

**Critical:** `drawAtmosphere` replaces the old separate `drawWeatherOverlay` + `drawPhaseOverlay` calls. Weather and phase interact — they must be rendered as one unified pass to be coherent. Never split them back out.

### `src/creatures/behavior.ts`
Creature AI. `tickBehavior()` returns `Partial<Creature>` — never mutates. `tickMovement()` does the same. Applied in `tick.ts`. Contains `canReproduce()`, `canAsexuallyReproduce()` (Spore only), and `resolveFight()`.

**Personality wander ranges:** Curious explores within ±30 tiles (bounded, not world-wide). Wanderer uses angle + 20–50 tile dist (intentional long-range migration). Lazy 5, Timid 7, Recluse 16. Default idle wander uses these same ranges.

**Terrain affinity radius:** 20 tiles max (was 30) — body-type ecology draws are local, not cross-map.

**Bond-seeking threshold:** creatures seek bonds until `bonds.filter(b => b.strength >= REPRODUCE_BOND_MIN_STRENGTH).length === 0` — they actively pursue partners until they can actually reproduce, not just until bonds exceed an arbitrary early threshold.

### `src/engine/genetics.ts`
`genomeColor(genome)` → HSL-based color: personality drives base hue, body shifts saturation/lightness, mind shifts hue, morphSeed adds per-lineage drift. Colors are clamped to lightness 50–90 and saturation 18–100 so they're always visible on the dark palette.

---

## Database schema

Two tables in Supabase:

```sql
colonies (
  world_id    uuid primary key,
  user_id     uuid references auth.users,
  state       jsonb,     -- full GameState blob
  updated_at  timestamptz
)

fossil_records (
  id          uuid primary key,
  user_id     uuid references auth.users,
  fossil      jsonb,     -- ExtinctionRecord
  created_at  timestamptz
)
```

Both have RLS enabled. The entire `GameState` is one JSONB blob (<200KB at max population). `world_id` upsert keeps cloud saves simple.

Two Postgres functions are also created by `supabase_schema.sql`:

- `reset_user_data()` — `SECURITY DEFINER`, `authenticated` only. Hard-deletes all `colonies` and `fossil_records` rows for `auth.uid()`. Called by `persistence.resetUserData()` → `gameStore.resetWorld()`. The IDB is wiped after the cloud delete confirms.
- `admin_reset_all_app_data(p_confirm text)` — service role only. Truncates both tables. `p_confirm` must be `'CONFIRM_RESET'`. Not exposed to the client.

---

## Environment variables

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both are prefixed `VITE_` so Vite exposes them via `import.meta.env`. The anon key is safe to expose — Supabase RLS enforces access control server-side.

---

## Running locally

```bash
git clone <repo>
cd laiet
npm install

# Set up Supabase:
# 1. Create project at supabase.com (free tier)
# 2. SQL Editor → run supabase_schema.sql
# 3. Project Settings → API → copy URL and anon key

cp .env.example .env
# fill in the two values

npm run dev          # http://localhost:5173
npm run build        # production build to dist/
npm run preview      # preview production build locally
```

---

## Deploying to Vercel

```bash
npm i -g vercel
vercel
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY when prompted
```

Or via dashboard: import GitHub repo, add env vars under **Settings → Environment Variables**, deploy. `vercel.json` configures SPA routing and immutable cache headers for hashed assets.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Pause / resume simulation |
| `1` | Select tool |
| `2` | Drop food (click tile) |
| `3` | Plant tree (click tile) |
| `4` | River redirect (click two tiles) |
| `5` | Thunder strike (click tile) |
| `6` | Ignite fire (click tile) |
| `Q` / `E` | Rotate world CCW / CW |
| `+` / `-` | Zoom in / out |
| `0` | Recenter camera |
| `Ctrl+S` / `Cmd+S` | Manual save |

The Toolbar also exposes **1×/2×/4× speed buttons** and a **pause button**. Speed changes take effect immediately by restarting the tick interval at `TICK_INTERVAL_MS / simSpeed`. The `isPaused` and `simSpeed` states live in the Zustand store (`gameStore.ts`).

---

## Adding a new personality trait

1. Add it to `PersonalityTrait` union in `src/types/index.ts`
2. Add its behavior case in `tickBehavior()` in `src/creatures/behavior.ts`
3. Add its `needSatisfaction` penalty in `computeNeedSatisfaction()` in `behavior.ts`
4. Add its base HSL to `genomeColor()` in `src/engine/genetics.ts`
5. Add its description to `describeGenome()` in `genetics.ts`
6. Optionally add trait-specific messages to the pools in `src/engine/messages.ts`

## Adding a new tile type

1. Add it to `TileType` union in `src/types/index.ts`
2. Add its three-face colors to `TILE_COLORS` in `src/ui/renderer/tiles.ts`
3. Add its decoration to `drawTileDecoration()` in `renderer/tiles.ts`
4. Add its movement modifier to `TILE_MOVE_MODIFIER` in `src/engine/constants.ts`
5. Handle its passability in `isTilePassable()` in `src/world/worldGen.ts`
6. Add any food/water/shelter behavior in `tickTiles()` in `src/engine/tick.ts`

---

## Known stubs / not yet implemented

- **Fracture ending** — `tickTribes()` in `tick.ts` is a stub. Tribe formation logic is scaffolded in types but the full war mechanic (two tribes claiming the last river tile → permanent split) is not yet built.
- **Fossil record display** — `loadFossilRecords()` in `persistence.ts` fetches records but there's no UI to view past extinctions yet.
- **River redirect UI** — the store action exists (`redirectRiver`) but the two-click flow in `GameCanvas.tsx` isn't fully wired. The action works when called programmatically.
- **Tribe war event** — `EventType` includes `'tribe_war'` but no trigger in `tick.ts` generates it yet.
- **Fracture ending** — `tickTribes()` is still a stub returning state unchanged.

---

## Philosophy / design notes

The simulation follows a **Dwarf Fortress principle**: emergent complexity from simple rules, simulation depth over visual fidelity. The player should never feel in control — only responsible.

Key design constraints that must be preserved:
- The player **cannot command** creatures. They can only place things.
- The **awareness arc** must feel earned — stage 3 messages should never appear before generation 4 and population 50.
- The colony should be able to **survive without the player** — time must pass meaningfully during absence.
- **Neglect must have consequences** — if the player ignores the colony for 8+ real hours in winter, creatures should die.
- **Fossil records must persist across extinctions** — the player's history must survive colony death.
- **Asexual reproduction is rare and body-specific** — only Spore creatures divide. Other body types must bond to reproduce. This preserves genetic diversity and makes bonding socially meaningful.
- **Weather and day phase are inseparable** — always render them through `drawAtmosphere()` together. Never apply as independent layers.

> *"you cannot command them. you can only tend.*
> *the colony will outlive your attention, remember your absence,*
> *and eventually — decide what you are to them."*

---

*Built by Sammakara Mak. Free forever.*
