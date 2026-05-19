import { v4 as uuid } from 'uuid'
import {
  GameState, Creature, GameEvent, EventType, Season, WeatherState,
  ExtinctionRecord, ColonyMessage, SimModifiers, RaceTrait,
  EnrichmentItem, EnrichmentType, EnvContext, CohortPhase, DeathCause, TileType,
} from '@/types'
import { pushChronicle, recordObservation, recordDeathCause } from '@/engine/chronicle'
import {
  DAY_FRACTION_PER_TICK, DAYS_PER_SEASON, FOOD_REGROW_RATE_BASE,
  FOOD_REGROW_MULTIPLIER, TREE_GROW_DAYS, WATER_REPLENISH_RATE, WATER_DRINK_DRAIN,
  WORLD_SIZE, BOND_STRENGTH_PER_TICK, DEBUG,
  DEATH_SITE_DECAY_DAYS,
  CANNIBAL_HUNGER_THRESHOLD, CANNIBAL_HUNGER_RELIEF,
  CANNIBAL_STRESS_PENALTY, CANNIBAL_WITNESS_STRESS,
  DISEASE_POP_THRESHOLD, DISEASE_POP_SLOPE_RANGE, DISEASE_CONTACT_CHANCE, DISEASE_HEALTH_DRAIN, DISEASE_RECOVERY_HEALTH,
  DISEASE_IMMUNITY_GAIN, DISEASE_IMMUNITY_PROTECTION, DISEASE_BOND_SPREAD_MULT,
  RIVER_FOOD_ADJACENT_BONUS,
  ABSENCE_IMPRINT_STRESS_PER_TICK,
  RIVAL_PROXIMITY_RADIUS, RIVAL_STRESS_PER_TICK,
  TRIBE_WAR_FIGHT_CHANCE, TRIBE_WAR_SUSTAIN_DAYS,
  FIRE_DURATION_TICKS, FIRE_SPREAD_CHANCE, FIRE_TICK_DAMAGE,
  FENCE_INITIAL_DURABILITY, FENCE_STRESS_RADIUS, FENCE_DECAY_BASE, FENCE_DECAY_STORM,
  ASEXUAL_BASE_CHANCE, REPRODUCE_BOND_MIN_STRENGTH,
  AUTO_LIGHTNING_CHANCE, AUTO_LIGHTNING_DAMAGE, CAVE_WARMTH_BONUS,
  WEATHER_DURATION, RAIN_WATER_BONUS, RAIN_THIRST_REDUCTION, RAIN_FOOD_BONUS,
  STORM_LIGHTNING_CHANCE, DROUGHT_WATER_DRAIN, DROUGHT_THIRST_PENALTY,
  DROUGHT_FOOD_FACTOR, THIRST_DECAY, HUNGER_DECAY,
  HEATWAVE_THIRST_MULT, HEATWAVE_STRESS_PER_TICK, HEATWAVE_FOOD_EXTRA_DECAY,
  FOG_THIRST_REDUCTION, FOG_STRESS_RELIEF,
  HEAT_PLATED_THIRST_BLOCK, STORM_STRESS_PER_TICK, RAIN_WARMTH_DRAIN,
  THICK_PELT_WARMTH_MULT, THICK_PELT_STORM_STRESS_MULT,
  HEATWAVE_FIRE_CHANCE,
  // new weather: windstorm / bloom / ashfall
  WINDSTORM_STRESS_PER_TICK, WINDSTORM_FRUIT_DROP_CHANCE, WINDSTORM_FRUIT_LOSS,
  WINDSTORM_BUSH_DAMAGE_CHANCE,
  BLOOM_FOOD_REGROW_MULT, BLOOM_PATCH_SPAWN_MULT, BLOOM_BUSH_REGROW_MULT, BLOOM_STRESS_RELIEF,
  ASHFALL_FIRE_THRESHOLD, ASHFALL_LOOKBACK_DAYS, ASHFALL_FOOD_REGROW_MULT, ASHFALL_STRESS_PER_TICK,
  // tribe formation & apex
  TRIBE_FORMATION_CHECK_INTERVAL, TRIBE_FORM_MIN_MEMBERS, TRIBE_FORM_RADIUS,
  TRIBE_FORM_MIN_BOND_STRENGTH, TRIBE_FORM_MIN_BOND_FRACTION,
  TRIBE_DISSOLVE_MIN_MEMBERS, TRIBE_SPLIT_MIN_MEMBERS, TRIBE_SPLIT_CENTROID_GAP,
  FEAR_WITNESS_RADIUS, FEAR_MEMORY_DAYS, FEAR_BONDED_LOSS_BOOST,
  // seasonal food sources
  SPRING_BLOOM_CHANCE, SPRING_BLOOM_RAIN_MULT, SPRING_BLOOM_FOOD, SPRING_BLOOM_BIOME_BIAS,
  SUMMER_RIPARIAN_CHANCE, SUMMER_RIPARIAN_FOOD,
  AUTUMN_WINDFALL_CHANCE, AUTUMN_WINDFALL_FOOD, AUTUMN_MUSHROOM_CHANCE, AUTUMN_MUSHROOM_FOOD,
  WINTER_LICHEN_CHANCE, WINTER_LICHEN_FOOD, WINTER_LICHEN_CAVE_RADIUS,
  WARMTH_DECAY_BASE, WARMTH_DECAY_WINTER,
  CARETAKER_PRESENCE_RADIUS, CARETAKER_PRESENCE_WINDOW_MS,
  BONE_MEMORY_RADIUS,
  QUESTION_RESPONSE_WINDOW_MS,
  TREE_FOOD_DROP_CHANCE, TREE_FOOD_RADIUS, TREE_FOOD_MATURE_AGE, TREE_APPLE_MAX_PER_TILE,
  PLAY_DURATION_TICKS, PLAY_STRESS_REDUCTION,
  NATURAL_CAVE_STRESS_REDUCTION, NATURAL_RIVER_STRESS_REDUCTION,
  NATURAL_TREE_STRESS_REDUCTION, NATURAL_ROCKY_SENTINEL_BONUS,
  NATURAL_BUSH_STRESS_REDUCTION, BUSH_FOOD_MAX, BUSH_FOOD_REGROW_RATE,
  // vegetation lifecycle
  TREE_PEAK_AGE, TREE_WITHER_AGE, TREE_DECAY_AGE,
  BUSH_WITHER_CHANCE, BUSH_REGROW_CHANCE,
  VEG_TREE_CAP, VEG_BUSH_CAP, FOOD_PATCH_CAP,
  RIVER_EROSION_CHANCE, RIVER_DRYING_CHANCE, RIVER_WINTER_FLOOD_CHANCE,
  FRUIT_DECAY_RATE, FRUIT_OVERPRODUCTION_CAP, TREE_SEED_CHANCE,
  // rain / puddles / snow
  PUDDLE_FORM_THRESHOLD, PUDDLE_ACCUMULATE_RATE, PUDDLE_EVAPORATE_RATE, PUDDLE_THIRST_RELIEF,
  PUDDLE_FLOW_CHANCE, RIVER_OVERFLOW_CHANCE,
  SNOW_ENABLED, SNOW_ACCUMULATE_RATE, SNOW_MELT_RATE, SNOW_MAX_DEPTH,
  SNOW_MOVE_PENALTY, SNOW_WARMTH_DRAIN,
  SNOW_WINTER_FROST_RATE, SNOW_WINTER_FROST_CAP,
  SNOW_SPREAD_CHANCE, SNOW_SPREAD_THRESHOLD, SNOW_SPREAD_AMOUNT,
  SNOW_BIOME_FACTOR, SNOW_BIOME_MELT_FACTOR,
  // healroot
  HEALROOT_REGROW_RATE, HEALROOT_MAX_AMOUNT,
  HEALROOT_SEEK_HEALTH, HEALROOT_CARRY_HEAL, HEALROOT_DEATH_SITE_RADIUS, HEALROOT_DEATH_SPAWN_CHANCE,
  HEALROOT_WITHER_THRESHOLD, HEALROOT_WITHER_CHANCE, HEALROOT_CAP,
  FRUIT_MAX_AGE,
  // micro-animations
  MICRO_ANIM_TRIGGER_CHANCE,
  // bond grief
  DEAD_BOND_FADE_PER_TICK,
  // solar warmth
  SOLAR_WARMTH_BONUS,
  // winter huddling + weather breeding
  HUDDLE_WARMTH_BONUS,
  // cannibal trauma
  CANNIBAL_TRAUMA_DURATION_DAYS, CANNIBAL_TRAUMA_STRESS_PER_TICK,
  // cohort phase thresholds (awareness stage 3-5 still depend on cohort depth)
  COHORT_PHASE_THRESHOLDS,
  // neglect & legendary
  NEGLECT_WARMTH_THRESHOLD, NEGLECT_HUNGER_THRESHOLD, NEGLECT_MIN_AFFECTED, NEGLECT_WARNING_COOLDOWN,
  LEGENDARY_AGE_MULT, LEGENDARY_OFFSPRING_MIN, LEGENDARY_LINEAGE_GEN_MIN,
  // enrichment idle decay
  ENRICHMENT_IDLE_DECAY_DAYS,
  // natural enrichment spawning
  NATURAL_ENRICHMENT_SPAWN_CHANCE, NATURAL_ENRICHMENT_ATTEMPTS_PER_TICK,
  NATURAL_ENRICHMENT_MAX_USES, NATURAL_ENRICHMENT_REGEN_RADIUS,
  NATURAL_ENRICHMENT_CAP_BASE, NATURAL_ENRICHMENT_CAP_PER_N_ALIVE, NATURAL_ENRICHMENT_CAP_MAX,
  NATURAL_ENRICHMENT_AMBIENT_CAP,
  NATURAL_ENRICHMENT_BIOME_TYPES, NATURAL_ENRICHMENT_SEASON_MOD,
  // build-kit constants
  CAIRN_DECAY_DAYS, CAIRN_STRESS_RADIUS, CAIRN_STRESS_RELIEF,
  NEST_RADIUS, NEST_BREED_MULT, NEST_OFFSPRING_HEALTH, NEST_DECAY_DAYS, NEST_STRESS_RELIEF,
  WATCH_POST_RADIUS, WATCH_POST_VIGILANCE_DRIFT, WATCH_POST_DECAY_DAYS,
  // soft action-load pressure (replaces daily charges)
  ACTION_LOAD_DECAY_PER_TICK, ACTION_LOAD_STRESS_THRESHOLD,
  ACTION_LOAD_STRESS_PER_TICK, ACTION_LOAD_STRESS_RADIUS,
  // periodic tile-count resync (absorbs drift from out-of-tickTiles writes)
  TILE_COUNT_RESYNC_TICKS,
  // new adaptation/race effect constants
  THERMAL_VENT_WARMTH_GAIN, BIOLUMINESCENT_STRESS_RADIUS, BIOLUMINESCENT_STRESS_RELIEF,
  SPORE_RESISTANT_DISEASE_MULT, MIRE_DISEASE_RESIST,
  EMBER_FIRE_STRESS_RELIEF, VEIL_FOG_STRESS_RELIEF,
} from './constants'
import {
  tickNeeds, tickBehavior, tickMovement,
  eatFromTile, drinkFromTile, healFromRoot, applyGroomingEffect,
  canReproduce, canAsexuallyReproduce, resolveFight, applyEnrichmentEffect,
} from '@/creatures/behavior'
import { DEFAULT_MODIFIERS } from '@/engine/profile'
import { createOffspring, createAsexualOffspring, getColonyStage, recordExperience } from '@/creatures/factory'
import { generateMessage, deathMessage, extinctionMessage, boneMemoryMessage, generateRaceRevivalMessage, neglectWarningMessage, legendaryMessage } from './messages'
import { createRng, buildTileIndex } from '@/world/worldGen'
import { deriveSpeechFocus, composeUtterance, learnFromNearby, unlockTierEmoji, assignRole } from '@/engine/speech'
import { mark as profMark, isProfilerEnabled } from '@/engine/profiler'
import { buildCreatureGrid, nearbyCreatures } from '@/engine/spatial'

// ─── Experiential symbol acquisition ─────────────────────────────────────────
// One table — every condition a creature can live through and acquire a symbol
// for. Predicate evaluated per-creature per-tick against their current tile and
// world state. Compared to scattered handpicked if-blocks for fire/lightning/
// drought, this is uniform: every meaningful condition belongs here.

type SymbolPredicate = (c: Creature, tile: import('@/types').Tile | undefined, state: GameState) => boolean
const EXPERIENTIAL_SYMBOL_TABLE: ReadonlyArray<readonly [SymbolPredicate, string]> = [
  // Surviving fire encodes the fire symbol
  [(c, t) => (t?.burning ?? 0) > 0 && c.health > 0, '🔥'],
  // Witnessing a lightning flash encodes the lightning symbol
  [(_c, t) => (t?.lightningFlash ?? 0) > Date.now() - 3000, '⚡'],
  // Suffering drought thirst encodes the dry-grass symbol
  [(c, _t, s) => s.weather === 'drought' && c.thirst > 70, '🌾'],
  // Standing in deep snow encodes the snow symbol
  [(_c, t) => (t?.snowDepth ?? 0) > 0.5, '❄️'],
  // Standing in storm rain encodes the storm symbol
  [(_c, _t, s) => s.weather === 'storm', '🌩️'],
  // Standing on a death site encodes the bone symbol
  [(_c, t) => t?.type === 'death_site', '🦴'],
  // Standing on healroot while sick encodes the herb symbol
  [(c, t) => t?.type === 'healroot' && (c.state === 'sick' || c.health < 50), '🌿'],
  // Standing on a flood tile encodes the flood-water symbol
  [(_c, t) => t?.type === 'flooded' || ((t?.puddleLevel ?? 0) > 0.6), '🌊'],
  // Heatwave thirst encodes the heat symbol
  [(c, _t, s) => s.weather === 'heatwave' && c.thirst > 60, '🥵'],
  // Long winter cold encodes the freezing-body symbol
  [(c, _t, s) => s.time.season === 'winter' && c.warmth < 25, '🥶'],
  // Being on a high-elevation rocky tile encodes the mountain symbol
  [(_c, t) => t?.biome === 'rocky' && (t?.elevation ?? 0) > 0.5, '🏔️'],
  // Being on a lush tile in spring encodes the bloom symbol
  [(_c, t, s) => t?.biome === 'lush' && s.time.season === 'spring', '🌸'],
  // Being on an autumn tree tile encodes the leaf-fall symbol
  [(_c, t, s) => (t?.type === 'tree' || t?.type === 'shelter') && s.time.season === 'autumn', '🍂'],
  // Being inside a cave encodes the rock-shelter symbol
  [(_c, t) => t?.type === 'cave', '🪨'],
  // Being on a fence tile (constructed object) encodes the built-structure symbol
  [(_c, t) => t?.type === 'fence', '🪸'],
]

// ─── Awareness stage condition evaluator ─────────────────────────────────────
// Returns the highest stage whose underlying creature-level conditions are
// currently true. Each condition is a direct read of distribution (median
// sentience, role count, lineage diversity), not a weighted sum of signals.
// Stage actually changes only after persistence hysteresis (see tickSimulation).

function evaluateStageConditions(state: GameState, alive: Creature[]): import('@/types').MessageStage {
  if (alive.length === 0) return 1
  const nonFeral = alive.filter(c => c.genome.mind !== 'Feral')
  if (nonFeral.length === 0) return 1

  // Stage 2 — at least 3 distinct community roles are held by living creatures.
  // Specialization has emerged; the colony is no longer a homogeneous mass.
  const distinctRoles = new Set(alive.map(c => c.role).filter(r => r !== undefined)).size
  const cond2 = distinctRoles >= 3 && alive.length >= 8

  // Stage 3 — shared vocabulary AND meaningful median sentience.
  // A single sentient outlier no longer counts; the colony's middle has awakened.
  const colonyVocab = new Set<string>()
  for (const c of alive) for (const e of c.knownEmoji) colonyVocab.add(e)
  const sortedSent = nonFeral.map(c => c.sentience).sort((a, b) => a - b)
  const median = sortedSent[Math.floor(sortedSent.length / 2)] ?? 0
  const cond3 = cond2 && colonyVocab.size >= 25 && median >= 25

  // Stage 4 — generational depth with multi-lineage cognition.
  const deepCount = nonFeral.filter(c => c.sentience >= 60).length
  const lineages = new Set(alive.map(c => c.lineageId)).size
  const cond4 = cond3 && deepCount >= 2 && lineages >= 2 && (state.cohortPhase ?? 1) >= 3

  // Stage 5 — a culturally-anchored elder of full sentience with deep bonds,
  // and the cohort itself has reached eternal depth.
  const transcendent = nonFeral.some(c =>
    c.sentience >= 85
    && (c.role === 'elder' || c.role === 'shaman')
    && c.bonds.filter(b => b.strength >= 30).length >= 2
  )
  const cond5 = cond4 && transcendent && (state.cohortPhase ?? 1) >= 5

  if (cond5) return 5
  if (cond4) return 4
  if (cond3) return 3
  if (cond2) return 2
  return 1
}

// ─── Tick entry point ─────────────────────────────────────────────────────────

export function tickSimulation(state: GameState): GameState {
  const _rng = createRng(Math.floor(Date.now()) % 999999)
  // Backward-compat: old saves without modifiers fall back to defaults.
  const mods = state.modifiers ?? DEFAULT_MODIFIERS

  // Profiler is module-level; calls early-return when disabled so the
  // arithmetic + closure cost is amortised across all phases regardless.
  const _profOn = isProfilerEnabled()
  const _tStart = _profOn ? performance.now() : 0
  // helper: time a phase. Inlined where called so V8 keeps closure-free.
  const tStamp = () => (_profOn ? performance.now() : 0)

  let next: GameState = {
    ...state,
    modifiers: mods,
    weather: state.weather ?? 'clear',
    weatherTimer: state.weatherTimer ?? 20,
    enrichmentItems: state.enrichmentItems ?? {},
    creatures: { ...state.creatures },
    messages: [...state.messages],
    events: [...state.events],
  }

  let _t = tStamp()
  next = tickTime(next);                                      if (_profOn) { profMark('time', tStamp() - _t); _t = tStamp() }
  next = tickWeather(next, mods, _rng);                       if (_profOn) { profMark('weather', tStamp() - _t); _t = tStamp() }
  const prevWeather = state.weather ?? 'clear'
  next = tickTiles(next, mods);                               if (_profOn) { profMark('tiles', tStamp() - _t); _t = tStamp() }
  // Chronicle weather phase transitions — heatwave onset, drought breaking,
  // storms passing. The colony notices these large environmental shifts.
  if (next.weather !== prevWeather) {
    if (next.weather === 'heatwave') {
      next = pushChronicle(next, { kind: 'heatwave_onset', day: next.time.day })
    } else if (prevWeather === 'drought' && next.weather !== 'drought') {
      next = pushChronicle(next, { kind: 'drought_breaking', day: next.time.day })
    } else if (prevWeather === 'storm' && next.weather !== 'storm') {
      next = pushChronicle(next, { kind: 'storm_passed', day: next.time.day })
    } else if (prevWeather === 'windstorm' && next.weather !== 'windstorm') {
      next = pushChronicle(next, { kind: 'windstorm_passed', day: next.time.day })
    } else if (next.weather === 'bloom') {
      next = pushChronicle(next, { kind: 'bloom_began', day: next.time.day })
    } else if (next.weather === 'ashfall') {
      // Count the recent fires that triggered the ashfall so the chronicle
      // records the evidence basis for the entry.
      let recentFires = 0
      const chronForCount = next.colonyChronicle ?? []
      const today = next.time.day
      for (let i = chronForCount.length - 1; i >= 0; i--) {
        if (today - chronForCount[i].day > ASHFALL_LOOKBACK_DAYS) break
        if (chronForCount[i].kind === 'fire_outbreak' || chronForCount[i].kind === 'fire_swept') recentFires++
      }
      next = pushChronicle(next, { kind: 'ashfall_began', day: next.time.day, count: recentFires })
    }
  }
  // Snow blanket: chronicle on a meaningful delta, not a fixed threshold.
  // Either the world is now substantially snowier than recent baseline, or
  // it has crossed an absolute heavy-cover line. Baseline is the snow level
  // a few ticks ago (snowBlanketBaseline), refreshed at slow drift.
  {
    const now = next.snowAccumulation ?? 0
    const prevAbs = state.snowAccumulation ?? 0
    const baseline = state.snowBlanketBaseline ?? now
    const crossedAbsolute = now >= 60 && prevAbs < 60
    const crossedRelative = now - baseline >= 25 && now >= 30
    if (crossedAbsolute || crossedRelative) {
      next = pushChronicle(next, { kind: 'snow_blanket', day: next.time.day, count: now })
      next.snowBlanketBaseline = now
    } else {
      // Drift baseline slowly toward current so the "delta" measure tracks
      // gradual seasonal change rather than instant accumulation.
      next.snowBlanketBaseline = baseline + (now - baseline) * 0.02
    }
  }
  // snowAccumulation is computed inside tickTiles to avoid a redundant tile scan.
  const deathsBefore = next.totalDeaths
  // Single pre-tick pass over creatures. mass-die-off check + reproduction's
  // popFactor both read the alive-count baseline; sharing the iteration is
  // free and removes 2 of the 14 Object.values+filter pairs the profiler
  // flagged.
  let alivePreDeath = 0
  for (const id in next.creatures) {
    if (next.creatures[id].diedOnDay === null) alivePreDeath++
  }
  _t = tStamp()
  next = tickCreatures(next, _rng, mods);                     if (_profOn) { profMark('creatures', tStamp() - _t); _t = tStamp() }
  const deathsThisTick = next.totalDeaths - deathsBefore
  // Population-scaled mass die-off threshold. 8% of the colony in one tick is
  // "mass" regardless of scale; floored at 3 so very small colonies still register.
  const massThreshold = Math.max(3, Math.floor(alivePreDeath * 0.08))
  if (deathsThisTick >= massThreshold) {
    // Mass die-off — find dominant cause from creatures that died today
    const today = next.time.day
    const causeCount: Record<string, number> = {}
    for (const id in next.creatures) {
      const d = next.creatures[id]
      if (d.diedOnDay !== today) continue
      const c = d.deathCause ?? 'unknown'
      causeCount[c] = (causeCount[c] ?? 0) + 1
    }
    const dominantCause = Object.entries(causeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown'
    next = pushChronicle(next, {
      kind: 'mass_die_off', day: next.time.day,
      count: deathsThisTick, detail: dominantCause,
    })
  }

  // Reuse the pre-tick count minus this tick's deaths to derive aliveNow.
  // Births haven't happened yet in this tick — they fire next.
  const aliveNow = alivePreDeath - deathsThisTick
  // popFactor: 1.0 below threshold; slopes to 0.20 minimum at threshold + DISEASE_POP_SLOPE_RANGE (120).
  // Widened from the old /55 slope so reproduction stays meaningful up to and past ascension (80).
  const popFactor = aliveNow > DISEASE_POP_THRESHOLD
    ? Math.max(0.20, 1 - (aliveNow - DISEASE_POP_THRESHOLD) / DISEASE_POP_SLOPE_RANGE)
    : 1.0

  _t = tStamp()
  next = tickReproduction(next, _rng, popFactor);             if (_profOn) { profMark('reproduction', tStamp() - _t); _t = tStamp() }
  next = tickTribeFormation(next, mods);                      if (_profOn) { profMark('tribeFormation', tStamp() - _t); _t = tStamp() }
  next = tickTribes(next);                                    if (_profOn) { profMark('tribes', tStamp() - _t); _t = tStamp() }
  next = tickEnrichment(next, _rng);                          if (_profOn) { profMark('enrichment', tStamp() - _t); _t = tStamp() }
  next = tickNaturalEnrichment(next, _rng, mods);             if (_profOn) { profMark('naturalEnrichment', tStamp() - _t); _t = tStamp() }

  // Single alive pass shared by colony stage, awareness tracking, and vocab window.
  const aliveAfterReproduction = Object.values(next.creatures).filter(c => !c.diedOnDay)
  const liveCount = aliveAfterReproduction.length
  next.colonyStage = getColonyStage(liveCount) as GameState['colonyStage']

  // ── Cohort phase — permanent generational ratchet ──────────────────────────
  // Derived from totalGenerations (max generation ever born). Never decreases.
  // Gates signal depth 4 (phase ≥ 4) and depth 5 (phase ≥ 5).
  {
    const g = next.totalGenerations
    const newPhase: CohortPhase =
      g >= COHORT_PHASE_THRESHOLDS[5] ? 5 :
      g >= COHORT_PHASE_THRESHOLDS[4] ? 4 :
      g >= COHORT_PHASE_THRESHOLDS[3] ? 3 :
      g >= COHORT_PHASE_THRESHOLDS[2] ? 2 : 1
    next.cohortPhase = Math.max(next.cohortPhase ?? 1, newPhase) as CohortPhase
  }

  // ── Awareness from creature-level distribution + persistence ─────────────
  // No smoothed signal-meter. Each stage's underlying condition is evaluated
  // directly from creature state every tick. The stage label only changes
  // when the target condition has held for HOLD_TICKS (advance) or failed for
  // FAIL_TICKS (regression). cognitionPressure is repurposed as the +/-
  // persistence counter — positive counts toward an advance, negative toward
  // regression — so a colony can't flicker stages from a noisy single tick.
  {
    const targetStage = evaluateStageConditions(next, aliveAfterReproduction)
    const currentStage = next.awarenessStage ?? 1
    const HOLD_TICKS = 80  // ~1.3 in-game days of sustained condition to advance
    const FAIL_TICKS = 200 // ~3.3 in-game days of failure to regress (asymmetric)

    let counter = next.cognitionPressure ?? 0
    if (targetStage > currentStage) {
      counter = Math.max(0, counter) + 1
      if (counter >= HOLD_TICKS) {
        next.awarenessStage = (currentStage + 1) as typeof next.awarenessStage
        counter = 0
      }
    } else if (targetStage < currentStage) {
      counter = Math.min(0, counter) - 1
      if (-counter >= FAIL_TICKS) {
        next.awarenessStage = (currentStage - 1) as typeof next.awarenessStage
        counter = 0
      }
    } else {
      // Target matches current; decay the counter back toward 0
      counter = counter > 0 ? counter - 1 : counter < 0 ? counter + 1 : 0
    }
    next.cognitionPressure = counter
  }

  _t = tStamp()
  // (awareness/cohort/legendary blocks above are folded into the 'awareness' phase)
  if (_profOn) { profMark('awareness', tStamp() - _t); _t = tStamp() }
  next = tickCaretaker(next, mods);                            if (_profOn) { profMark('caretaker', tStamp() - _t); _t = tStamp() }
  next = checkEndgame(next, mods);                             if (_profOn) { profMark('endgame', tStamp() - _t) }
  if (_profOn) profMark('total', tStamp() - _tStart)

  // ── Neglect warning — colony distress accumulator ─────────────────────────
  // The colony doesn't get surveilled by the engine and notified by threshold.
  // Instead, creature distress accumulates in a colony-wide signal that the
  // colony itself "notices" when it reaches a meaningful level. The message
  // reflects the colony's self-awareness of crisis, not an engine alert.
  // This also prevents the hair-trigger threshold system from firing on noise.
  {
    const alive = aliveAfterReproduction
    if (alive.length >= 2) {
      // Accumulate distress signals from creature states every tick.
      // The accumulator rises when creatures are in genuine crisis and falls when
      // conditions improve. The colony "speaks" when the accumulator crosses a
      // threshold — meaning the crisis has been sustained long enough to be real.
      const coldFrac  = alive.filter(c => c.warmth < NEGLECT_WARMTH_THRESHOLD).length / alive.length
      const hungryFrac = alive.filter(c => c.hunger > NEGLECT_HUNGER_THRESHOLD).length  / alive.length
      const stressedFrac = alive.filter(c => c.stress > 75).length / alive.length

      // Each tick: crisis fractions contribute +0.5..+2.0 per tick;
      // absence of crisis decays the accumulator by 0.3
      const crisisInput = (coldFrac * 1.5 + hungryFrac * 2.0 + stressedFrac * 0.8)
      const acc = next.colonyDistressAccumulator ?? 0
      const newAcc = crisisInput > 0.1
        ? Math.min(100, acc + crisisInput * 0.4)
        : Math.max(0, acc - 0.3)
      next.colonyDistressAccumulator = newAcc

      // Fire a distress message only when accumulator has built to a meaningful level
      // AND sufficient time has passed since the last warning (colony doesn't repeat itself)
      const cooldownOk = (next.lastNeglectWarning === undefined)
        || (next.time.day - next.lastNeglectWarning >= NEGLECT_WARNING_COOLDOWN)

      if (newAcc >= 35 && cooldownOk) {
        const coldCount   = alive.filter(c => c.warmth < NEGLECT_WARMTH_THRESHOLD).length
        const hungryCount = alive.filter(c => c.hunger > NEGLECT_HUNGER_THRESHOLD).length
        // Choose which crisis is dominant and generate a colony-voiced message
        if (coldCount >= NEGLECT_MIN_AFFECTED) {
          next.messages = [...next.messages, neglectWarningMessage('warmth', coldCount, next.time.day, alive.length)]
          next.lastNeglectWarning = next.time.day
          next.colonyDistressAccumulator = 0  // colony spoke — reset; it won't repeat unless crisis rebuilds
        } else if (hungryCount >= NEGLECT_MIN_AFFECTED) {
          next.messages = [...next.messages, neglectWarningMessage('hunger', hungryCount, next.time.day, alive.length)]
          next.lastNeglectWarning = next.time.day
          next.colonyDistressAccumulator = 0
        }
      }
    }
  }

  // ── Legendary creature events ─────────────────────────────────────────────────
  // Check alive creatures for longevity, prolific, or last-of-lineage milestones.
  {
    const alive = aliveAfterReproduction
    const fired = new Set<string>(next.legendaryFired ?? [])
    const legendaryMessages: ColonyMessage[] = []

    for (const c of alive) {
      // Longevity: still alive past 2.5× their expected lifespan
      const longevityKey = `${c.id}:longevity`
      if (!fired.has(longevityKey) && c.age >= c.maxAge * LEGENDARY_AGE_MULT) {
        legendaryMessages.push(legendaryMessage('longevity', c, next.time.day, c.id))
        fired.add(longevityKey)
      }

      // Prolific: 15+ offspring recorded
      const prolificKey = `${c.id}:prolific`
      if (!fired.has(prolificKey) && c.offspringIds.length >= LEGENDARY_OFFSPRING_MIN) {
        legendaryMessages.push(legendaryMessage('prolific', c, next.time.day, c.id))
        fired.add(prolificKey)
      }
    }

    // Last-of-lineage: only living member of a lineage that ran ≥ 20 generations
    const lineageLiving = new Map<string, { count: number; maxGen: number }>()
    for (const c of alive) {
      const root = c.lineageId.includes('_') ? c.lineageId.split('_')[0] : c.lineageId
      const entry = lineageLiving.get(root) ?? { count: 0, maxGen: 0 }
      entry.count++
      if (c.generation > entry.maxGen) entry.maxGen = c.generation
      lineageLiving.set(root, entry)
    }
    for (const [root, { count, maxGen }] of lineageLiving) {
      if (count === 1 && maxGen >= LEGENDARY_LINEAGE_GEN_MIN) {
        const lastOne = alive.find(c => {
          const r = c.lineageId.includes('_') ? c.lineageId.split('_')[0] : c.lineageId
          return r === root
        })
        if (lastOne) {
          const lastKey = `${lastOne.id}:last_of_line`
          if (!fired.has(lastKey)) {
            legendaryMessages.push(legendaryMessage('last_of_line', lastOne, next.time.day, lastOne.id, maxGen))
            fired.add(lastKey)
          }
        }
      }
    }

    if (legendaryMessages.length > 0) {
      next.messages = [...next.messages, ...legendaryMessages]
      next.legendaryFired = [...fired]
    }
  }

  // ── Race population tracking & revival detection ──────────────────────────────
  {
    // Reuses the aliveAfterReproduction array computed above instead of
    // rebuilding the same filter (was line 487 before consolidation).
    const alive = aliveAfterReproduction
    const newRacePops: Partial<Record<RaceTrait, number>> = {}
    for (const c of alive) {
      const r = c.genome.race
      if (r) newRacePops[r] = (newRacePops[r] ?? 0) + 1
    }

    const prevExtinct = new Set<RaceTrait>(next.extinctRaces ?? [])
    const prevPops = next.racePopulations ?? {}
    const revivalMessages: ColonyMessage[] = []

    const nowExtinct = new Set<RaceTrait>(prevExtinct)
    for (const r in prevPops) {
      const race = r as RaceTrait
      if ((prevPops[race] ?? 0) > 0 && !(newRacePops[race])) {
        nowExtinct.add(race)
        next = pushChronicle(next, { kind: 'race_lost', day: next.time.day, detail: race })
      }
    }

    // First-time race appearance (race never seen alive before; not a revival)
    for (const r in newRacePops) {
      const race = r as RaceTrait
      if ((newRacePops[race] ?? 0) > 0 && (prevPops[race] ?? 0) === 0 && !prevExtinct.has(race)) {
        next = pushChronicle(next, {
          kind: 'race_emerged', day: next.time.day, detail: race,
        }, { onceKey: `race_emerged:${race}` })
      }
    }

    for (const r in newRacePops) {
      const race = r as RaceTrait
      if ((newRacePops[race] ?? 0) > 0 && prevExtinct.has(race)) {
        nowExtinct.delete(race)
        const carrier = alive.find(c => c.genome.race === race)
        next = pushChronicle(next, {
          kind: 'race_revived', day: next.time.day, detail: race,
          creatureId: carrier?.id, creatureName: carrier?.name,
        })
        revivalMessages.push(
          generateRaceRevivalMessage(race, next.awarenessStage, next.time.day, carrier?.name)
        )
      }
    }

    next.racePopulations = newRacePops
    next.extinctRaces = [...nowExtinct]
    if (revivalMessages.length > 0) {
      next.messages = [...next.messages, ...revivalMessages]
    }
  }

  // Q8C: Soft cap — keep last 500 messages. Older messages are not archived here
  // but survive in the IndexedDB snapshot from the last cloud save.
  if (next.messages.length > 500) next.messages = next.messages.slice(-500)

  return next
}

// ─── Time ────────────────────────────────────────────────────────────────────

function tickTime(state: GameState): GameState {
  const next = { ...state }
  const time = { ...state.time }

  time.totalMinutesElapsed += DAY_FRACTION_PER_TICK
  time.day = Math.floor(time.totalMinutesElapsed)
  time.year = Math.floor(time.day / (DAYS_PER_SEASON * 4))

  const seasonIndex = Math.floor((time.day % (DAYS_PER_SEASON * 4)) / DAYS_PER_SEASON)
  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter']
  time.season = seasons[seasonIndex]

  // Phase ratios within one game day (1 real minute):
  //   dawn  0.00–0.12  (≈7s)   awakening glow
  //   day   0.12–0.55  (≈26s)  primary visibility
  //   dusk  0.55–0.68  (≈8s)   warm tint
  //   night 0.68–1.00  (≈19s)  long enough to feel like a real cycle
  const dayFraction = time.totalMinutesElapsed % 1
  if (dayFraction < 0.12) time.phase = 'dawn'
  else if (dayFraction < 0.55) time.phase = 'day'
  else if (dayFraction < 0.68) time.phase = 'dusk'
  else time.phase = 'night'

  next.time = time
  return next
}

// ─── Weather ─────────────────────────────────────────────────────────────────

function tickWeather(state: GameState, mods: SimModifiers, rng: () => number): GameState {
  let weather = (state.weather ?? 'clear') as WeatherState
  let timer = Math.max(0, (state.weatherTimer ?? 20) - DAY_FRACTION_PER_TICK)

  // Season-guard: weather that doesn't fit the season collapses
  const season = state.time.season
  if (weather === 'heatwave' && season !== 'summer') weather = 'clear'
  if (weather === 'fog' && season === 'winter') weather = 'snow'
  if (weather === 'bloom' && season !== 'spring') weather = 'clear'

  // Ashfall is state-triggered: it follows fire activity. Total burned tiles
  // (sum of fire_outbreak/fire_swept counts) in the recent window matters more
  // than the *number* of distinct fire events — one massive burn can trigger
  // ashfall the same way many small ones do.
  if (weather !== 'ashfall' && weather !== 'storm' && weather !== 'heatwave') {
    const chron = state.colonyChronicle ?? []
    const today = state.time.day
    let burnedTiles = 0
    for (let i = chron.length - 1; i >= 0; i--) {
      if (today - chron[i].day > ASHFALL_LOOKBACK_DAYS) break
      if (chron[i].kind === 'fire_outbreak' || chron[i].kind === 'fire_swept') {
        burnedTiles += chron[i].count ?? 3
      }
    }
    // Threshold scales with total tiles burned (a single 12-tile fire ≈ four small ones)
    if (burnedTiles >= ASHFALL_FIRE_THRESHOLD * 3) {
      weather = 'ashfall'
      const [aMin, aMax] = WEATHER_DURATION.ashfall ?? [5, 12]
      timer = aMin + rng() * (aMax - aMin)
    }
  }

  // Bloom is also responsive — emerges when spring has been peaceful for the
  // colony AND a sustained rain has prepared the ground. No more season-only
  // dice roll; bloom IS the colony noticing it's safe enough for abundance.
  if (weather === 'rain' && season === 'spring' && timer < 2) {
    const chron = state.colonyChronicle ?? []
    const today = state.time.day
    let recentHardship = 0
    for (let i = chron.length - 1; i >= 0; i--) {
      if (today - chron[i].day > 12) break
      const k = chron[i].kind
      if (k === 'mass_die_off' || k === 'fire_outbreak' || k === 'fire_swept'
          || k === 'flood_event' || k === 'lineage_extinct') recentHardship++
    }
    if (recentHardship === 0) {
      weather = 'bloom'
      const [bMin, bMax] = WEATHER_DURATION.bloom ?? [4, 8]
      timer = bMin + rng() * (bMax - bMin)
    }
  }

  if (timer <= 0) {
    const rnd = rng()
    type Trans = [WeatherState, number][]
    const isSpring = season === 'spring'
    const isSummer = season === 'summer'
    const isAutumn = season === 'autumn'
    const isWinter = season === 'winter'

    // Severity multiplier scales storm/heatwave/windstorm/drought duration
    const sev = mods.weatherSeverityMult ?? 1

    const transitions: Record<WeatherState, Trans> = {
      // Spring: rain, fog, bloom, brief storms — no drought, no windstorm early
      clear: isSpring
        ? [['rain', 0.30], ['bloom', 0.45], ['clear', 0.68], ['fog', 0.82], ['storm', 0.96], ['drought', 1.00]]
        : isSummer
        ? [['clear', 0.26], ['drought', 0.46], ['heatwave', 0.62], ['rain', 0.78], ['windstorm', 0.90], ['storm', 1.00]]
        : isAutumn
        ? [['clear', 0.24], ['fog', 0.42], ['rain', 0.60], ['windstorm', 0.74], ['storm', 0.86], ['snow', 0.96], ['drought', 1.00]]
        : /* winter */
          [['clear', 0.22], ['snow', 0.52], ['rain', 0.66], ['windstorm', 0.78], ['storm', 0.92], ['drought', 1.00]],

      rain: isSpring
        ? [['rain', 0.32], ['bloom', 0.48], ['clear', 0.72], ['fog', 0.88], ['storm', 1.00]]
        : isSummer
        ? [['clear', 0.55], ['storm', 0.80], ['rain', 1.00]]
        : isAutumn
        ? [['rain', 0.30], ['storm', 0.55], ['clear', 0.78], ['fog', 1.00]]
        : /* winter */
          [['snow', 0.40], ['clear', 0.70], ['storm', 0.88], ['rain', 1.00]],

      storm: isSpring
        ? [['rain', 0.45], ['clear', 0.70], ['fog', 0.88], ['storm', 1.00]]
        : isSummer
        ? [['drought', 0.35], ['windstorm', 0.55], ['clear', 0.75], ['rain', 0.92], ['storm', 1.00]]
        : isAutumn
        ? [['rain', 0.30], ['windstorm', 0.50], ['storm', 0.65], ['snow', 0.78], ['clear', 1.00]]
        : /* winter */
          [['snow', 0.50], ['clear', 0.78], ['rain', 1.00]],

      drought: isSummer
        ? [['drought', 0.36], ['heatwave', 0.55], ['windstorm', 0.72], ['clear', 0.90], ['storm', 1.00]]
        : isWinter
        ? [['drought', 0.30], ['windstorm', 0.50], ['clear', 0.78], ['snow', 0.92], ['storm', 1.00]]
        : [['clear', 0.55], ['windstorm', 0.72], ['drought', 0.88], ['storm', 1.00]],

      snow:      [['snow', 0.45], ['clear', 0.72], ['storm', 0.86], ['windstorm', 0.94], ['rain', 1.00]],
      heatwave:  [['heatwave', 0.30], ['drought', 0.55], ['windstorm', 0.72], ['clear', 0.92], ['storm', 1.00]],
      fog: isSpring
        ? [['clear', 0.38], ['fog', 0.58], ['bloom', 0.74], ['rain', 0.90], ['storm', 1.00]]
        : [['fog', 0.40], ['clear', 0.62], ['rain', 0.82], ['storm', 1.00]],

      // New states:
      bloom:     [['bloom', 0.28], ['clear', 0.58], ['rain', 0.80], ['fog', 1.00]],
      windstorm: isSummer || isAutumn
        ? [['windstorm', 0.20], ['drought', 0.45], ['clear', 0.72], ['storm', 0.90], ['heatwave', 1.00]]
        : [['windstorm', 0.18], ['clear', 0.60], ['snow', 0.82], ['storm', 1.00]],
      ashfall:   [['ashfall', 0.18], ['clear', 0.65], ['rain', 0.85], ['fog', 1.00]],
    }

    let next: WeatherState = 'clear'
    for (const [w, prob] of transitions[weather]) {
      if (rnd < prob) { next = w; break }
    }
    weather = next
    const [min, max] = WEATHER_DURATION[weather] ?? [8, 20]
    // Drought duration uses its dedicated multiplier; storm/heatwave/windstorm
    // share the weatherSeverityMult; others are unmodified.
    const durationMult = weather === 'drought' ? mods.droughtDurationMult
      : (weather === 'storm' || weather === 'heatwave' || weather === 'windstorm') ? sev
      : 1.0
    timer = (min + rng() * (max - min)) * durationMult
  }

  return { ...state, weather, weatherTimer: timer }
}

// ─── Tiles ────────────────────────────────────────────────────────────────────

function tickTiles(state: GameState, mods: SimModifiers): GameState {
  const season = state.time.season
  const weather = (state.weather ?? 'clear') as WeatherState
  const regrowMod = (FOOD_REGROW_MULTIPLIER[season] ?? 1)
    * (weather === 'rain' || weather === 'storm' ? RAIN_FOOD_BONUS
      : weather === 'drought' ? DROUGHT_FOOD_FACTOR
      : weather === 'bloom' ? BLOOM_FOOD_REGROW_MULT
      : weather === 'ashfall' ? ASHFALL_FOOD_REGROW_MULT
      : 1.0)
    * mods.foodRegrowMult

  // Read incremental tile-type counters from state instead of doing the old
  // O(WORLD_SIZE^2) pre-count scan every tick. tileTypeCount is bootstrapped
  // in worldGen and maintained inside this function (below).
  //
  // Drift sources outside this function — store actions like plantTree, the
  // death_site write in tickCreatures, etc. — are absorbed by an occasional
  // full resync, gated on a tick interval so we still beat the old per-tick
  // pre-count by an order of magnitude.
  const tickIdx = Math.floor(state.time.totalMinutesElapsed * 60)
  const needResync = !state.tileTypeCount || tickIdx % TILE_COUNT_RESYNC_TICKS === 0
  let counts: Partial<Record<TileType, number>>
  if (needResync) {
    counts = {}
    for (let vy = 0; vy < WORLD_SIZE; vy++) {
      for (let vx = 0; vx < WORLD_SIZE; vx++) {
        const tt = state.tiles[vy][vx].type
        counts[tt] = (counts[tt] ?? 0) + 1
      }
    }
  } else {
    counts = state.tileTypeCount!
  }
  // Working counters mutated by the main loop; written back at the end of tick.
  let treeCount      = (counts.tree ?? 0) + (counts.shelter ?? 0)
  let bushCount      = counts.bush ?? 0
  let healrootCount  = counts.healroot ?? 0
  let foodPatchCount = counts.food_patch ?? 0
  // anyBurning: track lazily — if any tile is found burning during the main
  // loop we set it; the prior pre-scan was redundant.
  let anyBurning = false

  // Copy-on-write: only clone rows/tiles that are actually mutated this tick.
  // Typical tick: ~200-400 writes vs 14,400 with the old full-clone map.
  const srcTiles = state.tiles
  const tiles = srcTiles.slice()
  const clonedRows = new Uint8Array(WORLD_SIZE)

  function writeTile(y: number, x: number) {
    if (!clonedRows[y]) { tiles[y] = srcTiles[y].slice(); clonedRows[y] = 1 }
    if (tiles[y][x] === srcTiles[y][x]) { tiles[y][x] = { ...srcTiles[y][x] } }
    return tiles[y][x]
  }

  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const t = srcTiles[y][x]
      if (!anyBurning && (t.burning ?? 0) > 0) anyBurning = true

      // Food regrowth; only patches near a mature tree regenerate.
      // Patches without a nearby mature tree wither to grass/barren when empty.
      if (t.type === 'food_patch') {
        let hasMatureTree = false
        for (let dy2 = -TREE_FOOD_RADIUS; dy2 <= TREE_FOOD_RADIUS && !hasMatureTree; dy2++) {
          for (let dx2 = -TREE_FOOD_RADIUS; dx2 <= TREE_FOOD_RADIUS && !hasMatureTree; dx2++) {
            if (dx2 === 0 && dy2 === 0) continue
            const tx2 = x + dx2, ty2 = y + dy2
            if (tx2 < 0 || tx2 >= WORLD_SIZE || ty2 < 0 || ty2 >= WORLD_SIZE) continue
            const adj = srcTiles[ty2][tx2]
            if ((adj.type === 'tree' || adj.type === 'shelter') && adj.treeAge >= TREE_FOOD_MATURE_AGE) {
              hasMatureTree = true
            }
          }
        }
        if (hasMatureTree && t.foodAmount < 100) {
          let riverAdj = false
          if (srcTiles[y-1]?.[x]?.type === 'river' || srcTiles[y+1]?.[x]?.type === 'river' ||
              srcTiles[y]?.[x-1]?.type === 'river' || srcTiles[y]?.[x+1]?.type === 'river') {
            riverAdj = true
          }
          const riverMult = riverAdj ? RIVER_FOOD_ADJACENT_BONUS : 1.0
          writeTile(y, x).foodAmount = Math.min(100, t.foodAmount + FOOD_REGROW_RATE_BASE * regrowMod * riverMult)
        } else if (!hasMatureTree && t.foodAmount <= 0) {
          const wt = writeTile(y, x)
          wt.type = t.biome === 'arid' ? 'barren' : 'grass'
          wt.foodAmount = 0
          foodPatchCount--
        }
      }

      // Bush berry regrowth; slower than food_patch; independent of trees.
      // No growth in winter; drought halves the rate.
      if (t.type === 'bush' && t.foodAmount < BUSH_FOOD_MAX) {
        const bushMod = weather === 'drought' ? 0.5 : weather === 'rain' || weather === 'storm' ? 1.3 : 1.0
        const seasonMod = season === 'winter' ? 0.0
          : season === 'spring' ? 1.6
          : season === 'summer' ? 1.1
          : 0.5
        if (seasonMod > 0) {
          writeTile(y, x).foodAmount = Math.min(
            BUSH_FOOD_MAX,
            t.foodAmount + BUSH_FOOD_REGROW_RATE * bushMod * seasonMod
          )
        }
      }

      // Healroot regrowth; slow, suppressed in drought and winter
      if (t.type === 'healroot') {
        const amount = t.healrootAmount ?? 0
        // Wither: deeply depleted patches in harsh conditions revert to grass.
        // Rate doubles in drought/winter — harsh seasons thin sparse patches first.
        if (amount < HEALROOT_WITHER_THRESHOLD) {
          const isHarsh = weather === 'drought' || season === 'winter'
          if (Math.random() < HEALROOT_WITHER_CHANCE * (isHarsh ? 2.0 : 1.0)) {
            const wt = writeTile(y, x)
            wt.type = t.biome === 'arid' ? 'barren' : 'grass'
            wt.healrootAmount = 0
            healrootCount--
          }
        } else if (amount < HEALROOT_MAX_AMOUNT) {
          const regrowMod = weather === 'drought' ? 0.0
            : season === 'winter' ? 0.15
            : weather === 'rain' || weather === 'storm' ? 1.5
            : season === 'spring' ? 1.3 : 1.0
          writeTile(y, x).healrootAmount = Math.min(
            HEALROOT_MAX_AMOUNT,
            amount + HEALROOT_REGROW_RATE * regrowMod
          )
        }
      }

      // Fence decay; storms and winter accelerate degradation; fully decayed fences revert to grass
      if (t.type === 'fence') {
        const dur = t.fenceDurability ?? 100
        const decayRate = (weather === 'storm' || season === 'winter') ? FENCE_DECAY_STORM : FENCE_DECAY_BASE
        const newDur = dur - decayRate
        if (newDur <= 0) {
          const wt = writeTile(y, x)
          wt.type = 'grass'
          wt.fenceDurability = undefined
          wt.fenceType = undefined
        } else {
          writeTile(y, x).fenceDurability = newDur
        }
      }

      // Cairn weathers slowly; reverts to grass after CAIRN_DECAY_DAYS in-game days
      if (t.type === 'cairn') {
        const placed = t.cairnPlacedOnDay ?? state.time.day
        if (state.time.day - placed >= CAIRN_DECAY_DAYS) {
          const wt = writeTile(y, x)
          wt.type = t.biome === 'arid' ? 'barren' : 'grass'
          wt.cairnFor = null
          wt.cairnPlacedOnDay = undefined
        }
      }

      // Nest fades back to grass after NEST_DECAY_DAYS (caretaker can re-place)
      if (t.type === 'nest') {
        const placed = t.nestPlacedOnDay ?? state.time.day
        if (state.time.day - placed >= NEST_DECAY_DAYS) {
          const wt = writeTile(y, x)
          wt.type = 'grass'
          wt.nestPlacedOnDay = undefined
        }
      }

      // Watch post weathers; slow decay until WATCH_POST_DECAY_DAYS reverts to grass
      if (t.type === 'watch_post') {
        const placed = t.watchPlacedOnDay ?? state.time.day
        if (state.time.day - placed >= WATCH_POST_DECAY_DAYS) {
          const wt = writeTile(y, x)
          wt.type = 'grass'
          wt.watchPlacedOnDay = undefined
        }
      }

      // Rain refills rivers; drought slowly drains them
      if (t.type === 'river' || t.type === 'mud') {
        if (weather === 'rain' || weather === 'storm') {
          writeTile(y, x).waterLevel = Math.min(100, t.waterLevel + RAIN_WATER_BONUS)
        } else if (weather === 'drought') {
          // Frost-drought in winter: frozen ground limits how fast rivers drain.
          // Snow melt partially compensates; cap drain to 30% of normal.
          const drainMult = season === 'winter' ? 0.3 : 1.0
          writeTile(y, x).waterLevel = Math.max(0, t.waterLevel - DROUGHT_WATER_DRAIN * drainMult)
        }
      }

      // Prolonged drought turns barren grass into cracked earth
      if (weather === 'drought' && t.type === 'grass' && Math.random() < 0.00008) {
        writeTile(y, x).type = 'barren'
      }

      // Barren tiles slowly recover to grass in spring
      if (t.type === 'barren' && season === 'spring' && Math.random() < 0.001) {
        writeTile(y, x).type = 'grass'
      }

      // Tree growth
      if (t.type === 'tree' && t.treeAge >= 0 && t.treeAge < TREE_GROW_DAYS) {
        const wt = writeTile(y, x)
        wt.treeAge += 1
        if (wt.treeAge >= TREE_GROW_DAYS) wt.shelter = true
      }

      // ── Tree lifecycle & food generation ─────────────────────────────────
      // Trees have three phases: growing → mature → withering → decayed.
      // Fruit drops are balanced by capping drop chance and respecting phase.
      if (t.type === 'tree' || t.type === 'shelter') {
        const age = t.treeAge

        // Wither phase: age the tree each tick so it will eventually decay
        if (age >= TREE_WITHER_AGE && age < TREE_DECAY_AGE) {
          writeTile(y, x).treeAge = age + 1
        }
        // Decay: tile reverts to barren immediately; seed system handles regrowth
        else if (age >= TREE_DECAY_AGE) {
          const wt = writeTile(y, x)
          wt.type = 'barren'; wt.treeAge = -1; wt.shelter = false
          treeCount--
          // Seed system: only germinate if world is below the tree cap.
          // This ensures new trees only grow when older ones have died, preventing
          // endless accumulation. 1-in-3 seeds that DO land will sprout; the rest decay.
          if (treeCount < VEG_TREE_CAP) {
            const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]
            for (const [ddx, ddy] of dirs) {
              const sx=x+ddx, sy=y+ddy
              if (sx>=0&&sx<WORLD_SIZE&&sy>=0&&sy<WORLD_SIZE&&tiles[sy][sx].type==='grass') {
                if (Math.random() < TREE_SEED_CHANCE) {
                  const sw = writeTile(sy, sx)
                  sw.type = 'tree'; sw.treeAge = 0; sw.shelter = false
                  treeCount++
                }
                break
              }
            }
          }
        }
        // Mature phase: produce fruit with season-adjusted drop chance
        else if (age >= TREE_FOOD_MATURE_AGE) {
          // Drop chance tapers off as tree approaches wither age
          const maturityFactor = age >= TREE_PEAK_AGE
            ? Math.max(0.2, 1 - (age - TREE_PEAK_AGE) / (TREE_WITHER_AGE - TREE_PEAK_AGE))
            : 1.0
          const effectiveDrop = Math.min(FRUIT_OVERPRODUCTION_CAP, TREE_FOOD_DROP_CHANCE * maturityFactor)
          if (Math.random() < effectiveDrop) {
            for (let dy = -TREE_FOOD_RADIUS; dy <= TREE_FOOD_RADIUS; dy++) {
              for (let dx = -TREE_FOOD_RADIUS; dx <= TREE_FOOD_RADIUS; dx++) {
                if (dx === 0 && dy === 0) continue
                const tx = x + dx, ty = y + dy
                if (tx < 0 || tx >= WORLD_SIZE || ty < 0 || ty >= WORLD_SIZE) continue
                const target = tiles[ty][tx]
                if (target.type === 'food_patch' && target.foodAmount < TREE_APPLE_MAX_PER_TILE) {
                  const wt = writeTile(ty, tx)
                  wt.foodAmount = Math.min(TREE_APPLE_MAX_PER_TILE, target.foodAmount + 4)
                  wt.fruitAge = 0  // fresh fruit reset
                  break
                }
                if (target.type === 'grass' && Math.random() < 0.18 && foodPatchCount < FOOD_PATCH_CAP) {
                  const wt = writeTile(ty, tx)
                  wt.type = 'food_patch'; wt.foodAmount = 20; wt.fruitAge = 0
                  foodPatchCount++
                  break
                }
              }
            }
          }
        }
      }

      // ── Bush lifecycle: wither in drought/winter, regrow in spring ────────
      if (t.type === 'bush') {
        const isHarsh = weather === 'drought' || (season === 'winter' && Math.random() < 0.3)
        if (isHarsh && Math.random() < BUSH_WITHER_CHANCE) {
          const wt = writeTile(y, x)
          // Withered bush clears fully to grass — no lingering red/barren clutter
          wt.type = 'grass'; wt.foodAmount = 0
          bushCount--
        }
      }
      // Bush regrowth on grass tiles in spring/lush; capped to prevent endless accumulation
      if (t.type === 'grass' && season === 'spring' && bushCount < VEG_BUSH_CAP) {
        const biomeBias = t.biome === 'lush' ? 2.0 : t.biome === 'wetland' ? 1.2 : 1.0
        if (Math.random() < BUSH_REGROW_CHANCE * biomeBias) {
          const wt = writeTile(y, x)
          wt.type = 'bush'; wt.foodAmount = 0
          bushCount++
        }
      }

      // ── Fruit decay: isolated food_patches (no nearby mature tree) decay ──
      if (t.type === 'food_patch' && t.foodAmount > 0) {
        let hasMatureTreeNearby = false
        for (let dy2=-TREE_FOOD_RADIUS; dy2<=TREE_FOOD_RADIUS && !hasMatureTreeNearby; dy2++) {
          for (let dx2=-TREE_FOOD_RADIUS; dx2<=TREE_FOOD_RADIUS && !hasMatureTreeNearby; dx2++) {
            if (dx2===0&&dy2===0) continue
            const tx2=x+dx2, ty2=y+dy2
            if (tx2<0||tx2>=WORLD_SIZE||ty2<0||ty2>=WORLD_SIZE) continue
            const adj=srcTiles[ty2][tx2]
            if ((adj.type==='tree'||adj.type==='shelter')&&adj.treeAge>=TREE_FOOD_MATURE_AGE&&adj.treeAge<TREE_DECAY_AGE)
              hasMatureTreeNearby=true
          }
        }
        if (!hasMatureTreeNearby) {
          const newAmount = t.foodAmount - FRUIT_DECAY_RATE
          if (newAmount <= 0) {
            const wt = writeTile(y, x)
            foodPatchCount--
            // Seed system: germinate only when below the tree cap; otherwise decay to grass.
            if (treeCount < VEG_TREE_CAP && Math.random() < TREE_SEED_CHANCE) {
              wt.type = 'tree'; wt.treeAge = 0; wt.shelter = false; wt.foodAmount = 0
              treeCount++
            } else {
              wt.type = t.biome==='arid' ? 'barren' : 'grass'; wt.foodAmount = 0
            }
          } else {
            writeTile(y, x).foodAmount = newAmount
          }
        }
        // Age fruit regardless of tree proximity; hard lifespan enforces natural turnover.
      // Trees reset fruitAge to 0 when they actively drop fruit, so well-tended patches
      // persist indefinitely. Seasonal orphans (bloom, riparian, etc.) wither after FRUIT_MAX_AGE.
        const livePatch = tiles[y]?.[x]
        if (livePatch?.type === 'food_patch') {
          const newFruitAge = (livePatch.fruitAge ?? 0) + 1
          const wt = writeTile(y, x)
          wt.fruitAge = newFruitAge
          if (newFruitAge > FRUIT_MAX_AGE) {
            wt.type = t.biome === 'arid' ? 'barren' : 'grass'
            wt.foodAmount = 0
            foodPatchCount--
          }
        }
      }

      // ── Heatwave: all food_patches wilt faster regardless of tree cover ────
      if (weather === 'heatwave' && t.type === 'food_patch' && t.foodAmount > 0) {
        const wilted = Math.max(0, t.foodAmount - HEATWAVE_FOOD_EXTRA_DECAY)
        if (wilted === 0) {
          const wt = writeTile(y, x)
          wt.type = t.biome === 'arid' ? 'barren' : 'grass'; wt.foodAmount = 0
          foodPatchCount--
        } else {
          writeTile(y, x).foodAmount = wilted
        }
      }

      // ── Heatwave spontaneous fire: extreme summer heat ignites dry vegetation ──
      if (weather === 'heatwave' && season === 'summer'
          && (t.type === 'tree' || t.type === 'shelter' || t.type === 'bush')
          && (t.burning ?? 0) === 0
          && Math.random() < HEATWAVE_FIRE_CHANCE) {
        writeTile(y, x).burning = FIRE_DURATION_TICKS
      }

      // ── Windstorm: strip fruit from food_patches and damage bushes ────────
      // Wind acts on exposed ground; tiles in rocky biome (sheltered) take
      // less damage. Bushes can wither outright in sustained windstorms.
      if (weather === 'windstorm') {
        const sheltered = t.biome === 'rocky'
        const exposureMult = sheltered ? 0.40 : 1.0
        if (t.type === 'food_patch' && t.foodAmount > 0
            && Math.random() < WINDSTORM_FRUIT_DROP_CHANCE * exposureMult) {
          const newAmt = Math.max(0, t.foodAmount - WINDSTORM_FRUIT_LOSS)
          if (newAmt === 0) {
            const wt = writeTile(y, x)
            wt.type = t.biome === 'arid' ? 'barren' : 'grass'; wt.foodAmount = 0
            foodPatchCount--
          } else {
            writeTile(y, x).foodAmount = newAmt
          }
        }
        if (t.type === 'bush' && Math.random() < WINDSTORM_BUSH_DAMAGE_CHANCE * exposureMult) {
          const wt = writeTile(y, x)
          wt.type = 'grass'; wt.foodAmount = 0
          bushCount--
        }
      }

      // ── Bloom: amplified bush regrowth and patch spawning on grass ────────
      if (weather === 'bloom' && season === 'spring' && t.type === 'grass'
          && foodPatchCount < FOOD_PATCH_CAP) {
        const biomeBias = SPRING_BLOOM_BIOME_BIAS[t.biome] ?? 1.0
        if (Math.random() < SPRING_BLOOM_CHANCE * biomeBias * BLOOM_PATCH_SPAWN_MULT) {
          const wt = writeTile(y, x)
          wt.type = 'food_patch'; wt.foodAmount = SPRING_BLOOM_FOOD; wt.fruitAge = 0
          foodPatchCount++
        }
      }
      if (weather === 'bloom' && t.type === 'bush' && t.foodAmount < BUSH_FOOD_MAX) {
        writeTile(y, x).foodAmount = Math.min(
          BUSH_FOOD_MAX, t.foodAmount + BUSH_FOOD_REGROW_RATE * BLOOM_BUSH_REGROW_MULT)
      }

      // ── Seasonal food sources ─────────────────────────────────────────────
      // Spring bloom: wildflower patches on lush/wetland grass during rain or clear
      if (season === 'spring' && t.type === 'grass' && foodPatchCount < FOOD_PATCH_CAP) {
        const biomeBias = SPRING_BLOOM_BIOME_BIAS[t.biome] ?? 1.0
        const weatherMult = (weather === 'rain' || weather === 'fog') ? SPRING_BLOOM_RAIN_MULT : 1.0
        if (Math.random() < SPRING_BLOOM_CHANCE * biomeBias * weatherMult) {
          const wt = writeTile(y, x)
          wt.type = 'food_patch'; wt.foodAmount = SPRING_BLOOM_FOOD; wt.fruitAge = 0
          foodPatchCount++
        }
      }

      // Summer riparian: river-adjacent grass spawns food patches in summer heat
      if (season === 'summer' && t.type === 'grass') {
        let adjacentRiver = false
        for (const [ddx, ddy] of [[0,1],[0,-1],[1,0],[-1,0]] as [number,number][]) {
          const nx = x + ddx, ny = y + ddy
          if (nx >= 0 && ny >= 0 && nx < WORLD_SIZE && ny < WORLD_SIZE
              && srcTiles[ny][nx].type === 'river') {
            adjacentRiver = true; break
          }
        }
        if (adjacentRiver && Math.random() < SUMMER_RIPARIAN_CHANCE && foodPatchCount < FOOD_PATCH_CAP) {
          const wt = writeTile(y, x)
          wt.type = 'food_patch'; wt.foodAmount = SUMMER_RIPARIAN_FOOD; wt.fruitAge = 0
          foodPatchCount++
        }
      }

      // Autumn windfall: peak/withering trees drop a large fruit burst
      if (season === 'autumn' && (t.type === 'tree' || t.type === 'shelter')) {
        if (t.treeAge >= TREE_PEAK_AGE && Math.random() < AUTUMN_WINDFALL_CHANCE) {
          for (const [ddx, ddy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]] as [number,number][]) {
            const tx = x + ddx, ty = y + ddy
            if (tx < 0 || ty < 0 || tx >= WORLD_SIZE || ty >= WORLD_SIZE) continue
            const adj = srcTiles[ty][tx]
            if (adj.type === 'grass' && foodPatchCount < FOOD_PATCH_CAP) {
              const wt = writeTile(ty, tx)
              wt.type = 'food_patch'; wt.foodAmount = AUTUMN_WINDFALL_FOOD; wt.fruitAge = 0
              foodPatchCount++
              break
            } else if (adj.type === 'food_patch' && adj.foodAmount < 80) {
              writeTile(ty, tx).foodAmount = Math.min(100, adj.foodAmount + AUTUMN_WINDFALL_FOOD)
              break
            }
          }
        }
        // Withering trees seed fungal/mushroom-like patches in their shade
        if (t.treeAge >= TREE_WITHER_AGE && Math.random() < AUTUMN_MUSHROOM_CHANCE) {
          for (const [ddx, ddy] of [[0,1],[0,-1],[1,0],[-1,0]] as [number,number][]) {
            const tx = x + ddx, ty = y + ddy
            if (tx < 0 || ty < 0 || tx >= WORLD_SIZE || ty >= WORLD_SIZE) continue
            const adj = srcTiles[ty][tx]
            if (adj.type === 'grass' && foodPatchCount < FOOD_PATCH_CAP) {
              const wt = writeTile(ty, tx)
              wt.type = 'food_patch'; wt.foodAmount = AUTUMN_MUSHROOM_FOOD
              wt.fruitAge = 0; foodPatchCount++; break
            } else if (adj.type === 'food_patch' && adj.foodAmount < 50) {
              const wt = writeTile(ty, tx)
              wt.foodAmount = Math.min(100, (adj.foodAmount ?? 0) + AUTUMN_MUSHROOM_FOOD)
              wt.fruitAge = 0; break
            }
          }
        }
      }

      // Winter lichen: sparse edible crust on rocky/barren tiles near caves
      if (season === 'winter' && (t.type === 'barren' || (t.biome === 'rocky' && t.type === 'grass'))) {
        if (Math.random() < WINTER_LICHEN_CHANCE) {
          let nearCave = false
          for (let dy2 = -WINTER_LICHEN_CAVE_RADIUS; dy2 <= WINTER_LICHEN_CAVE_RADIUS && !nearCave; dy2++) {
            for (let dx2 = -WINTER_LICHEN_CAVE_RADIUS; dx2 <= WINTER_LICHEN_CAVE_RADIUS && !nearCave; dx2++) {
              const cx = x + dx2, cy = y + dy2
              if (cx >= 0 && cy >= 0 && cx < WORLD_SIZE && cy < WORLD_SIZE
                  && srcTiles[cy][cx].type === 'cave') nearCave = true
            }
          }
          if (nearCave && foodPatchCount < FOOD_PATCH_CAP) {
            const wt = writeTile(y, x)
            wt.type = 'food_patch'; wt.foodAmount = WINTER_LICHEN_FOOD; wt.fruitAge = 0
            foodPatchCount++
          }
        }
      }

      // Water replenishment; reads from working tile so it stacks with rain bonus above
      if (t.type === 'river') {
        const wt = writeTile(y, x)
        wt.waterLevel = Math.min(100, wt.waterLevel + WATER_REPLENISH_RATE)
        // Rivers overflow adjacent grass into puddles during heavy rain/storm
        if ((weather === 'rain' || weather === 'storm') && Math.random() < RIVER_OVERFLOW_CHANCE) {
          const dirs = [[0,1],[0,-1],[1,0],[-1,0]]
          for (const [ddx,ddy] of dirs) {
            const nx=x+ddx, ny=y+ddy
            if (nx>=0&&nx<WORLD_SIZE&&ny>=0&&ny<WORLD_SIZE) {
              const adj=tiles[ny][nx]
              if (adj.type==='grass' || adj.type==='barren') {
                const wt2=writeTile(ny,nx)
                wt2.puddleLevel=Math.min(1, (wt2.puddleLevel??0)+0.3)
              }
            }
          }
        }
      }

      // ── Puddle accumulation & flow (rain/storm fills grass tiles) ─────────
      if (t.type==='grass' || t.type==='mud' || t.type==='barren') {
        const currentPuddle = t.puddleLevel ?? 0
        if (weather==='rain' || weather==='storm') {
          const newLevel = Math.min(1, currentPuddle + PUDDLE_ACCUMULATE_RATE)
          const wt = writeTile(y, x)
          wt.puddleLevel = newLevel
          // Puddle reaches threshold; convert to mud tile
          if (newLevel >= PUDDLE_FORM_THRESHOLD && t.type !== 'mud') {
            wt.type = 'mud'
          }

        } else if (weather==='drought' || weather==='clear') {
          if (currentPuddle > 0) {
            const newLevel = Math.max(0, currentPuddle - PUDDLE_EVAPORATE_RATE)
            const wt = writeTile(y, x)
            wt.puddleLevel = newLevel
            // Puddle evaporates; mud reverts to grass
            if (newLevel === 0 && t.type === 'mud') {
              wt.type = t.biome==='wetland' ? 'mud' : 'grass'
            }
          }
        }
        // Puddle flow; water runs toward adjacent lower-elevation tiles
        if ((t.puddleLevel ?? 0) > 0.2 && Math.random() < PUDDLE_FLOW_CHANCE) {
          const dirs = [[0,1],[0,-1],[1,0],[-1,0]]
          for (const [ddx,ddy] of dirs) {
            const nx=x+ddx, ny=y+ddy
            if (nx>=0&&nx<WORLD_SIZE&&ny>=0&&ny<WORLD_SIZE) {
              const adj=tiles[ny][nx]
              const adjElev = adj.elevation ?? 0
              const myElev  = t.elevation ?? 0
              if (adjElev <= myElev && (adj.type==='grass'||adj.type==='barren'||adj.type==='mud')) {
                writeTile(ny,nx).puddleLevel = Math.min(1,(adj.puddleLevel??0)+0.05)
                writeTile(y,x).puddleLevel   = Math.max(0,(t.puddleLevel??0)-0.04)
                break
              }
            }
          }
        }
      }

      // ── Snow accumulation, spread & melt ─────────────────────────────────
      if (SNOW_ENABLED) {
        const isSnowWeather = weather === 'snow' || (weather === 'storm' && season === 'winter')
        const isWinter = season === 'winter'
        const currentDepth = t.snowDepth ?? 0
        const impassable = t.type === 'river' || t.type === 'mountain'
          || t.type === 'cliff' || t.type === 'rock'

        if (!impassable) {
          const biomeFactor = SNOW_BIOME_FACTOR[t.biome] ?? 1.0

          if (isSnowWeather) {
            // Active snowfall: accumulate on all land tiles, rate scaled by biome
            writeTile(y, x).snowDepth = Math.min(SNOW_MAX_DEPTH, currentDepth + SNOW_ACCUMULATE_RATE * biomeFactor)
          } else if (isWinter && weather !== 'drought' && t.biome !== 'arid') {
            // Clear winter: light frost baseline keeps the land lightly dusted between storms
            writeTile(y, x).snowDepth = Math.min(SNOW_WINTER_FROST_CAP, currentDepth + SNOW_WINTER_FROST_RATE)
          } else if (currentDepth > 0) {
            // Melting: season and biome both govern the rate
            const seasonMelt = season === 'spring' ? 3 : season === 'summer' ? 5 : 1
            const biomeMelt = SNOW_BIOME_MELT_FACTOR[t.biome] ?? 1.0
            writeTile(y, x).snowDepth = Math.max(0, currentDepth - SNOW_MELT_RATE * seasonMelt * biomeMelt)
          }

          // Spread: deep snow blankets adjacent tiles gradually (blanket effect)
          if (currentDepth > SNOW_SPREAD_THRESHOLD && Math.random() < SNOW_SPREAD_CHANCE) {
            const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}]
            const dir = dirs[Math.floor(Math.random() * 4)]
            const nx = x + dir.dx, ny = y + dir.dy
            if (nx >= 0 && ny >= 0 && nx < WORLD_SIZE && ny < WORLD_SIZE) {
              const nb = srcTiles[ny][nx]
              if (nb && nb.type !== 'river' && nb.type !== 'mountain'
                  && nb.type !== 'cliff' && nb.type !== 'rock') {
                const nbDepth = nb.snowDepth ?? 0
                writeTile(ny, nx).snowDepth = Math.min(SNOW_MAX_DEPTH, nbDepth + SNOW_SPREAD_AMOUNT)
              }
            }
          }
        } else if (currentDepth > 0) {
          // Impassable tiles (rivers, rock faces) shed snow quickly
          writeTile(y, x).snowDepth = Math.max(0, currentDepth - SNOW_MELT_RATE * 4)
        }
      }

      // Flood timer drains in any season so tiles created near season-end don't freeze
      if (t.floodTimer > 0) {
        const wt = writeTile(y, x)
        wt.floodTimer -= 1
        if (wt.floodTimer === 0) wt.type = t.biome === 'wetland' ? 'mud' : 'grass'
      }

      // Death sites slowly fade; the world reclaims its dead.
      // Without this, death_site tiles accumulate forever and the map
      // visibly darkens / "looks transparent" as the colony ages.
      if (t.type === 'death_site') {
        const wt = writeTile(y, x)
        wt.deathSiteAge = (t.deathSiteAge ?? 0) + DAY_FRACTION_PER_TICK
        if (wt.deathSiteAge >= DEATH_SITE_DECAY_DAYS) {
          wt.type = 'barren'
          wt.deathSiteAge = 0
          wt.deathSiteOf = null
        }
      }

      // Fire decay; burning tiles count down. When the timer hits 0,
      // trees/shelters turn barren (lost forever) and any water tile that
      // was hit drains by a small amount (drought after lightning).
      if ((t.burning ?? 0) > 0) {
        const wt = writeTile(y, x)
        wt.burning -= 1
        if (wt.burning === 0) {
          if (t.type === 'tree' || t.type === 'shelter') {
            wt.type = 'barren'
            wt.treeAge = -1
            wt.shelter = false
          } else if (t.type === 'bush') {
            wt.type = 'barren'
            wt.foodAmount = 0
          } else if (t.type === 'river') {
            wt.waterLevel = Math.max(0, t.waterLevel - 25)
          }
        }
      }
    }
  }

  // Fire spread; only checked when there's any burning (tracked in pre-count pass).
  if (anyBurning) {
    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        if ((tiles[y][x].burning ?? 0) <= 0) continue
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= WORLD_SIZE || ny < 0 || ny >= WORLD_SIZE) continue
          const adj = tiles[ny][nx]
          if ((adj.burning ?? 0) > 0) continue
          if ((adj.type === 'tree' || adj.type === 'shelter' || adj.type === 'bush') && Math.random() < FIRE_SPREAD_CHANCE) {
            writeTile(ny, nx).burning = FIRE_DURATION_TICKS
          }
        }
      }
    }
  }

  // ── River erosion & drying ────────────────────────────────────────────────────
  // Very slow terrain shift that compounds over many play sessions.
  // During storms, rivers can slowly widen into adjacent grass (erosion).
  // During drought, isolated shallow river tiles can slowly dry to mud.
  if (weather === 'storm') {
    // Erosion: each river tile has a tiny chance to spread into adjacent grass
    for (let y = 1; y < WORLD_SIZE - 1; y++) {
      for (let x = 1; x < WORLD_SIZE - 1; x++) {
        if (tiles[y][x].type !== 'river') continue
        if (Math.random() >= RIVER_EROSION_CHANCE) continue
        const dirs = [[0,1],[0,-1],[1,0],[-1,0]]
        for (const [dx,dy] of dirs) {
          const nx=x+dx, ny=y+dy
          if (nx<0||nx>=WORLD_SIZE||ny<0||ny>=WORLD_SIZE) continue
          const adj = tiles[ny][nx]
          if (adj.type==='grass'||adj.type==='barren') {
            const wt=writeTile(ny,nx)
            wt.type='river'; wt.waterLevel=60
            break
          }
        }
      }
    }
  } else if (weather === 'drought' || weather === 'clear') {
    // Drying: isolated river tiles slowly revert to mud in calm or dry weather.
    // Completely isolated tiles (0 river neighbours) are overflow residue and drain
    // regardless of water level. Endpoint tiles drain only during drought.
    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        const t = tiles[y][x]
        if (t.type !== 'river') continue
        const dirs = [[0,1],[0,-1],[1,0],[-1,0]]
        let riverNeighbours = 0
        for (const [dx,dy] of dirs) {
          const nx=x+dx, ny=y+dy
          if (nx>=0&&nx<WORLD_SIZE&&ny>=0&&ny<WORLD_SIZE&&tiles[ny][nx].type==='river') riverNeighbours++
        }
        if (riverNeighbours === 0 && Math.random() < RIVER_DRYING_CHANCE * 20) {
          const wt=writeTile(y,x)
          wt.type='mud'; wt.waterLevel=0; wt.puddleLevel=0.8
        } else if (weather === 'drought' && riverNeighbours <= 1 && (t.waterLevel ?? 0) <= 15 && Math.random() < RIVER_DRYING_CHANCE) {
          const wt=writeTile(y,x)
          wt.type='mud'; wt.waterLevel=0
        }
      }
    }
  }

  // Auto-lightning; winter OR storm weather; storm raises probability 4×
  const lightningChance = weather === 'storm' ? STORM_LIGHTNING_CHANCE
    : season === 'winter' ? AUTO_LIGHTNING_CHANCE
    : 0
  let lightningStruck: { x: number; y: number; source: 'storm' | 'winter' } | null = null
  if (lightningChance > 0 && Math.random() < lightningChance) {
    const lx = 1 + Math.floor(Math.random() * (WORLD_SIZE - 2))
    const ly = 1 + Math.floor(Math.random() * (WORLD_SIZE - 2))
    const lt = writeTile(ly, lx)
    lt.lightningFlash = Date.now()
    if (lt.type === 'tree' || lt.type === 'shelter') {
      lt.burning = FIRE_DURATION_TICKS
    }
    lightningStruck = { x: lx, y: ly, source: weather === 'storm' ? 'storm' : 'winter' }
  }

  // Winter floods: each river tile independently has a small chance to flood an adjacent grass tile.
  // Per-tile probability avoids mass-flooding events that previously blocked movement map-wide.
  if (season === 'winter') {
    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        if (tiles[y][x].type !== 'river') continue
        if (Math.random() >= RIVER_WINTER_FLOOD_CHANCE) continue
        const adj = [[0,1],[0,-1],[1,0],[-1,0]]
        for (const [dx, dy] of adj) {
          const nx = x + dx; const ny = y + dy
          if (nx >= 0 && nx < WORLD_SIZE && ny >= 0 && ny < WORLD_SIZE) {
            if (tiles[ny][nx].type === 'grass' || tiles[ny][nx].type === 'mud') {
              const wt = writeTile(ny, nx)
              wt.type = 'flooded'
              wt.floodTimer = 3 + Math.floor(Math.random() * 5)
              break  // flood only one adjacent tile per river tile per tick
            }
          }
        }
      }
    }
  }

  // Snow accumulation tally. Only meaningful in winter or while snow lingers
  // into spring, and the readout is only used for the UI snowAccumulation
  // gauge — short-term drift is invisible to the player. Run on the same
  // resync cadence as the tile-type counter; otherwise reuse last tick's value.
  let snowAccumulation = state.snowAccumulation ?? 0
  const snowCheckDue = needResync
    || state.time.season === 'winter'  // keep winter readout responsive
    || (state.snowAccumulation ?? 0) > 5
  if (snowCheckDue && (state.time.season === 'winter' || (state.snowAccumulation ?? 0) > 0)) {
    // mountain/cliff/rock counts come from the tile-type cache — no scan.
    const nonSnowable = (counts.mountain ?? 0) + (counts.cliff ?? 0) + (counts.rock ?? 0)
    const totalSnowableTiles = (WORLD_SIZE * WORLD_SIZE) - nonSnowable
    let snowTiles = 0
    if (totalSnowableTiles > 0) {
      for (let sy = 0; sy < WORLD_SIZE; sy++) {
        const row = tiles[sy]
        for (let sx = 0; sx < WORLD_SIZE; sx++) {
          if ((row[sx].snowDepth ?? 0) > 0.1) snowTiles++
        }
      }
      snowAccumulation = Math.round((snowTiles / totalSnowableTiles) * 100)
    }
  } else if (state.time.season !== 'winter' && (state.snowAccumulation ?? 0) === 0) {
    snowAccumulation = 0   // no snow possible; cheap path
  }

  // Persist the running tile-type counters so the next tick can skip the
  // pre-count scan. tree+shelter are merged in treeCount; split heuristically
  // by preserving the prior shelter-share if known.
  const prevShelter = state.tileTypeCount?.shelter ?? 0
  const prevTree    = state.tileTypeCount?.tree ?? 0
  const prevTotal   = prevShelter + prevTree
  const shelterShare = prevTotal > 0 ? prevShelter / prevTotal : 0
  const updatedCounts: Partial<Record<TileType, number>> = {
    ...(state.tileTypeCount ?? {}),
    tree:       Math.max(0, Math.round(treeCount * (1 - shelterShare))),
    shelter:    Math.max(0, Math.round(treeCount * shelterShare)),
    bush:       Math.max(0, bushCount),
    healroot:   Math.max(0, healrootCount),
    food_patch: Math.max(0, foodPatchCount),
  }

  let nextState: GameState = { ...state, tiles, snowAccumulation, tileTypeCount: updatedCounts }
  if (lightningStruck) {
    nextState = pushChronicle(nextState, {
      kind: 'lightning_strike',
      day: state.time.day,
      x: lightningStruck.x,
      y: lightningStruck.y,
      detail: lightningStruck.source,
    })
  }
  return nextState
}

// ─── Creatures ────────────────────────────────────────────────────────────────

function tickCreatures(state: GameState, _tickRng: () => number, mods: SimModifiers): GameState {
  const creatures = { ...state.creatures }
  let next = { ...state }
  const srcTiles = state.tiles
  const tiles = srcTiles.slice()
  const clonedTileRows = new Uint8Array(WORLD_SIZE)
  function writeTile(y: number, x: number) {
    if (!clonedTileRows[y]) { tiles[y] = srcTiles[y].slice(); clonedTileRows[y] = 1 }
    if (tiles[y][x] === srcTiles[y][x]) { tiles[y][x] = { ...srcTiles[y][x] } }
    return tiles[y][x]
  }
  const messages: ColonyMessage[] = [...state.messages]
  let lastMsgDay = messages.length > 0 ? messages[messages.length - 1].day : -999
  const events: GameEvent[] = [...state.events]
  let totalDeaths = state.totalDeaths
  const weather = (state.weather ?? 'clear') as WeatherState
  // Healroot tile count for spawn gating; read from incremental counter
  // (tickTiles maintains it), avoiding another O(WORLD_SIZE^2) scan per tick.
  let healrootCount = state.tileTypeCount?.healroot ?? 0
  if (!state.tileTypeCount) {
    // backward-compat: count once if the cache is missing
    for (let vy = 0; vy < WORLD_SIZE; vy++) {
      for (let vx = 0; vx < WORLD_SIZE; vx++) {
        if (srcTiles[vy][vx].type === 'healroot') healrootCount++
      }
    }
  }
  // Tool-as-answer tracking; updated when a question is generated this tick
  let nextAwaitingResponseUntil = state.caretaker.awaitingResponseUntil ?? 0
  let clearRespondedFlag = false

  // Pre-build alive array, tile index, and creature spatial grid once; shared
  // across all creature iterations. Avoids O(n) Object.values + filter per
  // creature and O(d²) tile scans in behavior, and turns previously O(N²)
  // witness/conflict scans into O(neighbors).
  const aliveCreatures = Object.values(creatures).filter(c => c.diedOnDay === null)
  const aliveCount = aliveCreatures.length
  const tileIdx = buildTileIndex(srcTiles)
  const creatureGrid = buildCreatureGrid(aliveCreatures)

  // Most-recent fracture chronicle entry — behavior.ts reads this directly so
  // each creature can independently decide whether to flee. No global stamp.
  let recentFractureDay: number | undefined = undefined
  {
    const chron = state.colonyChronicle ?? []
    for (let i = chron.length - 1; i >= 0; i--) {
      const e = chron[i]
      if (state.time.day - e.day > 5) break
      if (e.kind === 'lineage_fork' && e.detail === 'fracture') {
        recentFractureDay = e.day
        break
      }
    }
  }

  // ── Personal fear-memory decay ────────────────────────────────────────────
  // Fear of a specific creature fades after FEAR_MEMORY_DAYS without renewal.
  // This is the only "engine pass" over fear — recording new fears happens at
  // the actual kill event below, so each creature's fear set traces to events
  // they personally witnessed.
  for (const c of aliveCreatures) {
    if (!c.feared) continue
    let changed = false
    const updated: Record<string, number> = {}
    for (const [killerId, day] of Object.entries(c.feared)) {
      if (state.time.day - day < FEAR_MEMORY_DAYS) updated[killerId] = day
      else changed = true
    }
    if (changed) creatures[c.id] = { ...creatures[c.id], feared: updated }
  }

  // Roles are assigned purely from behavioral evidence scores in assignRole().
  // No gap-filling boost: the colony cannot appoint a guardian by need alone —
  // a creature has to earn it through actual combat and territorial history.

  for (const id in creatures) {
    const initialState = creatures[id].state
    let c = { ...creatures[id] }
    if (c.diedOnDay !== null) continue

    // Absence imprint: only adds stress when the colony actually suffered
    // during the gap (deaths, fires, lightning logged in the absence window).
    // A colony that thrived while you were gone has no imprint — they did not
    // notice your specific absence, only the conditions of the world.
    if ((state.absenceImprint ?? 0) > 0 && (state.absenceHardship ?? 0) > 0) {
      const hardshipScale = Math.min(1, (state.absenceHardship ?? 0) / 10)
      c.stress = Math.min(100, c.stress + ABSENCE_IMPRINT_STRESS_PER_TICK * hardshipScale)
    }

    const creatureTile = state.tiles[c.y]?.[c.x]
    // Track biome for environmental visual adaptation; record biome discovery experience
    if (creatureTile?.biome) {
      const prevBiome = c.dominantBiome
      c.dominantBiome = creatureTile.biome
      if (prevBiome && prevBiome !== creatureTile.biome) {
        recordExperience(c, 'discovered_biome', state.time.day)
        recordObservation(c, 'discovered_biome', state.time.day, { detail: creatureTile.biome })
        // First-in-biome: chronicle only the first time any colony member ever
        // entered this biome type. onceKey ensures one entry per biome.
        next = pushChronicle(next, {
          kind: 'first_in_biome', day: state.time.day,
          creatureId: c.id, creatureName: c.name, detail: creatureTile.biome,
        }, { onceKey: `first_biome:${creatureTile.biome}` })
      }
      // Biome residence is still tracked (UI and terrainMemory use it), but
      // the per-biome drive nudge has been removed. Drives drift purely from
      // what the creature actually *does* — already handled by tickNeeds'
      // drive-drift block, which reads state transitions (fighting, bonding,
      // foraging, etc.). Whatever a biome rewards mechanically (food density,
      // bond opportunities, predator pressure) shapes the creature's actions,
      // and *those* shape the drives. The biome label no longer asserts what
      // a creature should value.
      const res = c.biomeResidence ?? {}
      c.biomeResidence = { ...res, [creatureTile.biome]: (res[creatureTile.biome] ?? 0) + 1 }
    }
    // Edge encounter: creature on an edge tile is a notable moment for Sentinel
    // / Curious minds — this used to be invisible. Now it's a real observation
    // the speech and message systems can refer to.
    if ((c.x <= 1 || c.x >= WORLD_SIZE - 2 || c.y <= 1 || c.y >= WORLD_SIZE - 2)
        && c.genome.mind !== 'Feral') {
      const recentEdge = (c.observedEvents ?? []).slice(-5).some(o => o.kind === 'reached_edge' && state.time.day - o.day < 10)
      if (!recentEdge) {
        recordObservation(c, 'reached_edge', state.time.day, { detail: c.x <= 1 ? 'west' : c.x >= WORLD_SIZE - 2 ? 'east' : c.y <= 1 ? 'north' : 'south' })
        next = pushChronicle(next, {
          kind: 'edge_encounter', day: state.time.day,
          creatureId: c.id, creatureName: c.name, x: c.x, y: c.y,
        })
      }
    }
    c = tickNeeds(c, state.time.season, creatureTile?.biome, state.weather)

    // Weather thirst/stress correction; rain/storm reduces thirst; drought/heat increases it.
    // Adaptation traits block or reduce specific weather penalties.
    const adaptations = c.genome.adaptations ?? []

    // Night warmth spike; doubles effective warmth decay at night, forcing
    // creatures toward shelter/caves before conditions become critical.
    // cave_sighted and echo_sense creatures are adapted to dark environments and skip this penalty.
    // thick_pelt lineages retain heat even at night (broad insulation).
    if (state.time.phase === 'night'
        && !adaptations.includes('cave_sighted')
        && !adaptations.includes('echo_sense')) {
      const extraDrain = state.time.season === 'winter' ? WARMTH_DECAY_WINTER : WARMTH_DECAY_BASE
      const peltMult = adaptations.includes('thick_pelt') ? THICK_PELT_WARMTH_MULT : 1.0
      c.warmth = Math.max(0, c.warmth - extraDrain * peltMult)
    }

    if (weather === 'rain' || weather === 'storm') {
      c.thirst = Math.max(0, c.thirst - THIRST_DECAY * RAIN_THIRST_REDUCTION)
      // Terrain elevation provides storm shelter; rocky biome + high ground reduces exposure
      const creatureTileForStorm = state.tiles[c.y]?.[c.x]
      const isElevatedRocky = creatureTileForStorm?.biome === 'rocky'
        && (creatureTileForStorm?.elevation ?? 0) > 0.3
      // Stacking trait protection: cold_hardy + thick_pelt compound; elevation is additive
      let warmthDrainMult = weather === 'storm' ? 1.5 : 1.0
      if (adaptations.includes('cold_hardy')) warmthDrainMult *= 0.5
      if (adaptations.includes('thick_pelt')) warmthDrainMult *= THICK_PELT_WARMTH_MULT
      if (weather === 'storm' && isElevatedRocky) warmthDrainMult *= 0.5
      c.warmth = Math.max(0, c.warmth - RAIN_WARMTH_DRAIN * warmthDrainMult)
      // Storm adds baseline stress; storm_braced lineages are immune; others may be reduced
      if (weather === 'storm' && !adaptations.includes('storm_braced')) {
        let stressMult = 1.0
        if (adaptations.includes('thick_pelt')) stressMult *= THICK_PELT_STORM_STRESS_MULT
        if (isElevatedRocky) stressMult *= 0.6
        c.stress = Math.min(100, c.stress + STORM_STRESS_PER_TICK * stressMult)
      }
    } else if (weather === 'drought') {
      c.thirst = Math.min(100, c.thirst + THIRST_DECAY * DROUGHT_THIRST_PENALTY)
    } else if (weather === 'heatwave') {
      const thirstBlock = adaptations.includes('heat_plated') ? HEAT_PLATED_THIRST_BLOCK : 0
      c.thirst = Math.min(100, c.thirst + THIRST_DECAY * (HEATWAVE_THIRST_MULT - 1) * (1 - thirstBlock))
      // heat_plated and thermal_vent lineages both block heatwave stress
      if (!adaptations.includes('heat_plated') && !adaptations.includes('thermal_vent')) {
        c.stress = Math.min(100, c.stress + HEATWAVE_STRESS_PER_TICK)
      }
      // thermal_vent: gains warmth passively from the ambient heat
      if (adaptations.includes('thermal_vent')) {
        c.warmth = Math.min(100, c.warmth + THERMAL_VENT_WARMTH_GAIN)
      }
    } else if (weather === 'fog') {
      c.thirst = Math.max(0, c.thirst - THIRST_DECAY * FOG_THIRST_REDUCTION)
      c.stress = Math.max(0, c.stress - FOG_STRESS_RELIEF)
      // Furtive/Recluse personalities and creatures with the cave_sighted or
      // echo_sense adaptations all benefit from low visibility — their
      // perceptual style suits the haze. Race tag no longer required.
      if (adaptations.includes('cave_sighted') || adaptations.includes('echo_sense')
          || c.genome.personality === 'Furtive' || c.genome.personality === 'Recluse') {
        c.stress = Math.max(0, c.stress - VEIL_FOG_STRESS_RELIEF)
      }
    } else if (weather === 'windstorm') {
      // Windstorm — exposed creatures gain stress; rocky biome gives partial
      // shelter; thick_pelt and ridge_armor reduce the felt impact.
      const currentTileForWind = state.tiles[c.y]?.[c.x]
      const sheltered = currentTileForWind?.biome === 'rocky'
        || currentTileForWind?.type === 'cave'
        || currentTileForWind?.type === 'tree' || currentTileForWind?.type === 'shelter'
      let windMult = sheltered ? 0.35 : 1.0
      if (adaptations.includes('thick_pelt')) windMult *= 0.7
      if (adaptations.includes('ridge_armor')) windMult *= 0.7
      c.stress = Math.min(100, c.stress + WINDSTORM_STRESS_PER_TICK * windMult)
    } else if (weather === 'bloom') {
      // Spring abundance pulse — passive relief for everyone who isn't fleeing.
      c.stress = Math.max(0, c.stress - BLOOM_STRESS_RELIEF)
    } else if (weather === 'ashfall') {
      // Acrid air; mild persistent stress; thick_pelt offers no relief,
      // but bioluminescent / spore_resistant adaptations are partially immune
      // (their physiology tolerates particulates).
      const ashMult = (adaptations.includes('spore_resistant') ? 0.4 : 1.0)
      c.stress = Math.min(100, c.stress + ASHFALL_STRESS_PER_TICK * ashMult)
    }

    // Terrain comfort effects — driven by the creature's adaptations and the
    // environment it has actually lived in (dominantBiome experience), not by a
    // race tag. Race genomes can still bias which adaptations are inherited
    // (in genetics.ts), but the effect itself is mediated by a real trait.
    {
      const currentTileForTerrain = state.tiles[c.y]?.[c.x]
      // heat_plated / thermal_vent creatures find comfort on burned/barren
      // ground — they're physiologically adapted to scorch heat
      if (currentTileForTerrain && (adaptations.includes('heat_plated') || adaptations.includes('thermal_vent'))
          && (currentTileForTerrain.type === 'barren' || (currentTileForTerrain.burning ?? 0) > 0)) {
        c.stress = Math.max(0, c.stress - EMBER_FIRE_STRESS_RELIEF)
      }
      // cold_hardy / thick_pelt creatures on rocky high ground retain heat
      if (currentTileForTerrain?.biome === 'rocky'
          && (adaptations.includes('cold_hardy') || adaptations.includes('thick_pelt'))) {
        c.warmth = Math.min(100, c.warmth + 0.3)
        c.stress = Math.max(0, c.stress - 0.2)
      }
    }

    // Awareness acceleration; caretaker actions near a creature boost sentience
    const lastActionX = state.caretaker.lastActionX ?? null
    const lastActionY = state.caretaker.lastActionY ?? null
    // Caretaker proximity — creature notices something anomalous happened nearby.
    // The player's presence is no longer a direct sentience injection. Instead,
    // it registers as a 'caretaker_contact' experience that contributes to
    // experienceWeight (lived breadth), which in turn feeds cognitionPressure.
    // The colony becomes aware of the caretaker through accumulated observation,
    // not because the caretaker's gaze is hardwired into the sentience score.
    // visibility profile axis scales both reach and window of perception
    const visMult = mods.caretakerVisibilityMult ?? 1
    const visRadius = Math.round(CARETAKER_PRESENCE_RADIUS * visMult)
    const visWindow = CARETAKER_PRESENCE_WINDOW_MS * visMult
    if (lastActionX !== null && lastActionY !== null
        && c.genome.mind !== 'Feral'
        && Date.now() - (state.caretaker.lastActionMs ?? 0) < visWindow
        && Math.abs(c.x - lastActionX) <= visRadius
        && Math.abs(c.y - lastActionY) <= visRadius) {
      // Only creatures in a receptive state can perceive the anomaly and form an association.
      // A creature fleeing, fighting, or dying is too occupied with immediate survival
      // to register that something inexplicable just happened nearby.
      const receptive = c.state === 'idle' || c.state === 'wandering' || c.state === 'observing'
        || c.state === 'dreaming' || c.state === 'bonding'
        || (c.state === 'seeking_food' && c.hunger < 70)
      if (receptive) {
        recordExperience(c, 'caretaker_contact', state.time.day)
        c.stress = Math.max(0, c.stress - 0.4)
      }
    }

    // Survived starvation: creature was critical and recovered
    if (c.hunger > 90 && c.health > 30) {
      recordExperience(c, 'survived_starvation', state.time.day)
    }

    // Solitude check: alone within 10 tiles for a prolonged period
    const hasNearby = aliveCreatures.some(o =>
      o.id !== c.id && Math.abs(o.x - c.x) <= 10 && Math.abs(o.y - c.y) <= 10)
    if (!hasNearby) {
      recordExperience(c, 'long_solitude', state.time.day)
    }

    // Disease drains health each tick while sick. Auto-clears once health recovers
    // (caretaker heal or healroot can push health above the recovery threshold).
    if (c.state === 'sick') {
      c.health = Math.max(0, c.health - DISEASE_HEALTH_DRAIN)
      if (c.health >= DISEASE_RECOVERY_HEALTH) {
        c.state = 'idle'
        c.stateTimer = 0
        c.immunity = Math.min(1, (c.immunity ?? 0) + DISEASE_IMMUNITY_GAIN)
      }
    }

    // Grooming state; both groomer and target slowly destress while adjacent
    if (c.state === 'grooming') {
      const groomTarget = aliveCreatures.find(
        o => o.id !== c.id && Math.abs(o.x - c.x) <= 1 && Math.abs(o.y - c.y) <= 1
          && c.bonds.some(b => b.targetId === o.id)
      )
      if (groomTarget) {
        const { groomer: ga, partner: gb } = applyGroomingEffect(c, groomTarget)
        c = ga
        creatures[groomTarget.id] = { ...creatures[groomTarget.id], stress: gb.stress }
      }
      if ((c.stateTimer ?? 0) >= 30) { c.state = 'idle'; c.stateTimer = 0 }
    }

    const behaviorChanges = tickBehavior(c, tiles, creatures, state.time.season, aliveCreatures, tileIdx, state.enrichmentItems, weather, recentFractureDay, state.time.day, creatureGrid)
    c = { ...c, ...behaviorChanges }

    // Playing state; applies stress reduction and times out after PLAY_DURATION_TICKS
    if (c.state === 'playing') {
      c.stress = Math.max(0, c.stress - PLAY_STRESS_REDUCTION)
      if ((c.stateTimer ?? 0) >= PLAY_DURATION_TICKS) {
        c.state = 'idle'
        c.stateTimer = 0
      }
    }

    // Enrichment use; apply per-tick item effects with social/competitive context
    if (c.state === 'using_enrichment' && c.enrichmentTarget) {
      const item = state.enrichmentItems[c.enrichmentTarget]
      if (item) {
        // Social context: is a bonded partner adjacent? (doubles play_toy benefit)
        const partnerNearby = aliveCreatures.some(
          o => o.id !== c.id && Math.abs(o.x - c.x) <= 1 && Math.abs(o.y - c.y) <= 1
            && c.bonds.some(b => b.targetId === o.id && b.strength > 20)
        )
        const fx = applyEnrichmentEffect(c, item.type, partnerNearby)
        c = { ...c, ...fx }

        if ((c.stateTimer ?? 0) >= 10) {
          c.state = 'idle'
          c.enrichmentTarget = undefined
          c.stateTimer = 0
        }
      } else {
        c.state = 'idle'
        c.enrichmentTarget = undefined
      }
    }

    // Snow movement penalty; deep snow has a chance to prevent movement entirely
    // this tick (simulates slowed, effortful travel through accumulation).
    // Formula: at depth=0 → 100% allowed; at depth=1 → SNOW_MOVE_PENALTY (55%) allowed.
    const creatureSnowDepth = tiles[c.y]?.[c.x]?.snowDepth ?? 0
    const skipMoveRoll = creatureSnowDepth > 0 ? 1 - (1 - SNOW_MOVE_PENALTY) * creatureSnowDepth : 1
    const allowMove = Math.random() < skipMoveRoll
    const movChanges = allowMove ? tickMovement(c, tiles) : {}
    c = { ...c, ...movChanges }
    // Defensive clamp: every code path that produces a target / position is
    // expected to bound it, but the engine treats out-of-bounds creatures as
    // a hard invariant violation (renderer reads tiles[c.y][c.x] without
    // bounds checks). Re-clamp on every tick as belt-and-braces insurance.
    if (c.x < 0 || c.x >= WORLD_SIZE || c.y < 0 || c.y >= WORLD_SIZE) {
      c.x = Math.max(0, Math.min(WORLD_SIZE - 1, c.x))
      c.y = Math.max(0, Math.min(WORLD_SIZE - 1, c.y))
    }
    if (c.targetX !== null && (c.targetX < 0 || c.targetX >= WORLD_SIZE)) {
      c.targetX = Math.max(0, Math.min(WORLD_SIZE - 1, c.targetX))
    }
    if (c.targetY !== null && (c.targetY < 0 || c.targetY >= WORLD_SIZE)) {
      c.targetY = Math.max(0, Math.min(WORLD_SIZE - 1, c.targetY))
    }

    // At-tile resource consumption
    const currentTile = tiles[c.y]?.[c.x]
    if (currentTile) {
      // Eat when on food patch or berry bush and hungry (state-independent)
      if ((currentTile.type === 'food_patch' || currentTile.type === 'bush') && currentTile.foodAmount > 0 && c.hunger > 15) {
        const before = c.hunger
        const result = eatFromTile(c, currentTile)
        c = result.creature
        if (!clonedTileRows[c.y]) { tiles[c.y] = srcTiles[c.y].slice(); clonedTileRows[c.y] = 1 }
        tiles[c.y][c.x] = result.tile
        if (c.state === 'seeking_food') c.state = 'idle'
        if (DEBUG) console.log(`[EAT] ${c.name} hunger ${before.toFixed(1)} → ${c.hunger.toFixed(1)} (tile food: ${tiles[c.y][c.x].foodAmount.toFixed(1)})`)
      }

      // Healroot consumption; sick creatures or seeking_healroot creatures heal on tile
      if (currentTile.type === 'healroot' && (currentTile.healrootAmount ?? 0) > 0
          && (c.state === 'sick' || c.state === 'seeking_healroot' || c.health < HEALROOT_SEEK_HEALTH)) {
        const result = healFromRoot(c, currentTile)
        c = result.creature
        if (!clonedTileRows[c.y]) { tiles[c.y] = srcTiles[c.y].slice(); clonedTileRows[c.y] = 1 }
        tiles[c.y][c.x] = result.tile
        // Trigger a shake micro-animation; shuddering off illness
        if (Math.random() < 0.5) {
          c = { ...c, microAnim: { type: 'shake', startMs: Date.now() } }
        }
      }

      // Carried healroot delivery; if a creature is carrying healroot and reaches a
      // sick tribemate, drop it for them
      if (c.carrying === 'healroot' && c.carryingTargetId) {
        const target = creatures[c.carryingTargetId]
        if (target && target.diedOnDay === null
            && Math.abs(target.x - c.x) <= 1 && Math.abs(target.y - c.y) <= 1) {
          creatures[c.carryingTargetId] = {
            ...target,
            health: Math.min(100, target.health + HEALROOT_CARRY_HEAL),
            stress: Math.max(0, target.stress - 6),
          }
          c = { ...c, carrying: undefined, carryingTargetId: undefined, state: 'idle' }
        }
      }

      // Harvesting — creature has arrived at a tree or rock tile; collect resource
      if (c.state === 'harvesting' && c.targetX === c.x && c.targetY === c.y) {
        const isTree = currentTile.type === 'tree' || currentTile.type === 'shelter'
        const isRock = currentTile.type === 'rock' || currentTile.type === 'cave'
        if (isTree || isRock) {
          c = { ...c, carrying: isTree ? 'wood' : 'stone', state: 'idle', targetX: null, targetY: null }
        } else {
          // Arrived but tile type changed (e.g. tree burned); abandon this task
          c = { ...c, state: 'idle', targetX: null, targetY: null }
        }
      }

      // Building — creature has arrived at its build target; validate tile and place fence
      if (c.state === 'building' && c.targetX === c.x && c.targetY === c.y
          && (c.carrying === 'wood' || c.carrying === 'stone')) {
        const validBuildTypes = new Set(['grass', 'barren', 'food_patch', 'death_site', 'bush'])
        let bx = c.x, by = c.y
        // If current tile is invalid (terrain changed), search for nearest valid alternative
        if (!validBuildTypes.has(currentTile.type)) {
          const claim = c.territoryClaim ?? { x: c.x, y: c.y }
          let bestDist = Infinity
          outer: for (let dy = -FENCE_STRESS_RADIUS * 2; dy <= FENCE_STRESS_RADIUS * 2; dy++) {
            for (let dx = -FENCE_STRESS_RADIUS * 2; dx <= FENCE_STRESS_RADIUS * 2; dx++) {
              const tx = claim.x + dx, ty = claim.y + dy
              if (tx < 0 || ty < 0 || tx >= 240 || ty >= 240) continue
              const t = tiles[ty]?.[tx]
              if (!t || !validBuildTypes.has(t.type)) continue
              const dist = Math.abs(dx) + Math.abs(dy)
              if (dist < bestDist) { bestDist = dist; bx = tx; by = ty }
              if (bestDist <= 1) break outer
            }
          }
        }
        const buildTile = tiles[by]?.[bx]
        if (buildTile && validBuildTypes.has(buildTile.type)) {
          if (!clonedTileRows[by]) { tiles[by] = srcTiles[by].slice(); clonedTileRows[by] = 1 }
          tiles[by][bx] = {
            ...buildTile,
            type: 'fence',
            fenceDurability: FENCE_INITIAL_DURABILITY,
            fenceType: c.carrying === 'wood' ? 'wood' : 'stone',
          }
        }
        c = { ...c, carrying: undefined, state: 'idle', targetX: null, targetY: null }
      }

      // Cave warmth and food caching; shelter insulates and slows hunger
      if (currentTile.type === 'cave') {
        c.warmth = Math.min(100, c.warmth + CAVE_WARMTH_BONUS)
        c.hunger = Math.max(0, c.hunger - HUNGER_DECAY * 0.35)
        // Natural enrichment: cave safety calms stress
        c.stress = Math.max(0, c.stress - NATURAL_CAVE_STRESS_REDUCTION)
      }

      // Solar warmth recovery; clear daytime on warm biomes slowly restores warmth.
      // Partial offset to the constant baseline drain — warmth still bleeds in shade,
      // at night, and during rain/storm, but sun-exposed temperate/arid ground sustains.
      const isSunnyWeather = weather === 'clear' || weather === 'drought'
      if (isSunnyWeather
          && (state.time.phase === 'day' || state.time.phase === 'dawn')
          && (currentTile.biome === 'temperate' || currentTile.biome === 'arid')) {
        c.warmth = Math.min(100, c.warmth + SOLAR_WARMTH_BONUS)
      }

      // Winter huddling: bonded creatures that are adjacent share body heat.
      // Each bonded neighbour within 1 tile grants a small warmth bonus (capped at 3).
      if (state.time.season === 'winter') {
        let bondedAdjacent = 0
        for (const other of aliveCreatures) {
          if (other.id === c.id) continue
          if (Math.abs(other.x - c.x) <= 1 && Math.abs(other.y - c.y) <= 1) {
            if (c.bonds.some(b => b.targetId === other.id && b.strength >= 20)) {
              bondedAdjacent++
            }
          }
        }
        if (bondedAdjacent > 0) {
          c.warmth = Math.min(100, c.warmth + HUDDLE_WARMTH_BONUS * Math.min(bondedAdjacent, 3))
        }
      }

      // Bioluminescent: at night, glow reduces stress of nearby creatures
      if (adaptations.includes('bioluminescent') && state.time.phase === 'night') {
        for (const other of aliveCreatures) {
          if (other.id === c.id) continue
          if (Math.abs(other.x - c.x) <= BIOLUMINESCENT_STRESS_RADIUS
              && Math.abs(other.y - c.y) <= BIOLUMINESCENT_STRESS_RADIUS) {
            creatures[other.id] = {
              ...creatures[other.id],
              stress: Math.max(0, (creatures[other.id].stress ?? other.stress) - BIOLUMINESCENT_STRESS_RELIEF),
            }
          }
        }
      }

      // Cannibal trauma: persistent stress from witnessing cannibalism
      if (c.traumaUntil !== undefined && c.traumaUntil > state.time.day) {
        c.stress = Math.min(100, c.stress + CANNIBAL_TRAUMA_STRESS_PER_TICK)
        // thought is derived from state in tickNeeds; no direct override needed
      }

      // Natural enrichment; world terrain as passive enrichment
      if (currentTile.type === 'river' || currentTile.type === 'mud') {
        c.stress = Math.max(0, c.stress - NATURAL_RIVER_STRESS_REDUCTION)
      }
      if (currentTile.type === 'tree' || currentTile.type === 'shelter') {
        c.stress = Math.max(0, c.stress - NATURAL_TREE_STRESS_REDUCTION)
      }
      // Bush concealment calms all creatures; Timid benefit most from the cover
      if (currentTile.type === 'bush') {
        const bushBonus = c.genome.personality === 'Timid' ? NATURAL_BUSH_STRESS_REDUCTION * 1.8
          : c.genome.personality === 'Recluse' ? NATURAL_BUSH_STRESS_REDUCTION * 1.3
          : NATURAL_BUSH_STRESS_REDUCTION
        c.stress = Math.max(0, c.stress - bushBonus)
      }
      if (currentTile.biome === 'rocky' && c.genome.mind === 'Sentinel') {
        c.sentience = Math.min(100, c.sentience + NATURAL_ROCKY_SENTINEL_BONUS)
      }

      // ── Build-kit auras ──────────────────────────────────────────────────────
      // Cairn calms anyone within CAIRN_STRESS_RADIUS — a memorial steadies the
      // colony. Nest provides a small calming aura to creatures resting near it.
      // Watch post drifts every nearby creature's vigilance drive toward 1.0,
      // so prolonged proximity reshapes their behavioural priors.
      const px = c.x, py = c.y
      const checkR = Math.max(CAIRN_STRESS_RADIUS, NEST_RADIUS, WATCH_POST_RADIUS)
      let cairnAura = false, nestAura = false, watchAura = false
      const ymin = Math.max(0, py - checkR), ymax = Math.min(WORLD_SIZE - 1, py + checkR)
      const xmin = Math.max(0, px - checkR), xmax = Math.min(WORLD_SIZE - 1, px + checkR)
      for (let ny = ymin; ny <= ymax && !(cairnAura && nestAura && watchAura); ny++) {
        const row = state.tiles[ny]
        for (let nx = xmin; nx <= xmax; nx++) {
          const at = row[nx].type
          if (at !== 'cairn' && at !== 'nest' && at !== 'watch_post') continue
          const md = Math.max(Math.abs(nx - px), Math.abs(ny - py))
          if (!cairnAura && at === 'cairn' && md <= CAIRN_STRESS_RADIUS) cairnAura = true
          else if (!nestAura && at === 'nest' && md <= NEST_RADIUS) nestAura = true
          else if (!watchAura && at === 'watch_post' && md <= WATCH_POST_RADIUS) watchAura = true
        }
      }
      if (cairnAura) c.stress = Math.max(0, c.stress - CAIRN_STRESS_RELIEF)
      if (nestAura)  c.stress = Math.max(0, c.stress - NEST_STRESS_RELIEF)
      if (watchAura && c.drives) {
        c.drives = { ...c.drives, vigilance: Math.min(1, c.drives.vigilance + WATCH_POST_VIGILANCE_DRIFT) }
      }

      // Auto-lightning strike damage; lightningFlash is set this same tick by
      // tickTiles, so checking < 2s means "struck this tick or the one before"
      if ((currentTile.lightningFlash ?? 0) > Date.now() - 2000) {
        c.health = Math.max(0, c.health - AUTO_LIGHTNING_DAMAGE)
        c.stress = Math.min(100, c.stress + 40)
        if (c.state !== 'dying') c.state = 'fleeing'
      }

      // ── Snow effects on creature (movement penalty applied in tickMovement,
      // warmth drain applied here each tick per depth) ─────────────────────
      const snowDepth = currentTile.snowDepth ?? 0
      if (snowDepth > 0.1) {
        // Snow warmth drain; skipped on winter nights to cap total drain at 2× winter rate.
        // (tickNeeds + night bonus already hit 2× WARMTH_DECAY_WINTER in that condition.)
        const isWinterNight = state.time.season === 'winter' && state.time.phase === 'night'
        if (!isWinterNight) {
          const snowWarmthDrain = SNOW_WARMTH_DRAIN * snowDepth
          c.warmth = Math.max(0, c.warmth - snowWarmthDrain)
        }
        // Deep snow also adds slight stress (cold, unfamiliar ground)
        if (snowDepth > 0.5) {
          c.stress = Math.min(100, c.stress + 0.08 * snowDepth)
        }
      }

      // ── Puddle: creatures can drink from standing water (mud tiles) ───────
      if ((currentTile.type === 'mud') && (currentTile.puddleLevel ?? 0) > 0.2 && c.thirst > 15) {
        const drinkEff = 0.5  // less efficient than a clean river
        c.thirst = Math.max(0, c.thirst - PUDDLE_THIRST_RELIEF * drinkEff)
        if (c.state === 'seeking_water') c.state = 'idle'
        // Drinking reduces puddle level slightly
        if (!clonedTileRows[c.y]) { tiles[c.y] = srcTiles[c.y].slice(); clonedTileRows[c.y] = 1 }
        tiles[c.y][c.x] = { ...tiles[c.y][c.x], puddleLevel: Math.max(0, (currentTile.puddleLevel ?? 0) - 0.008) }
      }

      // Drink when on river tile and thirsty; consumes water from the tile
      if (currentTile.type === 'river' && currentTile.waterLevel > 0 && c.thirst > 15) {
        const before = c.thirst
        c = drinkFromTile(c, currentTile)
        const wt = writeTile(c.y, c.x)
        wt.waterLevel = Math.max(0, wt.waterLevel - WATER_DRINK_DRAIN)
        if (c.state === 'seeking_water') c.state = 'idle'
        if (DEBUG) console.log(`[DRINK] ${c.name} thirst ${before.toFixed(1)} → ${c.thirst.toFixed(1)}`)
      }

      // Drink when adjacent to a river tile; position-aware so the drained tile is tracked
      if (currentTile.type !== 'river' && c.thirst > 15) {
        const adjDirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]] as const
        for (const [dx, dy] of adjDirs) {
          const ax = c.x + dx, ay = c.y + dy
          if (ax < 0 || ax >= WORLD_SIZE || ay < 0 || ay >= WORLD_SIZE) continue
          const adjTile = tiles[ay][ax]
          if (adjTile.type === 'river' && adjTile.waterLevel > 0) {
            const before = c.thirst
            c = drinkFromTile(c, adjTile)
            const wt = writeTile(ay, ax)
            wt.waterLevel = Math.max(0, wt.waterLevel - WATER_DRINK_DRAIN)
            if (c.state === 'seeking_water') c.state = 'idle'
            if (DEBUG) console.log(`[DRINK adj] ${c.name} thirst ${before.toFixed(1)} → ${c.thirst.toFixed(1)}`)
            break
          }
        }
      }

      // Warm up in shelter during winter
      if (c.state === 'seeking_shelter' && currentTile.shelter) {
        c.warmth = Math.min(100, c.warmth + 10)
        c.state = 'idle'
      }

      // Cannibalism; last-resort survival. Triggered when desperately
      // hungry and standing on a fresh death site. The corpse is consumed
      // (tile reverts to barren), hunger relieved, but lasting psychological
      // cost: stress spike, needSatisfaction drop, and stress added to any
      // creature that witnesses the act.
      if (currentTile.type === 'death_site'
        && c.hunger > CANNIBAL_HUNGER_THRESHOLD
        && c.health > 8) {
        c.hunger = Math.max(0, c.hunger - CANNIBAL_HUNGER_RELIEF)
        c.stress = Math.min(100, c.stress + CANNIBAL_STRESS_PENALTY)
        c.needSatisfaction = Math.max(0, c.needSatisfaction - 22)
        const cannibalTile = writeTile(c.y, c.x)
        cannibalTile.type = 'barren'
        cannibalTile.deathSiteOf = null
        cannibalTile.deathSiteAge = 0
        if (c.state === 'seeking_food' || c.state === 'scavenging' || c.state === 'migrating') c.state = 'idle'

        // Stress nearby witnesses; magnitude and duration emerge from the witness's
        // own drives, their bond to the deceased (if any), and their recent
        // experiences with death. Personality no longer dictates the reaction —
        // it merely seeded the drives that now mediate it.
        // Bucketed neighbour query — only iterates creatures whose cell overlaps
        // a radius-3 box around (c.x, c.y) instead of every alive creature.
        for (const witness of nearbyCreatures(creatureGrid, c.x, c.y, 3)) {
          if (witness.id === c.id || witness.diedOnDay !== null) continue
          if (Math.abs(witness.x - c.x) <= 3 && Math.abs(witness.y - c.y) <= 3) {
            const drives = witness.drives
            // Witness response: sociality and vigilance both "look at" the act;
            // reclusion and dominance both "turn away" from it. Bond to victim
            // amplifies. Habituation comes from prior witnessed deaths.
            const lookAt   = drives ? drives.sociality + drives.vigilance : 1.0
            const turnAway = drives ? drives.reclusion + drives.dominance * 0.5 : 0.5
            const bondToVictim = witness.bonds.find(b => b.targetId === c.id)?.strength ?? 0
            const recentDeath = (witness.observedEvents ?? []).filter(
              o => o.kind === 'witnessed_death' && state.time.day - o.day < 8
            ).length
            const habituation = 1 / (1 + recentDeath * 0.25)  // smooth decay, no floor
            const bondAmp = 1 + bondToVictim / 100
            const sensitivity = Math.max(0.1, (lookAt - turnAway) * bondAmp * habituation)
            creatures[witness.id] = {
              ...witness,
              stress: Math.min(100, witness.stress + CANNIBAL_WITNESS_STRESS * sensitivity),
              traumaUntil: state.time.day + Math.round(CANNIBAL_TRAUMA_DURATION_DAYS * sensitivity),
            }
            recordObservation(creatures[witness.id], 'witnessed_death', state.time.day, { creatureId: c.id, detail: 'cannibal' })
          }
        }

        if (state.time.day - lastMsgDay >= 1) {
          // Cite the real hunger value driving the act so the line is grounded,
          // not a moral verdict from the engine. The act itself is the report.
          const h = Math.round(c.hunger)
          messages.push({
            id: uuid(),
            text: `${c.name} ate from a corpse. hunger was ${h}.`,
            stage: 1,
            creatureId: c.id,
            day: state.time.day,
            timestamp: Date.now(),
            read: false,
          })
          lastMsgDay = state.time.day
        }
      }

      // Fire damage; standing on a burning tile sears health and panics
      if ((currentTile.burning ?? 0) > 0) {
        c.health = Math.max(0, c.health - FIRE_TICK_DAMAGE)
        c.stress = Math.min(100, c.stress + 12)
        if (c.state !== 'fleeing' && c.state !== 'dying') {
          // Flee away from local heat concentration, not toward map center.
          // Count burning tiles in each cardinal direction within radius 1
          // to find the coolest escape route.
          let heatE = 0, heatW = 0, heatS = 0, heatN = 0
          for (const [ddx, ddy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]] as [number,number][]) {
            const nx = c.x + ddx, ny = c.y + ddy
            if (nx >= 0 && nx < WORLD_SIZE && ny >= 0 && ny < WORLD_SIZE
                && (tiles[ny]?.[nx]?.burning ?? 0) > 0) {
              if (ddx > 0) heatE++; if (ddx < 0) heatW++
              if (ddy > 0) heatS++; if (ddy < 0) heatN++
            }
          }
          const dx = heatE > heatW ? -1 : heatW > heatE ? 1 : (Math.random() < 0.5 ? -1 : 1)
          const dy = heatS > heatN ? -1 : heatN > heatS ? 1 : (Math.random() < 0.5 ? -1 : 1)
          c.state = 'fleeing'
          c.targetX = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + dx * 6))
          c.targetY = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + dy * 6))
        }

        // Generational memory: see EXPERIENTIAL_SYMBOL_TABLE below — same
        // systematic mechanism used for every condition the creature lives
        // through, not three handpicked special cases.
      }

      // Experiential symbol acquisition: any condition listed in the table
      // can crystallise a symbol on the creature when they live through it.
      // The table is in one place; adding a new condition adds the rule
      // systematically rather than spawning another scattered if-block.
      for (const [predicate, symbol] of EXPERIENTIAL_SYMBOL_TABLE) {
        if (c.knownEmoji.includes(symbol)) continue
        if (predicate(c, currentTile, state)) c.knownEmoji = [...c.knownEmoji, symbol]
      }
    }

    // ── Ecological disease spread ─────────────────────────────────────────────
    // Disease no longer fires purely on headcount. Contagion emerges from:
    //   1. Local density (how many creatures are literally adjacent)
    //   2. Season (autumn/winter spike — pathogens persist in cold, damp air)
    //   3. Biome (wetland = stagnant water = pathogen reservoir; arid = desiccating)
    //   4. Weather (rain/storm increase contact and weaken warmth)
    //   5. Stress (immune suppression from chronic stress)
    //   6. Sick neighbours (direct contact vector; unchanged from before)
    // This means disease outbreaks feel ecologically motivated: a wet autumn
    // in a dense wetland colony is dangerous. A dispersed arid colony in summer is not.
    if (c.state !== 'sick' && c.health > 35) {
      // Local density — count adjacent creatures
      let crowding = 0
      for (const other of aliveCreatures) {
        if (other.id === c.id) continue
        if (Math.abs(other.x - c.x) <= 1 && Math.abs(other.y - c.y) <= 1) {
          crowding++
          if (crowding >= 5) break
        }
      }

      // Season multiplier: autumn/winter are prime pathogen seasons
      const seasonMult = state.time.season === 'autumn' ? 1.8
        : state.time.season === 'winter' ? 1.5
        : state.time.season === 'spring' ? 0.9
        : 0.6  // summer: low baseline

      // Biome multiplier: wetlands breed pathogens; arid is naturally hostile to them
      const biome = creatureTile?.biome ?? 'temperate'
      const biomeMult = biome === 'wetland' ? 2.2
        : biome === 'lush' ? 1.3
        : biome === 'temperate' ? 1.0
        : biome === 'rocky' ? 0.8
        : 0.5  // arid

      // Weather multiplier: rain/storm weaken resistance and increase contact
      const wMult = weather === 'rain' ? 1.4 : weather === 'storm' ? 1.6 : 1.0

      // Stress suppresses immunity: chronically stressed creatures get sick more
      const stressMult = c.stress > 70 ? 1.5 : c.stress > 50 ? 1.2 : 1.0

      // Immunity protection
      const immunityReduction = 1 - Math.min(DISEASE_IMMUNITY_PROTECTION, (c.immunity ?? 0) * DISEASE_IMMUNITY_PROTECTION)

      // Adaptation and race disease resistance
      const sporeResistMult = adaptations.includes('spore_resistant') ? SPORE_RESISTANT_DISEASE_MULT : 1.0
      const mireResistMult  = c.genome.race === 'Mire' ? MIRE_DISEASE_RESIST : 1.0

      // Base contact chance is low; it accumulates from ecology, not headcount
      const contactChance = DISEASE_CONTACT_CHANCE * seasonMult * biomeMult * wMult * stressMult * immunityReduction * sporeResistMult * mireResistMult * (mods.diseasePressureMult ?? 1)

      // Requires some local density; solitary creatures don't get contagious disease
      if (crowding >= 2 && Math.random() < contactChance * crowding) {
        c.state = 'sick'
        c.stateTimer = 0
        c.health = Math.max(15, c.health - 6)
      }
    }

    // Bond-based spread: sick bonded partners nearby raise contact chance significantly.
    if (c.state !== 'sick' && c.health > 25) {
      const hasSickBondedNeighbour = c.bonds.some(b => {
        const other = creatures[b.targetId]
        return other && other.diedOnDay === null && other.state === 'sick'
          && b.strength >= 30
          && Math.abs(other.x - c.x) <= 2 && Math.abs(other.y - c.y) <= 2
      })
      if (hasSickBondedNeighbour) {
        const bondImmunityReduction = 1 - Math.min(DISEASE_IMMUNITY_PROTECTION, (c.immunity ?? 0) * DISEASE_IMMUNITY_PROTECTION)
        if (Math.random() < DISEASE_CONTACT_CHANCE * DISEASE_BOND_SPREAD_MULT * bondImmunityReduction) {
          c.state = 'sick'
          c.stateTimer = 0
          c.health = Math.max(15, c.health - 4)
        }
      }
    }

    // ── Inter-lineage relations: stress is earned through history, not taxonomy ──
    // Lineages that share offspring (hybrid IDs), have peaceful cohabitation history,
    // or have cross-lineage bonds experience reduced proximity stress.
    // Lineages with combat history experience amplified stress.
    // The lineageRelations map accumulates this over time; stress is derived from it.
    if (c.lineageId) {
      const relations = next.lineageRelations ?? {}
      const nearbyRivals = aliveCreatures.filter(other =>
        other.id !== c.id &&
        other.lineageId !== c.lineageId &&
        Math.abs(other.x - c.x) <= RIVAL_PROXIMITY_RADIUS &&
        Math.abs(other.y - c.y) <= RIVAL_PROXIMITY_RADIUS
      )
      for (const other of nearbyRivals) {
        const key = [c.lineageId, other.lineageId].sort().join(':')
        // First-encounter relation seeded from the profile's hostility baseline.
        // 'fracture' expectation begins mildly hostile (-15); 'adaptation' mildly
        // allied (+5); 'persistence' neutral (0).
        const relation = relations[key] ?? (mods.lineageHostilityBaseline ?? 0)  // -100..100

        // Hybrid lineages (contain '+') are bridge populations — they stress neither parent line
        const isHybridBridge = c.lineageId.includes('+') || other.lineageId.includes('+')

        // Stress scales inversely with relationship: hostile = full stress, allied = no stress
        // Neutral (0) = half the base stress; relations must be actively negative to cause full stress
        const relationFactor = isHybridBridge ? 0 : Math.max(0, (50 - relation) / 100)
        const stressDelta = RIVAL_STRESS_PER_TICK * relationFactor

        c.stress = Math.min(100, c.stress + stressDelta)

        // Peaceful cohabitation slowly improves relations (up to +30 from proximity alone)
        if (relation < 30 && c.state !== 'fighting') {
          const newRelation = Math.min(100, relation + 0.002)
          next.lineageRelations = { ...next.lineageRelations, [key]: newRelation }
        }
      }

      // Cross-lineage bonds improve relations significantly
      for (const bond of c.bonds) {
        const bonded = next.creatures[bond.targetId]
        if (!bonded || bonded.diedOnDay !== null) continue
        if (bonded.lineageId === c.lineageId) continue
        if (bond.strength < 35) continue
        const key = [c.lineageId, bonded.lineageId].sort().join(':')
        const relation = next.lineageRelations?.[key] ?? 0
        if (relation < 80) {
          next.lineageRelations = {
            ...(next.lineageRelations ?? {}),
            [key]: Math.min(100, relation + 0.01 * (bond.strength / 100))
          }
        }
      }
    }

    // Death check
    if (c.health <= 0 || c.age >= c.maxAge) {
      // Real cause attribution from terminal conditions and recent damage source.
      // Order matters: explicit damage (fire/lightning standing on tile this tick)
      // wins over slow-decline causes (hunger/thirst).
      let cause: DeathCause
      if (c.age >= c.maxAge) cause = 'old_age'
      else if (creatureTile && (creatureTile.burning ?? 0) > 0) cause = 'fire'
      else if (creatureTile && (creatureTile.lightningFlash ?? 0) > Date.now() - 2500) cause = 'lightning'
      else if (c.state === 'sick') cause = 'sickness'
      else if (c.state === 'fighting' || c.killCount > 0 && c.health <= 0) cause = 'combat'
      else if (c.hunger > 75) cause = 'starvation'
      else if (c.thirst > 75) cause = 'dehydration'
      else if (c.warmth < 15) cause = 'cold'
      else cause = 'unknown'
      c.deathCause = cause
      next = recordDeathCause(next, cause)

      if (DEBUG) {
        console.log(
          `[DEATH] ${c.name} (${c.genome.body}/${c.genome.personality}) ` +
          `cause=${cause} age=${c.age}/${c.maxAge} ` +
          `health=${c.health.toFixed(1)} hunger=${c.hunger.toFixed(1)} thirst=${c.thirst.toFixed(1)}`
        )
      }

      c.diedOnDay = state.time.day
      c.state = 'dying'
      totalDeaths++

      if (c.y >= 0 && c.y < WORLD_SIZE && c.x >= 0 && c.x < WORLD_SIZE) {
        const deathTile = writeTile(c.y, c.x)
        deathTile.deathSiteOf = c.id
        deathTile.type = 'death_site'
        deathTile.deathSiteAge = 0

        // Healroot is an ecological opportunist: death disturbs the soil, and moist
        // ground nearby will colonize naturally. Dry or barren tiles won't take root.
        // The creature dying is the trigger, but moisture is the gate — not symbolism.
        if (healrootCount < HEALROOT_CAP) {
          for (let dy = -HEALROOT_DEATH_SITE_RADIUS; dy <= HEALROOT_DEATH_SITE_RADIUS; dy++) {
            for (let dx = -HEALROOT_DEATH_SITE_RADIUS; dx <= HEALROOT_DEATH_SITE_RADIUS; dx++) {
              if (healrootCount >= HEALROOT_CAP) break
              const ny = c.y + dy
              const nx = c.x + dx
              if (ny < 0 || ny >= WORLD_SIZE || nx < 0 || nx >= WORLD_SIZE) continue
              const tile = writeTile(ny, nx)
              // Ecological gate: healroot only establishes in moist, organic-rich ground.
              // Lush/wetland biomes are naturally suitable; river adjacency or standing
              // water (puddle) make even temperate soil viable.
              const isMoist = tile.biome === 'lush' || tile.biome === 'wetland'
                || tile.waterLevel > 20
                || (tile.puddleLevel ?? 0) > 0.2
              if ((tile.type === 'grass' || tile.type === 'mud') && isMoist
                  && Math.random() < HEALROOT_DEATH_SPAWN_CHANCE) {
                tile.type = 'healroot'
                tile.healrootAmount = 60
                healrootCount++
              }
            }
          }
        }
      }

      messages.push(deathMessage(c, state.time.day))

      if (cause === 'starvation') {
        events.push(createEvent('death', [c.id], state.time.day, c.name + ' starved'))
      }
      if (cause === 'combat') {
        next = pushChronicle(next, {
          kind: 'kill_recorded', day: state.time.day,
          creatureId: c.id, creatureName: c.name, lineageId: c.lineageId,
          x: c.x, y: c.y,
        })
        // Witness-based fear: every alive creature within FEAR_WITNESS_RADIUS
        // of the kill site gains a personal fear of the killer (if known).
        // Creatures bonded to the deceased get a deeper fear (FEAR_BONDED_LOSS_BOOST
        // implemented as an earlier "memory day", which keeps the fear fresher longer).
        const killerId = c.lastAttackerId
        if (killerId) {
          for (const witness of aliveCreatures) {
            if (witness.id === c.id || witness.id === killerId) continue
            const dx = Math.abs(witness.x - c.x)
            const dy = Math.abs(witness.y - c.y)
            const bondedToVictim = witness.bonds.some(b => b.targetId === c.id && b.strength > 20)
            if (dx <= FEAR_WITNESS_RADIUS && dy <= FEAR_WITNESS_RADIUS) {
              const cur = creatures[witness.id]
              const updatedFear = { ...(cur.feared ?? {}), [killerId]: state.time.day }
              creatures[witness.id] = { ...cur, feared: updatedFear }
            } else if (bondedToVictim) {
              // Distant bonded peer still learns to fear the killer — they will
              // mourn and the news travels through bond memory.
              const cur = creatures[witness.id]
              const boostedDay = state.time.day + Math.round(FEAR_MEMORY_DAYS * (FEAR_BONDED_LOSS_BOOST - 1))
              const updatedFear = { ...(cur.feared ?? {}), [killerId]: boostedDay }
              creatures[witness.id] = { ...cur, feared: updatedFear }
            }
          }
        }
      }

      for (const bond of c.bonds) {
        if (creatures[bond.targetId] && creatures[bond.targetId].diedOnDay === null) {
          const survivor = creatures[bond.targetId]
          // Mourning depth = bond strength × the survivor's own drive landscape.
          // High sociality = grief reaches deep; high reclusion or low sociality
          // dampens it. No hardcoded personality switch — the same survivor
          // mourns differently after years of drive drift than they would have
          // at birth.
          const bondDepth = bond.strength / 100  // 0-1
          const drives = survivor.drives
          const griefMult = drives
            ? Math.max(0.3, drives.sociality * 1.4 + drives.vigilance * 0.3
                - drives.reclusion * 0.6 - drives.dominance * 0.2)
            : 1.0
          const mourningDuration = Math.max(8, Math.round(12 + bondDepth * 70 * griefMult))
          const stressBump = Math.round(6 + bondDepth * 34 * griefMult)
          creatures[bond.targetId] = {
            ...survivor,
            state: 'mourning',
            stateTimer: mourningDuration,
            stress: Math.min(100, survivor.stress + stressBump),
          }
          // Bonded creature experiences loss
          recordExperience(creatures[bond.targetId], 'bond_lost', state.time.day)
        }
      }

      // Nearby creatures witness the death (not just bonded ones)
      for (const witness of aliveCreatures) {
        if (witness.id === c.id) continue
        if (Math.abs(witness.x - c.x) <= 3 && Math.abs(witness.y - c.y) <= 3) {
          recordExperience(witness, 'witnessed_death', state.time.day)
        }
      }
    }

    // Sentience messages; stage-3 can be questions; responses acknowledge tool actions.
    // The chronicle-aware composer needs the full state so it can cite real events.
    if (c.sentience > 20) {
      const respondedToQuestion = state.caretaker.respondedToQuestion ?? false
      const result = generateMessage(c, state.awarenessStage, state.time.day, lastMsgDay, respondedToQuestion, mods.awarenessMessageMult, state.caretaker.lastToolUsed, { totalGenerations: state.totalGenerations, aliveCount: aliveCreatures.length }, state)
      if (result) {
        messages.push(result.message)
        lastMsgDay = result.message.day
        c.messagesSent = (c.messagesSent ?? 0) + 1
        if (result.isQuestion) {
          nextAwaitingResponseUntil = Date.now() + QUESTION_RESPONSE_WINDOW_MS
        }
        if (respondedToQuestion) {
          clearRespondedFlag = true
        }
      }
    }

    // Q7A: Grief — bonds toward dead creatures fade over ~5 game-days then dissolve.
    if (c.bonds.length > 0 && c.bonds.some(b => creatures[b.targetId]?.diedOnDay !== null)) {
      c.bonds = c.bonds
        .map(b => creatures[b.targetId]?.diedOnDay !== null
          ? { ...b, strength: b.strength - DEAD_BOND_FADE_PER_TICK }
          : b
        )
        .filter(b => b.strength > 0)
    }

    // Bond formation with adjacent creatures + milestone emission.
    // Milestones (35, 70) only emit from the lower-id side of each pair to
    // avoid duplicate flipped messages. Stage is always 1 (mundane social
    // observation) regardless of colony awareness.
    const nearby = aliveCreatures.filter(
      other => other.id !== c.id &&
      Math.abs(other.x - c.x) <= 1 &&
      Math.abs(other.y - c.y) <= 1
    )
    for (const other of nearby) {
      const existingBond = c.bonds.find(b => b.targetId === other.id)
      if (!existingBond) {
        c.bonds = [...c.bonds, { targetId: other.id, strength: 1, since: state.time.day }]
        continue
      }

      const prevStrength = existingBond.strength
      const nextStrength = Math.min(100, prevStrength + BOND_STRENGTH_PER_TICK * mods.bondSpeedMult)
      const bondIdx = c.bonds.indexOf(existingBond)
      if (bondIdx !== -1) {
        c.bonds = [
          ...c.bonds.slice(0, bondIdx),
          { ...existingBond, strength: nextStrength },
          ...c.bonds.slice(bondIdx + 1),
        ]
      }

      // Canonical ordering: only the creature with the smaller id emits the
      // social message, so we don't get "A stays close to B" AND "B stays close to A".
      const isCanonicalEmitter = c.id < other.id
      const crossed35 = prevStrength < 35 && nextStrength >= 35
      const crossed70 = prevStrength < 70 && nextStrength >= 70
      if (isCanonicalEmitter && (crossed35 || crossed70) &&
          state.time.day - lastMsgDay >= 1) {
        const text = crossed70
          ? `${c.name} and ${other.name} have become inseparable.`
          : `${c.name} stays close to ${other.name} now.`
        const msg: ColonyMessage = {
          id: uuid(),
          text,
          stage: 1,            // social observations are stage 1, not awareness
          creatureId: c.id,
          day: state.time.day,
          timestamp: Date.now(),
          read: false,
        }
        messages.push(msg)
        lastMsgDay = state.time.day
      }

      // Experience: first meaningful bond + cross-lineage bond.
      // The chronicle records bond milestones and cross-lineage bonds; the
      // creature's own observation log gets the per-individual entry.
      if (crossed35) {
        recordExperience(c, 'bond_formed', state.time.day)
        recordObservation(c, 'bond_formed', state.time.day, { creatureId: other.id })
        if (c.lineageId !== other.lineageId) {
          recordExperience(c, 'cross_lineage_bond', state.time.day)
          recordExperience(other, 'cross_lineage_bond', state.time.day)
          // Only chronicle once per cross-lineage pair (sort the roots so we
          // produce a stable key both members would generate identically).
          const rootA = c.lineageId.split('_')[0].split('+')[0]
          const rootB = other.lineageId.split('_')[0].split('+')[0]
          const pairKey = [rootA, rootB].sort().join(':')
          next = pushChronicle(next, {
            kind: 'cross_lineage_bond', day: state.time.day,
            creatureId: c.id, creatureName: c.name,
            lineageId: c.lineageId, detail: pairKey,
          }, { onceKey: `xlb:${pairKey}` })
        }
      }
      if (crossed70 && isCanonicalEmitter) {
        next = pushChronicle(next, {
          kind: 'bond_milestone', day: state.time.day,
          creatureId: c.id, creatureName: c.name, detail: other.name,
        })
      }

      // Crisis bond boost: surviving hardship together deepens bonds faster than calm proximity.
      // Both creatures must be in a stress state and close enough to share the experience.
      const otherNow = creatures[other.id]
      if (c.stress > 65 && otherNow && otherNow.diedOnDay === null && otherNow.stress > 65
          && Math.abs(otherNow.x - c.x) <= 2 && Math.abs(otherNow.y - c.y) <= 2) {
        const crisisBondIdx = c.bonds.findIndex(b => b.targetId === other.id)
        if (crisisBondIdx !== -1) {
          c.bonds = [
            ...c.bonds.slice(0, crisisBondIdx),
            { ...c.bonds[crisisBondIdx], strength: Math.min(100, c.bonds[crisisBondIdx].strength + 0.06) },
            ...c.bonds.slice(crisisBondIdx + 1),
          ]
        }
      }

    }
    // Spontaneous combat — gated on the dominance drive (which personality
    // only *seeded*; it has drifted from behavior). High-dominance creatures
    // pick fights only when a viable target (low-vigilance non-Timid neighbour)
    // is right there. No top-level personality switch.
    {
      const dom = c.drives?.dominance ?? 0.3
      if (dom > 0.55 && Math.random() < (dom - 0.5) * 0.004) {
        const target = nearby.find(o =>
          o.id !== c.id
          && o.genome.personality !== 'Timid'
          && (o.drives?.vigilance ?? 0.3) < 0.7
        )
        if (target) {
          const result = resolveFight(c, { ...target })
          c = result.attacker
          creatures[target.id] = result.defender
          events.push(createEvent('fight', [c.id, target.id], state.time.day,
            `${c.name} challenged ${target.name}`))

          if (c.lineageId !== target.lineageId) {
            const key = [c.lineageId, target.lineageId].sort().join(':')
            const relation = next.lineageRelations?.[key] ?? 0
            next.lineageRelations = {
              ...(next.lineageRelations ?? {}),
              [key]: Math.max(-100, relation - 8),
            }
          }
        }
      }
    }

    // ─── Micro-animations — short expressive body actions ─────────────────────
    // Each trigger fires rarely per tick so animations feel special, not spammy.
    const currentTimeMs = Date.now()
    const animActive = c.microAnim && (currentTimeMs - c.microAnim.startMs) < 900
    if (!animActive) {
      let newAnim: typeof c.microAnim = undefined
      if (c.state === 'playing' && Math.random() < MICRO_ANIM_TRIGGER_CHANCE.jump)
        newAnim = { type: 'jump', startMs: currentTimeMs }
      else if ((c.warmth < 28 || c.state === 'sick') && Math.random() < MICRO_ANIM_TRIGGER_CHANCE.shake)
        newAnim = { type: 'shake', startMs: currentTimeMs }
      else if ((c.state === 'sick' || (c.dominantBiome === 'arid' && Math.random() < 0.4))
               && Math.random() < MICRO_ANIM_TRIGGER_CHANCE.sneeze)
        newAnim = { type: 'sneeze', startMs: currentTimeMs }
      else if (c.state === 'grooming' && Math.random() < MICRO_ANIM_TRIGGER_CHANCE.groom)
        newAnim = { type: 'groom', startMs: currentTimeMs }
      else {
        // Wag when a bonded partner just moved adjacent
        const partnerJustArrived = aliveCreatures.some(
          o => o.id !== c.id
            && Math.abs(o.x - c.x) <= 1 && Math.abs(o.y - c.y) <= 1
            && c.bonds.some(b => b.targetId === o.id && b.strength > 40)
        )
        if (partnerJustArrived && Math.random() < MICRO_ANIM_TRIGGER_CHANCE.wag)
          newAnim = { type: 'wag', startMs: currentTimeMs }
      }
      if (newAnim) c = { ...c, microAnim: newAnim }
    }

    // ─── Speech system ─────────────────────────────────────────────────────
    // 1. Sentience-gated tier unlock; creature may learn a new emoji this tick
    const newTierEmoji = unlockTierEmoji(c, Math.random)
    if (newTierEmoji && !c.knownEmoji.includes(newTierEmoji)) {
      c = { ...c, knownEmoji: [...c.knownEmoji, newTierEmoji] }
    }

    // 2. Proximity learning; bonded nearby creatures share vocabulary
    for (const other of nearby) {
      const bond = c.bonds.find(b => b.targetId === other.id)
      if (!bond) continue
      const learned = learnFromNearby(c, other, bond.strength, Math.random)
      if (learned) {
        c = { ...c, knownEmoji: [...c.knownEmoji, learned] }
        // Reciprocally teach the other creature too (lower chance)
        const otherLearned = learnFromNearby(other, c, bond.strength, Math.random)
        if (otherLearned && !creatures[other.id].knownEmoji.includes(otherLearned)) {
          creatures[other.id] = { ...creatures[other.id], knownEmoji: [...creatures[other.id].knownEmoji, otherLearned] }
        }
      }
    }

    // 3. Role assignment; assign/refresh when tribe membership changes or colony grows
    if (aliveCount >= 6 && (c.tribeId || aliveCount >= 10)) {
      const lineageCount = aliveCreatures.filter(o => o.lineageId === c.lineageId).length
      const role = assignRole(c, aliveCount, lineageCount)
      if (role !== c.role) {
        const prevRole = c.role
        c = { ...c, role }
        // First-time role in this colony — chronicle it; the colony's culture has
        // produced a new specialization. onceKey makes it fire once per role.
        if (role && role !== prevRole) {
          next = pushChronicle(next, {
            kind: 'role_emerged', day: state.time.day,
            creatureId: c.id, creatureName: c.name, detail: role,
          }, { onceKey: `role_emerged:${role}` })
        }
      }
    }

    // 4. Speech event; generate overhead dialogue with rate limiting
    // Only speak: not dead, not Feral, have at least 1 emoji, bonded nearby partner exists,
    // and at least 8 ticks since last speech (8s real time per creature).
    const speechTimeMs = Date.now()
    const speechCooldown = c.role === 'shaman' || c.role === 'elder' ? 6000 : 10000
    // Urgent broadcast: fighting, fleeing, sick, dying, or critical needs can speak
    // without a bonded nearby partner — these are distress signals, not conversations.
    const isUrgentBroadcast = c.state === 'fighting' || c.state === 'fleeing'
      || c.state === 'sick' || c.state === 'dying'
      || c.hunger > 85 || c.thirst > 85 || c.warmth < 12
    const canSpeak = c.diedOnDay === null
      && c.genome.mind !== 'Feral'
      && c.knownEmoji.length > 0
      && (c.lastSpeechTick === undefined || speechTimeMs - c.lastSpeechTick > speechCooldown)
      && (isUrgentBroadcast || nearby.some(o => c.bonds.some(b => b.targetId === o.id && b.strength > 20)))
      && Math.random() < (isUrgentBroadcast ? 0.04 : 0.015)

    if (canSpeak) {
      const focus = deriveSpeechFocus(c, state.awarenessStage)
      if (focus) {
        const sentence = composeUtterance(c, focus)
        if (sentence.length > 0) {
          // Pick the nearest bonded creature as the target
          const target = nearby.find(o => c.bonds.some(b => b.targetId === o.id && b.strength > 20))
          c = {
            ...c,
            lastSpeechTick: speechTimeMs,
            currentSpeech: {
              speakerId: c.id,
              targetId: target?.id ?? null,
              sentence,
              day: state.time.day,
              tick: speechTimeMs,
            }
          }

          // ── Speech as perception — single rule for every utterance ──────
          // The speaker's focus carries intent + urgency. Listener effect is
          // computed once from those two values + the listener's own drives +
          // their bond to the speaker. No per-context branches; whatever the
          // creature emits propagates the same way to whoever can decode it.
          //
          // intent direction (sign) × urgency (magnitude) → base felt
          //   warn   → stress UP scaled by listener's vigilance
          //   mourn  → stress UP scaled by listener's sociality
          //   share  → stress DOWN scaled by listener's sociality
          //   ask    → tiny stress UP (mild existential prod) for high-curiosity listeners
          //   assert → stress UP scaled by listener's vigilance, half rate of warn
          //   neutral→ no stress effect; listener still records the observation
          const radius = Math.round(4 + focus.urgency * 8)
          for (const listener of aliveCreatures) {
            if (listener.id === c.id) continue
            if (listener.genome.mind === 'Feral') continue
            if (Math.abs(listener.x - c.x) > radius || Math.abs(listener.y - c.y) > radius) continue
            if (!sentence.some(e => listener.knownEmoji.includes(e))) continue
            const cur = creatures[listener.id]
            const ld = cur.drives ?? { vigilance: 0.3, sociality: 0.3, curiosity: 0.3, dominance: 0.3, reclusion: 0.3, acquisitive: 0.3, mobility: 0.3 }
            const bond = (cur.bonds.find(b => b.targetId === c.id)?.strength ?? 0) / 100
            const u = focus.urgency
            // For dying/mourning intents, gate on bond — only those connected feel it.
            // For share/warn/assert/ask, anyone who decodes the symbol feels something.
            let felt = 0
            switch (focus.intent) {
              case 'warn':
                felt = u * (3 + 6 * ld.vigilance) * (1 + bond * 0.5)
                break
              case 'mourn':
                // Mourning needs the bond — without it the symbol passes through.
                if (bond < 0.20) continue
                felt = u * (3 + 8 * ld.sociality) * (0.5 + bond)
                break
              case 'share':
                felt = -u * (0.5 + 1.5 * ld.sociality) * (1 + bond * 0.3)
                break
              case 'ask':
                // Existential prod — only high-curiosity listeners register stress
                felt = u * 0.8 * Math.max(0, ld.curiosity - 0.4)
                break
              case 'assert':
                felt = u * (1.5 + 3 * ld.vigilance) * (1 - bond * 0.5)
                break
              case 'neutral':
              default:
                felt = 0
            }
            if (felt !== 0) {
              creatures[listener.id] = {
                ...cur,
                stress: Math.max(0, Math.min(100, cur.stress + felt)),
              }
            }
            // Observation record: same kind regardless of context. Heard signals
            // are heard signals; the listener's own integrator decides salience.
            recordObservation(
              creatures[listener.id] ?? cur,
              'caretaker_contact',
              state.time.day,
              { creatureId: c.id, detail: 'heard:' + focus.intent }
            )
          }
        }
      }
    } else if (c.currentSpeech && speechTimeMs - c.currentSpeech.tick > 3500) {
      // Clear speech bubble after ~3.5s
      c = { ...c, currentSpeech: undefined }
    }

    // stateTimer maintenance; increments while state is unchanged so behaviors
    // that depend on it (Curious idle penalty, mourning duration) work. Mourning
    // is a countdown set to 60 elsewhere; the rest count up from 0.
    if (c.diedOnDay === null) {
      if (c.state === initialState) {
        if (c.state === 'mourning') {
          c.stateTimer = Math.max(0, (c.stateTimer ?? 0) - 1)
          if (c.stateTimer === 0) c.state = 'idle'
        } else {
          c.stateTimer = (c.stateTimer ?? 0) + 1
        }
      } else if (c.state !== 'mourning') {
        // State changed (not into mourning, which set its own timer); reset
        c.stateTimer = 0
      }
    }

    // Bond list pruning; drop bonds to long-dead creatures and cap total size.
    // Without this, c.bonds grows linearly forever and bloats the save blob.
    if (c.bonds.length > 24 || (c.bonds.length > 8 && state.time.day % 5 === 0)) {
      c.bonds = c.bonds
        .filter(b => {
          const target = creatures[b.targetId]
          // Keep living bonds, drop dead bonds older than a season
          if (!target) return false
          if (target.diedOnDay === null) return true
          return state.time.day - target.diedOnDay < DAYS_PER_SEASON
        })
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 16)
    }

    creatures[id] = c
  }

  const updatedCaretaker = {
    ...state.caretaker,
    awaitingResponseUntil: nextAwaitingResponseUntil,
    respondedToQuestion: clearRespondedFlag ? false : (state.caretaker.respondedToQuestion ?? false),
  }

  return {
    ...next,
    creatures,
    tiles,
    messages,   // no cap here; tickSimulation applies the global slice(-500) once
    events,
    totalDeaths,
    caretaker: updatedCaretaker,
  }
}

// ─── Reproduction ─────────────────────────────────────────────────────────────

// Scan a small radius for any tile of type 'nest'. Cheap local scan; the
// radius is small enough that this is negligible compared to overall tick cost.
function hasNestNear(state: GameState, x: number, y: number, radius: number): boolean {
  const minY = Math.max(0, y - radius)
  const maxY = Math.min(WORLD_SIZE - 1, y + radius)
  const minX = Math.max(0, x - radius)
  const maxX = Math.min(WORLD_SIZE - 1, x + radius)
  for (let ny = minY; ny <= maxY; ny++) {
    const row = state.tiles[ny]
    for (let nx = minX; nx <= maxX; nx++) {
      if (row[nx].type === 'nest') return true
    }
  }
  return false
}

function tickReproduction(state: GameState, tickRng: () => number, popFactor: number): GameState {
  const creatures = { ...state.creatures }
  const alive = Object.values(creatures).filter(c => c.diedOnDay === null)
  const newCreatures: Creature[] = []
  let totalCreaturesEver = state.totalCreaturesEver
  let totalGenerations = state.totalGenerations
  const messages: ColonyMessage[] = [...state.messages]
  let lastMsgDay = messages.length > 0 ? messages[messages.length - 1].day : -999

  const pairedThisTick = new Set<string>()

  for (const c of alive) {
    if (pairedThisTick.has(c.id)) continue

    // Nest proximity gives a second reproduction roll (effectively boosting the
    // rate) and grants offspring extra starting health. Cheap local scan within
    // NEST_RADIUS — typically 9×9 tiles, irrelevant to overall tick cost.
    const nestNearby = hasNestNear(state, c.x, c.y, NEST_RADIUS)

    // ── Sexual reproduction (bonded pair) ──
    const baseRoll  = canReproduce(c, state.time.season, popFactor, state.weather)
    const boostRoll = !baseRoll && nestNearby
      && canReproduce(c, state.time.season, popFactor * Math.max(1, NEST_BREED_MULT - 1), state.weather)
    if (baseRoll || boostRoll) {
      const bondedIds = c.bonds.filter(b => b.strength >= REPRODUCE_BOND_MIN_STRENGTH).map(b => b.targetId)
      const partner = bondedIds
        .map(id => creatures[id])
        .find(p => p && p.diedOnDay === null
          && p.genome.personality !== 'Aggressive'
          && !pairedThisTick.has(p.id)
          && Math.abs(p.x - c.x) <= 12 && Math.abs(p.y - c.y) <= 12)

      if (partner) {
        // Gather tribal lexicon for this birth; union of both parents' tribes
        const tribeALex = c.tribeId ? (state.tribes[c.tribeId]?.tribalLexicon ?? []) : []
        const tribeBLex = partner.tribeId ? (state.tribes[partner.tribeId]?.tribalLexicon ?? []) : []
        const combinedLex = [...new Set([...tribeALex, ...tribeBLex])]
        const spawnTile = state.tiles[c.y]?.[c.x]
        const envCtx: EnvContext = { biome: spawnTile?.biome ?? 'temperate', weather: state.weather ?? 'clear', season: state.time.season }

        // Compute divergence pressure: geographic separation + resource stress + lineage relation hostility.
        // geoSep uses /30 (not /40) so pairs at the 12-tile partner cap contribute ~0.28 instead of ~0.18,
        // making the pressure-based fork path reachable alongside the generation-interval path.
        const geoSep = (Math.abs(c.x - partner.x) + Math.abs(c.y - partner.y)) / 30  // 0-1
        const avgStress = (c.stress + partner.stress) / 200  // 0-1
        const lineageKey = [c.lineageId, partner.lineageId].sort().join(':')
        const lineageHostility = Math.max(0, -(state.lineageRelations?.[lineageKey] ?? 0)) / 100
        const divergencePressure = Math.min(1, geoSep * 0.35 + avgStress * 0.40 + lineageHostility * 0.25)

        const offspring = createOffspring(c, partner, c.x, c.y, state.time.day, tickRng, state.modifiers?.mutationChance, combinedLex, envCtx, divergencePressure, state.modifiers?.adaptationInheritMult ?? 1, state.modifiers?.lifespanMult ?? 1)
        if (nestNearby) offspring.health = Math.min(100, offspring.health + NEST_OFFSPRING_HEALTH)
        newCreatures.push(offspring)

        // Chronicle real biological events: hybrid birth (cross-lineage offspring
        // whose lineageId encodes both parent roots) and a new lineage fork.
        const rootC = c.lineageId.split('_')[0].split('+')[0]
        const rootP = partner.lineageId.split('_')[0].split('+')[0]
        if (rootC !== rootP || offspring.lineageId.includes('+')) {
          state = pushChronicle(state, {
            kind: 'hybrid_birth', day: state.time.day,
            creatureId: offspring.id, creatureName: offspring.name,
            lineageId: offspring.lineageId,
          })
        } else if (offspring.lineageId !== c.lineageId && offspring.lineageId !== partner.lineageId) {
          state = pushChronicle(state, {
            kind: 'lineage_fork', day: state.time.day,
            creatureId: offspring.id, creatureName: offspring.name,
            lineageId: offspring.lineageId,
          })
        }

        creatures[c.id] = {
          ...creatures[c.id],
          offspringIds: [...creatures[c.id].offspringIds, offspring.id],
        }
        creatures[partner.id] = {
          ...creatures[partner.id],
          offspringIds: [...creatures[partner.id].offspringIds, offspring.id],
        }

        // Experience: raised_offspring fires after several offspring accumulate
        if (creatures[c.id].offspringIds.length % 3 === 0) {
          recordExperience(creatures[c.id], 'raised_offspring', state.time.day)
        }

        pairedThisTick.add(c.id)
        pairedThisTick.add(partner.id)

        totalCreaturesEver++
        totalGenerations = Math.max(totalGenerations, offspring.generation)

        checkBoneMemory(offspring, state, messages, lastMsgDay)

        // Emit mutation event when discrete traits changed from both parents.
        // Chronicle is the source of truth; the prose line is composed from it.
        if (offspring.recentMutation !== undefined && offspring.mutatedTraits && offspring.mutatedTraits.length > 0) {
          state = pushChronicle(state, {
            kind: 'rare_birth', day: state.time.day,
            creatureId: offspring.id, creatureName: offspring.name,
            lineageId: offspring.lineageId,
            detail: offspring.mutatedTraits.join(','),
          })
          const traitNames = offspring.mutatedTraits.join(', ')
          if (state.time.day - lastMsgDay >= 1) {
            messages.push({
              id: uuid(),
              text: `${offspring.name} ${offspring.familyName} — altered ${traitNames}`,
              stage: 1,
              creatureId: offspring.id,
              day: state.time.day,
              timestamp: Date.now(),
              read: false,
            })
            lastMsgDay = state.time.day
          }
        }

        if (DEBUG) console.log(`[BIRTH·sexual] ${offspring.name} (gen ${offspring.generation}) ← ${c.name} + ${partner.name}`)
        continue
      }
    }

    // ── Asexual division (single-cell-like) ──
    // Always-on path that doesn't need a partner. Only triggers when the
    // creature is genuinely thriving and population isn't overstretched.
    if (canAsexuallyReproduce(c, state.time.season, popFactor)
      && tickRng() < ASEXUAL_BASE_CHANCE * popFactor) {
      const asexSpawnTile = state.tiles[c.y]?.[c.x]
      const asexEnvCtx: EnvContext = { biome: asexSpawnTile?.biome ?? 'temperate', weather: state.weather ?? 'clear', season: state.time.season }
      const offspring = createAsexualOffspring(c, c.x, c.y, state.time.day, tickRng, asexEnvCtx, (state.modifiers?.mutationChance ?? 0.10) / 0.10, state.modifiers?.adaptationInheritMult ?? 1, state.modifiers?.lifespanMult ?? 1)
      newCreatures.push(offspring)
      creatures[c.id] = {
        ...creatures[c.id],
        offspringIds: [...creatures[c.id].offspringIds, offspring.id],
        // Division costs the parent; drops health and adds a hunger spike
        health: Math.max(40, creatures[c.id].health - 18),
        hunger: Math.min(100, creatures[c.id].hunger + 22),
      }
      pairedThisTick.add(c.id)
      totalCreaturesEver++
      totalGenerations = Math.max(totalGenerations, offspring.generation)
      checkBoneMemory(offspring, state, messages, lastMsgDay)

      // Emit mutation message for asexual offspring
      if (offspring.recentMutation !== undefined && offspring.mutatedTraits && offspring.mutatedTraits.length > 0) {
        state = pushChronicle(state, {
          kind: 'rare_birth', day: state.time.day,
          creatureId: offspring.id, creatureName: offspring.name,
          lineageId: offspring.lineageId,
          detail: offspring.mutatedTraits.join(','),
        })
        const traitNames = offspring.mutatedTraits.join(', ')
        if (state.time.day - lastMsgDay >= 1) {
          messages.push({
            id: uuid(),
            text: `${offspring.name} ${offspring.familyName} — evolved ${traitNames}`,
            stage: 1,
            creatureId: offspring.id,
            day: state.time.day,
            timestamp: Date.now(),
            read: false,
          })
          lastMsgDay = state.time.day
        }
      }

      if (DEBUG) console.log(`[BIRTH·asexual] ${offspring.name} (gen ${offspring.generation}) ← ${c.name}`)
    }
  }

  for (const o of newCreatures) {
    creatures[o.id] = o
  }

  // Birth burst — chronicle when many births happen in a single tick; the
  // colony notices when an unusually fertile moment occurs.
  if (newCreatures.length >= 3) {
    state = pushChronicle(state, {
      kind: 'birth_burst',
      day: state.time.day,
      count: newCreatures.length,
    })
  }

  return { ...state, creatures, totalCreaturesEver, totalGenerations, messages }
}

function checkBoneMemory(
  offspring: Creature,
  state: GameState,
  messages: ColonyMessage[],
  lastMsgDay: number
): void {
  // Bone memory is not a proximity lottery. It fires only when there is a real
  // ancestral connection between the birth and the death site — the same lineage,
  // or a parent/grandparent relationship — and the offspring's mind is capable
  // of registering the resonance (not Feral).
  if (offspring.genome.mind === 'Feral') return
  if (state.time.day - lastMsgDay < 1) return

  for (let dy = -BONE_MEMORY_RADIUS; dy <= BONE_MEMORY_RADIUS; dy++) {
    for (let dx = -BONE_MEMORY_RADIUS; dx <= BONE_MEMORY_RADIUS; dx++) {
      const t = state.tiles[offspring.y + dy]?.[offspring.x + dx]
      if (t?.type !== 'death_site' || !t.deathSiteOf) continue

      const deceased = state.creatures[t.deathSiteOf]
      if (!deceased) continue

      // Lineage connection check: same root lineage, or direct parent/grandparent
      const offspringRoot = offspring.lineageId.split('_')[0].split('+')[0]
      const deceasedRoot  = deceased.lineageId.split('_')[0].split('+')[0]
      const sameLineage   = offspringRoot === deceasedRoot
      const isParent      = offspring.parentIds.includes(deceased.id)
      const isGrandparent = offspring.parentIds.some(pid => {
        if (!pid) return false
        const parent = state.creatures[pid]
        return parent?.parentIds.includes(deceased.id)
      })

      if (!sameLineage && !isParent && !isGrandparent) continue

      // Pass the real ancestor's name, line, and death day so the message
      // composes from actual ancestry rather than a generic "ground remembers".
      messages.push(boneMemoryMessage(
        offspring.name, state.time.day, offspring.id,
        {
          name: deceased.name,
          familyName: deceased.familyName,
          deathDay: deceased.diedOnDay ?? state.time.day,
          deathCause: deceased.deathCause,
        },
      ))
      return
    }
  }
}

// ─── Enrichment ──────────────────────────────────────────────────────────────

function tickEnrichment(state: GameState, rng: () => number): GameState {
  const items = state.enrichmentItems
  if (!items || Object.keys(items).length === 0) return state

  const updatedItems = { ...items }
  let changed = false

  for (const id in updatedItems) {
    let item = updatedItems[id]

    // Release item if using creature has died or moved away
    if (item.usedBy) {
      const c = state.creatures[item.usedBy]
      if (!c || c.diedOnDay !== null || c.state !== 'using_enrichment') {
        updatedItems[id] = { ...item, usedBy: null }
        item = updatedItems[id]
        changed = true
      } else {
        // Active use; decrement usesRemaining (degradation)
        const usesLeft = (item.usesRemaining ?? item.maxUses ?? 40) - 1
        if (usesLeft <= 0) {
          // Natural items respawn nearby; player-placed items simply vanish
          if (item.natural) {
            const replacement = spawnNaturalNearby(item, state.tiles, updatedItems, state.time.day, rng)
            if (replacement) {
              updatedItems[replacement.id] = replacement
            }
          }
          delete updatedItems[id]
          changed = true
          continue
        }
        updatedItems[id] = { ...item, totalUses: item.totalUses + 1, usesRemaining: usesLeft }
        item = updatedItems[id]
        changed = true
      }
    }

    // Idle decay: player-placed items that haven't been used for ENRICHMENT_IDLE_DECAY_DAYS
    // lose one use. placedOnDay is reset after each decay so the next window starts fresh.
    if (updatedItems[id] && !updatedItems[id].usedBy && !updatedItems[id].natural) {
      const idleDays = state.time.day - (updatedItems[id].placedOnDay ?? 0)
      if (idleDays >= ENRICHMENT_IDLE_DECAY_DAYS) {
        const usesLeft = (updatedItems[id].usesRemaining ?? updatedItems[id].maxUses ?? 40) - 1
        if (usesLeft <= 0) {
          delete updatedItems[id]
          changed = true
          continue
        }
        // Reset idle timer so the next decay window starts from now
        updatedItems[id] = { ...updatedItems[id], usesRemaining: usesLeft, placedOnDay: state.time.day }
        changed = true
      }
    }

    // Claim item for creature that is using_enrichment at target id
    if (updatedItems[id] && !updatedItems[id].usedBy) {
      for (const cid in state.creatures) {
        const c = state.creatures[cid]
        if (c.diedOnDay !== null) continue
        if (c.state === 'using_enrichment' && c.enrichmentTarget === id) {
          // Aggressive displacement: if another creature is already tagged on this item
          // and this creature is Aggressive, it takes priority (displacement handled here
          // by simply claiming; the prior claimant will be released next tick)
          updatedItems[id] = { ...updatedItems[id], usedBy: cid }
          changed = true
          break
        }
      }
    }
  }

  if (!changed) return state
  return { ...state, enrichmentItems: updatedItems }
}

// Find a nearby biome-compatible tile and return a fresh natural EnrichmentItem, or null.
function spawnNaturalNearby(
  depleted: EnrichmentItem,
  tiles: GameState['tiles'],
  existingItems: Record<string, EnrichmentItem>,
  day: number,
  rng: () => number
): EnrichmentItem | null {
  const { x: ox, y: oy, type } = depleted
  for (let attempt = 0; attempt < 15; attempt++) {
    const angle = rng() * Math.PI * 2
    const dist = 2 + rng() * NATURAL_ENRICHMENT_REGEN_RADIUS
    const nx = Math.round(ox + Math.cos(angle) * dist)
    const ny = Math.round(oy + Math.sin(angle) * dist)
    if (nx < 0 || ny < 0 || nx >= WORLD_SIZE || ny >= WORLD_SIZE) continue
    const tile = tiles[ny]?.[nx]
    if (!tile) continue
    if (['rock', 'river', 'mountain', 'cliff', 'flooded'].includes(tile.type)) continue
    const eligible = NATURAL_ENRICHMENT_BIOME_TYPES[tile.biome] ?? []
    if (!eligible.includes(type)) continue
    if (Object.values(existingItems).some(e => e.x === nx && e.y === ny)) continue
    return {
      id: uuid(),
      type: type as EnrichmentType,
      x: nx, y: ny,
      placedOnDay: day,
      usedBy: null,
      totalUses: 0,
      maxUses: NATURAL_ENRICHMENT_MAX_USES,
      usesRemaining: NATURAL_ENRICHMENT_MAX_USES,
      natural: true,
    }
  }
  return null
}

// Spawn new natural enrichment items up to the colony-scaled cap.
function tickNaturalEnrichment(state: GameState, rng: () => number, mods: SimModifiers): GameState {
  const alive = Object.values(state.creatures).filter(c => !c.diedOnDay).length
  const enrichScale = mods.enrichmentSpawnMult ?? 1
  // Cap scales with population but never falls below the ambient floor — the
  // world keeps generating zones even when the colony is tiny or extinct, so
  // the map stays alive between generations rather than latching off.
  const populationCap = NATURAL_ENRICHMENT_CAP_BASE + Math.floor(alive / NATURAL_ENRICHMENT_CAP_PER_N_ALIVE)
  const cap = Math.min(
    NATURAL_ENRICHMENT_CAP_MAX,
    Math.round(Math.max(NATURAL_ENRICHMENT_AMBIENT_CAP, populationCap) * enrichScale)
  )
  const naturalCount = Object.values(state.enrichmentItems).filter(e => e.natural).length
  if (naturalCount >= cap) return state

  const season = state.time.season
  const newItems: Record<string, EnrichmentItem> = {}

  const aliveForEnrichment = Object.values(state.creatures).filter(c => !c.diedOnDay)

  for (let attempt = 0; attempt < NATURAL_ENRICHMENT_ATTEMPTS_PER_TICK; attempt++) {
    // Bias spawn near creature clusters so items always fall within ENRICHMENT_SEEK_RADIUS.
    // When the colony is empty (or near-empty) fall back to anchoring on the
    // world centroid so zones still appear and a fresh colony has something to
    // discover when it re-emerges.
    let anchorX: number, anchorY: number
    if (aliveForEnrichment.length > 0) {
      const anchor = aliveForEnrichment[Math.floor(rng() * aliveForEnrichment.length)]
      anchorX = anchor.x; anchorY = anchor.y
    } else {
      const inset = Math.floor(WORLD_SIZE * 0.20)
      anchorX = inset + Math.floor(rng() * (WORLD_SIZE - 2 * inset))
      anchorY = inset + Math.floor(rng() * (WORLD_SIZE - 2 * inset))
    }
    const angle = rng() * Math.PI * 2
    const dist  = 3 + rng() * 15  // 3-18 tiles; always within ENRICHMENT_SEEK_RADIUS (20)
    const x = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(anchorX + Math.cos(angle) * dist)))
    const y = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(anchorY + Math.sin(angle) * dist)))
    const tile = state.tiles[y]?.[x]
    if (!tile) continue
    if (['rock', 'river', 'mountain', 'cliff', 'flooded'].includes(tile.type)) continue

    const allItems = { ...state.enrichmentItems, ...newItems }
    if (Object.values(allItems).some(e => e.x === x && e.y === y)) continue

    const eligible = NATURAL_ENRICHMENT_BIOME_TYPES[tile.biome]
    if (!eligible || eligible.length === 0) continue

    // Pick first eligible type that passes its season-weighted roll
    let chosen: string | null = null
    for (const t of eligible) {
      const seasonMod = NATURAL_ENRICHMENT_SEASON_MOD[t]?.[season] ?? 1.0
      if (rng() < NATURAL_ENRICHMENT_SPAWN_CHANCE * seasonMod * enrichScale) {
        chosen = t
        break
      }
    }
    if (!chosen) continue

    const id = uuid()
    newItems[id] = {
      id,
      type: chosen as EnrichmentType,
      x, y,
      placedOnDay: state.time.day,
      usedBy: null,
      totalUses: 0,
      maxUses: NATURAL_ENRICHMENT_MAX_USES,
      usesRemaining: NATURAL_ENRICHMENT_MAX_USES,
      natural: true,
    }
    break // one spawn per tick
  }

  if (Object.keys(newItems).length === 0) return state
  return { ...state, enrichmentItems: { ...state.enrichmentItems, ...newItems } }
}

// ─── Tribes ───────────────────────────────────────────────────────────────────

// ─── Tribe formation, splitting, dissolution ─────────────────────────────────
// Tribes are not appointed. They form when same-lineage spatial clusters with
// deep mutual bonds occupy a contiguous area. They split when the cluster
// drifts apart in space; they dissolve when membership collapses.

// Tribe name = the cluster's actual evolved family-name composition. Most
// common family name wins; if two are tied or close, blend their first
// syllable / last syllable into a new compound. The name carries the lineage's
// real naming-mutation history, not a designer syllable pool.
function pickTribeName(members: { familyName: string }[]): string {
  const counts: Record<string, number> = {}
  for (const m of members) counts[m.familyName] = (counts[m.familyName] ?? 0) + 1
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) return 'unnamed'
  const [first, firstN] = sorted[0]
  if (sorted.length === 1 || (sorted[1][1] < firstN)) return first
  // Two roughly-equally-common family names: blend their syllables
  const second = sorted[1][0]
  const aHalf = first.slice(0, Math.ceil(first.length / 2))
  const bHalf = second.slice(Math.floor(second.length / 2))
  return aHalf + bHalf
}

function lineageColorFromHash(lineageId: string): string {
  // Stable per-lineage hex tint derived from the lineage id; saturation kept
  // moderate so it reads as a tribal banner, not screaming neon.
  let h = 0
  for (let i = 0; i < lineageId.length; i++) h = (h * 31 + lineageId.charCodeAt(i)) | 0
  const hue = ((h % 360) + 360) % 360
  // HSL → RGB at 55% sat, 60% light
  const c = 0.55 * 0.40
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hue < 60)       { r = c; g = x }
  else if (hue < 120) { r = x; g = c }
  else if (hue < 180) { g = c; b = x }
  else if (hue < 240) { g = x; b = c }
  else if (hue < 300) { r = x; b = c }
  else                { r = c; b = x }
  const m = 0.40
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function tickTribeFormation(state: GameState, mods: SimModifiers): GameState {
  // Run on an interval to keep per-tick cost low
  if (state.time.day % 1 !== 0) { /* day is float; rely on tick counter */ }
  const interval = Math.max(8, Math.round(TRIBE_FORMATION_CHECK_INTERVAL / (mods.tribeFormationMult ?? 1)))
  const tickIndex = Math.floor(state.time.totalMinutesElapsed * 60)  // approx tick count
  if (tickIndex % interval !== 0) return state

  const creatures = { ...state.creatures }
  const alive = Object.values(creatures).filter(c => c.diedOnDay === null)
  if (alive.length < TRIBE_FORM_MIN_MEMBERS) return state

  let tribes = { ...state.tribes }
  let chronicle = state

  // ── A. Update existing tribes: prune dead, recompute centroid, split or dissolve
  for (const tribeId of Object.keys(tribes)) {
    const t = tribes[tribeId]
    if (t.dissolvedOnDay) continue
    const living = t.memberIds.filter(id => creatures[id]?.diedOnDay === null)
    if (living.length < TRIBE_DISSOLVE_MIN_MEMBERS) {
      const gensLasted = Math.max(0, state.time.day - t.foundedOnDay)
      tribes[tribeId] = { ...t, memberIds: living, dissolvedOnDay: state.time.day }
      // Untag any still-living members
      for (const id of living) {
        if (creatures[id]) creatures[id] = { ...creatures[id], tribeId: null }
      }
      chronicle = pushChronicle(chronicle, {
        kind: 'tribe_dissolved', day: state.time.day,
        detail: t.name, count: Math.floor(gensLasted / 30),
      })
      continue
    }

    const cx = living.reduce((s, id) => s + (creatures[id]?.x ?? 0), 0) / living.length
    const cy = living.reduce((s, id) => s + (creatures[id]?.y ?? 0), 0) / living.length

    // Try a split: cluster member positions into 2 groups, check centroid gap
    if (living.length >= TRIBE_SPLIT_MIN_MEMBERS) {
      // Simple 2-means seeded from extreme members
      const positions = living.map(id => ({ id, x: creatures[id].x, y: creatures[id].y }))
      // Pick two seeds: the two members farthest apart
      let seedA = positions[0], seedB = positions[0], maxD = 0
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const d = Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y)
          if (d > maxD) { maxD = d; seedA = positions[i]; seedB = positions[j] }
        }
      }
      if (maxD >= TRIBE_SPLIT_CENTROID_GAP) {
        const groupA: string[] = [], groupB: string[] = []
        for (const p of positions) {
          const dA = Math.hypot(p.x - seedA.x, p.y - seedA.y)
          const dB = Math.hypot(p.x - seedB.x, p.y - seedB.y)
          if (dA <= dB) groupA.push(p.id); else groupB.push(p.id)
        }
        if (groupA.length >= TRIBE_DISSOLVE_MIN_MEMBERS && groupB.length >= TRIBE_DISSOLVE_MIN_MEMBERS) {
          // Keep groupA in the original tribe; spin groupB into a child tribe
          const newId = uuid()
          const newName = pickTribeName(groupB.map(id => ({ familyName: creatures[id].familyName })))
          const newColor = lineageColorFromHash(creatures[groupB[0]]?.lineageId ?? newId)
          const subCx = groupB.reduce((s, id) => s + creatures[id].x, 0) / groupB.length
          const subCy = groupB.reduce((s, id) => s + creatures[id].y, 0) / groupB.length
          tribes[newId] = {
            id: newId, name: newName, memberIds: groupB,
            territory: [], foundedOnDay: state.time.day, color: newColor,
            tribalLexicon: [...new Set(t.tribalLexicon)],  // inherits parent vocab
            lineageRoot: t.lineageRoot, parentTribeId: t.id,
            dissolvedOnDay: null, centroidX: subCx, centroidY: subCy,
          }
          for (const id of groupB) {
            if (creatures[id]) creatures[id] = { ...creatures[id], tribeId: newId }
          }
          // Original tribe keeps groupA
          const aCx = groupA.reduce((s, id) => s + creatures[id].x, 0) / groupA.length
          const aCy = groupA.reduce((s, id) => s + creatures[id].y, 0) / groupA.length
          tribes[tribeId] = { ...t, memberIds: groupA, centroidX: aCx, centroidY: aCy }
          chronicle = pushChronicle(chronicle, {
            kind: 'tribe_split', day: state.time.day,
            detail: t.name, count: groupB.length,
          })
          continue
        }
      }
    }

    // Recompute lexicon + centroid for the surviving tribe
    const lex = new Set(t.tribalLexicon ?? [])
    for (const id of living) for (const e of creatures[id].knownEmoji) lex.add(e)
    tribes[tribeId] = { ...t, memberIds: living, tribalLexicon: [...lex], centroidX: cx, centroidY: cy }
  }

  // ── B. Form new tribes from un-tribed creatures with deep cluster bonds
  // Group untribed creatures by lineage
  const untribedByLineage = new Map<string, Creature[]>()
  for (const c of alive) {
    if (c.tribeId) continue
    const g = untribedByLineage.get(c.lineageId) ?? []
    g.push(c)
    untribedByLineage.set(c.lineageId, g)
  }

  for (const [lineageId, members] of untribedByLineage) {
    if (members.length < TRIBE_FORM_MIN_MEMBERS) continue
    // Greedy cluster: pick the densest member, gather everyone within radius
    // and mutually bonded above threshold
    let best: Creature | null = null
    let bestDensity = 0
    for (const seed of members) {
      let d = 0
      for (const other of members) {
        if (other.id === seed.id) continue
        if (Math.abs(other.x - seed.x) <= TRIBE_FORM_RADIUS && Math.abs(other.y - seed.y) <= TRIBE_FORM_RADIUS) d++
      }
      if (d > bestDensity) { bestDensity = d; best = seed }
    }
    if (!best || bestDensity < TRIBE_FORM_MIN_MEMBERS - 1) continue

    const cluster = members.filter(m =>
      Math.abs(m.x - best!.x) <= TRIBE_FORM_RADIUS && Math.abs(m.y - best!.y) <= TRIBE_FORM_RADIUS)
    if (cluster.length < TRIBE_FORM_MIN_MEMBERS) continue

    // Bond density: how many cluster pairs share a bond above threshold?
    let bondedPairs = 0, totalPairs = 0
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        totalPairs++
        const a = cluster[i], b = cluster[j]
        const aToB = a.bonds.find(bn => bn.targetId === b.id)
        const bToA = b.bonds.find(bn => bn.targetId === a.id)
        if (aToB && bToA && aToB.strength >= TRIBE_FORM_MIN_BOND_STRENGTH
            && bToA.strength >= TRIBE_FORM_MIN_BOND_STRENGTH) bondedPairs++
      }
    }
    if (totalPairs === 0 || bondedPairs / totalPairs < TRIBE_FORM_MIN_BOND_FRACTION) continue

    const id = uuid()
    const name = pickTribeName(cluster.map(m => ({ familyName: m.familyName })))
    const color = lineageColorFromHash(lineageId)
    const cx = cluster.reduce((s, m) => s + m.x, 0) / cluster.length
    const cy = cluster.reduce((s, m) => s + m.y, 0) / cluster.length
    const lex = new Set<string>()
    for (const m of cluster) for (const e of m.knownEmoji) lex.add(e)
    tribes[id] = {
      id, name, memberIds: cluster.map(m => m.id), territory: [],
      foundedOnDay: state.time.day, color, tribalLexicon: [...lex],
      lineageRoot: lineageId, dissolvedOnDay: null,
      centroidX: cx, centroidY: cy,
    }
    for (const m of cluster) creatures[m.id] = { ...creatures[m.id], tribeId: id }
    chronicle = pushChronicle(chronicle, {
      kind: 'tribe_formed', day: state.time.day,
      detail: name, count: cluster.length,
    })
  }

  return { ...chronicle, tribes, creatures }
}

function tickTribes(state: GameState): GameState {
  const creatures = state.creatures
  const alive = Object.values(creatures).filter(c => c.diedOnDay === null)

  if (alive.length < 4) return state  // too early for tribal dynamics

  const tribes = { ...state.tribes }
  const messages: ColonyMessage[] = [...state.messages]

  // Update tribal lexicon for existing tribes
  for (const tribeId in tribes) {
    const tribe = tribes[tribeId]
    const members = tribe.memberIds
      .map(id => creatures[id])
      .filter(c => c && c.diedOnDay === null)
    if (members.length === 0) continue
    const currentLexicon = new Set(tribe.tribalLexicon ?? [])
    for (const member of members) {
      for (const emoji of member.knownEmoji) currentLexicon.add(emoji)
    }
    tribes[tribeId] = { ...tribe, tribalLexicon: [...currentLexicon] }
  }

  // ── Inter-lineage conflict — driven by relationship history, not just proximity ──
  // A colony where two lineages have been peacefully coexisting for generations
  // does NOT become a war just because they happen to be standing near each other.
  // Conflict requires accumulated hostility in lineageRelations (which is updated
  // by combat events, territorial stress, and resource competition in tickCreatures).
  // Proximity amplifies existing hostility; it doesn't create it from nothing.
  const lineageGroups = new Map<string, typeof alive>()
  for (const c of alive) {
    const g = lineageGroups.get(c.lineageId) ?? []
    g.push(c)
    lineageGroups.set(c.lineageId, g)
  }

  const lineageIds = [...lineageGroups.keys()]
  let hasConflict = false
  const relations = state.lineageRelations ?? {}

  if (lineageIds.length >= 2) {
    for (let i = 0; i < lineageIds.length - 1; i++) {
      const lidA = lineageIds[i]
      const groupA = lineageGroups.get(lidA)!
      for (let j = i + 1; j < lineageIds.length; j++) {
        const lidB = lineageIds[j]
        const groupB = lineageGroups.get(lidB)!

        // Read accumulated relationship score for this pair
        const relKey = [lidA, lidB].sort().join(':')
        const relScore = relations[relKey] ?? 0

        // Conflict only activates when lineages are genuinely hostile (score < -15)
        // OR when they are neutral/unknown and actively competing for the same territory.
        // Allied lineages (score > 20) will not attack even if standing adjacent.
        const isHostile = relScore < -15
        const isNeutral = relScore >= -15 && relScore < 20

        if (!isHostile && !isNeutral) continue  // allied pairs never war

        for (const a of groupA) {
          for (const b of groupB) {
            const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
            if (dist > 6) continue

            // Neutral lineages require territorial pressure to fight;
            // hostile lineages fight on contact alone.
            const fightThreshold = isHostile
              ? TRIBE_WAR_FIGHT_CHANCE * 2.0
              : TRIBE_WAR_FIGHT_CHANCE * 0.5

            if (Math.random() < fightThreshold) {
              hasConflict = true
              const atkEntry = creatures[a.id]
              const defEntry = creatures[b.id]
              if (atkEntry && defEntry && atkEntry.diedOnDay === null && defEntry.diedOnDay === null) {
                if (state.time.day - (messages[messages.length - 1]?.day ?? -99) >= 2) {
                  // Cite the literal relation score instead of an authored adverb.
                  // The number is the colony's actual evidence; readers can judge
                  // the severity themselves.
                  messages.push({
                    id: uuid(),
                    text: `${a.name} and ${b.name} clashed at a lineage boundary. relation ${relScore}.`,
                    stage: 1 as const,
                    creatureId: a.id,
                    day: state.time.day,
                    timestamp: Date.now(),
                    read: false,
                  })
                }
              }
            }
          }
        }
      }
    }
  }

  // Fracture tracking: sustained hostility triggers scatter.
  // tribeWarStart is set on first conflict and cleared only after a long peace window
  // (3× TRIBE_WAR_SUSTAIN_DAYS without conflict). A single quiet tick does NOT reset
  // the war clock — inter-lineage wars have natural lulls between clashes.
  let tribeWarStart = state.tribeWarStart
  if (hasConflict) {
    tribeWarStart = tribeWarStart ?? state.time.day
  } else if (tribeWarStart !== undefined) {
    const daysSinceStart = state.time.day - tribeWarStart
    if (daysSinceStart > TRIBE_WAR_SUSTAIN_DAYS * 3) {
      tribeWarStart = undefined  // sustained peace — war has ended without triggering fracture
    }
  }

  return { ...state, tribes, messages, tribeWarStart }
}

// ─── Caretaker ────────────────────────────────────────────────────────────────

function tickCaretaker(state: GameState, _mods: SimModifiers): GameState {
  const caretaker = { ...state.caretaker }

  // Soft pressure decays toward 0 each tick — replaces the daily charge reset.
  caretaker.actionLoad = Math.max(0, (caretaker.actionLoad ?? 0) - ACTION_LOAD_DECAY_PER_TICK)

  // Ambient stress bleed: when actionLoad is high and the caretaker's last
  // action was recent + nearby, creatures within ACTION_LOAD_STRESS_RADIUS feel
  // it. Creatures elsewhere are unaffected. This is the *only* world-visible
  // tradeoff for heavy intervention.
  let creatures = state.creatures
  if ((caretaker.actionLoad ?? 0) > ACTION_LOAD_STRESS_THRESHOLD
      && caretaker.lastActionX !== null && caretaker.lastActionY !== null) {
    const ax = caretaker.lastActionX, ay = caretaker.lastActionY
    const r = ACTION_LOAD_STRESS_RADIUS
    const intensity = Math.min(1, ((caretaker.actionLoad ?? 0) - ACTION_LOAD_STRESS_THRESHOLD) / 50)
    const bleed = ACTION_LOAD_STRESS_PER_TICK * intensity
    const next: typeof state.creatures = { ...creatures }
    let mutated = false
    for (const id in next) {
      const c = next[id]
      if (c.diedOnDay !== null) continue
      if (Math.abs(c.x - ax) > r || Math.abs(c.y - ay) > r) continue
      next[id] = { ...c, stress: Math.min(100, c.stress + bleed) }
      mutated = true
    }
    if (mutated) creatures = next
  }

  // Tick down absence imprint; clear absenceHardship when imprint ends.
  const absenceImprint = Math.max(0, (state.absenceImprint ?? 0) - DAY_FRACTION_PER_TICK)
  const absenceHardship = absenceImprint <= 0 ? undefined : state.absenceHardship

  return { ...state, creatures, caretaker, absenceImprint, absenceHardship }
}

// ─── Endgame ─────────────────────────────────────────────────────────────────

// Extinction cause is the literal dominant mechanical death cause — no
// narrative bucketing. The fossil record carries the actual number of deaths
// per cause (via deathCauseCounts) and surfaces whichever cause killed the
// most members. Late-game over-weighting is gone too: a colony's epitaph
// should reflect what actually killed it, not designer-curated drama. Tribe
// war is recognised when combat deaths dominate; "neglect" only when nothing
// else does (sickness deaths + sustained distress overlay).
function inferExtinctionCause(state: GameState): ExtinctionRecord['extinctionCause'] {
  type ExtCause = ExtinctionRecord['extinctionCause']
  const counts = state.deathCauseCounts ?? {}
  // Each DeathCause maps to exactly one ExtinctionCause bucket. The mapping
  // preserves the *type* of death (combat → war, cold → winter, fire → fire-driven
  // collapse only via heatwave overlay) so the epitaph cites what actually happened.
  const map: Partial<Record<DeathCause, ExtCause>> = {
    starvation:   'starvation',
    dehydration:  'drought',
    cold:         'winter',
    sickness:     'neglect',
    combat:       'war',
    fire:         'heatwave',
    lightning:    'heatwave',
    cannibalized: 'starvation',
    drowning:     'flood',
  }
  const scores: Record<ExtCause, number> = {
    neglect: 0, war: 0, drought: 0, flood: 0, winter: 0, starvation: 0, heatwave: 0,
  }
  for (const [c, n] of Object.entries(counts) as [DeathCause, number][]) {
    const bucket = map[c]
    if (bucket) scores[bucket] += n
  }
  // old_age and unknown deaths are NOT mapped to any extinction cause —
  // a colony that aged out should report whichever real cause actually
  // pushed it past viability, not get bucketed as "starvation" by default.

  // Sustained distress is its own evidence (the colony was clearly in crisis
  // long enough for the accumulator to register), independent of any single
  // creature's death cause.
  if ((state.colonyDistressAccumulator ?? 0) > 50) scores.neglect += Math.floor((state.colonyDistressAccumulator ?? 0) / 10)
  if (state.tribeWarStart !== undefined) scores.war += 3

  const sorted = (Object.entries(scores) as [ExtCause, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? 'starvation'
}

function checkEndgame(state: GameState, mods: SimModifiers): GameState {
  const alive = Object.values(state.creatures).filter(c => c.diedOnDay === null)

  if (alive.length === 0 && Object.keys(state.creatures).length > 0) {
    const cause = inferExtinctionCause(state)
    const fossils: ExtinctionRecord = {
      id: uuid(),
      extinctionDay: state.time.day,
      extinctionCause: cause,
      peakPopulation: state.totalCreaturesEver,
      generationsReached: state.totalGenerations,
      finalMessage: extinctionMessage(null),
      creatureCount: state.totalCreaturesEver,
      notableCreatures: [],
    }
    return {
      ...state,
      endgame: 'extinction',
      fossilRecord: [...state.fossilRecord, fossils],
      messages: [
        ...state.messages,
        {
          id: uuid(), text: 'the colony is gone. silence.',
          stage: 1 as const, creatureId: null,
          day: state.time.day, timestamp: Date.now(), read: false,
          category: 'important' as const,
        }
      ]
    }
  }

  // Fracture: sustained inter-lineage conflict marks the colony as fracturing.
  // We no longer teleport everyone to migration targets. Instead, the
  // fracture is *chronicled* as a single event, and each creature gains an
  // elevated `fractureFleePressure` for ~3 in-game days. That pressure is
  // read by behavior.ts and converted into individually-chosen flee targets
  // away from rival-lineage centroids — only when the creature actually
  // perceives a rival nearby and only when their own drives (vigilance,
  // reclusion, low dominance) tip them toward fleeing. Aggressive creatures
  // may stay and fight. This makes the split emerge from individual choices,
  // not from a hand-of-god teleport.
  if (state.tribeWarStart !== undefined && state.endgame === null) {
    const daysSinceWarStart = state.time.day - state.tribeWarStart
    // fractureEligibilityMult < 1 means conflict fractures sooner (fracture expectation)
    const requiredSustain = TRIBE_WAR_SUSTAIN_DAYS * (mods.fractureEligibilityMult ?? 1)
    if (daysSinceWarStart >= requiredSustain) {
      const alive2 = Object.values(state.creatures).filter(c => c.diedOnDay === null)
      if (alive2.length >= 8) {
        const lineageGroups = new Map<string, number>()
        for (const c of alive2) lineageGroups.set(c.lineageId, (lineageGroups.get(c.lineageId) ?? 0) + 1)
        if (lineageGroups.size >= 2) {
          // No global stamp on creatures. We only chronicle the fracture; each
          // creature in behavior.ts independently checks for this chronicle
          // entry alongside their own perceived rival-presence and own drive
          // landscape. Some flee, some stay — emergence comes from the per-
          // creature reading of the chronicle, not an engine-wide tag.
          const fractured = pushChronicle(state, {
            kind: 'lineage_fork',
            day: state.time.day,
            count: lineageGroups.size,
            detail: 'fracture',
          })
          return {
            ...fractured,
            tribeWarStart: undefined,
          }
        }
      }
    }
  }

  return state
}

// ─── Event helpers ────────────────────────────────────────────────────────────

function createEvent(
  type: EventType,
  creatureIds: string[],
  day: number,
  body: string
): GameEvent {
  const titles: Record<EventType, string> = {
    fight: 'Conflict detected',
    sickness: 'Subject is sick',
    drought: 'Drought warning',
    stranger: 'Unknown creature spotted',
    tree_needed: 'Colony needs shelter',
    creature_missing: 'Subject stationary',
    food_low: 'Food running low',
    flood_warning: 'Flood risk rising',
    bond_formed: 'A bond formed',
    death: 'Subject deceased',
    new_generation: 'New generation recorded',
    tribe_war: 'Lineage conflict',
  }

  return {
    id: uuid(),
    type,
    title: titles[type],
    body,
    options: defaultOptions(type),
    day,
    resolved: false,
    involvedCreatureIds: creatureIds,
  }
}

function defaultOptions(type: EventType): GameEvent['options'] {
  switch (type) {
    case 'fight': return [
      { label: 'Break up the fight', action: 'break_up' },
      { label: 'Let them settle it', action: 'observe' },
    ]
    case 'sickness': return [
      { label: 'Use a heal charge', action: 'heal_creature' },
      { label: 'Let nature decide', action: 'ignore' },
    ]
    case 'food_low': return [
      { label: 'Drop food', action: 'drop_food' },
      { label: 'Plant a tree', action: 'plant_tree' },
      { label: 'Observe', action: 'observe' },
    ]
    case 'flood_warning': return [
      { label: 'Place water', action: 'redirect_river' },
      { label: 'Let it flood', action: 'ignore' },
    ]
    default: return [
      { label: 'Acknowledge', action: 'observe' },
    ]
  }
}

// Passive-tick helpers live in their own module now. Re-exported here for
// backward compat with any code that imports them from '@/engine/tick'.
export { computePassiveTicks, computeAbsenceHours } from '@/engine/passiveTicks'
