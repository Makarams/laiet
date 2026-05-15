# Simulation Mechanics — LA-IET.EXE

## Time

```
1 real minute  =  1 game day
1 tick         =  1000 ms real time, advances DAY_FRACTION_PER_TICK
```

Season order: spring → summer → autumn → winter (30 game days each).  
Passive ticks on return: capped at **120** (2 real minutes) to prevent mass extinction.

## Day/night phases

| Phase | Day fraction |
|---|---|
| dawn  | 0.00–0.12 |
| day   | 0.12–0.55 |
| dusk  | 0.55–0.68 |
| night | 0.68–1.00 |

## Weather

Five states: `clear | rain | storm | drought | snow`.  
Transitions are probabilistic; duration drawn from `WEATHER_DURATION` (min/max game days).

| State   | Key effects |
|---|---|
| rain    | Food +28% regrow, rivers fill, thirst −40% |
| storm   | Heavy rain + auto-lightning, same food bonus |
| drought | Food regrow 45%, rivers drain, thirst +40% |
| snow    | Snow accumulates; movement penalty; warmth drain |

## Snow system

- Accumulates tile-by-tile in `SNOW_BIOMES = ['temperate','rocky','lush']` during winter
- `SNOW_ACCUMULATE_RATE = 0.007` per tick; `SNOW_MELT_RATE = 0.003` in clear spring
- Movement: `1 − (1 − SNOW_MOVE_PENALTY) × snowDepth` (penalty = 0.55× at full depth)
- `SNOW_WARMTH_DRAIN = 0.06` extra warmth decay per tick; caves shelter from this

## Needs decay (per tick)

| Need    | Base decay | Modifiers |
|---|---|---|
| hunger  | 0.05 | — |
| thirst  | 0.07 | arid +55%, lush −20%, wetland −25%, rain −40%, drought +40% |
| warmth  | 0.015 base / 0.12 winter | cave +0.06 bonus; night adds extra pass equal to base; solar +0.010 daytime on temperate/arid |

Stress rises when `needSatisfaction < 30`.

## AI state machine (priority order)

```
dying → sick → seeking_healroot (sick + health<40 + healroot nearby)
→ fear/flee → critical hunger (seek_food → migrate → scavenge)
→ critical thirst → critical cold (seek cave > tree/shelter)
→ mind behaviors (Dreaming drifts; Sentinel edges perimeter)
→ personality behaviors (Curious wanders; Aggressive claims territory; Nurturing tends sick)
→ grooming → playing (needSatisfaction > 78 + bonded partner nearby)
→ using_enrichment → bond-seeking → social cohesion → default wander → bond formation
```

## Reproduction

**Sexual (all types):** age ≥ 30, health ≥ 55, hunger ≤ 55, bond strength ≥ 35, partner within 12 tiles.  
Season bonus: spring 1.3×, summer 1.0×, autumn 0.8×, winter 0.3×.

**Asexual (Spore only):** age ≥ 45, health ≥ 78, hunger ≤ 30, not winter. Rate: `ASEXUAL_BASE_CHANCE = 0.0008/tick`.

Population pressure above `DISEASE_POP_THRESHOLD = 50` scales both rates down to 0.20×.

## Tile passability & movement modifiers

| Tile | Move modifier |
|---|---|
| cliff, mountain, flooded, rock | 0 (impassable) |
| tree, shelter | 0.62× |
| mud, cave | 0.68×, 0.78× |
| death_site, bush, healroot | 0.88×, 0.80×, 0.90× |
| barren | 1.12× |

Puddle tiles: 0.75×. Snow adds further multiplier on top.

## Puddle system

- Accumulates on grass at `PUDDLE_ACCUMULATE_RATE = 0.008` during rain/storm
- Converts to mud at `PUDDLE_FORM_THRESHOLD = 0.65`
- Evaporates at `PUDDLE_EVAPORATE_RATE = 0.012`; flows downhill at `PUDDLE_FLOW_CHANCE = 0.008`
- Thirst relief: `PUDDLE_THIRST_RELIEF = 8.0` per tick

## Healroot

- Spawns near death sites: `HEALROOT_DEATH_SPAWN_CHANCE = 0.08`, radius 3
- Sick creatures (health < 40) seek healroot; consuming restores 22 health
- Creatures may carry healroot to deliver to sick tribemates (+15 health)
- Regrows at `HEALROOT_REGROW_RATE = 0.06/tick`; max potency 100

## Vegetation lifecycle

| Tree stage | Age threshold | Fruit |
|---|---|---|
| Sapling | 0–120 ticks | None |
| Mature  | 120–480      | Full |
| Declining | 480–840    | Reduced |
| Withered | 840–1200    | None |
| Decayed | 1200+        | Reverts to barren; 0.6%/tick regrow chance |

Bush caps: `VEG_TREE_CAP = 250`, `VEG_BUSH_CAP = 400`.

## Awareness stages

| Stage | Trigger |
|---|---|
| 1 | Default |
| 2 | Gen ≥ 5 + at least one **alive** Sentinel |
| 3 | Population ≥ 80 + gen ≥ 6 + any alive Sentinel |

`computeAwarenessStage` counts only alive creatures — dead Sentinels do not count.  
Message cooldown: `MIN_GAME_DAYS_BETWEEN_MESSAGES = 7 × mods.awarenessMessageMult`.

## Sentience growth (per tick)

| Mind     | Rate   |
|---|---|
| Feral    | 0.0004 |
| Aware    | 0.002  |
| Dreaming | 0.003  |
| Sentinel | 0.006  |

Caretaker within 6 tiles (last 30s): `+0.003/tick` nearby. Sentinel on rocky biome: `+0.005/tick`.

## Enrichment items

Eight types with `maxUses = 40`. Effects per session:

| Item | stress | warmth | health | hunger | thirst |
|---|---|---|---|---|---|
| resting_spot | −2.0 | +0.5 | +0.1 | — | — |
| scratching_post | −2.5 | — | — | — | — |
| burrow | −1.5 | +1.5 | +0.05 | — | — |
| warm_stone | −1.0 | +3.0 | +0.1 | — | — |
| mud_pool | −2.0 | +0.5 | — | — | −8.0 |
| worn_path | −1.8 | +0.5 | +0.15 | +1.5 | +0.5 |
| play_stones | −3.0 | — | — | +0.5 | — |
| springy_moss | −3.5 | — | — | +1.0 | +0.5 |

Cooldown: `ENRICHMENT_COOLDOWN_TICKS = 80` (gated by creature age, not stateTimer).

## Endings

- **Extinction** — all creatures dead; fossil record written to Supabase
- **Fracture** — stub; not implemented
- **Ascension** — no hard ending; stage 3 is a narrative milestone only
