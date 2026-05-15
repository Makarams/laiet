# LA-IET.EXE

*la-iet — small animal / insect, in Khmer.*

A generational insect colony simulation that runs in your browser. You play as a caretaker: an unseen presence that can drop food, plant trees, heal creatures, and redirect rivers. You cannot command the colony. You can only tend.

The colony lives, breeds, fractures into tribes, and over many generations becomes aware that something is watching it. Eventually it speaks directly to you.

Inspired by Black Mirror S7E4 "Plaything" and Dwarf Fortress.

Free forever.

---

## What you do

You are not a god. You cannot command any creature. Every action is an environmental intervention — the creatures decide what to do with it.

| Tool | Key | Limit |
|---|---|---|
| Select | `1` | Unlimited |
| Drop food | `2` | 5-second cooldown |
| Plant tree | `3` | Unlimited |
| River redirect | `4` | Once per season |
| Thunder strike | `5` | 2 charges per real day, 12s cooldown |
| Ignite fire | `6` | 3 charges per real day, 8s cooldown |
| Heal | Dossier panel button | 3 charges per real day |

Your presence has weight. Creatures with higher sentience register when you act near them.

---

## What they do

Four body types start every world, each with a distinct ecological role:

| Body | Role | Notable |
|---|---|---|
| **Spore** | Rapid coloniser | Only body that can reproduce asexually; short-lived |
| **Shell** | Stability backbone | Longest lifespan; slow but resilient K-strategist |
| **Spike** | Territorial defender | Highest combat power; claims and defends tiles |
| **Wisp** | Scout and empath | Fastest mover; primary driver of awareness development |

Creatures bond with each other, form tribes, develop community roles (elder, shaman, healer, guardian, forager, scout, nurturer, recluse), and communicate using emoji. Their vocabulary grows across generations and diverges between isolated lineages.

---

## How the world works

- **Time**: 1 real minute = 1 game day. Four seasons of 30 days each. Spring, summer, autumn, winter.
- **Day/night cycle**: Dawn → Day → Dusk → Night each game day. Night dims most creatures; nocturnal types (Curious, Dreaming) stay active.
- **Weather**: Clear, rain, storm, drought, and snow. Each state affects food growth, thirst, and creature behaviour.
- **Seasons**: Winter triggers warmth decay, snowfall, river flooding, and sharply reduced reproduction. Spring drives bonding and breeding surges.
- **The world**: 240×240 isometric grid across five biomes — temperate, arid, lush, rocky, wetland — each with its own terrain, food availability, and thirst modifiers.
- **Genetics**: Three gene slots per creature (personality, body, mind) plus accumulated morphological traits that diverge per lineage. Mutation is rare and slow by default.
- **Time away**: The simulation runs while you're gone, up to 120 passive ticks (2 real minutes) to prevent mass extinction from unsupervised harsh weather.

---

## Enrichment items

Eight items you can place to support the colony:

| Item | Main benefit |
|---|---|
| Resting Spot | Stress relief, mild warmth |
| Scratching Post | Strong stress relief |
| Burrow | Stress relief, significant warmth |
| Warm Stone | Thermal comfort, mild stress relief |
| Mud Pool | Thirst relief, cooling |
| Worn Path | Stress outlet via movement |
| Play Stones | Social stress relief |
| Springy Moss | Strong stress relief, minor health regeneration |

Each item degrades after 40 uses and disappears. Creatures have trait-driven preferences — Lazy creatures prefer resting items, Curious prefer active ones, Recluse avoid shared items entirely.

---

## The awareness arc

As generations pass, creatures start to notice things they cannot explain. Their transmissions — visible in the message log — evolve across three stages:

| Stage | When | Tone |
|---|---|---|
| 1 | Always | Observational, third-person; *"the river is cold today"* |
| 2 | Generation 5+, at least one Sentinel alive | Personal, eerie; *"the hand came again"* |
| 3 | Population 80+, generation 6+, Sentinel alive | Direct address; *"we know you can read this"* |

The simulation has no ending. It runs continuously until extinction.

---

## The only ending

**Extinction** — when every creature dies. A fossil record is written to the database and persists across all future sessions. Your colony's history survives colony death.

---

## Before the world begins

A five-question profile screen shapes how the simulation behaves for the entire playthrough:

| Question | Options and effect |
|---|---|
| **Presence** | Interventionist: more heal charges, faster food drops. Observer: balanced. Silent: narrative difference only. |
| **World** | Fertile: food grows 45% faster, shorter droughts. Varied: balanced. Scarce: food grows 40% slower, longer droughts. |
| **Evolution** | Fast: 13% mutation rate, 35% faster sentience growth. Slow: 5% mutation rate, 30% slower sentience growth. |
| **Focus** | Bonds: bonding is 40% faster. Survival: harsher drought and food pressure. Awareness: sentience grows faster, messages arrive more often. |
| **Expectation** | Ascension: sentience accumulates 20% faster. Persistence: balanced. Extinction: harsher drought and thinner food. |

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

The anon key is safe to include here — Supabase Row Level Security enforces all access server-side.

**Run:**

```bash
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
npm run lint      # ESLint check
```

---

## Deploying to Vercel

**CLI:**

```bash
npm install -g vercel
vercel
# add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY when prompted
```

**Dashboard:**

1. Push to GitHub
2. Vercel → New Project → import repo → Framework preset: Vite
3. Settings → Environment Variables → add both env vars
4. Deploy

`vercel.json` handles SPA routing and sets immutable cache headers for hashed assets automatically.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Pause / resume |
| `1` | Select tool |
| `2` | Drop food |
| `3` | Plant tree |
| `4` | River redirect |
| `5` | Thunder strike |
| `6` | Ignite fire |
| `Q` / `E` | Rotate world CCW / CW |
| `+` / `-` | Zoom in / out |
| `0` | Recenter camera, reset zoom |
| `Ctrl+S` | Manual save |

Speed controls (1×, 2×, 4×) are in the toolbar.

---

## Database schema

Two tables, created by `supabase_schema.sql`:

```
colonies       — world_id (pk), user_id, state (jsonb), updated_at
fossil_records — id (pk), user_id, fossil (jsonb), created_at
```

Both have RLS enabled. Two server functions: `reset_user_data()` (authenticated, wipes your own data) and `admin_reset_all_app_data()` (service role only).

---

*Built by Sammakara Mak. Free forever.*

> *"you cannot command them. you can only tend.*
> *the colony will outlive your attention, remember your absence,*
> *and eventually — decide what you are to them."*
