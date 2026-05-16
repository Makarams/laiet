import { v4 as uuid } from 'uuid'
import {
  GameState, Creature, GameEvent, EventType, Season, WeatherState,
  ExtinctionRecord, ColonyMessage, SimModifiers, RaceTrait,
  EnrichmentItem, EnrichmentType, EnvContext, CohortPhase,
} from '@/types'
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
  // awareness stage window tracking
  AWARENESS_STAGE_3_LEXICON_MIN,
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
  NATURAL_ENRICHMENT_BIOME_TYPES, NATURAL_ENRICHMENT_SEASON_MOD,
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
import { createOffspring, createAsexualOffspring, getColonyStage, computeAwarenessStage, recordExperience } from '@/creatures/factory'
import { generateMessage, deathMessage, extinctionMessage, boneMemoryMessage, generateRaceRevivalMessage, neglectWarningMessage, legendaryMessage } from './messages'
import { createRng, buildTileIndex } from '@/world/worldGen'
import { getSpeechContext, buildSentence, learnFromNearby, unlockTierEmoji, assignRole } from '@/engine/speech'

// ─── Tick entry point ─────────────────────────────────────────────────────────

export function tickSimulation(state: GameState): GameState {
  const _rng = createRng(Math.floor(Date.now()) % 999999)
  // Backward-compat: old saves without modifiers fall back to defaults.
  const mods = state.modifiers ?? DEFAULT_MODIFIERS

  let next: GameState = {
    ...state,
    modifiers: mods,
    // Backward-compat: old saves won't have weather
    weather: state.weather ?? 'clear',
    weatherTimer: state.weatherTimer ?? 20,
    // Backward-compat: old saves won't have enrichmentItems
    enrichmentItems: state.enrichmentItems ?? {},
    // Tiles NOT pre-cloned here; tickTiles does copy-on-write and produces
    // a fresh tile array. Pre-cloning all 14,400 tiles here was wasted work.
    creatures: { ...state.creatures },
    messages: [...state.messages],
    events: [...state.events],
  }

  next = tickTime(next)
  next = tickWeather(next, mods)
  next = tickTiles(next, mods)
  // snowAccumulation is computed inside tickTiles to avoid a redundant tile scan.
  next = tickCreatures(next, _rng, mods)

  // Compute population factor again (creatures may have died this tick).
  // Reproduction is suppressed under crowding & starvation pressure.
  const aliveNow = Object.values(next.creatures).filter(c => c.diedOnDay === null).length
  // popFactor: 1.0 below threshold; slopes to 0.20 minimum at threshold + DISEASE_POP_SLOPE_RANGE (120).
  // Widened from the old /55 slope so reproduction stays meaningful up to and past ascension (80).
  const popFactor = aliveNow > DISEASE_POP_THRESHOLD
    ? Math.max(0.20, 1 - (aliveNow - DISEASE_POP_THRESHOLD) / DISEASE_POP_SLOPE_RANGE)
    : 1.0

  next = tickReproduction(next, _rng, popFactor)
  next = tickTribes(next)
  next = tickEnrichment(next, _rng)
  next = tickNaturalEnrichment(next, _rng)

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

  // ── Cognition pressure — continuous, not gated ────────────────────────────
  // Awareness is a gradient, not a quest unlock. cognitionPressure (0-100) rises
  // from multiple orthogonal signals and drives the awarenessStage label.
  // Critically: it can FALL if those signals degrade — regression is real.
  {
    const aliveForStage = aliveAfterReproduction
    const prev = next.cognitionPressure ?? 0

    // ── Signal 1: Role diversity (0-25 points)
    // More distinct roles = richer social specialization. But diversity without
    // minimum depth (too few creatures) counts for less.
    const distinctRoles = new Set(aliveForStage.map(c => c.role).filter(r => r !== undefined)).size
    const popDepth = Math.min(1, aliveForStage.length / 10)  // under 10 creatures = shallow
    const roleSignal = Math.min(25, distinctRoles * 4) * popDepth

    // ── Signal 2: Vocabulary depth (0-20 points)
    // Colony-wide symbol pool reflects shared conceptual vocabulary.
    const colonyVocab = new Set<string>()
    for (const c of aliveForStage) c.knownEmoji.forEach(e => colonyVocab.add(e))
    const lexiconSignal = Math.min(20, (colonyVocab.size / AWARENESS_STAGE_3_LEXICON_MIN) * 20)

    // ── Signal 3: Sentience depth (0-25 points)
    // Not just "does one creature have high sentience" — the distribution matters.
    // A colony where many creatures have moderate sentience outscores one where a
    // single Sentinel is outlier-high and everyone else is 0.
    const avgSentience = aliveForStage.reduce((s, c) => s + c.sentience, 0) / Math.max(1, aliveForStage.length)
    const maxSentience = aliveForStage.reduce((max, c) => Math.max(max, c.sentience), 0)
    const sentienceSignal = Math.min(25, (avgSentience * 0.6 + maxSentience * 0.4) * 0.25)

    // ── Signal 4: Lineage and generational depth (0-15 points)
    // Multiple lineages with non-hostile relations + generational depth = cultural history.
    const lineageCount = new Set(aliveForStage.map(c => c.lineageId)).size
    const alliedPairs = Object.values(next.lineageRelations ?? {}).filter(v => v > 20).length
    const generationSignal = Math.min(10, (next.cohortPhase ?? 1) * 2)
    const lineageSignal = Math.min(5, lineageCount * 0.8 + alliedPairs * 0.5) + generationSignal

    // ── Signal 5: Experience breadth (0-15 points)
    // Creatures with rich experiential histories contribute disproportionately.
    const expBreadth = aliveForStage.reduce((s, c) => s + Math.min(1, (c.experienceWeight ?? 0) / 60), 0)
    const experienceSignal = Math.min(15, expBreadth * 2)

    // ── Combine and smooth ─────────────────────────────────────────────────
    const rawPressure = roleSignal + lexiconSignal + sentienceSignal + lineageSignal + experienceSignal
    const target = Math.min(100, rawPressure)
    const delta = target - prev

    // Regression rate depends on institutional depth: a colony with role diversity,
    // living elders, and a deep lexicon has encoded its culture more durably.
    // Thin colonies with no roles and tiny vocab collapse faster when pressured.
    const distinctRoleCount = new Set(aliveForStage.map(c => c.role).filter(Boolean)).size
    const elderCount = aliveForStage.filter(c => c.role === 'elder' || c.role === 'shaman').length
    const institutionalDepth = Math.min(1,
      (distinctRoleCount / 5) * 0.4 +
      Math.min(1, elderCount / 2) * 0.35 +
      (colonyVocab.size / 40) * 0.25
    )
    const regressionRate = 0.008 * (1 - institutionalDepth * 0.65)
    const rate = delta > 0 ? 0.004 : regressionRate
    next.cognitionPressure = Math.max(0, Math.min(100, prev + delta * rate))

    // Keep the window tracking fields for computeAwarenessStage() in factory.ts (backward compat),
    // but now derive them from pressure rather than binary condition checks.
    const cp = next.cognitionPressure
    next.roleWindowStart    = cp >= 15 ? (next.roleWindowStart    ?? next.time.day) : undefined
    next.lexiconWindowStart = cp >= 35 ? (next.lexiconWindowStart ?? next.time.day) : undefined
    next.ancestralWindowStart    = cp >= 60 ? (next.ancestralWindowStart    ?? next.time.day) : undefined
    next.transcendentWindowStart = cp >= 85 ? (next.transcendentWindowStart ?? next.time.day) : undefined
  }

  const computedStage = computeAwarenessStage(next)
  next.awarenessStage = computedStage

  next = tickCaretaker(next, mods)
  next = checkEndgame(next, mods)

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
          next.messages = [...next.messages, neglectWarningMessage('warmth', coldCount, next.time.day)]
          next.lastNeglectWarning = next.time.day
          next.colonyDistressAccumulator = 0  // colony spoke — reset; it won't repeat unless crisis rebuilds
        } else if (hungryCount >= NEGLECT_MIN_AFFECTED) {
          next.messages = [...next.messages, neglectWarningMessage('hunger', hungryCount, next.time.day)]
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
    const alive = Object.values(next.creatures).filter(c => !c.diedOnDay)
    const newRacePops: Partial<Record<RaceTrait, number>> = {}
    for (const c of alive) {
      const r = c.genome.race
      if (r) newRacePops[r] = (newRacePops[r] ?? 0) + 1
    }

    // Revival: race was in extinctRaces (or was alive last tick but now gone) and now > 0
    const prevExtinct = new Set<RaceTrait>(next.extinctRaces ?? [])
    const prevPops = next.racePopulations ?? {}
    const revivalMessages: ColonyMessage[] = []

    // Detect newly extinct races (had living members, now zero)
    const nowExtinct = new Set<RaceTrait>(prevExtinct)
    for (const r in prevPops) {
      const race = r as RaceTrait
      if ((prevPops[race] ?? 0) > 0 && !(newRacePops[race])) {
        nowExtinct.add(race)
      }
    }

    // Detect revivals (was extinct/absent, now alive)
    for (const r in newRacePops) {
      const race = r as RaceTrait
      if ((newRacePops[race] ?? 0) > 0 && prevExtinct.has(race)) {
        nowExtinct.delete(race)
        // Find a carrier to name in the message
        const carrier = alive.find(c => c.genome.race === race)
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

function tickWeather(state: GameState, mods: SimModifiers): GameState {
  let weather = (state.weather ?? 'clear') as WeatherState
  let timer = Math.max(0, (state.weatherTimer ?? 20) - DAY_FRACTION_PER_TICK)

  // Season-guard: heatwave and fog don't persist into wrong seasons
  const season = state.time.season
  if (weather === 'heatwave' && season !== 'summer') weather = 'clear'
  if (weather === 'fog' && season === 'winter') weather = 'snow'

  if (timer <= 0) {
    const rnd = Math.random()
    type Trans = [WeatherState, number][]
    const isSpring = season === 'spring'
    const isSummer = season === 'summer'
    const isAutumn = season === 'autumn'
    const isWinter = season === 'winter'

    const transitions: Record<WeatherState, Trans> = {
      // Spring: rain and fog dominate; no drought early; brief storms
      clear: isSpring
        ? [['rain', 0.40], ['clear', 0.65], ['fog', 0.82], ['storm', 0.96], ['drought', 1.00]]
        : isSummer
        ? [['clear', 0.30], ['drought', 0.52], ['heatwave', 0.68], ['rain', 0.84], ['storm', 1.00]]
        : isAutumn
        ? [['clear', 0.28], ['fog', 0.48], ['rain', 0.68], ['storm', 0.84], ['snow', 0.95], ['drought', 1.00]]
        : /* winter */
          [['clear', 0.25], ['snow', 0.55], ['rain', 0.70], ['storm', 0.85], ['drought', 1.00]],

      rain: isSpring
        ? [['rain', 0.35], ['clear', 0.60], ['fog', 0.80], ['storm', 1.00]]
        : isSummer
        ? [['clear', 0.55], ['storm', 0.80], ['rain', 1.00]]
        : isAutumn
        ? [['rain', 0.30], ['storm', 0.55], ['clear', 0.78], ['fog', 1.00]]
        : /* winter */
          [['snow', 0.40], ['clear', 0.70], ['storm', 0.88], ['rain', 1.00]],

      storm: isSpring
        ? [['rain', 0.45], ['clear', 0.70], ['fog', 0.88], ['storm', 1.00]]
        : isSummer
        ? [['drought', 0.35], ['clear', 0.65], ['rain', 0.88], ['storm', 1.00]]
        : isAutumn
        ? [['rain', 0.35], ['storm', 0.55], ['snow', 0.70], ['clear', 1.00]]
        : /* winter */
          [['snow', 0.50], ['clear', 0.78], ['rain', 1.00]],

      drought: isSummer
        ? [['drought', 0.40], ['heatwave', 0.60], ['clear', 0.85], ['storm', 1.00]]
        : isWinter
        ? [['drought', 0.35], ['clear', 0.70], ['snow', 0.88], ['storm', 1.00]]
        : [['clear', 0.60], ['drought', 0.82], ['storm', 1.00]],

      snow:     [['snow', 0.45], ['clear', 0.75], ['storm', 0.90], ['rain', 1.00]],
      heatwave: [['heatwave', 0.35], ['drought', 0.60], ['clear', 0.88], ['storm', 1.00]],
      fog: isSpring
        ? [['clear', 0.40], ['fog', 0.60], ['rain', 0.82], ['storm', 1.00]]
        : [['fog', 0.40], ['clear', 0.62], ['rain', 0.82], ['storm', 1.00]],
    }

    let next: WeatherState = 'clear'
    for (const [w, prob] of transitions[weather]) {
      if (rnd < prob) { next = w; break }
    }
    weather = next
    const [min, max] = WEATHER_DURATION[weather] ?? [8, 20]
    const durationMult = weather === 'drought' ? mods.droughtDurationMult : 1.0
    timer = (min + Math.random() * (max - min)) * durationMult
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
      : 1.0)
    * mods.foodRegrowMult

  // Pre-count vegetation so growth checks can enforce world-wide caps.
  // This prevents trees, bushes, and healroot from stacking endlessly; new growth only
  // occurs when the count is below the cap, forcing natural turnover.
  // Also track anyBurning here to avoid a second full tile scan later.
  let treeCount = 0, bushCount = 0, healrootCount = 0, foodPatchCount = 0, anyBurning = false
  for (let vy = 0; vy < WORLD_SIZE; vy++) {
    for (let vx = 0; vx < WORLD_SIZE; vx++) {
      const vt = state.tiles[vy][vx]
      const vtType = vt.type
      if (vtType === 'tree' || vtType === 'shelter') treeCount++
      else if (vtType === 'bush') bushCount++
      else if (vtType === 'healroot') healrootCount++
      else if (vtType === 'food_patch') foodPatchCount++
      if (!anyBurning && (vt.burning ?? 0) > 0) anyBurning = true
    }
  }

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
  if (lightningChance > 0 && Math.random() < lightningChance) {
    const lx = 1 + Math.floor(Math.random() * (WORLD_SIZE - 2))
    const ly = 1 + Math.floor(Math.random() * (WORLD_SIZE - 2))
    const lt = writeTile(ly, lx)
    lt.lightningFlash = Date.now()
    if (lt.type === 'tree' || lt.type === 'shelter') {
      lt.burning = FIRE_DURATION_TICKS
    }
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

  // Snow accumulation computed here to avoid a separate O(n²) pass in tickSimulation.
  let snowTiles = 0, totalSnowableTiles = 0
  for (let sy = 0; sy < WORLD_SIZE; sy++) {
    for (let sx = 0; sx < WORLD_SIZE; sx++) {
      const st = tiles[sy][sx]
      if (st.type !== 'mountain' && st.type !== 'cliff' && st.type !== 'rock') {
        totalSnowableTiles++
        if ((st.snowDepth ?? 0) > 0.1) snowTiles++
      }
    }
  }
  const snowAccumulation = totalSnowableTiles > 0
    ? Math.round((snowTiles / totalSnowableTiles) * 100)
    : 0

  return { ...state, tiles, snowAccumulation }
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
  // Live healroot tile count for spawn gating; incremented when death-site spawning adds tiles
  let healrootCount = 0
  for (let vy = 0; vy < WORLD_SIZE; vy++) {
    for (let vx = 0; vx < WORLD_SIZE; vx++) {
      if (srcTiles[vy][vx].type === 'healroot') healrootCount++
    }
  }
  // Tool-as-answer tracking; updated when a question is generated this tick
  let nextAwaitingResponseUntil = state.caretaker.awaitingResponseUntil ?? 0
  let clearRespondedFlag = false

  // Pre-build alive array and tile index once; shared across all creature iterations.
  // Avoids O(n) Object.values + filter per creature and O(d²) tile scans in behavior.
  const aliveCreatures = Object.values(creatures).filter(c => c.diedOnDay === null)
  const aliveCount = aliveCreatures.length
  const tileIdx = buildTileIndex(srcTiles)

  // Snapshot of role counts at tick start — used to make role assignment colony-compositional.
  // Roles that are absent from the colony get a mild boost in assignRole scoring so qualified
  // creatures fill them preferentially. This is computed once and stays stable for the tick.
  const currentRoleCounts: Partial<Record<string, number>> = {}
  for (const ac of aliveCreatures) {
    if (ac.role) currentRoleCounts[ac.role] = (currentRoleCounts[ac.role] ?? 0) + 1
  }

  for (const id in creatures) {
    const initialState = creatures[id].state
    let c = { ...creatures[id] }
    if (c.diedOnDay !== null) continue

    // Absence imprint: colony is unsettled for several in-game days after a long absence.
    if ((state.absenceImprint ?? 0) > 0) {
      c.stress = Math.min(100, c.stress + ABSENCE_IMPRINT_STRESS_PER_TICK)
    }

    const creatureTile = state.tiles[c.y]?.[c.x]
    // Track biome for environmental visual adaptation; record biome discovery experience
    if (creatureTile?.biome) {
      const prevBiome = c.dominantBiome
      c.dominantBiome = creatureTile.biome
      if (prevBiome && prevBiome !== creatureTile.biome) {
        recordExperience(c, 'discovered_biome', state.time.day)
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
      // Veil race thrives in fog; additional stress relief
      if (c.genome.race === 'Veil') {
        c.stress = Math.max(0, c.stress - VEIL_FOG_STRESS_RELIEF)
      }
    }

    // Race terrain effects applied after weather modifiers
    const race = c.genome.race
    // Ember: comfort near burned/scorched ground; stress relief when on or adjacent to barren tiles
    if (race === 'Ember') {
      const currentTileForRace = state.tiles[c.y]?.[c.x]
      if (currentTileForRace?.type === 'barren' || currentTileForRace?.burning > 0) {
        c.stress = Math.max(0, c.stress - EMBER_FIRE_STRESS_RELIEF)
      }
    }
    // Crag: rocky and mountain terrain confers natural warmth; these creatures evolved for altitude
    if (race === 'Crag') {
      const currentTileForCrag = state.tiles[c.y]?.[c.x]
      if (currentTileForCrag?.biome === 'rocky') {
        c.warmth = Math.min(100, c.warmth + 0.3)
        c.stress  = Math.max(0, c.stress - 0.2)
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
    if (lastActionX !== null && lastActionY !== null
        && c.genome.mind !== 'Feral'
        && Date.now() - (state.caretaker.lastActionMs ?? 0) < CARETAKER_PRESENCE_WINDOW_MS
        && Math.abs(c.x - lastActionX) <= CARETAKER_PRESENCE_RADIUS
        && Math.abs(c.y - lastActionY) <= CARETAKER_PRESENCE_RADIUS) {
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

    const behaviorChanges = tickBehavior(c, tiles, creatures, state.time.season, aliveCreatures, tileIdx, state.enrichmentItems, weather)
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

        // Stress nearby witnesses and mark trauma window
        for (const witness of Object.values(creatures)) {
          if (witness.id === c.id || witness.diedOnDay !== null) continue
          if (Math.abs(witness.x - c.x) <= 3 && Math.abs(witness.y - c.y) <= 3) {
            creatures[witness.id] = {
              ...witness,
              stress: Math.min(100, witness.stress + CANNIBAL_WITNESS_STRESS),
              traumaUntil: state.time.day + CANNIBAL_TRAUMA_DURATION_DAYS,
            }
          }
        }

        if (state.time.day - lastMsgDay >= 1) {
          messages.push({
            id: uuid(),
            text: `${c.name} fed on the dead.`,
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

        // Generational memory: surviving fire encodes a fire symbol into vocabulary.
        if (c.health > 0 && !c.knownEmoji.includes('🔥')) {
          c.knownEmoji = [...c.knownEmoji, '🔥']
        }
      }

      // Generational memory: lightning and drought encode event symbols.
      if ((currentTile.lightningFlash ?? 0) > Date.now() - 3000 && !c.knownEmoji.includes('⚡')) {
        c.knownEmoji = [...c.knownEmoji, '⚡']
      }
      if (state.weather === 'drought' && c.thirst > 70 && !c.knownEmoji.includes('🌾')) {
        c.knownEmoji = [...c.knownEmoji, '🌾']
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
      const contactChance = DISEASE_CONTACT_CHANCE * seasonMult * biomeMult * wMult * stressMult * immunityReduction * sporeResistMult * mireResistMult

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
        const relation = relations[key] ?? 0  // -100 (hostile) .. 100 (allied)

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
      const cause = c.health <= 0
        ? (c.hunger > 80 ? 'starvation' : c.thirst > 80 ? 'dehydration' : 'injury')
        : 'old age'

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

        // Healroot spawns around death sites; the world offers remedy to mourners.
        // Capped to prevent late-game death saturation from flooding the map.
        if (healrootCount < HEALROOT_CAP) {
          for (let dy = -HEALROOT_DEATH_SITE_RADIUS; dy <= HEALROOT_DEATH_SITE_RADIUS; dy++) {
            for (let dx = -HEALROOT_DEATH_SITE_RADIUS; dx <= HEALROOT_DEATH_SITE_RADIUS; dx++) {
              if (healrootCount >= HEALROOT_CAP) break
              const ny = c.y + dy
              const nx = c.x + dx
              if (ny >= 0 && ny < WORLD_SIZE && nx >= 0 && nx < WORLD_SIZE && Math.random() < HEALROOT_DEATH_SPAWN_CHANCE) {
                const tile = writeTile(ny, nx)
                if (tile.type === 'grass' || tile.type === 'mud') {
                  tile.type = 'healroot'
                  tile.healrootAmount = 60
                  healrootCount++
                }
              }
            }
          }
        }
      }

      messages.push(deathMessage(c, state.time.day))

      if (cause === 'starvation') {
        events.push(createEvent('death', [c.id], state.time.day, c.name + ' starved'))
      }

      for (const bond of c.bonds) {
        if (creatures[bond.targetId] && creatures[bond.targetId].diedOnDay === null) {
          const survivor = creatures[bond.targetId]
          creatures[bond.targetId] = {
            ...survivor,
            state: 'mourning',
            stateTimer: 60,
            stress: Math.min(100, survivor.stress + 30),
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

    // Sentience messages; stage-3 can be questions; responses acknowledge tool actions
    if (c.sentience > 20) {
      const respondedToQuestion = state.caretaker.respondedToQuestion ?? false
      const result = generateMessage(c, state.awarenessStage, state.time.day, lastMsgDay, respondedToQuestion, mods.awarenessMessageMult, state.caretaker.lastToolUsed, { totalGenerations: state.totalGenerations, aliveCount: aliveCreatures.length })
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

      // Experience: first meaningful bond + cross-lineage bond
      if (crossed35) {
        recordExperience(c, 'bond_formed', state.time.day)
        if (c.lineageId !== other.lineageId) {
          recordExperience(c, 'cross_lineage_bond', state.time.day)
          recordExperience(other, 'cross_lineage_bond', state.time.day)
        }
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
    // Fights
    if (c.genome.personality === 'Aggressive' && Math.random() < 0.001) {
      const target = nearby.find(o => o.id !== c.id && o.genome.personality !== 'Timid')
      if (target) {
        const result = resolveFight(c, { ...target })
        c = result.attacker
        creatures[target.id] = result.defender
        events.push(createEvent('fight', [c.id, target.id], state.time.day,
          `${c.name} challenged ${target.name}`))

        // Inter-lineage combat degrades their relationship score
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
      const role = assignRole(c, aliveCount, lineageCount, currentRoleCounts)
      if (role !== c.role) {
        c = { ...c, role }
        // Role-specific emoji: shaman/elder immediately gain their first role word
        if (role && !c.role) {
          // just became a role-holder; nothing to add here, unlockTierEmoji handles it next tick
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
      const context = getSpeechContext(c, state.awarenessStage)
      if (context) {
        const sentence = buildSentence(c, context)
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

          // ── Speech behavioral consequences ─────────────────────────────────
          // Speech is not purely decorative — broadcasted signals cause real reactions
          // in nearby creatures that can understand (share at least one emoji token).

          // food_found: hungry nearby creatures route toward the broadcaster
          if (context === 'food_found' || context === 'water_found') {
            const broadcastRadius = 10
            const isFood = context === 'food_found'
            for (const listener of aliveCreatures) {
              if (listener.id === c.id) continue
              if (Math.abs(listener.x - c.x) > broadcastRadius || Math.abs(listener.y - c.y) > broadcastRadius) continue
              if (listener.genome.mind === 'Feral') continue
              // Listener must understand at least one token in the sentence
              const understands = sentence.some(e => listener.knownEmoji.includes(e))
              if (!understands) continue
              const needsFood = isFood ? listener.hunger > 35 : listener.thirst > 35
              if (needsFood && (listener.state === 'idle' || listener.state === 'wandering' || listener.state === 'seeking_food' || listener.state === 'seeking_water')) {
                // Route toward the speaker's position
                creatures[listener.id] = { ...creatures[listener.id], targetX: c.x, targetY: c.y }
              }
            }
          }

          // threat / fleeing: Timid and Furtive nearby get stress from the alarm
          if (context === 'threat' || context === 'fleeing' || context === 'predator_alert') {
            const alarmRadius = 7
            for (const listener of aliveCreatures) {
              if (listener.id === c.id) continue
              if (Math.abs(listener.x - c.x) > alarmRadius || Math.abs(listener.y - c.y) > alarmRadius) continue
              if (listener.genome.personality !== 'Timid' && listener.genome.personality !== 'Furtive') continue
              const understands = sentence.some(e => listener.knownEmoji.includes(e))
              if (!understands) continue
              creatures[listener.id] = {
                ...creatures[listener.id],
                stress: Math.min(100, (creatures[listener.id].stress ?? 0) + 10),
              }
            }
          }

          // dying: bonded creatures feel the loss and approach
          if (context === 'dying') {
            for (const bond of c.bonds) {
              if (bond.strength < 30) continue
              const bonded = creatures[bond.targetId]
              if (!bonded || bonded.diedOnDay !== null) continue
              creatures[bond.targetId] = {
                ...bonded,
                stress: Math.min(100, (bonded.stress ?? 0) + 15),
                targetX: c.x,
                targetY: c.y,
              }
            }
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

    // ── Sexual reproduction (bonded pair) ──
    if (canReproduce(c, state.time.season, popFactor, state.weather)) {
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

        const offspring = createOffspring(c, partner, c.x, c.y, state.time.day, tickRng, state.modifiers?.mutationChance, combinedLex, envCtx, divergencePressure)
        newCreatures.push(offspring)

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

        // Emit mutation event when discrete traits changed from both parents
        if (offspring.recentMutation !== undefined && offspring.mutatedTraits && offspring.mutatedTraits.length > 0) {
          const traitNames = offspring.mutatedTraits.join(', ')
          if (state.time.day - lastMsgDay >= 1) {
            messages.push({
              id: uuid(),
              text: `⚡ ${offspring.name} ${offspring.familyName} — altered ${traitNames}`,
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
      const offspring = createAsexualOffspring(c, c.x, c.y, state.time.day, tickRng, asexEnvCtx)
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
        const traitNames = offspring.mutatedTraits.join(', ')
        if (state.time.day - lastMsgDay >= 1) {
          messages.push({
            id: uuid(),
            text: `⚡ ${offspring.name} ${offspring.familyName} — evolved ${traitNames}`,
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

      // Connection depth shapes which message fires
      // const relation = isParent ? 'parent' : isGrandparent ? 'grandparent' : 'lineage'
      messages.push(boneMemoryMessage(offspring.name, state.time.day, offspring.id))
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
function tickNaturalEnrichment(state: GameState, rng: () => number): GameState {
  const alive = Object.values(state.creatures).filter(c => !c.diedOnDay).length
  const cap = Math.min(
    NATURAL_ENRICHMENT_CAP_MAX,
    NATURAL_ENRICHMENT_CAP_BASE + Math.floor(alive / NATURAL_ENRICHMENT_CAP_PER_N_ALIVE)
  )
  const naturalCount = Object.values(state.enrichmentItems).filter(e => e.natural).length
  if (naturalCount >= cap) return state

  const season = state.time.season
  const newItems: Record<string, EnrichmentItem> = {}

  const aliveForEnrichment = Object.values(state.creatures).filter(c => !c.diedOnDay)

  for (let attempt = 0; attempt < NATURAL_ENRICHMENT_ATTEMPTS_PER_TICK; attempt++) {
    // Bias spawn near creature clusters so items always fall within ENRICHMENT_SEEK_RADIUS.
    // Fully random positions filled the cap with unreachable items, shutting down all spawning.
    if (aliveForEnrichment.length === 0) break
    const anchor = aliveForEnrichment[Math.floor(rng() * aliveForEnrichment.length)]
    const angle = rng() * Math.PI * 2
    const dist  = 3 + rng() * 15  // 3-18 tiles; always within ENRICHMENT_SEEK_RADIUS (20)
    const x = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(anchor.x + Math.cos(angle) * dist)))
    const y = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(anchor.y + Math.sin(angle) * dist)))
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
      if (rng() < NATURAL_ENRICHMENT_SPAWN_CHANCE * seasonMod) {
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
                  const intensity = relScore < -40 ? 'violently' : relScore < -15 ? 'aggressively' : 'tentatively'
                  messages.push({
                    id: uuid(),
                    text: `${a.name} and ${b.name} clashed ${intensity} at the boundary between lineages`,
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

function tickCaretaker(state: GameState, mods: SimModifiers): GameState {
  const now = Date.now()
  const caretaker = { ...state.caretaker }
  const msPerDay = 86_400_000

  if (now - caretaker.lastHealReset > msPerDay) {
    // Use the profile-derived charge count, not the bare constant.
    // Interventionist profile sets mods.healCharges = 4; base is 3.
    caretaker.healCharges = mods.healCharges
    caretaker.lastHealReset = now
  }

  if (caretaker.lastSeasonRedirect !== state.time.season) {
    caretaker.riverRedirectUsed = false
    caretaker.lastSeasonRedirect = state.time.season
  }

  // Tick down absence imprint one in-game day per tick (approximate)
  const absenceImprint = Math.max(0, (state.absenceImprint ?? 0) - DAY_FRACTION_PER_TICK)

  return { ...state, caretaker, absenceImprint }
}

// ─── Endgame ─────────────────────────────────────────────────────────────────

// Derive extinction cause from the colony's recorded history, not current conditions.
// We scan the last N messages for recurring themes and cross-reference state history.
function inferExtinctionCause(state: GameState): ExtinctionRecord['extinctionCause'] {
  // Scan recent messages for cause signals. Each keyword tallies a score.
  const scores: Record<ExtinctionRecord['extinctionCause'], number> = {
    neglect: 0, war: 0, drought: 0, flood: 0, winter: 0, starvation: 0, heatwave: 0,
  }

  // Check the last 30 messages for contextual cause evidence
  const recentMsgs = state.messages.slice(-30)
  for (const m of recentMsgs) {
    const t = m.text.toLowerCase()
    if (t.includes('hunger') || t.includes('starv') || t.includes('food'))   scores.starvation++
    if (t.includes('cold') || t.includes('warmth') || t.includes('winter'))  scores.winter++
    if (t.includes('drought') || t.includes('thirst') || t.includes('water')) scores.drought++
    if (t.includes('flood') || t.includes('flood'))                            scores.flood++
    if (t.includes('heatwave') || t.includes('heat'))                         scores.heatwave++
    if (t.includes('conflict') || t.includes('lineage') || t.includes('war') || t.includes('clash')) scores.war++
  }

  // Direct weather/season evidence at time of death also contributes
  if (state.weather === 'heatwave')                                   scores.heatwave += 3
  if (state.weather === 'drought')                                    scores.drought += 3
  if (state.time.season === 'winter' || state.weather === 'snow')    scores.winter += 2
  if (state.tribeWarStart !== undefined)                              scores.war += 3

  // Colony distress history: if the distress accumulator was high before dying, it was neglect
  if ((state.colonyDistressAccumulator ?? 0) > 50)                   scores.neglect += 4

  // Find the dominant cause
  const dominant = (Object.entries(scores) as [ExtinctionRecord['extinctionCause'], number][])
    .sort((a, b) => b[1] - a[1])[0]

  // If no strong signal, fall back to starvation (most common)
  return (dominant[1] > 0) ? dominant[0] : 'starvation'
}

function checkEndgame(state: GameState, _mods: SimModifiers): GameState {
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
        }
      ]
    }
  }

  // Fracture: sustained inter-lineage conflict causes the colony to split and scatter.
  // Rather than ending the simulation, each lineage migrates to a distinct region of the
  // map and continues as a separate population. This is an emergent branching event, not
  // a terminal state.
  if (state.tribeWarStart !== undefined && state.endgame === null) {
    const daysSinceWarStart = state.time.day - state.tribeWarStart
    if (daysSinceWarStart >= TRIBE_WAR_SUSTAIN_DAYS) {
      const alive2 = Object.values(state.creatures).filter(c => c.diedOnDay === null)
      if (alive2.length >= 8) {
        // Group living creatures by lineage
        const lineageGroups = new Map<string, typeof alive2>()
        for (const c of alive2) {
          const g = lineageGroups.get(c.lineageId) ?? []
          g.push(c)
          lineageGroups.set(c.lineageId, g)
        }
        const lineageList = [...lineageGroups.entries()]

        // Assign each lineage a destination corner/quadrant of the map so they
        // naturally separate and stop overlapping territory.
        const corners = [
          { cx: Math.floor(WORLD_SIZE * 0.2), cy: Math.floor(WORLD_SIZE * 0.2) },
          { cx: Math.floor(WORLD_SIZE * 0.8), cy: Math.floor(WORLD_SIZE * 0.8) },
          { cx: Math.floor(WORLD_SIZE * 0.8), cy: Math.floor(WORLD_SIZE * 0.2) },
          { cx: Math.floor(WORLD_SIZE * 0.2), cy: Math.floor(WORLD_SIZE * 0.8) },
        ]

        const updatedCreatures = { ...state.creatures }
        lineageList.forEach(([, members], idx) => {
          const dest = corners[idx % corners.length]
          for (const c of members) {
            // Scatter each member around the destination with a small random offset
            // so the group spreads rather than piling onto one tile.
            const scatter = 12
            const tx = Math.max(0, Math.min(WORLD_SIZE - 1,
              dest.cx + Math.floor((Math.random() - 0.5) * scatter * 2)))
            const ty = Math.max(0, Math.min(WORLD_SIZE - 1,
              dest.cy + Math.floor((Math.random() - 0.5) * scatter * 2)))
            updatedCreatures[c.id] = {
              ...updatedCreatures[c.id],
              state: 'migrating' as const,
              targetX: tx,
              targetY: ty,
            }
          }
        })

        return {
          ...state,
          creatures: updatedCreatures,
          // Clear the war timer so the conflict clock resets after the split.
          // If the lineages wander back into contact the timer can re-engage.
          tribeWarStart: undefined,
          messages: [
            ...state.messages,
            {
              id: uuid(),
              text: 'the lineages could not share the territory. each has begun migrating to its own region.',
              stage: 1 as const,
              creatureId: null,
              day: state.time.day,
              timestamp: Date.now(),
              read: false,
            }
          ]
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

// ─── Passive time-skipping ────────────────────────────────────────────────────

// Passive ticks apply only when the tab was fully closed (beforeunload fired).
// The simulation pauses automatically when the tab is hidden, so background
// idle is no longer a concern. The cap here is intentionally small; just
// enough to advance weather and day/night by a couple of minutes on genuine
// tab-close/reopen, without endangering the colony through a long drought.
const MAX_PASSIVE_TICKS = 240   // 4 real minutes of catch-up maximum

export function computePassiveTicks(lastSessionEnd: number | null): number {
  if (!lastSessionEnd) return 0
  const elapsed = Date.now() - lastSessionEnd
  if (elapsed <= 0) return 0
  const realMinutes = elapsed / 60_000
  return Math.min(Math.floor(realMinutes * 60), MAX_PASSIVE_TICKS)
}

// How many real hours the player was away (used for absence message)
export function computeAbsenceHours(lastSessionEnd: number | null): number {
  if (!lastSessionEnd) return 0
  const elapsed = Date.now() - lastSessionEnd
  return Math.max(0, elapsed / 3_600_000)
}
