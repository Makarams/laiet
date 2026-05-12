// ─── Genetics ────────────────────────────────────────────────────────────────

export type PersonalityTrait = 'Curious' | 'Timid' | 'Aggressive' | 'Lazy' | 'Greedy' | 'Nurturing' | 'Wanderer' | 'Recluse'
export type BodyTrait = 'Spore' | 'Shell' | 'Spike' | 'Wisp'
export type MindTrait = 'Feral' | 'Aware' | 'Dreaming' | 'Sentinel'

// Heritable accumulated evolutionary traits — small per-generation drift lets
// each lineage develop a visually distinct morphological profile over time.
// All traits start neutral at gen 0 and compound with each birth event.
export interface MorphologyTraits {
  sizeScale: number       // 0.7..1.5 — body size multiplier relative to body-type baseline
  limbLength: number      // 0..1 — appendage elongation (fins, lobes, nubs, pseudopods)
  spinalLength: number    // 0..1 — dorsal feature growth (ridges, spines, tail length, flagella)
  colorDrift: number      // -0.5..0.5 — hue offset accumulated across lineage generations
  eyeSize: number         // 0.7..1.5 — eye development relative to mind-type baseline
}

export interface Genome {
  personality: PersonalityTrait
  body: BodyTrait
  mind: MindTrait
  morphSeed: number          // 0..1 — per-lineage shape asymmetry seed (blob shape, asym offsets)
  morphology: MorphologyTraits // heritable accumulated evolutionary traits; drifts each generation
}

// ─── Creature ─────────────────────────────────────────────────────────────────

export interface Bond {
  targetId: string
  strength: number // 0-100
  since: number    // game day
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

  // biome of last occupied tile — drives environmental visual adaptation in renderer
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
}

export type CreatureState =
  | 'idle'
  | 'wandering'
  | 'seeking_food'
  | 'seeking_water'
  | 'seeking_shelter'
  | 'seeking_warmth'
  | 'bonding'
  | 'fighting'
  | 'fleeing'
  | 'reproducing'
  | 'mourning'
  | 'observing'   // Sentinel behaviour
  | 'dreaming'    // Dreaming at death sites / river
  | 'sick'
  | 'migrating'   // long-range search when local food exhausted
  | 'scavenging'  // consuming a corpse (cannibalism)
  | 'dying'

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
  lightningFlash?: number  // timestamp of last strike — renderer fades bolt/flash after LIGHTNING_VISUAL_DURATION_MS
  elevation?: number       // 0..1 — used for mountain height variation
}

// ─── Season & Time ────────────────────────────────────────────────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'
export type WeatherState = 'clear' | 'rain' | 'storm' | 'drought'

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
}

// SimModifiers — derived from CaretakerProfile at world creation and stored
// in GameState. The tick engine reads these instead of raw constants so the
// profile shapes every subsequent generation without requiring runtime lookups.
export interface SimModifiers {
  foodRegrowMult: number        // ×1.0 default — scales food patch regrowth rate
  droughtDurationMult: number   // ×1.0 default — longer drought phases if > 1
  bondSpeedMult: number         // ×1.0 default — how fast proximity bonds strengthen
  mutationChance: number        // 0.15 default — per discrete gene slot per birth
  sentienceGrowthMult: number   // ×1.0 default — scales all SENTIENCE_GROWTH_BY_MIND values
  awarenessMessageMult: number  // ×1.0 default — scales message cooldown (< 1 = more messages)
  healCharges: number           // 3 default — daily heal uses available to caretaker
  foodDropCooldownMs: number    // 5000 default — ms between food drop actions
  ascensionThresholdOffset: number // 0 default — subtracted from ASCENSION_POPULATION
}

// ─── Caretaker Resources ─────────────────────────────────────────────────────

export interface CaretakerState {
  healCharges: number       // resets to 3 per real day
  lastHealReset: number     // timestamp
  riverRedirectUsed: boolean // resets each season
  lastSeasonRedirect: Season
  foodDropCooldown: number  // ms
  lastFoodDrop: number      // timestamp
  // Environmental intervention tools — each has its own cooldown so the
  // player can't carpet-bomb the colony.
  lastThunder: number       // timestamp of last strike
  lastFire: number          // timestamp of last ignition
  thunderChargesToday: number  // counter resets daily
  fireChargesToday: number
  lastEnvReset: number      // ms timestamp of last daily reset
  // Presence tracking — used for awareness acceleration
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

  // Profile-driven simulation modifiers — set at world creation, never change.
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

  // weather
  weather: WeatherState
  weatherTimer: number  // game days remaining in this weather phase

  // stats
  totalCreaturesEver: number
  totalGenerations: number
  totalDeaths: number
  lastSaved: number
  lastSessionEnd: number | null
}
