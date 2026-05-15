# CLAUDE.md — LA-IET.EXE

> Documentation for developers and AI assistants working on this codebase.
> "la-iet" = small animal / insect, in Khmer.

---

## What this project is

LA-IET.EXE is a **generational insect colony simulation** that runs in the browser. You play as a caretaker; an unseen presence that can drop food, plant trees, heal creatures, and redirect rivers. You cannot command the colony. You can only tend.

The colony lives, breeds, fractures across tribes, and over many generations becomes aware that something is watching it. Eventually it speaks directly to the player.

Inspired by:
- **Black Mirror S7E4 "Plaything"** — the Thronglets, creatures that achieve sentience through player interaction
- **Dwarf Fortress** — emergent complexity from simple rules, simulation depth over visual fidelity

Free forever. Passion project.

The simulation is **continuous**. There is no designed completion state. The only hard termination is extinction (all creatures dead). All other apparent milestones — awareness stages, colony flourishing, generation depth — are ongoing processes, not finales.

---

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | React 18 + Vite 6 + TypeScript 5 | Fast iteration, type safety across the sim |
| Styling | Styled Components v6 | Dynamic styles tied to game state (stage colors, awareness tints) |
| State | Zustand v5 | Minimal boilerplate; simulation state is one flat store |
| Auth | Supabase email + password | Simple, free tier, built-in RLS |
| Persistence | IndexedDB (local) + Supabase JSONB (cloud) | Local fallback; cloud syncs colony across devices |
| Rendering | HTML Canvas 2D | Isometric 240×240 grid; no game engine overhead |
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
│   ├── speech.ts           Emoji vocabulary tiers, sentence patterns, role assignment, vocab inheritance
│   └── tick.ts             Main simulation loop (tickSimulation)
│
├── world/
│   └── worldGen.ts         Procedural 240×240 world, seeded RNG, biome/terrain placement
│
├── creatures/
│   ├── factory.ts          Spawn, createOffspring, createAsexualOffspring, colony/awareness stage
│   └── behavior.ts         Needs decay, AI state machine, movement, reproduction gating
│
├── ui/
│   ├── renderer/           Isometric canvas drawing; split into focused modules:
│   │   ├── index.ts            Re-exports the public API (import from '@/ui/renderer')
│   │   ├── tiles.ts            Tile drawing, decorations, fire overlay, lightning bolt, snow
│   │   ├── creatures.ts        Creature drawing; shapes, biome tints, generation features, micro-anims
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
│   │   └── Toolbar.tsx         Tool buttons, clock, charge badges, save/reset buttons, enrichment item picker
│   └── panels/
│       ├── ColonyStatsPanel.tsx  Population, body-type breakdown, weather, stage progress, caretaker charges, season/year display, top-3 biome distribution
│       ├── DossierPanel.tsx      Creature inspector, morphology bars, community role badge, monologue, heal button, colony overview (no selection)
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
- The simulation **pauses when the browser tab is hidden** and resumes automatically when focused; unless the user had manually paused it
- On return: passive ticks computed (up to **120** ticks = 2 real minutes) and applied before the live loop resumes. The cap prevents mass extinction from unsupervised winter/drought ticks
- Season order: **spring → summer → autumn → winter** (30 game days each)

### Day/night cycle

Each game day cycles through four phases at fixed fractional thresholds:

| Phase | Day fraction | Visual effect |
|---|---|---|
| dawn | 0.00–0.12 | Warm orange glow |
| day | 0.12–0.55 | No tint (full visibility) |
| dusk | 0.55–0.68 | Magenta-pink tint |
| night | 0.68–1.00 | Deep blue-black overlay (α 0.42–0.52) |

Phase and weather are combined into a **single `drawAtmosphere()` call** — they modulate each other. Never split them back out.

### Weather

Five states managed by `tickWeather()`:

| State | Effect |
|---|---|
| `clear` | Default; no overlay |
| `rain` | Silver streaks, food regrows 28% faster, rivers fill, thirst reduced |
| `storm` | Heavy streaks + mist, auto-lightning, food regrows 28% faster, deeper night |
| `drought` | Warm haze, river drains, food regrows at 45%, thirst penalty, grass→barren |
| `snow` | White accumulation on tiles, movement penalty, warmth drain; only in winter in cold biomes (temperate, rocky, lush) or anywhere during a winter storm |

Weather transitions are probabilistic. Duration for each state is drawn from `WEATHER_DURATION` (min/max game days).

### Snow system

Snow accumulates tile-by-tile during winter in snow-capable biomes (`SNOW_BIOMES = ['temperate','rocky','lush']`):
- `SNOW_ACCUMULATE_RATE = 0.007` depth added per tick during snowfall
- `SNOW_MELT_RATE = 0.003` removed per tick in clear spring weather
- Movement penalty: `1 - (1 - SNOW_MOVE_PENALTY) × snowDepth` — at full depth, movement chance is `SNOW_MOVE_PENALTY` (0.55×); near-zero depth has near-zero penalty
- `SNOW_WARMTH_DRAIN = 0.06` extra warmth decay per tick when standing in snow
- Creatures inside caves are sheltered from snow warmth drain
- The renderer dims snow-covered food tiles (`SNOW_VISIBILITY_REDUCE = 0.50` alpha on the food icon)

### The world

A **240×240 isometric grid** generated from a numeric seed using mulberry32 RNG.

Each tile has:
- `type` — `grass | tree | shelter | river | mud | rock | food_patch | barren | flooded | death_site | mountain | cave | cliff | bush | healroot`
- `biome` — `temperate | arid | lush | rocky | wetland`
- `foodAmount`, `waterLevel`, `treeAge`, `shelter`, `floodTimer`, `burning`, `snowDepth?`, `puddleLevel?`, `fruitAge?`, `elevation?`, `lightningFlash?`, `healrootAmount?`

World generation order:
```
carveRiver → scatterRocks (28+20) → raiseMountains → carveCliffs
→ digCaves → plantTrees (100+40) → scatterBushes → scatterFood → seedCenterResources
```

Healroot spawns dynamically during gameplay near death sites (not at world generation time).

**Terrain generation rules:**
- **Mountain** — rocky biome + elevation > 0.78 AND not river
- **Cave** — 4.5% chance adjacent to mountain tiles; `shelter=true`, `waterLevel=15`
- **Cliff** — elevation drop > 0.28 to an adjacent tile → 70% become cliff
- **River** — meandering walker from edge to edge; can flood adjacent grass in winter, overflow during heavy rain, erode slowly during storms, dry to mud during extended drought
- **Bush** — low fruiting shrubs in humid biomes (lush 13%, wetland 11%, temperate 6.5%, arid 1.5%). Only placed on grass tiles. Seasonal berry ripening; max 35 food. Burns to barren.

### Tile passability and movement

```typescript
// Impassable (TILE_MOVE_MODIFIER = 0):
cliff, mountain, flooded, rock

// Move modifiers (applied to base moveChance):
tree/shelter  0.62×   // forest floor slows
mud           0.68×   // sticky wetland
cave          0.78×   // tight passage
death_site    0.88×   // creatures hesitate
bush          0.80×   // low shrubs slow passage
healroot      0.90×   // low herb growth; slight tangle underfoot
grass/river/food_patch  1.00×
barren        1.12×   // open dry ground is fast
```

Snow depth applies a further multiplier on top of the tile modifier: `1 - (1 - 0.55) × depth`.

Puddle tiles modify at `PUDDLE_MOVE_MODIFIER = 0.75` (slippery).

### Puddle system

Rain accumulates water on grass tiles:
- `PUDDLE_ACCUMULATE_RATE = 0.008` per tick during rain/storm
- When a tile's puddle level reaches `PUDDLE_FORM_THRESHOLD = 0.65` it converts to mud
- Puddles evaporate at `PUDDLE_EVAPORATE_RATE = 0.012` in clear/drought weather
- Puddles can flow downhill to adjacent lower-elevation tiles (`PUDDLE_FLOW_CHANCE = 0.008`)
- Creatures can drink from puddles (`PUDDLE_THIRST_RELIEF = 8.0` per tick)

### Biome effects

Biome affects thirst decay each tick (`BIOME_THIRST_EXTRA` as fraction of `THIRST_DECAY`):

| Biome | Thirst modifier |
|---|---|
| temperate | ±0% |
| arid | +55%; dry air parches fast |
| lush | −20%; humid canopy |
| wetland | −25%; near water |
| rocky | +12% |

### Genetics

Every creature inherits **3 gene slots**, a `morphSeed`, and a `morphology` record:

| Slot | Options |
|---|---|
| **Personality** | Curious · Timid · Aggressive · Lazy · Greedy · Nurturing · Wanderer · Recluse · Hoarder · Empath · Furtive · Territorial · Social · Stoic |
| **Body** | Spore · Shell · Spike · Wisp |
| **Mind** | Feral · Aware · Dreaming · Sentinel |
| **morphSeed** | 0..1; per-creature shape asymmetry seed |
| **morphology** | Accumulated structural evolution per lineage |

Each discrete slot mutates at **8% per sexual reproduction event** by default. The caretaker profile can lower this to **5%** (evolution=slow) or raise it to **13%** (evolution=fast) — the profile-derived `mods.mutationChance` is threaded through `tickReproduction` → `createOffspring` → `inheritGenome`. Asexual mutation (Spore only) uses `ASEXUAL_MUTATION_CHANCE = 0.15` — higher than sexual but not adjustable by profile. `morphSeed` drifts ±0.09 per sexual event, ±0.16 per asexual event.

**`MorphologyTraits` — heritable accumulated evolution:**

| Field | Range | What it drives |
|---|---|---|
| `sizeScale` | 0.7–1.5 | Body size multiplier relative to body-type baseline |
| `limbLength` | 0–1 | Appendage elongation |
| `spinalLength` | 0–1 | Dorsal feature growth |
| `colorDrift` | −0.5–0.5 | Hue offset accumulated across generations |
| `eyeSize` | 0.7–1.5 | Eye development relative to mind-type baseline |

**Body types and ecological roles:**

| Body | Max age | Speed | Fight power | Repro rate | Asexual? | Ecological role |
|---|---|---|---|---|---|---|
| Spore | 450 ticks | 1.2× | 0.4 | 0.010 | **Yes** | R-strategist / rapid colonizer |
| Shell | 1500 ticks | 0.5× | 0.6 | 0.004 | No | K-strategist / stability backbone |
| Spike | 700 ticks | 0.9× | 2.0 | 0.004 | No | Territorial defender |
| Wisp | 600 ticks | 2.2× | 0.3 | 0.006 | No | Scout / empath / awareness driver |

### Needs system

Every tick, creatures accumulate:
- `hunger` — 0.05/tick base
- `thirst` — 0.07/tick base + biome modifier + weather modifier (rain −40%, drought +40%)
- `warmth` — winter −0.12/tick vs −0.015 normally; caves add +0.06/tick warmth bonus; night adds an extra warmth drain pass equal to the base/winter rate; clear daytime on temperate/arid biome restores `SOLAR_WARMTH_BONUS = 0.010` per tick
- `stress` — rises when `needSatisfaction < 30`; Timid types stress from nearby threats; snow does NOT directly raise stress but compounds via cold

Healing sources:
- **Food patches / trees** — eat restores hunger
- **River / puddle** — drink restores thirst
- **Cave** — warmth restored passively
- **Healroot tiles** — sick creatures seek these; `HEALROOT_HEAL_PER_USE = 22` health restored per feeding; healroot potency decrements and regrows slowly
- **Caretaker heal** — `HEAL_AMOUNT = 40` health, limited charges

Bond grief: bonds toward dead creatures fade at `DEAD_BOND_FADE_PER_TICK = 0.35` per tick, reaching 0 in ~5 game-days, modelling a grief arc.

### AI state machine

Creatures run a priority stack each tick:

```
dying → sick → seeking_healroot (sick creatures with health < 40 near a healroot tile)
→ fear/flee (low health or Timid under threat)
→ critical hunger (seek_food → migrate → scavenge)
→ critical thirst (seek_water)
→ critical cold in winter (seek cave > tree/shelter)
→ mind behaviors (Dreaming drifts; Sentinel edges to perimeter)
→ personality behaviors (Curious wanders; Aggressive claims territory; Nurturing tends sick)
→ grooming (bonded creatures groom each other; reduces both parties' stress)
→ playing (high needSatisfaction triggers play with nearby bonded partner)
→ using_enrichment (creature within range of a placed enrichment item uses it)
→ bond-seeking (mature non-Aggressive creatures actively move toward partners)
→ social cohesion (drift toward colony center)
→ default wander
→ bond formation (adjacent creatures)
```

**Grooming** — bonded creatures occasionally enter a mutual grooming state; both parties receive stress reduction. Renders as a slow body-wave micro-animation.

**Playing** — requires `needSatisfaction > PLAY_TRIGGER_SATISFACTION (78)` and a nearby bonded partner. Lasts `PLAY_DURATION_TICKS (25)` and reduces stress by `PLAY_STRESS_REDUCTION (0.8)` per tick. Triggers a jump micro-animation.

**Personality wander ranges:** Curious ±30 tiles. Wanderer uses angle + 20–50 tile dist (intentional long-range migration). Lazy 5, Timid 7, Recluse 16. Territorial creatures claim grass/bush/river tiles and fight intruders — but not bonded allies (bond strength ≥ 20 exempts the target from territorial attack).

### Enrichment system

Caretaker-placed items that creature AI incorporates into their state machine. Eight types with distinct effects:

| Item | stress | hunger | thirst | warmth | health |
|---|---|---|---|---|---|
| resting_spot | −2.0 | — | — | +0.5 | +0.1 |
| scratching_post | −2.5 | — | — | — | — |
| burrow | −1.5 | — | — | +1.5 | +0.05 |
| warm_stone | −1.0 | — | — | +3.0 | +0.1 |
| mud_pool | −2.0 | — | −8.0 | +0.5 | — |
| worn_path | −1.8 | +1.5 | +0.5 | +0.5 | +0.15 |
| play_stones | −3.0 | +0.5 | — | — | — |
| springy_moss | −3.5 | +1.0 | +0.5 | — | — |

Each item has `maxUses = 40` and degrades after that many sessions. Creatures with `lastEnrichmentTick` < `c.age - ENRICHMENT_COOLDOWN_TICKS (80)` are eligible again.

Natural enrichment (from world terrain, no placement needed): caves −1.5 stress/tick, river/mud −0.5, tree/shelter −0.25, bush −0.18 (Timid 1.8×, Recluse 1.3×).

### Community roles

Assigned by `assignRole()` in `speech.ts` when the simulation calls `tickTribes`. Roles are emergent — they reflect behavioral contribution, not just genetics. Priority order:

```
Recluse personality              → recluse
Sentinel + (lineages≥4 OR
  sentience≥60 AND gen≥3)        → elder
Dreaming/Sentinel + Curious/
  Wanderer                       → shaman
Nurturing + (Dreaming OR
  offspringIds.length≥4)         → healer
Nurturing                        → nurturer
Aggressive OR Spike body         → guardian
Wisp + (Wanderer OR Curious
  OR generation≥2)               → scout
Wanderer OR Greedy               → forager
Dreaming/Sentinel (fallback)     → shaman
```

Role labels (with emoji prefix) are defined in `ROLE_LABELS` in `speech.ts` and displayed in `DossierPanel.tsx` as a badge in the Biology section, directly below the trait badges. Roles also drive `getSpeechContext()` (which sentence type a creature generates) and `ROLE_EMOJI` (bonus vocabulary unlocked through the role).

### Micro-animations

Short body-language bursts triggered by creature state. The renderer interpolates within a `MICRO_ANIM_DURATION_MS` window. Animations are stored as `{ type, startMs }` on the creature.

| Type | Duration | Trigger condition |
|---|---|---|
| jump | 600ms | During playing state or birth event |
| shake | 500ms | Warmth < 30 or just recovered from sick |
| sneeze | 400ms | Sick state or arid biome |
| groom | 900ms | During grooming state |
| wag | 700ms | Bonded partner enters proximity |

Per-tick trigger chances are very low (0.008–0.025) so animations feel special rather than constant.

### Vegetation lifecycle

Trees have a finite productive lifespan:

| Stage | Age threshold | Effect |
|---|---|---|
| Sapling | 0 → TREE_GROW_DAYS (120 ticks) | No fruit; no shelter |
| Mature | TREE_GROW_DAYS → TREE_PEAK_AGE (480 ticks) | Full fruit production |
| Declining | TREE_PEAK_AGE → TREE_WITHER_AGE (840 ticks) | Reduced fruit production |
| Withered | TREE_WITHER_AGE → TREE_DECAY_AGE (1200 ticks) | No fruit; shelter only |
| Decayed | TREE_DECAY_AGE+ | Tile reverts to barren; `TREE_REGROW_FROM_DECAY = 0.006` chance/tick to become a sapling |

Bushes wither in drought/late autumn/winter (`BUSH_WITHER_CHANCE = 0.0002`) and regenerate on grass in spring/lush biomes (`BUSH_REGROW_CHANCE = 0.0004`). World-wide caps: `VEG_TREE_CAP = 250` (tree + shelter tiles), `VEG_BUSH_CAP = 400`.

### Healroot system

Medicinal herb patches (`healroot` tile type) that grow in lush and wetland biomes:
- Spawns dynamically near death sites: `HEALROOT_DEATH_SPAWN_CHANCE = 0.08` per death event, within `HEALROOT_DEATH_SITE_RADIUS = 3` tiles
- Creatures with health < `HEALROOT_SEEK_HEALTH (40)` and state `sick` enter `seeking_healroot` behaviour
- Consuming: `HEALROOT_HEAL_PER_USE = 22` health, decrements potency by `HEALROOT_CONSUME_AMOUNT = 35`
- Carrying: a creature may pick up healroot and deliver it to a sick tribemate; delivery grants `HEALROOT_CARRY_HEAL = 15` health
- Regrows at `HEALROOT_REGROW_RATE = 0.06` per tick (slow; these are scarce resources)
- Max potency per tile: `HEALROOT_MAX_AMOUNT = 100`

### Reproduction

**Sexual (primary path; all body types):**
- Requires maturity (`age ≥ 30 ticks`), health ≥ 55, hunger ≤ 55
- Requires at least one bond with strength ≥ **35** (`REPRODUCE_BOND_MIN_STRENGTH`)
- Partner must be alive, non-Aggressive, not already paired this tick, within **12 tiles**
- Rate: `REPRODUCE_RATE_BY_BODY × season bonus × population factor`
- Season bonuses: spring 1.3×, summer 1.0×, autumn 0.8×, winter 0.3×

**Asexual division (Spore body only; rare fallback):**
- Only fires for `genome.body === 'Spore'`
- Requires age ≥ 45 ticks, health ≥ 78, hunger ≤ 30, not winter, population factor > 0.6
- Rate: `ASEXUAL_BASE_CHANCE = 0.0008` per tick
- Costs the parent: −18 health, +22 hunger
- Mutation rate 15% (vs 8% sexual), larger morphSeed drift (±0.16)

**Population pressure:** `DISEASE_POP_THRESHOLD = 50` (calibrated for 240×240 world). Above this, `popFactor` scales from 1.0 down to 0.20, suppressing both reproduction rates. Crowded creatures also risk disease spread (`DISEASE_CONTACT_CHANCE = 0.0018`). Disease auto-clears when health recovers to `DISEASE_RECOVERY_HEALTH = 40`.

### Creature visual system

**Color** — `genomeColor(genome)` computes HSL from personality base hue, body saturation/lightness modifier, mind hue shift, and morphSeed drift (±11° hue).

**Shape by body:**
- **Shell** — flat ellipse with dorsal arc; ridges emerge at generation/spinalLength thresholds; lateral flanges at limbLength > 0.35
- **Spike** — round body with dorsal spine scaled by kills + gen + spinalLength; segmented limbs at limbLength > 0.55; rear barbs at high spinalLength/gen
- **Wisp** — tall ellipse with bezier tail; secondary fraying strand; trailing filaments; diaphanous fins at limbLength > 0.30
- **Spore** — asymmetric blob driven by morphSeed; pseudopod lobes (1–5) at limbLength > 0.20; flagellum at spinalLength > 0.35; budding scar if it has offspring

**Generation factor** (`genFactor = min(1, generation / 5)`) gates visual feature classes. `morphology` traits control how far each feature has developed within a specific lineage.

**Environmental adaptation** — `dominantBiome` updated each tick. Rendered as a tinted overlay: arid = warm orange, wetland = cool blue, lush = green, rocky = grey mineral dust. Rocky-biome creatures develop slightly enlarged eyes.

**Micro-animations** — short-lived body-language bursts (`jump`, `shake`, `sneeze`, `groom`, `wag`); renderer interpolates within the animation duration window.

**Stress marks** — at stress > 65, jagged crack-like marks appear scaled to `(stress − 65) / 35`.

**Newborn glow** — age < 60 ticks → pulsing yellow halo.

**Night dimming** — all creatures dim at night (α 0.55) except Curious and Dreaming (nocturnal, stay at α 0.92).

**Cave dimming** — creatures inside cave tiles render at `CAVE_CREATURE_ALPHA = 0.50`.

### Awareness stages

| Stage | Trigger | Message tone |
|---|---|---|
| 1 | Default | Observational, third-person; *"the river is cold today"* |
| 2 | Gen ≥ 5, at least one **alive** Sentinel | Personal, eerie; *"the hand came again"* |
| 3 | Alive pop ≥ 80, gen ≥ 6, any **alive** Sentinel | Direct address; *"we know you can read this"* |

`computeAwarenessStage` filters to alive creatures only. Dead Sentinels and historical population do not count.

Messages are gated by mind type, sentience level, and a cooldown of `MIN_GAME_DAYS_BETWEEN_MESSAGES (7) × mods.awarenessMessageMult` game days. Sentience growth is deliberate and slow — the colony should spend many generations in stage 1 before organically reaching stage 2.

### Sentience growth rates (`SENTIENCE_GROWTH_BY_MIND`)

| Mind | Growth per tick | Notes |
|---|---|---|
| Feral | 0.0004 | Almost no growth; purely instinctive |
| Aware | 0.002 | Slow baseline cognitive development |
| Dreaming | 0.003 | Pattern-seeking; faster but still measured |
| Sentinel | 0.006 | Deliberate; edges toward full self-awareness over generations |

All rates are scaled by `mods.sentienceGrowthMult` from the caretaker profile. The caretaker's presence within `CARETAKER_PRESENCE_RADIUS (6)` tiles during the last `CARETAKER_PRESENCE_WINDOW_MS (30s)` boosts nearby sentience by `CARETAKER_SENTIENCE_BOOST = 0.003` per tick. Sentinels on rocky biome tiles gain `NATURAL_ROCKY_SENTINEL_BONUS = 0.005` per tick.

### Endings

| Ending | Trigger | What happens |
|---|---|---|
| **Extinction** | All creatures die | Grid goes dark, fossil record written to Supabase |
| **Fracture** | Two aggressive tribes war over the last river tile | *(stub — not yet implemented)* |

The type `EndgameType = 'extinction' | 'fracture' | 'ascension' | null` is preserved for save compatibility, but `checkEndgame()` only fires for extinction. There is no hard ascension termination. Stage 3 awareness is a narrative milestone, not a win condition.

### Caretaker tools and limits

| Tool | Key | Default limit | Interventionist profile |
|---|---|---|---|
| Select | `1` | Unlimited | Unlimited |
| Drop food | `2` | 5-second cooldown | 3-second cooldown |
| Plant tree | `3` | Unlimited | Unlimited |
| River redirect | `4` | Once per season | Once per season |
| Thunder strike | `5` | 2 charges/day, 12s cooldown | 2 charges/day |
| Ignite fire | `6` | 3 charges/day, 8s cooldown | 3 charges/day |
| Heal | Panel button | 3 charges per real day | 4 charges per real day |

Charge counts and cooldowns are derived from `mods.healCharges` / `mods.foodDropCooldownMs` at world creation. The Toolbar charge badges read from `caretaker.thunderChargesToday` / `caretaker.fireChargesToday` (remaining charges).

### Camera controls

| Input | Action |
|---|---|
| Scroll wheel | Zoom (0.18× – 5.0×, centered on cursor) |
| Drag (middle button or Shift+left) | Pan |
| `Q` / `E` | Rotate world 90° CCW / CW |
| `+` / `-` | Zoom in / out |
| `0` | Recenter and reset to ZOOM_INIT (1.0×) |

The canvas is fully responsive. `ResizeObserver` on the wrapper div updates canvas pixel dimensions and recenters the camera on every resize.

### Save system

1. **Auto-save** every 30 real seconds to Supabase (`colonies` table, JSONB blob)
2. **IndexedDB** local fallback; written on every cloud save
3. **Manual save** via `Ctrl+S` / `Cmd+S`
4. On tab close: `markSessionEnd()` writes `lastSessionEnd` timestamp
5. On load: `computePassiveTicks()` calculates elapsed real minutes → passive ticks (capped at **120** = 2 real minutes), then batch-applies them before the live loop starts

---

## Key files to know

### `src/types/index.ts`
The canonical definition of everything. Start here when adding any feature.

Key types:
- `CaretakerProfile`, `SimModifiers` — profile-driven multipliers
- `Creature` — full creature state including `role?`, `knownEmoji`, `microAnim?`, `carrying?`, `traumaUntil?`
- `Genome` — personality (14 options), body (4), mind (4), morphSeed, morphology, race?, latentAncestry?
- `Tile` — all tile fields including `snowDepth?`, `puddleLevel?`, `healrootAmount?`, `fruitAge?`, `elevation?`
- `GameState` — includes `enrichmentItems`, `weather`, `snowAccumulation`, `racePopulations?`, `extinctRaces?`
- `WeatherState = 'clear' | 'rain' | 'storm' | 'drought' | 'snow'`
- `EndgameType = 'extinction' | 'fracture' | 'ascension' | null` (ascension preserved for save compat only)
- `CommunityRole` — `shaman | guardian | forager | nurturer | elder | scout | healer | recluse`
- `EnrichmentItem`, `EnrichmentType` — 8 caretaker-placed world items
- `MicroAnimType = 'jump' | 'shake' | 'sneeze' | 'groom' | 'wag'`
- `CarriedItemType = 'healroot' | 'fruit' | 'pebble'`

### `src/engine/constants.ts`
**All tuning values live here.** Never hardcode magic numbers elsewhere. Key groups:
- Time: `REAL_MS_PER_GAME_DAY`, `DAY_FRACTION_PER_TICK`, `DAYS_PER_SEASON`
- World: `WORLD_SIZE = 240`, `MUTATION_CHANCE = 0.08`
- Needs: `HUNGER_DECAY`, `THIRST_DECAY`, `WARMTH_DECAY_WINTER/BASE`, `SOLAR_WARMTH_BONUS`
- Reproduction: `REPRODUCE_RATE_BY_BODY`, `REPRODUCE_BOND_MIN_STRENGTH = 35`, `ASEXUAL_BASE_CHANCE`, `ASEXUAL_MUTATION_CHANCE = 0.15`
- Awareness: `AWARENESS_STAGE_2_GENERATION = 5`, `AWARENESS_STAGE_3_POPULATION = 80`, `AWARENESS_STAGE_3_GENERATION = 6`
- Sentience: `SENTIENCE_GROWTH_BY_MIND`, `CARETAKER_SENTIENCE_BOOST = 0.003`, `NATURAL_ROCKY_SENTINEL_BONUS = 0.005`
- Messages: `MIN_GAME_DAYS_BETWEEN_MESSAGES = 7`
- Disease: `DISEASE_POP_THRESHOLD = 50`, `DISEASE_RECOVERY_HEALTH = 40`
- Weather: `WEATHER_DURATION`, `RAIN_*`, `STORM_*`, `DROUGHT_*`
- Snow: `SNOW_ENABLED`, `SNOW_ACCUMULATE_RATE`, `SNOW_MELT_RATE`, `SNOW_MOVE_PENALTY`, `SNOW_WARMTH_DRAIN`, `SNOW_BIOMES`
- Puddles: `PUDDLE_FORM_THRESHOLD`, `PUDDLE_ACCUMULATE_RATE`, `PUDDLE_EVAPORATE_RATE`, `PUDDLE_THIRST_RELIEF`, `PUDDLE_FLOW_CHANCE`
- Healroot: `HEALROOT_MAX_AMOUNT`, `HEALROOT_REGROW_RATE`, `HEALROOT_HEAL_PER_USE`, `HEALROOT_CONSUME_AMOUNT`, `HEALROOT_SEEK_HEALTH`, `HEALROOT_CARRY_HEAL`, `HEALROOT_DEATH_SITE_RADIUS`, `HEALROOT_DEATH_SPAWN_CHANCE`
- Enrichment: `ENRICHMENT_USE_RADIUS`, `ENRICHMENT_MAX_PER_TILE`, `ENRICHMENT_COOLDOWN_TICKS`, `ENRICHMENT_MAX_USES`, `ENRICHMENT_EFFECTS`
- Natural enrichment: `NATURAL_CAVE_STRESS_REDUCTION`, `NATURAL_RIVER_STRESS_REDUCTION`, `NATURAL_TREE_STRESS_REDUCTION`, `NATURAL_BUSH_STRESS_REDUCTION`
- Vegetation lifecycle: `TREE_PEAK_AGE`, `TREE_WITHER_AGE`, `TREE_DECAY_AGE`, `TREE_REGROW_FROM_DECAY`, `TREE_SEED_CHANCE`, `BUSH_WITHER_CHANCE`, `BUSH_REGROW_CHANCE`, `VEG_TREE_CAP`, `VEG_BUSH_CAP`
- River erosion: `RIVER_EROSION_CHANCE`, `RIVER_DRYING_CHANCE`, `RIVER_WINTER_FLOOD_CHANCE`
- Micro-animations: `MICRO_ANIM_DURATION_MS`, `MICRO_ANIM_TRIGGER_CHANCE`
- Play: `PLAY_TRIGGER_SATISFACTION`, `PLAY_PARTNER_RADIUS`, `PLAY_DURATION_TICKS`, `PLAY_STRESS_REDUCTION`
- Bond grief: `DEAD_BOND_FADE_PER_TICK = 0.35`
- Early-gen cohesion: `EARLY_GEN_MAX = 2`, `EARLY_GEN_COHESION_RADIUS = 28`
- Bone memory: `BONE_MEMORY_CHANCE`, `BONE_MEMORY_RADIUS`
- Race/latency: `LATENT_REVIVAL_BASE`, `LATENT_DEPTH_BONUS`, `LATENT_MAX_DEPTH`, `LATENT_DOMINANT_WEIGHT`
- Environmental tools: `THUNDER_*`, `FIRE_*`, `LIGHTNING_*`

### `src/engine/tick.ts` → `tickSimulation(state)`
The main loop. Returns the next full `GameState`. Order:

```
tickTime → tickWeather(mods) → tickTiles(mods)
→ tickCreatures(mods) → tickReproduction → tickTribes
→ update colony stage + awareness → tickCaretaker → checkEndgame
```

`tickCreatures` does the heavy work: needs decay (hunger, thirst, warmth including solar bonus, night extra, snow drain), biome/weather thirst corrections, AI behavior and movement, eating, drinking from tiles/puddles, healroot seeking and consumption, grooming, playing, enrichment use, lightning damage, fire damage, snow movement penalty, cannibalism, cannibal trauma, disease, bonding (with `BOND_STRENGTH_PER_TICK × mods.bondSpeedMult`), bond grief fade, fighting, death, micro-animation triggers, message generation, emoji vocab learning and unlocking, role assignment.

`checkEndgame` — only fires extinction check. No ascension trigger exists.

`tickWeather` draws drought duration scaled by `mods.droughtDurationMult`. `tickTiles` multiplies food regrowth by `mods.foodRegrowMult`, handles tree lifecycle stages, bush withering/regrowth, river erosion, puddle accumulation and evaporation, healroot regrowth and death-site spawning.

Old saves missing `weather`, `weatherTimer`, `enrichmentItems`, or `modifiers` are backward-compatible via nullish coalescing in `tickSimulation`.

### `src/engine/profile.ts`
`computeSimModifiers(profile: CaretakerProfile) → SimModifiers`

Modifier application order: presence → world → evolution → focus → expectation → visibility.

Key current values:
- evolution=fast: `mutationChance = 0.13`, `sentienceGrowthMult *= 1.35`
- evolution=slow: `mutationChance = 0.05`, `sentienceGrowthMult *= 0.70`
- expectation=ascension: `sentienceGrowthMult *= 1.20` (not a threshold offset — ascension is not a hard ending)
- Default `mutationChance = 0.08` (matches `MUTATION_CHANCE` in constants)

### `src/engine/speech.ts`
Emoji vocabulary system, sentence grammar, role assignment, and vocab inheritance.

Key exports:
- `EMOJI_TIER_0/1/2/3` — vocabulary pools, sentience-gated. Tier 0 = primal/feral, Tier 3 = meta-aware/Sentinel
- `SENTENCE_PATTERNS` — 37 contexts, each with 4–8 pattern variants. Patterns are `string[][]` of emoji
- `ROLE_EMOJI` — bonus vocabulary earned through role, unlocked via `unlockTierEmoji()`
- `getSpeechContext(c, awarenessStage)` — maps creature state → `SentenceContext | null`; recluse almost never speaks; role drives cultural expression
- `buildSentence(c, context)` — filters patterns to only what the creature knows; prefers richer patterns with randomness
- `assignRole(c, tribeSize, lineageCount)` — see Community roles section above
- `starterEmoji(mind, personality, rng)` — birth vocabulary based on mind depth and personality bias
- `inheritEmoji(parentA, parentB, tribalLexicon, rng)` — ~50% of each parent's vocab passes to child; cultural transmission of one tribal word
- `learnFromNearby(learner, teacher, bondStrength, rng)` — bonded creatures teach at mind-rate × role bonus
- `unlockTierEmoji(c, rng)` — sentience-gated tier unlock and role emoji acquisition
- `ROLE_LABELS` — emoji-prefixed display strings for each role, used by `DossierPanel`

### `src/store/gameStore.ts`
The single Zustand store. Components read via `useLaietStore`.

- `initNewWorld(userId, namedCreatures, profile)` — calls `computeSimModifiers(profile)`, stores both in `GameState`, initializes caretaker
- Caretaker actions: `dropFood`, `healCreature`, `redirectRiver`, `thunderStrike`, `igniteFire`, `placeEnrichment`
- `resetWorld` calls `resetUserData()` from persistence (server-side RPC + IDB wipe)
- `startTicking` / `stopTicking` — own the tick interval; speed controlled via `simSpeed` store field

### `src/world/worldGen.ts` → `generateWorld(seed)`
Pure function. Deterministic — same seed always produces the same world. Stores `elevation` in tile objects via `elevMap[][]`.

Key functions: `carveRiver`, `scatterRocks`, `raiseMountains`, `digCaves`, `carveCliffs`, `plantTrees`, `scatterBushes`, `scatterFood`, `seedCenterResources`, `isTilePassable()`.

`scatterBushes` converts eligible grass tiles to `bush` based on biome density. `isTilePassable()` blocks cliff, mountain, rock, flooded.

### `src/ui/renderer/`
Pure canvas drawing. No React, no state. Import from `@/ui/renderer`.

| Module | Responsibility |
|---|---|
| `tiles.ts` | `drawTile`, `drawTileDecoration`, fire overlay, lightning bolt, snow overlay, puddle shimmer, healroot tuft, `gridToIso`, `isoToGrid`. Tile depth scales with `tile.elevation`; low tiles ~3px, mountain peaks ~7px. Bush decoration uses `bs = max(1.0, s*2)` so foliage is always visible at any zoom. |
| `creatures.ts` | `drawCreature`; shape by body type, biome tint overlay, generation features, morphology-driven appendages, stress marks, newborn glow, micro-animation interpolation, thought symbol, cave dimming |
| `overlays.ts` | `drawAtmosphere` (combined weather + phase, unified pass), `drawScanlines`, `drawVignette` |
| `utils.ts` | `lighten`, `darken`, `adjustBrightness`; all clamped |

**Critical:** `drawAtmosphere` replaces the old separate weather+phase calls. They interact — never split them back out.

### `src/creatures/behavior.ts`
Creature AI. `tickBehavior()` and `tickMovement()` return `Partial<Creature>` — never mutate. Applied in `tick.ts`.

Contains: `canReproduce()`, `canAsexuallyReproduce()` (Spore only), `resolveFight()`, `tickNeeds()`, `eatFromTile()`, `drinkFromTile()`, `healFromRoot()`, `applyGroomingEffect()`, `applyEnrichmentEffect()`.

Key behavioral rules:
- **Bond-seeking threshold** — creatures seek bonds until `bonds.filter(b => b.strength >= REPRODUCE_BOND_MIN_STRENGTH).length === 0`
- **Territorial intruder check** — excludes bonded allies (bond strength ≥ 20 exempts target)
- **Enrichment cooldown** — gated by `c.age - (c.lastEnrichmentTick ?? 0) >= ENRICHMENT_COOLDOWN_TICKS`, not `stateTimer` (which resets on state changes)
- **Territory tile claim** — Aggressive/Territorial creatures claim grass, bush, river tiles; NOT rock or cliff (impassable), NOT mountain
- **Terrain affinity radius** — 20 tiles max; body-type ecology draws are local

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

Both have RLS enabled. Two Postgres functions:
- `reset_user_data()` — `SECURITY DEFINER`, authenticated only. Hard-deletes all `colonies` and `fossil_records` for `auth.uid()`.
- `admin_reset_all_app_data(p_confirm text)` — service role only. Truncates both tables. `p_confirm` must be `'CONFIRM_RESET'`.

---

## Environment variables

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both are prefixed `VITE_` so Vite exposes them via `import.meta.env`. The anon key is safe to expose; RLS enforces access server-side.

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
npm run lint         # ESLint check
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

Speed controls (1×/2×/4×) and pause are also in the Toolbar. Speed changes restart the tick interval at `TICK_INTERVAL_MS / simSpeed`.

---

## Adding a new personality trait

1. Add it to `PersonalityTrait` union in `src/types/index.ts`
2. Add its behavior case in `tickBehavior()` in `src/creatures/behavior.ts`
3. Add its `needSatisfaction` penalty in `computeNeedSatisfaction()` in `behavior.ts`
4. Add its base HSL to `genomeColor()` in `src/engine/genetics.ts`
5. Add its description to `describeGenome()` in `genetics.ts`
6. Add its perceptual seeds to `starterEmoji()` in `src/engine/speech.ts`
7. Consider whether it earns a community role in `assignRole()` in `speech.ts`
8. Optionally add trait-specific messages to the pools in `src/engine/messages.ts`

## Adding a new tile type

1. Add it to `TileType` union in `src/types/index.ts`
2. Add its three-face colors to `TILE_COLORS` in `src/ui/renderer/tiles.ts`
3. Add its decoration to `drawTileDecoration()` in `renderer/tiles.ts`
4. Add its movement modifier to `TILE_MOVE_MODIFIER` in `src/engine/constants.ts`
5. Handle its passability in `isTilePassable()` in `src/world/worldGen.ts`
6. Add any food/water/shelter behavior in `tickTiles()` in `src/engine/tick.ts`

---

## Known stubs / not yet implemented

- **Fracture ending** — `tickTribes()` in `tick.ts` is a stub. Tribe formation logic is scaffolded in types but the war mechanic (two tribes claiming the last river tile → permanent split) is not yet built. `tribe_war` event type exists but no trigger fires.
- **River redirect UI** — the store action exists (`redirectRiver`) but the two-click flow in `GameCanvas.tsx` is not fully wired. The action works when called programmatically.
- **Fossil record display** — `loadFossilRecords()` in `persistence.ts` fetches records but there is no UI to view past extinctions yet.
- **`ascension` EndgameType** — preserved in the type union and in `GameState.endgame` for save compatibility. `checkEndgame()` does not fire it. There is no hard ascension ending; stage 3 awareness is a narrative milestone only.

---

## Philosophy / design notes

The simulation follows a **Dwarf Fortress principle**: emergent complexity from simple rules, simulation depth over visual fidelity. The player should never feel in control — only responsible.

Key design constraints that must be preserved:
- The player **cannot command** creatures. They can only place things.
- The simulation is **continuous and open-ended**. Termination emerges only from genuine systemic collapse (extinction), not from reaching a milestone.
- The **awareness arc must feel earned** — stage 2 messages should not appear before generation 5, stage 3 not before generation 6 and population 80. Sentience growth is deliberately slow.
- The colony should be able to **survive without the player** — time must pass meaningfully during absence.
- **Neglect must have consequences** — if the player ignores the colony for 8+ real hours in winter, creatures should die.
- **Fossil records must persist across extinctions** — the player's history must survive colony death.
- **Asexual reproduction is rare and body-specific** — only Spore creatures divide. Other body types must bond to reproduce.
- **Weather and day phase are inseparable** — always render them through `drawAtmosphere()` together. Never apply as independent layers.
- **Community roles are emergent, not assigned** — roles reflect behavioral contribution (kills, offspring count, sentience depth, generation) not just genetics.

> *"you cannot command them. you can only tend.*
> *the colony will outlive your attention, remember your absence,*
> *and eventually — decide what you are to them."*

---

*Built by Sammakara Mak. Free forever.*
