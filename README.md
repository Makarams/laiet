# LA-IET.EXE — Generational Insect Colony Simulation

> *"la-iet" — small animal or insect, in Khmer*

A **generational insect colony simulation** that runs in your browser. Watch your colony live, breed, fracture, and eventually become aware that something is watching them. Cloud-saved. Time passes while you're away.

Built for people who like emergent complexity, slow observation, and the feeling of being responsible for something you cannot control.

Inspired by Black Mirror S7E4 "Plaything" (the Thronglets) and Dwarf Fortress.

---

## What it is

- **Isometric 240×240 world** — procedurally generated from a numeric seed; five biomes, rivers, mountains, caves, cliffs, food patches, trees, and dense understorey bush vegetation
- **Insect creatures** with inherited genetics across 3 gene slots (personality, body, mind) plus accumulated morphological traits that diverge per lineage over generations
- **Caretaker profile** — five questions answered before the world begins shape the entire simulation: food abundance, mutation rate, bond speed, awareness pacing, and ending tendencies
- **Four body types** with distinct ecological roles: Spore (r-strategist, divides asexually), Shell (K-strategist, long-lived), Spike (territorial fighter), Wisp (scout, empathic)
- **Day/night + 4 seasons + weather** — clear, rain, storm, drought. Real time drives the simulation (1 real minute = 1 game day)
- **Three endings** — extinction, fracture, or ascension, depending on how you play
- **Colony awareness arc** — creatures evolve through three stages of sentience, eventually noticing the player, then addressing them directly by name
- **Cloud save** — your colony persists across devices via Supabase; IndexedDB provides a local fallback
- **God-mode caretaker** — no caps on healing, tools, or interventions. The simulation balances itself naturally.

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
│   └── index.ts              <- all TypeScript types; read this first
├── engine/
│   ├── constants.ts          <- every tuning value — single source of truth
│   ├── genetics.ts           <- trait pools, inheritance, mutation, morphology, naming, color
│   ├── messages.ts           <- colony message pools for all 3 awareness stages
│   ├── profile.ts            <- CaretakerProfile -> SimModifiers; DEFAULT_MODIFIERS
│   └── tick.ts               <- main simulation loop (tickSimulation)
├── world/
│   └── worldGen.ts           <- procedural 240x240 world, seeded RNG, biome/terrain placement
├── creatures/
│   ├── factory.ts            <- spawn, createOffspring, createAsexualOffspring, colony/awareness stage
│   └── behavior.ts           <- needs decay, AI state machine, movement, reproduction gating
├── ui/
│   ├── renderer/             <- isometric canvas drawing, split into focused modules
│   │   ├── index.ts
│   │   ├── tiles.ts
│   │   ├── creatures.ts
│   │   ├── overlays.ts
│   │   └── utils.ts
│   ├── components/
│   │   ├── App.tsx           <- auth gating, session check, world routing
│   │   ├── AuthScreen.tsx    <- login / signup
│   │   ├── ProfileScreen.tsx <- 5-question MCQ before world creation; produces CaretakerProfile
│   │   ├── NewWorldScreen.tsx<- name your first 4 creatures
│   │   ├── GameLayout.tsx    <- 3-column layout, toast notifications, restart confirm
│   │   ├── GameCanvas.tsx    <- responsive canvas, camera pan/zoom/rotate
│   │   ├── EventPopup.tsx    <- floating event cards
│   │   └── Toolbar.tsx       <- tool buttons, enrichment dropdown, save/reset
│   └── panels/
│       ├── ColonyStatsPanel.tsx  <- population, body-type breakdown, weather, stage, caretaker
│       ├── DossierPanel.tsx      <- creature inspector, morphology bars, monologue, heal button
│       └── MessageLogPanel.tsx   <- scrollable transmission log, unread badge
├── audio/
│   └── chiptune.ts           <- Web Audio engine; 5 seasonal sequences + SFX
├── db/
│   ├── supabase.ts           <- Supabase client init
│   └── persistence.ts        <- IndexedDB + cloud save/load, exponential-backoff retry, full reset
└── store/
    └── gameStore.ts          <- Zustand store; all caretaker actions, tick management
```

---

## Gameplay

### Before the world

A five-question profile screen shapes how your simulation behaves for the entire playthrough:

| Question | Effect |
|---|---|
| Presence | interventionist -> faster food drops; silent -> no change (narrative) |
| World | fertile -> 1.45x food regrowth, shorter droughts; scarce -> 0.60x regrowth, longer droughts |
| Evolution | fast -> 22% mutation rate, 1.35x sentience growth; slow -> 10% mutation rate |
| Focus | bonds -> 1.40x bond speed; survival -> harsher food/drought; awareness -> faster stage transitions |
| Expectation | ascension -> ascension threshold -10 population; extinction -> harsher drought + thinner food |

### Controls

| Key | Action |
|---|---|
| `Space` | Pause / resume simulation |
| `1` | Select / inspect |
| `2` | Drop food |
| `3` | Plant tree |
| `4` | River redirect (unlimited) |
| `5` | Thunder strike (1.5s cooldown, no cap) |
| `6` | Ignite fire (1.5s cooldown, no cap) |
| `7` | Place enrichment item (select type from dropdown) |
| `Q` / `E` | Rotate world CCW / CW |
| `+` / `-` | Zoom in / out |
| `0` | Recenter camera |
| `Ctrl+S` | Manual save |

### God-mode caretaker

The caretaker has no hard limits:

- **Healing** — unlimited; any creature below 95% health can be healed from the Dossier
- **Food drops** — 0.5s anti-spam cooldown only
- **Thunder and fire** — 1.5s cooldown, no daily cap
- **River redirect** — unlimited; shape the hydrology freely
- **Enrichment** — place items anywhere; they degrade naturally after 40 uses

### Enrichment system

Eight natural-world items, each with a distinct ecological role and a behavioral trade-off:

| Item | Effect | Trade-off |
|---|---|---|
| Resting Spot | stress↓, warmth↑ | calm rest only |
| Scratching Post | stress↓↓ | physical release |
| Burrow | stress↓, warmth↑↑ | hidden shelter |
| Warm Stone | warmth↑↑↑, stress↓ | thermal basking |
| Mud Pool | thirst↓↓, stress↓ | cooling clay wallow |
| Worn Path | stress↓, exercise | hunger↑ (running burns energy) |
| Play Stones | stress↓↓, social bonus | hunger↑ slight |
| Springy Moss | stress↓↓↓, health↑ | hunger↑ (exertion) |

**Trait-driven use**: Lazy prefers Resting Spot and Warm Stone. Curious seeks Worn Path and Springy Moss. Nurturing gravitates to Play Stones with bonded partners nearby. Timid avoids exposed high-energy items. Aggressive displaces current users. Recluse skips enrichment when others are nearby.

**Degradation**: each item disappears after 40 uses; the renderer fades items as durability drops.

**Natural enrichment**: caves reduce stress passively; river/mud tiles calm creatures; bush concealment calms all creatures (especially Timid); tree canopy provides mild comfort; rocky biome boosts Sentinel sentience.

### Bush tiles

Low fruiting shrubs scatter across the world in humid biomes (lush 9%, wetland 7%, temperate 4.5%, rare in arid). Each bush:

- **Food source** — berries ripen each season (spring: fast, summer: moderate, autumn: slow, winter: none), max 35 food. Burned bushes turn barren.
- **Concealment** — Timid creatures actively seek bushes when stressed (1.8× stress reduction vs. baseline). Recluse also benefits.
- **Movement** — slight hindrance (0.80× speed vs. grass's 1.00×).
- **Ecology** — Spore body includes bushes in terrain affinity; Greedy and Lazy seek them as food targets.

### World depth

Tile side-skirt height scales with elevation (low tiles ~3px, high-elevation mountain peaks ~7px), giving the isometric view a natural 2.5D layering — valleys read as recessed, peaks as elevated.

### Genetics and morphology

Each creature carries 3 discrete gene slots plus accumulated morphological traits. Mutation chance defaults to 15% per slot per birth event. Newly born mutants display a pulsing spark ring and show a mutation notice in the Dossier for 15 game days.

### Body types

| Body | Max age | Speed | Role |
|---|---|---|---|
| Spore | ~7.5 min | 1.2x | R-strategist; only body that divides asexually |
| Shell | ~25 min | 0.5x | K-strategist; long-lived colony backbone |
| Spike | ~12 min | 0.9x | Territorial defender; highest fight power |
| Wisp | ~10 min | 2.2x | Scout; empathic; drives awareness stage |

### The awareness arc

| Stage | Trigger | Message tone |
|---|---|---|
| 1 | Default | Third-person observational |
| 2 | Generation 3+ and a live Sentinel exists | Personal, eerie |
| 3 | Pop 50+ alive, any Sentinel alive, any creature gen 4+ | Direct address |

### The three endings

- **Extinction** — all creatures die. Fossil record written to Supabase.
- **Fracture** — two tribes war over the last river tile. *(stub)*
- **Ascension** — population 80+ (or 70 with expectation=ascension), Sentinel at gen 4+ alive.

---

## Design philosophy

LA-IET follows the **Dwarf Fortress principle**: emergent complexity from simple rules. The player should never feel in control — only responsible.

- You **cannot command** creatures. You can only place things.
- The **awareness arc** must feel earned — stage 3 messages never appear before generation 4 and population 50.
- The colony can **survive without you** — time passes meaningfully during absence.
- **Neglect has consequences** — if you ignore the colony for hours in winter, creatures die.
- **Fossil records persist across extinctions** — your history survives colony death.

---

## Credits

Built by Sammakara Mak. Free forever.

> *"you cannot command them. you can only tend.*
> *the colony will outlive your attention, remember your absence,*
> *and eventually — decide what you are to them."*

---

## Keywords

`colony simulation` · `insect simulation` · `browser game` · `emergent behavior` · `generational simulation` · `life simulation` · `evolution` · `artificial life` · `Dwarf Fortress inspired` · `idle simulation` · `React` · `TypeScript` · `Vite` · `Supabase`
