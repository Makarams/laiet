# LA-IET.EXE

> *"la-iet" — small animal or insect, in Khmer*

A generational insect colony simulation. Watch your colony live, breed, fracture, and eventually become aware of you. Runs in the browser. Saves to the cloud. Time passes while you're away.

Inspired by Black Mirror S7E4 "Plaything" (the Thronglets) and Dwarf Fortress.

---

## What it is

- **Isometric 120×120 world** — procedurally generated from a numeric seed; biomes, river, mountains, caves, cliffs, food patches, trees
- **Insect creatures** with inherited genetics across 3 gene slots (personality, body, mind) plus accumulated morphological traits that diverge per lineage over generations
- **Caretaker profile** — five questions answered before the world begins shape the entire simulation: food abundance, mutation rate, bond speed, awareness pacing, and ending tendencies
- **Four body types** with distinct ecological roles: Spore (r-strategist, divides asexually), Shell (K-strategist, long-lived), Spike (territorial fighter), Wisp (scout, empathic)
- **Day/night + 4 seasons + weather** — clear, rain, storm, drought. Real time drives the simulation (1 real minute = 1 game day)
- **Three endings** — extinction, fracture, or ascension, depending on how you play
- **Colony awareness arc** — creatures evolve through three stages of sentience, eventually noticing the player, then addressing them directly by name
- **Cloud save** — your colony persists across devices via Supabase; IndexedDB provides a local fallback

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 6 + TypeScript 5 |
| Styling | Styled Components v6 |
| State | Zustand v5 |
| Persistence | IndexedDB (local) + Supabase JSONB (cloud) |
| Auth | Supabase email + password |
| Audio | Web Audio API (no library) |
| Rendering | HTML Canvas 2D (isometric) |
| Font | JetBrains Mono (Google Fonts) |
| Deploy | Vercel |

---

## Local setup

### 1. Prerequisites

- Node.js 18+
- A Supabase account (free tier is fine)
- A Vercel account (for deployment)

### 2. Clone and install

```bash
git clone <your-repo>
cd laiet
npm install
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** → **New Query**
3. Paste the contents of `supabase_schema.sql` and run it — this creates the `colonies` and `fossil_records` tables, RLS policies, and the `reset_user_data()` server function
4. Go to **Project Settings** → **API**
5. Copy your **Project URL** and **anon public** key

### 4. Environment variables

```bash
copy .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

The anon key is safe to commit — Supabase RLS enforces all access control server-side.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

### Option A — CLI

```bash
npm install -g vercel
vercel
```

When prompted, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Option B — Dashboard

1. Push to GitHub
2. Vercel → **New Project** → import repo → Framework preset: **Vite**
3. Add env vars under **Settings → Environment Variables**
4. Deploy

`vercel.json` handles SPA routing automatically.

---

## Project structure

```
src/
├── types/
│   └── index.ts              ← all TypeScript types; read this first
├── engine/
│   ├── constants.ts          ← every tuning value — single source of truth
│   ├── genetics.ts           ← trait pools, inheritance, mutation, morphology, naming, color
│   ├── messages.ts           ← colony message pools for all 3 awareness stages
│   ├── profile.ts            ← CaretakerProfile → SimModifiers; DEFAULT_MODIFIERS
│   └── tick.ts               ← main simulation loop (tickSimulation)
├── world/
│   └── worldGen.ts           ← procedural 120×120 world, seeded RNG, biome/terrain placement
├── creatures/
│   ├── factory.ts            ← spawn, createOffspring, createAsexualOffspring, colony/awareness stage
│   └── behavior.ts           ← needs decay, AI state machine, movement, reproduction gating
├── ui/
│   ├── renderer/             ← isometric canvas drawing, split into focused modules
│   │   ├── index.ts
│   │   ├── tiles.ts
│   │   ├── creatures.ts
│   │   ├── overlays.ts
│   │   └── utils.ts
│   ├── components/
│   │   ├── App.tsx           ← auth gating, session check, world routing
│   │   ├── AuthScreen.tsx    ← login / signup
│   │   ├── ProfileScreen.tsx ← 5-question MCQ before world creation; produces CaretakerProfile
│   │   ├── NewWorldScreen.tsx← name your first 4 creatures
│   │   ├── GameLayout.tsx    ← 3-column layout, toast notifications, restart confirm
│   │   ├── GameCanvas.tsx    ← responsive canvas, camera pan/zoom/rotate
│   │   ├── EventPopup.tsx    ← floating event cards
│   │   └── Toolbar.tsx       ← tool buttons, clock, charge badges, save/reset
│   └── panels/
│       ├── ColonyStatsPanel.tsx  ← population, body-type breakdown, weather, stage, caretaker
│       ├── DossierPanel.tsx      ← creature inspector, morphology bars, monologue, heal button
│       └── MessageLogPanel.tsx   ← scrollable transmission log, unread badge
├── audio/
│   └── chiptune.ts           ← Web Audio engine; 5 seasonal sequences + SFX
├── db/
│   ├── supabase.ts           ← Supabase client init
│   └── persistence.ts        ← IndexedDB + cloud save/load, exponential-backoff retry, full reset
└── store/
    └── gameStore.ts          ← Zustand store; all caretaker actions, tick management
```

---

## Gameplay

### Before the world

A five-question profile screen shapes how your simulation behaves for the entire playthrough:

| Question | Effect |
|---|---|
| Presence | interventionist → +1 heal charge, faster food drops; silent → no change (narrative) |
| World | fertile → 1.45× food regrowth, shorter droughts; scarce → 0.60× regrowth, longer droughts |
| Evolution | fast → 22% mutation rate, 1.35× sentience growth; slow → 10% mutation rate |
| Focus | bonds → 1.40× bond speed; survival → harsher food/drought; awareness → faster stage transitions |
| Expectation | ascension → ascension threshold −10 population; extinction → harsher drought + thinner food |

These are applied once and stored in `GameState.modifiers`. Old saves without a profile use safe defaults.

### Controls

| Key | Action |
|---|---|
| `Space` | Pause / resume simulation |
| `1` | Select / inspect |
| `2` | Drop food (cooldown: 5s default, 3s for interventionist) |
| `3` | Plant tree |
| `4` | River redirect (once per season) |
| `5` | Thunder strike (2 charges/day, 12s cooldown) |
| `6` | Ignite fire (3 charges/day, 8s cooldown) |
| `Q` / `E` | Rotate world CCW / CW |
| `+` / `-` | Zoom in / out |
| `0` | Recenter camera |
| `Ctrl+S` | Manual save (with toast confirmation) |

Speed controls (1×, 2×, 4×) and a pause button are also available in the Toolbar. The simulation automatically pauses when you switch away from the tab and resumes when you return — unless you had manually paused it.

### Caretaker limits

| Tool | Default | Interventionist |
|---|---|---|
| Heal charges | 3/day | 4/day |
| Food drop cooldown | 5 seconds | 3 seconds |
| River redirect | 1/season | 1/season |
| Thunder charges | 2/day | 2/day |
| Fire charges | 3/day | 3/day |

You cannot command creatures — you can only place things.

### Genetics and morphology

Each creature carries 3 discrete gene slots plus accumulated morphological traits:

| Slot | Options |
|---|---|
| Personality | Curious · Timid · Aggressive · Lazy · Greedy · Nurturing |
| Body | Spore · Shell · Spike · Wisp |
| Mind | Feral · Aware · Dreaming · Sentinel |

Mutation chance per slot defaults to 15% per birth event (configurable via profile). Every lineage also accumulates `MorphologyTraits` — size scale, limb length, spinal length, eye size, and color drift — that drift slightly with each generation. After 5–10 generations, two lineages sharing a personality and body type will look visually distinct because their morphology took different evolutionary paths.

### Body types

| Body | Max age | Speed | Role |
|---|---|---|---|
| Spore | ~7.5 min | 1.2× | R-strategist; only body that divides asexually |
| Shell | ~25 min | 0.5× | K-strategist; long-lived colony backbone |
| Spike | ~12 min | 0.9× | Territorial defender; highest fight power |
| Wisp | ~10 min | 2.2× | Scout; empathic; drives awareness stage |

All four body types are always present from world creation.

### The awareness arc

| Stage | Trigger | Message tone |
|---|---|---|
| 1 | Default | Third-person observational |
| 2 | Generation ≥ 3 + a live Sentinel exists | Personal, eerie — *"the hand came again"* |
| 3 | Pop ≥ 50 (alive) + any Sentinel alive + any creature gen ≥ 4 | Direct address — *"la-iet. that is what you called us."* |

At stage 3, the colony occasionally asks questions. Using a tool within 30 seconds is interpreted as an answer.

### The three endings

- **Extinction** — all creatures die. The grid goes dark. A fossil record is written to Supabase.
- **Fracture** — two tribes war over the last river tile. Colony splits permanently. *(stub — not yet implemented)*
- **Ascension** — population ≥ 80 (or 70 with expectation=ascension), a Sentinel at generation ≥ 4 is alive. The grid inverts. The colony addresses you one final time.

---

## Save system

1. **Auto-save** every 30 seconds to Supabase (`colonies` table, JSONB blob)
2. **IndexedDB** local fallback written on every cloud save
3. **Manual save** via `Ctrl+S` or the SAVE button (shows a toast notification)
4. **Tab visibility** — the simulation automatically stops ticking when the tab is hidden and resumes when you return. This prevents creatures from dying during extended absence.
5. **Passive ticks** — on return, up to 2 real minutes of catch-up are applied before the live loop resumes (capped at 120 ticks to prevent mass extinction on re-open)
6. **Full reset** — the RESET button calls a server-side `reset_user_data()` Postgres function (SECURITY DEFINER) that hard-deletes all colonies and fossil records for the current user, then wipes IndexedDB. Auth session is preserved.

---

## Tuning

All simulation values live in `src/engine/constants.ts`:

| Constant | Default | Description |
|---|---|---|
| `REAL_MS_PER_GAME_DAY` | 60,000 ms | How fast time passes |
| `DAYS_PER_SEASON` | 30 | Game days per season |
| `MUTATION_CHANCE` | 0.15 | Default genetic drift rate per slot |
| `HEAL_CHARGES_PER_DAY` | 3 | Base daily heal uses |
| `TICK_INTERVAL_MS` | 1,000 ms | Simulation tick rate |
| `FOOD_DROP_COOLDOWN_MS` | 5,000 ms | Default food drop cooldown |
| `BOND_STRENGTH_PER_TICK` | 0.5 | How fast adjacent bonds grow |
| `REPRODUCE_BOND_MIN_STRENGTH` | 42 | Bond strength required for sexual reproduction |

Profile-driven multipliers override these at runtime via `SimModifiers`.

---

## Credits

Built by Sammakara Mak. Free forever.

> *"you cannot command them. you can only tend.*  
> *the colony will outlive your attention, remember your absence,*  
> *and eventually — decide what you are to them."*
