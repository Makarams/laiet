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
| Rendering | HTML Canvas 2D — isometric 240×240 grid |
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

---

## Caretaker profile axes (orthogonal)

| Axis | Options | Primary modifiers |
|---|---|---|
| Presence | interventionist / observer / silent | healCharges, foodDropCooldownMs, caretakerVisibilityMult |
| World | fertile / varied / scarce | foodRegrowMult, droughtDurationMult, weatherSeverityMult, diseasePressureMult |
| Evolution | fast / drift / slow | mutationChance, morphologyDriftMult, adaptationInheritMult |
| Focus | bonds / survival / awareness | bondSpeedMult, tribeFormationMult, enrichmentSpawnMult, sentienceGrowthMult |
| Expectation | persistence / adaptation / fracture | lineageHostilityBaseline, fractureEligibilityMult, adaptationInheritMult |
| Visibility | attentive / neutral / hidden | caretakerVisibilityMult, awarenessMessageMult |

Each axis touches a distinct slice; no two settings affect the same primary modifier.

---

## Caretaker tools (7 active tools + heal)

| Tool | Key | Limit |
|---|---|---|
| Observe | `1` | Unlimited |
| Feed | `2` | 5s cooldown (3s interventionist, 8s silent) |
| Plant | `3` | Unlimited |
| River | `4` | Once per season |
| Strike | `5` | 2 charges/day, 12s cooldown |
| Ignite | `6` | 3 charges/day, 8s cooldown |
| Enrich | `7` | Unlimited (8 enrichment types via dropdown) |
| Heal | Dossier panel | 3/day (5 for interventionist, 1 for silent) |

## Camera controls

| Input | Action |
|---|---|
| Scroll / `+` `-` | Zoom (0.18×–5.0×) |
| Drag (middle or Shift+left) | Pan |
| `Q` / `E` | Rotate 90° CCW / CW |
| `0` | Recenter (ZOOM_INIT = 1.0×) |

## Keyboard shortcuts

`Space` pause/resume · `1-7` tools · `Q/E` rotate · `+/-` zoom · `0` recenter · `Ctrl+S` save

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

- **Fossil record display** — `loadFossilRecords()` fetches but no UI to view past extinctions
- **`ascension` EndgameType** — preserved for save compat; `checkEndgame()` does not fire it
- **ESLint config** — repo has ESLint 9 but config is in old v8 format; `npm run lint` errors
- **Subspecies recognition** — chronicle event kind exists with composer support, but no emitter wired yet

---

## Detailed references

| Topic | File |
|---|---|
| Sim mechanics (time, weather, AI, reproduction, needs) | `docs/sim-mechanics.md` |
| Genetics, morphology, visual system, adding traits/tiles | `docs/genetics-visual.md` |
| Audio system, music contexts, weather ambient | `docs/audio.md` |
