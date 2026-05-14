// ─── Genetics ────────────────────────────────────────────────────────────────

export type PersonalityTrait = 'Curious' | 'Timid' | 'Aggressive' | 'Lazy' | 'Greedy' | 'Nurturing' | 'Wanderer' | 'Recluse'
export type BodyTrait = 'Spore' | 'Shell' | 'Spike' | 'Wisp'
export type MindTrait = 'Feral' | 'Aware' | 'Dreaming' | 'Sentinel'

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
export type CarriedItemType = 'healroot' | 'fruit' | 'pebble'

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
}

// ─── Season & Time ────────────────────────────────────────────────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'
export type WeatherState = 'clear' | 'rain' | 'storm' | 'drought' | 'snow'

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

// ─── Messages ────────────────────────────────────────────────────────────────

export type MessageStage = 1 | 2 | 3

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
  | 'ascension_near'

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
  extinctionCause: 'neglect' | 'war' | 'drought' | 'flood'
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
  expectation: 'ascension' | 'persistence' | 'extinction'
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
  ascensionThresholdOffset: number // 0 default; subtracted from ASCENSION_POPULATION
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

export type EndgameType = 'extinction' | 'fracture' | 'ascension' | null

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

  // stats
  totalCreaturesEver: number
  totalGenerations: number
  totalDeaths: number
  lastSaved: number
  lastSessionEnd: number | null
}