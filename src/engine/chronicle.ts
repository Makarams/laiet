// ─── Chronicle: the colony's real memory ─────────────────────────────────────
//
// The chronicle is a bounded ring of mechanical events the engine actually
// produced. It is the *only* source of content for colony speech (stage 1–5
// messages compose from these entries). If something is not in the chronicle,
// the colony cannot truthfully speak about it as though it happened.
//
// Per-creature `observedEvents` mirrors the same idea at the individual scale:
// what tokens a creature reaches for when it speaks is grounded in what it
// has personally witnessed, not in static personality vocabularies.

import { v4 as uuid } from 'uuid'
import { Creature, GameState, ChronicleEvent, ChronicleEventKind } from '@/types'

const CHRONICLE_MAX = 150
const PER_CREATURE_MAX = 24

// Push an event to the colony chronicle and return a new state with the
// updated bounded ring. Deduplication for "first" events is handled by the
// chronicleSeen marker map so callers don't have to track that themselves.
export function pushChronicle(
  state: GameState,
  event: Omit<ChronicleEvent, 'id'>,
  options?: { onceKey?: string }
): GameState {
  const seen = state.chronicleSeen ?? {}
  if (options?.onceKey && seen[options.onceKey]) return state

  const entry: ChronicleEvent = { id: uuid(), ...event }
  const existing = state.colonyChronicle ?? []
  const next = existing.length >= CHRONICLE_MAX
    ? [...existing.slice(1), entry]
    : [...existing, entry]

  const nextSeen = options?.onceKey ? { ...seen, [options.onceKey]: true as const } : seen

  return { ...state, colonyChronicle: next, chronicleSeen: nextSeen }
}

// In-place creature observation push. Mutates because callers in tick.ts
// hand around mutable creature copies during the per-tick walk; copying
// observedEvents on every observation would be wasteful at colony scale.
export function recordObservation(
  c: Creature,
  kind: ChronicleEventKind | import('@/types').ExperienceEventType,
  day: number,
  ctx?: { creatureId?: string; detail?: string }
): void {
  const log = c.observedEvents ?? []
  // Suppress duplicates within 2 days for the same kind+target to keep the
  // log meaningful instead of spammy.
  const recent = log[log.length - 1]
  if (recent
      && recent.kind === kind
      && recent.creatureId === ctx?.creatureId
      && day - recent.day < 2) return

  const entry = { kind, day, ...(ctx ?? {}) }
  const next = log.length >= PER_CREATURE_MAX
    ? [...log.slice(1), entry]
    : [...log, entry]
  c.observedEvents = next
}

// Increment the per-cause death tally on the state. Returns a new state
// with the updated counts map.
export function recordDeathCause(state: GameState, cause: import('@/types').DeathCause): GameState {
  const counts = state.deathCauseCounts ?? {}
  return {
    ...state,
    deathCauseCounts: { ...counts, [cause]: (counts[cause] ?? 0) + 1 },
  }
}

// Read most-recent chronicle entries matching a predicate. Used by the
// message composers to find a freshly-relevant event to reference.
export function recentChronicle(
  state: GameState,
  predicate: (e: ChronicleEvent) => boolean,
  windowDays = 30,
  limit = 5,
): ChronicleEvent[] {
  const chron = state.colonyChronicle ?? []
  const today = state.time.day
  const out: ChronicleEvent[] = []
  for (let i = chron.length - 1; i >= 0 && out.length < limit; i--) {
    const e = chron[i]
    if (today - e.day > windowDays) break
    if (predicate(e)) out.push(e)
  }
  return out
}
