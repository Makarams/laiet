import {
  Creature, Tile, ThoughtSymbol, Season, WeatherState, EnrichmentItem
} from '@/types'
import {
  HUNGER_DECAY, THIRST_DECAY, WARMTH_DECAY_BASE, WARMTH_DECAY_WINTER,
  STRESS_DECAY_BASE, HUNGER_CRITICAL, THIRST_CRITICAL, WARMTH_CRITICAL, STRESS_CRITICAL,
  HUNGER_SEEK_THRESHOLD, THIRST_SEEK_THRESHOLD, WARMTH_SEEK_THRESHOLD,
  FOOD_EAT_AMOUNT,
  MOVE_SPEED_BY_BODY, REPRODUCE_RATE_BY_BODY, FIGHT_POWER_BY_BODY,
  SEASON_MODIFIERS, WORLD_SIZE, CREATURE_MATURITY_TICKS,
  TILE_MOVE_MODIFIER, BIOME_THIRST_EXTRA, REPRODUCE_BOND_MIN_STRENGTH,
  RECLUSE_CROWD_RADIUS, RECLUSE_CROWD_THRESHOLD,
  PLAY_TRIGGER_SATISFACTION, PLAY_PARTNER_RADIUS,
  ENRICHMENT_USE_RADIUS, ENRICHMENT_EFFECTS, ENRICHMENT_COOLDOWN_TICKS,
  HEALROOT_SEEK_HEALTH, HEALROOT_HEAL_PER_USE, HEALROOT_CONSUME_AMOUNT,
  EARLY_GEN_MAX, EARLY_GEN_COHESION_RADIUS,
  WEATHER_BREED_MULT,
} from '@/engine/constants'
import { findNearestTileOfType, findNearestInIndex, getTile, isTilePassable, TileTypeIndex } from '@/world/worldGen'
import { tickSentience } from './factory'

// ─── Needs decay ─────────────────────────────────────────────────────────────

export function tickNeeds(creature: Creature, season: Season, biome?: string): Creature {
  const c = { ...creature }
  const isWinter = season === 'winter'

  c.hunger = Math.min(100, c.hunger + HUNGER_DECAY)
  // Biome thirst modifier: arid zones parch faster, wetlands are forgiving
  const biomeThirstExtra = BIOME_THIRST_EXTRA[biome ?? 'temperate'] ?? 0
  c.thirst = Math.min(100, c.thirst + THIRST_DECAY + THIRST_DECAY * biomeThirstExtra)
  c.warmth = Math.max(0, c.warmth - (isWinter ? WARMTH_DECAY_WINTER : WARMTH_DECAY_BASE))
  c.sentience = tickSentience(c)

  c.needSatisfaction = computeNeedSatisfaction(c)
  let stressDelta = c.needSatisfaction < 30 ? 0.5 : -STRESS_DECAY_BASE
  // Stoic halves stress accumulation; they stay calm under pressure
  if (c.genome.personality === 'Stoic') stressDelta = Math.min(0, stressDelta) * 0.5 + Math.max(0, stressDelta) * 0.5
  // Ash race is adapted to harsh terrain; slight passive stress bleed
  if (c.genome.race === 'Ash') stressDelta = Math.min(stressDelta, stressDelta - 0.06)
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

  // Thought bubble
  c.thoughtTimer = Math.max(0, c.thoughtTimer - 1)
  if (c.thoughtTimer === 0) {
    c.currentThought = pickThought(c)
    c.thoughtTimer = 15 + Math.floor(Math.random() * 30)
  }

  return c
}

function computeNeedSatisfaction(c: Creature): number {
  const base = 100 - c.hunger * 0.3 - c.thirst * 0.3 - (100 - c.warmth) * 0.2 - c.stress * 0.2

  let traitPenalty = 0
  switch (c.genome.personality) {
    case 'Curious':
      traitPenalty = c.state === 'idle' && c.stateTimer > 80 ? 20 : 0
      break
    case 'Timid':
      traitPenalty = c.stress > 50 ? 25 : 0
      break
    case 'Aggressive':
      traitPenalty = c.territoryClaim === null ? 15 : 0
      break
    case 'Lazy':
      break
    case 'Greedy':
      traitPenalty = c.hunger > 25 ? 15 : 0
      break
    case 'Nurturing':
      traitPenalty = c.bonds.length === 0 ? 20 : 0
      break
    case 'Wanderer':
      traitPenalty = c.state === 'idle' && c.stateTimer > 50 ? 22 : 0
      break
    case 'Recluse':
      traitPenalty = c.stress > 45 ? 20 : 0  // crowding stress cascades to satisfaction
      break
    case 'Hoarder':
      traitPenalty = c.hunger > 20 ? 18 : 0  // never satisfied unless well-stocked
      break
    case 'Empath':
      traitPenalty = c.stress > 40 ? 12 : 0  // mirrors nearby stress; hard to ignore
      break
    case 'Furtive':
      traitPenalty = c.stress > 35 ? 15 : 0  // open exposure is inherently stressful
      break
    case 'Territorial':
      traitPenalty = c.territoryClaim === null ? 18 : 0  // must hold ground to feel settled
      break
    case 'Social':
      traitPenalty = c.bonds.length < 2 ? 20 : 0  // low-bond state feels deeply wrong
      break
    case 'Stoic':
      traitPenalty = 0  // need satisfaction is never penalised by personality
      break
  }

  return Math.max(0, Math.min(100, base - traitPenalty))
}

function pickThought(c: Creature): ThoughtSymbol {
  if (c.state === 'sick') return 'sick'
  if (c.state === 'fighting') return 'fighting'
  if (c.state === 'mourning') return 'mourning'
  if (c.state === 'bonding') return 'bonding'
  if (c.state === 'grooming') return 'grooming'
  if (c.state === 'dreaming') return 'dreaming'
  if (c.state === 'playing' || c.state === 'using_enrichment') return 'playing'
  if (c.carrying) return 'carrying'
  if (c.genome.mind === 'Sentinel') return 'watching'
  if (c.hunger > HUNGER_CRITICAL) return 'hungry'
  if (c.thirst > THIRST_CRITICAL) return 'thirsty'
  if (c.warmth < WARMTH_CRITICAL) return 'cold'
  if (c.stress > 60) return 'stressed'
  if (c.genome.personality === 'Curious') return 'curious'
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
  enrichmentItems?: Record<string, EnrichmentItem>
): Partial<Creature> {
  const c = creature
  const changes: Partial<Creature> = {}

  // Inline finder: uses index when available, falls back to BFS scan
  const findNearest = (types: Parameters<typeof findNearestTileOfType>[3], maxDist: number) =>
    tileIdx
      ? findNearestInIndex(tileIdx, tiles, c.x, c.y, types, maxDist)
      : findNearestTileOfType(tiles, c.x, c.y, types, maxDist)

  // ── Recluse crowding; solitude is their natural state; crowds add stress ──
  if (c.genome.personality === 'Recluse') {
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
    if (hrTile) {
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
    || (c.genome.personality === 'Timid' && c.stress > 65)
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
    const foodTile = findNearest(['food_patch', 'bush'], 20)
    if (foodTile && foodTile.foodAmount > 0) {
      changes.state = 'seeking_food'
      changes.targetX = foodTile.x
      changes.targetY = foodTile.y
      return changes
    }

    // No food found locally; migrate. Pick a distant random spot to scout.
    // This is the colony's response to environmental scarcity.
    if (c.hunger > 55) {
      const tx = Math.max(0, Math.min(WORLD_SIZE - 1, c.x + (Math.random() < 0.5 ? -1 : 1) * (15 + Math.floor(Math.random() * 15))))
      const ty = Math.max(0, Math.min(WORLD_SIZE - 1, c.y + (Math.random() < 0.5 ? -1 : 1) * (15 + Math.floor(Math.random() * 15))))
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
    const waterTile = findNearest(['river'], 24)
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
    const margin = Math.floor(WORLD_SIZE * 0.12)
    const edge = c.x < margin || c.x > WORLD_SIZE - 1 - margin
      || c.y < margin || c.y > WORLD_SIZE - 1 - margin
    if (!edge) {
      changes.state = 'observing'
      const onLeft = Math.random() < 0.5
      changes.targetX = onLeft ? 2 : WORLD_SIZE - 3
      changes.targetY = Math.floor(WORLD_SIZE * 0.25 + Math.random() * WORLD_SIZE * 0.5)
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
      if (!c.territoryClaim && Math.random() < 0.008) {
        const claimTile = tiles[c.y]?.[c.x]
        if (claimTile && (claimTile.type === 'food_patch' || claimTile.type === 'bush' || claimTile.type === 'river')) {
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
      if (!c.territoryClaim && Math.random() < 0.010) {
        const here = tiles[c.y]?.[c.x]
        if (here && (here.type === 'food_patch' || here.type === 'bush' || here.type === 'river')) {
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
  }

  // ── 5.5. Terrain affinity; body type draws creatures toward their preferred environment ──
  // Wisp body → water; Shell body → shelter/cave; Spore body → food; Spike body → open ground.
  // Produces emergent ecological niches and spreads the population across different terrain.
  if (!targetSet && Math.random() < 0.07) {
    if (c.genome.body === 'Wisp') {
      const t = findNearest(['river', 'mud'], 20)
      if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
    } else if (c.genome.body === 'Shell') {
      const t = findNearest(['cave', 'shelter'], 20)
      if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
    } else if (c.genome.body === 'Spore') {
      const t = findNearest(['food_patch', 'bush', 'mud'], 20)
      if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
    } else if (c.genome.body === 'Spike') {
      const t = findNearest(['food_patch', 'barren'], 20)
      if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
    }
  }

  // ── 5.6. Race terrain affinity; ancestral lineage shapes habitat preference ──
  if (!targetSet && c.genome.race && Math.random() < 0.05) {
    const race = c.genome.race
    if (race === 'Burrow' || race === 'Pale') {
      const t = findNearest(['cave'], 20)
      if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
    } else if (race === 'Tide') {
      const t = findNearest(['river', 'mud'], 20)
      if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
    } else if (race === 'Ash') {
      const t = findNearest(['barren'], 20)
      if (t) { changes.state = 'wandering'; changes.targetX = t.x; changes.targetY = t.y; targetSet = true }
    } else if (race === 'Bloom') {
      const t = findNearest(['food_patch', 'bush'], 20)
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
    // Drift race roams farther; built for wide-range dispersal
    const raceMult = c.genome.race === 'Drift' ? 1.5 : 1.0
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
      // Score items by trait preference. Highest score item wins.
      const items = Object.values(enrichmentItems)
      let bestItem: (typeof items)[0] | null = null
      let bestScore = -1

      for (const item of items) {
        const dx = Math.abs(item.x - c.x)
        const dy = Math.abs(item.y - c.y)
        const dist = dx + dy
        if (dist > 10) continue
        // Skip items occupied by someone else unless Aggressive (can displace)
        if (item.usedBy && item.usedBy !== c.id && c.genome.personality !== 'Aggressive') continue

        // Trade-off gates: respect internal state before using enrichment
        if (item.type === 'resting_spot' && c.stress > 75) continue
        if (item.type === 'worn_path' && c.hunger > 60) continue
        // Timid avoids high-energy exposed items unless very stressed
        if ((item.type === 'springy_moss' || item.type === 'worn_path')
            && c.genome.personality === 'Timid' && c.stress < 70) continue

        // Trait-preference scoring
        let score = 1.0
        if (c.genome.personality === 'Lazy'       && item.type === 'resting_spot')   score = 3.0
        if (c.genome.personality === 'Lazy'       && item.type === 'warm_stone')      score = 2.5
        if (c.genome.personality === 'Curious'    && item.type === 'worn_path')       score = 3.0
        if (c.genome.personality === 'Curious'    && item.type === 'springy_moss')    score = 2.5
        if (c.genome.personality === 'Nurturing'  && item.type === 'play_stones')     score = 2.5
        if (c.genome.personality === 'Timid'      && item.type === 'burrow')          score = 3.0
        if (c.genome.personality === 'Aggressive' && item.type === 'burrow')          score = 0.3
        if (c.genome.mind === 'Sentinel'          && item.type === 'warm_stone')      score *= 2.0
        if (c.genome.mind === 'Dreaming'          && item.type === 'resting_spot')    score *= 1.5
        // Prefer closer items
        score *= (11 - dist) / 10

        if (score > bestScore) { bestScore = score; bestItem = item }
      }

      if (bestItem && Math.random() < 0.06 * bestScore) {
        const atItem = Math.abs(bestItem.x - c.x) <= ENRICHMENT_USE_RADIUS
          && Math.abs(bestItem.y - c.y) <= ENRICHMENT_USE_RADIUS
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
  const currentTileType = tiles[c.y]?.[c.x]?.type ?? 'grass'
  const tileMod = TILE_MOVE_MODIFIER[currentTileType] ?? 1.0
  const moveChance = Math.min(0.85, speed * 0.32 * tileMod)
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
    tile: { ...tile, healrootAmount: potency - HEALROOT_CONSUME_AMOUNT },
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

  return {
    stress: Math.max(0, Math.min(100, creature.stress + stressDelta)),
    hunger: Math.max(0, Math.min(100, creature.hunger + fx.hunger)),
    thirst: Math.max(0, Math.min(100, creature.thirst + fx.thirst)),
    warmth: Math.max(0, Math.min(100, creature.warmth + fx.warmth)),
    health: Math.max(0, Math.min(100, creature.health + fx.health)),
  }
}

// ─── Fight resolution ─────────────────────────────────────────────────────────

export function resolveFight(
  attacker: Creature,
  defender: Creature
): { attacker: Creature; defender: Creature; attackerWon: boolean } {
  const apexBonus = (c: Creature) => c.genome.race === 'Apex' ? 0.5 : 0

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

  return {
    attackerWon,
    attacker: attackerWon
      ? { ...attacker, killCount: attacker.killCount + 1,
          health: Math.max(0, attacker.health - winnerDamage) }
      : { ...attacker, health: Math.max(0, attacker.health - loserDamage),
          stress: Math.min(100, attacker.stress + 20) },
    defender: attackerWon
      ? { ...defender, health: Math.max(0, defender.health - loserDamage),
          stress: Math.min(100, defender.stress + 20) }
      : { ...defender, killCount: defender.killCount + 1,
          health: Math.max(0, defender.health - winnerDamage) },
  }
}