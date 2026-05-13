// ─── Debug ───────────────────────────────────────────────────────────────────
export const DEBUG = false

// ─── Time ────────────────────────────────────────────────────────────────────
export const REAL_MS_PER_GAME_DAY = 60_000        // 1 real minute = 1 game day
export const TICK_INTERVAL_MS = 1_000             // simulation ticks every 1s
export const DAY_FRACTION_PER_TICK = TICK_INTERVAL_MS / REAL_MS_PER_GAME_DAY

export const DAYS_PER_SEASON = 30                 // 30 game days per season
export const SEASONS_PER_YEAR = 4

// Phase boundaries within one game day (fraction 0..1).
// Kept here for reference; actual gating logic lives in tickTime() in tick.ts.
export const DAY_PHASE_THRESHOLDS = {
  dawn:  0,
  day:   0.12,
  dusk:  0.55,
  night: 0.68,
}

// ─── World ────────────────────────────────────────────────────────────────────
export const WORLD_SIZE = 240                     // 240×240 for biome diversity, exploration, natural dispersion
export const MUTATION_CHANCE = 0.15               // 15% per gene slot
export const DEATH_SITE_DECAY_DAYS = 22           // death sites fade back to barren after this many game days

// ─── Creature stats ───────────────────────────────────────────────────────────
// Max age in ticks (1 tick = 1 second real time)
// Spore: ~7.5 min | Shell: ~25 min | Spike: ~12 min | Wisp: ~10 min
// Spore was 300 (5 min) — too short to establish a colony before dying.
// Shell raised to give K-strategist backbone more longevity.
export const MAX_AGE_BY_BODY = {
  Spore: 450,
  Shell: 1500,
  Spike: 700,
  Wisp:  600,
} as const

export const MOVE_SPEED_BY_BODY = {
  Spore: 1.2,
  Shell: 0.5,
  Spike: 0.9,
  Wisp:  2.2,   // was 2.0 — scouts move faster
} as const

export const FIGHT_POWER_BY_BODY = {
  Spore: 0.4,
  Shell: 0.6,
  Spike: 2.0,   // was 1.8 — Spike is the clear defender
  Wisp:  0.3,
} as const

// Reproduction: chance per tick when conditions are met.
// Spore raised to compensate for their shorter lifespan (r-strategist role).
// Wisp raised slightly — high-bonding creatures reproduce readily when bonded.
export const REPRODUCE_RATE_BY_BODY = {
  Spore: 0.010,  // was 0.008 — rapid colonizer; short life needs faster turnover
  Shell: 0.004,  // was 0.003 — K-strategist; slow but stable
  Spike: 0.004,  // unchanged
  Wisp:  0.006,  // was 0.004 — high social bonding drives reproduction
} as const

// Pre-seeded bond strength given to all starter creatures toward each other.
// Below REPRODUCE_BOND_MIN_STRENGTH so bond-seeking stays active from the start.
// Starters need ~20 more adjacency ticks to reach the reproduction threshold.
export const STARTER_BOND_STRENGTH = 25

// ─── Needs decay per tick ─────────────────────────────────────────────────────
// Lower rates → more survival time, creatures don't die in minutes
export const HUNGER_DECAY = 0.05                  // was 0.08
export const THIRST_DECAY = 0.07                  // was 0.12
export const WARMTH_DECAY_WINTER = 0.12
export const WARMTH_DECAY_BASE = 0.015
export const STRESS_DECAY_BASE = 0.03

// ─── Thresholds ───────────────────────────────────────────────────────────────
export const HUNGER_CRITICAL = 80
export const THIRST_CRITICAL = 80                 // was 85, align with hunger
export const WARMTH_CRITICAL = 20
export const HUNGER_SEEK_THRESHOLD = 35           // seek food early (was 52)
export const THIRST_SEEK_THRESHOLD = 35           // seek water early (was 55)
export const WARMTH_SEEK_THRESHOLD = 30
export const STRESS_CRITICAL = 90
export const HEALTH_DEATH_THRESHOLD = 0
export const BOND_FORM_PROXIMITY_TICKS = 60
export const BOND_STRENGTH_PER_TICK = 0.5
export const TRIBE_FORM_MIN_BONDS = 4
export const CREATURE_MATURITY_TICKS = 30         // must be this old to reproduce

// ─── Food & resources ─────────────────────────────────────────────────────────
export const FOOD_PER_PATCH = 100
export const FOOD_EAT_AMOUNT = 20                 // slightly less per eat
export const FOOD_REGROW_RATE_BASE = 0.8          // was 0.2 — faster regrowth
export const FOOD_REGROW_MULTIPLIER: Record<string, number> = {
  spring: 1.6,
  summer: 1.2,
  autumn: 0.5,
  winter: 0.05,
}
export const TREE_GROW_DAYS = 2 * 60
export const WATER_REPLENISH_RATE = 0.5           // river refills faster

// ─── Caretaker ───────────────────────────────────────────────────────────────
export const HEAL_CHARGES_PER_DAY = 3            // resets each real day
export const HEAL_AMOUNT = 40
export const FOOD_DROP_COOLDOWN_MS = 5_000        // 5s between food drops

// ─── Environmental tools ──────────────────────────────────────────────────────
export const THUNDER_COOLDOWN_MS    = 12_000      // 12s between strikes
export const THUNDER_CHARGES_PER_DAY = 2          // 2 strikes per real day
export const THUNDER_DAMAGE_RADIUS   = 1          // tiles around the strike
export const THUNDER_LETHAL_HEALTH   = 100        // kills outright in radius

export const FIRE_COOLDOWN_MS      = 8_000        // 8s between ignitions
export const FIRE_CHARGES_PER_DAY  = 3            // 3 ignitions per real day
export const FIRE_DURATION_TICKS   = 14           // a burning tile burns this long
export const FIRE_SPREAD_CHANCE    = 0.10         // per adjacent tree per tick
export const FIRE_TICK_DAMAGE      = 12           // health damage per tick standing on fire

// ─── Survival / population pressure ───────────────────────────────────────────
export const CANNIBAL_HUNGER_THRESHOLD = 78       // must be desperately hungry
export const CANNIBAL_HUNGER_RELIEF    = 38       // hunger drop from consuming a corpse
export const CANNIBAL_STRESS_PENALTY   = 25       // long-term cost to the cannibal
export const CANNIBAL_WITNESS_STRESS   = 10       // stress added to nearby observers

export const DISEASE_POP_THRESHOLD     = 25       // overcrowding kicks in
export const DISEASE_CONTACT_CHANCE    = 0.0018   // per tick when crowded
export const DISEASE_HEALTH_DRAIN      = 0.3      // extra health loss per tick when sick

export const ASEXUAL_HEALTH_MIN        = 78       // must be very healthy to divide
export const ASEXUAL_HUNGER_MAX        = 30       // and well-fed
export const ASEXUAL_BASE_CHANCE       = 0.0008   // rare — Spore body only
export const ASEXUAL_MUTATION_CHANCE   = 0.28     // higher than sexual (single-parent)

// Minimum bond strength for sexual reproduction partnership
export const REPRODUCE_BOND_MIN_STRENGTH = 35    // achievable in ~20 adjacency ticks from starter bond

// ─── Colony stage thresholds ─────────────────────────────────────────────────
export const COLONY_STAGE_THRESHOLDS = {
  genesis:    0,
  nascent:    6,
  growing:    16,
  established: 31,
  thriving:   51,
  ascendant:  80,
} as const

// ─── Awareness ────────────────────────────────────────────────────────────────
export const AWARENESS_STAGE_2_GENERATION = 3
export const AWARENESS_STAGE_3_POPULATION = 50
export const ASCENSION_POPULATION = 80
export const ASCENSION_SENTINEL_GENERATIONS = 4
export const ASCENSION_NO_NEGLECT_DEATHS = true

// ─── Sentience growth ────────────────────────────────────────────────────────
export const SENTIENCE_GROWTH_BY_MIND: Record<string, number> = {
  Feral:    0.001,
  Aware:    0.005,
  Dreaming: 0.008,
  Sentinel: 0.015,
}

// ─── Season modifiers ────────────────────────────────────────────────────────
export const SEASON_MODIFIERS = {
  spring: { flood: false, foodMod: 1.5, warmthBase: 60, breedBonus: 1.3 },
  summer: { flood: false, foodMod: 1.2, warmthBase: 80, breedBonus: 1.0 },
  autumn: { flood: false, foodMod: 0.6, warmthBase: 50, breedBonus: 0.8 },
  winter: { flood: true,  foodMod: 0.1, warmthBase: 20, breedBonus: 0.3 },
} as const

// ─── Lightning visual ────────────────────────────────────────────────────────
export const LIGHTNING_VISUAL_DURATION_MS = 900   // how long bolt/flash renders
export const AUTO_LIGHTNING_CHANCE = 0.0005       // per tick during winter storms
export const AUTO_LIGHTNING_DAMAGE = 50           // health damage for auto-strikes

// ─── Caves ───────────────────────────────────────────────────────────────────
export const CAVE_WARMTH_BONUS = 0.06             // warmth restored per tick inside a cave

// ─── Weather ─────────────────────────────────────────────────────────────────
// Durations: [min, max] game days in each state
export const WEATHER_DURATION: Record<string, [number, number]> = {
  clear:   [18, 38],
  rain:    [ 5, 14],
  storm:   [ 2,  7],
  drought: [12, 26],
}

export const RAIN_WATER_BONUS       = 0.22   // water level gain per tick in river tiles
export const RAIN_THIRST_REDUCTION  = 0.40   // fraction of THIRST_DECAY removed by rain
export const RAIN_FOOD_BONUS        = 1.28   // food regrowth multiplier under rain

export const STORM_LIGHTNING_CHANCE = 0.0022 // 4× AUTO_LIGHTNING_CHANCE in storms

export const DROUGHT_WATER_DRAIN    = 0.10   // water level loss per tick in river tiles
export const DROUGHT_THIRST_PENALTY = 0.40   // fraction of THIRST_DECAY added by drought
export const DROUGHT_FOOD_FACTOR    = 0.45   // food regrowth multiplier in drought

// ─── Biome thirst modifiers (applied as extra fraction of THIRST_DECAY) ──────
export const BIOME_THIRST_EXTRA: Record<string, number> = {
  temperate: 0.0,
  arid:      0.55,   // +55% thirst decay — dry air
  lush:     -0.20,   // −20% — humid canopy
  rocky:     0.12,
  wetland:  -0.25,   // −25% — near water
}

// ─── Tile movement modifiers (multiplier on base moveChance) ─────────────────
export const TILE_MOVE_MODIFIER: Record<string, number> = {
  grass:      1.00,
  food_patch: 1.00,
  tree:       0.62,  // forest floor slows movement
  shelter:    0.62,
  mud:        0.68,  // sticky wetland
  barren:     1.12,  // open dry ground is fast
  river:      1.00,  // creatures drink adjacent, not walk through
  cave:       0.78,  // tight passage
  death_site: 0.88,  // creatures hesitate
  flooded:    0.00,  // impassable
  rock:       0.00,
  mountain:   0.00,
  cliff:      0.00,
  bush:       0.80,  // low shrub slows movement slightly
}

// ─── Night warmth penalty ────────────────────────────────────────────────────
// Night doubles effective warmth decay: tickNeeds applies base/winter drain,
// then tickCreatures applies this extra on top of it during night phase.
export const NIGHT_WARMTH_EXTRA = true  // sentinel — actual extra = same as base/winter decay

// ─── Social behavior ─────────────────────────────────────────────────────────
// Cohesion radius reduced from 18 — only Nurturing/Timid cluster; others explore freely.
export const SOCIAL_COHESION_RADIUS = 10

// ─── Recluse trait ───────────────────────────────────────────────────────────
export const RECLUSE_CROWD_RADIUS = 8      // tiles within which others count as crowd
export const RECLUSE_CROWD_THRESHOLD = 3   // more than this many nearby = overcrowded

// ─── Caretaker presence ──────────────────────────────────────────────────────
export const CARETAKER_PRESENCE_RADIUS = 6   // tiles around last action for awareness boost
export const CARETAKER_PRESENCE_WINDOW_MS = 30_000  // 30 real seconds
export const CARETAKER_SENTIENCE_BOOST = 0.006  // per tick while in presence radius

// ─── Bone memory ─────────────────────────────────────────────────────────────
export const BONE_MEMORY_CHANCE = 0.30  // chance a birth near a death_site triggers a memory message
export const BONE_MEMORY_RADIUS = 4     // tiles from birth to death_site to trigger

// ─── Tool-as-answer ──────────────────────────────────────────────────────────
export const QUESTION_RESPONSE_WINDOW_MS = 30_000  // 30 real seconds to respond to a question

// ─── Message cooldowns ────────────────────────────────────────────────────────
export const MIN_GAME_DAYS_BETWEEN_MESSAGES = 3
export const MESSAGE_POOL_SIZE = 60

// ─── Mutation display ─────────────────────────────────────────────────────────
// How long (game days) a mutation indicator appears on a newly born creature
export const MUTATION_DISPLAY_DAYS = 15

// ─── Tree food generation ─────────────────────────────────────────────────────
// Mature trees drop fruit onto adjacent passable tiles
export const TREE_FOOD_RADIUS = 2              // tile radius for fruit drops
export const TREE_FOOD_DROP_CHANCE = 0.006     // per mature tree per tick
export const TREE_FOOD_MATURE_AGE = 120        // min treeAge for fruit drops
export const TREE_APPLE_MAX_PER_TILE = 80      // max foodAmount from tree drops

// ─── Play behavior ────────────────────────────────────────────────────────────
export const PLAY_TRIGGER_SATISFACTION = 78    // min needSatisfaction to play
export const PLAY_PARTNER_RADIUS = 4           // tiles to find play partner
export const PLAY_DURATION_TICKS = 25          // ticks in playing state
export const PLAY_STRESS_REDUCTION = 0.8       // stress drop per tick while playing

// ─── Enrichment system ───────────────────────────────────────────────────────
export const ENRICHMENT_USE_RADIUS = 1         // tiles to trigger use
export const ENRICHMENT_MAX_PER_TILE = 1       // one item per tile
export const ENRICHMENT_COOLDOWN_TICKS = 80    // sim ticks before creature can use enrichment again
export const ENRICHMENT_MAX_USES = 40          // item degrades and disappears after this many uses

// Effects per enrichment type — stat delta per tick while in use.
export const ENRICHMENT_EFFECTS: Record<string, {
  stress: number; hunger: number; thirst: number; warmth: number; health: number
}> = {
  resting_spot:    { stress: -2.0, hunger:  0.0, thirst:  0.0, warmth:  0.5, health:  0.1 },
  scratching_post: { stress: -2.5, hunger:  0.0, thirst:  0.0, warmth:  0.0, health:  0.0 },
  burrow:          { stress: -1.5, hunger:  0.0, thirst:  0.0, warmth:  1.5, health:  0.05 },
  warm_stone:      { stress: -1.0, hunger:  0.0, thirst:  0.0, warmth:  3.0, health:  0.1 },
  mud_pool:        { stress: -2.0, hunger:  0.0, thirst: -8.0, warmth:  0.5, health:  0.0 },
  worn_path:       { stress: -1.8, hunger:  1.5, thirst:  0.5, warmth:  0.5, health:  0.15 },
  play_stones:     { stress: -3.0, hunger:  0.5, thirst:  0.0, warmth:  0.0, health:  0.0 },
  springy_moss:    { stress: -3.5, hunger:  1.0, thirst:  0.5, warmth:  0.0, health:  0.0 },
}

// ─── Natural enrichment — passive bonuses from world terrain ─────────────────
// Applied in tickCreatures for creatures standing on or adjacent to these tiles.
export const NATURAL_CAVE_STRESS_REDUCTION   = 1.5   // per tick on cave tile
export const NATURAL_RIVER_STRESS_REDUCTION  = 0.5   // per tick on river/mud tile
export const NATURAL_TREE_STRESS_REDUCTION   = 0.25  // per tick on tree/shelter tile
export const NATURAL_ROCKY_SENTINEL_BONUS    = 0.012 // sentience per tick (Sentinel on rocky biome)
export const NATURAL_BUSH_STRESS_REDUCTION   = 0.18  // per tick on bush tile (concealment calms Timid)

// ─── Bush tiles ───────────────────────────────────────────────────────────────
export const BUSH_FOOD_MAX         = 35   // max berry amount per bush tile
export const BUSH_FOOD_REGROW_RATE = 0.12 // berries regrow slowly without needing a tree

// ─── Cave visual depth ────────────────────────────────────────────────────────
export const CAVE_CREATURE_ALPHA = 0.50        // creatures inside caves render dimmer

// ─── Rendering ───────────────────────────────────────────────────────────────
// 120×120 world — responsive canvas fills viewport; camera pan+zoom to navigate
export const ISO_TILE_WIDTH = 18
export const ISO_TILE_HEIGHT = 9
export const CANVAS_PADDING_X = 50
export const CANVAS_PADDING_Y = 55
