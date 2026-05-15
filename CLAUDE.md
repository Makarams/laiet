# CLAUDE.md — LA-IET.EXE

> "la-iet" = small animal / insect, in Khmer.

## What this project is

LA-IET.EXE is a **generational insect colony simulation** in the browser. The player is a caretaker — they cannot command the colony, only tend it. The colony breeds, fractures across tribes, and eventually becomes aware it is being watched.

The simulation is **continuous and open-ended**. The only hard termination is extinction. Stage 3 awareness is a narrative milestone, not a win condition.

Inspired by: Black Mirror S7E4 "Plaything" and Dwarf Fortress.  
Free forever. Passion project. Built by Sammakara Mak.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite 6 + TypeScript 5 |
| Styling | Styled Components v6 |
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
│   ├── genetics.ts         Trait pools, inheritance, mutation, genomeColor
│   ├── messages.ts         Colony message pools (3 awareness stages)
│   ├── profile.ts          CaretakerProfile → SimModifiers
│   ├── speech.ts           Emoji vocabulary, sentence patterns, role assignment
│   └── tick.ts             Main simulation loop (tickSimulation)
├── world/worldGen.ts       Procedural 240×240 world, seeded RNG
├── creatures/
│   ├── factory.ts          spawn, createOffspring, createAsexualOffspring
│   └── behavior.ts         Needs decay, AI state machine, movement
├── ui/
│   ├── renderer/           Canvas drawing (tiles, creatures, overlays, utils)
│   └── components/         React components (App, GameLayout, GameCanvas, Toolbar…)
│   └── panels/             ColonyStatsPanel, DossierPanel, MessageLogPanel
├── audio/chiptune.ts       Adaptive music + weather ambient (see docs/audio.md)
├── db/                     Supabase client + IndexedDB persistence
└── store/gameStore.ts      Zustand store; all caretaker actions
```

---

## Key files

**`src/types/index.ts`** — Start here. Defines: `Creature`, `Genome`, `Tile`, `GameState`, `CaretakerProfile`, `SimModifiers`, `WeatherState`, `EnrichmentItem`, `CommunityRole`, `MicroAnimType`.

**`src/engine/constants.ts`** — Single source of truth for all tuning values (time, world, needs, reproduction, awareness, sentience, weather, snow, puddles, healroot, enrichment, vegetation).

**`src/engine/tick.ts` → `tickSimulation(state)`** — Main loop order:
```
tickTime → tickWeather → tickTiles → tickCreatures → tickReproduction
→ tickTribes → colonyStage/awareness → tickCaretaker → checkEndgame
```

**`src/creatures/behavior.ts`** — AI. `tickBehavior()` and `tickMovement()` return `Partial<Creature>` — never mutate directly.

**`src/engine/profile.ts`** — `computeSimModifiers(profile)`. Modifier order: presence → world → evolution → focus → expectation → visibility.

**`src/engine/speech.ts`** — Emoji vocabulary tiers, sentence patterns, `assignRole()`, vocab inheritance. See also `ROLE_LABELS` (displayed in DossierPanel).

**`src/ui/renderer/`** — Pure canvas. Import from `@/ui/renderer`. `drawAtmosphere()` is the **single combined weather+phase call** — never split them back out.

**`src/store/gameStore.ts`** — `initNewWorld`, caretaker actions (`dropFood`, `healCreature`, `redirectRiver`, `thunderStrike`, `igniteFire`, `placeEnrichment`), `startTicking`/`stopTicking`.

---

## Design constraints (must preserve)

- Player **cannot command** creatures — only place things
- Simulation is **continuous** — no designed completion state
- **Awareness arc is earned** — stage 2 requires gen ≥ 5 + alive Sentinel; stage 3 requires population ≥ 80 + gen ≥ 6
- Sentience growth is **deliberately slow** — many generations in stage 1 before stage 2
- Colony **survives without the player** — passive ticks on return (capped at 120)
- **Neglect has consequences** — 8+ real hours in winter should cause deaths
- **Fossil records persist** across extinctions
- **Asexual reproduction is Spore-only** — other body types must bond
- **Weather and day phase are inseparable** — always render via `drawAtmosphere()` together
- **Community roles are emergent** — reflect behavioral contribution, not just genetics

---

## Caretaker tools

| Tool | Key | Limit |
|---|---|---|
| Select | `1` | Unlimited |
| Drop food | `2` | 5s cooldown (3s interventionist) |
| Plant tree | `3` | Unlimited |
| River redirect | `4` | Once per season |
| Thunder strike | `5` | 2 charges/day, 12s cooldown |
| Ignite fire | `6` | 3 charges/day, 8s cooldown |
| Heal | Panel | 3 charges/real-day (4 interventionist) |

## Camera controls

| Input | Action |
|---|---|
| Scroll / `+` `-` | Zoom (0.18×–5.0×) |
| Drag (middle or Shift+left) | Pan |
| `Q` / `E` | Rotate 90° CCW / CW |
| `0` | Recenter (ZOOM_INIT = 1.0×) |

## Keyboard shortcuts

`Space` pause/resume · `1-6` tools · `Q/E` rotate · `+/-` zoom · `0` recenter · `Ctrl+S` save

---

## Save system

1. Auto-save every 30s to Supabase (`colonies` table, JSONB)
2. IndexedDB local fallback on every cloud save
3. `Ctrl+S` manual save
4. On tab close: `markSessionEnd()` writes `lastSessionEnd`
5. On load: `computePassiveTicks()` → batch-apply passive ticks (cap 120) before live loop

## Database

```sql
colonies(world_id uuid pk, user_id uuid, state jsonb, updated_at timestamptz)
fossil_records(id uuid pk, user_id uuid, fossil jsonb, created_at timestamptz)
```

Both tables have RLS. `reset_user_data()` (SECURITY DEFINER) deletes user's data.

## Environment variables

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Running locally

```bash
npm install
cp .env.example .env  # fill in Supabase URL + anon key
npm run dev           # http://localhost:5173
npm run build
npm run lint
```

## Deploy

```bash
vercel  # add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY when prompted
```

---

## Known stubs

- **Fracture ending** — `tickTribes()` is a stub; `tribe_war` event type exists but never fires
- **River redirect UI** — store action works but two-click flow in `GameCanvas.tsx` not fully wired
- **Fossil record display** — `loadFossilRecords()` fetches but no UI to view past extinctions
- **`ascension` EndgameType** — preserved for save compat; `checkEndgame()` does not fire it

---

## Detailed references

| Topic | File |
|---|---|
| Sim mechanics (time, weather, AI, reproduction, needs) | `docs/sim-mechanics.md` |
| Genetics, morphology, visual system, adding traits/tiles | `docs/genetics-visual.md` |
| Audio system, music contexts, weather ambient | `docs/audio.md` |
