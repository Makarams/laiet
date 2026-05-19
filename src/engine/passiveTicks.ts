// Passive-tick catch-up math.
//
// When a player closes the tab and returns later, the simulation needs to
// advance by a bounded number of ticks to simulate "what happened while you
// were away." These helpers compute the catch-up budget from the last session
// end timestamp; they're pure (no GameState) so they live outside tick.ts.
//
// The simulation auto-pauses when the tab is hidden, so the gap matters only
// when the tab was fully closed (beforeunload fired). The cap is intentionally
// small — just enough to advance weather + day/night a couple of minutes on a
// real tab close/reopen without endangering the colony through a long drought.

const MAX_PASSIVE_TICKS = 240   // 4 real minutes of catch-up maximum

export function computePassiveTicks(lastSessionEnd: number | null): number {
  if (!lastSessionEnd) return 0
  const elapsed = Date.now() - lastSessionEnd
  if (elapsed <= 0) return 0
  const realMinutes = elapsed / 60_000
  return Math.min(Math.floor(realMinutes * 60), MAX_PASSIVE_TICKS)
}

// How many real hours the player was away. Used by the absence imprint
// composer to scale message tone.
export function computeAbsenceHours(lastSessionEnd: number | null): number {
  if (!lastSessionEnd) return 0
  const elapsed = Date.now() - lastSessionEnd
  return Math.max(0, elapsed / 3_600_000)
}
