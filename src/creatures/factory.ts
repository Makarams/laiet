import { v4 as uuid } from 'uuid'
import { Creature, Genome, GameState, PersonalityTrait, BodyTrait, MindTrait } from '@/types'
import {
  MAX_AGE_BY_BODY,
  SENTIENCE_GROWTH_BY_MIND,
  WORLD_SIZE,
  ASEXUAL_MUTATION_CHANCE,
  STARTER_BOND_STRENGTH,
  REPRODUCE_BOND_MIN_STRENGTH,
} from '@/engine/constants'
import {
  randomGenome,
  inheritGenome,
  mutateGenomeAsexual,
  generateName,
  mutateFamily,
  initMorphology,
  RACES,
} from '@/engine/genetics'
import { createRng } from '@/world/worldGen'
import { starterEmoji, inheritEmoji } from '@/engine/speech'

export function spawnCreature(
  overrides: Partial<Creature> & {
    x: number
    y: number
    name: string
    familyName: string
    genome?: Genome
  },
  rng: () => number
): Creature {
  const genome = overrides.genome ?? randomGenome(rng)
  const id = uuid()

  return {
    id,
    name: overrides.name,
    familyName: overrides.familyName,
    genome,
    generation: overrides.generation ?? 0,
    parentIds: overrides.parentIds ?? [null, null],
    lineageId: overrides.lineageId ?? id,

    age: 0,
    maxAge: MAX_AGE_BY_BODY[genome.body] + Math.floor((rng() - 0.5) * 10),
    health: 100,
    hunger: 0,
    thirst: 0,
    warmth: 70,
    stress: 0,
    sentience: genome.mind === 'Sentinel' ? 20 : genome.mind === 'Dreaming' ? 10 : 0,
    needSatisfaction: 100,

    x: overrides.x,
    y: overrides.y,

    bonds: [],
    tribeId: null,
    territoryClaim: null,

    state: 'idle',
    stateTimer: 0,
    targetX: null,
    targetY: null,

    bornOnDay: overrides.bornOnDay ?? 0,
    diedOnDay: null,
    killCount: 0,
    offspringIds: [],
    messagesSent: 0,

    currentThought: null,
    thoughtTimer: 0,

    // speech system; starter vocab derived from mind + personality
    knownEmoji: overrides.knownEmoji ?? starterEmoji(genome.mind, genome.personality, rng),
    role: overrides.role,
  }
}

// Detect which genome slots in offspring differ from BOTH parents; true mutation.
// Returns list of slot names that changed vs. both parents.
function detectMutations(offspring: Genome, parentA: Creature, parentB: Creature): string[] {
  const mutated: string[] = []
  if (offspring.personality !== parentA.genome.personality && offspring.personality !== parentB.genome.personality)
    mutated.push('personality')
  if (offspring.body !== parentA.genome.body && offspring.body !== parentB.genome.body)
    mutated.push('body')
  if (offspring.mind !== parentA.genome.mind && offspring.mind !== parentB.genome.mind)
    mutated.push('mind')
  // Race counts as a mutation only if it differs from both parents AND isn't a latent revival
  // (revivals are expected; raw random mutations are the notable events)
  if (offspring.race
    && offspring.race !== parentA.genome.race
    && offspring.race !== parentB.genome.race
    && !(parentA.genome.latentAncestry?.[offspring.race])
    && !(parentB.genome.latentAncestry?.[offspring.race])) {
    mutated.push('race')
  }
  return mutated
}

export function createOffspring(
  parentA: Creature,
  parentB: Creature,
  x: number,
  y: number,
  currentDay: number,
  rng: () => number,
  mutationChance?: number,
  tribalLexicon: string[] = []
): Creature {
  const genome = inheritGenome(parentA.genome, parentB.genome, rng, mutationChance)
  const generation = Math.max(parentA.generation, parentB.generation) + 1

  const inheritFromA = rng() < 0.5
  const baseFamilyName = inheritFromA ? parentA.familyName : parentB.familyName
  const familyName = mutateFamily(baseFamilyName, rng)

  const mutatedTraits = detectMutations(genome, parentA, parentB)

  const c = spawnCreature({
    x, y,
    name: generateName(rng),
    familyName,
    genome,
    generation,
    parentIds: [parentA.id, parentB.id],
    lineageId: inheritFromA ? parentA.lineageId : parentB.lineageId,
    bornOnDay: currentDay,
    knownEmoji: inheritEmoji(parentA, parentB, tribalLexicon, rng),
  }, rng)

  if (mutatedTraits.length > 0) {
    c.recentMutation = currentDay
    c.mutatedTraits = mutatedTraits
    c.currentThought = 'mutated'
    c.thoughtTimer = 30
  }

  return c
}

// Single-cell-style division; one parent, higher mutation rate.
// Inherits family name with possible mutation, keeps lineage id.
export function createAsexualOffspring(
  parent: Creature,
  x: number,
  y: number,
  currentDay: number,
  rng: () => number
): Creature {
  const genome = mutateGenomeAsexual(parent.genome, rng, ASEXUAL_MUTATION_CHANCE)
  return spawnCreature({
    x, y,
    name: generateName(rng),
    familyName: mutateFamily(parent.familyName, rng),
    genome,
    generation: parent.generation + 1,
    parentIds: [parent.id, null],
    lineageId: parent.lineageId,
    bornOnDay: currentDay,
    knownEmoji: inheritEmoji(parent, null, [], rng),
  }, rng)
}

// ─── Starter creature genomes: all four body types represented ────────────────
//
// Constraints applied:
//   • Each starter has a different personality (no two same)
//   • All four body types present from turn one; each body is a distinct
//     ecological role; missing one at start means it can never appear unless
//     it mutates in (15% per gene per birth, so rare).
//   • No Aggressive starters (would block bonding/reproduction in the critical
//     early window when population is too small to absorb conflict)
//   • At least one Aware mind so messages can start flowing early
// The specific assignment within those constraints is randomized from the world
// seed, so each world starts with a genuinely different quartet.

const STARTER_PERSONALITY_POOL: PersonalityTrait[] = ['Curious', 'Timid', 'Lazy', 'Greedy', 'Nurturing']
const STARTER_MIND_POOL: MindTrait[] = ['Aware', 'Aware', 'Dreaming', 'Sentinel', 'Feral']

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickStarterGenomes(rng: () => number): Genome[] {
  const personalities = shuffle(STARTER_PERSONALITY_POOL, rng).slice(0, 4)
  // All four bodies in random order; every ecological role present from start.
  const bodies: BodyTrait[] = shuffle(['Spore', 'Shell', 'Spike', 'Wisp'] as BodyTrait[], rng)
  // Minds: shuffle weighted pool, pick 4, force at least one Aware for early messaging.
  const minds = shuffle(STARTER_MIND_POOL, rng).slice(0, 4)
  if (!minds.includes('Aware')) minds[0] = 'Aware'

  return [0, 1, 2, 3].map(i => ({
    personality: personalities[i],
    body: bodies[i],
    mind: minds[i],
    morphSeed: rng(),
    morphology: initMorphology(),
    race: RACES[Math.floor(rng() * RACES.length)],
    latentAncestry: {},
  }))
}

export function createStarterCreatures(
  namedPairs: { name: string; familyName: string }[],
  worldSeed: number,
  currentDay: number
): Creature[] {
  const rng = createRng(worldSeed + 9999)
  const center = Math.floor(WORLD_SIZE / 2)
  // Four positions clustered near center so starters can see and bond with
  // each other quickly; spread enough to avoid tile collisions.
  const startPositions = [
    { x: center - 2, y: center     },
    { x: center + 2, y: center     },
    { x: center,     y: center - 2 },
    { x: center,     y: center + 2 },
  ]

  const genomes = pickStarterGenomes(rng)

  // Spawn all four; fill missing names with generated ones.
  const creatures = Array.from({ length: 4 }, (_, i) => {
    const pair = namedPairs[i] ?? {
      name:       generateName(rng),
      familyName: generateName(rng),
    }
    return spawnCreature({
      ...pair,
      ...startPositions[i],
      genome:    genomes[i],
      bornOnDay: currentDay,
    }, rng)
  })

  // Pre-seed bonds between every pair of starters.
  // STARTER_BOND_STRENGTH (25) is below REPRODUCE_BOND_MIN_STRENGTH (35), so
  // bond-seeking stays active; ~20 adjacency ticks at 0.5/tick bridge the gap.
  const ids = creatures.map(c => c.id)
  return creatures.map(c => ({
    ...c,
    bonds: ids
      .filter(id => id !== c.id)
      .map(id => ({ targetId: id, strength: STARTER_BOND_STRENGTH, since: currentDay })),
  }))
}

// ─── Sentience tick ───────────────────────────────────────────────────────────

export function tickSentience(creature: Creature): number {
  const growth = SENTIENCE_GROWTH_BY_MIND[creature.genome.mind] ?? 0
  // Below 50, sentience grows freely — baseline cognition requires no social input.
  // Above 50, a meaningful bond (strength ≥ 35) is required for further awakening.
  // Isolated creatures plateau: inner worlds only deepen through others reflecting them back.
  if (creature.sentience >= 50) {
    const hasMeaningfulBond = creature.bonds.some(b => b.strength >= REPRODUCE_BOND_MIN_STRENGTH)
    return Math.min(100, creature.sentience + growth * (hasMeaningfulBond ? 1.0 : 0.2))
  }
  return Math.min(100, creature.sentience + growth)
}

// ─── Colony stage ─────────────────────────────────────────────────────────────

export function getColonyStage(population: number) {
  if (population >= 80) return 'ascendant'
  if (population >= 51) return 'thriving'
  if (population >= 31) return 'established'
  if (population >= 16) return 'growing'
  if (population >= 6) return 'nascent'
  return 'genesis'
}

// ─── Awareness stage ─────────────────────────────────────────────────────────

export function computeAwarenessStage(state: GameState): 1 | 2 | 3 {
  const alive = Object.values(state.creatures).filter(c => c.diedOnDay === null)
  const maxGen = alive.length > 0 ? Math.max(0, ...alive.map(c => c.generation)) : 0
  const hasSentinel = alive.some(c => c.genome.mind === 'Sentinel')
  // Dreaming creatures at high sentience serve as a soft Sentinel substitute —
  // the awareness arc can still progress even if no Sentinel lineage survives.
  const hasDreamingFallback = alive.some(c => c.genome.mind === 'Dreaming' && c.sentience >= 80)
  const sentientEnough = hasSentinel || hasDreamingFallback

  if (alive.length >= 80 && maxGen >= 6 && hasSentinel) return 3
  if (maxGen >= 5 && sentientEnough) return 2
  return 1
}