import { Genome, PersonalityTrait, BodyTrait, MindTrait, MorphologyTraits, RaceTrait, AdaptationTrait, EnvContext } from '@/types'
import {
  MUTATION_CHANCE,
  LATENT_REVIVAL_BASE, LATENT_DEPTH_BONUS, LATENT_MAX_DEPTH, LATENT_DOMINANT_WEIGHT,
  ADAPTATION_INHERIT_CHANCE, ADAPTATION_MAX,
} from './constants'

export const PERSONALITIES: PersonalityTrait[] = [
  'Curious', 'Timid', 'Aggressive', 'Lazy', 'Greedy', 'Nurturing', 'Wanderer', 'Recluse',
  'Hoarder', 'Empath', 'Furtive', 'Territorial', 'Social', 'Stoic',
]
export const BODIES: BodyTrait[] = ['Spore', 'Shell', 'Spike', 'Wisp']
export const MINDS: MindTrait[] = ['Feral', 'Aware', 'Dreaming', 'Sentinel']
export const RACES: RaceTrait[] = ['Kin', 'Drift', 'Burrow', 'Apex', 'Pale', 'Tide', 'Bloom', 'Ash']

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
// or null if conditions don't favour a specific trait.
export function acquireAdaptation(env: EnvContext): AdaptationTrait | null {
  const { biome, weather, season } = env
  if (season === 'winter' || weather === 'snow')                         return 'cold_hardy'
  if (biome === 'wetland')                                               return 'hydro_fins'
  if (biome === 'rocky')                                                 return 'cave_sighted'
  if (weather === 'heatwave' && season === 'summer')                    return 'heat_plated'
  if (weather === 'drought' || biome === 'arid')                        return 'drought_tough'
  if (weather === 'storm')                                               return 'storm_braced'
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
  return {
    personality: PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)],
    body: BODIES[Math.floor(rng() * BODIES.length)],
    mind: MINDS[Math.floor(rng() * MINDS.length)],
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

// Sexual inheritance; mix from two parents with mutation chance per slot.
// mutationChance defaults to the constant but can be overridden by SimModifiers.
// Optional envCtx applies directional morphology pressure from birth conditions.
export function inheritGenome(parentA: Genome, parentB: Genome, rng: () => number, mutationChance = MUTATION_CHANCE, envCtx?: EnvContext): Genome {
  const pick = <T>(a: T, b: T, pool: T[]): T => {
    const base = rng() < 0.5 ? a : b
    if (rng() < mutationChance) return pool[Math.floor(rng() * pool.length)]
    return base
  }

  // morphSeed still controls per-creature shape asymmetry; it drifts between
  // parents to keep siblings distinguishable within a lineage.
  const inheritedSeed = rng() < 0.5 ? parentA.morphSeed : parentB.morphSeed
  const seedDrift = (rng() - 0.5) * 0.18
  const morphSeed = clamp01(inheritedSeed + seedDrift)

  const { race, latentAncestry } = inheritRace(parentA, parentB, rng)

  return {
    personality: pick(parentA.personality, parentB.personality, PERSONALITIES),
    body: pick(parentA.body, parentB.body, BODIES),
    mind: pick(parentA.mind, parentB.mind, MINDS),
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

// Asexual mutation; single parent, higher mutation rate, larger morph drift
export function mutateGenomeAsexual(parent: Genome, rng: () => number, mutationChance: number): Genome {
  const mut = <T>(current: T, pool: T[]): T =>
    rng() < mutationChance ? pool[Math.floor(rng() * pool.length)] : current

  const seedDrift = (rng() - 0.5) * 0.32
  const morphSeed = clamp01(parent.morphSeed + seedDrift)

  // Asexual: age all latent races by 1 generation; rare race mutation (~half of mutationChance)
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
      if (race) newLatent[race] = (newLatent[race] ?? 0) + 1  // old race becomes latent
      race = newRace
    }
  }

  return {
    personality: mut(parent.personality, PERSONALITIES),
    body: mut(parent.body, BODIES),
    mind: mut(parent.mind, MINDS),
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

export function generateName(rng: () => number): string {
  const length = 2 + Math.floor(rng() * 2)
  let name = ''
  for (let i = 0; i < length; i++) {
    name += SYLLABLES[Math.floor(rng() * SYLLABLES.length)]
  }
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function mutateFamily(familyName: string, rng: () => number): string {
  const mutations = [
    () => SYLLABLES[Math.floor(rng() * SYLLABLES.length)] + familyName.toLowerCase(),
    () => familyName + SYLLABLES[Math.floor(rng() * SYLLABLES.length)],
    () => {
      if (familyName.length <= 2) return familyName + SYLLABLES[Math.floor(rng() * SYLLABLES.length)]
      return familyName.slice(0, -2) + SYLLABLES[Math.floor(rng() * SYLLABLES.length)]
    },
    () => familyName,
  ]

  const weights = [0.2, 0.3, 0.3, 0.2]
  const r = rng()
  let cumulative = 0
  let chosen = mutations[mutations.length - 1]
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (r < cumulative) { chosen = mutations[i]; break }
  }

  const result = chosen()
  return result.charAt(0).toUpperCase() + result.slice(1)
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
