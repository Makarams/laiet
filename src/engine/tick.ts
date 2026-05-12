import { v4 as uuid } from 'uuid'
import {
  GameState, Creature, GameEvent, EventType, Season, WeatherState,
  ExtinctionRecord, ColonyMessage, SimModifiers,
} from '@/types'
import {
  DAY_FRACTION_PER_TICK, DAYS_PER_SEASON, FOOD_REGROW_RATE_BASE,
  FOOD_REGROW_MULTIPLIER, TREE_GROW_DAYS, WATER_REPLENISH_RATE,
  WORLD_SIZE, HEAL_CHARGES_PER_DAY, BOND_STRENGTH_PER_TICK, DEBUG,
  DEATH_SITE_DECAY_DAYS,
  CANNIBAL_HUNGER_THRESHOLD, CANNIBAL_HUNGER_RELIEF,
  CANNIBAL_STRESS_PENALTY, CANNIBAL_WITNESS_STRESS,
  DISEASE_POP_THRESHOLD, DISEASE_CONTACT_CHANCE, DISEASE_HEALTH_DRAIN,
  FIRE_DURATION_TICKS, FIRE_SPREAD_CHANCE, FIRE_TICK_DAMAGE,
  ASEXUAL_BASE_CHANCE, REPRODUCE_BOND_MIN_STRENGTH,
  AUTO_LIGHTNING_CHANCE, AUTO_LIGHTNING_DAMAGE, CAVE_WARMTH_BONUS,
  WEATHER_DURATION, RAIN_WATER_BONUS, RAIN_THIRST_REDUCTION, RAIN_FOOD_BONUS,
  STORM_LIGHTNING_CHANCE, DROUGHT_WATER_DRAIN, DROUGHT_THIRST_PENALTY,
  DROUGHT_FOOD_FACTOR, THIRST_DECAY,
  WARMTH_DECAY_BASE, WARMTH_DECAY_WINTER,
  CARETAKER_PRESENCE_RADIUS, CARETAKER_PRESENCE_WINDOW_MS, CARETAKER_SENTIENCE_BOOST,
  BONE_MEMORY_CHANCE, BONE_MEMORY_RADIUS,
  QUESTION_RESPONSE_WINDOW_MS,
  TREE_FOOD_DROP_CHANCE, TREE_FOOD_RADIUS, TREE_FOOD_MATURE_AGE, TREE_APPLE_MAX_PER_TILE,
  PLAY_DURATION_TICKS, PLAY_STRESS_REDUCTION,
  NATURAL_CAVE_STRESS_REDUCTION, NATURAL_RIVER_STRESS_REDUCTION,
  NATURAL_TREE_STRESS_REDUCTION, NATURAL_ROCKY_SENTINEL_BONUS,
} from './constants'
import {
  tickNeeds, tickBehavior, tickMovement,
  eatFromTile, drinkFromTile,
  canReproduce, canAsexuallyReproduce, resolveFight, applyEnrichmentEffect,
} from '@/creatures/behavior'
import { DEFAULT_MODIFIERS } from '@/engine/profile'
import { createOffspring, createAsexualOffspring, getColonyStage, computeAwarenessStage } from '@/creatures/factory'
import { generateMessage, deathMessage, extinctionMessage, ascensionMessage, boneMemoryMessage } from './messages'
import { createRng, getAdjacentTiles, buildTileIndex } from '@/world/worldGen'

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
    // Tiles NOT pre-cloned here — tickTiles does copy-on-write and produces
    // a fresh tile array. Pre-cloning all 14,400 tiles here was wasted work.
    creatures: { ...state.creatures },
    messages: [...state.messages],
    events: [...state.events],
  }

  next = tickTime(next)
  next = tickWeather(next, mods)
  next = tickTiles(next, mods)
  next = tickCreatures(next, _rng, mods)

  // Compute population factor again (creatures may have died this tick).
  // Reproduction is suppressed under crowding & starvation pressure.
  const aliveNow = Object.values(next.creatures).filter(c => c.diedOnDay === null).length
  const popFactor = aliveNow > DISEASE_POP_THRESHOLD
    ? Math.max(0.20, 1 - (aliveNow - DISEASE_POP_THRESHOLD) / 55)
    : 1.0

  next = tickReproduction(next, _rng, popFactor)
  next = tickTribes(next)
  next = tickEnrichment(next)

  const liveCount = Object.values(next.creatures).filter(c => !c.diedOnDay).length
  next.colonyStage = getColonyStage(liveCount) as GameState['colonyStage']
  next.awarenessStage = computeAwarenessStage(next)

  next = tickCaretaker(next)
  next = checkEndgame(next, mods)

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

  if (timer <= 0) {
    // Transition to next weather based on current state
    const rnd = Math.random()
    type Trans = [WeatherState, number][]
    const transitions: Record<WeatherState, Trans> = {
      clear:   [['clear', 0.40], ['rain', 0.75], ['drought', 0.95], ['storm', 1.00]],
      rain:    [['clear', 0.50], ['storm', 0.80], ['rain', 1.00]],
      storm:   [['clear', 0.60], ['rain', 1.00]],
      drought: [['clear', 0.70], ['drought', 0.90], ['storm', 1.00]],
    }
    let next: WeatherState = 'clear'
    let cumulative = 0
    for (const [w, prob] of transitions[weather]) {
      cumulative = prob
      if (rnd < cumulative) { next = w; break }
    }
    weather = next
    const [min, max] = WEATHER_DURATION[weather]
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

      // Food regrowth — only patches near a mature tree regenerate.
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
          writeTile(y, x).foodAmount = Math.min(100, t.foodAmount + FOOD_REGROW_RATE_BASE * regrowMod)
        } else if (!hasMatureTree && t.foodAmount <= 0) {
          const wt = writeTile(y, x)
          wt.type = t.biome === 'arid' ? 'barren' : 'grass'
          wt.foodAmount = 0
        }
      }

      // Rain refills rivers; drought slowly drains them
      if (t.type === 'river' || t.type === 'mud') {
        if (weather === 'rain' || weather === 'storm') {
          writeTile(y, x).waterLevel = Math.min(100, t.waterLevel + RAIN_WATER_BONUS)
        } else if (weather === 'drought') {
          writeTile(y, x).waterLevel = Math.max(0, t.waterLevel - DROUGHT_WATER_DRAIN)
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

      // Tree food generation — mature trees drop fruit onto nearby passable tiles.
      // This makes trees the primary food source; food_patches near trees naturally
      // accumulate while isolated ones slowly run dry.
      if ((t.type === 'tree' || t.type === 'shelter')
          && t.treeAge >= TREE_FOOD_MATURE_AGE
          && Math.random() < TREE_FOOD_DROP_CHANCE) {
        for (let dy = -TREE_FOOD_RADIUS; dy <= TREE_FOOD_RADIUS; dy++) {
          for (let dx = -TREE_FOOD_RADIUS; dx <= TREE_FOOD_RADIUS; dx++) {
            if (dx === 0 && dy === 0) continue
            const tx = x + dx, ty = y + dy
            if (tx < 0 || tx >= WORLD_SIZE || ty < 0 || ty >= WORLD_SIZE) continue
            const target = tiles[ty][tx]
            if (target.type === 'food_patch' && target.foodAmount < TREE_APPLE_MAX_PER_TILE) {
              writeTile(ty, tx).foodAmount = Math.min(TREE_APPLE_MAX_PER_TILE, target.foodAmount + 4)
              break
            }
            if (target.type === 'grass' && Math.random() < 0.25) {
              const wt = writeTile(ty, tx)
              wt.type = 'food_patch'
              wt.foodAmount = 20
              break
            }
          }
        }
      }

      // Water replenishment — reads from working tile so it stacks with rain bonus above
      if (t.type === 'river') {
        const wt = writeTile(y, x)
        wt.waterLevel = Math.min(100, wt.waterLevel + WATER_REPLENISH_RATE)
      }

      // Winter flooding adjacent to river
      if (season === 'winter' && t.floodTimer > 0) {
        const wt = writeTile(y, x)
        wt.floodTimer -= 1
        if (wt.floodTimer === 0) wt.type = t.biome === 'wetland' ? 'mud' : 'grass'
      }

      // Death sites slowly fade — the world reclaims its dead.
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

      // Fire decay — burning tiles count down. When the timer hits 0,
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
          } else if (t.type === 'river') {
            wt.waterLevel = Math.max(0, t.waterLevel - 25)
          }
        }
      }
    }
  }

  // Fire spread — only checked when there's any burning. Cheap early exit.
  const anyBurning = tiles.some(row => row.some(t => (t.burning ?? 0) > 0))
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
          if ((adj.type === 'tree' || adj.type === 'shelter') && Math.random() < FIRE_SPREAD_CHANCE) {
            writeTile(ny, nx).burning = FIRE_DURATION_TICKS
          }
        }
      }
    }
  }

  // Auto-lightning — winter OR storm weather; storm raises probability 4×
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

  // Winter floods: occasionally flood grass tiles near river
  if (season === 'winter' && Math.random() < 0.002) {
    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        if (tiles[y][x].type === 'river') {
          const adj = [[0,1],[0,-1],[1,0],[-1,0]]
          for (const [dx, dy] of adj) {
            const nx = x + dx; const ny = y + dy
            if (nx >= 0 && nx < WORLD_SIZE && ny >= 0 && ny < WORLD_SIZE) {
              if (tiles[ny][nx].type === 'grass' || tiles[ny][nx].type === 'mud') {
                const wt = writeTile(ny, nx)
                wt.type = 'flooded'
                wt.floodTimer = 3 + Math.floor(Math.random() * 5)
              }
            }
          }
        }
      }
    }
  }

  return { ...state, tiles }
}

// ─── Creatures ────────────────────────────────────────────────────────────────

function tickCreatures(state: GameState, _tickRng: () => number, mods: SimModifiers): GameState {
  const creatures = { ...state.creatures }
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
  // Tool-as-answer tracking — updated when a question is generated this tick
  let nextAwaitingResponseUntil = state.caretaker.awaitingResponseUntil ?? 0
  let clearRespondedFlag = false

  // Pre-build alive array and tile index once — shared across all creature iterations.
  // Avoids O(n) Object.values + filter per creature and O(d²) tile scans in behavior.
  const aliveCreatures = Object.values(creatures).filter(c => c.diedOnDay === null)
  const aliveCount = aliveCreatures.length
  const tileIdx = buildTileIndex(srcTiles)

  for (const id in creatures) {
    const initialState = creatures[id].state
    let c = { ...creatures[id] }
    if (c.diedOnDay !== null) continue

    const creatureTile = state.tiles[c.y]?.[c.x]
    // Track biome for environmental visual adaptation
    if (creatureTile?.biome) c.dominantBiome = creatureTile.biome
    c = tickNeeds(c, state.time.season, creatureTile?.biome)

    // Night warmth spike — doubles effective warmth decay at night, forcing
    // creatures toward shelter/caves before conditions become critical.
    if (state.time.phase === 'night') {
      const extraDrain = state.time.season === 'winter' ? WARMTH_DECAY_WINTER : WARMTH_DECAY_BASE
      c.warmth = Math.max(0, c.warmth - extraDrain)
    }

    // Weather thirst correction — rain/storm reduces thirst pressure; drought increases it
    if (weather === 'rain' || weather === 'storm') {
      c.thirst = Math.max(0, c.thirst - THIRST_DECAY * RAIN_THIRST_REDUCTION)
    } else if (weather === 'drought') {
      c.thirst = Math.min(100, c.thirst + THIRST_DECAY * DROUGHT_THIRST_PENALTY)
    }

    // Awareness acceleration — caretaker actions near a creature boost sentience
    const lastActionX = state.caretaker.lastActionX ?? null
    const lastActionY = state.caretaker.lastActionY ?? null
    if (lastActionX !== null && lastActionY !== null
        && c.genome.mind !== 'Feral'
        && Date.now() - (state.caretaker.lastActionMs ?? 0) < CARETAKER_PRESENCE_WINDOW_MS
        && Math.abs(c.x - lastActionX) <= CARETAKER_PRESENCE_RADIUS
        && Math.abs(c.y - lastActionY) <= CARETAKER_PRESENCE_RADIUS) {
      c.sentience = Math.min(100, c.sentience + CARETAKER_SENTIENCE_BOOST * mods.sentienceGrowthMult)
    }

    // Disease drains health each tick while sick. Was previously absent —
    // 'sick' state was set but had no per-tick effect.
    if (c.state === 'sick') {
      c.health = Math.max(0, c.health - DISEASE_HEALTH_DRAIN)
    }

    const behaviorChanges = tickBehavior(c, tiles, creatures, state.time.season, aliveCreatures, tileIdx, state.enrichmentItems)
    c = { ...c, ...behaviorChanges }

    // Playing state — applies stress reduction and times out after PLAY_DURATION_TICKS
    if (c.state === 'playing') {
      c.stress = Math.max(0, c.stress - PLAY_STRESS_REDUCTION)
      if ((c.stateTimer ?? 0) >= PLAY_DURATION_TICKS) {
        c.state = 'idle'
        c.stateTimer = 0
      }
    }

    // Enrichment use — apply per-tick item effects with social/competitive context
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

    const movChanges = tickMovement(c, tiles)
    c = { ...c, ...movChanges }

    // At-tile resource consumption
    const currentTile = tiles[c.y]?.[c.x]
    if (currentTile) {
      // Eat when on food patch and hungry (state-independent)
      if (currentTile.type === 'food_patch' && currentTile.foodAmount > 0 && c.hunger > 15) {
        const before = c.hunger
        const result = eatFromTile(c, currentTile)
        c = result.creature
        if (!clonedTileRows[c.y]) { tiles[c.y] = srcTiles[c.y].slice(); clonedTileRows[c.y] = 1 }
        tiles[c.y][c.x] = result.tile
        if (c.state === 'seeking_food') c.state = 'idle'
        if (DEBUG) console.log(`[EAT] ${c.name} hunger ${before.toFixed(1)} → ${c.hunger.toFixed(1)} (tile food: ${tiles[c.y][c.x].foodAmount.toFixed(1)})`)
      }

      // Cave warmth — being inside a cave insulates against cold
      if (currentTile.type === 'cave') {
        c.warmth = Math.min(100, c.warmth + CAVE_WARMTH_BONUS)
        // Natural enrichment: cave safety calms stress
        c.stress = Math.max(0, c.stress - NATURAL_CAVE_STRESS_REDUCTION)
      }

      // Natural enrichment — world terrain as passive enrichment
      if (currentTile.type === 'river' || currentTile.type === 'mud') {
        c.stress = Math.max(0, c.stress - NATURAL_RIVER_STRESS_REDUCTION)
      }
      if (currentTile.type === 'tree' || currentTile.type === 'shelter') {
        c.stress = Math.max(0, c.stress - NATURAL_TREE_STRESS_REDUCTION)
      }
      if (currentTile.biome === 'rocky' && c.genome.mind === 'Sentinel') {
        c.sentience = Math.min(100, c.sentience + NATURAL_ROCKY_SENTINEL_BONUS)
      }

      // Auto-lightning strike damage — lightningFlash is set this same tick by
      // tickTiles, so checking < 2s means "struck this tick or the one before"
      if ((currentTile.lightningFlash ?? 0) > Date.now() - 2000) {
        c.health = Math.max(0, c.health - AUTO_LIGHTNING_DAMAGE)
        c.stress = Math.min(100, c.stress + 40)
        if (c.state !== 'dying') c.state = 'fleeing'
      }

      // Drink when on river tile and thirsty
      if (currentTile.type === 'river' && c.thirst > 15) {
        const before = c.thirst
        c = drinkFromTile(c, currentTile)
        if (c.state === 'seeking_water') c.state = 'idle'
        if (DEBUG) console.log(`[DRINK] ${c.name} thirst ${before.toFixed(1)} → ${c.thirst.toFixed(1)}`)
      }

      // Drink when adjacent to river tile (creature is standing next to water)
      if (currentTile.type !== 'river' && c.thirst > 15) {
        const adjacents = getAdjacentTiles(tiles, c.x, c.y)
        const nearRiver = adjacents.find(t => t.type === 'river')
        if (nearRiver) {
          const before = c.thirst
          c = drinkFromTile(c, nearRiver)
          if (c.state === 'seeking_water') c.state = 'idle'
          if (DEBUG) console.log(`[DRINK adj] ${c.name} thirst ${before.toFixed(1)} → ${c.thirst.toFixed(1)}`)
        }
      }

      // Warm up in shelter during winter
      if (c.state === 'seeking_shelter' && currentTile.shelter) {
        c.warmth = Math.min(100, c.warmth + 10)
        c.state = 'idle'
      }

      // Cannibalism — last-resort survival. Triggered when desperately
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

        // Stress nearby witnesses
        for (const witness of Object.values(creatures)) {
          if (witness.id === c.id || witness.diedOnDay !== null) continue
          if (Math.abs(witness.x - c.x) <= 3 && Math.abs(witness.y - c.y) <= 3) {
            creatures[witness.id] = {
              ...witness,
              stress: Math.min(100, witness.stress + CANNIBAL_WITNESS_STRESS),
            }
          }
        }

        if (state.time.day - lastMsgDay >= 1) {
          messages.push({
            id: uuid(),
            text: `${c.name} fed on the dead. the others looked away.`,
            stage: 1,
            creatureId: c.id,
            day: state.time.day,
            timestamp: Date.now(),
            read: false,
          })
          lastMsgDay = state.time.day
        }
      }

      // Fire damage — standing on a burning tile sears health and panics
      if ((currentTile.burning ?? 0) > 0) {
        c.health = Math.max(0, c.health - FIRE_TICK_DAMAGE)
        c.stress = Math.min(100, c.stress + 12)
        if (c.state !== 'fleeing' && c.state !== 'dying') {
          // Make them flee away from this tile
          const dx = c.x > WORLD_SIZE / 2 ? -1 : 1
          const dy = c.y > WORLD_SIZE / 2 ? -1 : 1
          c.state = 'fleeing'
          c.targetX = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + dx * 6))
          c.targetY = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + dy * 6))
        }
      }
    }

    // Crowding disease — large populations standing close together
    // occasionally fall sick. Self-regulating brake on overpopulation.
    if (aliveCount > DISEASE_POP_THRESHOLD
      && c.state !== 'sick'
      && c.health > 35) {
      // Count adjacent creatures (radius 1) cheaply
      let crowding = 0
      for (const other of Object.values(creatures)) {
        if (other.id === c.id || other.diedOnDay !== null) continue
        if (Math.abs(other.x - c.x) <= 1 && Math.abs(other.y - c.y) <= 1) {
          crowding++
          if (other.state === 'sick') crowding += 2  // proximity to sick = higher risk
          if (crowding >= 5) break
        }
      }
      const popPressure = (aliveCount - DISEASE_POP_THRESHOLD) / 30  // 0..ish
      if (crowding >= 3 && Math.random() < DISEASE_CONTACT_CHANCE * (1 + popPressure) * crowding) {
        c.state = 'sick'
        c.stateTimer = 0
        c.health = Math.max(15, c.health - 6)
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
      }

      messages.push(deathMessage(c, state.time.day))

      if (cause === 'starvation') {
        events.push(createEvent('death', [c.id], state.time.day, c.name + ' starved'))
      }

      for (const bond of c.bonds) {
        if (creatures[bond.targetId] && creatures[bond.targetId].diedOnDay === null) {
          creatures[bond.targetId] = {
            ...creatures[bond.targetId],
            state: 'mourning',
            stateTimer: 60,
            stress: Math.min(100, creatures[bond.targetId].stress + 30),
          }
        }
      }
    }

    // Sentience messages — stage-3 can be questions; responses acknowledge tool actions
    if (c.sentience > 20) {
      const respondedToQuestion = state.caretaker.respondedToQuestion ?? false
      const result = generateMessage(c, state.awarenessStage, state.time.day, lastMsgDay, respondedToQuestion, mods.awarenessMessageMult)
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

    // Bond formation with adjacent creatures + milestone emission.
    // Milestones (35, 70) only emit from the lower-id side of each pair to
    // avoid duplicate flipped messages. Stage is always 1 (mundane social
    // observation) regardless of colony awareness.
    const nearby = Object.values(creatures).filter(
      other => other.id !== c.id &&
      other.diedOnDay === null &&
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
      c.bonds = c.bonds.map(b =>
        b.targetId === other.id ? { ...b, strength: nextStrength } : b
      )

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
      }
    }

    // stateTimer maintenance — increments while state is unchanged so behaviors
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
        // State changed (not into mourning, which set its own timer) — reset
        c.stateTimer = 0
      }
    }

    // Bond list pruning — drop bonds to long-dead creatures and cap total size.
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
    ...state,
    creatures,
    tiles,
    messages: messages.slice(-200),
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
    if (canReproduce(c, state.time.season, popFactor)) {
      const bondedIds = c.bonds.filter(b => b.strength >= REPRODUCE_BOND_MIN_STRENGTH).map(b => b.targetId)
      const partner = bondedIds
        .map(id => creatures[id])
        .find(p => p && p.diedOnDay === null
          && p.genome.personality !== 'Aggressive'
          && !pairedThisTick.has(p.id)
          && Math.abs(p.x - c.x) <= 12 && Math.abs(p.y - c.y) <= 12)

      if (partner) {
        const offspring = createOffspring(c, partner, c.x, c.y, state.time.day, tickRng, state.modifiers?.mutationChance)
        newCreatures.push(offspring)

        creatures[c.id] = {
          ...creatures[c.id],
          offspringIds: [...creatures[c.id].offspringIds, offspring.id],
        }
        creatures[partner.id] = {
          ...creatures[partner.id],
          offspringIds: [...creatures[partner.id].offspringIds, offspring.id],
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
              text: `⚡ ${offspring.name} ${offspring.familyName} was born with altered ${traitNames}. the lineage shifts.`,
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
      const offspring = createAsexualOffspring(c, c.x, c.y, state.time.day, tickRng)
      newCreatures.push(offspring)
      creatures[c.id] = {
        ...creatures[c.id],
        offspringIds: [...creatures[c.id].offspringIds, offspring.id],
        // Division costs the parent — drops health and adds a hunger spike
        health: Math.max(40, creatures[c.id].health - 18),
        hunger: Math.min(100, creatures[c.id].hunger + 22),
      }
      pairedThisTick.add(c.id)
      totalCreaturesEver++
      totalGenerations = Math.max(totalGenerations, offspring.generation)
      checkBoneMemory(offspring, state, messages, lastMsgDay)
      if (DEBUG) console.log(`[BIRTH·asexual] ${offspring.name} (gen ${offspring.generation}) ← ${c.name}`)
    }
  }

  for (const o of newCreatures) {
    creatures[o.id] = o
  }

  return { ...state, creatures, totalCreaturesEver, totalGenerations, messages: messages.slice(-200) }
}

function checkBoneMemory(
  offspring: Creature,
  state: GameState,
  messages: ColonyMessage[],
  lastMsgDay: number
): void {
  if (Math.random() >= BONE_MEMORY_CHANCE) return
  for (let dy = -BONE_MEMORY_RADIUS; dy <= BONE_MEMORY_RADIUS; dy++) {
    for (let dx = -BONE_MEMORY_RADIUS; dx <= BONE_MEMORY_RADIUS; dx++) {
      const t = state.tiles[offspring.y + dy]?.[offspring.x + dx]
      if (t?.type === 'death_site') {
        if (state.time.day - lastMsgDay >= 1) {
          messages.push(boneMemoryMessage(offspring.name, state.time.day, offspring.id))
        }
        return
      }
    }
  }
}

// ─── Enrichment ──────────────────────────────────────────────────────────────

function tickEnrichment(state: GameState): GameState {
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
        // Active use — decrement usesRemaining (degradation)
        const usesLeft = (item.usesRemaining ?? item.maxUses ?? 40) - 1
        if (usesLeft <= 0) {
          // Item fully degraded — remove it; release creature from using_enrichment
          delete updatedItems[id]
          changed = true
          continue
        }
        updatedItems[id] = { ...item, totalUses: item.totalUses + 1, usesRemaining: usesLeft }
        item = updatedItems[id]
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
          // by simply claiming — the prior claimant will be released next tick)
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

// ─── Tribes ───────────────────────────────────────────────────────────────────

function tickTribes(state: GameState): GameState {
  return state
}

// ─── Caretaker ────────────────────────────────────────────────────────────────

function tickCaretaker(state: GameState): GameState {
  const now = Date.now()
  const caretaker = { ...state.caretaker }
  const msPerDay = 86_400_000

  if (now - caretaker.lastHealReset > msPerDay) {
    caretaker.healCharges = HEAL_CHARGES_PER_DAY
    caretaker.lastHealReset = now
  }

  if (caretaker.lastSeasonRedirect !== state.time.season) {
    caretaker.riverRedirectUsed = false
    caretaker.lastSeasonRedirect = state.time.season
  }

  return { ...state, caretaker }
}

// ─── Endgame ─────────────────────────────────────────────────────────────────

function checkEndgame(state: GameState, mods: SimModifiers): GameState {
  const alive = Object.values(state.creatures).filter(c => c.diedOnDay === null)

  if (alive.length === 0 && Object.keys(state.creatures).length > 0) {
    const fossils: ExtinctionRecord = {
      id: uuid(),
      extinctionDay: state.time.day,
      extinctionCause: state.totalDeaths > 10 && state.time.season === 'winter' ? 'drought' : 'neglect',
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

  const sentinelLineage = alive.filter(
    c => c.genome.mind === 'Sentinel' && c.generation >= 4
  )
  const ascensionThreshold = 80 + mods.ascensionThresholdOffset
  if (alive.length >= ascensionThreshold && sentinelLineage.length > 0 && state.endgame === null) {
    return {
      ...state,
      endgame: 'ascension',
      messages: [
        ...state.messages,
        {
          id: uuid(), text: ascensionMessage(),
          stage: 3 as const, creatureId: null,
          day: state.time.day, timestamp: Date.now(), read: false,
        }
      ]
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
    sickness: 'A creature is sick',
    drought: 'Drought warning',
    stranger: 'Unknown creature spotted',
    tree_needed: 'Colony needs shelter',
    creature_missing: 'A creature has not moved',
    food_low: 'Food running low',
    flood_warning: 'Flood risk rising',
    bond_formed: 'A bond formed',
    death: 'A creature has died',
    new_generation: 'New generation born',
    tribe_war: 'Tribes are at war',
    ascension_near: 'Something is shifting',
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
      { label: 'Redirect river', action: 'redirect_river' },
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
// idle is no longer a concern. The cap here is intentionally small — just
// enough to advance weather and day/night by a couple of minutes on genuine
// tab-close/reopen, without endangering the colony through a long drought.
const MAX_PASSIVE_TICKS = 120   // 2 real minutes of catch-up maximum

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
