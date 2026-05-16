import { v4 as uuid } from 'uuid'
import { Creature, Genome, GameState, PersonalityTrait, BodyTrait, MindTrait, EnvContext, MessageStage } from '@/types'
import {
  MAX_AGE_BY_BODY,
  SENTIENCE_GROWTH_BY_MIND,
  WORLD_SIZE,
  ASEXUAL_MUTATION_CHANCE,
  MUTATION_CHANCE,
  MUTATION_CRISIS_BOOST_MAX,
  STARTER_BOND_STRENGTH,
  REPRODUCE_BOND_MIN_STRENGTH,
  LINEAGE_FORK_INTERVAL,
  LINEAGE_FORK_CHANCE,
  // window/gate constants removed — awarenessStage now reads cognitionPressure directly
} from '@/engine/constants'
import {
  randomGenome,
  inheritGenome,
  mutateGenomeAsexual,
  generateName,
  mutateFamily,
  initMorphology,
  acquireAdaptation,
  inheritAdaptations,
  RACES,
  BehaviorSig,
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

// ─── Parent fitness ───────────────────────────────────────────────────────────

// Returns a 0..1 fitness score for a parent creature.
// Used to weight which parent's traits are more likely to be inherited.
// Health is the primary signal; hunger and stress provide secondary pressure.
function computeParentFitness(c: Creature): number {
  return (c.health / 100) * 0.50
    + Math.max(0, 1 - c.hunger / 100) * 0.30
    + Math.max(0, 1 - c.stress / 100) * 0.20
}

// Detects mutations: alleles that appear in the offspring but are absent from both parents' allele pools.
// With the diploid model, a mutation is specific to an allele, not just the expressed phenotype —
// a recessive new allele is a true mutation even if it isn't visible in this generation.
// Also detects morphology threshold crossings (new visible features appearing).
function detectMutations(offspring: Genome, parentA: Creature, parentB: Creature): string[] {
  const mutated: string[] = []

  // Build parent allele pools (fall back to expressed trait as homozygous if no pair stored)
  const pAPersonalities = new Set(parentA.genome.personalityAlleles ?? [parentA.genome.personality])
  const pBPersonalities = new Set(parentB.genome.personalityAlleles ?? [parentB.genome.personality])
  const offPersonalities = offspring.personalityAlleles ?? [offspring.personality, offspring.personality]
  if (offPersonalities.some(a => !pAPersonalities.has(a) && !pBPersonalities.has(a)))
    mutated.push('personality')

  const pABodies = new Set(parentA.genome.bodyAlleles ?? [parentA.genome.body])
  const pBBodies = new Set(parentB.genome.bodyAlleles ?? [parentB.genome.body])
  const offBodies = offspring.bodyAlleles ?? [offspring.body, offspring.body]
  if (offBodies.some(b => !pABodies.has(b) && !pBBodies.has(b)))
    mutated.push('body')

  const pAMinds = new Set(parentA.genome.mindAlleles ?? [parentA.genome.mind])
  const pBMinds = new Set(parentB.genome.mindAlleles ?? [parentB.genome.mind])
  const offMinds = offspring.mindAlleles ?? [offspring.mind, offspring.mind]
  if (offMinds.some(m => !pAMinds.has(m) && !pBMinds.has(m)))
    mutated.push('mind')

  // Race: counts as mutation only when not a latent revival
  if (offspring.race
    && offspring.race !== parentA.genome.race
    && offspring.race !== parentB.genome.race
    && !(parentA.genome.latentAncestry?.[offspring.race])
    && !(parentB.genome.latentAncestry?.[offspring.race])) {
    mutated.push('race')
  }

  // Morphology threshold crossings (new visible features appearing)
  const offMorph = offspring.morphology
  const parentAMorph = parentA.genome.morphology
  const parentBMorph = parentB.genome.morphology

  const limbThresholds = [0.20, 0.30, 0.35, 0.55]
  for (const threshold of limbThresholds) {
    if (parentAMorph.limbLength < threshold && parentBMorph.limbLength < threshold && offMorph.limbLength >= threshold) {
      mutated.push('limbs'); break
    }
  }

  const spineThresholds = [0.25, 0.30, 0.45, 0.50, 0.55]
  for (const threshold of spineThresholds) {
    if (parentAMorph.spinalLength < threshold && parentBMorph.spinalLength < threshold && offMorph.spinalLength >= threshold) {
      mutated.push('spine'); break
    }
  }

  return mutated
}

// Behavioral reinforcement signal: derived from parent stats as a proxy for the
// environmental pressures that shaped their lifetimes. Used to bias body mutations
// toward the type that would have been most adaptive for the parents.
function computeBehaviorSignature(parentA: Creature, parentB: Creature): BehaviorSig {
  return {
    combatBias:       Math.min(1, (parentA.killCount + parentB.killCount) / 10),
    socialBias:       Math.min(1, (parentA.bonds.length + parentB.bonds.length) / 8),
    reproductiveBias: Math.min(1, (parentA.offspringIds.length + parentB.offspringIds.length) / 20),
    survivalBias:     Math.min(1, ((parentA.age / parentA.maxAge) + (parentB.age / parentB.maxAge)) / 2),
  }
}

// ─── Lineage divergence ───────────────────────────────────────────────────────
// Lineage forking is NOT a generation counter. It is a pressure accumulation.
// A fork happens when actual divergence forces (geographic separation, resource
// competition, accumulated stress from proximity) push past a threshold.
// Creatures born from cross-lineage parents inherit a BLENDED lineage ID, which
// creates a natural bridge population and reduces inter-lineage tension.
//
// lineageId format: "{rootId}" or "{rootId}_{branchSuffix}"
// rootId = lineageId of the primary parent's root
// branchSuffix = short hash from divergence pressure snapshot

function deriveLineageId(
  parentA: Creature,
  parentB: Creature,
  inheritFromA: boolean,
  divergencePressure: number,
  generation: number,
  rng: () => number,
): string {
  const primary = inheritFromA ? parentA : parentB
  const secondary = inheritFromA ? parentB : parentA

  const rootA = primary.lineageId.includes('_') ? primary.lineageId.split('_')[0] : primary.lineageId
  const rootB = secondary.lineageId.includes('_') ? secondary.lineageId.split('_')[0] : secondary.lineageId

  // Cross-lineage birth: blended lineage ID marks hybrid population; bridges both parents
  if (rootA !== rootB) {
    const [lo, hi] = [rootA, rootB].sort()
    return `${lo.slice(0, 8)}+${hi.slice(0, 8)}`
  }

  // Generation-interval fork: primary divergence mechanism.
  // Every LINEAGE_FORK_INTERVAL generations, offspring have a LINEAGE_FORK_CHANCE
  // of branching into a distinct sub-lineage. Gen 1 is excluded to preserve the
  // founding cohesion window.
  if (generation > 1 && generation % LINEAGE_FORK_INTERVAL === 0 && rng() < LINEAGE_FORK_CHANCE) {
    const branchSuffix = Math.floor(rng() * 0xffff).toString(16).padStart(4, '0')
    return `${rootA}_${branchSuffix}`
  }

  // Pressure-based fork: geographic separation + stress + inter-lineage hostility.
  // Threshold lowered to 0.40 so it is reachable under realistic breeding conditions.
  if (divergencePressure >= 0.40) {
    const branchSuffix = Math.floor(rng() * 0xffff).toString(16).padStart(4, '0')
    return `${rootA}_${branchSuffix}`
  }

  return primary.lineageId
}

export function createOffspring(
  parentA: Creature,
  parentB: Creature,
  x: number,
  y: number,
  currentDay: number,
  rng: () => number,
  mutationChance?: number,
  tribalLexicon: string[] = [],
  envCtx?: EnvContext,
  divergencePressure = 0,  // 0-1; computed by caller from geographic/stress/resource signals
): Creature {
  // Fitness-weighted inheritance: healthier, less-stressed parents pass on more traits.
  // The probability of inheriting parentA's trait rises with parentA's relative fitness.
  const fitnessA = computeParentFitness(parentA)
  const fitnessB = computeParentFitness(parentB)
  const parentBias = (fitnessA + 0.01) / (fitnessA + fitnessB + 0.02)  // avoids div-by-zero

  // Adaptive mutation: parental crisis (high joint stress, low health) nudges the
  // offspring mutation rate upward — a realistic response to environmental pressure.
  const avgParentStress = (parentA.stress + parentB.stress) / 2
  const crisisBoost = avgParentStress > 70
    ? MUTATION_CRISIS_BOOST_MAX * ((avgParentStress - 70) / 30)
    : 0
  const baseMutation = mutationChance ?? MUTATION_CHANCE
  const effectiveMutation = Math.min(0.28, baseMutation + crisisBoost)

  const behaviorSig = computeBehaviorSignature(parentA, parentB)
  const baseGenome = inheritGenome(parentA.genome, parentB.genome, rng, effectiveMutation, envCtx, parentBias, behaviorSig)
  const newAdaptation = envCtx ? acquireAdaptation(envCtx) : null
  const genome = {
    ...baseGenome,
    adaptations: inheritAdaptations(parentA.genome, parentB.genome, newAdaptation, rng),
  }
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
    lineageId: deriveLineageId(parentA, parentB, inheritFromA, divergencePressure, generation, rng),
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
  rng: () => number,
  envCtx?: EnvContext,
): Creature {
  const baseGenome = mutateGenomeAsexual(parent.genome, rng, ASEXUAL_MUTATION_CHANCE, envCtx)
  const newAdaptation = envCtx ? acquireAdaptation(envCtx) : null
  const genome = {
    ...baseGenome,
    adaptations: inheritAdaptations(parent.genome, null, newAdaptation, rng),
  }
  const c = spawnCreature({
    x, y,
    name: generateName(rng),
    familyName: mutateFamily(parent.familyName, rng),
    genome,
    generation: parent.generation + 1,
    parentIds: [parent.id, null],
    lineageId: deriveLineageId(parent, parent, true, 0, parent.generation + 1, rng),
    bornOnDay: currentDay,
    knownEmoji: inheritEmoji(parent, null, [], rng),
  }, rng)

  // Track asexual morphology mutations as a special case (clones always mutate)
  const parentMorph = parent.genome.morphology
  const offMorph = genome.morphology

  // Check if morphology changed significantly (any trait drifted > 0.05)
  const limbChanged = Math.abs(offMorph.limbLength - parentMorph.limbLength) > 0.05
  const spineChanged = Math.abs(offMorph.spinalLength - parentMorph.spinalLength) > 0.05
  const sizeChanged = Math.abs(offMorph.sizeScale - parentMorph.sizeScale) > 0.05

  if (limbChanged || spineChanged || sizeChanged) {
    c.recentMutation = currentDay
    c.mutatedTraits = ['morphology']
    c.currentThought = 'mutated'
    c.thoughtTimer = 30
  }

  return c
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
    // Starters are homozygous: both alleles identical, matching the expressed trait.
    // New alleles can only enter the population through mutation pressure, not at random.
    personalityAlleles: [personalities[i], personalities[i]] as [PersonalityTrait, PersonalityTrait],
    bodyAlleles:        [bodies[i], bodies[i]] as [BodyTrait, BodyTrait],
    mindAlleles:        [minds[i], minds[i]] as [MindTrait, MindTrait],
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
// Sentience is not a timer — it is an accumulation of lived experience.
// The base rate (SENTIENCE_GROWTH_BY_MIND) is a biological floor: a Sentinel in
// isolation still has a richer inner world than a Feral in a crowd, but the ceiling
// is unlocked only by what actually happens to the creature.
//
// Experience weight (0-100) is accumulated separately via recordExperience() and
// decays very slowly — trauma and discovery leave lasting marks.
// The final growth each tick = base_rate × mind_multiplier + experience_pressure.
// Above sentience 70, regression is possible if the creature is completely isolated
// and has no recent experiences — awareness that goes untested fades.

export function tickSentience(creature: Creature): number {
  if (creature.genome.mind === 'Feral') return creature.sentience // Feral: no awakening

  const baseRate = SENTIENCE_GROWTH_BY_MIND[creature.genome.mind] ?? 0

  // Experience pressure: accumulated weight drives meaningful growth beyond the floor
  const expWeight = creature.experienceWeight ?? 0
  const experiencePressure = (expWeight / 100) * baseRate * 4  // up to 4× base from experience

  // Bond depth: a strong social network amplifies reflection and self-awareness
  const strongBonds = creature.bonds.filter(b => b.strength >= REPRODUCE_BOND_MIN_STRENGTH).length
  const bondMultiplier = Math.min(2.0, 1.0 + strongBonds * 0.25)

  // Solitude drag: above sentience 70, untested awareness slowly regresses without bonds
  let regressionDrag = 0
  if (creature.sentience >= 70 && strongBonds === 0) {
    regressionDrag = baseRate * 2  // pulls back — awareness without reflection fades
  }

  const delta = (baseRate + experiencePressure) * bondMultiplier - regressionDrag
  return Math.max(0, Math.min(100, creature.sentience + delta))
}

// ─── Record an experience event on a creature ─────────────────────────────────
// Mutates the creature in place. Each event type contributes a weighted burst to
// experienceWeight; different mind types feel experiences differently.
// Returns the experience weight delta applied.
export function recordExperience(
  creature: Creature,
  event: import('@/types').ExperienceEventType,
  currentDay: number
): number {
  if (creature.genome.mind === 'Feral') return 0  // Feral creatures don't accumulate experience

  // Cooldown per event type: don't let the same stimulus repeat-farm sentience
  const cooldowns: Record<string, number> = {
    bond_formed: 30, bond_lost: 5, witnessed_death: 3, raised_offspring: 20,
    survived_starvation: 10, survived_combat: 5, discovered_biome: 60,
    long_solitude: 15, caretaker_contact: 10, cross_lineage_bond: 30,
  }
  const log = creature.experienceLog ?? {}
  const lastDay = log[event] ?? -999
  const cooldown = cooldowns[event] ?? 20
  if (currentDay - lastDay < cooldown) return 0

  // Base weights per event type
  const weights: Record<string, number> = {
    bond_formed: 8, bond_lost: 12, witnessed_death: 10, raised_offspring: 9,
    survived_starvation: 7, survived_combat: 8, discovered_biome: 5,
    long_solitude: 4, caretaker_contact: 6, cross_lineage_bond: 10,
  }

  // Mind-type sensitivity: Dreaming and Sentinel feel experiences more deeply
  const sensitivity: Record<string, number> = {
    Aware: 1.0, Dreaming: 1.6, Sentinel: 1.4,
  }

  const baseWeight = weights[event] ?? 5
  const delta = baseWeight * (sensitivity[creature.genome.mind] ?? 1.0)

  creature.experienceLog = { ...log, [event]: currentDay }
  creature.experienceWeight = Math.min(100, (creature.experienceWeight ?? 0) + delta)
  return delta
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

export function computeAwarenessStage(state: GameState): MessageStage {
  // Awareness stage is now purely derived from cognitionPressure — the continuous
  // gradient computed in tick.ts from five orthogonal colony-wide signals.
  // There are no binary gates or separate condition checks here; the stage label
  // is just a human-readable band over the underlying pressure score.
  //
  // Band thresholds are matched to the pressure contributions:
  //   Stage 1 → 2 : pressure ≥ 15   (early role diversity + any vocab)
  //   Stage 2 → 3 : pressure ≥ 35   (lexicon depth + sentience starting)
  //   Stage 3 → 4 : pressure ≥ 60   (broad sentience + lineage complexity)
  //   Stage 4 → 5 : pressure ≥ 85   (deep ancestral & experience breadth)
  //
  // Regression is real: if the colony degrades (mass death, loss of roles,
  // vocabulary collapse) the stage can fall back. This is intentional —
  // awareness is earned by the living colony, not banked from the past.
  const cp = state.cognitionPressure ?? 0
  if (cp >= 85) return 5
  if (cp >= 60) return 4
  if (cp >= 35) return 3
  if (cp >= 15) return 2
  return 1
}