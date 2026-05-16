import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import {
  GameState, Creature, EventAction, CaretakerState, CaretakerProfile, EnrichmentType, EnrichmentItem
} from '@/types'
import { tickSimulation, computePassiveTicks, computeAbsenceHours } from '@/engine/tick'
import { generateAbsenceMessage } from '@/engine/messages'
import { generateWorld, worldSeedFromTimestamp } from '@/world/worldGen'
import { createStarterCreatures } from '@/creatures/factory'
import { saveToCloud, loadBestAvailable, startAutoSave, stopAutoSave, resetUserData } from '@/db/persistence'
import { computeSimModifiers } from '@/engine/profile'
import { normalizeFamilyName } from '@/engine/genetics'
import {
  TICK_INTERVAL_MS, FOOD_DROP_COOLDOWN_MS, FOOD_PER_PATCH,
  HEAL_CHARGES_PER_DAY, HEAL_AMOUNT,
  THUNDER_COOLDOWN_MS, THUNDER_CHARGES_PER_DAY, THUNDER_DAMAGE_RADIUS,
  FIRE_COOLDOWN_MS, FIRE_CHARGES_PER_DAY, FIRE_DURATION_TICKS,
  ENRICHMENT_MAX_USES, ABSENCE_IMPRINT_DAYS,
} from '@/engine/constants'

// ─── Default caretaker state ──────────────────────────────────────────────────

const defaultCaretaker = (healCharges = HEAL_CHARGES_PER_DAY, foodDropCooldown = FOOD_DROP_COOLDOWN_MS): CaretakerState => ({
  healCharges,
  lastHealReset: Date.now(),
  riverRedirectUsed: false,
  lastSeasonRedirect: 'spring',
  foodDropCooldown,
  lastFoodDrop: 0,
  lastThunder: 0,
  lastFire: 0,
  thunderChargesToday: THUNDER_CHARGES_PER_DAY,
  fireChargesToday: FIRE_CHARGES_PER_DAY,
  lastEnvReset: Date.now(),
  lastActionX: null,
  lastActionY: null,
  lastActionMs: 0,
  awaitingResponseUntil: 0,
  respondedToQuestion: false,
})

function normalizeLoadedCreatureNames(state: GameState): { state: GameState; changed: boolean } {
  let changed = false
  const creatures = Object.fromEntries(
    Object.entries(state.creatures).map(([id, creature]) => {
      const familyName = normalizeFamilyName(creature.familyName)
      if (familyName !== creature.familyName) changed = true
      return [id, { ...creature, familyName }]
    })
  )

  return changed ? { state: { ...state, creatures }, changed: true } : { state, changed: false }
}

// Returns updated caretaker fields for any tile-targeted action.
// Records position for awareness acceleration and sets respondedToQuestion
// if a stage-3 question is currently awaiting a reply.
function applyCaretakerPresence(
  ct: CaretakerState,
  x: number,
  y: number,
  toolCategory: 'placement' | 'intervention' | 'observe' = 'placement'
): Partial<CaretakerState> {
  const now = Date.now()
  const respondedToQuestion = (ct.awaitingResponseUntil ?? 0) > now
    ? true
    : (ct.respondedToQuestion ?? false)
  return {
    lastActionX: x,
    lastActionY: y,
    lastActionMs: now,
    respondedToQuestion,
    lastToolUsed: toolCategory,
  }
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface LaietStore {
  // Auth
  userId: string | null
  userEmail: string | null
  setUser: (id: string, email: string) => void
  clearUser: () => void

  // Game state
  gameState: GameState | null
  isLoading: boolean
  tickInterval: ReturnType<typeof setTimeout> | null

  // Time controls
  isPaused: boolean
  simSpeed: 1 | 2 | 4 | 8
  togglePause: () => void
  setSimSpeed: (speed: 1 | 2 | 4 | 8) => void

  // Actions
  initNewWorld: (userId: string, namedCreatures: { name: string; familyName: string }[], profile: CaretakerProfile) => void
  loadWorld: (userId: string) => Promise<void>
  resetWorld: () => Promise<void>
  startTicking: () => void
  stopTicking: () => void
  manualSave: () => Promise<void>
  markSessionEnd: () => void

  // Caretaker actions
  dropFood: (x: number, y: number) => void
  plantTree: (x: number, y: number) => void
  healCreature: (creatureId: string) => void
  breakUpFight: (eventId: string) => void
  placeWater: (x: number, y: number) => void
  redirectRiver: (fromX: number, fromY: number, toX: number, toY: number) => void
  resolveEvent: (eventId: string, action: EventAction) => void
  // Environmental tools
  thunderStrike: (x: number, y: number) => void
  igniteFire:    (x: number, y: number) => void
  // Enrichment
  placeEnrichment: (x: number, y: number, type: EnrichmentType) => void
  removeEnrichment: (id: string) => void

  // UI state
  selectedCreatureId: string | null
  selectCreature: (id: string | null) => void
  hoveredTile: { x: number; y: number } | null
  hoverTile: (pos: { x: number; y: number } | null) => void
  markMessagesRead: () => void
  unreadMessageCount: number
}

// ─── Tick-loop wall-clock anchor (module-level) ───────────────────────────────
// Tracks when the last tick actually fired so the time-delta loop can
// determine how many simulation ticks are owed on every callback, regardless
// of how much real time elapsed between callbacks (browser throttling, GC
// pauses, tab switching, etc.).
let _lastTickWallMs = 0

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLaietStore = create<LaietStore>((set, get) => ({
  userId: null,
  userEmail: null,
  gameState: null,
  isLoading: false,
  tickInterval: null,
  selectedCreatureId: null,
  hoveredTile: null,
  unreadMessageCount: 0,
  isPaused: false,
  simSpeed: 1,

  setUser: (id, email) => set({ userId: id, userEmail: email }),
  clearUser: () => set({ userId: null, userEmail: null, gameState: null }),

  initNewWorld: (userId, namedCreatures, profile) => {
    const modifiers = computeSimModifiers(profile)
    const seed = worldSeedFromTimestamp()
    const tiles = generateWorld(seed)
    const creatures = createStarterCreatures(namedCreatures, seed, 0)
    const creatureMap: Record<string, Creature> = {}
    for (const c of creatures) creatureMap[c.id] = c

    const state: GameState = {
      worldId: uuid(),
      userId,
      worldSeed: seed,
      createdAt: Date.now(),
      profile,
      modifiers,
      time: {
        day: 0,
        totalMinutesElapsed: 0,
        season: 'spring',
        year: 0,
        phase: 'day',
      },
      tiles,
      creatures: creatureMap,
      tribes: {},
      messages: [],
      events: [],
      fossilRecord: [],
      caretaker: defaultCaretaker(modifiers.healCharges, modifiers.foodDropCooldownMs),
      colonyStage: 'genesis',
      awarenessStage: 1,
      cohortPhase: 1,
      endgame: null,
      enrichmentItems: {},
      weather: 'clear' as const,
      weatherTimer: 20 + Math.random() * 15,
      totalCreaturesEver: 4,
      totalGenerations: 0,
      totalDeaths: 0,
      lastSaved: Date.now(),
      lastSessionEnd: null,
      snowAccumulation: 0,
    }

    set({ gameState: state })
    get().startTicking()
    startAutoSave(() => get().gameState!, 30_000)
  },

  resetWorld: async () => {
    get().stopTicking()
    stopAutoSave()
    // Clear local UI state immediately so the player isn't staring at a dead
    // world while the network calls complete.
    set({ gameState: null, selectedCreatureId: null, unreadMessageCount: 0, isPaused: false })
    try {
      // Server-side RPC deletes all colonies + fossil_records for the current
      // user, then wipes IndexedDB. Auth session is preserved.
      await resetUserData()
    } catch (e) {
      // Non-fatal: local state is already cleared. Cloud data may linger until
      // the next successful reset or until the user's auth row is eventually
      // cascaded. Log so it's visible in devtools.
      console.warn('[laiet] Reset incomplete; cloud data may still exist:', e)
    }
  },

  loadWorld: async (userId) => {
    set({ isLoading: true })
    try {
      const state = await loadBestAvailable(userId)
      if (state) {
        const migrated = normalizeLoadedCreatureNames(state)

        // Legacy saves may have endgame:'ascension' or 'fracture' from before those
        // endings were removed. Clear them so the simulation resumes rather than
        // freezing with no escape route. Only 'extinction' is a valid terminal state.
        if (migrated.state.endgame && migrated.state.endgame !== 'extinction') {
          migrated.state.endgame = null
        }

        // If already extinct, restore for viewing only; no tick loop, no autosave
        if (migrated.state.endgame === 'extinction') {
          set({ gameState: migrated.state })
          if (migrated.changed) {
            await saveToCloud(migrated.state)
          }
          return
        }

        // Q10C: Asymmetric idle consequences — spring/summer absence is safe (0 ticks),
        // autumn/storm applies limited catch-up, winter/drought applies full catch-up.
        const rawPassiveTicks = computePassiveTicks(migrated.state.lastSessionEnd)
        const isHarsh    = migrated.state.time.season === 'winter' || (migrated.state.weather ?? 'clear') === 'drought'
        const isModerate  = migrated.state.time.season === 'autumn' || (migrated.state.weather ?? 'clear') === 'storm'
        const passiveTicks = isHarsh ? rawPassiveTicks : isModerate ? Math.min(rawPassiveTicks, 40) : 0
        const hoursAway   = computeAbsenceHours(migrated.state.lastSessionEnd)
        let advanced = migrated.state
        for (let i = 0; i < passiveTicks; i++) {
          if (advanced.endgame) break   // colony died during catch-up; stop here
          advanced = tickSimulation(advanced)
        }

        // Emit an absence message once for any notable away time. Inserted
        // before live ticking resumes so the player sees the colony's
        // observation about their return immediately.
        if (hoursAway >= 0.5 && !advanced.endgame) {
          const absenceMsg = generateAbsenceMessage(hoursAway, advanced.awarenessStage)
          absenceMsg.day = advanced.time.day
          advanced = {
            ...advanced,
            messages: [...advanced.messages, absenceMsg].slice(-200),
          }
        }

        // Absence imprint: long absences (>= 2 real hours) leave stress on the colony.
        if (hoursAway >= 2 && !advanced.endgame) {
          advanced = { ...advanced, absenceImprint: ABSENCE_IMPRINT_DAYS }
        }

        set({ gameState: advanced })
        if (migrated.changed) {
          await saveToCloud(advanced)
        }
        if (!advanced.endgame) {
          get().startTicking()
          startAutoSave(() => get().gameState!, 30_000)
        }
      }
    } finally {
      set({ isLoading: false })
    }
  },

  startTicking: () => {
    const { isPaused, gameState } = get()
    if (isPaused) return
    if (!gameState || gameState.endgame) return

    // Clear any pre-existing handle before arming a new loop.
    const existing = get().tickInterval
    if (existing) clearTimeout(existing)

    // ── Time-delta tick loop ──────────────────────────────────────────────
    //
    // Goal: the simulation advances at the correct real-time rate regardless
    // of whether the browser throttles or delays our callbacks.  Browsers
    // may coalesce or slow setTimeout in background tabs (Chrome: 1 Hz
    // minimum; others may be worse), but they never *skip* callbacks
    // entirely while the tab is open.  By measuring actual wall-clock
    // elapsed time on every callback we can fire as many ticks as are owed
    // and stay perfectly in sync.
    //
    // Visibility / focus state is deliberately IGNORED here.  The loop
    // runs unconditionally while the tab exists — switching windows, other
    // tabs coming to the foreground, or document.hidden being true are all
    // irrelevant.  The only things that stop the loop are:
    //   • stopTicking() called explicitly (manual pause, session end, reset)
    //   • the game reaching an endgame state
    //   • the tab being closed / page unloaded (timer is GC'd naturally)
    //
    // Max-catch-up cap: if the browser was heavily throttled (e.g. the tab
    // was backgrounded for a long time) we cap the number of ticks that fire
    // in a single callback so we never freeze the UI for seconds at a time.
    // The existing passive-tick system in loadWorld already handles genuine
    // "tab closed and reopened" catch-up; this cap only guards against
    // in-session bursts.
    const MAX_TICKS_PER_CALLBACK = 3

    const loop = () => {
      const state = get().gameState
      if (!state || state.endgame || get().isPaused) {
        set({ tickInterval: null })
        return
      }

      const now = Date.now()
      const speed = get().simSpeed ?? 1
      const tickMs = TICK_INTERVAL_MS / speed  // real ms per one simulation tick

      // Seed the wall-clock anchor the first time (or after a speed change
      // reset it via startTicking).
      if (_lastTickWallMs === 0) _lastTickWallMs = now

      const elapsed = now - _lastTickWallMs
      const ticksOwed = Math.floor(elapsed / tickMs)

      // If no full tick has elapsed yet just reschedule for the remainder.
      if (ticksOwed === 0) {
        const remaining = tickMs - (elapsed % tickMs)
        set({ tickInterval: setTimeout(loop, Math.max(4, remaining)) })
        return
      }

      // Apply up to MAX_TICKS_PER_CALLBACK ticks in this callback.
      const ticksToRun = Math.min(ticksOwed, MAX_TICKS_PER_CALLBACK)
      let current = state
      for (let i = 0; i < ticksToRun; i++) {
        if (current.endgame) break
        current = tickSimulation(current)
      }

      // Advance the anchor by however many ticks we actually ran so any
      // remaining debt carries forward to the next callback rather than
      // being silently dropped.
      _lastTickWallMs += ticksToRun * tickMs

      const unread = current.messages.filter(m => !m.read).length
      set({ gameState: current, unreadMessageCount: unread })

      if (current.endgame) {
        set({ tickInterval: null })
        return
      }

      // Schedule the next callback for when the next tick will be due.
      const nextIn = tickMs - ((Date.now() - _lastTickWallMs) % tickMs)
      set({ tickInterval: setTimeout(loop, Math.max(4, nextIn)) })
    }

    // Reset the wall-clock anchor whenever startTicking is called fresh
    // (new world, speed change, un-pause) so elapsed-time accounting starts
    // clean and we don't inherit a stale gap from a previous loop run.
    _lastTickWallMs = 0

    loop()
  },

  // stopTicking clears the pending timeout.  Does NOT touch auto-save —
  // call stopAutoSave() explicitly where needed (markSessionEnd, resetWorld).
  stopTicking: () => {
    const handle = get().tickInterval
    if (handle) clearTimeout(handle)
    set({ tickInterval: null })
    _lastTickWallMs = 0
  },

  togglePause: () => {
    const { isPaused, gameState } = get()
    const next = !isPaused
    set({ isPaused: next })
    if (next) {
      const handle = get().tickInterval
      if (handle) clearTimeout(handle)
      set({ tickInterval: null })
    } else if (gameState && !gameState.endgame) {
      get().startTicking()
    }
  },

  setSimSpeed: (speed: 1 | 2 | 4 | 8) => {
    set({ simSpeed: speed })
    const { isPaused, gameState } = get()
    if (!isPaused && gameState && !gameState.endgame) {
      // Clear the pending timeout; startTicking will reset _lastTickWallMs
      // so there is no phantom elapsed-time debt at the new speed.
      const existing = get().tickInterval
      if (existing) clearTimeout(existing)
      set({ tickInterval: null })
      get().startTicking()
    }
  },

  manualSave: async () => {
    const state = get().gameState
    if (!state) return
    await saveToCloud({ ...state, lastSaved: Date.now() })
  },

  markSessionEnd: () => {
    const state = get().gameState
    if (!state) return
    const updated = { ...state, lastSessionEnd: Date.now() }
    set({ gameState: updated })
    saveToCloud(updated)
    get().stopTicking()
    stopAutoSave()
  },

  // ── Caretaker actions ──

  dropFood: (x, y) => {
    const state = get().gameState
    if (!state) return
    const now = Date.now()
    const cooldown = state.modifiers?.foodDropCooldownMs ?? FOOD_DROP_COOLDOWN_MS
    if (now - state.caretaker.lastFoodDrop < cooldown) return

    const srcTile = state.tiles[y]?.[x]
    if (!srcTile) return
    if (srcTile.type === 'rock' || srcTile.type === 'river' || srcTile.type === 'flooded') return

    // Clone only the affected row (O(n) vs full O(n²) deep-clone of the 240×240 grid)
    const tiles = state.tiles.slice()
    tiles[y] = state.tiles[y].slice()
    tiles[y][x] = { ...srcTile, type: 'food_patch', foodAmount: FOOD_PER_PATCH }

    set({
      gameState: {
        ...state,
        tiles,
        caretaker: { ...state.caretaker, lastFoodDrop: now, ...applyCaretakerPresence(state.caretaker, x, y) },
      }
    })
  },

  plantTree: (x, y) => {
    const state = get().gameState
    if (!state) return
    const srcTile = state.tiles[y]?.[x]
    if (!srcTile || srcTile.type === 'rock' || srcTile.type === 'river') return

    const tiles = state.tiles.slice()
    tiles[y] = state.tiles[y].slice()
    tiles[y][x] = { ...srcTile, type: 'tree', treeAge: 0, shelter: false }

    set({ gameState: { ...state, tiles, caretaker: { ...state.caretaker, ...applyCaretakerPresence(state.caretaker, x, y) } } })
  },

  // ── Environmental: Thunder strike ─────────────────────────────────────────
  // Instant area damage at click point. Lethal in the immediate radius;
  // shocks creatures further out (stress + small health hit). Trees & shelters
  // in radius become barren immediately. Cooldown + daily charge cap.
  thunderStrike: (x, y) => {
    const state = get().gameState
    if (!state) return
    const now = Date.now()
    const ct = state.caretaker

    // Refresh daily charges
    const dayMs = 86_400_000
    let thunderCharges = ct.thunderChargesToday
    let fireCharges = ct.fireChargesToday
    let lastEnvReset = ct.lastEnvReset
    if (now - lastEnvReset > dayMs) {
      thunderCharges = THUNDER_CHARGES_PER_DAY
      fireCharges = FIRE_CHARGES_PER_DAY
      lastEnvReset = now
    }
    if (thunderCharges <= 0) return
    if (now - ct.lastThunder < THUNDER_COOLDOWN_MS) return

    const creatures = { ...state.creatures }
    const messages = [...state.messages]

    // Burn/clear tiles in radius, set lightningFlash for visual bolt effect
    const R = THUNDER_DAMAGE_RADIUS
    const strikeNow = Date.now()

    // Clone only the rows touched by the strike radius (O(R) vs O(n²) full clone)
    const tiles = state.tiles.slice()
    for (let dy = -R; dy <= R; dy++) {
      const ty = y + dy
      if (ty >= 0 && ty < tiles.length) tiles[ty] = state.tiles[ty].slice()
    }

    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const tx = x + dx, ty = y + dy
        if (tx < 0 || tx >= tiles[0].length || ty < 0 || ty >= tiles.length) continue
        const t = tiles[ty][tx]
        if (t.type === 'tree' || t.type === 'shelter') {
          tiles[ty][tx] = { ...t, lightningFlash: strikeNow, burning: FIRE_DURATION_TICKS, type: 'barren', treeAge: -1, shelter: false }
        } else if (t.type === 'food_patch') {
          tiles[ty][tx] = { ...t, lightningFlash: strikeNow, foodAmount: 0 }
        } else {
          tiles[ty][tx] = { ...t, lightningFlash: strikeNow }
        }
      }
    }

    // Kill creatures in radius; stress outer ring
    let killed = 0
    for (const id in creatures) {
      const c = creatures[id]
      if (c.diedOnDay !== null) continue
      const dist = Math.abs(c.x - x) + Math.abs(c.y - y)
      if (dist <= R) {
        creatures[id] = { ...c, health: 0, state: 'dying' }
        killed++
      } else if (dist <= R + 3) {
        creatures[id] = { ...c, stress: Math.min(100, c.stress + 30) }
      }
    }

    messages.push({
      id: crypto.randomUUID?.() ?? `m-${now}`,
      text: killed > 0
        ? `lightning struck the world. ${killed} did not survive.`
        : 'lightning struck the world.',
      stage: 1,
      creatureId: null,
      day: state.time.day,
      timestamp: now,
      read: false,
    })

    set({
      gameState: {
        ...state,
        tiles,
        creatures,
        messages: messages.slice(-200),
        caretaker: {
          ...ct,
          lastThunder: now,
          thunderChargesToday: thunderCharges - 1,
          fireChargesToday: fireCharges,
          lastEnvReset,
          ...applyCaretakerPresence(ct, x, y, 'intervention'),
        },
      },
    })
  },

  // ── Environmental: Ignite fire ────────────────────────────────────────────
  // Sets a single tile burning. Spreads via tickTiles to adjacent flammable
  // tiles. Creatures standing on a burning tile take damage and flee.
  igniteFire: (x, y) => {
    const state = get().gameState
    if (!state) return
    const now = Date.now()
    const ct = state.caretaker

    const dayMs = 86_400_000
    let thunderCharges = ct.thunderChargesToday
    let fireCharges = ct.fireChargesToday
    let lastEnvReset = ct.lastEnvReset
    if (now - lastEnvReset > dayMs) {
      thunderCharges = THUNDER_CHARGES_PER_DAY
      fireCharges = FIRE_CHARGES_PER_DAY
      lastEnvReset = now
    }
    if (fireCharges <= 0) return
    if (now - ct.lastFire < FIRE_COOLDOWN_MS) return

    const tile = state.tiles[y]?.[x]
    if (!tile) return
    if (tile.type !== 'tree' && tile.type !== 'shelter' && tile.type !== 'food_patch' && tile.type !== 'grass') return

    const tiles = state.tiles.slice()
    tiles[y] = state.tiles[y].slice()
    tiles[y][x] = { ...tile, burning: FIRE_DURATION_TICKS }

    const messages = [...state.messages, {
      id: crypto.randomUUID?.() ?? `m-${now}`,
      text: 'a fire begins.',
      stage: 1 as const,
      creatureId: null,
      day: state.time.day,
      timestamp: now,
      read: false,
    }]

    set({
      gameState: {
        ...state,
        tiles,
        messages: messages.slice(-200),
        caretaker: {
          ...ct,
          lastFire: now,
          fireChargesToday: fireCharges - 1,
          thunderChargesToday: thunderCharges,
          lastEnvReset,
          ...applyCaretakerPresence(ct, x, y, 'intervention'),
        },
      },
    })
  },

  placeEnrichment: (x, y, type) => {
    const state = get().gameState
    if (!state) return
    const tile = state.tiles[y]?.[x]
    if (!tile) return
    // Only place on passable non-water tiles
    if (tile.type === 'rock' || tile.type === 'river' || tile.type === 'mountain' || tile.type === 'cliff' || tile.type === 'flooded') return
    // One enrichment item per tile
    const alreadyThere = Object.values(state.enrichmentItems ?? {}).find(e => e.x === x && e.y === y)
    if (alreadyThere) return

    const id = crypto.randomUUID?.() ?? `enrich-${Date.now()}`
    const newItem: EnrichmentItem = {
      id,
      type,
      x,
      y,
      placedOnDay: state.time.day,
      usedBy: null,
      totalUses: 0,
      maxUses: ENRICHMENT_MAX_USES,
      usesRemaining: ENRICHMENT_MAX_USES,
    }
    set({
      gameState: {
        ...state,
        enrichmentItems: { ...(state.enrichmentItems ?? {}), [id]: newItem },
        caretaker: { ...state.caretaker, ...applyCaretakerPresence(state.caretaker, x, y) },
      },
    })
  },

  removeEnrichment: (id) => {
    const state = get().gameState
    if (!state) return
    const items = { ...(state.enrichmentItems ?? {}) }
    delete items[id]
    set({ gameState: { ...state, enrichmentItems: items } })
  },

  healCreature: (creatureId) => {
    const state = get().gameState
    if (!state) return
    if (state.caretaker.healCharges <= 0) return

    const creature = state.creatures[creatureId]
    if (!creature || creature.diedOnDay !== null) return
    if (creature.health >= 80) return

    const creatures = { ...state.creatures }
    creatures[creatureId] = {
      ...creature,
      health: Math.min(100, creature.health + HEAL_AMOUNT),
      stress: Math.max(0, creature.stress - 20),
      state: 'idle',
    }

    set({
      gameState: {
        ...state,
        creatures,
        caretaker: {
          ...state.caretaker,
          healCharges: state.caretaker.healCharges - 1,
          ...applyCaretakerPresence(state.caretaker, creature.x, creature.y, 'intervention'),
        },
      }
    })
  },

  breakUpFight: (eventId) => {
    const state = get().gameState
    if (!state) return

    const event = state.events.find(e => e.id === eventId)
    if (!event) return

    const creatures = { ...state.creatures }
    for (const id of event.involvedCreatureIds) {
      if (creatures[id]) {
        creatures[id] = {
          ...creatures[id],
          state: 'idle',
          targetX: null,
          targetY: null,
          stress: Math.max(0, creatures[id].stress - 10),
        }
      }
    }

    const events = state.events.map(e =>
      e.id === eventId ? { ...e, resolved: true } : e
    )

    set({ gameState: { ...state, creatures, events } })
  },

  placeWater: (x, y) => {
    const state = get().gameState
    if (!state) return
    const tile = state.tiles[y]?.[x]
    if (!tile) return
    if (tile.type === 'rock' || tile.type === 'mountain' || tile.type === 'cliff') return

    const tiles = state.tiles.slice()
    tiles[y] = state.tiles[y].slice()
    tiles[y][x] = { ...tile, type: 'river', waterLevel: 100 }

    set({
      gameState: {
        ...state,
        tiles,
        caretaker: { ...state.caretaker, ...applyCaretakerPresence(state.caretaker, x, y) },
      }
    })
  },

  redirectRiver: (fromX, fromY, toX, toY) => {
    const state = get().gameState
    if (!state) return
    if (state.caretaker.riverRedirectUsed) return

    const tiles = state.tiles.slice()
    const rowsToCopy = new Set([fromY, toY].filter(r => r >= 0 && r < tiles.length))
    for (const row of rowsToCopy) tiles[row] = state.tiles[row].slice()
    if (state.tiles[fromY]?.[fromX]) tiles[fromY][fromX] = { ...state.tiles[fromY][fromX], type: 'mud' }
    if (state.tiles[toY]?.[toX]) tiles[toY][toX] = { ...state.tiles[toY][toX], type: 'river', waterLevel: 100 }

    set({
      gameState: {
        ...state,
        tiles,
        caretaker: {
          ...state.caretaker,
          riverRedirectUsed: true,
          lastSeasonRedirect: state.time.season,
          ...applyCaretakerPresence(state.caretaker, toX, toY),
        },
      }
    })
  },

  resolveEvent: (eventId, action) => {
    const state = get().gameState
    if (!state) return

    const event = state.events.find(e => e.id === eventId)
    if (!event) return

    const store = get()

    switch (action) {
      case 'break_up': store.breakUpFight(eventId); break
      case 'heal_creature':
        for (const id of event.involvedCreatureIds) store.healCreature(id)
        break
      case 'drop_food': {
        const c = event.involvedCreatureIds[0] ? state.creatures[event.involvedCreatureIds[0]] : null
        if (c) store.dropFood(c.x, c.y)
        break
      }
      case 'plant_tree': {
        const c = event.involvedCreatureIds[0] ? state.creatures[event.involvedCreatureIds[0]] : null
        if (c) store.plantTree(c.x + 1, c.y)
        break
      }
    }

    set({
      gameState: {
        ...get().gameState!,
        events: state.events.map(e =>
          e.id === eventId ? { ...e, resolved: true } : e
        )
      }
    })
  },

  selectCreature: (id) => {
    const state = get().gameState
    if (state && id) {
      const creature = state.creatures[id]
      if (creature && creature.diedOnDay === null) {
        set({
          selectedCreatureId: id,
          gameState: {
            ...state,
            caretaker: {
              ...state.caretaker,
              ...applyCaretakerPresence(state.caretaker, creature.x, creature.y, 'observe'),
            },
          },
        })
        return
      }
    }
    set({ selectedCreatureId: id })
  },
  hoverTile: (pos) => set({ hoveredTile: pos }),

  markMessagesRead: () => {
    const state = get().gameState
    if (!state) return
    set({
      gameState: {
        ...state,
        messages: state.messages.map(m => ({ ...m, read: true })),
      },
      unreadMessageCount: 0,
    })
  },
}))