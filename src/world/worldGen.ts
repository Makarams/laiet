import { Tile, TileType, BiomePatch, Season } from '@/types'
import { WORLD_SIZE, TREE_FOOD_MATURE_AGE } from '@/engine/constants'

// ─── Seeded RNG (mulberry32) ─────────────────────────────────────────────────

export function createRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s += 0x6D2B79F5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Noise ───────────────────────────────────────────────────────────────────

function valueNoise(x: number, y: number, seed: number): number {
  const rng = createRng(seed + x * 1000 + y * 37)
  return rng()
}

function smoothNoise(x: number, y: number, seed: number): number {
  const corners = (
    valueNoise(x - 1, y - 1, seed) + valueNoise(x + 1, y - 1, seed) +
    valueNoise(x - 1, y + 1, seed) + valueNoise(x + 1, y + 1, seed)
  ) / 16
  const sides = (
    valueNoise(x - 1, y, seed) + valueNoise(x + 1, y, seed) +
    valueNoise(x, y - 1, seed) + valueNoise(x, y + 1, seed)
  ) / 8
  const center = valueNoise(x, y, seed) / 4
  return corners + sides + center
}

function fractalNoise(x: number, y: number, seed: number, octaves = 3): number {
  let val = 0
  let amp = 1
  let freq = 1
  let max = 0
  for (let i = 0; i < octaves; i++) {
    val += smoothNoise(x * freq, y * freq, seed + i * 7919) * amp
    max += amp
    amp *= 0.5
    freq *= 2
  }
  return val / max
}

// ─── Biome assignment ─────────────────────────────────────────────────────────

function assignBiome(elevation: number, moisture: number): BiomePatch {
  if (elevation > 0.72) return 'rocky'
  if (moisture > 0.62) return 'wetland'
  if (moisture > 0.44) return 'lush'
  if (moisture < 0.18) return 'arid'
  return 'temperate'
}

// ─── River carving ────────────────────────────────────────────────────────────

function carveRiver(tiles: Tile[][], rng: () => number): void {
  // Main river; enters from top, exits at bottom. Wider on the larger world.
  const startX = Math.floor(WORLD_SIZE * 0.3 + rng() * WORLD_SIZE * 0.4)
  let x = startX
  let widthPhase = 0

  for (let y = 0; y < WORLD_SIZE; y++) {
    widthPhase += rng() * 0.5
    const wide = Math.sin(widthPhase) > 0.1 && y > 3 && y < WORLD_SIZE - 3
    const veryWide = Math.sin(widthPhase * 0.4) > 0.5 && y > 8 && y < WORLD_SIZE - 8

    const cells = veryWide ? [-2, -1, 0, 1, 2] : wide ? [-1, 0, 1] : [0]
    for (const dx of cells) {
      const rx = x + dx
      if (rx >= 0 && rx < WORLD_SIZE) {
        tiles[y][rx].type = 'river'
        tiles[y][rx].waterLevel = 100
        tiles[y][rx].biome = 'wetland'
      }
    }

    // Gentle meander; biased to stay in central third
    const drift = rng()
    const pullToCenter = x < WORLD_SIZE * 0.25 ? 0.55
      : x > WORLD_SIZE * 0.75 ? 0.15
      : 0.35
    if (drift < pullToCenter && x > 2) x--
    else if (drift > pullToCenter + 0.35 && x < WORLD_SIZE - 3) x++
  }

  // Second tributary from opposite side, meets main river mid-map
  const t2StartX = rng() < 0.5
    ? Math.floor(2 + rng() * (WORLD_SIZE / 3))
    : Math.floor(WORLD_SIZE * 0.65 + rng() * (WORLD_SIZE / 3))
  let tx2 = t2StartX
  const joinY = Math.floor(WORLD_SIZE * 0.4 + rng() * (WORLD_SIZE * 0.2))
  for (let y = 0; y < joinY; y++) {
    if (tx2 >= 0 && tx2 < WORLD_SIZE) {
      const t = tiles[y][tx2]
      if (t.type !== 'river') {
        t.type = 'river'
        t.waterLevel = 80
        t.biome = 'wetland'
      }
    }
    const drift = rng()
    if (drift < 0.30 && tx2 > 1) tx2--
    else if (drift > 0.65 && tx2 < WORLD_SIZE - 2) tx2++
  }

  // Small ponds scattered around the map (scaled for larger world)
  const pondCount = 5 + Math.floor(rng() * 5)
  for (let p = 0; p < pondCount; p++) {
    const px = 4 + Math.floor(rng() * (WORLD_SIZE - 8))
    const py = 4 + Math.floor(rng() * (WORLD_SIZE - 8))
    const pr = 1 + Math.floor(rng() * 2)
    for (let dy = -pr; dy <= pr; dy++) {
      for (let dx = -pr; dx <= pr; dx++) {
        if (dx * dx + dy * dy > pr * pr + 0.6) continue
        const nx = px + dx; const ny = py + dy
        if (nx >= 0 && nx < WORLD_SIZE && ny >= 0 && ny < WORLD_SIZE) {
          const t = tiles[ny][nx]
          if (t.type === 'grass' || t.type === 'mud' || t.type === 'barren') {
            t.type = 'river'
            t.waterLevel = 70
            t.biome = 'wetland'
          }
        }
      }
    }
  }

  // Mud bands alongside river for wetland feel
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let bx = 0; bx < WORLD_SIZE; bx++) {
      if (tiles[y][bx].type !== 'river') continue
      const adj = [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, 1], [1, -1], [-1, -1], [1, 1]]
      for (const [ddx, ddy] of adj) {
        const nx = bx + ddx; const ny = y + ddy
        if (nx < 0 || nx >= WORLD_SIZE || ny < 0 || ny >= WORLD_SIZE) continue
        if (tiles[ny][nx].type === 'grass' && rng() < 0.25) {
          tiles[ny][nx].type = 'mud'
          tiles[ny][nx].biome = 'wetland'
        }
      }
    }
  }
}

// ─── Tree clusters ────────────────────────────────────────────────────────────

function plantTrees(tiles: Tile[][], _seed: number, rng: () => number): void {
  // Scale clusters with world area; 120×120 is 4× the old 60×60
  const clusterCount = 100 + Math.floor(rng() * 40)
  for (let cluster = 0; cluster < clusterCount; cluster++) {
    const cx = 1 + Math.floor(rng() * (WORLD_SIZE - 2))
    const cy = 1 + Math.floor(rng() * (WORLD_SIZE - 2))
    const radius = 1 + Math.floor(rng() * 5)
    const density = 0.45 + rng() * 0.40
    const oldGrowth = rng() < 0.4

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if ((dx * dx) / (radius * radius) + (dy * dy) / (radius * radius) > 1.1) continue
        const nx = cx + dx
        const ny = cy + dy
        if (nx < 0 || nx >= WORLD_SIZE || ny < 0 || ny >= WORLD_SIZE) continue
        const t = tiles[ny][nx]
        if (t.type === 'grass' || t.type === 'mud') {
          if (rng() < density) {
            t.type = 'tree'
            t.treeAge = oldGrowth ? 999 : Math.floor(rng() * 400)
            t.shelter = t.treeAge >= 300
          }
        }
      }
    }
  }
}

// ─── Rocks ───────────────────────────────────────────────────────────────────

function scatterRocks(tiles: Tile[][], rng: () => number): void {
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const t = tiles[y][x]
      if (t.biome === 'rocky' && t.type === 'grass') {
        if (rng() < 0.50) t.type = 'rock'
      }
    }
  }

  // Scattered rock outcroppings; scaled by world area vs 60×60 baseline
  const outcrops = 28 + Math.floor(rng() * 20)
  for (let o = 0; o < outcrops; o++) {
    const ox = 2 + Math.floor(rng() * (WORLD_SIZE - 4))
    const oy = 2 + Math.floor(rng() * (WORLD_SIZE - 4))
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = ox + dx; const ny = oy + dy
        if (nx >= 0 && nx < WORLD_SIZE && ny >= 0 && ny < WORLD_SIZE) {
          if (tiles[ny][nx].type === 'grass' && rng() < 0.55) {
            tiles[ny][nx].type = 'rock'
          }
        }
      }
    }
  }
}

// ─── Cliffs ───────────────────────────────────────────────────────────────────
// A cliff forms where a high-elevation tile drops sharply to a low-elevation
// neighbor. We scan every tile and compare it to its cardinal neighbors; if the
// elevation delta exceeds the threshold the tile becomes a cliff; impassable
// to creatures, acting as a natural barrier between isolated zones.

function carveCliffs(tiles: Tile[][], elevMap: number[][], rng: () => number): void {
  const CLIFF_DROP = 0.28  // minimum elevation drop to carve a cliff
  for (let y = 1; y < WORLD_SIZE - 1; y++) {
    for (let x = 1; x < WORLD_SIZE - 1; x++) {
      const t = tiles[y][x]
      if (t.type === 'river' || t.type === 'mountain') continue
      const e = elevMap[y][x]
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]]
      let sharpDrop = false
      for (const [dx, dy] of dirs) {
        const ne = elevMap[y + dy]?.[x + dx] ?? e
        if (e - ne > CLIFF_DROP) { sharpDrop = true; break }
      }
      // Only 70% of sharp-drop tiles become cliffs (adds natural variety)
      if (sharpDrop && rng() < 0.70) {
        t.type = 'cliff'
        t.elevation = e
      }
    }
  }
}

// ─── Guarantee accessible resources near world center ─────────────────────────

function seedCenterResources(tiles: Tile[][], rng: () => number): void {
  const cx = Math.floor(WORLD_SIZE / 2)
  const cy = Math.floor(WORLD_SIZE / 2)
  const radius = 8

  // Ensure a mature tree exists near center; food patches require a nearby mature
  // tree to persist and regrow; a guaranteed starter tree seeds the initial food supply.
  let hasMatureTreeNearCenter = false
  for (let dy = -radius; dy <= radius && !hasMatureTreeNearCenter; dy++) {
    for (let dx = -radius; dx <= radius && !hasMatureTreeNearCenter; dx++) {
      const nx = cx + dx; const ny = cy + dy
      if (nx < 0 || nx >= WORLD_SIZE || ny < 0 || ny >= WORLD_SIZE) continue
      const t = tiles[ny][nx]
      if ((t.type === 'tree' || t.type === 'shelter') && t.treeAge >= TREE_FOOD_MATURE_AGE) {
        hasMatureTreeNearCenter = true
      }
    }
  }

  if (!hasMatureTreeNearCenter) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const fx = cx + Math.floor(rng() * (radius * 2 + 1)) - radius
      const fy = cy + Math.floor(rng() * (radius * 2 + 1)) - radius
      if (fx < 0 || fx >= WORLD_SIZE || fy < 0 || fy >= WORLD_SIZE) continue
      const t = tiles[fy][fx]
      if (t.type === 'grass' || t.type === 'barren' || t.type === 'mud') {
        t.type = 'tree'
        t.treeAge = TREE_FOOD_MATURE_AGE + 50
        t.shelter = true
        break
      }
    }
  }

  // Also ensure a river is reachable from center (within 20 tiles)
  let hasWaterNear = false
  for (let dy = -16; dy <= 16 && !hasWaterNear; dy++) {
    for (let dx = -16; dx <= 16 && !hasWaterNear; dx++) {
      const nx = cx + dx; const ny = cy + dy
      if (nx < 0 || nx >= WORLD_SIZE || ny < 0 || ny >= WORLD_SIZE) continue
      if (tiles[ny][nx].type === 'river') hasWaterNear = true
    }
  }

  if (!hasWaterNear) {
    // Carve a small pond near center
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + 6 + dx; const ny = cy + dy
        if (nx >= 0 && nx < WORLD_SIZE && ny >= 0 && ny < WORLD_SIZE) {
          tiles[ny][nx].type = 'river'
          tiles[ny][nx].waterLevel = 80
          tiles[ny][nx].biome = 'wetland'
        }
      }
    }
  }
}

// ─── Mountains ───────────────────────────────────────────────────────────────

function raiseMountains(tiles: Tile[][], elevMap: number[][]): void {
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const t = tiles[y][x]
      const elev = elevMap[y][x]
      // Only in rocky biome at high elevation, away from rivers
      if (t.biome === 'rocky' && elev > 0.78 && t.type !== 'river') {
        t.type = 'mountain'
        t.elevation = elev
      }
    }
  }
}

// ─── Bush / understorey vegetation ───────────────────────────────────────────
// Scattered low fruiting shrubs; denser in humid biomes, rare in arid, absent
// in rocky zones. Each bush starts with a random berry amount (0–25).

function scatterBushes(tiles: Tile[][], rng: () => number): void {
  for (let y = 1; y < WORLD_SIZE - 1; y++) {
    for (let x = 1; x < WORLD_SIZE - 1; x++) {
      const t = tiles[y][x]
      if (t.type !== 'grass') continue
      const density = t.biome === 'lush'      ? 0.13
        : t.biome === 'wetland'   ? 0.11
        : t.biome === 'temperate' ? 0.065
        : t.biome === 'arid'      ? 0.015
        : 0
      if (rng() < density) {
        t.type = 'bush'
        t.foodAmount = Math.floor(rng() * 25)
        t.treeAge = -1
      }
    }
  }
}

// Healroot patches; medicinal herb clusters in lush/wetland margins and near
// water sources. Rare in temperate, absent in arid/rocky.
// Also seeded near rivers (riparian herb growth).
function scatterHealroot(tiles: Tile[][], rng: () => number): void {
  for (let y = 1; y < WORLD_SIZE - 1; y++) {
    for (let x = 1; x < WORLD_SIZE - 1; x++) {
      const t = tiles[y][x]
      if (t.type !== 'grass') continue

      // Base density by biome
      let density = t.biome === 'lush'      ? 0.042
        : t.biome === 'wetland'   ? 0.038
        : t.biome === 'temperate' ? 0.018
        : 0

      // Bonus density adjacent to rivers (riverside herbs)
      if (density > 0) {
        const hasNearbyRiver = (
          tiles[y - 1]?.[x]?.type === 'river' ||
          tiles[y + 1]?.[x]?.type === 'river' ||
          tiles[y]?.[x - 1]?.type === 'river' ||
          tiles[y]?.[x + 1]?.type === 'river'
        )
        if (hasNearbyRiver) density *= 2.2
      }

      if (density > 0 && rng() < density) {
        t.type = 'healroot'
        t.healrootAmount = Math.floor(40 + rng() * 60)  // starts 40–100
        t.treeAge = -1
      }
    }
  }
}

function digCaves(tiles: Tile[][], rng: () => number): void {
  for (let y = 1; y < WORLD_SIZE - 1; y++) {
    for (let x = 1; x < WORLD_SIZE - 1; x++) {
      const t = tiles[y][x]
      if (t.type !== 'rock' && t.type !== 'grass') continue
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]]
      const nearMountain = dirs.some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy
        return nx >= 0 && nx < WORLD_SIZE && ny >= 0 && ny < WORLD_SIZE
          && tiles[ny][nx].type === 'mountain'
      })
      if (nearMountain && rng() < 0.045) {
        t.type = 'cave'
        t.shelter = true   // caves provide natural shelter
        t.waterLevel = 15  // slight moisture
      }
    }
  }
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateWorld(seed: number): Tile[][] {
  const rng = createRng(seed)
  const elevSeed = Math.floor(rng() * 100000)
  const moistSeed = Math.floor(rng() * 100000)

  const tiles: Tile[][] = []
  const elevMap: number[][] = []

  for (let y = 0; y < WORLD_SIZE; y++) {
    tiles[y] = []
    elevMap[y] = []
    for (let x = 0; x < WORLD_SIZE; x++) {
      const nx = x / WORLD_SIZE
      const ny = y / WORLD_SIZE
      const elevation = fractalNoise(nx, ny, elevSeed, 3)
      const moisture = fractalNoise(nx + 100, ny + 100, moistSeed, 3)
      const biome = assignBiome(elevation, moisture)

      elevMap[y][x] = elevation

      let type: TileType = 'grass'
      if (biome === 'rocky' && elevation > 0.75) type = 'rock'
      else if (biome === 'wetland') type = 'mud'
      else if (biome === 'arid') type = 'barren'

      tiles[y].push({
        x, y,
        type,
        biome,
        elevation,
        foodAmount: 0,
        foodRegrowTimer: 0,
        waterLevel: biome === 'wetland' ? 60 : 0,
        shelter: false,
        treeAge: -1,
        claimedBy: null,
        deathSiteOf: null,
        deathSiteAge: 0,
        floodTimer: 0,
        burning: 0,
      })
    }
  }

  carveRiver(tiles, rng)
  scatterRocks(tiles, rng)
  raiseMountains(tiles, elevMap)
  carveCliffs(tiles, elevMap, rng)
  digCaves(tiles, rng)
  plantTrees(tiles, elevSeed, rng)
  scatterBushes(tiles, rng)
  scatterHealroot(tiles, rng)
  seedCenterResources(tiles, rng)

  return tiles
}

// ─── Season effects on tiles ─────────────────────────────────────────────────

export function applySeasonToTile(tile: Tile, season: Season): void {
  if (season === 'winter') {
    if (tile.type === 'food_patch') {
      tile.foodAmount = Math.max(0, tile.foodAmount - 0.5)
    }
  }
  if (season === 'spring') {
    if (tile.type === 'food_patch') {
      tile.foodAmount = Math.min(100, tile.foodAmount + 0.3)
    }
  }
}

// ─── Tile type index ─────────────────────────────────────────────────────────
// Pre-built map from tile type → coordinate list. Rebuilding costs O(WORLD_SIZE²)
// but replaces O((2×maxDist)²) scans in findNearestTileOfType with O(k) where
// k = number of tiles of that type; typically 5-200 vs up to 2,401 per call.

export type TileTypeIndex = Partial<Record<TileType, ReadonlyArray<readonly [number, number]>>>

export function buildTileIndex(tiles: Tile[][]): TileTypeIndex {
  const idx: Partial<Record<TileType, [number, number][]>> = {}
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const type = tiles[y][x].type
      ;(idx[type] ??= []).push([x, y] as [number, number])
    }
  }
  return idx as TileTypeIndex
}

export function findNearestInIndex(
  idx: TileTypeIndex,
  tiles: Tile[][],
  fromX: number,
  fromY: number,
  types: readonly TileType[],
  maxDist: number
): Tile | null {
  let best: Tile | null = null
  let bestDist = maxDist + 1
  for (let ti = 0; ti < types.length; ti++) {
    const coords = idx[types[ti]]
    if (!coords) continue
    for (let i = 0; i < coords.length; i++) {
      const [x, y] = coords[i]
      const dist = Math.abs(x - fromX) + Math.abs(y - fromY)
      if (dist < bestDist) { bestDist = dist; best = tiles[y][x] }
    }
  }
  return best
}

// ─── Tile utilities ───────────────────────────────────────────────────────────

export function getTile(tiles: Tile[][], x: number, y: number): Tile | null {
  if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) return null
  return tiles[y][x]
}

export function getAdjacentTiles(tiles: Tile[][], x: number, y: number): Tile[] {
  const result: Tile[] = []
  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]
  for (const [dx, dy] of dirs) {
    const t = getTile(tiles, x + dx, y + dy)
    if (t) result.push(t)
  }
  return result
}

export function findNearestTileOfType(
  tiles: Tile[][],
  fromX: number,
  fromY: number,
  types: TileType[],
  maxDist = 16
): Tile | null {
  let best: Tile | null = null
  let bestDist = Infinity

  const minY = Math.max(0, fromY - maxDist)
  const maxY = Math.min(WORLD_SIZE - 1, fromY + maxDist)
  const minX = Math.max(0, fromX - maxDist)
  const maxX = Math.min(WORLD_SIZE - 1, fromX + maxDist)

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!types.includes(tiles[y][x].type)) continue
      const dist = Math.abs(x - fromX) + Math.abs(y - fromY)
      if (dist < bestDist && dist <= maxDist) {
        bestDist = dist
        best = tiles[y][x]
      }
    }
  }
  return best
}

// Also finds a tile adjacent to a specific type (useful for drinking next to river)
export function findPassableTileAdjacentTo(
  tiles: Tile[][],
  fromX: number,
  fromY: number,
  targetType: TileType,
  maxDist = 24
): Tile | null {
  const target = findNearestTileOfType(tiles, fromX, fromY, [targetType], maxDist)
  if (!target) return null

  // Find a passable adjacent tile
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]]
  for (const [dx, dy] of dirs) {
    const nx = target.x + dx; const ny = target.y + dy
    if (nx < 0 || nx >= WORLD_SIZE || ny < 0 || ny >= WORLD_SIZE) continue
    const adj = tiles[ny][nx]
    if (isTilePassable(adj)) return adj
  }
  return null
}

export function isTilePassable(tile: Tile): boolean {
  return tile.type !== 'rock'
    && tile.type !== 'flooded'
    && tile.type !== 'mountain'
    && tile.type !== 'cliff'
}

export function worldSeedFromTimestamp(): number {
  return Math.floor(Date.now() / 1000) % 999999
}