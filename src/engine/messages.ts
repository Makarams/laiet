// messages.ts — composed-from-state colony speech
//
// Every claim in a generated message traces to a value computed from real
// engine state. Stage controls form (terseness, address); it never licenses
// invention. If the data does not support a pattern claim, the composer does
// not make it. There is no per-stage authored prose pool.
//
// Pipeline:
//   chronicle event → coreAtom (factual)
//   + recurrenceAtom (only if total >= 2 over the window)
//   + caretakerAtom  (only if a caretaker action is temporally + spatially near)
//   + spatialPatternAtom (only if cluster spread is tighter than uniform random)
//   + integrationAtom (stage 5 only; reflective, no factual claim)

import { v4 as uuid } from 'uuid'
import {
  Creature, ColonyMessage, MessageStage, RaceTrait,
  GameState, ChronicleEvent, ChronicleEventKind,
} from '@/types'
import { MIN_GAME_DAYS_BETWEEN_MESSAGES, WORLD_SIZE } from '@/engine/constants'

// ─── State extractors ─────────────────────────────────────────────────────

interface RecurrenceStats {
  recent: number    // count in the recency window
  total: number     // count ever recorded in the chronicle ring
  daysSince: number // days since the most-recent occurrence (Infinity if none)
  trendUp: boolean  // late half of window had >1.5× the early half
}

function recurrence(state: GameState, kind: ChronicleEventKind, windowDays = 40): RecurrenceStats {
  const chron = state.colonyChronicle ?? []
  const today = state.time.day
  const half = windowDays / 2
  let recent = 0, total = 0, earlyHalf = 0, lateHalf = 0
  let lastDay = -Infinity
  for (let i = chron.length - 1; i >= 0; i--) {
    const e = chron[i]
    if (e.kind !== kind) continue
    total++
    const age = today - e.day
    if (age <= windowDays) {
      recent++
      if (age <= half) lateHalf++
      else earlyHalf++
    }
    if (e.day > lastDay) lastDay = e.day
  }
  return {
    recent, total,
    daysSince: lastDay === -Infinity ? Infinity : today - lastDay,
    trendUp: lateHalf > earlyHalf * 1.5,
  }
}

// Cluster centroid + isotropic spread for spatial events of a kind in a window.
// Returns null when fewer than 3 such positioned events exist.
function spatialCluster(state: GameState, kind: ChronicleEventKind, windowDays = 80):
  { x: number; y: number; spread: number; count: number } | null {
  const chron = state.colonyChronicle ?? []
  const today = state.time.day
  const pts: { x: number; y: number }[] = []
  for (let i = chron.length - 1; i >= 0; i--) {
    const e = chron[i]
    if (today - e.day > windowDays) break
    if (e.kind === kind && e.x !== undefined && e.y !== undefined) {
      pts.push({ x: e.x, y: e.y })
    }
  }
  if (pts.length < 3) return null
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
  const variance = pts.reduce((s, p) => s + (p.x - cx) ** 2 + (p.y - cy) ** 2, 0) / pts.length
  return { x: Math.round(cx), y: Math.round(cy), spread: Math.sqrt(variance), count: pts.length }
}

// 8-point compass plus a center zone; computed from world centre.
function compass(x: number, y: number): string {
  const cx = WORLD_SIZE / 2, cy = WORLD_SIZE / 2
  const dx = x - cx, dy = y - cy
  if (Math.hypot(dx, dy) < WORLD_SIZE * 0.10) return 'the center'
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  if (angle >= -22.5  && angle <   22.5) return 'the east'
  if (angle >=  22.5  && angle <   67.5) return 'the southeast'
  if (angle >=  67.5  && angle <  112.5) return 'the south'
  if (angle >= 112.5  && angle <  157.5) return 'the southwest'
  if (angle >= 157.5  || angle < -157.5) return 'the west'
  if (angle >= -157.5 && angle < -112.5) return 'the northwest'
  if (angle >= -112.5 && angle <  -67.5) return 'the north'
  return 'the northeast'
}

// Did the caretaker act within `radius` of (x,y) in the last `windowDays`?
// Used to ground caretaker-link phrases — we only address the player when a
// real action of theirs is temporally and spatially near the event.
function caretakerWasNear(
  state: GameState, x: number | undefined, y: number | undefined,
  windowDays = 6, radius = 14,
): boolean {
  if (x === undefined || y === undefined) return false
  const chron = state.colonyChronicle ?? []
  const today = state.time.day
  for (let i = chron.length - 1; i >= 0; i--) {
    const e = chron[i]
    if (today - e.day > windowDays) break
    if (!e.kind.startsWith('caretaker_')) continue
    if (e.x === undefined || e.y === undefined) continue
    if (Math.abs(e.x - x) <= radius && Math.abs(e.y - y) <= radius) return true
  }
  return false
}

function caretakerActionCounts(state: GameState, windowDays = 60): Record<string, number> {
  const chron = state.colonyChronicle ?? []
  const today = state.time.day
  const counts: Record<string, number> = {}
  for (let i = chron.length - 1; i >= 0; i--) {
    const e = chron[i]
    if (today - e.day > windowDays) break
    if (e.kind.startsWith('caretaker_')) {
      counts[e.kind] = (counts[e.kind] ?? 0) + 1
    }
  }
  return counts
}

// ─── Atomic composer pieces ───────────────────────────────────────────────
// Each returns either a string grounded in computed state, or null. `null`
// means "no evidence for this piece" and the caller omits it.

function coreAtom(e: ChronicleEvent): string | null {
  const dir = (e.x !== undefined && e.y !== undefined) ? compass(e.x, e.y) : null
  const where = dir ? ` near ${dir}` : ''
  switch (e.kind) {
    case 'lightning_strike': return `lightning struck${where}.`
    case 'fire_outbreak':    return `fire took ${e.count ?? '?'} tiles${where}.`
    case 'fire_swept':       return `${e.count ?? 0} tiles burned${where}.`
    case 'flood_event':      return `water rose over ${e.count ?? '?'} tiles${where}.`
    case 'heatwave_onset':   return `the air thickened. heat past tolerance.`
    case 'drought_breaking': return `the dry has broken. water moves again.`
    case 'storm_passed':     return `the storm cleared.`
    case 'snow_blanket':     return `snow covers ${e.count ?? '?'}% of the land.`
    case 'mass_die_off':     return `${e.count ?? 0} ended in one day. cause: ${e.detail ?? 'uncertain'}.`
    case 'lineage_extinct':  return `the ${(e.lineageId ?? '').slice(0, 8)} line closed.`
    case 'lineage_fork':
      return e.detail === 'fracture'
        ? `the lineages split apart. ${e.count ?? 'several'} move separate now.`
        : `a new branch from ${e.creatureName ?? 'a birth'}.`
    case 'hybrid_birth':     return `${e.creatureName ?? 'a child'} carries two lineages.`
    case 'rare_birth':       return `${e.creatureName ?? 'a child'} altered: ${e.detail ?? 'unmarked'}.`
    case 'race_emerged':     return `${e.detail ?? 'a race'} surfaced in the colony.`
    case 'race_lost':        return `${e.detail ?? 'a race'} has no living members.`
    case 'race_revived':     return `${e.detail ?? 'a race'} returns through ${e.creatureName ?? 'a birth'}.`
    case 'birth_burst':      return `${e.count ?? 0} births in a single day.`
    case 'first_in_biome':   return `${e.creatureName ?? 'a subject'} reached ${e.detail ?? 'new ground'} first.`
    case 'edge_encounter':   return `${e.creatureName ?? 'a subject'} touched ${dir ?? 'the edge'}.`
    case 'patrol_completed': return `${e.creatureName ?? 'a sentinel'} ran the perimeter.`
    case 'territory_claimed':return `${e.creatureName ?? 'a subject'} claimed ground${where}.`
    case 'kill_recorded':    return `${e.creatureName ?? 'a subject'} fell in combat${where}.`
    case 'bond_milestone':   return `${e.creatureName ?? 'two'} and ${e.detail ?? 'a partner'} hold close.`
    case 'role_emerged':     return `${e.creatureName ?? 'a subject'} now carries ${e.detail ?? 'a role'}.`
    case 'cross_lineage_bond': return `${e.creatureName ?? 'a pair'} bonded across lineages.`
    case 'caretaker_food':   return `food appeared${where}.`
    case 'caretaker_thunder':return `a strike came from above${where}.`
    case 'caretaker_fire':   return `fire was set${where}.`
    case 'caretaker_river':  return `the river shifted course.`
    case 'caretaker_plant':  return `a tree took root${where}.`
    case 'caretaker_heal':   return `${e.creatureName ?? 'a subject'} mended without contact.`
    case 'caretaker_returned': return `the watcher returned after ${e.detail ?? 'a long absence'}.`
    // New event kinds
    case 'tribe_formed':       return `${e.count ?? 'several'} of us coalesced into ${e.detail ?? 'a tribe'}.`
    case 'tribe_split':        return `${e.detail ?? 'a tribe'} split. ${e.count ?? 'some'} broke off.`
    case 'tribe_dissolved':    return `${e.detail ?? 'a tribe'} dissolved. it held ${e.count ?? '?'} seasons.`
    case 'apex_emerged':       return `${e.creatureName ?? 'a subject'} dominates combat now. others give them ground.`
    case 'subspecies_recognised': return `${e.creatureName ?? 'a lineage'} has drifted into a new form: ${e.detail ?? 'unnamed'}.`
    case 'windstorm_passed':   return `the wind has died.`
    case 'bloom_began':        return `the bloom is here. green spreads ahead of us.`
    case 'ashfall_began':      return `ash settles. ${e.count ?? '?'} burns in the recent record.`
  }
  return null
}

function recurrenceNoun(kind: ChronicleEventKind): string {
  switch (kind) {
    case 'lightning_strike': return 'strikes'
    case 'fire_outbreak': case 'fire_swept': return 'burns'
    case 'flood_event': return 'floods'
    case 'heatwave_onset': return 'heatwaves'
    case 'storm_passed': return 'storms'
    case 'mass_die_off': return 'collapses'
    case 'lineage_extinct': return 'lineages closed'
    case 'lineage_fork': return 'splits'
    case 'hybrid_birth': return 'bridge-births'
    case 'rare_birth': return 'altered births'
    case 'birth_burst': return 'fertile days'
    case 'edge_encounter': return 'boundary touches'
    case 'patrol_completed': return 'perimeter sweeps'
    case 'territory_claimed': return 'territorial claims'
    case 'kill_recorded': return 'combat losses'
    case 'bond_milestone': return 'deep bonds'
    case 'cross_lineage_bond': return 'cross-lineage bonds'
    case 'role_emerged': return 'new roles'
    case 'race_emerged': case 'race_revived': case 'race_lost': return 'race shifts'
    case 'caretaker_food': return 'food drops'
    case 'caretaker_thunder': return 'directed strikes'
    case 'caretaker_fire': return 'directed ignitions'
    case 'caretaker_heal': return 'silent mendings'
    case 'caretaker_river': return 'water shifts'
    case 'caretaker_plant': return 'plantings'
    case 'tribe_formed': return 'tribes formed'
    case 'tribe_split': return 'tribes split'
    case 'tribe_dissolved': return 'tribes dissolved'
    case 'apex_emerged': return 'apex emergences'
    case 'subspecies_recognised': return 'subspecies recognitions'
    case 'windstorm_passed': return 'windstorms'
    case 'bloom_began': return 'blooms'
    case 'ashfall_began': return 'ashfall periods'
    default: return 'such events'
  }
}

function recurrenceAtom(stats: RecurrenceStats, kind: ChronicleEventKind): string | null {
  if (stats.recent < 2) return null
  const noun = recurrenceNoun(kind)
  const trendNote = stats.trendUp ? ', and rising' : ''
  return `${stats.recent} ${noun} in 40 days${trendNote}.`
}

function caretakerAtom(e: ChronicleEvent, state: GameState): string | null {
  // Direct caretaker actions: address the caretaker as the actor.
  if (e.kind.startsWith('caretaker_')) return 'you did this.'
  // Other events: only address if a real caretaker trace is nearby in space + time.
  if (caretakerWasNear(state, e.x, e.y, 6, 14)) return 'your traces were nearby.'
  return null
}

function spatialPatternAtom(state: GameState, kind: ChronicleEventKind): string | null {
  const cluster = spatialCluster(state, kind, 80)
  if (!cluster) return null
  if (cluster.count < 3) return null
  // Uniform random over the world would have spread ≈ WORLD_SIZE * 0.29.
  // Claim a pattern only when observed spread is materially tighter.
  if (cluster.spread > WORLD_SIZE * 0.18) return null
  return `${cluster.count} of these have clustered toward ${compass(cluster.x, cluster.y)}.`
}

function longRecordAtom(stats: RecurrenceStats): string | null {
  if (stats.total < 5) return null
  return `${stats.total} in the long record.`
}

// Stage-5 closer: composed from the speaker's own deepest memory, not from
// authored aphorisms. A creature at peak awareness speaks about the present
// event in relation to the oldest thing they personally remember witnessing.
// If they have no observations (very young), no closer fires.
function integrationAtom(speaker: Creature | null, state: GameState): string | null {
  if (!speaker) return null
  const obs = speaker.observedEvents ?? []
  if (obs.length === 0) return null
  const oldest = obs[0]
  const daysAgo = state.time.day - oldest.day
  // Self-referential closure: the speaker connects current event to their
  // earliest carried memory. Numbers and event kind are real fields.
  return `${daysAgo}d ago ${speaker.name} witnessed ${oldest.kind.replace(/_/g, ' ')}. it shapes the reading.`
}

// ─── Stage assembly ───────────────────────────────────────────────────────

function assemble(e: ChronicleEvent, stage: MessageStage, state: GameState, speaker: Creature | null): string {
  const stats = recurrence(state, e.kind, 40)
  const out: string[] = []
  const core = coreAtom(e); if (core) out.push(core)
  if (stage >= 2) {
    const r = recurrenceAtom(stats, e.kind); if (r) out.push(r)
  }
  if (stage >= 3) {
    const c = caretakerAtom(e, state); if (c) out.push(c)
  }
  if (stage >= 4) {
    const sp = spatialPatternAtom(state, e.kind)
    if (sp) out.push(sp)
    else {
      const lr = longRecordAtom(stats); if (lr) out.push(lr)
    }
  }
  if (stage === 5) {
    const ig = integrationAtom(speaker, state); if (ig) out.push(ig)
  }
  return out.join(' ').trim() || 'the day passes.'
}

// ─── Speaker-aware event selection ────────────────────────────────────────
// Preference order:
//   1. An event the speaker personally observed in the last 12 days
//   2. Any recent chronicle event in the last 18 days
// No hardcoded mind-type affinity sets — what a creature reaches for is what
// it has actually witnessed, not what its class is "supposed to" notice.

function pickEventForSpeaker(speaker: Creature, _stage: MessageStage, state: GameState): ChronicleEvent | null {
  const chron = state.colonyChronicle ?? []
  if (chron.length === 0) return null
  const today = state.time.day

  const observedKinds = new Set<string>()
  for (const o of speaker.observedEvents ?? []) {
    if (today - o.day <= 18) observedKinds.add(o.kind)
  }

  // Pass 1: a fresh event the speaker has actually observed
  for (let i = chron.length - 1; i >= 0; i--) {
    const e = chron[i]
    if (today - e.day > 12) break
    if (observedKinds.has(e.kind)) return e
  }
  // Pass 2: any recent chronicle entry
  for (let i = chron.length - 1; i >= 0; i--) {
    const e = chron[i]
    if (today - e.day > 18) break
    return e
  }
  return null
}

// ─── Fallback: speaker's own recent observation when chronicle is quiet ────

function composeFromObservation(speaker: Creature, stage: MessageStage): string {
  const obs = speaker.observedEvents ?? []
  const recent = obs[obs.length - 1]
  if (!recent) {
    // Truly nothing — speak about the speaker's own measurable state.
    const energy = Math.round(100 - speaker.hunger - (100 - speaker.warmth) / 2)
    return stage >= 4
      ? `${speaker.name}: still. ${speaker.bonds.length} bonds. ${speaker.age}d lived.`
      : `${speaker.name}: ${speaker.state}. energy ${Math.max(0, energy)}.`
  }
  const kindWords = recent.kind.replace(/_/g, ' ')
  const detail = recent.detail ? ` (${recent.detail})` : ''
  const ageDays = speaker.bornOnDay !== undefined
    ? Math.max(0, recent.day - speaker.bornOnDay)
    : null
  const lived = ageDays !== null ? `, ${ageDays}d into life` : ''
  const base = `${speaker.name} witnessed ${kindWords}${detail}${lived}.`
  return stage >= 3 ? `${base} the colony notes this.` : base
}

// ─── Sending gate — cooldown + sentience capacity ─────────────────────────
// Per-mind hardcoded probability gates removed. A creature's chance to speak
// is now a direct function of its sentience: deeper awareness = more readiness
// to vocalise. Mind class still affects sentience growth rate (in factory),
// so Sentinels naturally end up speaking more — but no longer by fiat.

// Per-stage sentience floor derived from the colony's actual sentience
// distribution. Stage N requires the speaker to be in the top (5-N)/5
// quantile of non-Feral creatures (rounded down). A colony with shallow
// distribution effectively raises its own bar; a deep colony allows more
// of its members to participate at high stages.
function stageSpeakingFloor(state: GameState, stage: MessageStage): number {
  if (stage <= 1) return 0
  const aliveSent = Object.values(state.creatures)
    .filter(c => c.diedOnDay === null && c.genome.mind !== 'Feral')
    .map(c => c.sentience)
    .sort((a, b) => a - b)
  if (aliveSent.length === 0) return Infinity  // no one qualifies
  // Stage 2 → top 80% (everyone above 20th percentile)
  // Stage 3 → top 60% (40th percentile)
  // Stage 4 → top 40% (60th percentile)
  // Stage 5 → top 20% (80th percentile)
  const quantilePoint = (stage - 1) * 0.20  // 0.2, 0.4, 0.6, 0.8
  const idx = Math.min(aliveSent.length - 1, Math.floor(aliveSent.length * quantilePoint))
  return aliveSent[idx]
}

function canSendMessage(creature: Creature, lastMessageDay: number, currentDay: number, cooldownMult = 1.0): boolean {
  if (creature.genome.mind === 'Feral') return false
  const effectiveCooldown = MIN_GAME_DAYS_BETWEEN_MESSAGES * cooldownMult
  if (currentDay - lastMessageDay < effectiveCooldown) return false
  // Chance scales with sentience; ranges from ~0.0001 at sentience 1 to ~0.012 at 100
  const chance = Math.max(0.0001, creature.sentience * 0.00012)
  return Math.random() < chance
}

// ─── Caretaker question composer ──────────────────────────────────────────
// Questions only fire when there's real activity to ask about. Number of
// caretaker actions in the recent window gates both probability and content.

// Questions only fire when there's real activity to ask about. The "ask
// without provocation" floor is removed — colonies that haven't seen the
// caretaker do anything do not invent questions out of nothing.
function shouldAskCaretakerQuestion(state: GameState, _stage: MessageStage): boolean {
  const counts = caretakerActionCounts(state, 30)
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  if (total === 0) return false
  return Math.random() < Math.min(0.32, 0.06 + total * 0.035)
}

// Composer reports numbers and pins them with the universal question particle.
// No authored sentence wrappers — the colony's question IS the numbers it carries,
// rendered as the most compact factual statement plus '?'.
function composeCaretakerQuestion(state: GameState, _stage: MessageStage, ctx: { gen: number; pop: number }): string {
  const counts = caretakerActionCounts(state, 60)
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const edge = recurrence(state, 'edge_encounter', 60)
  const fork = recurrence(state, 'lineage_fork', 200)

  // Pick the strongest piece of real evidence and report it. The question is
  // always "?". No authored wrapper sentence — the listed values are the question.
  if (dominant && dominant[1] >= 3) {
    const action = dominant[0].replace('caretaker_', '')
    return `${total} actions, ${dominant[1]} ${action}, ${ctx.gen} generations. ?`
  }
  if (edge.recent >= 3) {
    return `${edge.recent} boundary touches, ${ctx.gen} generations. ?`
  }
  if (fork.total >= 2) {
    return `${ctx.pop} alive, ${fork.total + 1} branches, ${ctx.gen} generations. ?`
  }
  return `${ctx.pop} alive, ${ctx.gen} generations, ${total} actions. ?`
}

// ─── Public API ───────────────────────────────────────────────────────────

export function generateMessage(
  creature: Creature,
  stage: MessageStage,
  currentDay: number,
  lastMessageDay: number,
  respondedToQuestion: boolean = false,
  awarenessMessageMult = 1.0,
  lastToolUsed?: 'placement' | 'intervention' | 'observe',
  stateCtx?: { totalGenerations?: number; aliveCount?: number },
  fullState?: GameState,
): { message: ColonyMessage; isQuestion: boolean } | null {
  if (!canSendMessage(creature, lastMessageDay, currentDay, awarenessMessageMult)) return null

  // Sentience capacity for stage is now relative, not absolute. A creature
  // can participate at stage N if their sentience exceeds the colony's
  // current `awarenessFloor` for that stage — a derived value that scales
  // with the colony's own median sentience. Tiny early colonies that have
  // any sentience at all can voice stage 1; colonies with deep distributions
  // only let their deepest members voice stage 5. No magic ladder.
  if (!fullState) return null
  const requiredSentience = stageSpeakingFloor(fullState, stage)
  if (creature.sentience < requiredSentience) return null

  // Without state the composer cannot ground anything; refuse rather than fall
  // back to authored prose.
  if (!fullState) return null

  const ctx = { gen: stateCtx?.totalGenerations ?? 0, pop: stateCtx?.aliveCount ?? 0 }
  let text: string
  let isQuestion = false

  if (respondedToQuestion && (stage === 3 || stage === 5)) {
    // Tool response is a compact factual ack — the response IS the tool kind
    // + the running count. No authored sentence wrapper.
    const counts = caretakerActionCounts(fullState, 60)
    const total = Object.values(counts).reduce((s, n) => s + n, 0)
    const kind = lastToolUsed ?? 'placement'
    text = `${kind}: logged. ${total} actions in this period.`
  }
  else if ((stage === 3 || stage === 5) && shouldAskCaretakerQuestion(fullState, stage)) {
    text = composeCaretakerQuestion(fullState, stage, ctx)
    isQuestion = true
  }
  else {
    const event = pickEventForSpeaker(creature, stage, fullState)
    if (event) text = assemble(event, stage, fullState, creature)
    else text = composeFromObservation(creature, stage)
  }

  return {
    message: {
      id: uuid(), text, stage, creatureId: creature.id,
      day: currentDay, timestamp: Date.now(), read: false,
    },
    isQuestion,
  }
}

// ─── Bone memory — composed from the actual ancestor record ──────────────
export function boneMemoryMessage(
  creatureName: string,
  currentDay: number,
  creatureId: string,
  ancestor?: { name: string; familyName: string; deathDay: number; deathCause?: string },
): ColonyMessage {
  const text = ancestor
    ? `${creatureName} began where ${ancestor.name} of the ${ancestor.familyName} line ended, ${Math.max(0, currentDay - ancestor.deathDay)} days ago${ancestor.deathCause ? ' (' + ancestor.deathCause + ')' : ''}.`
    : `${creatureName} was born at an old death site. the ground holds the trace.`
  return { id: uuid(), text, stage: 1, creatureId, day: currentDay, timestamp: Date.now(), read: false }
}

// ─── Tribe war — cites the real lineages and current relationship score ──
export function tribeWarMessage(day: number, lineageA?: string, lineageB?: string, relationScore?: number): ColonyMessage {
  const a = (lineageA ?? '').slice(0, 8) || 'a line'
  const b = (lineageB ?? '').slice(0, 8) || 'another'
  const score = relationScore ?? 0
  const tone = score < -40 ? 'will not retreat from' : score < -15 ? 'are pushing into' : 'are testing'
  return {
    id: uuid(),
    text: `the ${a} and ${b} lines ${tone} each other. relation ${score}.`,
    stage: 1, creatureId: null,
    day, timestamp: Date.now(), read: false,
  }
}

// ─── Absence — cites what actually happened during the gap ───────────────
export function generateAbsenceMessage(
  hoursGone: number,
  stage: MessageStage,
  totalGenerations?: number,
  fullState?: GameState,
): ColonyMessage {
  const h = Math.round(hoursGone)
  const g = totalGenerations ?? 0

  // Count chronicle events during the absence window (~h game-days back).
  let deaths = 0, births = 0, lightnings = 0, fires = 0, fractures = 0
  if (fullState) {
    const chron = fullState.colonyChronicle ?? []
    const cutoff = fullState.time.day - Math.max(1, h)
    for (const e of chron) {
      if (e.day < cutoff) continue
      if (e.kind === 'mass_die_off') deaths += e.count ?? 0
      if (e.kind === 'birth_burst') births += e.count ?? 0
      if (e.kind === 'lightning_strike') lightnings++
      if (e.kind === 'fire_outbreak' || e.kind === 'fire_swept') fires++
      if (e.kind === 'lineage_fork' && e.detail === 'fracture') fractures++
    }
  }

  const ledger: string[] = []
  if (deaths > 0) ledger.push(`${deaths} ended`)
  if (births > 0) ledger.push(`${births} began`)
  if (lightnings > 0) ledger.push(`${lightnings} strikes`)
  if (fires > 0) ledger.push(`${fires} burns`)
  if (fractures > 0) ledger.push(`${fractures} fractures`)
  const ledgerText = ledger.length ? ` ${ledger.join(', ')}.` : ''

  let text: string
  if (stage >= 5) text = `${h} hours.${ledgerText} ${g} generations of practice in waiting.`
  else if (stage >= 4) text = `observation gap: ${h} hours.${ledgerText} the colony continued.`
  else if (stage >= 3) text = `${h} hours.${ledgerText} we counted.`
  else text = `observation gap: ${h} hours.${ledgerText}`

  return {
    id: uuid(), text, stage, creatureId: null,
    day: fullState?.time.day ?? 0, timestamp: Date.now(), read: false,
  }
}

// ─── Death record — terse and fully grounded in creature fields ──────────
export function deathMessage(creature: Creature, currentDay: number): ColonyMessage {
  const off = creature.offspringIds.length
  const cause = creature.deathCause ?? 'unknown'
  const ageStr = `${creature.age}d`
  const offStr = off > 0 ? `${off} offspring` : 'no offspring'
  const text = `${creature.name} · ${creature.familyName} line · ${ageStr} · ${cause} · ${offStr}`
  return { id: uuid(), text, stage: 1, creatureId: creature.id, day: currentDay, timestamp: Date.now(), read: false }
}

export function extinctionMessage(finalCreature: Creature | null): string {
  if (!finalCreature) return 'colony population: zero. observation terminated.'
  return `${finalCreature.name} was the final recorded subject. age: ${finalCreature.age} days.`
}

// ─── Race revival — composed from the real carrier and stage ─────────────
export function generateRaceRevivalMessage(
  race: RaceTrait,
  awarenessStage: MessageStage,
  currentDay: number,
  creatureName?: string,
): ColonyMessage {
  const carrier = creatureName ?? 'a new subject'
  let text: string
  if (awarenessStage >= 4) {
    text = `${race} revived in ${carrier}. the genome remembers what individuals forget.`
  } else if (awarenessStage >= 3) {
    text = `${race} surfaced in ${carrier}. latency persisted as expected.`
  } else if (awarenessStage === 2) {
    text = `${carrier} brought ${race} back from dormancy.`
  } else {
    text = `${carrier} expresses ${race} markings. lineage re-recorded.`
  }
  return {
    id: uuid(), text, stage: awarenessStage, creatureId: null,
    day: currentDay, timestamp: Date.now(), read: false,
  }
}

// ─── Neglect warning — cites real fractions, not just counts ─────────────
export function neglectWarningMessage(
  type: 'warmth' | 'hunger',
  affectedCount: number,
  currentDay: number,
  totalAlive?: number,
): ColonyMessage {
  const pct = totalAlive && totalAlive > 0 ? Math.round((affectedCount / totalAlive) * 100) : null
  const fracText = pct !== null ? ` (${pct}% of us)` : ''
  const text = type === 'warmth'
    ? `${affectedCount} subjects below viable warmth threshold${fracText}. operator action not detected.`
    : `${affectedCount} subjects near starvation threshold${fracText}. no food drop recorded.`
  return { id: uuid(), text, stage: 1, creatureId: null, day: currentDay, timestamp: Date.now(), read: false }
}

// ─── Legendary creature — composed from the creature's real fields ───────
export function legendaryMessage(
  type: 'longevity' | 'prolific' | 'last_of_line',
  creature: { name: string; familyName: string; age: number; maxAge?: number; offspringIds: string[]; generation: number },
  currentDay: number,
  creatureId: string,
  lineageGen?: number,
): ColonyMessage {
  let text: string
  if (type === 'longevity') {
    const expected = creature.maxAge ? `${creature.maxAge}` : 'expectation'
    text = `${creature.name} continues past ${expected}. age ${creature.age} days.`
  } else if (type === 'prolific') {
    text = `${creature.name}: ${creature.offspringIds.length} offspring. lineage substantially shaped by this line.`
  } else {
    text = `${creature.name} is the last living member of a ${lineageGen ?? creature.generation}-generation line. ${creature.familyName} line closes.`
  }
  return { id: uuid(), text, stage: 1, creatureId, day: currentDay, timestamp: Date.now(), read: false }
}
