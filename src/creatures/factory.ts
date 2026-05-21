import { v4 as uuid } from 'uuid'
import { Creature, CreatureDrives, Genome, PersonalityTrait, BodyTrait, MindTrait, EnvContext } from '@/types'
import {
  MAX_AGE_BY_BODY,
  SENTIENCE_GROWTH_BY_MIND,
  WORLD_SIZE,
  ASEXUAL_MUTATION_CHANCE,
  MUTATION_CHANCE,
  MUTATION_CRISIS_BOOST_MAX,
  REPRODUCE_BOND_MIN_STRENGTH,
  DRIVE_SEED_STRENGTH,
  DRIVE_PERSONALITY_SEEDS,
  STARTER_BOND_STRENGTH,
  STARTER_SPAWN_RADIUS,
  STARTER_AGE_STAGGER_FRACTION,
  MAX_AGE_VARIANCE_FRACTION,
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

// ─── Drive initialization ────────────────────────────────────────────────────
// Seeds a creature's drives from personality with random variance.
// All unspecified drives default to 0.3 (neutral baseline).
export function seedDrives(personality: string, rng: () => number): CreatureDrives {
  const defaults: CreatureDrives = {
    dominance: 0.3, curiosity: 0.3, sociality: 0.3,
    vigilance: 0.3, acquisitive: 0.3, reclusion: 0.3, mobility: 0.3,
  }
  const seed = DRIVE_PERSONALITY_SEEDS[personality] ?? {}
  const drives: CreatureDrives = { ...defaults }
  for (const key of Object.keys(drives) as (keyof CreatureDrives)[]) {
    const target = (seed[key] ?? 0.3) * DRIVE_SEED_STRENGTH + 0.3 * (1 - DRIVE_SEED_STRENGTH)
    drives[key] = Math.max(0, Math.min(1, target + (rng() - 0.5) * 0.12))
  }
  return drives
}

// Blends two parent drive sets for sexual offspring; slight mutation variance.
function inheritDrives(parentA: CreatureDrives, parentB: CreatureDrives, rng: () => number): CreatureDrives {
  const drives: CreatureDrives = {
    dominance: 0, curiosity: 0, sociality: 0,
    vigilance: 0, acquisitive: 0, reclusion: 0, mobility: 0,
  }
  for (const key of Object.keys(drives) as (keyof CreatureDrives)[]) {
    const mid = (parentA[key] + parentB[key]) / 2
    drives[key] = Math.max(0, Math.min(1, mid + (rng() - 0.5) * 0.08))
  }
  return drives
}

export function spawnCreature(
  overrides: Partial<Creature> & {
    x: number
    y: number
    name: string
    familyName: string
    genome?: Genome
    // Lifespan multiplier from SimModifiers.lifespanMult. Optional so callers
    // that don't have the modifiers (tests, fallback paths) get the v3 baseline.
    lifespanMult?: number
  },
  rng: () => number
): Creature {
  const genome = overrides.genome ?? randomGenome(rng)
  const id = uuid()
  const lifespanMult = overrides.lifespanMult ?? 1.0

  return {
    id,
    name: overrides.name,
    familyName: overrides.familyName,
    genome,
    generation: overrides.generation ?? 0,
    parentIds: overrides.parentIds ?? [null, null],
    lineageId: overrides.lineageId ?? id,

    age: 0,
    // maxAge scattered by ±MAX_AGE_VARIANCE_FRACTION so same-body cohort-mates
    // don't all die on the same tick. Floored at 60 ticks (1 game day) as a
    // guard — the variance never reaches that, but it keeps maxAge sane if a
    // future lifespanMult is set very low.
    maxAge: Math.max(
      60,
      Math.round(
        MAX_AGE_BY_BODY[genome.body] * lifespanMult
          * (1 + (rng() - 0.5) * 2 * MAX_AGE_VARIANCE_FRACTION),
      ),
    ),
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

    // behavioral drives; seeded from personality if not provided (e.g. from parent inheritance)
    drives: overrides.drives ?? seedDrives(genome.personality, rng),

    // bounded log of personally-observed events; the speech composer reads
    // from this to ground utterances in lived experience
    observedEvents: overrides.observedEvents ?? [],
    deathCause: undefined,
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
  _generation: number,
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
  adaptationInheritMult = 1.0,  // SimModifiers.adaptationInheritMult
  lifespanMult = 1.0,             // SimModifiers.lifespanMult — scales offspring's maxAge
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
    adaptations: inheritAdaptations(parentA.genome, parentB.genome, newAdaptation, rng, adaptationInheritMult),
  }
  const generation = Math.max(parentA.generation, parentB.generation) + 1

  const inheritFromA = rng() < 0.5
  const baseFamilyName = inheritFromA ? parentA.familyName : parentB.familyName
  const familyName = mutateFamily(baseFamilyName, rng)

  const mutatedTraits = detectMutations(genome, parentA, parentB)

  const parentDrivesA = parentA.drives ?? seedDrives(parentA.genome.personality, rng)
  const parentDrivesB = parentB.drives ?? seedDrives(parentB.genome.personality, rng)

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
    drives: inheritDrives(parentDrivesA, parentDrivesB, rng),
    lifespanMult,
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
  mutationMult = 1.0,
  adaptationInheritMult = 1.0,
  lifespanMult = 1.0,
): Creature {
  const baseGenome = mutateGenomeAsexual(parent.genome, rng, ASEXUAL_MUTATION_CHANCE * mutationMult, envCtx)
  const newAdaptation = envCtx ? acquireAdaptation(envCtx) : null
  const genome = {
    ...baseGenome,
    adaptations: inheritAdaptations(parent.genome, null, newAdaptation, rng, adaptationInheritMult),
  }
  const parentDrives = parent.drives ?? seedDrives(parent.genome.personality, rng)

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
    drives: inheritDrives(parentDrives, parentDrives, rng),
    lifespanMult,
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

// ─── Starter creature genomes: drawn from full pool, no forced composition ───
//
// Founding generation is a *random sample* of the full personality/body/mind
// space — drawn from the worldSeed-derived RNG. There are no enforced
// constraints: any combination of bodies, any personality (including
// Aggressive), any mind can appear at genesis. A colony that happens to start
// with three Aggressives is a hard one; a colony with all Feral may never
// achieve speech. The world generator does not curate playability.
//
// Diploid alleles are now also drawn independently per slot, so starters are
// not forced homozygous. The hidden allele pool is real from tick zero, which
// makes mutation surface latent traits sooner.
//
// Starters spawn in a tight cluster around the world centroid and share one
// founding lineageId with pre-seeded bonds — they are the colony's first
// generation, not rival strangers. See createStarterCreatures below.

const ALL_PERSONALITIES: PersonalityTrait[] = [
  'Curious', 'Timid', 'Aggressive', 'Lazy', 'Greedy', 'Nurturing', 'Wanderer',
  'Recluse', 'Hoarder', 'Empath', 'Furtive', 'Territorial', 'Social', 'Stoic',
  'Scavenger', 'Mimic', 'Nomadic', 'Vigilant', 'Symbiotic',
]
const ALL_BODIES: BodyTrait[] = ['Spore', 'Shell', 'Spike', 'Wisp']
const ALL_MINDS: MindTrait[] = ['Feral', 'Aware', 'Dreaming', 'Sentinel']

function pickStarterGenomes(rng: () => number, count: number): Genome[] {
  return Array.from({ length: count }, () => {
    // Expressed traits drawn independently from full pools
    const personality = ALL_PERSONALITIES[Math.floor(rng() * ALL_PERSONALITIES.length)]
    const body = ALL_BODIES[Math.floor(rng() * ALL_BODIES.length)]
    const mind = ALL_MINDS[Math.floor(rng() * ALL_MINDS.length)]
    // Hidden allele drawn independently — starters may carry recessives
    // that have not yet surfaced. Mutation can reach them on first birth.
    const persAllele = rng() < 0.7 ? personality
      : ALL_PERSONALITIES[Math.floor(rng() * ALL_PERSONALITIES.length)]
    const bodyAllele = rng() < 0.7 ? body
      : ALL_BODIES[Math.floor(rng() * ALL_BODIES.length)]
    const mindAllele = rng() < 0.7 ? mind
      : ALL_MINDS[Math.floor(rng() * ALL_MINDS.length)]
    return {
      personality, body, mind,
      personalityAlleles: [personality, persAllele] as [PersonalityTrait, PersonalityTrait],
      bodyAlleles:        [body, bodyAllele] as [BodyTrait, BodyTrait],
      mindAlleles:        [mind, mindAllele] as [MindTrait, MindTrait],
      morphSeed: rng(),
      morphology: initMorphology(),
      race: RACES[Math.floor(rng() * RACES.length)],
      latentAncestry: {},
    }
  })
}

export function createStarterCreatures(
  namedPairs: { name: string; familyName: string }[],
  worldSeed: number,
  currentDay: number,
  lifespanMult = 1.0,
): Creature[] {
  const rng = createRng(worldSeed + 9999)
  const count = 4
  // Tight founder cluster: every starter spawns within STARTER_SPAWN_RADIUS
  // of the world centroid, so bonds can form before the first cohort ages out.
  // Combined with pre-seeded bonds below, founders reach breeding strength
  // (REPRODUCE_BOND_MIN_STRENGTH) within their first lifespan rather than dying
  // isolated in opposite quadrants of a 480-tile world.
  const cx = Math.floor(WORLD_SIZE / 2)
  const cy = Math.floor(WORLD_SIZE / 2)
  const positions = Array.from({ length: count }, () => {
    const angle = rng() * Math.PI * 2
    const dist  = rng() * STARTER_SPAWN_RADIUS
    return {
      x: Math.max(1, Math.min(WORLD_SIZE - 2, cx + Math.round(Math.cos(angle) * dist))),
      y: Math.max(1, Math.min(WORLD_SIZE - 2, cy + Math.round(Math.sin(angle) * dist))),
    }
  })

  const genomes = pickStarterGenomes(rng, count)

  // The founding generation is one colony, not four rival lineages. Every
  // founder shares a single founding lineageId so the engine does not treat
  // them as hostile strangers from tick zero — that mislabel was driving
  // rival-proximity stress, dominance-fuelled rival pursuit, and lineage-clash
  // messages among creatures that are explicitly pre-bonded below. Offspring
  // still diverge into distinct lineages over generations via deriveLineageId's
  // divergence-pressure fork; fracture stays the slow, emergent process it is
  // meant to be. Founders keep their distinct familyNames (tribe naming).
  const foundingLineageId = uuid()

  const creatures = Array.from({ length: count }, (_, i) => {
    const pair = namedPairs[i] ?? {
      name:       generateName(rng),
      familyName: generateName(rng),
    }
    return spawnCreature({
      ...pair,
      ...positions[i],
      genome:    genomes[i],
      lineageId: foundingLineageId,
      bornOnDay: currentDay,
      lifespanMult,
    }, rng)
  })

  // Stagger founder starting ages across STARTER_AGE_STAGGER_FRACTION of each
  // one's lifespan. Founders all spawn simultaneously; if they also all start
  // at age 0 they age out together and the colony pulses boom-bust. A spread of
  // ages means the founding generation dies gradually and seeds an overlapping
  // age structure. Newborn stats (health, needs) are untouched — only the age
  // counter shifts — so an "older" founder is just closer to its own maxAge.
  for (const creature of creatures) {
    creature.age = Math.floor(rng() * STARTER_AGE_STAGGER_FRACTION * creature.maxAge)
  }

  // Pre-seed bonds between every founder pair at STARTER_BOND_STRENGTH (below
  // the breeding threshold so bond-seeking stays active, but high enough that
  // bonds reach reproductive depth in tens of ticks, not hundreds).
  for (let i = 0; i < creatures.length; i++) {
    for (let j = 0; j < creatures.length; j++) {
      if (i === j) continue
      creatures[i].bonds.push({
        targetId: creatures[j].id,
        strength: STARTER_BOND_STRENGTH,
        since:    currentDay,
      })
    }
  }

  return creatures
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
// Awareness is now evaluated directly in tick.ts from creature-level
// distributions (median sentience, role diversity, lineage depth, transcendent
// elder presence) with persistence hysteresis. The smoothed pressure-meter
// has been removed. `state.awarenessStage` is the live label — read it directly.