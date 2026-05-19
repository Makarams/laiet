// Tick profiler — module-level, dev-only.
//
// `mark(phase, ms)` records one timing sample per tick phase into a rolling
// buffer; `getSummary()` returns the mean+max ms per phase over the last N
// ticks. Negligible cost when disabled (early-return). The HUD component in
// `ui/components/ProfilerHud.tsx` polls `getSummary()` on a low-frequency
// animation loop so it never pressures the tick path.

const BUFFER_TICKS = 60   // ~10s of samples at 6 ticks/sec
const PHASES = [
  'time', 'weather', 'tiles', 'creatures', 'reproduction',
  'tribeFormation', 'tribes', 'enrichment', 'naturalEnrichment',
  'awareness', 'caretaker', 'endgame', 'total',
] as const

export type ProfilePhase = (typeof PHASES)[number]

interface PhaseRing {
  data: Float32Array
  head: number
  size: number
}

let enabled = false
let totalTicks = 0
const rings: Record<ProfilePhase, PhaseRing> = Object.fromEntries(
  PHASES.map(p => [p, { data: new Float32Array(BUFFER_TICKS), head: 0, size: 0 }])
) as Record<ProfilePhase, PhaseRing>

export function setProfilerEnabled(on: boolean): void {
  enabled = on
}

export function isProfilerEnabled(): boolean {
  return enabled
}

export function mark(phase: ProfilePhase, ms: number): void {
  if (!enabled) return
  const ring = rings[phase]
  ring.data[ring.head] = ms
  ring.head = (ring.head + 1) % BUFFER_TICKS
  if (ring.size < BUFFER_TICKS) ring.size++
  if (phase === 'total') totalTicks++
}

export interface PhaseStats {
  phase: ProfilePhase
  mean: number
  max: number
  samples: number
}

export function getSummary(): { stats: PhaseStats[]; totalTicks: number } {
  const stats: PhaseStats[] = []
  for (const phase of PHASES) {
    const ring = rings[phase]
    if (ring.size === 0) {
      stats.push({ phase, mean: 0, max: 0, samples: 0 })
      continue
    }
    let sum = 0, max = 0
    for (let i = 0; i < ring.size; i++) {
      const v = ring.data[i]
      sum += v
      if (v > max) max = v
    }
    stats.push({ phase, mean: sum / ring.size, max, samples: ring.size })
  }
  return { stats, totalTicks }
}

export function resetProfiler(): void {
  totalTicks = 0
  for (const phase of PHASES) {
    const ring = rings[phase]
    ring.head = 0
    ring.size = 0
    ring.data.fill(0)
  }
}
