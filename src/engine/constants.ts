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
export const MUTATION_CHANCE = 0.12               // 12% per gene slot; enables visible trait variety by gen 5-7
export const DEATH_SITE_DECAY_DAYS = 10           // ~2 Spore generations; death sites clear quickly so the map stays readable

// ─── Creature stats ───────────────────────────────────────────────────────────
// Max age in ticks (1 tick = 1 second real time)
// Spore: ~7.5 min | Shell: ~25 min | Spike: ~12 min | Wisp: ~10 min
// Spore was 300 (5 min); too short to establish a colony before dying.
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
  Wisp:  2.2,   // was 2.0; scouts move faster
} as const

export const FIGHT_POWER_BY_BODY = {
  Spore: 0.4,
  Shell: 0.6,
  Spike: 2.0,   // was 1.8; Spike is the clear defender
  Wisp:  0.3,
} as const

// Reproduction: chance per tick when conditions are met.
// Spore raised to compensate for their shorter lifespan (r-strategist role).
// Wisp raised slightly; high-bonding creatures reproduce readily when bonded.
export const REPRODUCE_RATE_BY_BODY = {
  Spore: 0.010,  // was 0.008; rapid colonizer; short life needs faster turnover
  Shell: 0.004,  // was 0.003; K-strategist; slow but stable
  Spike: 0.004,  // unchanged
  Wisp:  0.006,  // was 0.004; high social bonding drives reproduction
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
export const FOOD_REGROW_RATE_BASE = 0.25         // was 0.8; reduced so patches deplete under pressure
export const FOOD_REGROW_MULTIPLIER: Record<string, number> = {
  spring: 1.6,
  summer: 1.2,
  autumn: 0.5,
  winter: 0.05,
}
export const TREE_GROW_DAYS = 2 * 60
export const WATER_REPLENISH_RATE = 0.06          // slow passive refill; drought now net-negative
export const WATER_DRINK_DRAIN = 4               // waterLevel lost per drink event

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
export const CANNIBAL_WITNESS_STRESS   = 10       // stress added to nearby observers on the tick of witnessing
export const CANNIBAL_TRAUMA_DURATION_DAYS  = 4   // game-days the elevated stress persists in witnesses
export const CANNIBAL_TRAUMA_STRESS_PER_TICK = 0.25 // stress added per tick during trauma window

export const HUDDLE_WARMTH_BONUS = 0.03 // warmth per adjacent bonded creature in winter (max 3)
export const WEATHER_BREED_MULT: Record<string, number> = {
  clear: 1.00, rain: 1.10, storm: 0.90, drought: 0.65,
  snow: 0.40, heatwave: 0.50, fog: 1.05,
}

export const DISEASE_RECOVERY_HEALTH   = 40       // health level at which sick state auto-clears
export const DISEASE_POP_THRESHOLD     = 50       // overcrowding kicks in (calibrated for 240×240)
export const DISEASE_POP_SLOPE_RANGE   = 95       // denominator for popFactor slope; minimum (0.20) reached at threshold + this value
export const DISEASE_CONTACT_CHANCE    = 0.0018   // per tick when crowded
export const DISEASE_HEALTH_DRAIN      = 0.3      // extra health loss per tick when sick

export const ASEXUAL_HEALTH_MIN        = 78       // must be very healthy to divide
export const ASEXUAL_HUNGER_MAX        = 30       // and well-fed
export const ASEXUAL_BASE_CHANCE       = 0.0018   // 2.25× boost; rare but more visible evolution
export const ASEXUAL_MUTATION_CHANCE   = 0.20     // higher than sexual (single-parent)

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

// ─── Cohort phases ────────────────────────────────────────────────────────────
// Derived from totalGenerations (max generation ever born in the colony).
// Cohort phase is a permanent ratchet — it never decreases.
// Phases gate the upper signal-depth levels: depth 4 requires phase 4, etc.
export const COHORT_PHASE_THRESHOLDS: Record<number, number> = {
  1: 0,   // Primal   — gen 0-4
  2: 5,   // Clan     — gen 5-14
  3: 15,  // Lineage  — gen 15-29
  4: 30,  // Ancestral— gen 30-59
  5: 60,  // Eternal  — gen 60+
}

// ─── Awareness — emergent stage conditions ────────────────────────────────────
// Stage 1→2: behavioral specialization via role diversity.
// At least this many distinct community roles must be simultaneously held by
// alive creatures, sustained for the window duration before the stage advances.
export const AWARENESS_STAGE_2_ROLES_REQUIRED = 4
export const AWARENESS_STAGE_2_WINDOW_DAYS    = 7   // in-game days conditions must hold

// Stage 2→3: cultural depth via colony vocabulary.
// The union of all alive creatures' known emoji must reach this size,
// sustained for the window duration. Represents a mature shared language.
export const AWARENESS_STAGE_3_LEXICON_MIN    = 30
export const AWARENESS_STAGE_3_WINDOW_DAYS    = 7

// Stage 3→4: ancestral memory — cohort phase 4 (gen ≥ 30) and at least one
// creature whose sentience has reached deep awakening, sustained for the window.
export const AWARENESS_STAGE_4_SENTIENCE_MIN  = 80   // at least one alive creature must reach this
export const AWARENESS_STAGE_4_WINDOW_DAYS    = 14   // longer window; generational depth is hard-won

// Stage 4→5: transcendence — cohort phase 5 (gen ≥ 60) and at least one Sentinel
// Elder whose sentience is fully realised, or a Dreaming Elder at ≥ 95, sustained
// for the window. Sentinel path lowered to 88 to be reachable; Dreaming path
// remains at 95 as a harder alternate when no Sentinel Elders are present.
export const AWARENESS_STAGE_5_SENTIENCE_MIN  = 88   // Sentinel Elder threshold (was 95)
export const AWARENESS_STAGE_5_DREAMING_MIN   = 95   // Dreaming Elder alternate path
export const AWARENESS_STAGE_5_WINDOW_DAYS    = 21

// ─── Sentience growth ────────────────────────────────────────────────────────
export const SENTIENCE_GROWTH_BY_MIND: Record<string, number> = {
  Feral:    0.0004,
  Aware:    0.002,
  Dreaming: 0.003,
  Sentinel: 0.006,
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
  clear:    [18, 38],
  rain:     [ 5, 14],
  storm:    [ 2,  7],
  drought:  [12, 26],
  snow:     [ 4, 12],
  heatwave: [ 6, 18],
  fog:      [ 2,  7],
}

export const RAIN_WATER_BONUS       = 0.22   // water level gain per tick in river tiles
export const RAIN_THIRST_REDUCTION  = 0.40   // fraction of THIRST_DECAY removed by rain
export const RAIN_FOOD_BONUS        = 1.28   // food regrowth multiplier under rain

export const STORM_LIGHTNING_CHANCE = 0.0022 // 4× AUTO_LIGHTNING_CHANCE in storms

export const DROUGHT_WATER_DRAIN    = 0.10   // water level loss per tick in river tiles
export const DROUGHT_THIRST_PENALTY = 0.40   // fraction of THIRST_DECAY added by drought
export const DROUGHT_FOOD_FACTOR    = 0.45   // food regrowth multiplier in drought

// ─── Heatwave ────────────────────────────────────────────────────────────────
// Summer-only extreme heat. Compounds drought; drives thirst/stress into crisis.
export const HEATWAVE_THIRST_MULT       = 2.2   // thirst decays this many times faster
export const HEATWAVE_STRESS_PER_TICK   = 0.06  // passive stress per tick even when satisfied
export const HEATWAVE_FOOD_EXTRA_DECAY  = 0.12  // extra food wilt per tick on all food_patches (heat)
export const HEATWAVE_FIRE_CHANCE       = 0.00008 // per tree/shelter/bush tile per tick during summer heatwave

// ─── Fog ─────────────────────────────────────────────────────────────────────
// Spring/autumn moisture haze. Mild; calming; slight thirst and stress relief.
export const FOG_THIRST_REDUCTION       = 0.25  // fraction of THIRST_DECAY removed by fog moisture
export const FOG_STRESS_RELIEF          = 0.04  // passive stress removed per tick in fog

// ─── Seasonal food sources ────────────────────────────────────────────────────
// Each season generates a distinct food resource beyond the base tree/bush system.

// Spring bloom: ephemeral wildflower patches on grass tiles during rain or clear spring
export const SPRING_BLOOM_CHANCE        = 0.00012  // was 0.00025; FRUIT_MAX_AGE limits steady-state
export const SPRING_BLOOM_RAIN_MULT     = 2.0      // multiplied during rain/fog
export const SPRING_BLOOM_FOOD          = 35       // initial food amount on new bloom patch
export const SPRING_BLOOM_BIOME_BIAS: Record<string, number> = {
  lush: 3.0, wetland: 2.0, temperate: 1.0, rocky: 0.2, arid: 0.05,
}

// Summer riparian: lush food_patches appear on grass adjacent to rivers in summer
export const SUMMER_RIPARIAN_CHANCE     = 0.00009  // was 0.00020
export const SUMMER_RIPARIAN_FOOD       = 28       // initial food amount

// Autumn windfall: maturing/peak trees drop large fruit bursts before winter
export const AUTUMN_WINDFALL_CHANCE     = 0.00035  // was 0.0008
export const AUTUMN_WINDFALL_FOOD       = 55       // large harvest drop amount
// Autumn mushroom: withering trees seed fungal patches in their shade
export const AUTUMN_MUSHROOM_CHANCE     = 0.00010  // was 0.00025
export const AUTUMN_MUSHROOM_FOOD       = 38       // mushroom-like patch food amount

// Winter lichen: sparse crust on rocky/barren tiles near caves; reliable but meagre
export const WINTER_LICHEN_CHANCE       = 0.00009  // was 0.00022
export const WINTER_LICHEN_FOOD         = 22       // sparse but sustaining
export const WINTER_LICHEN_CAVE_RADIUS  = 5        // must be within this many tiles of a cave

// ─── Environmental adaptations ────────────────────────────────────────────────
// Traits heritable from parents (ADAPTATION_INHERIT_CHANCE each) and acquirable
// at birth from the spawn environment. Capped at ADAPTATION_MAX per creature.
export const ADAPTATION_INHERIT_CHANCE     = 0.65   // probability per parent trait inherited
export const ADAPTATION_MAX                = 3      // max concurrent adaptations

export const COLD_HARDY_WARMTH_MULT        = 0.65   // warmth decay multiplier (cold_hardy)
export const DROUGHT_TOUGH_HUNGER_MULT     = 0.78   // hunger decay multiplier (drought_tough)
export const HYDRO_FINS_THIRST_MULT        = 0.55   // thirst decay mult on wetland/river (hydro_fins)
export const HEAT_PLATED_THIRST_BLOCK      = 0.50   // fraction of heatwave extra thirst blocked
export const STORM_STRESS_PER_TICK         = 0.08   // base stress from storm weather (storm_braced blocks this entirely)
export const THICK_PELT_WARMTH_MULT        = 0.60   // broad warmth-drain mult for thick_pelt in cold/wet weather (stacks with cold_hardy)
export const THICK_PELT_STORM_STRESS_MULT  = 0.50   // storm stress multiplier for thick_pelt lineages
export const BIOLUMINESCENT_STRESS_RADIUS  = 5      // tiles within which glow reduces nearby creature stress at night
export const BIOLUMINESCENT_STRESS_RELIEF  = 0.15   // stress reduced per tick for nearby creatures at night
export const SPORE_RESISTANT_DISEASE_MULT  = 0.40   // disease contact chance multiplier for spore_resistant
export const ROOT_EATER_HUNGER_MULT        = 0.75   // hunger decay multiplier on vegetation tiles (root_eater)
export const THERMAL_VENT_WARMTH_GAIN      = 0.8    // warmth gained per tick on arid/hot tiles (thermal_vent)
export const RIDGE_ARMOR_DAMAGE_MULT       = 0.70   // health loss from combat multiplier (ridge_armor)
export const EMBER_FIRE_STRESS_RELIEF      = 0.3    // stress reduced per tick near burning tiles (Ember race)
export const MIRE_DISEASE_RESIST           = 0.50   // disease contact multiplier for Mire race
export const VEIL_FOG_STRESS_RELIEF        = 0.4    // extra stress reduction in fog weather (Veil race)

// ─── Biome thirst modifiers (applied as extra fraction of THIRST_DECAY) ──────
export const BIOME_THIRST_EXTRA: Record<string, number> = {
  temperate: 0.0,
  arid:      0.55,   // +55% thirst decay; dry air
  lush:     -0.20,   // −20%; humid canopy
  rocky:     0.12,
  wetland:  -0.25,   // −25%; near water
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
  healroot:   0.90,  // low herb growth; slight tangle underfoot
  fence:      0.72,  // constructed barrier slows movement slightly
}

// ─── Night warmth penalty ────────────────────────────────────────────────────
// Night doubles effective warmth decay: tickNeeds applies base/winter drain,
// then tickCreatures applies this extra on top of it during night phase.
export const NIGHT_WARMTH_EXTRA = true  // sentinel; actual extra = same as base/winter decay

// ─── Social behavior ─────────────────────────────────────────────────────────
// Cohesion radius reduced from 18; only Nurturing/Timid cluster; others explore freely.
export const SOCIAL_COHESION_RADIUS = 10

// ─── Recluse trait ───────────────────────────────────────────────────────────
export const RECLUSE_CROWD_RADIUS = 8      // tiles within which others count as crowd
export const RECLUSE_CROWD_THRESHOLD = 3   // more than this many nearby = overcrowded

// ─── Caretaker presence ──────────────────────────────────────────────────────
export const CARETAKER_PRESENCE_RADIUS = 6   // tiles around last action for awareness boost
export const CARETAKER_PRESENCE_WINDOW_MS = 30_000  // 30 real seconds
export const CARETAKER_SENTIENCE_BOOST = 0.003  // per tick while in presence radius

// ─── Bone memory ─────────────────────────────────────────────────────────────
export const BONE_MEMORY_CHANCE = 0.30  // chance a birth near a death_site triggers a memory message
export const BONE_MEMORY_RADIUS = 4     // tiles from birth to death_site to trigger

// ─── Tool-as-answer ──────────────────────────────────────────────────────────
export const QUESTION_RESPONSE_WINDOW_MS = 30_000  // 30 real seconds to respond to a question

// ─── Message cooldowns ────────────────────────────────────────────────────────
export const MIN_GAME_DAYS_BETWEEN_MESSAGES = 7
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
export const ENRICHMENT_SEEK_RADIUS = 20       // tiles to scan for enrichment items during behavior
export const ENRICHMENT_MAX_PER_TILE = 1       // one item per tile
export const ENRICHMENT_COOLDOWN_TICKS = 80    // sim ticks before creature can use enrichment again
export const ENRICHMENT_MAX_USES = 40          // item degrades and disappears after this many uses
export const ENRICHMENT_IDLE_DECAY_DAYS = 20   // game days idle before player-placed item loses one use

// Effects per enrichment type; stat delta per tick while in use.
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

// ─── Natural enrichment item spawning ────────────────────────────────────────
// Items spawn in the world based on biome conditions and are refreshed nearby on depletion.
export const NATURAL_ENRICHMENT_SPAWN_CHANCE     = 0.003  // base chance per tile attempt per tick
export const NATURAL_ENRICHMENT_ATTEMPTS_PER_TICK = 3     // tile sample attempts per tickNaturalEnrichment call
export const NATURAL_ENRICHMENT_MAX_USES         = 80     // natural items are more durable than player-placed
export const NATURAL_ENRICHMENT_REGEN_RADIUS     = 12     // tile radius for respawn after depletion
export const NATURAL_ENRICHMENT_CAP_BASE         = 8      // minimum natural item slots in the world
export const NATURAL_ENRICHMENT_CAP_PER_N_ALIVE  = 5     // alive creatures per extra slot (+1 per 5)
export const NATURAL_ENRICHMENT_CAP_MAX          = 20    // absolute ceiling

// Which enrichment types can appear naturally in each biome
export const NATURAL_ENRICHMENT_BIOME_TYPES: Record<string, string[]> = {
  rocky:     ['warm_stone', 'burrow', 'play_stones'],
  temperate: ['resting_spot', 'burrow', 'warm_stone', 'worn_path', 'scratching_post'],
  lush:      ['springy_moss', 'resting_spot', 'scratching_post'],
  wetland:   ['mud_pool', 'springy_moss', 'resting_spot'],
  arid:      ['resting_spot', 'play_stones', 'worn_path', 'burrow'],
}

// Season spawn chance multiplier per enrichment type
export const NATURAL_ENRICHMENT_SEASON_MOD: Record<string, Record<string, number>> = {
  warm_stone:      { winter: 5.0, autumn: 2.0, spring: 0.5, summer: 0.2 },
  burrow:          { winter: 3.0, autumn: 1.5, spring: 1.0, summer: 0.8 },
  springy_moss:    { winter: 0.2, autumn: 0.5, spring: 2.5, summer: 2.0 },
  mud_pool:        { winter: 0.1, autumn: 0.4, spring: 2.0, summer: 2.5 },
  resting_spot:    { winter: 1.0, autumn: 1.2, spring: 1.5, summer: 1.2 },
  scratching_post: { winter: 0.8, autumn: 1.0, spring: 1.2, summer: 1.0 },
  worn_path:       { winter: 0.7, autumn: 0.9, spring: 1.2, summer: 1.1 },
  play_stones:     { winter: 0.6, autumn: 0.9, spring: 1.3, summer: 1.3 },
}

// ─── Natural enrichment; passive bonuses from world terrain ─────────────────
// Applied in tickCreatures for creatures standing on or adjacent to these tiles.
export const NATURAL_CAVE_STRESS_REDUCTION   = 1.5   // per tick on cave tile
export const NATURAL_RIVER_STRESS_REDUCTION  = 0.5   // per tick on river/mud tile
export const NATURAL_TREE_STRESS_REDUCTION   = 0.25  // per tick on tree/shelter tile
export const NATURAL_ROCKY_SENTINEL_BONUS    = 0.005 // sentience per tick (Sentinel on rocky biome)
export const NATURAL_BUSH_STRESS_REDUCTION   = 0.18  // per tick on bush tile (concealment calms Timid)

// ─── Bush tiles ───────────────────────────────────────────────────────────────
export const BUSH_FOOD_MAX         = 35   // max berry amount per bush tile
export const BUSH_FOOD_REGROW_RATE = 0.07 // berries regrow slowly without needing a tree

// ─── Healroot ────────────────────────────────────────────────────────────────
// Medicinal herb patches that grow in lush and wetland biomes.
// Sick creatures instinctively seek them; consuming heals health over time.
// Healroot also spawns near death sites (grief-and-growth feedback loop).
export const HEALROOT_MAX_AMOUNT      = 100  // max potency per tile
export const HEALROOT_REGROW_RATE     = 0.06 // potency restored per tick (slow)
export const HEALROOT_HEAL_PER_USE    = 22   // health restored when a creature feeds
export const HEALROOT_CONSUME_AMOUNT  = 35   // potency consumed per feeding event
export const HEALROOT_SEEK_HEALTH     = 40   // health threshold: creature will seek healroot
export const HEALROOT_CARRY_HEAL      = 15   // health restored when a carried healroot is delivered

// Healroot lifecycle: depleted patches can wither back to grass/barren.
// Rate doubles in drought and winter (harsh seasons stress the herb).
export const HEALROOT_WITHER_THRESHOLD = 8      // potency below which wither can occur
export const HEALROOT_WITHER_CHANCE    = 0.0014 // per tick when below threshold

// Global cap prevents death-site accumulation from saturating the map.
export const HEALROOT_CAP              = 35     // max healroot tiles world-wide

// How close to a death site healroot can spontaneously spawn (memorial growth)
export const HEALROOT_DEATH_SITE_RADIUS = 3
export const HEALROOT_DEATH_SPAWN_CHANCE = 0.025  // was 0.08; rarer memorial growth

// ─── Micro-animations ────────────────────────────────────────────────────────
// Short body-language bursts triggered by creature state and conditions.
// Duration in real milliseconds; renderer interpolates within the window.
export const MICRO_ANIM_DURATION_MS: Record<string, number> = {
  jump:    600,   // happy leap; triggered during play or birth
  shake:   500,   // full-body shudder; triggered when cold, sick, or emerging from water
  sneeze:  400,   // rapid head-jerk; triggered when sick or dusty (arid biome)
  groom:   900,   // slow body-wave; triggered during bonding/grooming state
  wag:     700,   // tail/limb wag; triggered when a bond partner arrives nearby
}

// Per-tick chance of triggering each micro-animation (very low; feels rare and special)
export const MICRO_ANIM_TRIGGER_CHANCE: Record<string, number> = {
  jump:    0.008,  // during playing state
  shake:   0.012,  // when warmth < 30 OR just recovered from sick
  sneeze:  0.018,  // when sick OR in arid biome with dust
  groom:   0.025,  // during grooming state
  wag:     0.010,  // when a bonded partner enters proximity
}

// ─── Cave visual depth ────────────────────────────────────────────────────────
export const CAVE_CREATURE_ALPHA = 0.50        // creatures inside caves render dimmer

// ─── Rendering ───────────────────────────────────────────────────────────────
// 120×120 world; responsive canvas fills viewport; camera pan+zoom to navigate
export const ISO_TILE_WIDTH = 18
export const ISO_TILE_HEIGHT = 9
export const CANVAS_PADDING_X = 50
export const CANVAS_PADDING_Y = 55

// ─── Vegetation caps ──────────────────────────────────────────────────────────
// Prevent runaway tree/bush stacking. New growth only occurs when the world
// is below these counts, so older plants must die before new ones can take root.
export const VEG_TREE_CAP      = 250   // max (tree + shelter) tiles world-wide
export const VEG_BUSH_CAP      = 400   // max bush tiles world-wide
export const FOOD_PATCH_CAP    = 150   // max food_patch tiles world-wide; caps seasonal spawning

// ─── River erosion ────────────────────────────────────────────────────────────
// Very slow terrain shift over long play sessions. During storms, rivers
// occasionally widen into adjacent grass. During drought, isolated shallow
// rivers can dry to mud. Both effects compound over many seasons.
export const RIVER_EROSION_CHANCE = 0.00003  // storm: adjacent grass → river per tick
export const RIVER_DRYING_CHANCE  = 0.00008  // drought: low-water isolated river → mud per tick
// Winter: per river tile per tick, adjacent grass may briefly flood.
// At ~200 river tiles × 60 ticks/min this averages a few flooding events per minute.
export const RIVER_WINTER_FLOOD_CHANCE = 0.00015

// ─── Early-generation cohesion ────────────────────────────────────────────────
// Only the founding generation (gen 0) has a homing bias toward the nearest
// living creature. Gen 1+ creatures gain full autonomy immediately.
export const EARLY_GEN_MAX            = 0    // cohesion applies to gen 0 only
export const EARLY_GEN_COHESION_RADIUS = 28  // tile radius to search for nearest creature

// ─── Population pressure dispersal ───────────────────────────────────────────
// When local density exceeds CROWD_DISPERSE_THRESHOLD within CROWD_DISPERSE_RADIUS
// tiles, gen 1+ non-social creatures wander away from the cluster centroid.
// This is the primary driver of natural group splitting as the colony grows.
export const CROWD_DISPERSE_THRESHOLD    = 10   // neighbors within radius to trigger dispersal
export const CROWD_DISPERSE_RADIUS       = 10   // tile radius for the density check
export const CROWD_DISPERSE_DISTANCE_MIN = 20   // minimum dispersal distance in tiles
export const CROWD_DISPERSE_DISTANCE_MAX = 45   // maximum dispersal distance in tiles

// ─── Vegetation lifecycle ─────────────────────────────────────────────────────
// Trees have a finite productive lifespan. After TREE_PEAK_AGE ticks they enter
// a declining phase, dropping fruit less often. At TREE_WITHER_AGE they stop
// producing entirely. At TREE_DECAY_AGE the tile reverts to barren, and
// TREE_REGROW_FROM_DECAY gives a small chance for the tile to become a sapling.
export const TREE_PEAK_AGE        = TREE_GROW_DAYS * 4   // ~480 ticks
export const TREE_WITHER_AGE      = TREE_GROW_DAYS * 7   // ~840 ticks
export const TREE_DECAY_AGE       = TREE_GROW_DAYS * 10  // ~1200 ticks
export const TREE_REGROW_FROM_DECAY = 0.006               // chance per tick at decay age
export const TREE_SEED_CHANCE       = 1 / 3               // germination rate for a seed landing on grass

// Shrubs (bush) wither seasonally and may regenerate or die.
export const BUSH_WITHER_CHANCE   = 0.0002  // per tick in drought or late autumn/winter
export const BUSH_REGROW_CHANCE   = 0.0004  // per tick on grass tile in spring/lush biome

// Fruit decay; fruit_patch tiles near no mature tree decay over time.
// If they persist long enough they may become a new sapling (natural seeding).
export const FRUIT_DECAY_RATE        = 0.15   // food lost per tick when isolated (no tree nearby)
export const FRUIT_SEED_CHANCE       = 0.002  // chance a decaying food tile spawns a sapling
export const FRUIT_OVERPRODUCTION_CAP = 0.004 // max drop chance regardless of season multiplier
// Hard lifespan: food_patch tiles wither when fruitAge exceeds this, even near trees.
// Trees reset fruitAge to 0 when actively dropping fruit, so well-tended patches
// survive indefinitely; seasonal orphans die within ~12 real minutes (700 ticks).
export const FRUIT_MAX_AGE           = 700

// ─── Weather; rain puddles & rivers ─────────────────────────────────────────
// Rain accumulates on grass tiles. When a tile's puddle level reaches the
// PUDDLE_FORM_THRESHOLD it converts to a mud tile. Adjacent puddle/mud tiles
// flowing downhill (toward lower-elevation tiles) form streams and eventually
// join rivers. Puddles evaporate in clear/drought weather.
export const PUDDLE_FORM_THRESHOLD = 0.65   // water accumulation 0–1 on a grass tile
export const PUDDLE_ACCUMULATE_RATE = 0.008 // per tick during rain/storm
export const PUDDLE_EVAPORATE_RATE  = 0.012 // per tick in clear/drought
export const PUDDLE_FLOW_CHANCE     = 0.008 // chance a puddle tile flows to adjacent lower tile

export const RIVER_OVERFLOW_CHANCE  = 0.003 // rain causes rivers to overflow to adjacent grass

// Creature behaviour near puddles
export const PUDDLE_THIRST_RELIEF   = 8.0   // thirst reduced per tick when drinking from puddle
export const PUDDLE_MOVE_MODIFIER   = 0.75  // movement speed on puddle tile (slippery)
export const PUDDLE_MOVE_THRESHOLD  = 0.18  // puddleLevel above which PUDDLE_MOVE_MODIFIER kicks in
export const RAIN_WARMTH_DRAIN      = 0.10  // warmth drained per tick while in rain (1.5× in storm)

// ─── Solar warmth recovery ────────────────────────────────────────────────────
// Warmth restored per tick when on temperate or arid biome during clear daytime.
// Partially offsets the baseline warmth drain without fully negating it.
export const SOLAR_WARMTH_BONUS = 0.010

// ─── Bond grief decay ────────────────────────────────────────────────────────
// Bonds toward dead creatures fade at this rate per tick, reaching 0 in ~5 game-days.
// Models a grief arc: survivors mourn then gradually detach and re-bond with the living.
export const DEAD_BOND_FADE_PER_TICK = 0.35

// ─── Snow ─────────────────────────────────────────────────────────────────────
// Snow falls on all land during winter and spreads gradually like a blanket.
// Active snowfall (weather='snow' or storm+winter) accumulates at SNOW_ACCUMULATE_RATE.
// Clear winter applies a slow frost baseline so the land stays lightly covered between storms.
// Deep snow spreads to adjacent tiles at SNOW_SPREAD_CHANCE, creating the blanketing effect.
// Melts in spring/summer; arid biomes melt faster, wetland slightly faster than temperate.
export const SNOW_ENABLED = true
export const SNOW_ACCUMULATE_RATE   = 0.007   // depth added per tick during active snowfall
export const SNOW_MELT_RATE         = 0.003   // base melt rate per tick when not snowing
export const SNOW_MAX_DEPTH         = 1.0     // 0..1, normalised
export const SNOW_MOVE_PENALTY      = 0.55    // tile move modifier under full snow cover
export const SNOW_WARMTH_DRAIN      = 0.06    // extra warmth decay per tick in snow
export const SNOW_FOOD_COVER_FACTOR = 0.0     // food invisible to creatures when fully covered
export const SNOW_VISIBILITY_REDUCE = 0.50    // renderer alpha on snow-covered food tiles
// Baseline frost in clear winter: slow accumulation keeps the world lightly snowed between storms
export const SNOW_WINTER_FROST_RATE = 0.001   // depth added per tick in clear winter (non-drought)
export const SNOW_WINTER_FROST_CAP  = 0.28    // max depth from frost alone (full depth needs snowfall)
// Spread: deep snow gradually blankets adjacent tiles (like puddle flow)
export const SNOW_SPREAD_CHANCE     = 0.003   // per tile per tick when depth > SNOW_SPREAD_THRESHOLD
export const SNOW_SPREAD_THRESHOLD  = 0.35    // minimum depth before a tile starts spreading
export const SNOW_SPREAD_AMOUNT     = 0.002   // depth transferred to adjacent tile per spread event
// Biome accumulation factors (all biomes receive snow; these scale the rate)
export const SNOW_BIOME_FACTOR: Record<string, number> = {
  temperate: 1.00,
  rocky:     1.10,   // cold stone holds snow well
  lush:      0.85,   // canopy intercepts some snowfall
  wetland:   0.65,   // wet ground; snow melts into slush faster
  arid:      0.40,   // dry heat resists accumulation
}
// Biome melt multipliers (higher = melts faster)
export const SNOW_BIOME_MELT_FACTOR: Record<string, number> = {
  temperate: 1.0,
  rocky:     0.9,
  lush:      1.1,
  wetland:   1.6,
  arid:      3.0,
}
// Keep for renderer / UI references; all biomes now accumulate snow
export const SNOW_BIOMES = ['temperate', 'rocky', 'lush', 'wetland', 'arid'] as const

// ─── Lineage forking ─────────────────────────────────────────────────────────
// Generation-interval forking is the primary divergence mechanism: every
// LINEAGE_FORK_INTERVAL generations, offspring have a LINEAGE_FORK_CHANCE
// of branching into a new sub-lineage derived from their primary parent.
// Gen 0-3 = one founding family; first fracture expected around gen 4-8;
// deep tribal splits accumulate from gen 8+ onward.
// Stress/geographic pressure can trigger an early fork at any generation
// when divergencePressure crosses 0.40 (secondary path in factory.ts).
export const LINEAGE_FORK_INTERVAL = 4    // generations between fork eligibility windows
export const LINEAGE_FORK_CHANCE   = 0.55 // probability of fork when a window is open

// ─── Race lineage & latent ancestry ──────────────────────────────────────────
export const LATENT_REVIVAL_BASE    = 0.025  // 2.5% base revival chance per latent race
export const LATENT_DEPTH_BONUS     = 0.003  // +0.3% per extra generation dormant
export const LATENT_MAX_DEPTH       = 25     // prune ancestry beyond this depth
export const LATENT_DOMINANT_WEIGHT = 0.70   // probability offspring expresses dominant parent's race

// ─── Disease immunity ─────────────────────────────────────────────────────────
export const DISEASE_IMMUNITY_GAIN = 0.40        // immunity gained after recovering from sick state
export const DISEASE_IMMUNITY_PROTECTION = 0.80  // max fractional reduction of contact chance from immunity
export const DISEASE_BOND_SPREAD_MULT = 2.0      // contact-chance multiplier when adjacent bonded creature is sick

// ─── River-adjacent food bonus ────────────────────────────────────────────────
export const RIVER_FOOD_ADJACENT_BONUS = 1.5     // food regrowth multiplier for patches adjacent to a river tile

// ─── Absence imprint ──────────────────────────────────────────────────────────
export const ABSENCE_IMPRINT_DAYS = 5            // in-game days the imprint stress persists on return
export const ABSENCE_IMPRINT_STRESS_PER_TICK = 0.22  // extra stress per tick during imprint window

// ─── Lineage rivalry ──────────────────────────────────────────────────────────
export const RIVAL_PROXIMITY_RADIUS = 5          // tile radius to detect rival-lineage creature
export const RIVAL_STRESS_PER_TICK = 0.14        // stress per tick when rival lineage is nearby

// ─── Tribal fracture ─────────────────────────────────────────────────────────
export const TRIBE_BORDER_STRESS_PER_TICK = 0.28 // stress/tick when near an enemy-lineage cluster
export const TRIBE_WAR_FIGHT_CHANCE = 0.008      // per-tick chance of inter-lineage attack when adjacent
export const TRIBE_WAR_SUSTAIN_DAYS = 8          // in-game days of continuous conflict before fracture fires

// ─── Neglect warning ──────────────────────────────────────────────────────────
export const NEGLECT_WARMTH_THRESHOLD  = 22    // avg warmth below which warning fires
export const NEGLECT_HUNGER_THRESHOLD  = 78    // avg hunger above which warning fires
export const NEGLECT_MIN_AFFECTED      = 2     // minimum creatures in crisis to trigger warning
export const NEGLECT_WARNING_COOLDOWN  = 5     // in-game days between neglect warnings

// ─── Legendary creature thresholds ───────────────────────────────────────────
export const LEGENDARY_AGE_MULT        = 2.5   // age multiple of maxAge for longevity event
export const LEGENDARY_OFFSPRING_MIN   = 15    // offspring count for prolific event
export const LEGENDARY_LINEAGE_GEN_MIN = 20    // generation depth for last-of-lineage event

// ─── Construction system ──────────────────────────────────────────────────────
// Creatures with Territorial or Nurturing personality will harvest materials
// from trees (wood) and rocks (stone), then build fence tiles near their
// territory claim. Fences decay over time and creatures rebuild them.
export const HARVEST_TRIGGER_SATISFACTION = 72  // min needSatisfaction to start harvesting
export const HARVEST_RADIUS = 3                 // tile radius to search for harvestable resources
export const BUILD_TERRITORY_RADIUS = 5         // tile radius from territoryClaim to place fence
export const FENCE_INITIAL_DURABILITY = 100     // durability on placement
export const FENCE_DECAY_BASE = 0.012           // durability lost per tick (normal)
export const FENCE_DECAY_STORM = 0.055          // durability lost per tick during storm/winter
export const FENCE_STRESS_RADIUS = 3            // tile radius of fence stress-reduction effect
export const FENCE_STRESS_REDUCTION = 0.22      // stress removed per tick when near own fence

// ─── Mutation refinements ──────────────────────────────────────────────────────
// Adaptive mutation: when parents are under crisis (high stress), offspring mutation
// rate rises slightly — pressure drives variation, which can rescue collapsing lineages.
export const MUTATION_CRISIS_BOOST_MAX  = 0.06  // max extra mutation rate at 100% parental stress
// Fitness inheritance weight: proportion by which the healthier parent biases trait selection.
// 0 = pure 50/50; 0.35 = fitter parent's traits are meaningfully more likely to be inherited.
export const MUTATION_FITNESS_WEIGHT    = 0.35

// ─── Resource seeking refinements ─────────────────────────────────────────────
// Minimum food amount for a food_patch to be worth committing a path toward.
// Prevents creatures from darting toward nearly-empty patches and staying hungry.
export const FOOD_SEEK_MIN_AMOUNT       = 6
// Wider food scan tried before the creature resorts to long-distance migration.
// The gap between the normal 20-tile scan and migration at hunger>55 left creatures
// idle in food deserts; this bridges it with a cheaper fallback before committing to migration.
export const FOOD_SEEK_FALLBACK_RADIUS  = 34
// Radius to find mud/puddle tiles as a close alternative to distant rivers.
// Puddle drinking already exists at the tile level; this gates behavior seeking toward them.
export const PUDDLE_DRINK_RADIUS        = 6
// Tide race (riparian specialist) senses water from farther away.
export const TIDE_WATER_SEEK_RADIUS     = 30
// Bloom race (reproduction-amplified, season-sensitive) begins food-seeking earlier.
export const BLOOM_HUNGER_THRESHOLD     = 22
// Crag race (mountain-dwellers) claims a larger territorial radius.
export const CRAG_TERRITORY_RADIUS      = 12