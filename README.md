# LA-IET.EXE

*la-iet — small animal / insect, in Khmer.*

A generational insect-colony simulation that runs in your browser. You play as a caretaker: an unseen presence that can drop food, plant trees, redirect rivers, set fires, call down lightning, heal individuals, and place enrichment. You cannot command the colony. You can only tend.

The colony lives, mutates, bonds, fractures into tribes, evolves a shared symbolic language, and over many generations becomes aware that something is watching. Eventually it speaks directly to you. The simulation has no win condition. It runs continuously until extinction.

Inspired by Black Mirror S7E4 *"Plaything"* and Dwarf Fortress. Built by Sammakara Mak. **Free forever.**

---

## Design pillars

LA-IET.EXE is built around four uncompromising principles:

1. **You cannot command** — every action is environmental. Creatures decide what to do with what you place.
2. **Behaviour emerges from drives, not labels** — a creature with high *dominance* defends territory whether or not anyone called them a guardian.
3. **The colony speaks only about what actually happened** — every line in the message log traces to a real event in the engine's chronicle, with no authored prose making claims the engine never computed.
4. **Categories fall out of events** — fear, apex predators, tribes, subspecies aren't labels imposed by the engine; they emerge from witnessed kills, family-name evolution, spatial clustering, and morphology drift.

---

## What you do

| Tool | Key | Limit | Effect |
|---|---|---|---|
| **Observe** | `1` | Unlimited | Click a creature to open the field record |
| **Feed** | `2` | 5s cooldown | Drop food at the cursor |
| **Plant** | `3` | Unlimited | Place a sapling (grows over ~2 in-game minutes) |
| **River** | `4` | Once per season | Redirect a river channel |
| **Strike** | `5` | unlimited | Call down lightning (damages creatures, ignites trees) |
| **Ignite** | `6` | unlimited | Set fire to a tree, bush, or shelter |
| **Enrich** | `7` | unlimited | Place one of eight enrichment items |
| **Build** | `8` | unlimited | Place fence / cairn / nest / watch post |
| **Bush** | `9` | unlimited | Pick up a bush or replant the one you're holding |
| **Heal** | Dossier panel | unlimited | Restore a creature's health |

### Action pressure (replaces daily caps)

There are no daily charges and no per-tool cooldowns. Every action is always available. The only gating is a 220 ms anti-spam floor that prevents a single click from registering ten times.

Balance comes from a soft **action pressure** curve (visible as the "Pressure" bar in the toolbar). Each action adds a small weight to the curve — heavy interventions (strike, fire, nest, heal) cost more than lightweight ones (food, plant, fence). Pressure decays continuously toward zero. Above ~55/100 it bleeds a tiny amount of ambient stress into creatures near your most recent action site — the colony begins to feel the intervention. Below that threshold, pressure is purely informational. Nothing is ever locked away from you.

### Build kit (under the Build tool)

| Object | Effect |
|---|---|
| **Fence** | Wooden barrier — slows movement, decays in storms |
| **Cairn** | Memorial stones — calming aura over a 4-tile radius; if placed on a death site it inherits the lost creature's identity |
| **Nest** | Breeding zone — bonded pairs within 4 tiles get a reproduction roll boost; offspring spawn with +15 health |
| **Watch Post** | Vigilance amplifier — drifts every nearby creature's vigilance drive toward 1.0 over time; nearby Vigilant creatures see feared targets from farther |

The **Bush** tool toggles between pick-up and replant. Carried bushes preserve their berry count so the caretaker can move fruit-loaded shrubs to where they're needed.

Your presence has weight. Each action is chronicled. Creatures with sufficient sentience register the proximity as a *caretaker_contact* experience, and over time the colony references you in its messages.

---

## The four morphotypes

Every world starts with four founding creatures, drawn independently from the full personality, body, and mind pools. There is no forced composition — a world can start without a Spore, or with three Aggressives.

| Body | Role | Notable |
|---|---|---|
| **Spore** | Rapid coloniser | Only body that can reproduce asexually; short-lived (~7.5 min) |
| **Shell** | Stability backbone | Longest lifespan (~25 min); slow, resilient K-strategist |
| **Spike** | Territorial defender | Highest combat power; claims and defends tiles |
| **Wisp** | Scout and empath | Fastest mover; primary driver of awareness development |

Each creature also carries:
- A **personality** (19 possible: Curious, Timid, Aggressive, Nurturing, Wanderer, Recluse, Hoarder, Empath, Furtive, Territorial, Social, Stoic, Scavenger, Mimic, Nomadic, Vigilant, Symbiotic, Lazy, Greedy)
- A **mind** (Feral, Aware, Dreaming, Sentinel — gates how much sentience they can accumulate)
- A **race** (12 ancestral lineages: Kin, Drift, Burrow, Apex, Pale, Tide, Bloom, Ash, Ember, Mire, Crag, Veil)
- A **diploid allele pool** (hidden recessives that mutation can surface generations later)
- Up to 3 **adaptations** (cold_hardy, heat_plated, thermal_vent, thick_pelt, ridge_armor, drought_tough, hydro_fins, root_eater, spore_resistant, echo_sense, cave_sighted, bioluminescent, storm_braced)

---

## Performance & scaling

The 480×480 grid is 230k tiles. Brute-force per-tick scans would be expensive, so the simulation is structured around three rules:

- **Cache anything counted across the grid.** `state.tileTypeCount` is bootstrapped at world creation and maintained inside the main tile loop. Vegetation cap checks (tree, bush, healroot, food_patch) read from the cache, never from a fresh scan. Drift from store actions and death-site writes is absorbed by a full resync every ~60 ticks.
- **Gate expensive secondary passes.** Fire spread only iterates the grid when `anyBurning` was set during the main tile pass. River erosion runs only in storms, drying only in droughts, snow tally only in winter or while snow lingers. Each of these used to run unconditionally.
- **Bound the renderer to the viewport.** Tile iteration in `GameCanvas` derives its grid range from the four viewport corners, so per-frame cost scales with what's actually visible — not with `WORLD_SIZE²`.

Behaviour systems share work too: `tickCreatures` builds a tile-type index once at the top and reuses it across every creature's behaviour evaluation. Territory claims enforce a soft 8-tile spacing so creatures don't pile up on the same coordinates and trigger repeated conflicts.

---

## Drives — the engine of behaviour

Every creature carries seven continuous drives (0–1):

```
dominance · curiosity · sociality · vigilance · acquisitive · reclusion · mobility
```

Personality only *seeds* drives at birth. From then on, drives **drift** based on what the creature actually does. A creature that keeps fighting becomes more dominance-driven. A creature that keeps bonding becomes more social. A creature that keeps surviving in lush canopy doesn't drift toward sociality because lush is "social terrain" — it drifts toward whatever its actual actions in that terrain reinforced.

This is the core of the simulation's emergence. The drive selector chooses every behaviour, every action candidate, every fight-or-flee decision. The role label is just a *summary* of behavioural history, not a source of action.

---

## How the world works

- **Time**: 1 real minute = 1 game day. Four seasons of 30 days each. Spring, summer, autumn, winter.
- **Day cycle**: Dawn → Day → Dusk → Night within every game day. Night doubles warmth decay; the colony seeks shelter.
- **World**: 480×480 isometric grid across five biomes — **temperate, arid, lush, rocky, wetland** — each with distinct food density, water access, and thirst pressure.
- **Time away**: The simulation runs while you're gone, with a 4-real-minute catch-up cap. Long absences write a *caretaker_returned* event with the actual hardship that occurred (births, deaths, fires, lightning) into the colony's voice on return.

### Weather (10 states, mostly emergent)

| State | Mechanics |
|---|---|
| **Clear** | Baseline |
| **Rain** | Refills rivers, fills puddles, reduces thirst, mild warmth drain |
| **Storm** | Rain + lightning strikes + heavy stress |
| **Drought** | Drains rivers, halves food regrowth, raises thirst |
| **Snow** | Winter accumulation, movement penalty, warmth drain |
| **Heatwave** | Summer-only — thirst 2.2×, ignites dry vegetation, persistent stress |
| **Fog** | Stress relief; cave_sighted / echo_sense / Furtive / Recluse benefit extra |
| **Windstorm** | Strips fruit from food patches, damages bushes, stresses exposed creatures |
| **Bloom** | Spring abundance pulse — **fires only when the colony has been peaceful for 12 days during rain** |
| **Ashfall** | Triggered by total tiles burned in last 12 days — halves food regrowth, mild persistent stress |

Bloom and ashfall are **state-triggered**, not random — they emerge from the colony's own environmental history.

### Genetics & mutation

- **Diploid alleles**: each genome carries two alleles per gene slot (personality/body/mind). Recessives can surface generations later.
- **Mutation crisis-boost**: parental stress > 70 raises offspring mutation rate, modelling adaptive response under pressure.
- **Fitness-weighted inheritance**: healthier, less-stressed parents pass on more of their alleles.
- **Adaptive radiation**: birth-tile environment biases which adaptation a child acquires.
- **Lineage forking**: enough divergence (geographic + stress + lineage-hostility pressure) mints a new sub-lineage id; cross-lineage births get a blended hybrid id (`A+B`).

### Tribes (real, derived from cluster + bonds)

When ≥4 same-lineage creatures occupy a contiguous area (radius 8) with ≥50% of pairs mutually bonded above strength 30, they coalesce into a **tribe**. The tribe's name is **derived from the cluster's most-common family name** (or a blend of the top two halves when tied) — the lineage's evolved family-name language *is* its tribe-name language.

Tribes split when membership exceeds 10 and the cluster's centroid splits in space. Tribes dissolve when membership drops below 2. Every lifecycle event is chronicled.

### Fear, not "apex"

Combat deaths attribute to the attacker. Every alive creature within radius 6 of the kill site gains a **personal day-stamped fear** of that specific killer. Bonded peers of the deceased get a memory boost (fear lingers longer). Fear decays after 30 days without renewal.

In behaviour, a creature's flee radius from a feared individual scales with their *own* vigilance drive. There is no global "apex" tag — only personal memory of specific creatures, accumulated through actually witnessed events.

### Awareness arc

Awareness is **not** a quest unlock. It's evaluated every tick from the colony's actual creature distributions, with persistence hysteresis to prevent flicker:

| Stage | Required conditions (all must hold simultaneously) |
|---|---|
| **1** | Always — the baseline observational voice |
| **2** | ≥3 distinct roles held + at least 8 alive |
| **3** | Stage 2 + colony vocabulary ≥25 emoji + median sentience ≥25 |
| **4** | Stage 3 + at least 2 deep-sentience creatures + ≥2 lineages + cohort phase ≥3 |
| **5** | Stage 4 + a transcendent elder (sent ≥85, role of elder/shaman, ≥2 strong bonds) + cohort phase ≥5 |

The condition has to **hold for 80 ticks** to advance, **fail for 200 ticks** to regress. Asymmetric: hard-won, slow to lose.

### Speech (composed from real events, not authored)

Every colony message is **composed from chronicle entries** the engine actually recorded — no authored prose makes claims the simulation never computed. Each event renders through atoms:

- **Core** — the factual event (with location compass derived from real coordinates)
- **Recurrence** — only when ≥2 such events exist in the recency window
- **Caretaker link** — only when a real caretaker action was nearby in space and time
- **Spatial pattern** — only when the computed cluster spread is materially tighter than uniform random
- **Stage-5 closer** — the *speaker's own oldest observation*, cited by event kind and days-ago

What sentence stage a creature can speak at is determined by their position in the **colony's sentience distribution** — top 80% can speak stage 2, top 60% stage 3, top 40% stage 4, top 20% stage 5.

---

## Field log — three tiers + extinction report

The colony's voice is sorted into three buckets surfaced as tabs at the top of the Field Log:

- **General** — routine observations, births, weather notes, day-to-day colony chatter.
- **Important** — milestones the player should not miss: mass die-offs, legendary creatures, race emergence/loss/revival, deep-awareness speech (stage 4+), lineage extinctions, neglect warnings, the extinction line itself.
- **Event** — direct caretaker-facing notes: thunder strikes, fires, absence-return messages.

Each tab shows a running count beside its label. When the colony reaches extinction, the endgame overlay offers a **Download Report** button that emits a compressed text summary of the run — extinction cause, peak population, final generation, death-cause breakdown, race populations, tribes formed, notable chronicle events, chronicle-kind totals, and most-populous family lines — composed strictly from the engine's recorded state.

---

## Caretaker profile — six orthogonal axes

Set once before world creation. Each axis controls **one slice** of the simulation, with meaningful trade-offs.

| Axis | Options | Primary effect |
|---|---|---|
| **Conditions** | fertile · varied · scarce | Environment baseline (food, drought, weather severity, disease) |
| **Mutation Rate** | fast · drift · slow | Genetic rates (mutation chance, morphology drift, adaptation inheritance) |
| **Colony Focus** | bonds · survival · awareness | Social emphasis (bond speed, tribe formation, enrichment, sentience growth) |
| **Expectation** | persistence · adaptation · fracture | Narrative arc bias (lineage hostility seed, fracture eligibility) |
| **Your Presence** | attentive · neutral · hidden | How the colony registers you (caretaker_contact reach, message frequency) |
| **Lifespan** | brief · standard · long | Multiplies MAX_AGE for every body type (0.60× / 1.0× / 1.80×) — controls generational tempo |

The old **Role** (presence) axis was removed — caretaker actions are unlimited; the action-pressure curve handles balance.

Hints in the UI cite the actual percentage effects ("food regrowth 45% faster, droughts brief"). Defaults sit at the explicit middle of every axis.

---

## Enrichment

Eight placeable items + a natural-enrichment spawning system that scales with colony size:

| Item | Main benefit |
|---|---|
| Resting Spot | Stress relief, mild warmth |
| Scratching Post | Strong stress relief |
| Burrow | Stress relief, significant warmth |
| Warm Stone | Thermal comfort |
| Mud Pool | Thirst relief, cooling |
| Worn Path | Stress outlet through movement |
| Play Stones | Social stress relief |
| Springy Moss | Strong stress relief + minor health regen |

Player-placed items decay after 40 uses or 20 days of idle. Natural items spawn near creature clusters based on biome and season — wetlands produce mud pools, rocky terrain produces warm stones, lush produces springy moss.

---

## Visual design

The interface is the **Bioluminescent Specimen Cabinet** — a dark "field laboratory" aesthetic with:

- **Surfaces** layered for subtle depth (panel gradients, soft inner highlights)
- **Bioluminescent accents** — amber glow halos on active tools, key values, and focus rings
- **Semantic colour glow** — health bars, status pills, and awareness pips emit a soft drop-shadow keyed to their meaning
- **Hierarchy through density** — labels use 0.22em letter-spacing in uppercase; values bold and slightly larger
- **Motion** — all state transitions use a consistent ease-out curve at 0.12 / 0.18 / 0.32 / 0.5s durations
- **Typography** — single weight-variable font (Space Grotesk) at a tight type scale: xs/sm/base/md/lg/xl/xxl/title/hero
- **Spacing rhythm** — 4px base grid scale used everywhere (xxs/xs/sm/md/lg/xl/xxl/xxxl)

Every component now draws from a unified token system in `src/ui/theme.ts` rather than inline magic numbers.

### UI surfaces

| Region | Purpose |
|---|---|
| **Toolbar** | 7 tools with glyph icons + hotkeys + charge badges, status block (Day/Season/Phase/Weather/Alive/Awareness pips), playback controls |
| **Colony Stats (left)** | Population, morphotype distribution, average vitals, stage progression, awareness band, weather/snow widgets |
| **Game Canvas (center)** | 480×480 isometric world; click to select; pan/zoom/rotate |
| **Message Log (center, below canvas)** | Chronicle-grounded colony speech with stage-coloured borders, day separators, filter chips |
| **Field Record (right)** | Selected creature dossier: identity, lineage, biology, vitals, bonds, record |
| **Event popups (canvas overlay)** | Time-sensitive prompts with action options |
| **Endgame seal** | Pulsing ringed glyph + cause epitaph + restart confirmation |

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Pause / resume |
| `1` – `9` | Select tool (Observe, Feed, Plant, River, Strike, Ignite, Enrich, Build, Bush) |
| `Q` / `E` | Rotate world CCW / CW |
| `+` / `-` / Scroll | Zoom |
| `0` | Recenter camera, reset zoom |
| Drag (middle or Shift+left) | Pan |
| `Ctrl+S` | Manual save |

---

## Setting up locally

**Prerequisites:** Node.js 18+, a [Supabase](https://supabase.com) account (free tier).

```bash
git clone <repo>
cd laiet
npm install
```

**Supabase setup:**

1. Create a new project at supabase.com
2. Go to **SQL Editor** and run the full contents of `supabase_schema.sql`
3. Go to **Project Settings → API** and copy your Project URL and anon key

**Environment:**

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

The anon key is safe to include — Supabase Row Level Security enforces access server-side.

**Run:**

```bash
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
```

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
# add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY when prompted
```

`vercel.json` handles SPA routing and immutable cache headers for hashed assets.

---

## Database schema

Two tables created by `supabase_schema.sql`:

```
colonies       — world_id (pk), user_id, state (jsonb), updated_at
fossil_records — id (pk), user_id, fossil (jsonb), created_at
```

Both have RLS enabled. Functions: `reset_user_data()` (authenticated, wipes your own data) and `admin_reset_all_app_data()` (service role only).

---

## Project structure

```
src/
├── types/index.ts              Canonical types — read this first
├── engine/
│   ├── constants.ts            Every tuning value
│   ├── genetics.ts             Trait pools, inheritance, mutation
│   ├── messages.ts             Chronicle-composed colony speech
│   ├── profile.ts              CaretakerProfile → SimModifiers
│   ├── speech.ts               Emoji vocabulary, composer
│   ├── chronicle.ts            Colony's real event memory
│   └── tick.ts                 Main simulation loop
├── world/worldGen.ts           Procedural 480×480 world
├── creatures/
│   ├── factory.ts              spawn, createOffspring, sentience
│   └── behavior.ts             Drive selector, AI state machine
├── ui/
│   ├── theme.ts                Design tokens (colors, space, motion, glow)
│   ├── components/             App, GameLayout, GameCanvas, Toolbar, screens
│   ├── panels/                 ColonyStatsPanel, DossierPanel, MessageLogPanel
│   └── renderer/               Canvas drawing (tiles, creatures, overlays)
├── audio/chiptune.ts           Adaptive music + weather ambient
└── store/gameStore.ts          Zustand store
```

---

## Technical reference

| Topic | File |
|---|---|
| Sim mechanics (time, weather, AI, reproduction, needs) | `docs/sim-mechanics.md` |
| Genetics, morphology, visual system, adding traits | `docs/genetics-visual.md` |
| Audio system, music contexts, weather ambient | `docs/audio.md` |

---

*Built by Sammakara Mak. Free forever.*

> *"you cannot command them. you can only tend.*
> *the colony will outlive your attention, remember your absence,*
> *and eventually — decide what you are to them."*
