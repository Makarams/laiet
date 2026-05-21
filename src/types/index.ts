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
  | 'witnessed_fire'       // was near a burning tile or fire spread
  | 'witnessed_lightning'  // close to a lightning strike or saw the flash
  | 'witnessed_birth'      // adjacent to a birth event
  | 'reached_edge'         // touched the world boundary
  | 'fled_predator'        // entered fleeing state from an Aggressive nearby
  | 'patrolled_perimeter'  // Sentinel finished a perimeter loop without incident

// ─── Death cause tracking ─────────────────────────────────────────────────────
// Real, mechanically attributed cause assigned the tick a creature dies. Drives
// extinction inference and chronicle composition — no prose keyword-matching.
export type DeathCause =
  | 'starvation' | 'dehydration' | 'cold' | 'old_age'
  | 'sickness'   | 'combat'      | 'fire' | 'lightning'
  | 'cannibalized' | 'drowning'  | 'unknown'

// ─── Chronicle — the colony's real memory ────────────────────────────────────
// A bounded log of notable mechanical events the engine actually produced. All
// stage 1–5 colony messages are composed from these entries. If something is
// not in the chronicle, the colony cannot speak about it as if it happened.
export type ChronicleEventKind =
  // Environmental upheaval
  | 'lightning_strike'      // detail: 'auto' | 'storm' | 'caretaker'
  | 'fire_outbreak'         // count = tiles burning at peak
  | 'fire_swept'            // a fire consumed many tiles before burning out
  | 'flood_event'           // count = flooded tiles
  | 'heatwave_onset'        // weather entered heatwave
  | 'drought_breaking'      // long drought ended
  | 'storm_passed'          // storm cleared after sustained duration
  | 'snow_blanket'          // global snow accumulation crossed a threshold
  // Population dynamics
  | 'mass_die_off'          // count = deaths within window; detail = dominant cause
  | 'lineage_extinct'       // a lineage root reached 0 living members
  | 'lineage_fork'          // a new sub-lineage suffix was minted
  | 'hybrid_birth'          // cross-lineage offspring with blended lineageId
  | 'rare_birth'            // mutation phenotype crossed a morphology threshold
  | 'race_emerged'          // detail = race
  | 'race_lost'             // detail = race
  | 'race_revived'          // detail = race
  | 'birth_burst'           // 3+ births in a single tick
  | 'first_in_biome'        // detail = biome
  // Social / cultural
  | 'territory_claimed'     // creature claimed a tile
  | 'kill_recorded'         // combat death attributed
  | 'bond_milestone'        // pair bond crossed 70
  | 'role_emerged'          // detail = role (first time the colony has this role)
  | 'cross_lineage_bond'    // first cross-lineage strong bond between two roots
  // Boundary / awareness
  | 'edge_encounter'        // creature touched a world-edge tile
  | 'patrol_completed'      // Sentinel finished a perimeter sweep
  // Caretaker traces (real, observed by simulation)
  | 'caretaker_food'        // food drop at (x,y)
  | 'caretaker_thunder'     // strike at (x,y)
  | 'caretaker_fire'        // ignition at (x,y)
  | 'caretaker_heal'        // heal applied to creatureId
  | 'caretaker_river'       // river redirect
  | 'caretaker_plant'       // tree planted at (x,y)
  | 'caretaker_returned'    // returned from long absence (detail = hours)
  // Tribe lifecycle
  | 'tribe_formed'          // detail = lineage root, count = member count
  | 'tribe_split'           // detail = parent tribe id, count = new tribe size
  | 'tribe_dissolved'       // detail = former tribe name, count = generations lasted
  // Apex predator emergence
  | 'apex_emerged'          // creatureId+name of the creature crossing apex threshold
  // Subspecies recognition — a lineage has drifted enough in morphology + vocab
  | 'subspecies_recognised' // detail = label, creatureName = representative
  // Weather events that don't share other categories
  | 'windstorm_passed'      // a windstorm cleared
  | 'bloom_began'           // spring abundance pulse started
  | 'ashfall_began'         // ashfall residue period started; count = recent fire count

export interface ChronicleEvent {
  id: string
  kind: ChronicleEventKind
  day: number
  creatureId?: string
  creatureName?: string
  lineageId?: string
  count?: number
  x?: number
  y?: number
  detail?: string
}

// ─── Genetics ────────────────────────────────────────────────────────────────

export type PersonalityTrait =
  | 'Curious' | 'Timid' | 'Aggressive' | 'Lazy' | 'Greedy' | 'Nurturing' | 'Wanderer' | 'Recluse'
  | 'Hoarder' | 'Empath' | 'Furtive' | 'Territorial' | 'Social' | 'Stoic'
  | 'Scavenger' | 'Mimic' | 'Nomadic' | 'Vigilant' | 'Symbiotic'
export type BodyTrait = 'Spore' | 'Shell' | 'Spike' | 'Wisp'
export type MindTrait = 'Feral' | 'Aware' | 'Dreaming' | 'Sentinel'

// Ancestral racial lineage; persists across generations and can re-emerge
// from latent ancestry even after a race has been absent for many generations.
export type RaceTrait = 'Kin' | 'Drift' | 'Burrow' | 'Apex' | 'Pale' | 'Tide' | 'Bloom' | 'Ash'
  | 'Ember' | 'Mire' | 'Crag' | 'Veil'

// Heritable environmental adaptations; acquired at birth from spawn conditions
// and passed to offspring at ADAPTATION_INHERIT_CHANCE per trait (max 3 per creature).
export type AdaptationTrait =
  | 'cold_hardy'       // winter/snow birth → warmth decay ×0.65
  | 'drought_tough'    // arid/drought birth → hunger decay ×0.78
  | 'cave_sighted'     // rocky biome birth → no night warmth penalty; enlarged pale eyes
  | 'hydro_fins'       // wetland birth → thirst decay ×0.55 on wetland/river tiles
  | 'heat_plated'      // heatwave/summer birth → heatwave stress blocked; gold chitin stripe
  | 'storm_braced'     // storm birth → storm stress immune; dark crackle ring
  | 'thick_pelt'       // heavy snowfall in winter birth → broad insulation; warmth drain ×0.60 in all cold/wet weather; storm stress ×0.50
  | 'bioluminescent'   // fog birth → emits faint glow at night; reduces nearby creature stress
  | 'spore_resistant'  // lush+rain birth → disease contact chance ×0.40
  | 'root_eater'       // lush/spring birth → hunger decay ×0.75 on vegetation tiles
  | 'thermal_vent'     // arid+heatwave/drought birth → heatwave stress blocked; gains warmth on hot tiles
  | 'echo_sense'       // rocky+fog/winter birth → no night warmth penalty; navigates dark without penalty
  | 'ridge_armor'      // rocky+storm birth → health loss from combat ×0.70

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

  // Diploid allele pairs: each slot encodes the full genotype; phenotype is resolved via dominance.
  // Optional — saves without alleles treat the expressed trait as homozygous (no behavioral change).
  personalityAlleles?: [PersonalityTrait, PersonalityTrait]
  bodyAlleles?: [BodyTrait, BodyTrait]
  mindAlleles?: [MindTrait, MindTrait]
}

// ─── Creature drives — continuous behavioral tendencies ──────────────────────
// Seven drives seed from personality but drift from actual behavioral history.
// They replace the personality→behavior switch: personality biases the starting
// weights, but what the creature actually does reshapes them over time.
// Range 0..1. Stored as optional for backward compatibility with old saves.
export interface CreatureDrives {
  dominance:   number  // territory-holding, fight-seeking, rival-challenging
  curiosity:   number  // exploration, biome discovery, new-stimulus seeking
  sociality:   number  // bond-seeking, grooming, proximity comfort
  vigilance:   number  // threat-monitoring, perimeter patrol, stress sensitivity
  acquisitive: number  // food-seeking, resource gathering, hoarding
  reclusion:   number  // crowd-avoidance, solitude preference, isolation
  mobility:    number  // long-range movement, migration distance
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
  // Game day this creature last produced offspring; gates the reproduction
  // cooldown so a creature cannot breed every tick. Undefined until the first
  // birth. Optional for backward compatibility with pre-v3.5 saves.
  lastBirthDay?: number
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

  // (fractureFleeUntil removed — fracture response is now read directly from
  // the colony chronicle by behavior.ts; no per-creature stamp needed.)

  immunity?: number            // 0-1; gained after surviving disease; reduces contact chance

  // ─── Biome residence — drives terrain-affinity drive drift ───────────────
  // Counter of ticks spent in each biome over the creature's lifetime.
  // Bidirectional pressure on drives (long lush residence → +sociality; long
  // rocky residence → +vigilance; long arid → +acquisitive; long wetland → +reclusion).
  biomeResidence?: Partial<Record<string, number>>

  // ─── Personal fear memory — perception-based, not engine-tagged ─────────
  // Maps a creature-id → game-day they last did something the creature personally
  // witnessed (kill near them, attack on a peer they bond to). Each entry decays
  // after FEAR_MEMORY_DAYS; while present, the listener flees that specific
  // creature at radius scaled by their own vigilance + memory freshness.
  feared?: Record<string, number>
  // Most recent attacker, used to attribute kills when a creature dies in combat.
  // Set during resolveFight on the loser; cleared after fear marking.
  lastAttackerId?: string

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

  // continuous behavioral drives; seeded from personality, drift from actual history
  drives?: CreatureDrives

  // ─── Lived observation log ────────────────────────────────────────────────
  // Bounded ring of recent things the creature personally observed. Drives
  // speech composition (what tokens they reach for) and message attribution.
  // Pruned to the most recent ~24 entries per creature.
  observedEvents?: {
    kind: ChronicleEventKind | ExperienceEventType
    day: number
    creatureId?: string
    detail?: string
  }[]

  // Mechanical cause of death set at the tick of death. Aggregated into
  // GameState.deathCauseCounts; used by extinction inference and by chronicle
  // composition. Null while alive.
  deathCause?: DeathCause
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
  | 'fence'      // constructed barrier; built by drives + territory claim
  | 'cache'      // stored food/healroot tile; created by acquisitive creatures inside tribal territory
  | 'cairn'      // memorial built at a death site; persists much longer than death_site itself
  | 'nest'       // caretaker-placed nest; nearby pairs get a reproduction-rate boost
  | 'watch_post' // caretaker-placed lookout; nearby creatures gain vigilance drive drift

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
  // ─── Cache (tribal storage) ──
  cacheTribeId?: string | null    // tribe this cache belongs to (null = unaffiliated)
  cacheFruit?: number             // 0..CACHE_MAX_FRUIT; food units stored
  cacheHealroot?: number          // 0..CACHE_MAX_HEALROOT; healroot potency stored
  // ─── Cairn (memorial at death site) ──
  cairnFor?: string | null        // creature id this cairn commemorates
  cairnFamily?: string            // family name preserved beyond the body
  cairnGeneration?: number        // generation depth preserved
  cairnPlacedOnDay?: number       // game-day the cairn was raised
  // ─── Nest (caretaker-placed breeding zone) ──
  nestPlacedOnDay?: number        // game-day the nest was placed (drives slow decay)
  // ─── Watch post (caretaker-placed vigilance amplifier) ──
  watchPlacedOnDay?: number       // game-day the watch post was raised
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
export type WeatherState =
  | 'clear' | 'rain' | 'storm' | 'drought' | 'snow' | 'heatwave' | 'fog'
  // ── Expanded weather, all with distinct mechanical signatures ──
  | 'windstorm'  // dry violent wind; strips fruit, damages bushes, stresses creatures, slows movement
  | 'bloom'      // spring abundance pulse; food_patch and bush regrowth amplified, brief
  | 'ashfall'    // post-fire residue; food regrowth halved, mild stress, triggered by recent fire activity

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
  // Highest member count this tribe ever reached. memberIds shrinks as members
  // die, so its current length understates the tribe's true scale. Optional
  // for backward compatibility with pre-v3.5 saves.
  peakMembers?: number
  territory: { x: number; y: number }[]
  foundedOnDay: number
  color: string // hex for rendering
  tribalLexicon: string[]    // shared vocabulary pool; grows with elder/shaman knowledge, persists through generations
  // Lineage root the tribe coalesced from (most-common at formation time)
  lineageRoot?: string
  // Parent tribe id if this tribe split off from a larger one
  parentTribeId?: string
  // Day the tribe dissolved (members dropped below threshold); null while alive
  dissolvedOnDay?: number | null
  // Centroid maintained per-tick from member positions; used for split detection
  centroidX?: number
  centroidY?: number
}

// ─── Cohort phase ────────────────────────────────────────────────────────────
// Derived from the deepest generation ever born; a permanent ratchet on the
// colony's evolutionary depth. Gates signal depth 4 and 5.
export type CohortPhase = 1 | 2 | 3 | 4 | 5

// ─── Messages ────────────────────────────────────────────────────────────────

export type MessageStage = 1 | 2 | 3 | 4 | 5

// Three-tier message bucket. Drives the MessageLogPanel tabs. Older saves
// without the field are categorised at read time by stage + content.
export type MessageCategory = 'general' | 'important' | 'event'

export interface ColonyMessage {
  id: string
  text: string
  stage: MessageStage
  creatureId: string | null
  day: number
  timestamp: number
  read: boolean
  category?: MessageCategory
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
  extinctionCause: 'neglect' | 'war' | 'drought' | 'flood' | 'winter' | 'starvation' | 'heatwave' | 'old_age'
  peakPopulation: number
  generationsReached: number
  finalMessage: string | null
  creatureCount: number
  notableCreatures: { name: string; traits: Genome; age: number }[]
}

// ─── Caretaker Profile ────────────────────────────────────────────────────────
// Set once before the world is created. Shapes how the simulation behaves
// throughout the entire playthrough. Each field maps to a ProfileScreen question.

// Each profile field controls an orthogonal slice of the simulation. There is
// no overlap: changing Focus does not change what World controls. Every choice
// has a meaningful trade-off — no "neutral" option is strictly better.
//
// Presence    → caretaker capability (tool charges, cooldowns, intervention reach)
// World       → environment baseline (food, water, weather severity, disease pressure)
// Evolution   → genetic rates (mutation, adaptation inheritance, morphology drift)
// Focus       → colony social emphasis (bond speed, tribe formation, enrichment density)
// Expectation → narrative arc bias (lineage hostility baseline, fracture timing)
// Visibility  → how the colony perceives you (caretaker_contact reach, awareness messages)
export interface CaretakerProfile {
  // The 'presence' axis was removed: caretaker actions are unlimited by default
  // and soft-balanced by the actionLoad pressure curve in CaretakerState.
  // Field kept optional for save-file backward compatibility only — ignored by
  // computeSimModifiers.
  presence?:   'interventionist' | 'observer' | 'silent'
  world:       'fertile' | 'varied' | 'scarce'
  evolution:   'fast' | 'drift' | 'slow'
  focus:       'bonds' | 'survival' | 'awareness'
  expectation: 'persistence' | 'adaptation' | 'fracture'
  visibility:  'attentive' | 'neutral' | 'hidden'
  // ── Sixth defining parameter ──
  // Scales MAX_AGE_BY_BODY across the whole colony. Short = generations roll
  // over quickly, evolution surfaces fast, individual lives feel brief.
  // Long = patient observation, individuals leave deeper marks, but the
  // colony evolves slowly and is more vulnerable to environmental shifts.
  lifespan?:   'brief' | 'standard' | 'long'
}

// SimModifiers; derived from CaretakerProfile at world creation and stored
// in GameState. The tick engine reads these instead of raw constants so the
// profile shapes every subsequent generation without requiring runtime lookups.
// All multipliers default to 1.0; setting-derived deltas compound from there.
export interface SimModifiers {
  foodRegrowMult: number          // ×1.0 default; scales food patch regrowth rate
  droughtDurationMult: number     // ×1.0 default; longer drought phases if > 1
  bondSpeedMult: number           // ×1.0 default; how fast proximity bonds strengthen
  mutationChance: number          // base per discrete gene slot per birth
  sentienceGrowthMult: number     // ×1.0 default; scales all SENTIENCE_GROWTH_BY_MIND values
  awarenessMessageMult: number    // ×1.0 default; scales message cooldown (< 1 = more messages)
  // healCharges / foodDropCooldownMs retained as optional save-compat fields
  // only — the gating system was replaced with actionLoad. Engine never reads them.
  healCharges?: number
  foodDropCooldownMs?: number
  // ── New axes (defaults present so pre-existing saves keep working) ──
  weatherSeverityMult?: number    // ×1.0 default; storm/heatwave/windstorm duration & damage
  diseasePressureMult?: number    // ×1.0 default; multiplies DISEASE_CONTACT_CHANCE
  tribeFormationMult?: number     // ×1.0 default; how readily lineage clusters coalesce into named tribes
  enrichmentSpawnMult?: number    // ×1.0 default; natural enrichment item spawn frequency
  lineageHostilityBaseline?: number // 0 default; starting bias for new lineageRelations entries (-25..+25)
  fractureEligibilityMult?: number  // ×1.0 default; multiplies how readily sustained conflict triggers fracture
  adaptationInheritMult?: number    // ×1.0 default; scales ADAPTATION_INHERIT_CHANCE
  morphologyDriftMult?: number      // ×1.0 default; scales per-birth morphology variance
  caretakerVisibilityMult?: number  // ×1.0 default; scales radius/window for caretaker_contact registration
  // ── Sixth axis: lifespan ──
  lifespanMult?: number            // ×1.0 default; multiplies MAX_AGE_BY_BODY for all bodies
}

// ─── Caretaker Resources ─────────────────────────────────────────────────────

export interface CaretakerState {
  // ── Anti-spam timing only — no longer gates anything semantically ──
  lastActionMs: number               // timestamp of most-recent action (any tool)
  lastActionX: number | null         // last action position (presence radius for awareness)
  lastActionY: number | null
  // ── Soft pressure curve — replaces all per-tool daily charges ──
  // Each caretaker action adds an ACTION_LOAD_WEIGHTS[tool] amount to actionLoad.
  // actionLoad decays toward 0 at ACTION_LOAD_DECAY_PER_TICK every simulation tick.
  // High actionLoad doesn't block anything — it informs the colony that the
  // caretaker is intervening heavily, which the engine reads as ambient stress
  // bleed on creatures within recent action sites. There is no daily reset and
  // no charge counter. Actions are always available.
  actionLoad: number                 // 0..100 (soft, can briefly exceed 100 under burst)
  // Optional carried-bush state — see bushAction in store.
  bushHeldFood?: number | null
  // ── Tool-as-answer mechanic (unchanged) ──
  awaitingResponseUntil: number
  respondedToQuestion: boolean
  lastToolUsed?: 'placement' | 'intervention' | 'observe'
  // Legacy fields preserved only so old saves deserialize cleanly; engine ignores.
  healCharges?: number
  lastHealReset?: number
  riverRedirectUsed?: boolean
  lastSeasonRedirect?: Season
  foodDropCooldown?: number
  lastFoodDrop?: number
  lastThunder?: number
  lastFire?: number
  thunderChargesToday?: number
  fireChargesToday?: number
  lastEnvReset?: number
  fenceChargesToday?: number
  cairnChargesToday?: number
  nestChargesToday?: number
  watchChargesToday?: number
  lastFencePlaced?: number
  lastCairnPlaced?: number
  lastNestPlaced?: number
  lastWatchPlaced?: number
  lastBushAction?: number
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
  snowBlanketBaseline?: number  // slowly-drifted reference for snow_blanket delta detection

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
  absenceHardship?: number     // hardship score during the absence (deaths+fires+lightnings); 0 = thrived
  tribeWarStart?: number       // game day when sustained inter-lineage conflict began

  // ─── Lineage relations ────────────────────────────────────────────────────
  // Per-pair relationship score between lineage IDs. Key = "lineageA:lineageB" (sorted).
  // Starts neutral (0). Shared offspring, cross-lineage bonds, and cohabitation push positive.
  // Combat and proximity stress push negative. Range: -100..100.
  lineageRelations?: Record<string, number>

  // neglect & legendary tracking — optional for backward compat
  lastNeglectWarning?: number  // game day of last neglect warning message
  legendaryFired?: string[]    // creature IDs that have already had legendary events

  // ─── Colony chronicle — real events used to compose colony speech ────────
  // Bounded ring of notable mechanical events. Stage 1–5 messages are
  // composed from these entries; if an event is not in here, the colony
  // cannot reference it. Capped at ~150 events (drop oldest).
  colonyChronicle?: ChronicleEvent[]

  // Per-cause death totals over the colony's lifetime. Used by extinction
  // inference instead of keyword-scanning prose. Increments at each death.
  deathCauseCounts?: Partial<Record<DeathCause, number>>

  // Set of (kind|lineageId|raceName) markers that have already been recorded
  // as "first" events, so we don't re-fire role_emerged / first_in_biome /
  // race_emerged for the same instance.
  chronicleSeen?: Record<string, true>

  // stats
  totalCreaturesEver: number
  totalGenerations: number
  totalDeaths: number
  // Peak concurrent living population, and the game day it was reached.
  // Distinct from totalCreaturesEver (cumulative births ever). Optional for
  // backward compatibility with pre-v3.5 saves.
  peakPopulation?: number
  peakPopulationDay?: number
  lastSaved: number
  lastSessionEnd: number | null

  // ─── Incremental tile-type counters ──────────────────────────────────────
  // Maintained by tickTiles so it never has to do an O(WORLD_SIZE^2) pre-count
  // pass each tick just to know how many trees/bushes/etc exist for cap gating.
  // Initialised in worldGen; missing/undefined falls back to a one-time scan.
  tileTypeCount?: Partial<Record<TileType, number>>
}