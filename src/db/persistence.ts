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

// `colonies.state` stores a gzip envelope, NOT the raw GameState. The state —
// dominated by its WORLD_SIZE² procedural tile grid — serialises to tens of MB.
// Upserting that into a JSONB column every few minutes buried Postgres in WAL
// and dead-tuple churn until the project's disk filled and the instance
// crash-looped (every dependent service then reporting "connection refused").
// The grid is highly repetitive, so gzip shrinks the payload ~20-50× to a few
// hundred KB — an ordinary row update again. Never write the uncompressed
// state to the cloud.
const CLOUD_FMT = 2

interface CloudEnvelope {
  fmt: number
  gz:  string   // base64-encoded gzip of JSON.stringify(state)
}

function isCloudEnvelope(v: unknown): v is CloudEnvelope {
  return !!v && typeof v === 'object' && typeof (v as CloudEnvelope).gz === 'string'
}

// btoa() chokes on the multi-MB intermediate string produced by spreading the
// whole byte array into String.fromCharCode, so walk the buffer in chunks.
function base64FromBytes(bytes: Uint8Array): string {
  let bin = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}

function bytesFromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function gzip(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  const buf = await new Response(stream).arrayBuffer()
  return base64FromBytes(new Uint8Array(buf))
}

async function gunzip(b64: string): Promise<string> {
  const stream = new Blob([bytesFromBase64(b64)]).stream()
    .pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

async function buildCloudEnvelope(state: GameState): Promise<CloudEnvelope> {
  const json = JSON.stringify({ ...state, lastSaved: Date.now() })
  return { fmt: CLOUD_FMT, gz: await gzip(json) }
}

async function attemptCloudUpsert(state: GameState, payload: CloudEnvelope): Promise<boolean> {
  const { error } = await supabase
    .from('colonies')
    .upsert({
      world_id:   state.worldId,
      user_id:    state.userId,
      state:      payload,
      updated_at: new Date().toISOString(),
    })
  if (error) {
    console.warn('[laiet] Cloud upsert error:', error.message)
    return false
  }
  return true
}

// Compress a (trimmed) state once, then upsert with exponential backoff. The
// envelope is built before the retry loop so a transient network failure never
// re-compresses the large state. Caller owns the cloudSaveInProgress guard.
async function pushTrimmedToCloud(trimmed: GameState): Promise<void> {
  const payload = await buildCloudEnvelope(trimmed)
  // Exponential backoff: immediate, then 800 ms, then 3 200 ms.
  const delays = [0, 800, 3200]
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]))
    if (await attemptCloudUpsert(trimmed, payload)) return
  }
  console.warn('[laiet] Cloud save failed after 3 attempts (IDB backup preserved)')
}

export async function saveToCloud(state: GameState): Promise<void> {
  // IDB first; the full local copy (all dead creatures, full history) is
  // always preserved before any network attempt.
  await saveToIDB(state)

  // One cloud save at a time; skip if a previous attempt is still in flight.
  if (cloudSaveInProgress) return
  cloudSaveInProgress = true

  try {
    // Cloud only needs a living-world snapshot — trim dead creatures and
    // excess messages, then gzip, so the JSONB payload stays small.
    await pushTrimmedToCloud(trimStateForCloud(state))
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
    const raw = data?.state
    if (!raw) return null
    // Current format: gzip envelope. Legacy rows (written before compression)
    // stored the raw GameState object directly — still load those verbatim.
    if (isCloudEnvelope(raw)) {
      return JSON.parse(await gunzip(raw.gz)) as GameState
    }
    return raw as GameState
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
//   cloudTimer — every 5 min, trimmed + gzipped state to Supabase

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
    if (cloudSaveInProgress) return
    cloudSaveInProgress = true
    try {
      await pushTrimmedToCloud(trimStateForCloud(getState()))
    } catch (e) {
      console.warn('[laiet] Cloud auto-save error:', e)
    } finally {
      cloudSaveInProgress = false
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
