import { Genome, PersonalityTrait, BodyTrait, MindTrait, MorphologyTraits } from '@/types'
import { MUTATION_CHANCE } from './constants'

export const PERSONALITIES: PersonalityTrait[] = ['Curious', 'Timid', 'Aggressive', 'Lazy', 'Greedy', 'Nurturing', 'Wanderer', 'Recluse']
export const BODIES: BodyTrait[] = ['Spore', 'Shell', 'Spike', 'Wisp']
export const MINDS: MindTrait[] = ['Feral', 'Aware', 'Dreaming', 'Sentinel']

// ─── Morphology helpers ───────────────────────────────────────────────────────

// Neutral baseline for gen-0 creatures; each reproduction event drifts these.
export function initMorphology(): MorphologyTraits {
  return { sizeScale: 1.0, limbLength: 0.0, spinalLength: 0.0, colorDrift: 0.0, eyeSize: 1.0 }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

// Sexual inheritance: blend both parents' accumulated traits then add a small
// per-generation drift. Small delta (~±0.04) means change is gradual and
// compounds meaningfully only after 5-10 generations.
function inheritMorphology(a: MorphologyTraits, b: MorphologyTraits, rng: () => number): MorphologyTraits {
  const m = a ?? initMorphology()
  const n = b ?? initMorphology()
  return {
    sizeScale:    clamp(((m.sizeScale    + n.sizeScale)    / 2) + (rng() - 0.5) * 0.08, 0.70, 1.50),
    limbLength:   clamp(((m.limbLength   + n.limbLength)   / 2) + (rng() - 0.5) * 0.10, 0.00, 1.00),
    spinalLength: clamp(((m.spinalLength + n.spinalLength) / 2) + (rng() - 0.5) * 0.10, 0.00, 1.00),
    colorDrift:   clamp(((m.colorDrift   + n.colorDrift)   / 2) + (rng() - 0.5) * 0.06, -0.50, 0.50),
    eyeSize:      clamp(((m.eyeSize      + n.eyeSize)      / 2) + (rng() - 0.5) * 0.08, 0.70, 1.50),
  }
}

// Asexual mutation: single parent but larger drift per trait — clonal lines
// diverge faster, producing visibly distinct sub-populations over fewer generations.
function mutateMorphologyAsexual(parent: MorphologyTraits, rng: () => number): MorphologyTraits {
  const m = parent ?? initMorphology()
  return {
    sizeScale:    clamp(m.sizeScale    + (rng() - 0.5) * 0.14, 0.70, 1.50),
    limbLength:   clamp(m.limbLength   + (rng() - 0.5) * 0.18, 0.00, 1.00),
    spinalLength: clamp(m.spinalLength + (rng() - 0.5) * 0.18, 0.00, 1.00),
    colorDrift:   clamp(m.colorDrift   + (rng() - 0.5) * 0.10, -0.50, 0.50),
    eyeSize:      clamp(m.eyeSize      + (rng() - 0.5) * 0.14, 0.70, 1.50),
  }
}

export function randomGenome(rng: () => number): Genome {
  return {
    personality: PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)],
    body: BODIES[Math.floor(rng() * BODIES.length)],
    mind: MINDS[Math.floor(rng() * MINDS.length)],
    morphSeed: rng(),
    morphology: initMorphology(),
  }
}

// Sexual inheritance — mix from two parents with mutation chance per slot.
// mutationChance defaults to the constant but can be overridden by SimModifiers.
export function inheritGenome(parentA: Genome, parentB: Genome, rng: () => number, mutationChance = MUTATION_CHANCE): Genome {
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

  return {
    personality: pick(parentA.personality, parentB.personality, PERSONALITIES),
    body: pick(parentA.body, parentB.body, BODIES),
    mind: pick(parentA.mind, parentB.mind, MINDS),
    morphSeed,
    morphology: inheritMorphology(
      parentA.morphology ?? initMorphology(),
      parentB.morphology ?? initMorphology(),
      rng,
    ),
  }
}

// Asexual mutation — single parent, higher mutation rate, larger morph drift
export function mutateGenomeAsexual(parent: Genome, rng: () => number, mutationChance: number): Genome {
  const mut = <T>(current: T, pool: T[]): T =>
    rng() < mutationChance ? pool[Math.floor(rng() * pool.length)] : current

  const seedDrift = (rng() - 0.5) * 0.32
  const morphSeed = clamp01(parent.morphSeed + seedDrift)

  return {
    personality: mut(parent.personality, PERSONALITIES),
    body: mut(parent.body, BODIES),
    mind: mut(parent.mind, MINDS),
    morphSeed,
    morphology: mutateMorphologyAsexual(parent.morphology ?? initMorphology(), rng),
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
    Curious: 'explores relentlessly, needs new terrain',
    Timid: 'stays near shelter, stressed by conflict',
    Aggressive: 'claims territory, fights for resources',
    Lazy: 'stays close to food, moves rarely',
    Greedy: 'hoards food, stressed by scarcity',
    Nurturing: 'bonds deeply, tends to sick and young',
    Wanderer: 'roams vast distances, pioneers new land',
    Recluse: 'avoids crowds, thrives in solitude',
  }
  const bDesc: Record<BodyTrait, string> = {
    Spore: 'breeds fast, short life',
    Shell: 'lives long, slow and resilient',
    Spike: 'strong fighter, average life',
    Wisp: 'very fast, drawn to water',
  }
  const mDesc: Record<MindTrait, string> = {
    Feral: 'instinct-driven, no messages',
    Aware: 'observes, sends simple messages',
    Dreaming: 'returns to memories, cryptic logs',
    Sentinel: 'watches the world — and you',
  }
  return `${pDesc[genome.personality]} · ${bDesc[genome.body]} · ${mDesc[genome.mind]}`
}

// ─── Genome color (unique per personality × body × mind combination) ──────────

export function genomeColor(genome: Genome): string {
  const baseHSL: Record<PersonalityTrait, [number, number, number]> = {
    Curious:   [155, 82, 72],
    Timid:     [205, 74, 78],
    Aggressive:[ 4,  95, 70],
    Lazy:      [230, 35, 70],
    Greedy:    [ 32, 92, 72],
    Nurturing: [338, 84, 82],
    Wanderer:  [ 38, 88, 70],  // amber-gold — the traveling lantern
    Recluse:   [222, 28, 62],  // muted steel-blue — the hermit
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

  const [h, s, l] = baseHSL[genome.personality]
  const [dS, dL] = bodyMod[genome.body]
  const dH = mindHueShift[genome.mind]

  // morphSeed drives per-creature asymmetry; morphology.colorDrift accumulates
  // across generations so each lineage develops its own distinct hue signature.
  const morphHue = (genome.morphSeed - 0.5) * 22 + (genome.morphology?.colorDrift ?? 0) * 45

  const fH = ((h + dH + morphHue) % 360 + 360) % 360
  const fS = Math.max(18, Math.min(100, s + dS))
  const fL = Math.max(50, Math.min(90, l + dL))

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
