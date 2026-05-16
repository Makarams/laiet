// ─── Experience event types ───────────────────────────────────────────────────
// Each type fires once per meaningful occurrence and contributes to sentience.
// Feral creatures are immune; Aware/Dreaming/Sentinel weigh these differently.
export type ExperienceEventType =
  | 'bond_formed'          // bonded with another creature for the first time
  | 'bond_lost'            // bonded partner died
  | 'witnessed_death'      // was present when another died
  | 'raised_offspring'     // offspring survived past 5 days
  | 'survived_starvation'  // hunger > 90 then recovered
  | 'survived_combat'      // was in fight state, health dropped below 30, survived
  | 'discovered_biome'     // entered a biome type not previously visited
  | 'long_solitude'        // alone for 20+ consecutive days
  | 'caretaker_contact'    // caretaker acted within close proximity
  | 'cross_lineage_bond'   // formed a meaningful bond with creature of different lineage

// ─── Genetics ────────────────────────────────────────────────────────────────

export type PersonalityTrait =
  | 'Curious' | 'Timid' | 'Aggressive' | 'Lazy' | 'Greedy' | 'Nurturing' | 'Wanderer' | 'Recluse'
  | 'Hoarder' | 'Empath' | 'Furtive' | 'Territorial' | 'Social' | 'Stoic'
export type BodyTrait = 'Spore' | 'Shell' | 'Spike' | 'Wisp'
export type MindTrait = 'Feral' | 'Aware' | 'Dreaming' | 'Sentinel'

// Ancestral racial lineage; persists across generations and can re-emerge
// from latent ancestry even after a race has been absent for many generations.
export type RaceTrait = 'Kin' | 'Drift' | 'Burrow' | 'Apex' | 'Pale' | 'Tide' | 'Bloom' | 'Ash'

// Heritable environmental adaptations; acquired at birth from spawn conditions
// and passed to offspring at ADAPTATION_INHERIT_CHANCE per trait (max 3 per creature).
export type AdaptationTrait =
  | 'cold_hardy'    // winter/snow birth → warmth decay ×0.65
  | 'drought_tough' // arid/drought birth → hunger decay ×0.78
  | 'cave_sighted'  // rocky biome birth → no night warmth penalty; enlarged pale eyes
  | 'hydro_fins'    // wetland birth → thirst decay ×0.55 on wetland/river tiles
  | 'heat_plated'   // heatwave/summer birth → heatwave stress blocked; gold chitin stripe
  | 'storm_braced'  // storm birth → storm stress immune; dark crackle ring
  | 'thick_pelt'    // heavy snowfall in winter birth → broad insulation; warmth drain ×0.60 in all cold/wet weather; storm stress ×0.50

// Environmental context at time of birth; shapes morphology pressure and adaptation acquisition.
export interface EnvContext {
  biome: string
  weather: WeatherState
  season: Season
}

// Heritable accumulated evolutionary traits; small per-generation drift lets
// each lineage develop a visually distinct morphological profile over time.
// All traits start neutral at gen 0 and compound with each birth event.
export interface MorphologyTraits {
  sizeScale: number       // 0.7..1.5; body size multiplier relative to body-type baseline
  limbLength: number      // 0..1; appendage elongation (fins, lobes, nubs, pseudopods)
  spinalLength: number    // 0..1; dorsal feature growth (ridges, spines, tail length, flagella)
  colorDrift: number      // -0.5..0.5; hue offset accumulated across lineage generations
  eyeSize: number         // 0.7..1.5; eye development relative to mind-type baseline
}

export interface Genome {
  personality: PersonalityTrait
  body: BodyTrait
  mind: MindTrait
  morphSeed: number          // 0..1; per-lineage shape asymmetry seed (blob shape, asym offsets)
  morphology: MorphologyTraits // heritable accumulated evolutionary traits; drifts each generation
  race?: RaceTrait                                    // ancestral lineage; optional for backward compat
  latentAncestry?: Partial<Record<RaceTrait, number>> // dormant race → generations-dormant counter
  adaptations?: AdaptationTrait[]                     // environmental adaptations; up to 3 per creature
}

// ─── Creature ─────────────────────────────────────────────────────────────────

export interface Bond {
  targetId: string
  strength: number // 0-100
  since: number    // game day
}

// ─── Community roles ──────────────────────────────────────────────────────────
// Assigned based on personality + mind + lineage standing within the tribe.
// Null until a tribe forms; may change as the colony evolves.
export type CommunityRole =
  | 'shaman'    // Dreaming/Sentinel + Curious; keeper of memory, interprets anomalies
  | 'guardian'  // Aggressive/Spike; protects territory and young
  | 'forager'   // Wanderer/Greedy; scouts food and resources
  | 'nurturer'  // Nurturing; raises young, maintains bonds
  | 'elder'     // Any mind Sentinel, oldest in lineage; cultural memory anchor
  | 'scout'     // Wisp body + Wanderer; long-range explorer
  | 'healer'    // Nurturing + Dreaming; stress reduction, mourning support
  | 'recluse'   // Recluse personality; loner, doesn't participate in tribe speech

// ─── Speech system ────────────────────────────────────────────────────────────
// Each creature accumulates emoji they can use; sentences are short sequences.
// Knowledge passes to offspring (50% of parent vocab) and to bonded tribemates
// over time. Isolated lineages diverge.
export interface SpeechEvent {
  speakerId: string
  targetId: string | null  // null = broadcast to tribe
  sentence: string[]       // 1-3 emoji from knownEmoji
  day: number
  tick: number             // real timestamp for renderer fade
}

export interface Creature {
  id: string
  name: string
  familyName: string
  genome: Genome
  generation: number
  parentIds: [string | null, string | null]
  lineageId: string  // root ancestor id

  // stats
  age: number        // game days
  maxAge: number     // determined by body trait
  health: number     // 0-100
  hunger: number     // 0-100, higher = more hungry
  thirst: number     // 0-100
  warmth: number     // 0-100, lower in winter
  stress: number     // 0-100
  sentience: number  // 0-100, grows with mind trait over time

  // needs satisfaction (trait-specific)
  needSatisfaction: number // 0-100

  // biome of last occupied tile; drives environmental visual adaptation in renderer
  dominantBiome?: string

  // position on grid
  x: number
  y: number

  // social
  bonds: Bond[]
  tribeId: string | null
  territoryClaim: { x: number; y: number } | null

  // state machine
  state: CreatureState
  stateTimer: number
  targetX: number | null
  targetY: number | null

  // history
  bornOnDay: number
  diedOnDay: number | null
  killCount: number
  offspringIds: string[]
  messagesSent: number

  // thought bubble
  currentThought: ThoughtSymbol | null
  thoughtTimer: number

  // mutation tracking; set on birth if discrete genome slots mutated from both parents
  recentMutation?: number    // game day of birth, cleared after MUTATION_DISPLAY_DAYS
  mutatedTraits?: string[]   // which slots mutated (personality / body / mind)

  // enrichment state
  enrichmentTarget?: string   // id of enrichment item being used
  lastEnrichmentTick?: number // sim tick when creature last used enrichment (cooldown)

  // cannibal trauma; game-day until which witness stress persists above baseline
  traumaUntil?: number

  immunity?: number            // 0-1; gained after surviving disease; reduces contact chance

  // ─── Experience-driven sentience ──────────────────────────────────────────
  // Accumulated weight of distinct lived experiences; each type contributes once
  // per occurrence to avoid farming. Drives sentience growth alongside base rate.
  experienceLog?: Partial<Record<ExperienceEventType, number>>  // event → game-day of last occurrence
  experienceWeight?: number   // 0-100; cumulative experience pressure on sentience

  // ─── Terrain preference learning ──────────────────────────────────────────
  // Per-tile-type visit outcome history; positive when creature found what it
  // sought (food/water/shelter), negative when tile was empty or unsuitable.
  terrainMemory?: Partial<Record<string, number>>  // tileType → preference score (-10..10)

  // ─── Enrichment preference learning ──────────────────────────────────────
  // Accumulated satisfaction scores from actual enrichment use; replaces static table.
  enrichmentMemory?: Partial<Record<string, number>>  // enrichmentType → learned preference (0..10)

  // community & speech
  role?: CommunityRole        // assigned when tribe forms or colony grows
  knownEmoji: string[]        // emoji this creature can use/pass on
  lastSpeechTick?: number     // real ms; throttle speech rendering
  currentSpeech?: SpeechEvent // active speech bubble (cleared after ~3s)

  // micro-animations; short-lived expressive body actions
  // type: 'jump' | 'shake' | 'sneeze' | 'groom' | 'wag'; renderer uses this
  // startMs: real timestamp when animation began
  microAnim?: { type: MicroAnimType; startMs: number }

  // carrying; a creature can hold one item (healroot, fruit, pebble)
  carrying?: CarriedItemType
  carryingTargetId?: string   // creature id they're bringing it to (optional)
}

export type MicroAnimType = 'jump' | 'shake' | 'sneeze' | 'groom' | 'wag'
export type CarriedItemType = 'healroot' | 'fruit' | 'pebble' | 'wood' | 'stone'

export type CreatureState =
  | 'idle'
  | 'wandering'
  | 'seeking_food'
  | 'seeking_water'
  | 'seeking_shelter'
  | 'seeking_warmth'
  | 'seeking_healroot'  // sick creature heading to a healroot tile
  | 'bonding'
  | 'fighting'
  | 'fleeing'
  | 'reproducing'
  | 'mourning'
  | 'observing'        // Sentinel behaviour
  | 'dreaming'         // Dreaming at death sites / river
  | 'sick'
  | 'migrating'        // long-range search when local food exhausted
  | 'scavenging'       // consuming a corpse (cannibalism)
  | 'dying'
  | 'playing'          // social play; reduces stress, emerges from high satisfaction
  | 'using_enrichment' // interacting with a placed enrichment item
  | 'grooming'         // social grooming; reduces stress of both parties
  | 'harvesting'       // heading to a resource tile to collect wood or stone
  | 'building'         // heading to a build location to place a fence

export type ThoughtSymbol =
  | 'hungry'
  | 'thirsty'
  | 'cold'
  | 'stressed'
  | 'content'
  | 'fighting'
  | 'bonding'
  | 'curious'
  | 'mourning'
  | 'watching'
  | 'dreaming'
  | 'sick'
  | 'playing'
  | 'mutated'
  | 'carrying'   // holding an item
  | 'grooming'   // social grooming
  | 'building'   // harvesting resources or constructing a fence

// ─── World / Tiles ────────────────────────────────────────────────────────────

export type TileType =
  | 'grass'
  | 'tree'
  | 'river'
  | 'mud'
  | 'rock'
  | 'food_patch'
  | 'barren'
  | 'flooded'
  | 'shelter'    // grown tree = shelter
  | 'death_site' // where a creature died
  | 'mountain'   // impassable high-elevation peak
  | 'cave'       // passable hollow in rock; provides shelter and warmth
  | 'cliff'      // impassable sharp elevation drop; acts as natural barrier
  | 'bush'       // low fruiting shrub; berries ripen seasonally; Timid shelter
  | 'healroot'   // medicinal herb patch; sick creatures seek this; regrows slowly
  | 'fence'      // constructed barrier; built by Territorial/Nurturing creatures

export type BiomePatch = 'temperate' | 'arid' | 'lush' | 'rocky' | 'wetland'

export interface Tile {
  x: number
  y: number
  type: TileType
  biome: BiomePatch
  foodAmount: number    // 0-100
  foodRegrowTimer: number
  waterLevel: number    // 0-100
  shelter: boolean
  treeAge: number       // days since planted, -1 if not a tree
  claimedBy: string | null // creature id
  deathSiteOf: string | null // creature id
  deathSiteAge: number     // game days since this tile became a death site; reverts to barren past threshold
  floodTimer: number
  burning: number          // ticks remaining on fire (0 = not burning)
  lightningFlash?: number  // timestamp of last strike; renderer fades bolt/flash after LIGHTNING_VISUAL_DURATION_MS
  snowDepth?: number        // 0..1; accumulated snow on this tile (only in winter)
  puddleLevel?: number      // 0..1; standing water level accumulating during rain
  fruitAge?: number         // ticks since this food_patch was last replenished by a tree
  elevation?: number       // 0..1; used for mountain height variation
  healrootAmount?: number   // 0-100; potency of healroot on this tile; regrows slowly
  fenceDurability?: number  // 0-100; constructed fence health; decays over time
  fenceType?: 'wood' | 'stone' // material used to build
}

// ─── Enrichment ───────────────────────────────────────────────────────────────

export type EnrichmentType =
  | 'resting_spot'    // stress↓, warmth↑ slight; calm rest
  | 'scratching_post' // stress↓↓; physical release, no hunger cost
  | 'burrow'          // stress↓, warmth↑↑; hidden warm shelter
  | 'warm_stone'      // warmth↑↑↑; thermal comfort; stress↓ slight
  | 'mud_pool'        // thirst↓↓, stress↓; cooling wallow in mineral clay
  | 'worn_path'       // stress↓, hunger↑; worn dirt circuit for running
  | 'play_stones'     // stress↓↓, hunger↑ slight; pebble manipulation; social bonus
  | 'springy_moss'    // stress↓↓↓, hunger↑, health↑ slight; sphagnum bounce pad

export interface EnrichmentItem {
  id: string
  type: EnrichmentType
  x: number
  y: number
  placedOnDay: number
  usedBy: string | null        // current creature id
  totalUses: number            // lifetime interaction count
  maxUses: number              // item degrades and disappears after this many uses
  usesRemaining: number        // decremented each use session
  natural?: boolean            // true = world-spawned; undefined/false = caretaker-placed
}

// ─── Season & Time ────────────────────────────────────────────────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'
export type WeatherState = 'clear' | 'rain' | 'storm' | 'drought' | 'snow' | 'heatwave' | 'fog'

export interface GameTime {
  day: number
  totalMinutesElapsed: number // real minutes since world creation
  season: Season
  year: number
  phase: DayPhase
}

// ─── Tribes ───────────────────────────────────────────────────────────────────

export interface Tribe {
  id: string
  name: string
  memberIds: string[]
  territory: { x: number; y: number }[]
  foundedOnDay: number
  color: string // hex for rendering
  tribalLexicon: string[]    // shared vocabulary pool; grows with elder/shaman knowledge, persists through generations
}

// ─── Cohort phase ────────────────────────────────────────────────────────────
// Derived from the deepest generation ever born; a permanent ratchet on the
// colony's evolutionary depth. Gates signal depth 4 and 5.
export type CohortPhase = 1 | 2 | 3 | 4 | 5

// ─── Messages ────────────────────────────────────────────────────────────────

export type MessageStage = 1 | 2 | 3 | 4 | 5

export interface ColonyMessage {
  id: string
  text: string
  stage: MessageStage
  creatureId: string | null
  day: number
  timestamp: number
  read: boolean
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventType =
  | 'fight'
  | 'sickness'
  | 'drought'
  | 'stranger'
  | 'tree_needed'
  | 'creature_missing'
  | 'food_low'
  | 'flood_warning'
  | 'bond_formed'
  | 'death'
  | 'new_generation'
  | 'tribe_war'

export interface GameEvent {
  id: string
  type: EventType
  title: string
  body: string
  options: EventOption[]
  day: number
  resolved: boolean
  involvedCreatureIds: string[]
}

export interface EventOption {
  label: string
  action: EventAction
}

export type EventAction =
  | 'intervene_fight'
  | 'heal_creature'
  | 'drop_food'
  | 'plant_tree'
  | 'observe'
  | 'ignore'
  | 'break_up'
  | 'redirect_river'

// ─── Fossil Record ────────────────────────────────────────────────────────────

export interface ExtinctionRecord {
  id: string
  extinctionDay: number
  extinctionCause: 'neglect' | 'war' | 'drought' | 'flood' | 'winter' | 'starvation' | 'heatwave'
  peakPopulation: number
  generationsReached: number
  finalMessage: string | null
  creatureCount: number
  notableCreatures: { name: string; traits: Genome; age: number }[]
}

// ─── Caretaker Profile ────────────────────────────────────────────────────────
// Set once before the world is created. Shapes how the simulation behaves
// throughout the entire playthrough. Each field maps to a ProfileScreen question.

export interface CaretakerProfile {
  presence:    'interventionist' | 'observer' | 'silent'
  world:       'fertile' | 'varied' | 'scarce'
  evolution:   'fast' | 'slow'
  focus:       'bonds' | 'survival' | 'awareness'
  expectation: 'persistence' | 'extinction'
  visibility:  'attentive' | 'neutral' | 'hidden'
}

// SimModifiers; derived from CaretakerProfile at world creation and stored
// in GameState. The tick engine reads these instead of raw constants so the
// profile shapes every subsequent generation without requiring runtime lookups.
export interface SimModifiers {
  foodRegrowMult: number        // ×1.0 default; scales food patch regrowth rate
  droughtDurationMult: number   // ×1.0 default; longer drought phases if > 1
  bondSpeedMult: number         // ×1.0 default; how fast proximity bonds strengthen
  mutationChance: number        // 0.15 default; per discrete gene slot per birth
  sentienceGrowthMult: number   // ×1.0 default; scales all SENTIENCE_GROWTH_BY_MIND values
  awarenessMessageMult: number  // ×1.0 default; scales message cooldown (< 1 = more messages)
  healCharges: number           // 3 default; daily heal uses available to caretaker
  foodDropCooldownMs: number    // 5000 default; ms between food drop actions
}

// ─── Caretaker Resources ─────────────────────────────────────────────────────

export interface CaretakerState {
  healCharges: number       // resets to 3 per real day
  lastHealReset: number     // timestamp
  riverRedirectUsed: boolean // resets each season
  lastSeasonRedirect: Season
  foodDropCooldown: number  // ms
  lastFoodDrop: number      // timestamp
  // Environmental intervention tools; each has its own cooldown so the
  // player can't carpet-bomb the colony.
  lastThunder: number       // timestamp of last strike
  lastFire: number          // timestamp of last ignition
  thunderChargesToday: number  // counter resets daily
  fireChargesToday: number
  lastEnvReset: number      // ms timestamp of last daily reset
  // Presence tracking; used for awareness acceleration
  lastActionX: number | null
  lastActionY: number | null
  lastActionMs: number
  // Tool-as-answer mechanic
  awaitingResponseUntil: number  // real ms timestamp; 0 = not waiting
  respondedToQuestion: boolean   // one-tick flag cleared after response message emitted
  // Tool category used last; shapes differentiated colony responses
  lastToolUsed?: 'placement' | 'intervention' | 'observe'
}

// ─── Colony Stage ─────────────────────────────────────────────────────────────

export type ColonyStage =
  | 'genesis'      // 1-5 creatures
  | 'nascent'      // 6-15
  | 'growing'      // 16-30
  | 'established'  // 31-50
  | 'thriving'     // 51-80
  | 'ascendant'    // 80+

// ─── Endgame ──────────────────────────────────────────────────────────────────

export type EndgameType = 'extinction' | null

// ─── Full Game State ──────────────────────────────────────────────────────────

export interface GameState {
  worldId: string
  userId: string
  worldSeed: number
  createdAt: number

  // Profile-driven simulation modifiers; set at world creation, never change.
  // Both fields are optional for backward compatibility with pre-profile saves.
  profile?: CaretakerProfile
  modifiers?: SimModifiers

  time: GameTime
  tiles: Tile[][]         // [y][x]
  creatures: Record<string, Creature>
  tribes: Record<string, Tribe>
  messages: ColonyMessage[]
  events: GameEvent[]
  fossilRecord: ExtinctionRecord[]
  caretaker: CaretakerState
  colonyStage: ColonyStage
  awarenessStage: MessageStage
  endgame: EndgameType

  // enrichment items placed by the caretaker
  enrichmentItems: Record<string, EnrichmentItem>

  // weather
  weather: WeatherState
  weatherTimer: number  // game days remaining in this weather phase
  snowAccumulation: number  // 0-100; global snow coverage percent (derived from tile depths)

  // race population tracking; optional for backward compat with pre-race saves
  racePopulations?: Partial<Record<RaceTrait, number>>  // alive count per race (updated each tick)
  extinctRaces?: RaceTrait[]                            // races seen alive but now at 0

  // Evolutionary depth tracking — optional for backward compat.
  cohortPhase?: CohortPhase    // derived from totalGenerations; gates depth 4 and 5

  // Awareness stage window tracking — optional for backward compat with pre-emergent saves.
  // Stores the game-day when each stage-up condition was first continuously met.
  // Undefined = condition has never been met or recently lapsed (window reset).
  roleWindowStart?: number        // day 4-distinct-roles condition began its sustained window
  lexiconWindowStart?: number     // day colony-lexicon threshold began its sustained window
  ancestralWindowStart?: number   // day depth-4 sentience condition began its sustained window
  transcendentWindowStart?: number// day depth-5 Elder-sentience condition began its sustained window

  // ─── Emergent cognition ───────────────────────────────────────────────────
  // Continuous pressure score (0-100) that drives awareness stage as a gradient,
  // not a gate. Rises from role diversity, vocabulary, sentience depth, lineage
  // complexity, and cross-lineage bonds. Falls when those conditions degrade.
  // awarenessStage remains as a soft band label derived from this value.
  cognitionPressure?: number

  // Colony distress memory — accumulated creature distress signals that the
  // colony "notices" internally before surfacing a message. Prevents the engine
  // from acting as a surveillance system; the colony decides when to speak.
  colonyDistressAccumulator?: number

  absenceImprint?: number      // in-game days of stress imprint after long absence
  tribeWarStart?: number       // game day when sustained inter-lineage conflict began

  // ─── Lineage relations ────────────────────────────────────────────────────
  // Per-pair relationship score between lineage IDs. Key = "lineageA:lineageB" (sorted).
  // Starts neutral (0). Shared offspring, cross-lineage bonds, and cohabitation push positive.
  // Combat and proximity stress push negative. Range: -100..100.
  lineageRelations?: Record<string, number>

  // neglect & legendary tracking — optional for backward compat
  lastNeglectWarning?: number  // game day of last neglect warning message
  legendaryFired?: string[]    // creature IDs that have already had legendary events

  // stats
  totalCreaturesEver: number
  totalGenerations: number
  totalDeaths: number
  lastSaved: number
  lastSessionEnd: number | null
}