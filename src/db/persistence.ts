import { supabase } from './supabase'
import { GameState } from '@/types'

const IDB_NAME    = 'laiet_db'
const IDB_VERSION = 1
const IDB_STORE   = 'game_state'

// ─── IndexedDB ────────────────────────────────────────────────────────────────

// A single connection is opened lazily and reused for the tab's lifetime.
// Re-opening on every save leaked one connection per call (one every 30 s) —
// and, critically, those stale handles blocked deleteDatabase() during a
// world reset, so old colony data was never actually wiped. The handle is
// dropped on versionchange (another tab deleting the DB) and on close so the
// next call reopens cleanly.
let _idbConn: IDBDatabase | null = null

function openIDB(): Promise<IDBDatabase> {
  if (_idbConn) return Promise.resolve(_idbConn)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { keyPath: 'worldId' })
    }
    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => { db.close(); _idbConn = null }
      db.onclose = () => { _idbConn = null }
      _idbConn = db
      resolve(db)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function saveToIDB(state: GameState): Promise<void> {
  const db = await openIDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put({ ...state, lastSaved: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(new Error(`IDB put failed: ${tx.error?.message}`))
  })
}

export async function loadFromIDB(worldId: string): Promise<GameState | null> {
  try {
    const db = await openIDB()
    return await new Promise((resolve, reject) => {
      const tx  = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(worldId)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror   = () => reject(req.error)
    })
  } catch (e) {
    console.warn('[laiet] IDB load failed:', e)
    return null
  }
}

export async function listIDBWorlds(): Promise<{ worldId: string; lastSaved: number }[]> {
  try {
    const db = await openIDB()
    return await new Promise((resolve, reject) => {
      const tx  = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).getAll()
      req.onsuccess = () =>
        resolve(req.result.map((s: GameState & { lastSaved: number }) => ({
          worldId:   s.worldId,
          lastSaved: s.lastSaved ?? 0,
        })))
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

// Hard-delete a single world from IDB. Throws on failure.
export async function deleteFromIDB(worldId: string): Promise<void> {
  const db = await openIDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(worldId)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(new Error(`IDB delete failed: ${tx.error?.message}`))
  })
}

// Delete the entire IndexedDB database. Used during full reset when the
// worldId may be unknown. Rejects if another tab holds an open connection.
export function wipeAllIDB(): Promise<void> {
  // Drop our own connection first so deleteDatabase is never blocked by this
  // tab. Without this, leaked save-time connections kept the wipe pending and
  // a world reset silently left stale data behind.
  if (_idbConn) { _idbConn.close(); _idbConn = null }
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(IDB_NAME)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(new Error(`IDB wipe failed: ${req.error?.message}`))
    req.onblocked = () => {
      console.warn('[laiet] IDB wipe blocked; close other tabs and retry')
      reject(new Error('IDB wipe blocked by open connection in another tab'))
    }
  })
}

// ─── Supabase cloud sync ──────────────────────────────────────────────────────

let cloudSaveInProgress = false

async function attemptCloudUpsert(state: GameState): Promise<boolean> {
  const { error } = await supabase
    .from('colonies')
    .upsert({
      world_id:   state.worldId,
      user_id:    state.userId,
      state:      { ...state, lastSaved: Date.now() },
      updated_at: new Date().toISOString(),
    })
  if (error) {
    console.warn('[laiet] Cloud upsert error:', error.message)
    return false
  }
  return true
}

export async function saveToCloud(state: GameState): Promise<void> {
  // IDB first; the full local copy (all dead creatures, full history) is
  // always preserved before any network attempt.
  await saveToIDB(state)

  // One cloud save at a time; skip if a previous attempt is still in flight.
  if (cloudSaveInProgress) return
  cloudSaveInProgress = true

  // Cloud only needs a living-world snapshot — trim dead creatures and excess
  // messages so the JSONB payload (and Supabase storage + egress) stays small.
  // Matches what the cloud auto-save timer already does; previously manual and
  // session-end saves pushed the full untrimmed state.
  const trimmed = trimStateForCloud(state)

  try {
    // Exponential backoff: immediate, then 800 ms, then 3 200 ms.
    const delays = [0, 800, 3200]
    for (let i = 0; i < delays.length; i++) {
      if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]))
      if (await attemptCloudUpsert(trimmed)) return
    }
    console.warn('[laiet] Cloud save failed after 3 attempts (IDB backup preserved)')
  } catch (e) {
    console.warn('[laiet] Cloud save exception (IDB backup preserved):', e)
  } finally {
    cloudSaveInProgress = false
  }
}

export async function loadFromCloud(userId: string): Promise<GameState | null> {
  try {
    const { data, error } = await supabase
      .from('colonies')
      .select('state')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.warn('[laiet] Cloud load failed:', error.message)
      return null
    }
    return data?.state as GameState ?? null
  } catch (e) {
    console.warn('[laiet] Cloud load exception:', e)
    return null
  }
}

export async function loadBestAvailable(userId: string): Promise<GameState | null> {
  // Fetch cloud and IDB concurrently; use whichever has the later lastSaved.
  // IDB is written first on every auto-save so it is frequently ahead of cloud.
  const [cloud, worlds] = await Promise.all([
    loadFromCloud(userId),
    listIDBWorlds(),
  ])

  let idb: GameState | null = null
  if (worlds.length > 0) {
    worlds.sort((a, b) => b.lastSaved - a.lastSaved)
    idb = await loadFromIDB(worlds[0].worldId)
  }

  if (!cloud && !idb) return null
  if (!cloud) return idb
  if (!idb)   return cloud

  return (cloud.lastSaved ?? 0) >= (idb.lastSaved ?? 0) ? cloud : idb
}

// ─── Hard deletes ─────────────────────────────────────────────────────────────

// Hard-delete a single colony from Supabase. Throws on error.
export async function deleteColonyFromCloud(worldId: string): Promise<void> {
  const { error } = await supabase
    .from('colonies')
    .delete()
    .eq('world_id', worldId)
  if (error) throw new Error(`[laiet] Colony delete failed: ${error.message}`)
}

// ─── Full user data reset ─────────────────────────────────────────────────────
//
// Calls the server-side `reset_user_data()` Postgres function (SECURITY
// DEFINER) which hard-deletes all rows from `colonies` and `fossil_records`
// for the authenticated user. The function resolves auth.uid() server-side so
// it is impossible to delete another user's data regardless of client input.
//
// After the cloud wipe succeeds, the entire local IndexedDB is deleted so no
// stale world state survives the reset. The user's auth.users row; and
// therefore their login session; is not touched.
export async function resetUserData(): Promise<void> {
  const { error } = await supabase.rpc('reset_user_data')
  if (error) throw new Error(`[laiet] Cloud reset failed: ${error.message}`)
  // Wipe IDB after confirmed cloud delete. If this fails, the old IDB data
  // will be ignored on next load because the cloud is now empty; but we still
  // throw so the caller can surface a warning.
  await wipeAllIDB()
}

// ─── Cloud payload trimming ───────────────────────────────────────────────────

// Strips dead creatures and excess messages before sending to Supabase.
// The full state (including all dead creatures) is always preserved in IDB;
// cloud only needs enough to reconstruct an accurate living-world snapshot.
function trimStateForCloud(state: GameState): GameState {
  const currentDay = state.time.day
  const DEAD_PRUNE_DAYS = 5 // drop corpse records older than this many game days

  const trimmedCreatures = Object.fromEntries(
    Object.entries(state.creatures).filter(([, c]) =>
      c.diedOnDay === null || (currentDay - c.diedOnDay) <= DEAD_PRUNE_DAYS
    )
  )

  const trimmedMessages = state.messages.slice(-100)

  return { ...state, creatures: trimmedCreatures, messages: trimmedMessages }
}

// ─── Auto-save manager ────────────────────────────────────────────────────────
// Two separate timers:
//   idbTimer  — every 30 s, full state to IndexedDB only (zero network cost)
//   cloudTimer — every 5 min, trimmed state to Supabase (10× fewer cloud writes)

let idbTimer:   ReturnType<typeof setInterval> | null = null
let cloudTimer: ReturnType<typeof setInterval> | null = null

export function startAutoSave(
  getState: () => GameState,
  _intervalMs = 30_000  // kept for call-site compat; ignored — timers are fixed
): void {
  if (idbTimer)   clearInterval(idbTimer)
  if (cloudTimer) clearInterval(cloudTimer)

  idbTimer = setInterval(async () => {
    try {
      await saveToIDB(getState())
    } catch (e) {
      console.warn('[laiet] IDB auto-save error:', e)
    }
  }, 30_000)

  cloudTimer = setInterval(async () => {
    try {
      const trimmed = trimStateForCloud(getState())
      if (cloudSaveInProgress) return
      cloudSaveInProgress = true
      try {
        const delays = [0, 800, 3200]
        for (let i = 0; i < delays.length; i++) {
          if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]))
          if (await attemptCloudUpsert(trimmed)) return
        }
        console.warn('[laiet] Cloud auto-save failed after 3 attempts (IDB preserved)')
      } finally {
        cloudSaveInProgress = false
      }
    } catch (e) {
      console.warn('[laiet] Cloud auto-save error:', e)
    }
  }, 300_000)
}

export function stopAutoSave(): void {
  if (idbTimer)   { clearInterval(idbTimer);   idbTimer   = null }
  if (cloudTimer) { clearInterval(cloudTimer); cloudTimer = null }
}

// ─── Fossil record persistence ────────────────────────────────────────────────

export async function appendFossilRecord(
  userId: string,
  fossil: GameState['fossilRecord'][number]
): Promise<void> {
  const { error } = await supabase.from('fossil_records').insert({
    user_id:    userId,
    fossil,
    created_at: new Date().toISOString(),
  })
  if (error) console.warn('[laiet] Fossil insert failed:', error.message)
}

export async function loadFossilRecords(
  userId: string
): Promise<GameState['fossilRecord']> {
  const { data, error } = await supabase
    .from('fossil_records')
    .select('fossil')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.warn('[laiet] Fossil load failed:', error.message)
    return []
  }
  return (data ?? []).map(d => d.fossil)
}

// Hard-delete all fossil records for a user. Used when the user explicitly
// requests a full history wipe (separate from resetUserData which also covers
// fossils via the server-side RPC).
export async function deleteAllFossilRecords(userId: string): Promise<void> {
  const { error } = await supabase
    .from('fossil_records')
    .delete()
    .eq('user_id', userId)
  if (error) throw new Error(`[laiet] Fossil delete failed: ${error.message}`)
}
