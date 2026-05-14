import { supabase } from './supabase'
import { GameState } from '@/types'

const IDB_NAME    = 'laiet_db'
const IDB_VERSION = 1
const IDB_STORE   = 'game_state'

// ─── IndexedDB ────────────────────────────────────────────────────────────────

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { keyPath: 'worldId' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
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
  // IDB first; local copy is always preserved before any network attempt.
  await saveToIDB(state)

  // One cloud save at a time; skip if a previous attempt is still in flight.
  if (cloudSaveInProgress) return
  cloudSaveInProgress = true

  try {
    // Exponential backoff: immediate, then 800 ms, then 3 200 ms.
    const delays = [0, 800, 3200]
    for (let i = 0; i < delays.length; i++) {
      if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]))
      if (await attemptCloudUpsert(state)) return
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

// ─── Auto-save manager ────────────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setInterval> | null = null

export function startAutoSave(
  getState: () => GameState,
  intervalMs = 30_000
): void {
  if (saveTimer) clearInterval(saveTimer)
  saveTimer = setInterval(async () => {
    try {
      await saveToCloud(getState())
    } catch (e) {
      console.warn('[laiet] Auto-save error:', e)
    }
  }, intervalMs)
}

export function stopAutoSave(): void {
  if (saveTimer) {
    clearInterval(saveTimer)
    saveTimer = null
  }
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
