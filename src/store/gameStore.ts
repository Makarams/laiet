import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import {
  GameState, Creature, EventAction, CaretakerState, CaretakerProfile
} from '@/types'
import { tickSimulation, computePassiveTicks, computeAbsenceHours } from '@/engine/tick'
import { generateAbsenceMessage } from '@/engine/messages'
import { generateWorld, worldSeedFromTimestamp } from '@/world/worldGen'
import { createStarterCreatures } from '@/creatures/factory'
import { saveToCloud, loadBestAvailable, startAutoSave, stopAutoSave, resetUserData } from '@/db/persistence'
import { computeSimModifiers } from '@/engine/profile'
import {
  TICK_INTERVAL_MS, FOOD_DROP_COOLDOWN_MS, FOOD_PER_PATCH,
  HEAL_CHARGES_PER_DAY, HEAL_AMOUNT,
  THUNDER_COOLDOWN_MS, THUNDER_CHARGES_PER_DAY, THUNDER_DAMAGE_RADIUS,
  FIRE_COOLDOWN_MS, FIRE_CHARGES_PER_DAY, FIRE_DURATION_TICKS,
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

// Returns updated caretaker fields for any tile-targeted action.
// Records position for awareness acceleration and sets respondedToQuestion
// if a stage-3 question is currently awaiting a reply.
function applyCaretakerPresence(
  ct: CaretakerState,
  x: number,
  y: number
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
  tickInterval: ReturnType<typeof setInterval> | null

  // Time controls
  isPaused: boolean
  simSpeed: 1 | 2 | 4
  togglePause: () => void
  setSimSpeed: (speed: 1 | 2 | 4) => void

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
  redirectRiver: (fromX: number, fromY: number, toX: number, toY: number) => void
  resolveEvent: (eventId: string, action: EventAction) => void
  // Environmental tools
  thunderStrike: (x: number, y: number) => void
  igniteFire:    (x: number, y: number) => void

  // UI state
  selectedCreatureId: string | null
  selectCreature: (id: string | null) => void
  hoveredTile: { x: number; y: number } | null
  hoverTile: (pos: { x: number; y: number } | null) => void
  markMessagesRead: () => void
  unreadMessageCount: number
}

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
      endgame: null,
      weather: 'clear' as const,
      weatherTimer: 20 + Math.random() * 15,
      totalCreaturesEver: 4,
      totalGenerations: 0,
      totalDeaths: 0,
      lastSaved: Date.now(),
      lastSessionEnd: null,
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
      console.warn('[laiet] Reset incomplete — cloud data may still exist:', e)
    }
  },

  loadWorld: async (userId) => {
    set({ isLoading: true })
    try {
      const state = await loadBestAvailable(userId)
      if (state) {
        // If already extinct, restore for viewing only — no tick loop, no autosave
        if (state.endgame) {
          set({ gameState: state })
          return
        }

        const passiveTicks = computePassiveTicks(state.lastSessionEnd)
        const hoursAway   = computeAbsenceHours(state.lastSessionEnd)
        let advanced = state
        for (let i = 0; i < passiveTicks; i++) {
          if (advanced.endgame) break   // colony died during catch-up — stop here
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

        set({ gameState: advanced })
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
    const { isPaused, simSpeed } = get()
    if (isPaused) return
    const existing = get().tickInterval
    if (existing) clearInterval(existing)
    const intervalMs = Math.floor(TICK_INTERVAL_MS / (simSpeed ?? 1))
    const interval = setInterval(() => {
      const state = get().gameState
      if (!state || state.endgame) return
      if (get().isPaused) return
      const nextState = tickSimulation(state)
      const unread = nextState.messages.filter(m => !m.read).length
      set({ gameState: nextState, unreadMessageCount: unread })
    }, intervalMs)
    set({ tickInterval: interval })
  },

  // stopTicking only clears the tick interval — it does NOT stop auto-save.
  // Call stopAutoSave() explicitly where needed (markSessionEnd, resetWorld).
  stopTicking: () => {
    const interval = get().tickInterval
    if (interval) clearInterval(interval)
    set({ tickInterval: null })
  },

  togglePause: () => {
    const { isPaused, gameState } = get()
    const next = !isPaused
    set({ isPaused: next })
    if (next) {
      const interval = get().tickInterval
      if (interval) clearInterval(interval)
      set({ tickInterval: null })
    } else if (gameState && !gameState.endgame) {
      get().startTicking()
    }
  },

  setSimSpeed: (speed) => {
    set({ simSpeed: speed })
    const { isPaused, gameState } = get()
    if (!isPaused && gameState && !gameState.endgame) {
      // Restart interval with new period
      const existing = get().tickInterval
      if (existing) clearInterval(existing)
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

    const tiles = state.tiles.map(row => row.map(t => ({ ...t })))
    const tile = tiles[y]?.[x]
    if (!tile) return
    if (tile.type === 'rock' || tile.type === 'river' || tile.type === 'flooded') return

    tile.type = 'food_patch'
    tile.foodAmount = FOOD_PER_PATCH

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
    const tiles = state.tiles.map(row => row.map(t => ({ ...t })))
    const tile = tiles[y]?.[x]
    if (!tile || tile.type === 'rock' || tile.type === 'river') return

    tile.type = 'tree'
    tile.treeAge = 0
    tile.shelter = false

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

    const tiles = state.tiles.map(row => row.map(t => ({ ...t })))
    const creatures = { ...state.creatures }
    const messages = [...state.messages]

    // Burn/clear tiles in radius, set lightningFlash for visual bolt effect
    const R = THUNDER_DAMAGE_RADIUS
    const strikeNow = Date.now()
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const tx = x + dx, ty = y + dy
        if (tx < 0 || tx >= tiles[0].length || ty < 0 || ty >= tiles.length) continue
        const t = tiles[ty][tx]
        t.lightningFlash = strikeNow
        if (t.type === 'tree' || t.type === 'shelter') {
          t.burning = FIRE_DURATION_TICKS
          t.type = 'barren'
          t.treeAge = -1
          t.shelter = false
        } else if (t.type === 'food_patch') {
          t.foodAmount = 0
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
          ...applyCaretakerPresence(ct, x, y),
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

    const tiles = state.tiles.map(row => row.map(t => ({ ...t })))
    tiles[y][x].burning = FIRE_DURATION_TICKS

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
          ...applyCaretakerPresence(ct, x, y),
        },
      },
    })
  },

  healCreature: (creatureId) => {
    const state = get().gameState
    if (!state) return
    if (state.caretaker.healCharges <= 0) return

    const creature = state.creatures[creatureId]
    if (!creature || creature.diedOnDay !== null) return

    const creatures = { ...state.creatures }
    creatures[creatureId] = {
      ...creature,
      health: Math.min(100, creature.health + HEAL_AMOUNT),
      state: 'idle',
    }

    set({
      gameState: {
        ...state,
        creatures,
        caretaker: {
          ...state.caretaker,
          healCharges: state.caretaker.healCharges - 1,
          ...applyCaretakerPresence(state.caretaker, creature.x, creature.y),
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

  redirectRiver: (fromX, fromY, toX, toY) => {
    const state = get().gameState
    if (!state || state.caretaker.riverRedirectUsed) return

    const tiles = state.tiles.map(row => row.map(t => ({ ...t })))
    if (tiles[fromY]?.[fromX]) tiles[fromY][fromX].type = 'mud'
    if (tiles[toY]?.[toX]) {
      tiles[toY][toX].type = 'river'
      tiles[toY][toX].waterLevel = 100
    }

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

  selectCreature: (id) => set({ selectedCreatureId: id }),
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
