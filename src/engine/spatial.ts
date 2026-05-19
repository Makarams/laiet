// Creature spatial grid.
//
// Buckets alive creatures into fixed-size grid cells so per-creature radius
// queries (witnesses, conflict, rivals) drop from O(N) to O(creatures in the
// surrounding cells), typically 0–6 instead of 100–500.
//
// Build cost: one O(N) pass over alive. Query cost: O(cells_in_radius) +
// O(creatures_in_those_cells). For the 30+ pre-existing per-tick scans this
// replaces, the win is large at 100+ creatures.
//
// Cells are 16 tiles wide. With WORLD_SIZE=480 that's 30×30 = 900 cells —
// enough granularity that the typical query radius (3–14 tiles) touches 1–4
// cells, but coarse enough that the bucket map stays small.

import { Creature } from '@/types'
import { WORLD_SIZE } from '@/engine/constants'

export const CELL_SIZE = 16
export const CELL_COUNT = Math.ceil(WORLD_SIZE / CELL_SIZE)

export interface CreatureGrid {
  // Flat cell array; index = cy * CELL_COUNT + cx
  cells: Creature[][]
}

export function buildCreatureGrid(alive: Creature[]): CreatureGrid {
  const cells: Creature[][] = new Array(CELL_COUNT * CELL_COUNT)
  // Pre-fill is unnecessary — we lazy-allocate the bucket on first insert.
  for (let i = 0; i < alive.length; i++) {
    const c = alive[i]
    const cx = (c.x / CELL_SIZE) | 0
    const cy = (c.y / CELL_SIZE) | 0
    const idx = cy * CELL_COUNT + cx
    const bucket = cells[idx]
    if (bucket) bucket.push(c)
    else cells[idx] = [c]
  }
  return { cells }
}

// Iterate creatures whose position falls within Chebyshev radius `r` of (x, y).
// Caller filters further (id != self, bond status, lineage, etc.). The grid
// over-approximates — we yield every creature whose CELL overlaps the radius;
// callers using strict-distance predicates skip the rest naturally.
export function* nearbyCreatures(grid: CreatureGrid, x: number, y: number, r: number): Generator<Creature> {
  const minCx = Math.max(0, ((x - r) / CELL_SIZE) | 0)
  const maxCx = Math.min(CELL_COUNT - 1, ((x + r) / CELL_SIZE) | 0)
  const minCy = Math.max(0, ((y - r) / CELL_SIZE) | 0)
  const maxCy = Math.min(CELL_COUNT - 1, ((y + r) / CELL_SIZE) | 0)
  for (let cy = minCy; cy <= maxCy; cy++) {
    const rowBase = cy * CELL_COUNT
    for (let cx = minCx; cx <= maxCx; cx++) {
      const bucket = grid.cells[rowBase + cx]
      if (!bucket) continue
      for (let i = 0; i < bucket.length; i++) yield bucket[i]
    }
  }
}

// Same shape but materialises into an array; cheaper than generator at very
// small radii where overhead dominates, and lets call-sites use .find / .some.
export function nearbyArray(grid: CreatureGrid, x: number, y: number, r: number): Creature[] {
  const out: Creature[] = []
  const minCx = Math.max(0, ((x - r) / CELL_SIZE) | 0)
  const maxCx = Math.min(CELL_COUNT - 1, ((x + r) / CELL_SIZE) | 0)
  const minCy = Math.max(0, ((y - r) / CELL_SIZE) | 0)
  const maxCy = Math.min(CELL_COUNT - 1, ((y + r) / CELL_SIZE) | 0)
  for (let cy = minCy; cy <= maxCy; cy++) {
    const rowBase = cy * CELL_COUNT
    for (let cx = minCx; cx <= maxCx; cx++) {
      const bucket = grid.cells[rowBase + cx]
      if (bucket) {
        for (let i = 0; i < bucket.length; i++) out.push(bucket[i])
      }
    }
  }
  return out
}
