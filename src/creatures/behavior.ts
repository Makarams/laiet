import {
  Creature, CreatureDrives, Tile, ThoughtSymbol, Season, WeatherState, EnrichmentItem, EnvContext
} from '@/types'
import { computeDormancy, RACE_PROFILES } from '@/engine/genetics'
import {
  HUNGER_DECAY, THIRST_DECAY, WARMTH_DECAY_BASE, WARMTH_DECAY_WINTER,
  STRESS_DECAY_BASE, HUNGER_CRITICAL, THIRST_CRITICAL, WARMTH_CRITICAL, STRESS_CRITICAL,
  COLD_HARDY_WARMTH_MULT, DROUGHT_TOUGH_HUNGER_MULT, HYDRO_FINS_THIRST_MULT,
  THICK_PELT_WARMTH_MULT, ROOT_EATER_HUNGER_MULT, RIDGE_ARMOR_DAMAGE_MULT,
  HUNGER_SEEK_THRESHOLD, THIRST_SEEK_THRESHOLD, WARMTH_SEEK_THRESHOLD,
  FOOD_EAT_AMOUNT,
  MOVE_SPEED_BY_BODY, REPRODUCE_RATE_BY_BODY, FIGHT_POWER_BY_BODY,
  SEASON_MODIFIERS, WORLD_SIZE, CREATURE_MATURITY_TICKS,
  TILE_MOVE_MODIFIER, BIOME_THIRST_EXTRA, REPRODUCE_BOND_MIN_STRENGTH,
  RECLUSE_CROWD_RADIUS, RECLUSE_CROWD_THRESHOLD,
  PLAY_TRIGGER_SATISFACTION, PLAY_PARTNER_RADIUS,
  ENRICHMENT_USE_RADIUS, ENRICHMENT_SEEK_RADIUS, ENRICHMENT_EFFECTS, ENRICHMENT_COOLDOWN_TICKS,
  HEALROOT_SEEK_HEALTH, HEALROOT_HEAL_PER_USE, HEALROOT_CONSUME_AMOUNT,
  EARLY_GEN_MAX, EARLY_GEN_COHESION_RADIUS,
  CROWD_DISPERSE_THRESHOLD, CROWD_DISPERSE_RADIUS,
  CROWD_DISPERSE_DISTANCE_MIN, CROWD_DISPERSE_DISTANCE_MAX,
  WEATHER_BREED_MULT,
  PUDDLE_MOVE_MODIFIER, PUDDLE_MOVE_THRESHOLD,
  HARVEST_TRIGGER_SATISFACTION, HARVEST_RADIUS, BUILD_TERRITORY_RADIUS,
  FOOD_SEEK_MIN_AMOUNT, FOOD_SEEK_FALLBACK_RADIUS, PUDDLE_DRINK_RADIUS,
} from '@/engine/constants'
import { findNearestTileOfType, findNearestInIndex, getTile, isTilePassable, TileTypeIndex } from '@/world/worldGen'
import { tickSentience, seedDrives } from './factory'
import { DRIVE_DRIFT_RATE } from '@/engine/constants'

// ─── Build terrain validation ────────────────────────────────────────────────

// Flat open ground that can accept a fence. Rivers, mountains, cliffs, trees,
// existing rock/cave/fence, healroot, and flooded tiles are all excluded.
function isValidBuildTile(tile: Tile): boolean {
  switch (tile.type) {
    case 'grass':
    case 'barren':
    case 'food_patch':
    case 'death_site':
    case 'bush':
      return true
    default:
      return false
  }
}

// Search outward from the territory claim center for the nearest valid build spot.
// Auto-reroutes past blocked tiles (river, tree, mountain, etc.) without the
// creature needing to know why those tiles are invalid.
function findNearestValidBuildSpot(
  claim: { x: number; y: number },
  tiles: Tile[][],
  radius: number
): { x: number; y: number } | null {
  let bestDist = Infinity
  let best: { x: number; y: number } | null = null
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const tx = claim.x + dx
      const ty = claim.y + dy
      if (tx < 0 || ty < 0 || tx >= WORLD_SIZE || ty >= WORLD_SIZE) continue
      const tile = tiles[ty]?.[tx]
      if (!tile || !isValidBuildTile(tile)) continue
      const dist = Math.abs(dx) + Math.abs(dy)
      if (dist < bestDist) { bestDist = dist; best = { x: tx, y: ty } }
    }
  }
  return best
}

// ─── Needs decay ─────────────────────────────────────────────────────────────

export function tickNeeds(creature: Creature, season: Season, biome?: string, weather?: WeatherState): Creature {
  const c = { ...creature }
  const isWinter = season === 'winter'
  const adaptations = c.genome.adaptations ?? []

  // Adaptation modifiers on base needs decay
  // thick_pelt stacks multiplicatively with cold_hardy for maximum insulation
  const warmthMult  = (adaptations.includes('cold_hardy') ? COLD_HARDY_WARMTH_MULT : 1.0)
    * (adaptations.includes('thick_pelt') ? THICK_PELT_WARMTH_MULT : 1.0)
  const rootEaterVeg = adaptations.includes('root_eater') && (biome === 'lush' || biome === 'temperate')
  const hungerMult  = (adaptations.includes('drought_tough') ? DROUGHT_TOUGH_HUNGER_MULT : 1.0)
    * (rootEaterVeg ? ROOT_EATER_HUNGER_MULT : 1.0)
  // hydro_fins reduces thirst on wetland and river tiles
  const thirstMult  = (adaptations.includes('hydro_fins') && (biome === 'wetland' || biome === 'river'))
    ? HYDRO_FINS_THIRST_MULT : 1.0

  c.hunger = Math.min(100, c.hunger + HUNGER_DECAY * hungerMult)
  // Biome thirst modifier: arid zones parch faster, wetlands are forgiving
  const biomeThirstExtra = BIOME_THIRST_EXTRA[biome ?? 'temperate'] ?? 0
  c.thirst = Math.min(100, c.thirst + (THIRST_DECAY + THIRST_DECAY * biomeThirstExtra) * thirstMult)
  c.warmth = Math.max(0, c.warmth - (isWinter ? WARMTH_DECAY_WINTER : WARMTH_DECAY_BASE) * warmthMult)
  c.sentience = tickSentience(c)

  // Dormancy: suppress personality-driven need penalties when the dominant allele
  // is environmentally mismatched and the recessive allele would be more adaptive.
  const needsEnv: EnvContext = { biome: biome ?? 'temperate', weather: weather ?? 'clear', season }
  const needsDormancy = computeDormancy(c.genome, needsEnv)

  c.needSatisfaction = computeNeedSatisfaction(c, needsDormancy)
  let stressDelta = c.needSatisfaction < 30 ? 0.5 : -STRESS_DECAY_BASE
  // Stoic halves stress accumulation; they stay calm under pressure
  if (c.genome.personality === 'Stoic' && !needsDormancy.personality) stressDelta = Math.min(0, stressDelta) * 0.5 + Math.max(0, stressDelta) * 0.5
  // Race-specific passive stress adjustment from RACE_PROFILES
  if (c.genome.race) {
    const sm = RACE_PROFILES[c.genome.race]?.stressModifier
    if (sm) stressDelta = Math.min(stressDelta, stressDelta + sm)
  }
  c.stress = Math.min(100, c.stress + stressDelta)

  // Health damage from critical stats
  let healthDamage = 0
  if (c.hunger > HUNGER_CRITICAL) healthDamage += (c.hunger - HUNGER_CRITICAL) * 0.05
  if (c.thirst > THIRST_CRITICAL) healthDamage += (c.thirst - THIRST_CRITICAL) * 0.08
  if (c.warmth < WARMTH_CRITICAL) healthDamage += (WARMTH_CRITICAL - c.warmth) * 0.04
  if (c.stress > STRESS_CRITICAL) healthDamage += 0.02

  c.health = Math.max(0, c.health - healthDamage)

  // Slow passive recovery when well-fed
  if (c.hunger < 30 && c.health < 100) {
    c.health = Math.min(100, c.health + 0.05)
  }

  c.age += 1

  // Drive drift: each tick, observed behavior nudges the relevant drive slightly.
  // A creature that keeps fighting slowly becomes more dominance-driven over years.
  // A creature that keeps bonding becomes more social. This is the core of emergent drift.
  {
    const d = c.drives ?? seedDrives(c.genome.personality, () => 0.5)
    const rate = DRIVE_DRIFT_RATE
    const upd: CreatureDrives = { ...d }
    if (c.state === 'fighting')                               upd.dominance   = Math.min(1, d.dominance   + rate * 3)
    if (c.state === 'wandering' || c.state === 'migrating')  upd.mobility    = Math.min(1, d.mobility    + rate * 2)
    if (c.state === 'bonding'   || c.state === 'grooming')   upd.sociality   = Math.min(1, d.sociality   + rate * 2)
    if (c.state === 'observing')                              upd.vigilance   = Math.min(1, d.vigilance   + rate * 2)
    if (c.state === 'seeking_food' || c.state === 'harvesting') upd.acquisitive = Math.min(1, d.acquisitive + rate * 2)
    if (c.state === 'mourning')                               upd.sociality   = Math.min(1, d.sociality   + rate)
    if (c.territoryClaim !== null)                            upd.dominance   = Math.min(1, d.dominance   + rate)
    // Counterdrift: drives not expressed slowly drift toward 0.3 (neutral)
    for (const key of Object.keys(upd) as (keyof CreatureDrives)[]) {
      if (upd[key] > 0.3) upd[key] = Math.max(0.3, upd[key] - rate * 0.3)
      else if (upd[key] < 0.3) upd[key] = Math.min(0.3, upd[key] + rate * 0.3)
    }
    c.drives = upd
  }

  // Thought symbol — live derivation from state every tick so it reflects
  // the creature's actual condition in real time, not on a 15-30 tick delay.
  // Timer stays at 20 while a meaningful thought is active (prevents flicker);
  // decays toward 0 when the state returns to content (content is suppressed
  // in the renderer, so the symbol just fades out naturally).
  const freshThought = pickThought(c)
  c.currentThought = freshThought
  c.thoughtTimer = freshThought !== 'content'
    ? 20
    : Math.max(0, (c.thoughtTimer ?? 0) - 1)

  return c
}

function computeNeedSatisfaction(c: Creature, dormancy?: { personality: boolean; mind: boolean }): number {
  const base = 100 - c.hunger * 0.3 - c.thirst * 0.3 - (100 - c.warmth) * 0.2 - c.stress * 0.2

  // Dormant personality: the expressed trait is genetically present but environmentally
  // suppressed — the creature falls back to baseline satisfaction without trait penalties.
  if (dormancy?.personality) return Math.max(0, Math.min(100, base))

  // Drive-weighted penalties: drives modulate how much each unmet need actually matters.
  // A creature with high dominance drive cares more about lacking territory;
  // one with high sociality drive suffers more from isolation. All penalties are
  // gradient-based — no binary on/off; discomfort ramps up with deficit depth.
  const drives = c.drives ?? seedDrives(c.genome.personality, () => 0.5)
  let traitPenalty = 0

  switch (c.genome.personality) {
    case 'Curious':
      // Restlessness grows gradually with idle time, scaled by curiosity drive
      traitPenalty = c.state === 'idle'
        ? Math.min(20, Math.max(0, c.stateTimer - 30) * 0.28 * (0.5 + drives.curiosity))
        : 0
      break
    case 'Timid':
      // Stress sensitivity: penalty ramps above threshold, scaled by vigilance drive
      traitPenalty = c.stress > 30 ? Math.min(25, (c.stress - 30) * 0.45 * (0.5 + drives.vigilance)) : 0
      break
    case 'Aggressive':
      // Territory deprivation: penalty rises with stress when unclaimed, dampened if low dominance
      traitPenalty = c.territoryClaim === null
        ? Math.min(15, c.stress * 0.18 * (0.4 + drives.dominance))
        : 0
      break
    case 'Lazy':
      break  // no drive-based penalty; laziness means low need pressure
    case 'Greedy':
      // Hunger pressure starts early, ramps steeply with acquisitive drive
      traitPenalty = c.hunger > 10 ? Math.min(15, (c.hunger - 10) * 0.22 * (0.5 + drives.acquisitive)) : 0
      break
    case 'Nurturing':
      // Isolation penalty: no bonds = full penalty; one bond halves it; two+ bonds = none
      traitPenalty = c.bonds.length === 0 ? 20 * (0.5 + drives.sociality * 0.5)
        : c.bonds.length === 1 ? 10 * (0.5 + drives.sociality * 0.5)
        : 0
      break
    case 'Wanderer':
      // Stasis penalty ramps with idle time, scaled by mobility drive
      traitPenalty = c.state === 'idle'
        ? Math.min(22, Math.max(0, c.stateTimer - 20) * 0.38 * (0.4 + drives.mobility))
        : 0
      break
    case 'Recluse':
      // Crowding discomfort: stress from proximity already captured; scale with reclusion drive
      traitPenalty = c.stress > 30 ? Math.min(20, (c.stress - 30) * 0.40 * (0.5 + drives.reclusion)) : 0
      break
    case 'Hoarder':
      // Resource anxiety: continuous gradient from even low hunger, heavy acquisitive weight
      traitPenalty = c.hunger > 5 ? Math.min(18, (c.hunger - 5) * 0.28 * (0.4 + drives.acquisitive)) : 0
      break
    case 'Empath':
      // Stress resonance: mirroring nearby stress, scaled by sociality drive
      traitPenalty = c.stress > 25 ? Math.min(12, (c.stress - 25) * 0.25 * (0.4 + drives.sociality)) : 0
      break
    case 'Furtive':
      // Exposure anxiety: stress from open ground, scaled by vigilance drive
      traitPenalty = c.stress > 20 ? Math.min(15, (c.stress - 20) * 0.28 * (0.4 + drives.vigilance)) : 0
      break
    case 'Territorial':
      // Groundlessness: penalty scales with dominance drive; active territory claim fully resolves it
      traitPenalty = c.territoryClaim === null
        ? Math.min(18, (c.stress * 0.20 + 4) * (0.4 + drives.dominance))
        : 0
      break
    case 'Social': {
      // Bond depth matters: no strong bonds = full penalty; one = partial; two+ = satisfied
      const strongBonds = c.bonds.filter(b => b.strength >= 25).length
      traitPenalty = strongBonds === 0 ? 20 * (0.5 + drives.sociality * 0.5)
        : strongBonds < 2 ? 8 * (0.5 + drives.sociality * 0.5)
        : 0
      break
    }
    case 'Stoic':
      traitPenalty = 0  // drives shape base stats; stoic is unbothered by deficits
      break
    case 'Scavenger':
      // Foraging drive is always-on; continuous gradient even at low hunger
      traitPenalty = c.hunger > 5 ? Math.min(12, (c.hunger - 5) * 0.18 * (0.4 + drives.acquisitive)) : 0
      break
    case 'Mimic':
      // Social mirror: needs someone to observe; one bond is enough
      traitPenalty = c.bonds.length === 0 ? 20 * (0.4 + drives.sociality * 0.6) : 0
      break
    case 'Nomadic':
      // Restlessness: ramps faster than Wanderer; mobility drive amplifies it
      traitPenalty = c.state === 'idle'
        ? Math.min(22, Math.max(0, c.stateTimer - 15) * 0.44 * (0.4 + drives.mobility))
        : 0
      break
    case 'Vigilant':
      // Threat sensitivity: low stress tolerance; vigilance drive amplifies cost
      traitPenalty = c.stress > 15 ? Math.min(15, (c.stress - 15) * 0.30 * (0.5 + drives.vigilance)) : 0
      break
    case 'Symbiotic':
      // Needs diverse bonds; two strong bonds = satisfied; one = partial
      {
        const sbonds = c.bonds.filter(b => b.strength >= 25).length
        traitPenalty = sbonds < 2 ? (sbonds === 0 ? 18 : 9) * (0.4 + drives.sociality * 0.6) : 0
      }
      break
  }

  return Math.max(0, Math.min(100, base - traitPenalty))
}

function pickThought(c: Creature): ThoughtSymbol {
  // Priority: medical emergency → combat → social/behavioral → needs → personality
  if (c.state === 'dying' || c.state === 'sick') return 'sick'
  if (c.state === 'fighting')                    return 'fighting'
  // Fleeing and low-health threat both signal distress — not a new symbol,
  // but 'stressed' (?) is the closest match for acute panic/escape.
  if (c.state === 'fleeing' || (c.health < 25 && c.stress > 55)) return 'stressed'
  if (c.state === 'mourning')                    return 'mourning'
  if (c.state === 'grooming')                    return 'grooming'
  if (c.state === 'harvesting' || c.state === 'building') return 'building'
  if (c.state === 'playing' || c.state === 'using_enrichment') return 'playing'
  // observing: Sentinel actively patrolling the boundary — show 'watching' only when in that state
  if (c.state === 'observing')                   return 'watching'
  if (c.state === 'dreaming')                    return 'dreaming'
  if (c.state === 'bonding')                     return 'bonding'
  if (c.carrying !== undefined)                  return 'carrying'
  // Recent mutation: brief flash on birth before need-states take over
  if (c.recentMutation !== undefined)            return 'mutated'
  // Need urgency — only fire when past the critical threshold, not baseline levels
  if (c.hunger > HUNGER_CRITICAL)                return 'hungry'
  if (c.thirst > THIRST_CRITICAL)                return 'thirsty'
  if (c.warmth < WARMTH_CRITICAL)                return 'cold'
  if (c.stress > 60)                             return 'stressed'
  // Curious expression only when actively exploring, not at rest
  if ((c.genome.personality === 'Curious' || c.genome.personality === 'Wanderer')
      && (c.state === 'wandering' || c.state === 'migrating')) return 'curious'
  return 'content'
}

// ─── Behavior / state machine ─────────────────────────────────────────────────

export function tickBehavior(
  creature: Creature,
  tiles: Tile[][],
  _allCreatures: Record<string, Creature>,
  season: Season,
  aliveCreatures: Creature[],       // pre-filtered alive array; avoids repeated Object.values
  tileIdx?: TileTypeIndex,          // pre-built index; avoids O(d²) tile scans
  enrichmentItems?: Record<string, EnrichmentItem>,
  weather?: WeatherState
): Partial<Creature> {
  const c = creature
  const changes: Partial<Creature> = {}

  // Dormancy: check if expressed personality/mind is suppressed by environmental mismatch.
  // Dormant traits don't drive behavioral decisions; the creature falls back to survival basics.
  const behavEnv: EnvContext = { biome: c.dominantBiome ?? 'temperate', weather: weather ?? 'clear', season }
  const dormancy = computeDormancy(c.genome, behavEnv)

  // Inline finder: uses index when available, falls back to BFS scan
  const findNearest = (types: Parameters<typeof findNearestTileOfType>[3], maxDist: number) =>
    tileIdx
      ? findNearestInIndex(tileIdx, tiles, c.x, c.y, types, maxDist)
      : findNearestTileOfType(tiles, c.x, c.y, types, maxDist)

  // ── Recluse crowding: only active when personality is expressed (not dormant) ──
  if (c.genome.personality === 'Recluse' && !dormancy.personality) {
    const crowd = aliveCreatures.filter(
      o => o.id !== c.id
        && Math.abs(o.x - c.x) <= RECLUSE_CROWD_RADIUS
        && Math.abs(o.y - c.y) <= RECLUSE_CROWD_RADIUS
    ).length
    changes.stress = crowd > RECLUSE_CROWD_THRESHOLD
      ? Math.min(100, c.stress + 0.8)
      : Math.max(0, c.stress - 0.2)
  }

  // ── 1. Dying ──
  if (c.health <= 0) {
    changes.state = 'dying'
    return changes
  }

  // ── 2. Sick ──
  if (c.health < 25 && c.state !== 'sick') {
    changes.state = 'sick'
    changes.stateTimer = 0
    return changes
  }

  // ── 2.1. Seeking healroot; sick creatures head toward medicine ──
  // Nurturing/healer creatures also seek healroot to carry to sick tribemates.
  if (c.health < HEALROOT_SEEK_HEALTH && c.state !== 'seeking_healroot') {
    const hrTile = findNearest(['healroot'], 30)
    if (hrTile && (hrTile.healrootAmount ?? 0) > 0) {
      changes.state = 'seeking_healroot'
      changes.targetX = hrTile.x
      changes.targetY = hrTile.y
      changes.currentThought = 'sick'
      changes.thoughtTimer = 20
      return changes
    }
  }

  // ── 2.5. Fear response; low-health or Timid creatures flee from threats ──
  // Triggers when health is critically low OR personality is Timid + stress is high.
  // Flees away from the centroid of nearby creatures toward map edges.
  const fearTrigger = (c.health < 28)
    || (c.genome.personality === 'Timid' && !dormancy.personality && c.stress > 65)
  if (fearTrigger && c.state !== 'fleeing') {
    const threats = aliveCreatures.filter(
      o => o.id !== c.id
        && Math.abs(o.x - c.x) <= 6 && Math.abs(o.y - c.y) <= 6
        && (o.genome.personality === 'Aggressive' || o.state === 'fighting' || o.state === 'scavenging'),
    )
    if (threats.length > 0) {
      const cx = threats.reduce((s, o) => s + o.x, 0) / threats.length
      const cy = threats.reduce((s, o) => s + o.y, 0) / threats.length
      const dx = Math.sign(c.x - cx) || (Math.random() < 0.5 ? -1 : 1)
      const dy = Math.sign(c.y - cy) || (Math.random() < 0.5 ? -1 : 1)
      changes.state = 'fleeing'
      changes.targetX = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + dx * 10))
      changes.targetY = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + dy * 10))
      return changes
    }
  }

  // ── 3. Critical survival (pre-emptive; seek before truly desperate) ──
  if (c.hunger > HUNGER_SEEK_THRESHOLD) {
    const effectiveHungerMin = (c.genome.race && RACE_PROFILES[c.genome.race]?.hungerThresholdOverride) ?? FOOD_SEEK_MIN_AMOUNT
    const foodTile = findNearest(['food_patch', 'bush'], 20)
    if (foodTile && foodTile.foodAmount > effectiveHungerMin) {
      changes.state = 'seeking_food'
      changes.targetX = foodTile.x
      changes.targetY = foodTile.y
      return changes
    }

    // Wider fallback before committing to migration — cheaper than crossing the map.
    // Bridges the gap between the 20-tile normal scan and hunger > 55 migration trigger.
    if (!foodTile || foodTile.foodAmount <= effectiveHungerMin) {
      const widerTile = findNearest(['food_patch', 'bush'], FOOD_SEEK_FALLBACK_RADIUS)
      if (widerTile && widerTile.foodAmount > FOOD_SEEK_MIN_AMOUNT) {
        changes.state = 'seeking_food'
        changes.targetX = widerTile.x
        changes.targetY = widerTile.y
        return changes
      }
    }

    // No food found locally; migrate. Pick a distant spot to scout.
    // Larger distance ensures starvation actually breaks the cluster,
    // rather than shuffling creatures within the same depleted area.
    if (c.hunger > 55) {
      const tx = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + (Math.random() < 0.5 ? -1 : 1) * (25 + Math.floor(Math.random() * 25))))
      const ty = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + (Math.random() < 0.5 ? -1 : 1) * (25 + Math.floor(Math.random() * 25))))
      changes.state = 'migrating'
      changes.targetX = tx
      changes.targetY = ty
      return changes
    }

    // Last resort; head for the nearest fresh corpse. Cannibalism only
    // triggers if the creature is desperately hungry (handled at the tile
    // contact point in tick.ts). Here we just route them to it.
    if (c.hunger > 70) {
      const corpse = findNearest(['death_site'], 22)
      if (corpse) {
        changes.state = 'scavenging'
        changes.targetX = corpse.x
        changes.targetY = corpse.y
        return changes
      }
    }
  }

  if (c.thirst > THIRST_SEEK_THRESHOLD) {
    // Check for puddle/mud tiles first — closer water that's already available.
    // Puddle drinking happens at tile level in tick.ts; here we just direct the creature toward it.
    const puddleTile = findNearest(['mud'], PUDDLE_DRINK_RADIUS)
    if (puddleTile) {
      changes.state = 'seeking_water'
      changes.targetX = puddleTile.x
      changes.targetY = puddleTile.y
      return changes
    }
    const waterRadius = (c.genome.race && RACE_PROFILES[c.genome.race]?.waterSeekRadiusOverride) ?? 24
    const waterTile = findNearest(['river'], waterRadius)
    if (waterTile) {
      changes.state = 'seeking_water'
      changes.targetX = waterTile.x
      changes.targetY = waterTile.y
      return changes
    }
  }

  if (c.warmth < WARMTH_SEEK_THRESHOLD && season === 'winter') {
    // Caves are preferred over trees; warmer and more reliable
    const caveTile = findNearest(['cave'], 18)
    const shelterTile = caveTile ?? findNearest(['tree', 'shelter'], 12)
    if (shelterTile) {
      changes.state = 'seeking_shelter'
      changes.targetX = shelterTile.x
      changes.targetY = shelterTile.y
      return changes
    }
  }

  // Storm shelter-seeking; exposed creatures flee to caves during storms before warmth crises
  if (weather === 'storm' && c.warmth < WARMTH_SEEK_THRESHOLD + 10) {
    const caveTile = findNearest(['cave'], 18)
    if (caveTile) {
      changes.state = 'seeking_shelter'
      changes.targetX = caveTile.x
      changes.targetY = caveTile.y
      return changes
    }
  }

  // ── 4. Mind-specific behaviors ──
  if (c.genome.mind === 'Dreaming' && Math.random() < 0.018) {
    const dreamTile = findNearest(['river', 'death_site'], 20)
    if (dreamTile) {
      changes.state = 'dreaming'
      changes.targetX = dreamTile.x
      changes.targetY = dreamTile.y
    }
  }

  if (c.genome.mind === 'Sentinel' && c.state !== 'observing' && Math.random() < 0.010) {
    // Patrol the colony's actual perimeter: centroid + current spread radius.
    // This means Sentinels walk the boundary of WHERE THE COLONY ACTUALLY IS,
    // not a hardcoded world-edge that may be empty.
    if (aliveCreatures.length > 0) {
      const cx = Math.round(aliveCreatures.reduce((s, o) => s + o.x, 0) / aliveCreatures.length)
      const cy = Math.round(aliveCreatures.reduce((s, o) => s + o.y, 0) / aliveCreatures.length)
      // Spread = RMS distance from centroid; minimum 12 so there's always a perimeter
      const spread = Math.max(12, Math.sqrt(
        aliveCreatures.reduce((s, o) => s + (o.x - cx) ** 2 + (o.y - cy) ** 2, 0) / aliveCreatures.length
      ))
      const angle = Math.random() * Math.PI * 2
      const patrolRadius = spread * (0.8 + Math.random() * 0.5)
      const tx = Math.max(2, Math.min(WORLD_SIZE - 3, Math.round(cx + Math.cos(angle) * patrolRadius)))
      const ty = Math.max(2, Math.min(WORLD_SIZE - 3, Math.round(cy + Math.sin(angle) * patrolRadius)))
      const destTile = tiles[ty]?.[tx]
      if (destTile && isTilePassable(destTile)) {
        changes.state = 'observing'
        changes.targetX = tx
        changes.targetY = ty
      }
    }
  }

  // ── 4.8. Role-driven behaviors — role shapes what a creature actually does ──
  // Roles earned from behavioral history now feed back into future behavior,
  // creating a self-reinforcing loop: a guardian patrols and fights, which keeps
  // them a guardian; a healer seeks the sick, which deepens their bonds and role.
  // This is the bridge that was missing: roles were labels, now they drive action.
  {
    const role = c.role
    if (role && c.health > 35) {
      switch (role) {
        case 'guardian': {
          // Guardians actively patrol the colony's perimeter and intercept threats
          if (Math.random() < 0.08 && c.territoryClaim) {
            const intruder = aliveCreatures.find(
              o => o.id !== c.id
                && o.lineageId !== c.lineageId
                && Math.abs(o.x - c.territoryClaim!.x) <= 8
                && Math.abs(o.y - c.territoryClaim!.y) <= 8
            )
            if (intruder) {
              changes.state = 'fighting'
              changes.targetX = intruder.x
              changes.targetY = intruder.y
            }
          }
          // Rally toward any bonded ally who is fighting
          if (!changes.state && Math.random() < 0.12) {
            const fightingAlly = aliveCreatures.find(
              o => o.id !== c.id
                && o.state === 'fighting'
                && c.bonds.some(b => b.targetId === o.id && b.strength > 20)
                && Math.abs(o.x - c.x) <= 20 && Math.abs(o.y - c.y) <= 20
            )
            if (fightingAlly) {
              changes.state = 'fighting'
              changes.targetX = fightingAlly.x
              changes.targetY = fightingAlly.y
            }
          }
          break
        }

        case 'healer': {
          // Healers actively seek sick or injured tribemates and move to groom them
          if (Math.random() < 0.10) {
            const patient = aliveCreatures.find(
              o => o.id !== c.id
                && (o.state === 'sick' || o.health < 45 || o.stress > 70)
                && Math.abs(o.x - c.x) <= 18 && Math.abs(o.y - c.y) <= 18
            )
            if (patient) {
              changes.state = c.carrying === 'healroot' ? 'bonding' : 'grooming'
              changes.targetX = patient.x
              changes.targetY = patient.y
            }
          }
          // Carry healroot to sick creatures if nearby
          if (!changes.state && !c.carrying && Math.random() < 0.06) {
            const hrTile = findNearest(['healroot'], 14)
            if (hrTile && (hrTile.healrootAmount ?? 0) > 10) {
              changes.state = 'seeking_healroot'
              changes.targetX = hrTile.x
              changes.targetY = hrTile.y
            }
          }
          break
        }

        case 'forager': {
          // Foragers pre-emptively seek food and share by carrying fruit to bonded creatures
          if (!c.carrying && c.hunger < 50 && Math.random() < 0.07) {
            const richPatch = findNearest(['food_patch', 'bush'], 24)
            if (richPatch && richPatch.foodAmount > 40) {
              changes.state = 'seeking_food'
              changes.targetX = richPatch.x
              changes.targetY = richPatch.y
            }
          }
          // Carry fruit to a bonded hungry partner
          if (c.carrying === 'fruit' && c.carryingTargetId && Math.random() < 0.12) {
            const target = aliveCreatures.find(o => o.id === c.carryingTargetId)
            if (target) {
              changes.state = 'bonding'
              changes.targetX = target.x
              changes.targetY = target.y
            }
          } else if (!c.carrying && Math.random() < 0.04) {
            // Find a hungry bonded creature to bring food to
            const hungryBonded = aliveCreatures.find(
              o => o.id !== c.id && o.hunger > 60
                && c.bonds.some(b => b.targetId === o.id && b.strength > 30)
                && Math.abs(o.x - c.x) <= 20 && Math.abs(o.y - c.y) <= 20
            )
            if (hungryBonded) {
              changes.carryingTargetId = hungryBonded.id
            }
          }
          break
        }

        case 'scout': {
          // Scouts range further and return with territory knowledge
          if (Math.random() < 0.05) {
            const farDist = 35 + Math.floor(Math.random() * 30)
            const angle = Math.random() * Math.PI * 2
            const tx = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(c.x + Math.cos(angle) * farDist)))
            const ty = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(c.y + Math.sin(angle) * farDist)))
            const destTile = tiles[ty]?.[tx]
            if (destTile && isTilePassable(destTile)) {
              changes.state = 'migrating'
              changes.targetX = tx
              changes.targetY = ty
            }
          }
          break
        }

        case 'nurturer': {
          // Nurturers move toward offspring or juveniles and groom them
          if (Math.random() < 0.08) {
            const juvenile = aliveCreatures.find(
              o => o.id !== c.id && o.age < 15
                && Math.abs(o.x - c.x) <= 16 && Math.abs(o.y - c.y) <= 16
            )
            if (juvenile) {
              changes.state = 'bonding'
              changes.targetX = juvenile.x
              changes.targetY = juvenile.y
            }
          }
          break
        }

        case 'shaman': {
          // Shamans seek death sites and rivers to dream; they also initiate speech near elders
          if (Math.random() < 0.025) {
            const sacredTile = findNearest(['death_site', 'river'], 22)
            if (sacredTile) {
              changes.state = 'dreaming'
              changes.targetX = sacredTile.x
              changes.targetY = sacredTile.y
            }
          }
          break
        }

        case 'elder': {
          // Elders move slowly toward younger creatures and groom/teach (socialise)
          if (Math.random() < 0.04) {
            const youngCreature = aliveCreatures.find(
              o => o.id !== c.id && o.generation > c.generation
                && Math.abs(o.x - c.x) <= 12 && Math.abs(o.y - c.y) <= 12
            )
            if (youngCreature) {
              changes.state = 'grooming'
              changes.targetX = youngCreature.x
              changes.targetY = youngCreature.y
            }
          }
          break
        }

        // recluse: no additional behavior; isolation already handled in personality section
        default:
          break
      }
    }
  }

  // ── 5. Personality-driven behaviors ──
  let targetSet = changes.targetX !== undefined

  // ── 4.5. Group defense; bonded allies rally toward partners under attack ──
  // Creates emergent pack loyalty: when a bonded creature is fighting, others move to help.
  if (!targetSet
      && c.health > 45
      && c.genome.personality !== 'Timid'
      && c.genome.personality !== 'Recluse'
      && Math.random() < 0.06) {
    let fightingAlly: Creature | undefined
    for (const bond of c.bonds.filter(b => b.strength > 35)) {
      const ally = aliveCreatures.find(o => o.id === bond.targetId)
      if (ally && ally.state === 'fighting'
          && Math.abs(ally.x - c.x) <= 12 && Math.abs(ally.y - c.y) <= 12) {
        fightingAlly = ally
        break
      }
    }
    if (fightingAlly) {
      changes.state = 'bonding'
      changes.targetX = fightingAlly.x
      changes.targetY = fightingAlly.y
      targetSet = true
    }
  }

  switch (c.genome.personality) {
    case 'Curious':
      // Explores within a bounded range; curious, not migrating across the world
      if (!targetSet && (c.targetX === null || Math.random() < 0.025)) {
        const range = c.generation <= EARLY_GEN_MAX ? 12 : 30
        for (let attempt = 0; attempt < 6; attempt++) {
          const tx = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + Math.floor(Math.random() * (range * 2 + 1)) - range))
          const ty = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + Math.floor(Math.random() * (range * 2 + 1)) - range))
          const dest = tiles[ty]?.[tx]
          if (dest && isTilePassable(dest)) {
            changes.state = 'wandering'
            changes.targetX = tx
            changes.targetY = ty
            targetSet = true
            break
          }
        }
      }
      break

    case 'Aggressive':
      if (!c.territoryClaim && Math.random() < 0.025) {
        const claimTile = tiles[c.y]?.[c.x]
        if (claimTile && (claimTile.type === 'food_patch' || claimTile.type === 'bush'
            || claimTile.type === 'river' || claimTile.type === 'grass' || claimTile.type === 'barren')) {
          changes.territoryClaim = { x: c.x, y: c.y }
        }
      }
      // Defend territory from rival lineages
      if (!targetSet && c.territoryClaim && Math.random() < 0.10) {
        const intruder = aliveCreatures.find(
          o => o.id !== c.id
            && o.lineageId !== c.lineageId
            && Math.abs(o.x - c.territoryClaim!.x) <= 5
            && Math.abs(o.y - c.territoryClaim!.y) <= 5
        )
        if (intruder) {
          changes.state = 'fighting'
          changes.targetX = intruder.x
          changes.targetY = intruder.y
          targetSet = true
        }
      }
      // Pursue rival Aggressives from different lineages
      if (!targetSet && Math.random() < 0.05) {
        const rival = aliveCreatures.find(
          o => o.id !== c.id
            && o.lineageId !== c.lineageId
            && o.genome.personality === 'Aggressive'
            && Math.abs(o.x - c.x) <= 14 && Math.abs(o.y - c.y) <= 14
        )
        if (rival) {
          changes.state = 'fighting'
          changes.targetX = rival.x
          changes.targetY = rival.y
          targetSet = true
        }
      }
      // Wander within a personal zone
      if (!targetSet && c.targetX === null && Math.random() < 0.15) {
        const range = 6
        for (let attempt = 0; attempt < 5; attempt++) {
          const tx = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + Math.floor(Math.random() * (range * 2 + 1)) - range))
          const ty = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + Math.floor(Math.random() * (range * 2 + 1)) - range))
          if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
            changes.state = 'wandering'
            changes.targetX = tx
            changes.targetY = ty
            targetSet = true
            break
          }
        }
      }
      break

    case 'Nurturing': {
      // Seek out sick, young, or injured creatures to bond with
      const needyCreature = aliveCreatures.find(
        other => other.id !== c.id &&
          (other.state === 'sick' || other.age < 8 || other.health < 45)
      )
      if (needyCreature && !targetSet && Math.random() < 0.04) {
        changes.state = 'bonding'
        changes.targetX = needyCreature.x
        changes.targetY = needyCreature.y
        targetSet = true
      }
      break
    }

    case 'Greedy':
      // Pre-emptively seek food even when not that hungry
      if (!targetSet && c.hunger > 30 && Math.random() < 0.06) {
        const foodTile = findNearest(['food_patch', 'bush'], 10)
        if (foodTile && foodTile.foodAmount > 20) {
          changes.state = 'seeking_food'
          changes.targetX = foodTile.x
          changes.targetY = foodTile.y
          targetSet = true
        }
      }
      break

    case 'Timid':
      // Seek bush cover when stressed; concealment calms Timid creatures
      if (!targetSet && c.stress > 40 && Math.random() < 0.08) {
        const bushTile = findNearest(['bush'], 12)
        if (bushTile) {
          changes.state = 'seeking_shelter'
          changes.targetX = bushTile.x
          changes.targetY = bushTile.y
          targetSet = true
        }
      }
      break

    case 'Lazy':
      // Drift toward nearest food patch; barely moves otherwise
      if (!targetSet && c.targetX === null && Math.random() < 0.04) {
        const foodTile = findNearest(['food_patch', 'bush'], 8)
        if (foodTile) {
          changes.state = 'wandering'
          changes.targetX = foodTile.x
          changes.targetY = foodTile.y
          targetSet = true
        }
      }
      break

    case 'Wanderer':
      // Constantly on the move; picks distant destinations across the whole map
      if (!targetSet && (c.targetX === null || Math.random() < 0.03)) {
        const dist = 20 + Math.floor(Math.random() * 30)
        const angle = Math.random() * Math.PI * 2
        const tx = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(c.x + Math.cos(angle) * dist)))
        const ty = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(c.y + Math.sin(angle) * dist)))
        changes.state = 'migrating'
        changes.targetX = tx
        changes.targetY = ty
        targetSet = true
      }
      break

    case 'Recluse':
      // Actively disperses away from clusters; a natural colony spreader
      if (!targetSet && Math.random() < 0.12) {
        const crowdNearby = aliveCreatures.filter(
          o => o.id !== c.id
            && Math.abs(o.x - c.x) <= RECLUSE_CROWD_RADIUS
            && Math.abs(o.y - c.y) <= RECLUSE_CROWD_RADIUS
        )
        if (crowdNearby.length > RECLUSE_CROWD_THRESHOLD) {
          const cx = crowdNearby.reduce((s, o) => s + o.x, 0) / crowdNearby.length
          const cy = crowdNearby.reduce((s, o) => s + o.y, 0) / crowdNearby.length
          const dx = Math.sign(c.x - cx) || (Math.random() < 0.5 ? -1 : 1)
          const dy = Math.sign(c.y - cy) || (Math.random() < 0.5 ? -1 : 1)
          const dist = 14 + Math.floor(Math.random() * 12)
          changes.state = 'wandering'
          changes.targetX = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + dx * dist))
          changes.targetY = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + dy * dist))
          targetSet = true
        } else if (c.targetX === null && Math.random() < 0.4) {
          // When alone, wanders freely in a moderate range
          const range = 14
          for (let attempt = 0; attempt < 5; attempt++) {
            const tx = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + Math.floor(Math.random() * (range * 2 + 1)) - range))
            const ty = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + Math.floor(Math.random() * (range * 2 + 1)) - range))
            if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
              changes.state = 'wandering'
              changes.targetX = tx
              changes.targetY = ty
              targetSet = true
              break
            }
          }
        }
      }
      break

    case 'Hoarder':
      // Pre-emptively seek food at all times; stays near the richest patches
      if (!targetSet && c.hunger > 15 && Math.random() < 0.09) {
        const foodTile = findNearest(['food_patch', 'bush'], 12)
        if (foodTile && foodTile.foodAmount > 15) {
          changes.state = 'seeking_food'
          changes.targetX = foodTile.x
          changes.targetY = foodTile.y
          targetSet = true
        }
      }
      // Wanders within a close range; reluctant to leave their stash area
      if (!targetSet && c.targetX === null && Math.random() < 0.05) {
        const range = 6
        for (let attempt = 0; attempt < 5; attempt++) {
          const tx = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + Math.floor(Math.random() * (range * 2 + 1)) - range))
          const ty = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + Math.floor(Math.random() * (range * 2 + 1)) - range))
          if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
            changes.state = 'wandering'
            changes.targetX = tx
            changes.targetY = ty
            targetSet = true
            break
          }
        }
      }
      break

    case 'Empath': {
      // Seeks out stressed or sick creatures and moves toward them
      const stressedPeer = aliveCreatures.find(
        o => o.id !== c.id && (o.stress > 60 || o.state === 'sick')
          && Math.abs(o.x - c.x) <= 14 && Math.abs(o.y - c.y) <= 14
      )
      if (!targetSet && stressedPeer && Math.random() < 0.07) {
        changes.state = 'bonding'
        changes.targetX = stressedPeer.x
        changes.targetY = stressedPeer.y
        targetSet = true
      }
      break
    }

    case 'Furtive':
      // Avoids open ground; seeks concealment tiles (bush, tree, cave)
      if (!targetSet && Math.random() < 0.10) {
        const hideTile = findNearest(['bush', 'tree', 'shelter', 'cave'], 10)
        if (hideTile) {
          changes.state = 'wandering'
          changes.targetX = hideTile.x
          changes.targetY = hideTile.y
          targetSet = true
        }
      }
      break

    case 'Territorial':
      // Claim food or resource tiles; defend with aggression like Aggressive but narrower
      if (!c.territoryClaim && Math.random() < 0.030) {
        const here = tiles[c.y]?.[c.x]
        if (here && (here.type === 'food_patch' || here.type === 'bush'
            || here.type === 'river' || here.type === 'grass' || here.type === 'barren')) {
          changes.territoryClaim = { x: c.x, y: c.y }
        }
      }
      // Patrol their claimed tile; chase off non-bonded intruders
      if (!targetSet && c.territoryClaim && Math.random() < 0.08) {
        const intruder = aliveCreatures.find(
          o => o.id !== c.id
            && Math.abs(o.x - c.territoryClaim!.x) <= 4
            && Math.abs(o.y - c.territoryClaim!.y) <= 4
            && !c.bonds.some(b => b.targetId === o.id && b.strength >= 20)
        )
        if (intruder) {
          changes.state = 'fighting'
          changes.targetX = intruder.x
          changes.targetY = intruder.y
          targetSet = true
        }
      }
      // Return to claim zone when drifting away
      if (!targetSet && c.territoryClaim) {
        const dx = Math.abs(c.x - c.territoryClaim.x)
        const dy = Math.abs(c.y - c.territoryClaim.y)
        if (dx + dy > 6 && Math.random() < 0.06) {
          changes.state = 'wandering'
          changes.targetX = c.territoryClaim.x
          changes.targetY = c.territoryClaim.y
          targetSet = true
        }
      }
      break

    case 'Social': {
      // Maximises bonds; actively seeks any creature to be near
      const anyPeer = aliveCreatures.find(
        o => o.id !== c.id
          && Math.abs(o.x - c.x) <= 14 && Math.abs(o.y - c.y) <= 14
      )
      if (!targetSet && anyPeer && Math.random() < 0.09) {
        changes.state = 'bonding'
        changes.targetX = anyPeer.x
        changes.targetY = anyPeer.y
        targetSet = true
      }
      break
    }

    case 'Stoic':
      // Low displacement; steady moderate wander with no panic or rush
      if (!targetSet && c.targetX === null && Math.random() < 0.05) {
        const range = 10
        for (let attempt = 0; attempt < 5; attempt++) {
          const tx = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + Math.floor(Math.random() * (range * 2 + 1)) - range))
          const ty = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + Math.floor(Math.random() * (range * 2 + 1)) - range))
          if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
            changes.state = 'wandering'
            changes.targetX = tx
            changes.targetY = ty
            targetSet = true
            break
          }
        }
      }
      break

    case 'Scavenger':
      // Seeks death sites and food patches regardless of hunger; always foraging
      if (!targetSet && Math.random() < 0.08) {
        const deathTile = findNearest(['death_site'], 15)
        const foodTile  = findNearest(['food_patch', 'bush'], 20)
        const scavTarget = deathTile || foodTile
        if (scavTarget) {
          changes.state = 'wandering'
          changes.targetX = scavTarget.x
          changes.targetY = scavTarget.y
          targetSet = true
        }
      }
      break

    case 'Mimic':
      // Follows and mirrors strongest-bonded partner
      if (!targetSet && c.bonds.length > 0 && Math.random() < 0.10) {
        const partner = aliveCreatures.find(o => o.id === c.bonds[0].targetId && !o.diedOnDay)
        if (partner && Math.abs(partner.x - c.x) + Math.abs(partner.y - c.y) > 3) {
          const jitter = 2
          const tx = Math.max(0, Math.min(WORLD_SIZE - 1,
            partner.x + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter))
          const ty = Math.max(0, Math.min(WORLD_SIZE - 1,
            partner.y + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter))
          if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
            changes.state = 'wandering'
            changes.targetX = tx
            changes.targetY = ty
            targetSet = true
          }
        }
      }
      break

    case 'Nomadic':
      // Extreme long-range displacement; resets target often; natural colony spreader
      if (!targetSet && (c.targetX === null || Math.random() < 0.06)) {
        const dist = 35 + Math.floor(Math.random() * 40)
        const angle = Math.random() * Math.PI * 2
        const tx = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(c.x + Math.cos(angle) * dist)))
        const ty = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(c.y + Math.sin(angle) * dist)))
        if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
          changes.state = 'wandering'
          changes.targetX = tx
          changes.targetY = ty
          targetSet = true
        }
      }
      break

    case 'Vigilant':
      // Arc patrols; raises alert stress in bonded peers when threat is near
      if (!targetSet && Math.random() < 0.07) {
        const angle = Math.random() * Math.PI * 2
        const dist  = 8 + Math.floor(Math.random() * 12)
        const tx = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(c.x + Math.cos(angle) * dist)))
        const ty = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(c.y + Math.sin(angle) * dist)))
        if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
          changes.state = 'wandering'
          changes.targetX = tx
          changes.targetY = ty
          targetSet = true
        }
      }
      break

    case 'Symbiotic':
      // Actively seeks creatures from a different lineage root
      if (!targetSet && Math.random() < 0.08) {
        const myRoot = c.lineageId.includes('_') ? c.lineageId.split('_')[0] : c.lineageId
        const crossPartner = aliveCreatures.find(o =>
          o.id !== c.id
          && Math.abs(o.x - c.x) <= 25 && Math.abs(o.y - c.y) <= 25
          && (o.lineageId.includes('_') ? o.lineageId.split('_')[0] : o.lineageId) !== myRoot
        )
        if (crossPartner) {
          const jitter = 3
          const tx = Math.max(0, Math.min(WORLD_SIZE - 1,
            crossPartner.x + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter))
          const ty = Math.max(0, Math.min(WORLD_SIZE - 1,
            crossPartner.y + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter))
          if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
            changes.state = 'wandering'
            changes.targetX = tx
            changes.targetY = ty
            targetSet = true
          }
        }
      }
      break
  }

  // ── 5.4. Harvesting & construction; Territorial/Aggressive creatures build fences ──
  // Only triggers when needs are satisfied — building is an expression of security,
  // not a survival response. Requires an active territory claim.
  if (!targetSet
      && (c.genome.personality === 'Territorial' || c.genome.personality === 'Aggressive')
      && c.territoryClaim !== null
      && c.needSatisfaction >= HARVEST_TRIGGER_SATISFACTION
      && c.hunger < 45
      && c.health > 50
      && c.state !== 'harvesting'
      && c.state !== 'building') {

    if (!c.carrying) {
      // Phase 1: find a nearby resource to harvest (tree → wood, rock → stone)
      const resourceTile = findNearest(['tree', 'shelter', 'rock', 'cave'], HARVEST_RADIUS)
      if (resourceTile && Math.random() < 0.10) {
        changes.state = 'harvesting'
        changes.targetX = resourceTile.x
        changes.targetY = resourceTile.y
        changes.currentThought = 'building'
        changes.thoughtTimer = 30
        targetSet = true
      }
    } else if (c.carrying === 'wood' || c.carrying === 'stone') {
      // Phase 2: find a valid build location near territory claim
      const buildSpot = findNearestValidBuildSpot(c.territoryClaim, tiles, BUILD_TERRITORY_RADIUS)
      if (buildSpot) {
        changes.state = 'building'
        changes.targetX = buildSpot.x
        changes.targetY = buildSpot.y
        changes.currentThought = 'building'
        changes.thoughtTimer = 30
        targetSet = true
      } else {
        // No valid build spot — drop the material and stop trying this tick
        changes.carrying = undefined
      }
    }
  }

  // ── 5.5. Terrain preference — learned, not random ──────────────────────────
  // Each creature tracks how satisfying each tile type has been for its needs.
  // Positive preference → more likely to seek that type when needs are low.
  // Negative → actively avoids (unless desperate).
  // This replaces the flat 7% random nudge with a feedback loop that compounds.
  if (!targetSet) {
    const memory = c.terrainMemory ?? {}
    const myTile = tiles[c.y]?.[c.x]

    // Update terrain memory based on current tile outcomes
    if (myTile) {
      const tileType = myTile.type
      // Satisfaction signal: did this tile meet the creature's current dominant need?
      let satisfaction = 0
      if ((tileType === 'food_patch' || tileType === 'bush') && c.hunger > 40 && myTile.foodAmount > 10) satisfaction = 1.5
      if ((tileType === 'river' || tileType === 'mud') && c.thirst > 40 && myTile.waterLevel > 10) satisfaction = 1.5
      if ((tileType === 'cave' || tileType === 'shelter') && c.warmth < 40) satisfaction = 1.5
      if (satisfaction === 0 && c.hunger < 30 && c.thirst < 30 && c.warmth > 50) satisfaction = 0.3  // tile is fine

      // Pull toward preferred type based on body-type baseline + learned history
      const bodyBasePrefs: Partial<Record<string, string[]>> = {
        Wisp:  ['river', 'mud'],
        Shell: ['cave', 'shelter'],
        Spore: ['food_patch', 'bush', 'mud'],
        Spike: ['barren', 'rock'],
      }
      const basePrefTypes = bodyBasePrefs[c.genome.body] ?? []

      // Reinforce presence on preferred tile types; degrade when depleted
      for (const prefType of basePrefTypes) {
        const prev = memory[prefType] ?? 0
        if (tileType === prefType) {
          const updated = { ...memory, [prefType]: Math.min(10, prev + (satisfaction > 0 ? 0.3 : -0.1)) }
          changes.terrainMemory = updated
        }
      }

      // Negative reinforcement: preferred tile with no resources degrades preference
      if (basePrefTypes.includes(tileType) && satisfaction === 0 && c.hunger > 50) {
        const updated = { ...(changes.terrainMemory ?? memory), [tileType]: Math.max(-5, (memory[tileType] ?? 0) - 0.2) }
        changes.terrainMemory = updated
      }
    }

    // Seek based on learned preference + current need pressure
    const prefMemory = changes.terrainMemory ?? c.terrainMemory ?? {}
    const bodyPrefs: Partial<Record<string, string[]>> = {
      Wisp:  ['river', 'mud'],
      Shell: ['cave', 'shelter'],
      Spore: ['food_patch', 'bush'],
      Spike: ['barren', 'rock'],
    }
    const wantTypes = bodyPrefs[c.genome.body] ?? []

    // Only seek preferred terrain when not in urgent need
    if (wantTypes.length > 0 && c.hunger < 60 && c.thirst < 60) {
      let bestType: string | null = null
      let bestScore = 0.1  // minimum threshold to bother seeking
      for (const t of wantTypes) {
        const pref = (prefMemory[t] ?? 2) as number
        if (pref > bestScore) { bestScore = pref; bestType = t }
      }

      if (bestType && myTile?.type !== bestType) {
        const chance = Math.min(0.25, bestScore * 0.025)  // preference 10 → 25% chance/tick
        if (Math.random() < chance) {
          const t = findNearest([bestType as import('@/types').TileType], 20)
          if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
        }
      }
    }
  }

  // ── 5.6. Race terrain affinity — data-driven from RACE_PROFILES ─────────────
  if (!targetSet && c.genome.race && Math.random() < 0.05) {
    const affinity = RACE_PROFILES[c.genome.race]?.terrainAffinity
    if (affinity && affinity.length > 0) {
      const t = findNearest(affinity, 20)
      if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
    }
  }

  // ── 6. Social cohesion; only inherently social personalities cluster; others explore freely ──
  // Nurturing and Timid seek proximity to safe peers. All other personalities navigate
  // independently; Curious explores, Wanderer migrates, Recluse disperses, etc.
  // This replaces the old 18%-chance centroid-pull that forced the whole colony to cluster.
  if (!targetSet
      && (c.genome.personality === 'Nurturing' || c.genome.personality === 'Timid')
      && Math.random() < 0.07) {
    const safePeers = aliveCreatures.filter(
      other => other.id !== c.id
        && other.genome.personality !== 'Aggressive'
        && Math.abs(other.x - c.x) <= 10
        && Math.abs(other.y - c.y) <= 10
    )
    if (safePeers.length > 0 && safePeers.length < 8) {
      // Move toward the nearest safe peer, not the centroid of the whole group
      const nearest = safePeers.reduce((a, b) =>
        (Math.abs(a.x - c.x) + Math.abs(a.y - c.y)) < (Math.abs(b.x - c.x) + Math.abs(b.y - c.y)) ? a : b
      )
      const dist = Math.abs(nearest.x - c.x) + Math.abs(nearest.y - c.y)
      if (dist > 5) {
        const jitter = 3
        const tx = Math.max(0, Math.min(WORLD_SIZE - 1,
          nearest.x + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter))
        const ty = Math.max(0, Math.min(WORLD_SIZE - 1,
          nearest.y + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter))
        if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
          changes.state = 'wandering'
          changes.targetX = tx
          changes.targetY = ty
          targetSet = true
        }
      }
    }
  }

  // ── 6.5. Early-generation cohesion; gen 0-2 colonies stay together to bond ──
  // Without this, founders disperse before forming the bonds needed for reproduction.
  // This homing bias fades once they reach generation 3+.
  if (!targetSet && c.generation <= EARLY_GEN_MAX && Math.random() < 0.15) {
    const cohesionTarget = aliveCreatures.find(
      o => o.id !== c.id
        && Math.abs(o.x - c.x) <= EARLY_GEN_COHESION_RADIUS
        && Math.abs(o.y - c.y) <= EARLY_GEN_COHESION_RADIUS
    )
    if (cohesionTarget) {
      const jitter = 4
      const tx = Math.max(0, Math.min(WORLD_SIZE - 1,
        cohesionTarget.x + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter))
      const ty = Math.max(0, Math.min(WORLD_SIZE - 1,
        cohesionTarget.y + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter))
      if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
        changes.state = 'wandering'
        changes.targetX = tx
        changes.targetY = ty
        targetSet = true
      }
    }
  }

  // ── 6.7. Population pressure dispersal; dense clusters push gen≥1 non-social creatures outward ──
  // Only activates after the founding generation so early bonding is not disrupted.
  // Social, Nurturing, and Timid personalities prefer proximity and are excluded.
  // Recluse already has stronger dispersal logic above.
  if (!targetSet
      && c.generation >= 1
      && c.genome.personality !== 'Social'
      && c.genome.personality !== 'Nurturing'
      && c.genome.personality !== 'Timid'
      && c.genome.personality !== 'Recluse'
      && Math.random() < 0.03) {
    const crowdNearby = aliveCreatures.filter(
      o => o.id !== c.id
        && Math.abs(o.x - c.x) <= CROWD_DISPERSE_RADIUS
        && Math.abs(o.y - c.y) <= CROWD_DISPERSE_RADIUS
    )
    if (crowdNearby.length > CROWD_DISPERSE_THRESHOLD) {
      const cx = crowdNearby.reduce((s, o) => s + o.x, 0) / crowdNearby.length
      const cy = crowdNearby.reduce((s, o) => s + o.y, 0) / crowdNearby.length
      const dx = Math.sign(c.x - cx) || (Math.random() < 0.5 ? -1 : 1)
      const dy = Math.sign(c.y - cy) || (Math.random() < 0.5 ? -1 : 1)
      const dist = CROWD_DISPERSE_DISTANCE_MIN
        + Math.floor(Math.random() * (CROWD_DISPERSE_DISTANCE_MAX - CROWD_DISPERSE_DISTANCE_MIN + 1))
      const tx = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + dx * dist))
      const ty = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + dy * dist))
      if (tiles[ty]?.[tx] && isTilePassable(tiles[ty][tx])) {
        changes.state = 'wandering'
        changes.targetX = tx
        changes.targetY = ty
        targetSet = true
      }
    }
  }

  // ── 7. Default idle wander — high chance so creatures are almost always moving ──
  if (!targetSet && c.targetX === null && Math.random() < 0.68) {
    const baseRange = c.genome.personality === 'Lazy' ? 5
      : c.genome.personality === 'Timid' ? 7
      : c.genome.personality === 'Curious' ? 30
      : c.genome.personality === 'Wanderer' ? 35
      : c.genome.personality === 'Recluse' ? 16
      : c.genome.personality === 'Furtive' ? 5
      : c.genome.personality === 'Stoic' ? 10
      : c.genome.personality === 'Social' ? 10
      : c.genome.personality === 'Hoarder' ? 6
      : c.genome.personality === 'Empath' ? 12
      : c.genome.personality === 'Territorial' ? 8
      : 16
    const raceMult = (c.genome.race && RACE_PROFILES[c.genome.race]?.wanderRangeMult) ?? 1.0
    // Early-gen creatures stay closer to the group while bonding is still forming
    const range = Math.round((c.generation <= EARLY_GEN_MAX ? Math.min(baseRange, 12) : baseRange) * raceMult)
    for (let attempt = 0; attempt < 6; attempt++) {
      const tx = Math.max(0, Math.min(WORLD_SIZE - 1,
        c.x + Math.floor(Math.random() * (range * 2 + 1)) - range))
      const ty = Math.max(0, Math.min(WORLD_SIZE - 1,
        c.y + Math.floor(Math.random() * (range * 2 + 1)) - range))
      const dest = tiles[ty]?.[tx]
      if (dest && isTilePassable(dest)) {
        changes.state = 'wandering'
        changes.targetX = tx
        changes.targetY = ty
        break
      }
    }
  }

  // ── 7.5. Enrichment seeking; trait-driven, state-gated, with trade-off awareness ──
  // Creatures decide to use enrichment based on internal states, not forced logic.
  // Aggressive creatures can displace current users. Timid avoids exposed items.
  // Recluse avoids items if others are nearby. Cooldown prevents spam.
  if (!targetSet && enrichmentItems && c.health > 35) {
    const cooldownOk = !c.lastEnrichmentTick
      || (c.age - (c.lastEnrichmentTick ?? 0)) > ENRICHMENT_COOLDOWN_TICKS
    // Recluse avoids enrichment if others are within range; solitude first
    const recluseBlocked = c.genome.personality === 'Recluse'
      && aliveCreatures.some(o => o.id !== c.id && Math.abs(o.x - c.x) <= 4 && Math.abs(o.y - c.y) <= 4)

    if (cooldownOk && !recluseBlocked) {
      // Enrichment scoring: learned preference memory + current-state need multipliers.
      // The static personality→item lookup table is gone. Each creature's enrichmentMemory
      // tracks how satisfying each enrichment type has been from actual use. New items
      // start with a genome-seeded baseline (body-type + mind affinity) that decays toward
      // the actual experienced value once the creature has used it.
      const items = Object.values(enrichmentItems)
      let bestItem: (typeof items)[0] | null = null
      let bestScore = -1
      const enrichMem = c.enrichmentMemory ?? {}

      for (const item of items) {
        const dx = Math.abs(item.x - c.x)
        const dy = Math.abs(item.y - c.y)
        const dist = dx + dy
        if (dist > ENRICHMENT_SEEK_RADIUS) continue
        if (item.usedBy && item.usedBy !== c.id && c.genome.personality !== 'Aggressive') continue

        // Hard need-state gates
        if (item.type === 'resting_spot' && c.stress > 75) continue
        if (item.type === 'worn_path' && c.hunger > 60) continue
        if ((item.type === 'springy_moss' || item.type === 'worn_path')
            && c.genome.personality === 'Timid' && c.stress < 70) continue
        if (c.hunger > 55 && item.type === 'springy_moss') continue

        // Genome-seeded baseline for items never used by this creature.
        // Acts as a prior that learned experience overrides.
        const hasMemory = enrichMem[item.type] !== undefined
        let score: number
        if (hasMemory) {
          score = Math.max(0.1, enrichMem[item.type] as number)
        } else {
          // Baseline from body/mind biases — gives Wisp a slight mud_pool preference,
          // Sentinel a warm_stone preference, etc. — but all are modest (0.8–1.8)
          score = 1.0
          if (c.genome.body === 'Wisp'  && item.type === 'mud_pool')     score = 1.6
          if (c.genome.body === 'Shell' && item.type === 'burrow')        score = 1.6
          if (c.genome.body === 'Shell' && item.type === 'warm_stone')    score = 1.4
          if (c.genome.mind === 'Sentinel' && item.type === 'warm_stone') score = 1.8
          if (c.genome.mind === 'Dreaming' && item.type === 'resting_spot') score = 1.5
          if (c.genome.personality === 'Aggressive' && item.type === 'burrow') score = 0.3
        }

        // Current-state need multipliers — urgency overrides preference
        if (c.warmth < 35 && (item.type === 'warm_stone' || item.type === 'burrow')) score *= 3.0
        if (c.thirst > 50 && item.type === 'mud_pool')  score *= 3.0
        if (c.stress > 70 && (item.type === 'scratching_post' || item.type === 'springy_moss')) score *= 2.0

        // Proximity preference
        score *= (ENRICHMENT_SEEK_RADIUS + 1 - dist) / ENRICHMENT_SEEK_RADIUS

        if (score > bestScore) { bestScore = score; bestItem = item }
      }

      if (bestItem) {
        const atItem = Math.abs(bestItem.x - c.x) <= ENRICHMENT_USE_RADIUS
          && Math.abs(bestItem.y - c.y) <= ENRICHMENT_USE_RADIUS
        const useProb = atItem ? 0.80 : 0.06 * Math.min(bestScore, 3.0)
        if (Math.random() < useProb) {
          if (atItem) {
            changes.state = 'using_enrichment'
            changes.enrichmentTarget = bestItem.id
            changes.lastEnrichmentTick = c.age
            targetSet = true
          } else {
            changes.state = 'wandering'
            changes.targetX = bestItem.x
            changes.targetY = bestItem.y
            targetSet = true
          }
        }
      }
    }
  }

  // ── 7.7. Play behavior; high-satisfaction creatures near others may play ──
  if (!targetSet
      && c.needSatisfaction >= PLAY_TRIGGER_SATISFACTION
      && c.hunger < 40
      && c.health > 60
      && c.state !== 'playing'
      && Math.random() < 0.04) {
    const playPartner = aliveCreatures.find(
      other => other.id !== c.id
        && other.needSatisfaction >= PLAY_TRIGGER_SATISFACTION - 10
        && Math.abs(other.x - c.x) <= PLAY_PARTNER_RADIUS
        && Math.abs(other.y - c.y) <= PLAY_PARTNER_RADIUS
    )
    if (playPartner) {
      changes.state = 'playing'
      changes.targetX = playPartner.x
      changes.targetY = playPartner.y
      changes.currentThought = 'playing'
      changes.thoughtTimer = 20
      targetSet = true
    }
  }

  // ── 7.8. Grooming; bonded adjacent creatures occasionally groom each other ──
  // Reduces stress for both. More common in Nurturing/Timid; rare in Aggressive.
  if (!targetSet
      && c.genome.personality !== 'Aggressive'
      && c.genome.personality !== 'Recluse'
      && c.state !== 'grooming'
      && c.stress > 20
      && Math.random() < 0.022) {
    const groomPartner = aliveCreatures.find(
      other => other.id !== c.id
        && Math.abs(other.x - c.x) <= 1
        && Math.abs(other.y - c.y) <= 1
        && c.bonds.some(b => b.targetId === other.id && b.strength > 25)
    )
    if (groomPartner) {
      changes.state = 'grooming'
      changes.stateTimer = 0
      changes.currentThought = 'grooming'
      changes.thoughtTimer = 25
      targetSet = true
    }
  }

  // ── 8. Bond-seeking; mature non-Aggressive creatures without bonds seek partners ──
  // Recluses never actively seek bonds (solitude is their nature).
  // Wanderers seek bonds only rarely (too mobile to commit).
  // Social creatures seek bonds much more aggressively (0.14 base chance).
  if (!targetSet
    && c.genome.personality !== 'Aggressive'
    && c.genome.personality !== 'Recluse'
    && c.genome.personality !== 'Territorial'
    && c.bonds.filter(b => b.strength >= REPRODUCE_BOND_MIN_STRENGTH).length === 0
    && c.age >= CREATURE_MATURITY_TICKS
    && c.hunger < 55
    && Math.random() < (c.genome.personality === 'Social' ? 0.14 : c.genome.personality === 'Wanderer' ? 0.02 : 0.07)) {
    const bondRadius = aliveCreatures.length < 6 ? 40 : 18
    const potential = aliveCreatures.find(
      other => other.id !== c.id
        && other.genome.personality !== 'Aggressive'
        && other.genome.personality !== 'Recluse'
        && Math.abs(other.x - c.x) <= bondRadius && Math.abs(other.y - c.y) <= bondRadius
    )
    if (potential) {
      changes.state = 'bonding'
      changes.targetX = potential.x
      changes.targetY = potential.y
      targetSet = true
    }
  }

  // ── 9. Bond formation with adjacent alive creatures ──
  const nearby = aliveCreatures.filter(
    other => other.id !== c.id &&
      Math.abs(other.x - c.x) <= 1 &&
      Math.abs(other.y - c.y) <= 1
  )

  if (nearby.length > 0 && Math.random() < 0.015
      && c.genome.personality !== 'Aggressive'
      && c.genome.personality !== 'Recluse'
      && c.genome.personality !== 'Territorial') {
    changes.state = 'bonding'
  }

  return changes
}

// ─── Movement ─────────────────────────────────────────────────────────────────

export function tickMovement(creature: Creature, tiles: Tile[][]): Partial<Creature> {
  const c = creature
  if (c.targetX === null || c.targetY === null) return {}
  if (c.targetX === c.x && c.targetY === c.y) {
    return { targetX: null, targetY: null, state: 'idle' }
  }

  const speed = MOVE_SPEED_BY_BODY[c.genome.body]
  // Tile type modulates movement: forests slow, open ground speeds, impassable = 0
  const currentTile = tiles[c.y]?.[c.x]
  const currentTileType = currentTile?.type ?? 'grass'
  const tileMod = TILE_MOVE_MODIFIER[currentTileType] ?? 1.0
  const puddleMod = (currentTile?.puddleLevel ?? 0) > PUDDLE_MOVE_THRESHOLD ? PUDDLE_MOVE_MODIFIER : 1.0
  const moveChance = Math.min(0.85, speed * 0.32 * tileMod * puddleMod)
  if (Math.random() > moveChance) return {}

  const dx = Math.sign(c.targetX - c.x)
  const dy = Math.sign(c.targetY - c.y)

  // Try diagonal first, then axis-aligned, then perpendicular slides
  const candidates = [
    { x: c.x + dx, y: c.y + dy },   // diagonal toward target
    { x: c.x + dx, y: c.y },         // horizontal
    { x: c.x,      y: c.y + dy },    // vertical
    { x: c.x + (dy !== 0 ? 1 : 0),  y: c.y + (dx !== 0 ? 1 : 0) },  // slide right
    { x: c.x + (dy !== 0 ? -1 : 0), y: c.y + (dx !== 0 ? -1 : 0) }, // slide left
  ]

  for (const pos of candidates) {
    if (pos.x < 0 || pos.x >= WORLD_SIZE || pos.y < 0 || pos.y >= WORLD_SIZE) continue
    const tile = getTile(tiles, pos.x, pos.y)
    if (tile && isTilePassable(tile)) {
      return { x: pos.x, y: pos.y }
    }
  }

  // Completely blocked; abandon target and try elsewhere
  if (Math.random() < 0.45) {
    return { targetX: null, targetY: null, state: 'idle' }
  }
  return {}
}

// ─── Eating / drinking ────────────────────────────────────────────────────────

export function eatFromTile(creature: Creature, tile: Tile): { creature: Creature; tile: Tile } {
  if ((tile.type !== 'food_patch' && tile.type !== 'bush') || tile.foodAmount <= 0) return { creature, tile }
  const amount = Math.min(FOOD_EAT_AMOUNT, tile.foodAmount)
  return {
    creature: { ...creature, hunger: Math.max(0, creature.hunger - amount * 0.8) },
    tile: { ...tile, foodAmount: tile.foodAmount - amount },
  }
}

// Creature consumes healroot from tile; restores health, depletes potency
export function healFromRoot(creature: Creature, tile: Tile): { creature: Creature; tile: Tile } {
  if (tile.type !== 'healroot') return { creature, tile }
  const potency = tile.healrootAmount ?? 0
  if (potency <= 0) return { creature, tile }
  const healed = Math.min(HEALROOT_HEAL_PER_USE, potency)
  return {
    creature: {
      ...creature,
      health: Math.min(100, creature.health + healed),
      stress: Math.max(0, creature.stress - 8),
      state: creature.health + healed >= 40 ? 'idle' : 'seeking_healroot',
    },
    tile: { ...tile, healrootAmount: Math.max(0, potency - HEALROOT_CONSUME_AMOUNT) },
  }
}

// Grooming reduces stress in both participants (tick.ts calls this)
export function applyGroomingEffect(groomer: Creature, partner: Creature): { groomer: Creature; partner: Creature } {
  return {
    groomer:  { ...groomer,  stress: Math.max(0, groomer.stress  - 1.8) },
    partner:  { ...partner,  stress: Math.max(0, partner.stress  - 2.5) },
  }
}

export function drinkFromTile(creature: Creature, tile: Tile): Creature {
  if (tile.waterLevel <= 0) return creature
  return { ...creature, thirst: Math.max(0, creature.thirst - 45) }
}

// ─── Reproduction ─────────────────────────────────────────────────────────────

// Sexual reproduction gating. Bonds remain required for the high-rate sexual
// path; the asexual path runs from tickReproduction separately.
//
// Population pressure: pass in `populationFactor` (1.0 = healthy, scales down
// toward 0 as the colony overshoots carrying capacity). Caller computes it.
export function canReproduce(c: Creature, season: Season, populationFactor = 1.0, weather: WeatherState = 'clear'): boolean {
  if (c.age < CREATURE_MATURITY_TICKS) return false
  if (c.hunger > 55) return false
  if (c.health < 55) return false
  // Must have at least one meaningful bond — bonding is the primary path to reproduction
  if (!c.bonds.some(b => b.strength >= REPRODUCE_BOND_MIN_STRENGTH)) return false

  const seasonBonus = SEASON_MODIFIERS[season].breedBonus
  const weatherMult = WEATHER_BREED_MULT[weather] ?? 1.0
  const baseRate = REPRODUCE_RATE_BY_BODY[c.genome.body]
  return Math.random() < baseRate * seasonBonus * populationFactor * weatherMult
}

export function canAsexuallyReproduce(c: Creature, season: Season, populationFactor = 1.0): boolean {
  // Only Spore body type divides asexually; other body types must bond to reproduce.
  // This makes asexual reproduction rare and biologically specific.
  if (c.genome.body !== 'Spore') return false
  if (c.age < CREATURE_MATURITY_TICKS * 1.5) return false
  if (c.health < 78) return false
  if (c.hunger > 30) return false
  if (c.thirst > 50) return false
  if (season === 'winter') return false
  return populationFactor > 0.6
}

// ─── Enrichment interaction ───────────────────────────────────────────────────

// Apply per-tick effects of an enrichment item to a creature.
// Trait modifiers adjust effect magnitude; trade-offs are inherent per type.
export function applyEnrichmentEffect(creature: Creature, itemType: string, partnerNearby = false): Partial<Creature> {
  const fx = ENRICHMENT_EFFECTS[itemType]
  if (!fx) return {}

  let stressDelta = fx.stress

  // play_stones; social bonus when partner is adjacent; stress reduction doubles
  if (itemType === 'play_stones' && partnerNearby) stressDelta *= 2.0

  // warm_stone: Timid gets extra stress relief from thermal safety
  if (itemType === 'warm_stone' && creature.genome.personality === 'Timid') stressDelta -= 1.0

  // ── Enrichment memory learning ───────────────────────────────────────────
  // Compute how satisfying this use was, relative to what the creature needed.
  // High need + matching item effect = high satisfaction = preference rises.
  // Low need + item use = marginal satisfaction = preference stays or dips slightly.
  let satisfaction = 1.0
  if (stressDelta < 0 && creature.stress > 60) satisfaction = 2.0  // stress relief when stressed
  if (fx.warmth > 0 && creature.warmth < 40) satisfaction = 2.0    // warmth when cold
  if (fx.thirst < 0 && creature.thirst > 50) satisfaction = 2.0    // hydration when thirsty
  if (stressDelta < 0 && creature.stress < 30) satisfaction = 0.3  // not needed right now

  const prevPref = (creature.enrichmentMemory?.[itemType] ?? 1.0) as number
  const learnedPref = Math.min(10, Math.max(0.1, prevPref + (satisfaction - 1.0) * 0.4))
  const newMemory = { ...(creature.enrichmentMemory ?? {}), [itemType]: learnedPref }

  return {
    stress: Math.max(0, Math.min(100, creature.stress + stressDelta)),
    hunger: Math.max(0, Math.min(100, creature.hunger + fx.hunger)),
    thirst: Math.max(0, Math.min(100, creature.thirst + fx.thirst)),
    warmth: Math.max(0, Math.min(100, creature.warmth + fx.warmth)),
    health: Math.max(0, Math.min(100, creature.health + fx.health)),
    enrichmentMemory: newMemory,
  }
}

// ─── Fight resolution ─────────────────────────────────────────────────────────

export function resolveFight(
  attacker: Creature,
  defender: Creature
): { attacker: Creature; defender: Creature; attackerWon: boolean } {
  const apexBonus    = (c: Creature) => (c.genome.race && RACE_PROFILES[c.genome.race]?.fightBonus) ?? 0
  const ridgeArmored = (c: Creature) => (c.genome.adaptations ?? []).includes('ridge_armor')

  // Deterministic base powers drive the decisiveness calculation;
  // random jitter is added separately so outcome still has uncertainty.
  const baseA = FIGHT_POWER_BY_BODY[attacker.genome.body] + apexBonus(attacker)
  const baseD = FIGHT_POWER_BY_BODY[defender.genome.body] + apexBonus(defender)
  const aPower = baseA + Math.random() * 0.5
  const dPower = baseD + Math.random() * 0.5
  const attackerWon = aPower > dPower

  // Decisiveness: how lopsided is the power gap?
  // 0 = equal-strength fight; 1 = maximum mismatch (e.g. Spike vs Spore).
  // Decisive fights end quickly with less total harm to both sides.
  // Contested fights are attritional and costly to both parties.
  const winBase  = Math.max(baseA, baseD)
  const loseBase = Math.min(baseA, baseD)
  const ratio        = winBase / Math.max(0.1, loseBase)
  const decisiveness = Math.min(1, (ratio - 1) / 4)   // 0..1

  // Loser damage range: equal fight 10–35, decisive fight 5–15
  const loserMin    = Math.round(10 - decisiveness * 5)
  const loserMax    = Math.round(35 - decisiveness * 20)
  const loserDamage = loserMin + Math.floor(Math.random() * (loserMax - loserMin + 1))

  // Winner damage range: equal fight 0–15, decisive fight 0–3
  const winnerMax    = Math.round(15 - decisiveness * 12)
  const winnerDamage = Math.floor(Math.random() * (winnerMax + 1))

  const attackerLoserMult = ridgeArmored(attacker) ? RIDGE_ARMOR_DAMAGE_MULT : 1.0
  const defenderLoserMult = ridgeArmored(defender) ? RIDGE_ARMOR_DAMAGE_MULT : 1.0

  return {
    attackerWon,
    attacker: attackerWon
      ? { ...attacker, killCount: attacker.killCount + 1,
          health: Math.max(0, attacker.health - winnerDamage) }
      : { ...attacker, health: Math.max(0, attacker.health - Math.round(loserDamage * attackerLoserMult)),
          stress: Math.min(100, attacker.stress + 20) },
    defender: attackerWon
      ? { ...defender, health: Math.max(0, defender.health - Math.round(loserDamage * defenderLoserMult)),
          stress: Math.min(100, defender.stress + 20) }
      : { ...defender, killCount: defender.killCount + 1,
          health: Math.max(0, defender.health - winnerDamage) },
  }
}