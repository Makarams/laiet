import { Genome, PersonalityTrait, BodyTrait, MindTrait, MorphologyTraits, RaceTrait, AdaptationTrait, EnvContext, TileType } from '@/types'
import {
  MUTATION_CHANCE,
  LATENT_REVIVAL_BASE, LATENT_DEPTH_BONUS, LATENT_MAX_DEPTH, LATENT_DOMINANT_WEIGHT,
  ADAPTATION_INHERIT_CHANCE, ADAPTATION_MAX,
  BLOOM_HUNGER_THRESHOLD, TIDE_WATER_SEEK_RADIUS,
} from './constants'

export const PERSONALITIES: PersonalityTrait[] = [
  'Curious', 'Timid', 'Aggressive', 'Lazy', 'Greedy', 'Nurturing', 'Wanderer', 'Recluse',
  'Hoarder', 'Empath', 'Furtive', 'Territorial', 'Social', 'Stoic',
  'Scavenger', 'Mimic', 'Nomadic', 'Vigilant', 'Symbiotic',
]
export const BODIES: BodyTrait[] = ['Spore', 'Shell', 'Spike', 'Wisp']
export const MINDS: MindTrait[] = ['Feral', 'Aware', 'Dreaming', 'Sentinel']
export const RACES: RaceTrait[] = ['Kin', 'Drift', 'Burrow', 'Apex', 'Pale', 'Tide', 'Bloom', 'Ash', 'Ember', 'Mire', 'Crag', 'Veil']

// ─── Race behavioral profiles ─────────────────────────────────────────────────
// Centralizes all race-specific behavioral modifiers. Replacing scattered
// `c.genome.race === 'X'` checks so adding a new race only requires this table.
export interface RaceProfile {
  terrainAffinity?: TileType[]       // preferred tile types for habitat movement
  stressModifier?: number            // passive stress delta added each tick (negative = relief)
  hungerThresholdOverride?: number   // lower food-amount threshold before seeking food
  waterSeekRadiusOverride?: number   // detection radius for water tiles
  wanderRangeMult?: number           // multiplier on base wandering distance
  fightBonus?: number                // flat bonus to attack power in combat
}

export const RACE_PROFILES: Partial<Record<RaceTrait, RaceProfile>> = {
  Ash:    { terrainAffinity: ['barren'], stressModifier: -0.06 },
  Bloom:  { terrainAffinity: ['food_patch', 'bush'], hungerThresholdOverride: BLOOM_HUNGER_THRESHOLD },
  Tide:   { terrainAffinity: ['river', 'mud'], waterSeekRadiusOverride: TIDE_WATER_SEEK_RADIUS },
  Burrow: { terrainAffinity: ['cave'] },
  Pale:   { terrainAffinity: ['cave'] },
  Drift:  { wanderRangeMult: 1.5 },
  Apex:   { fightBonus: 0.5 },
  Ember:  { terrainAffinity: ['barren'], stressModifier: -0.04 },  // fire-adapted; heat tolerance
  Mire:   { terrainAffinity: ['mud', 'flooded'], waterSeekRadiusOverride: 20 },  // wetland-specialist
  Crag:   { terrainAffinity: ['rock', 'cave'], wanderRangeMult: 0.7 },  // rugged mountain-dwellers
  Veil:   { terrainAffinity: ['cave', 'shelter'], stressModifier: -0.03 },  // mist-born; concealment seekers
  Kin:    {},  // Kin advantage is in tick.ts (group defense, kin-lineage recognition)
}

// ─── Behavioral reinforcement signal ─────────────────────────────────────────
// Derived from parent stats at reproduction time; biases which traits emerge
// during mutation events without requiring per-tick behavioral logging.
export interface BehaviorSig {
  combatBias: number        // 0-1; high kill count → Spike body more likely to mutate in
  socialBias: number        // 0-1; many bonds → Wisp/Social personality bias
  reproductiveBias: number  // 0-1; many offspring → Spore body bias
  survivalBias: number      // 0-1; longevity (age/maxAge ratio) → Shell body bias
}

// ─── Morphology helpers ───────────────────────────────────────────────────────

// Neutral baseline for gen-0 creatures; each reproduction event drifts these.
// limbLength/spinalLength start above 0 so the first generation already shows
// rudimentary pseudopods/tails, giving sexual blending a non-zero base to build on.
export function initMorphology(): MorphologyTraits {
  return { sizeScale: 1.0, limbLength: 0.15, spinalLength: 0.15, colorDrift: 0.0, eyeSize: 1.0 }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

// Sexual inheritance: bias toward the higher-trait parent so advantageous
// morphology compounds across generations rather than regressing to the mean.
// Pure averaging causes visual stagnation when starting from near-zero values.
// Optional envBias applies directional pressure from the birth environment.
function inheritMorphology(a: MorphologyTraits, b: MorphologyTraits, rng: () => number, envBias?: MorphBias): MorphologyTraits {
  const m = a ?? initMorphology()
  const n = b ?? initMorphology()
  // Weighted blend: 60% from the higher-trait parent, 40% from the lower.
  const hi = (x: number, y: number) => Math.max(x, y) * 0.60 + Math.min(x, y) * 0.40
  return {
    sizeScale:    clamp(hi(m.sizeScale,    n.sizeScale)    + (rng() - 0.5) * 0.12 + (envBias?.sizeBias   ?? 0), 0.70, 1.50),
    limbLength:   clamp(hi(m.limbLength,   n.limbLength)   + (rng() - 0.5) * 0.18 + (envBias?.limbBias   ?? 0), 0.00, 1.00),
    spinalLength: clamp(hi(m.spinalLength, n.spinalLength) + (rng() - 0.5) * 0.18 + (envBias?.spinalBias ?? 0), 0.00, 1.00),
    colorDrift:   clamp(hi(m.colorDrift,   n.colorDrift)   + (rng() - 0.5) * 0.09,                             -0.50, 0.50),
    eyeSize:      clamp(hi(m.eyeSize,      n.eyeSize)      + (rng() - 0.5) * 0.12 + (envBias?.eyeBias    ?? 0), 0.70, 1.50),
  }
}

// Environmental morphology bias: birth conditions nudge continuous trait drift
// in a directional way, so wetland lineages accumulate limbLength faster,
// cave lineages grow eyeSize, cold lineages grow larger, etc.
interface MorphBias { limbBias: number; spinalBias: number; sizeBias: number; eyeBias: number }

function computeMorphBias(env: EnvContext): MorphBias {
  let limbBias = 0, spinalBias = 0, sizeBias = 0, eyeBias = 0
  const { biome, weather, season } = env
  if (biome === 'wetland')                             { limbBias  += 0.06; sizeBias   -= 0.02 }
  if (biome === 'rocky')                               { eyeBias   += 0.06; spinalBias -= 0.02 }
  if (biome === 'arid')                                { sizeBias  -= 0.05; spinalBias += 0.03 }
  if (biome === 'lush')                                { limbBias  += 0.03 }
  if (season === 'winter' || weather === 'snow')       { sizeBias  += 0.05 }
  if (weather === 'heatwave' || weather === 'drought') { sizeBias  -= 0.04; spinalBias += 0.03 }
  if (weather === 'rain'    || weather === 'storm')    { limbBias  += 0.03 }
  return { limbBias, spinalBias, sizeBias, eyeBias }
}

// Returns the single adaptation trait an offspring can acquire from its birth environment,
// or null if conditions don't favour a specific trait. Priority order matters — each
// early return narrows the remaining type space for TypeScript.
export function acquireAdaptation(env: EnvContext): AdaptationTrait | null {
  const { biome, weather, season } = env
  // Heavy snowfall in winter → broad insulation (stronger than cold_hardy alone)
  if (season === 'winter' && weather === 'snow')  return 'thick_pelt'
  if (season === 'winter' || weather === 'snow')  return 'cold_hardy'
  // After here: season ∈ {spring,summer,autumn}, weather ∈ {clear,rain,storm,drought,heatwave,fog}
  if (weather === 'fog')                          return 'bioluminescent'
  // After here: weather ≠ fog
  if (weather === 'storm' && biome === 'rocky')   return 'ridge_armor'
  if (biome === 'wetland')                        return 'hydro_fins'
  // rocky + rain develops echolocation instead of generic cave adaptation
  if (biome === 'rocky' && weather === 'rain')    return 'echo_sense'
  if (biome === 'rocky')                          return 'cave_sighted'
  if (weather === 'heatwave' && season === 'summer') return 'heat_plated'
  // arid + drought (non-heatwave): sustained heat tolerance from harsh dry cycles
  if (biome === 'arid' && weather === 'drought')  return 'thermal_vent'
  if (weather === 'drought' || biome === 'arid')  return 'drought_tough'
  if (biome === 'lush' && weather === 'rain')     return 'spore_resistant'
  if (biome === 'lush' || (biome === 'temperate' && season === 'spring')) return 'root_eater'
  if (weather === 'storm')                        return 'storm_braced'
  return null
}

// Inherits adaptations from both parents (65% each) and adds the new birth adaptation.
// Deduplicates and caps at ADAPTATION_MAX to prevent infinite stacking.
export function inheritAdaptations(
  parentA: Genome,
  parentB: Genome | null,
  newAdaptation: AdaptationTrait | null,
  rng: () => number,
): AdaptationTrait[] {
  const pool = new Set<AdaptationTrait>()
  for (const a of (parentA.adaptations ?? []))
    if (rng() < ADAPTATION_INHERIT_CHANCE) pool.add(a)
  if (parentB) {
    for (const a of (parentB.adaptations ?? []))
      if (rng() < ADAPTATION_INHERIT_CHANCE) pool.add(a)
  }
  if (newAdaptation) pool.add(newAdaptation)
  return [...pool].slice(0, ADAPTATION_MAX)
}

// Asexual mutation; single parent but larger drift per trait; clonal lines
// diverge faster, producing visibly distinct sub-populations over fewer generations.
function mutateMorphologyAsexual(parent: MorphologyTraits, rng: () => number): MorphologyTraits {
  const m = parent ?? initMorphology()
  return {
    sizeScale:    clamp(m.sizeScale    + (rng() - 0.5) * 0.24, 0.70, 1.50),
    limbLength:   clamp(m.limbLength   + (rng() - 0.5) * 0.30, 0.00, 1.00),
    spinalLength: clamp(m.spinalLength + (rng() - 0.5) * 0.30, 0.00, 1.00),
    colorDrift:   clamp(m.colorDrift   + (rng() - 0.5) * 0.17, -0.50, 0.50),
    eyeSize:      clamp(m.eyeSize      + (rng() - 0.5) * 0.24, 0.70, 1.50),
  }
}

export function randomGenome(rng: () => number): Genome {
  const personality = PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)]
  const body        = BODIES[Math.floor(rng() * BODIES.length)]
  const mind        = MINDS[Math.floor(rng() * MINDS.length)]
  return {
    personality,
    body,
    mind,
    // Gen-0 creatures are homozygous: both alleles identical so traits cannot
    // appear without inheritance or mutation pressure.
    personalityAlleles: [personality, personality],
    bodyAlleles:        [body, body],
    mindAlleles:        [mind, mind],
    morphSeed: rng(),
    morphology: initMorphology(),
    race: RACES[Math.floor(rng() * RACES.length)],
    latentAncestry: {},
  }
}

// ─── Race inheritance with latent ancestry ────────────────────────────────────

// Merges two parents' latent ancestry maps, incrementing depth for each dormant
// race. Prunes entries that have exceeded LATENT_MAX_DEPTH.
function mergeLatentAncestry(
  a: Partial<Record<RaceTrait, number>>,
  b: Partial<Record<RaceTrait, number>>,
  expressed: RaceTrait | undefined,
): Partial<Record<RaceTrait, number>> {
  const merged: Partial<Record<RaceTrait, number>> = {}
  const all = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<RaceTrait>
  for (const race of all) {
    if (race === expressed) continue   // expressed race is not latent
    const depth = Math.max(a[race] ?? 0, b[race] ?? 0) + 1
    if (depth <= LATENT_MAX_DEPTH) merged[race] = depth
  }
  return merged
}

// Returns the race for a new offspring, checking for latent revival before
// applying dominant/recessive inheritance.
export function inheritRace(
  parentA: Genome,
  parentB: Genome,
  rng: () => number,
): { race: RaceTrait; latentAncestry: Partial<Record<RaceTrait, number>> } {
  const raceA = parentA.race
  const raceB = parentB.race
  const latA = parentA.latentAncestry ?? {}
  const latB = parentB.latentAncestry ?? {}

  // Check every latent race from both parents for revival
  const allLatent = new Set([...Object.keys(latA), ...Object.keys(latB)]) as Set<RaceTrait>
  for (const dormant of allLatent) {
    const depth = Math.max(latA[dormant] ?? 0, latB[dormant] ?? 0)
    const revivalChance = LATENT_REVIVAL_BASE + depth * LATENT_DEPTH_BONUS
    if (rng() < revivalChance) {
      // Dormant race resurfaces; its former latent peers become the new ancestry
      const latency = mergeLatentAncestry(latA, latB, dormant)
      // Add both parents' expressed races as newly dormant
      if (raceA && raceA !== dormant) latency[raceA] = (latency[raceA] ?? 0) + 1
      if (raceB && raceB !== dormant) latency[raceB] = (latency[raceB] ?? 0) + 1
      return { race: dormant, latentAncestry: latency }
    }
  }

  // Normal dominant/recessive inheritance
  const expressed = raceA && raceB
    ? (rng() < LATENT_DOMINANT_WEIGHT ? raceA : raceB)
    : raceA ?? raceB ?? RACES[Math.floor(rng() * RACES.length)]

  const latency = mergeLatentAncestry(latA, latB, expressed)
  // The non-expressed parent race becomes latent
  const recessive = expressed === raceA ? raceB : raceA
  if (recessive && recessive !== expressed) {
    latency[recessive] = (latency[recessive] ?? 0) + 1
  }

  return { race: expressed, latentAncestry: latency }
}

// ─── Allele resolution ───────────────────────────────────────────────────────

function resolveAlleles<T extends string>(
  a: T,
  b: T,
  dominance: Record<string, number>,
): { expressed: T; recessive: T } {
  if (a === b) return { expressed: a, recessive: a }
  const domA = dominance[a] ?? 0.5
  const domB = dominance[b] ?? 0.5
  return domA >= domB ? { expressed: a, recessive: b } : { expressed: b, recessive: a }
}

function weightedPick<T>(pool: T[], weights: number[], rng: () => number): T {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = rng() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

// ─── Trait dominance & environmental pressure ─────────────────────────────────

const BODY_DOMINANCE: Record<BodyTrait, number> = {
  Spike: 0.62,
  Shell: 0.58,
  Wisp:  0.46,
  Spore: 0.38,
}

const MIND_DOMINANCE: Record<MindTrait, number> = {
  Sentinel: 0.62,
  Dreaming: 0.55,
  Aware:    0.50,
  Feral:    0.36,
}

// Dominant traits (value > 0.5) win allele competition in heterozygous pairs.
// Assertive, mobile traits spread more readily; passive, shy traits recede.
const PERSONALITY_DOMINANCE: Record<PersonalityTrait, number> = {
  Aggressive:  0.62,
  Territorial: 0.60,
  Vigilant:    0.57,
  Curious:     0.56,
  Wanderer:    0.55,
  Nomadic:     0.54,
  Social:      0.54,
  Greedy:      0.53,
  Scavenger:   0.53,
  Nurturing:   0.52,
  Hoarder:     0.51,
  Stoic:       0.50,
  Symbiotic:   0.50,
  Empath:      0.49,
  Recluse:     0.48,
  Mimic:       0.48,
  Furtive:     0.46,
  Lazy:        0.44,
  Timid:       0.42,
}

// Returns a small probability nudge toward a candidate personality given birth conditions.
// Positive = env favours this trait; negative = env disfavours it.
// Applied subtly so ecological pressure accumulates over many generations.
function personalityEnvBonus(env: EnvContext, candidate: PersonalityTrait): number {
  const { biome, weather, season } = env
  let bonus = 0
  if (biome === 'arid') {
    if (candidate === 'Wanderer' || candidate === 'Stoic' || candidate === 'Greedy') bonus += 0.05
    if (candidate === 'Scavenger' || candidate === 'Nomadic') bonus += 0.05
    if (candidate === 'Nurturing' || candidate === 'Social' || candidate === 'Lazy') bonus -= 0.04
  }
  if (biome === 'wetland') {
    if (candidate === 'Social' || candidate === 'Nurturing' || candidate === 'Empath') bonus += 0.05
    if (candidate === 'Symbiotic' || candidate === 'Mimic') bonus += 0.04
    if (candidate === 'Aggressive' || candidate === 'Recluse') bonus -= 0.04
  }
  if (biome === 'rocky') {
    if (candidate === 'Recluse' || candidate === 'Stoic' || candidate === 'Territorial') bonus += 0.05
    if (candidate === 'Vigilant') bonus += 0.05
    if (candidate === 'Social' || candidate === 'Empath') bonus -= 0.04
  }
  if (biome === 'lush') {
    if (candidate === 'Curious' || candidate === 'Social' || candidate === 'Nurturing') bonus += 0.04
    if (candidate === 'Symbiotic' || candidate === 'Mimic') bonus += 0.04
  }
  if (season === 'winter') {
    if (candidate === 'Hoarder' || candidate === 'Stoic' || candidate === 'Greedy') bonus += 0.04
    if (candidate === 'Scavenger') bonus += 0.04
    if (candidate === 'Lazy' || candidate === 'Social') bonus -= 0.04
  }
  if (weather === 'drought' || weather === 'heatwave') {
    if (candidate === 'Wanderer' || candidate === 'Aggressive') bonus += 0.04
    if (candidate === 'Nomadic' || candidate === 'Scavenger') bonus += 0.04
    if (candidate === 'Lazy') bonus -= 0.04
  }
  if (weather === 'storm') {
    if (candidate === 'Vigilant' || candidate === 'Nomadic') bonus += 0.04
    if (candidate === 'Timid' || candidate === 'Lazy') bonus -= 0.04
  }
  return bonus
}

// Environmental fitness bonus for body mutations.
// Positive = this body type is favored by current conditions; biases weighted mutation sampling.
function bodyEnvBonus(env: EnvContext, candidate: BodyTrait): number {
  const { biome, weather, season } = env
  let bonus = 0
  if (biome === 'rocky' || weather === 'storm')         { if (candidate === 'Shell') bonus += 0.06; if (candidate === 'Spore') bonus -= 0.05 }
  if (biome === 'wetland')                              { if (candidate === 'Wisp')  bonus += 0.06; if (candidate === 'Shell') bonus -= 0.03 }
  if (weather === 'drought' || weather === 'heatwave')  { if (candidate === 'Wisp')  bonus -= 0.05; if (candidate === 'Spore') bonus += 0.04 }
  if (season === 'winter'   || weather === 'snow')      { if (candidate === 'Shell') bonus += 0.05; if (candidate === 'Spore') bonus -= 0.05 }
  return bonus
}

// Environmental fitness bonus for mind mutations.
// Extreme scarcity slightly favors pure instinct; otherwise higher cognition is broadly advantageous.
function mindEnvBonus(env: EnvContext, candidate: MindTrait): number {
  const { weather, season } = env
  let bonus = 0
  if (weather === 'drought' || weather === 'heatwave') { if (candidate === 'Feral') bonus += 0.04; if (candidate === 'Sentinel') bonus -= 0.03 }
  if (season === 'winter')                             { if (candidate === 'Feral') bonus += 0.03 }
  return bonus
}

// Picks a mutated personality weighted by environmental fitness.
// Unlike a random pool pick, this ensures new traits emerge because they are
// contextually advantageous — not arbitrarily.
function pickMutatedPersonality(envCtx: EnvContext | undefined, rng: () => number): PersonalityTrait {
  if (!envCtx) return PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)]
  const weights = PERSONALITIES.map(p => Math.max(0.05, 1.0 + personalityEnvBonus(envCtx, p) * 8))
  return weightedPick(PERSONALITIES, weights, rng)
}

// Picks a mutated body type weighted by environmental fitness AND behavioral reinforcement.
// Combat history, social bonding, reproductive output, and longevity each nudge the
// probability toward the body type that would have been most adaptive for the parent.
function pickMutatedBody(envCtx: EnvContext | undefined, sig: BehaviorSig | undefined, rng: () => number): BodyTrait {
  const weights = BODIES.map(b => {
    let w = 1.0
    if (envCtx) w = Math.max(0.05, w + bodyEnvBonus(envCtx, b) * 8)
    if (sig) {
      if (b === 'Spike') w *= (1 + sig.combatBias)
      if (b === 'Wisp')  w *= (1 + sig.socialBias * 0.6)
      if (b === 'Spore') w *= (1 + sig.reproductiveBias * 0.8)
      if (b === 'Shell') w *= (1 + sig.survivalBias * 0.7)
    }
    return Math.max(0.05, w)
  })
  return weightedPick(BODIES, weights, rng)
}

// Picks a mutated mind type weighted by environmental fitness.
function pickMutatedMind(envCtx: EnvContext | undefined, rng: () => number): MindTrait {
  if (!envCtx) return MINDS[Math.floor(rng() * MINDS.length)]
  const weights = MINDS.map(m => Math.max(0.05, 1.0 + mindEnvBonus(envCtx, m) * 6))
  return weightedPick(MINDS, weights, rng)
}

// ─── Dormancy ────────────────────────────────────────────────────────────────

// Returns whether personality and/or mind are currently dormant for a creature.
// A trait is dormant when it is heterozygous AND the dominant allele is an environmental
// mismatch while the recessive allele would be beneficial — the genotype carries the
// trait but current conditions suppress its behavioral expression.
// Callers use this to bypass personality-specific behavior and need penalties.
export function computeDormancy(genome: Genome, env: EnvContext): { personality: boolean; mind: boolean } {
  let personality = false
  let mind = false

  const pAlleles = genome.personalityAlleles
  if (pAlleles && pAlleles[0] !== pAlleles[1]) {
    const { expressed, recessive } = resolveAlleles(pAlleles[0], pAlleles[1], PERSONALITY_DOMINANCE)
    if (expressed === genome.personality) {
      const eb = personalityEnvBonus(env, expressed)
      const rb = personalityEnvBonus(env, recessive)
      if (eb < -0.025 && rb > 0.015) personality = true
    }
  }

  const mAlleles = genome.mindAlleles
  if (mAlleles && mAlleles[0] !== mAlleles[1]) {
    const { expressed, recessive } = resolveAlleles(mAlleles[0], mAlleles[1], MIND_DOMINANCE)
    // Mind dormancy: Feral dominates but the recessive awareness allele is more adaptive
    // in cognitively rich environments (lush/wetland biomes with social pressure).
    if (expressed === genome.mind
      && expressed === 'Feral'
      && (recessive === 'Aware' || recessive === 'Dreaming' || recessive === 'Sentinel')
      && (env.biome === 'lush' || env.biome === 'wetland')
    ) mind = true
  }

  return { personality, mind }
}

// ─── Sexual inheritance ───────────────────────────────────────────────────────

// Each parent contributes one allele from their diploid pair (50/50 within the pair).
// The two contributed alleles form the offspring's genotype; the expressed phenotype
// is resolved by dominance. Mutations replace exactly one allele with an env-biased
// and behaviorally-reinforced pick — not a random pool draw.
// parentBias (0..1): retained for morphology weighting; no longer gates discrete alleles.
export function inheritGenome(
  parentA: Genome,
  parentB: Genome,
  rng: () => number,
  mutationChance = MUTATION_CHANCE,
  envCtx?: EnvContext,
  parentBias = 0.5,
  behaviorSig?: BehaviorSig,
): Genome {
  // Pick one allele from a parent's diploid pair; treats old saves (no alleles) as homozygous.
  const pickFromPair = <T>(alleles: [T, T] | undefined, expressed: T): T =>
    alleles ? (rng() < 0.5 ? alleles[0] : alleles[1]) : expressed

  // --- Personality alleles ---
  let pA = pickFromPair(parentA.personalityAlleles, parentA.personality)
  let pB = pickFromPair(parentB.personalityAlleles, parentB.personality)
  if (rng() < mutationChance) {
    // Mutation: one allele is replaced by an env-biased pick rather than a random draw.
    if (rng() < 0.5) pA = pickMutatedPersonality(envCtx, rng)
    else             pB = pickMutatedPersonality(envCtx, rng)
  } else if (envCtx) {
    // Non-mutation nudge: if the dominant allele is env-negative and the recessive is positive,
    // occasionally swap them — mild directional pressure over many generations.
    const { expressed, recessive } = resolveAlleles(pA, pB, PERSONALITY_DOMINANCE)
    if (personalityEnvBonus(envCtx, expressed) < -0.02
      && personalityEnvBonus(envCtx, recessive) > 0.01
      && rng() < 0.08) {
      if (pA === expressed) { pA = recessive; pB = expressed }
      else                  { pA = expressed; pB = recessive }
    }
  }
  const personality = resolveAlleles(pA, pB, PERSONALITY_DOMINANCE).expressed

  // --- Body alleles ---
  let bA = pickFromPair(parentA.bodyAlleles, parentA.body)
  let bB = pickFromPair(parentB.bodyAlleles, parentB.body)
  if (rng() < mutationChance) {
    if (rng() < 0.5) bA = pickMutatedBody(envCtx, behaviorSig, rng)
    else             bB = pickMutatedBody(envCtx, behaviorSig, rng)
  }
  const body = resolveAlleles(bA, bB, BODY_DOMINANCE).expressed

  // --- Mind alleles ---
  let mA = pickFromPair(parentA.mindAlleles, parentA.mind)
  let mB = pickFromPair(parentB.mindAlleles, parentB.mind)
  if (rng() < mutationChance) {
    if (rng() < 0.5) mA = pickMutatedMind(envCtx, rng)
    else             mB = pickMutatedMind(envCtx, rng)
  }
  const mind = resolveAlleles(mA, mB, MIND_DOMINANCE).expressed

  const inheritedSeed = rng() < parentBias ? parentA.morphSeed : parentB.morphSeed
  const seedDrift = (rng() - 0.5) * 0.18
  const morphSeed = clamp01(inheritedSeed + seedDrift)

  const { race, latentAncestry } = inheritRace(parentA, parentB, rng)

  return {
    personality,
    body,
    mind,
    personalityAlleles: [pA, pB],
    bodyAlleles: [bA, bB],
    mindAlleles: [mA, mB],
    morphSeed,
    morphology: inheritMorphology(
      parentA.morphology ?? initMorphology(),
      parentB.morphology ?? initMorphology(),
      rng,
      envCtx ? computeMorphBias(envCtx) : undefined,
    ),
    race,
    latentAncestry,
  }
}

// Asexual mutation; single parent, higher morph drift, allele pairs copied then one may mutate.
// Mind mutates less readily in clonal lines — cognitive stability is preserved across divisions.
export function mutateGenomeAsexual(parent: Genome, rng: () => number, mutationChance: number, envCtx?: EnvContext): Genome {
  // Copy both alleles from the parent; one may be replaced by a mutation event.
  const copyPair = <T>(alleles: [T, T] | undefined, expressed: T): [T, T] =>
    alleles ? [alleles[0], alleles[1]] : [expressed, expressed]

  let [pA, pB] = copyPair(parent.personalityAlleles, parent.personality)
  if (rng() < mutationChance) {
    if (rng() < 0.5) pA = pickMutatedPersonality(envCtx, rng)
    else             pB = pickMutatedPersonality(envCtx, rng)
  }
  const personality = resolveAlleles(pA, pB, PERSONALITY_DOMINANCE).expressed

  let [bA, bB] = copyPair(parent.bodyAlleles, parent.body)
  if (rng() < mutationChance) {
    if (rng() < 0.5) bA = pickMutatedBody(envCtx, undefined, rng)
    else             bB = pickMutatedBody(envCtx, undefined, rng)
  }
  const body = resolveAlleles(bA, bB, BODY_DOMINANCE).expressed

  let [mA, mB] = copyPair(parent.mindAlleles, parent.mind)
  if (rng() < mutationChance * 0.5) {
    if (rng() < 0.5) mA = pickMutatedMind(envCtx, rng)
    else             mB = pickMutatedMind(envCtx, rng)
  }
  const mind = resolveAlleles(mA, mB, MIND_DOMINANCE).expressed

  const seedDrift = (rng() - 0.5) * 0.32
  const morphSeed = clamp01(parent.morphSeed + seedDrift)

  const oldLatent = parent.latentAncestry ?? {}
  const newLatent: Partial<Record<RaceTrait, number>> = {}
  for (const r in oldLatent) {
    const depth = (oldLatent[r as RaceTrait] ?? 0) + 1
    if (depth <= LATENT_MAX_DEPTH) newLatent[r as RaceTrait] = depth
  }
  let race = parent.race
  if (rng() < mutationChance * 0.5) {
    const newRace = RACES[Math.floor(rng() * RACES.length)]
    if (newRace !== race) {
      if (race) newLatent[race] = (newLatent[race] ?? 0) + 1
      race = newRace
    }
  }

  return {
    personality,
    body,
    mind,
    personalityAlleles: [pA, pB],
    bodyAlleles: [bA, bB],
    mindAlleles: [mA, mB],
    morphSeed,
    morphology: mutateMorphologyAsexual(parent.morphology ?? initMorphology(), rng),
    race,
    latentAncestry: newLatent,
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

// ─── Name generation ─────────────────────────────────────────────────────────

const SYLLABLES = [
  'ae', 'al', 'an', 'ar', 'el', 'em', 'en', 'er', 'es',
  'il', 'im', 'in', 'ir', 'is', 'ka', 'ke', 'ki', 'ko',
  'la', 'le', 'li', 'lo', 'lu', 'ma', 'me', 'mi', 'mo',
  'na', 'ne', 'ni', 'no', 'nu', 'ra', 're', 'ri', 'ro',
  'sa', 'se', 'si', 'so', 'su', 'ta', 'te', 'ti', 'to',
  'va', 've', 'vi', 'vo', 'ya', 'ye', 'yi', 'yo', 'za',
]

const FAMILY_NAME_SYLLABLE_COUNT = 2

export function normalizeFamilyName(familyName: string): string {
  const clean = familyName.toLowerCase().replace(/[^a-z]/g, '')
  if (clean.length === 0) return 'Lala'

  const trimmed = clean.slice(0, 4)
  const canonical = trimmed.length >= 2 ? trimmed : clean.padEnd(2, clean[clean.length - 1])
  return canonical.charAt(0).toUpperCase() + canonical.slice(1)
}

function randomSyllable(rng: () => number): string {
  return SYLLABLES[Math.floor(rng() * SYLLABLES.length)]
}

const SYLLABLE_SET = new Set(SYLLABLES)

function normalizeFamilyNameSeed(familyName: string, rng: () => number): string[] {
  const clean = normalizeFamilyName(familyName).toLowerCase()

  const first2 = clean.slice(0, 2)
  const last2  = clean.slice(2, 4)

  const root   = SYLLABLE_SET.has(first2) ? first2 : randomSyllable(rng)
  const suffix = (clean.length >= 4 && SYLLABLE_SET.has(last2)) ? last2 : randomSyllable(rng)

  return [root, suffix]
}

function capitalizeName(parts: string[]): string {
  const name = parts.join('')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function generateName(rng: () => number): string {
  const name = SYLLABLES[Math.floor(rng() * SYLLABLES.length)]
             + SYLLABLES[Math.floor(rng() * SYLLABLES.length)]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function mutateFamily(familyName: string, rng: () => number): string {
  const seed = normalizeFamilyNameSeed(familyName, rng)
  const root = seed[0]
  const suffix = seed[1]

  const mutations = [
    () => [root, suffix],                                 // 30% preserve
    () => [root, randomSyllable(rng)],                    // 45% drift suffix
    () => [randomSyllable(rng), suffix],                  // 15% drift root
    () => [randomSyllable(rng), randomSyllable(rng)],     // 10% full refresh
  ]

  const weights = [0.30, 0.45, 0.15, 0.10]
  const r = rng()
  let cumulative = 0
  let chosen = mutations[mutations.length - 1]
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (r < cumulative) { chosen = mutations[i]; break }
  }

  return capitalizeName(chosen().slice(0, FAMILY_NAME_SYLLABLE_COUNT))
}

// ─── Trait descriptions ───────────────────────────────────────────────────────

export function describeGenome(genome: Genome): string {
  const pDesc: Record<PersonalityTrait, string> = {
    Curious:    'explores widely, range-dependent',
    Timid:      'shelter-proximate, conflict-averse',
    Aggressive: 'territorial, resource-competitive',
    Lazy:       'low-displacement, food-proximate',
    Greedy:     'resource-accumulating, scarcity-sensitive',
    Nurturing:  'high-attachment, caregiving tendency',
    Wanderer:   'long-range dispersal, habitat pioneer',
    Recluse:    'solitary preference, crowd-averse',
    Hoarder:    'cache-building, surplus-driven',
    Empath:     'stress-mirroring, flock-dependent',
    Furtive:    'low-visibility, avoidance-primary',
    Territorial:'zone-dominant, boundary-enforcing',
    Social:     'bond-maximising, crowd-seeking',
    Stoic:      'stress-resistant, low-affect baseline',
    Scavenger:  'opportunistic forager, death-site seeker',
    Mimic:      'bond-follower, behavioral mirror',
    Nomadic:    'extreme-range disperser, restless mover',
    Vigilant:   'arc-patroller, threat-sensitive',
    Symbiotic:  'cross-lineage seeker, diversity-bonded',
  }
  const bDesc: Record<BodyTrait, string> = {
    Spore: 'rapid reproduction, short lifespan',
    Shell: 'long lifespan, high resilience',
    Spike: 'combat-capable, average lifespan',
    Wisp:  'high mobility, water-seeking',
  }
  const mDesc: Record<MindTrait, string> = {
    Feral:    'instinct-only, no signal output',
    Aware:    'observing, low-frequency signal',
    Dreaming: 'memory-recursive, high-ambiguity signal',
    Sentinel: 'boundary surveillance, operator-aware',
  }
  const rDesc: Partial<Record<RaceTrait, string>> = {
    Kin:   'kin-selective, bond-accelerated',
    Drift: 'wide-range disperser, habitat generalist',
    Burrow:'subterranean affinity, dark-adapted',
    Apex:  'apex-lineage, combat-enhanced',
    Pale:  'cave-primary, low-light specialist',
    Tide:  'riparian specialist, water-dependent',
    Bloom: 'reproduction-amplified, season-sensitive',
    Ash:   'barren-adapted, stress-resilient',
  }
  const rPart = genome.race ? ` · ${rDesc[genome.race] ?? genome.race.toLowerCase()}` : ''
  return `${pDesc[genome.personality]} · ${bDesc[genome.body]} · ${mDesc[genome.mind]}${rPart}`
}

// ─── Genome color (unique per personality × body × mind combination) ──────────

export function genomeColor(genome: Genome): string {
  const baseHSL: Record<PersonalityTrait, [number, number, number]> = {
    Curious:    [155, 82, 72],
    Timid:      [205, 74, 78],
    Aggressive: [  4, 95, 70],
    Lazy:       [230, 35, 70],
    Greedy:     [ 32, 92, 72],
    Nurturing:  [338, 84, 82],
    Wanderer:   [ 38, 88, 70],  // amber-gold; the traveling lantern
    Recluse:    [222, 28, 62],  // muted steel-blue; the hermit
    Hoarder:    [ 48, 78, 68],  // deep amber; the collector
    Empath:     [300, 55, 78],  // soft violet; the mirror
    Furtive:    [150, 22, 56],  // dim sage-grey; the shadow
    Territorial:[ 18, 90, 68],  // burnt sienna; the border-marker
    Social:     [320, 70, 82],  // bright rose; the cluster-seeker
    Stoic:      [200, 18, 60],  // cool slate; the unmoved
    Scavenger:  [ 26, 60, 52],  // dark ochre; the bone-picker
    Mimic:      [270, 45, 74],  // muted lavender; the reflection
    Nomadic:    [ 55, 85, 68],  // dusty gold; the horizon-chaser
    Vigilant:   [180, 50, 58],  // teal-grey; the watcher
    Symbiotic:  [160, 65, 72],  // soft jade; the bridge-builder
  }

  const bodyMod: Record<BodyTrait, [number, number]> = {
    Spore: [  0, +8],
    Shell: [-20, -8],
    Spike: [+25, +4],
    Wisp:  [  0, +12],
  }

  const mindHueShift: Record<MindTrait, number> = {
    Feral:      0,
    Aware:    +22,
    Dreaming: -28,
    Sentinel: +52,
  }

  // Race applies a secondary hue/sat/light modifier on top of the personality base.
  // Chosen to be subtle (~10-20° shift) so race is perceptible but not dominant.
  const raceHSLMod: Partial<Record<RaceTrait, [number, number, number]>> = {
    Kin:   [  0, +6,  +4],   // warmer, slightly brighter social tones
    Drift: [+18, -4,  +2],   // slight golden drift; wandering light
    Burrow:[-20, +8,  -8],   // deeper, cooler underground hue
    Apex:  [+30, +10, -4],   // more saturated, slightly darker; predator intensity
    Pale:  [  0, -18, +10],  // washed out, cave-bleached lightness
    Tide:  [-30, +10, +4],   // blue-shifted, richer; river-cold
    Bloom: [+10, +12, +6],   // warmer and brighter; reproductive vigour
    Ash:   [  0, -20, -8],   // desaturated, darker; the barren-adapted
  }

  const [h, s, l] = baseHSL[genome.personality]
  const [dS, dL] = bodyMod[genome.body]
  const dH = mindHueShift[genome.mind]

  const [rH, rS, rL] = (genome.race && raceHSLMod[genome.race]) ? raceHSLMod[genome.race]! : [0, 0, 0]

  // morphSeed drives per-creature asymmetry; morphology.colorDrift accumulates
  // across generations so each lineage develops its own distinct hue signature.
  const morphHue = (genome.morphSeed - 0.5) * 22 + (genome.morphology?.colorDrift ?? 0) * 45

  const fH = ((h + dH + rH + morphHue) % 360 + 360) % 360
  const fS = Math.max(18, Math.min(100, s + dS + rS))
  const fL = Math.max(50, Math.min(90, l + dL + rL))

  return hslToHex(fH, fS, fL)
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100
  const ln = l / 100
  const a = sn * Math.min(ln, 1 - ln)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = ln - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(color * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function mindGlow(mind: MindTrait): string {
  return {
    Feral:    'transparent',
    Aware:    '#5DCAA5',
    Dreaming: '#85B7EB',
    Sentinel: '#B09AFF',
  }[mind]
}
