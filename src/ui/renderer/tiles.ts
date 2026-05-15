import { Tile, TileType, Season, EnrichmentItem } from '@/types'
import {
  ISO_TILE_WIDTH, ISO_TILE_HEIGHT, CANVAS_PADDING_Y,
  DEATH_SITE_DECAY_DAYS, LIGHTNING_VISUAL_DURATION_MS,
  TREE_FOOD_MATURE_AGE, TREE_PEAK_AGE, TREE_DECAY_AGE,
} from '@/engine/constants'
import { lighten } from './utils'

// ─── Coordinate transforms ────────────────────────────────────────────────────

export function gridToIso(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (ISO_TILE_WIDTH / 2),
    y: (gridX + gridY) * (ISO_TILE_HEIGHT / 2),
  }
}

export function isoToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const x = (screenX / (ISO_TILE_WIDTH / 2) + screenY / (ISO_TILE_HEIGHT / 2)) / 2
  const y = (screenY / (ISO_TILE_HEIGHT / 2) - screenX / (ISO_TILE_WIDTH / 2)) / 2
  return { x: Math.round(x), y: Math.round(y) }
}

export function canvasOrigin(canvasWidth: number): { x: number; y: number } {
  return { x: canvasWidth / 2, y: CANVAS_PADDING_Y }
}

// ─── Canvas state reset ────────────────────────────────────────────────────────

export function resetCanvasState(ctx: CanvasRenderingContext2D): void {
  ctx.globalAlpha = 1.0
  ctx.globalCompositeOperation = 'source-over'
  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.setLineDash([])
  ctx.lineWidth = 1
  ctx.filter = 'none'
}

// ─── Tile palette ─────────────────────────────────────────────────────────────
// Top faces are the primary readable surface. Left/right faces form the depth
// skirt ; always darker than top to reinforce the isometric light direction.
// Colors are warm and saturated enough to be readable on a dark background.

const TILE_COLORS: Record<TileType, { top: string; left: string; right: string }> = {
  grass:      { top: '#3c7820', left: '#264e14', right: '#1c3a10' },
  tree:       { top: '#1e5222', left: '#143818', right: '#0d2812' },
  shelter:    { top: '#265c2c', left: '#1a3e1e', right: '#132e16' },
  river:      { top: '#1e4e74', left: '#103252', right: '#082238' },
  mud:        { top: '#3e2c16', left: '#2a1e0e', right: '#1e1408' },
  rock:       { top: '#4c4a62', left: '#363450', right: '#28263c' },
  food_patch: { top: '#3c2c0e', left: '#281e08', right: '#1c1406' },
  barren:     { top: '#3e3428', left: '#2c2418', right: '#201c12' },
  flooded:    { top: '#183c60', left: '#0e2842', right: '#08182e' },
  death_site: { top: '#4e1c24', left: '#36121a', right: '#280c12' },
  mountain:   { top: '#5e5c72', left: '#44425a', right: '#323046' },
  cave:       { top: '#201e2c', left: '#16141e', right: '#0e0c16' },
  cliff:      { top: '#524e68', left: '#3c3850', right: '#2c2a3e' },
  bush:       { top: '#1a4016', left: '#112a0e', right: '#0c1e0a' },
  healroot:   { top: '#2c3c1a', left: '#1e2c12', right: '#162008' },
}

// Biome tint ; painted over the top face only, giving each biome a chromatic
// identity that layers on top of tile type without overwriting it.
const BIOME_TOP_TINTS: Partial<Record<string, string>> = {
  temperate: 'rgba(80, 160, 40, 0.12)',
  lush:      'rgba(40, 200, 70, 0.17)',
  arid:      'rgba(220, 148, 40, 0.16)',
  wetland:   'rgba(28, 100, 140, 0.14)',
  rocky:     'rgba(110, 105, 130, 0.13)',
}

const SEASON_TINT: Record<Season, string> = {
  spring: 'rgba(128, 240, 160, 0.05)',
  summer: 'rgba(255, 192, 96, 0.06)',
  autumn: 'rgba(255, 120, 64, 0.08)',
  winter: 'rgba(128, 200, 255, 0.10)',
}

// ─── Draw tile ────────────────────────────────────────────────────────────────

export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  screenX: number,
  screenY: number,
  hovered: boolean,
  season: Season
): void {
  const w = ISO_TILE_WIDTH
  const h = ISO_TILE_HEIGHT
  const hw = w / 2
  const hh = h / 2
  // Elevation-proportional depth: higher tiles cast a taller 2.5D skirt.
  // Range: elev 0.0 → depth ~3px, elev 0.5 → ~5px, elev 0.9+ → ~7px.
  const elev = tile.elevation ?? 0.5
  const depth = Math.max(2, Math.ceil(ISO_TILE_HEIGHT * (0.20 + elev * 0.55)))

  const colors = TILE_COLORS[tile.type] ?? TILE_COLORS.grass

  // Top face
  ctx.beginPath()
  ctx.moveTo(screenX, screenY)
  ctx.lineTo(screenX + hw, screenY + hh)
  ctx.lineTo(screenX, screenY + h)
  ctx.lineTo(screenX - hw, screenY + hh)
  ctx.closePath()
  ctx.fillStyle = hovered ? lighten(colors.top, 38) : colors.top
  ctx.fill()

  // Left face
  ctx.beginPath()
  ctx.moveTo(screenX - hw, screenY + hh)
  ctx.lineTo(screenX, screenY + h)
  ctx.lineTo(screenX, screenY + h + depth)
  ctx.lineTo(screenX - hw, screenY + hh + depth)
  ctx.closePath()
  ctx.fillStyle = hovered ? lighten(colors.left, 22) : colors.left
  ctx.fill()

  // Right face
  ctx.beginPath()
  ctx.moveTo(screenX + hw, screenY + hh)
  ctx.lineTo(screenX, screenY + h)
  ctx.lineTo(screenX, screenY + h + depth)
  ctx.lineTo(screenX + hw, screenY + hh + depth)
  ctx.closePath()
  ctx.fillStyle = hovered ? lighten(colors.right, 22) : colors.right
  ctx.fill()

  if (hovered) {
    ctx.beginPath()
    ctx.moveTo(screenX, screenY)
    ctx.lineTo(screenX + hw, screenY + hh)
    ctx.lineTo(screenX, screenY + h)
    ctx.lineTo(screenX - hw, screenY + hh)
    ctx.closePath()
    ctx.strokeStyle = 'rgba(140, 240, 255, 0.55)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Season tint (top face only)
  ctx.beginPath()
  ctx.moveTo(screenX, screenY)
  ctx.lineTo(screenX + hw, screenY + hh)
  ctx.lineTo(screenX, screenY + h)
  ctx.lineTo(screenX - hw, screenY + hh)
  ctx.closePath()
  ctx.fillStyle = SEASON_TINT[season]
  ctx.fill()

  // Biome tint ; each biome gets a faint chromatic overlay for visual identity
  const biomeTint = BIOME_TOP_TINTS[tile.biome]
  if (biomeTint) {
    ctx.beginPath()
    ctx.moveTo(screenX, screenY)
    ctx.lineTo(screenX + hw, screenY + hh)
    ctx.lineTo(screenX, screenY + h)
    ctx.lineTo(screenX - hw, screenY + hh)
    ctx.closePath()
    ctx.fillStyle = biomeTint
    ctx.fill()
  }

  // Elevation brightening ; peaks catch more light from above
  if (elev > 0.44) {
    const elevAlpha = Math.min(0.28, (elev - 0.44) * 0.52)
    ctx.beginPath()
    ctx.moveTo(screenX, screenY)
    ctx.lineTo(screenX + hw, screenY + hh)
    ctx.lineTo(screenX, screenY + h)
    ctx.lineTo(screenX - hw, screenY + hh)
    ctx.closePath()
    ctx.fillStyle = `rgba(255, 248, 230, ${elevAlpha})`
    ctx.fill()
  }

  drawTileDecoration(ctx, tile, screenX, screenY, season)
}

// ─── Tile decorations ─────────────────────────────────────────────────────────

function drawTileDecoration(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  sx: number,
  sy: number,
  season: Season
): void {
  const cx = sx
  const cy = sy + ISO_TILE_HEIGHT / 2
  const s = ISO_TILE_HEIGHT / 18

  switch (tile.type) {
    case 'tree':
    case 'shelter': {
      const age    = tile.treeAge ?? 0
      const mature = age >= TREE_FOOD_MATURE_AGE || tile.shelter
      const withering = age >= TREE_PEAK_AGE && age < TREE_DECAY_AGE
      const decaying  = age >= TREE_DECAY_AGE

      // Sapling (age < 30): thin stick with tiny leaf buds, clearly pre-juvenile
      if (age < 30 && !tile.shelter) {
        ctx.fillStyle = '#5a4020'
        ctx.fillRect(cx - 0.8 * s, cy - 4 * s, 1.4 * s, 4 * s)
        const budColor = season === 'winter' ? '#2a3e30' : '#4a8830'
        const buds: [number, number][] = [[0, -4.5 * s], [-1.8 * s, -3 * s], [1.8 * s, -3.2 * s]]
        for (const [bx, by] of buds) {
          ctx.fillStyle = budColor
          ctx.beginPath()
          ctx.arc(cx + bx, cy + by, 1.2 * s, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }

      // Decayed trees render as a mossy stump, not a full tree
      if (decaying) {
        ctx.fillStyle = '#2a1a0a'
        ctx.fillRect(cx - 2 * s, cy - 4 * s, 4 * s, 6 * s)
        ctx.fillStyle = '#4a6040'
        ctx.beginPath()
        ctx.ellipse(cx, cy - 5 * s, 4.5 * s, 2.5 * s, 0, 0, Math.PI * 2)
        ctx.fill()
        // Moss highlight
        ctx.fillStyle = 'rgba(100,180,80,0.25)'
        ctx.beginPath()
        ctx.ellipse(cx - s, cy - 6 * s, 2 * s, s, 0, 0, Math.PI * 2)
        ctx.fill()
        break
      }

      // Wither phase ; sparse, yellowing canopy
      const witherFactor = withering
        ? Math.max(0.25, 1 - (age - TREE_PEAK_AGE) / (TREE_DECAY_AGE - TREE_PEAK_AGE))
        : 1.0

      const trunkH = mature ? 14 * s * witherFactor : 7 * s
      const canopyR = mature ? (8 * s * (0.5 + witherFactor * 0.5)) : 4.5 * s

      // Trunk
      ctx.fillStyle = withering ? '#4a3018' : '#3a2614'
      ctx.fillRect(cx - 1.5 * s, cy - trunkH + 5 * s, 3 * s, trunkH - 2 * s)

      if (mature) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
        ctx.beginPath()
        ctx.ellipse(cx, cy - trunkH + 4 * s + 2, canopyR + 2 * s, (canopyR + 2 * s) * 0.4, 0, 0, Math.PI * 2)
        ctx.fill()

        // Canopy backing ; shifts yellow-brown when withering
        const backingColor = withering
          ? `rgba(100,80,20,${0.7 * witherFactor})`
          : season === 'autumn' ? '#5a4818' : season === 'winter' ? '#22382a' : '#1e6a26'
        ctx.fillStyle = backingColor
        ctx.beginPath()
        ctx.ellipse(cx, cy - trunkH + 7 * s, canopyR + 2 * s, canopyR * 0.65, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Main canopy
      const treeColor = withering
        ? `rgba(${Math.round(120 + (1-witherFactor)*50)},${Math.round(80 - (1-witherFactor)*40)},10,0.9)`
        : season === 'winter' ? '#2a3e30'
        : season === 'autumn' ? '#8a4818'
        : mature ? '#2a8030' : '#356420'
      ctx.fillStyle = treeColor
      ctx.beginPath()
      ctx.arc(cx, cy - trunkH + 4 * s, canopyR, 0, Math.PI * 2)
      ctx.fill()

      // Canopy highlight
      ctx.fillStyle = withering
        ? `rgba(180,160,60,${0.12 * witherFactor})`
        : season === 'winter' ? 'rgba(180,220,255,0.12)' : 'rgba(180,255,200,0.14)'
      ctx.beginPath()
      ctx.arc(cx - s, cy - trunkH + 2 * s, canopyR * 0.48, 0, Math.PI * 2)
      ctx.fill()

      // Fruit ; only on healthy mature trees (not withering) in non-winter seasons
      const canShowFruit = mature && !withering && season !== 'winter'
      if (canShowFruit) {
        const appleOffsets: [number, number][] = [
          [-canopyR * 0.45, canopyR * 0.20],
          [ canopyR * 0.50, canopyR * 0.10],
          [ canopyR * 0.15, canopyR * 0.40],
          [-canopyR * 0.20, canopyR * 0.38],
        ]
        const appleColor     = season === 'autumn' ? '#cc4420' : '#cc2828'
        const appleHighlight = season === 'autumn' ? '#ff8040' : '#ff5050'
        const canopyTopY = cy - trunkH + 4 * s
        for (const [aox, aoy] of appleOffsets) {
          ctx.fillStyle = appleColor
          ctx.beginPath()
          ctx.arc(cx + aox, canopyTopY + aoy, 1.4 * s, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = appleHighlight
          ctx.beginPath()
          ctx.arc(cx + aox - 0.4 * s, canopyTopY + aoy - 0.4 * s, 0.5 * s, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#5a3a10'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(cx + aox, canopyTopY + aoy - 1.4 * s)
          ctx.lineTo(cx + aox, canopyTopY + aoy - 2.2 * s)
          ctx.stroke()
        }
      } else if (mature && (season === 'spring' || season === 'summer') && tile.shelter && !withering) {
        ctx.fillStyle = 'rgba(168, 255, 192, 0.65)'
        const fp: [number, number][] = [[-canopyR * 0.5, -canopyR * 0.3], [canopyR * 0.6, canopyR * 0.1]]
        for (const [dx, dy] of fp) {
          ctx.beginPath()
          ctx.arc(cx + dx, cy - trunkH + 4 * s + dy, 0.8 * s, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }

    case 'food_patch': {
      const fullness   = Math.max(0, Math.min(1, tile.foodAmount / 100))
      const snowDepth  = tile.snowDepth ?? 0
      // When snow covers fruit, fade it out proportionally
      const visibility = Math.max(0, 1 - snowDepth * 1.6)
      if (visibility <= 0.05) break  // completely buried ; don't render at all

      ctx.globalAlpha = visibility

      // Earthy ground for fallen fruit (darkens as fruit decays)
      const fruitAge   = tile.fruitAge ?? 0
      const decayTint  = Math.min(1, fruitAge / 300)
      const groundR    = Math.round(42  - decayTint * 16)
      const groundG    = Math.round(24  - decayTint * 10)
      const groundB    = Math.round(8)
      ctx.fillStyle    = `rgb(${groundR},${groundG},${groundB})`
      ctx.beginPath()
      ctx.ellipse(cx, cy + s, 7 * s, 3 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      // Fallen fruit dots — warm amber/gold tones that decay to brown;
      // generic rather than apple-specific (no stems, rounder, yellower)
      const freshness  = Math.max(0, 1 - decayTint)
      const fruitR     = Math.round(210 - decayTint * 70)
      const fruitG     = Math.round(130 - decayTint * 60)
      const fruitB     = Math.round(30  - decayTint * 20)
      const fruitColor = `rgb(${fruitR},${fruitG},${fruitB})`
      const hlR        = Math.round(255 - decayTint * 80)
      const hlG        = Math.round(200 - decayTint * 100)
      const hlB        = Math.round(80)
      const fruitHighlight = `rgb(${hlR},${hlG},${hlB})`

      const offsets: [number, number][] = [[-5*s, 0], [0, -2*s], [5*s, s], [-2*s, 3*s], [4*s, -1.5*s]]
      for (const [ox, oy] of offsets) {
        if (Math.abs(ox) + Math.abs(oy) < fullness * 12 * s + 3 * s) {
          ctx.fillStyle = fruitColor
          ctx.beginPath()
          ctx.arc(cx + ox, cy + oy, 2.0 * s, 0, Math.PI * 2)
          ctx.fill()
          if (freshness > 0.3) {
            ctx.fillStyle = fruitHighlight
            ctx.beginPath()
            ctx.arc(cx + ox - 0.45 * s, cy + oy - 0.45 * s, 0.65 * s, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      ctx.globalAlpha = 1.0
      break
    }

    case 'river': {
      const shimPhase = (Date.now() / 1100) % (Math.PI * 2)
      ctx.fillStyle = 'rgba(50, 160, 230, 0.32)'
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + ISO_TILE_WIDTH / 2, sy + ISO_TILE_HEIGHT / 2)
      ctx.lineTo(sx, sy + ISO_TILE_HEIGHT)
      ctx.lineTo(sx - ISO_TILE_WIDTH / 2, sy + ISO_TILE_HEIGHT / 2)
      ctx.closePath()
      ctx.fill()

      const shimmerAlpha = 0.30 + Math.sin(shimPhase) * 0.18
      ctx.fillStyle = `rgba(140, 230, 255, ${shimmerAlpha})`
      const shimPos: [number, number][] = [[-3*s, -s], [3*s, 2*s], [0, -2.5*s], [-1*s, 3.5*s]]
      for (const [ox, oy] of shimPos) {
        ctx.beginPath()
        ctx.ellipse(cx + ox, cy + oy, 3.5 * s, 1.2 * s, 0.4, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'flooded': {
      const ripPhase = (Date.now() / 1600) % (Math.PI * 2)
      ctx.fillStyle = 'rgba(30, 100, 180, 0.38)'
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + ISO_TILE_WIDTH / 2, sy + ISO_TILE_HEIGHT / 2)
      ctx.lineTo(sx, sy + ISO_TILE_HEIGHT)
      ctx.lineTo(sx - ISO_TILE_WIDTH / 2, sy + ISO_TILE_HEIGHT / 2)
      ctx.closePath()
      ctx.fill()
      for (let r = 0; r < 2; r++) {
        const rp = ((ripPhase + r * Math.PI) % (Math.PI * 2)) / (Math.PI * 2)
        const rAlpha = (1 - rp) * 0.22
        ctx.strokeStyle = `rgba(100, 200, 255, ${rAlpha})`
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.ellipse(cx, cy, (2 + rp * 6) * s, (0.8 + rp * 2.2) * s, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }

    case 'rock': {
      ctx.fillStyle = '#3a3850'
      ctx.beginPath()
      ctx.arc(cx, cy - 4 * s, 5.8 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#5a5878'
      ctx.beginPath()
      ctx.arc(cx - 1.5 * s, cy - 5.5 * s, 2.2 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#2a283c'
      ctx.beginPath()
      ctx.arc(cx + 4 * s, cy - 1 * s, 2.6 * s, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'mountain': {
      const elev = tile.elevation ?? 0.82
      const peakH = (10 + (elev - 0.78) * 40) * s
      const baseW = 7 * s

      ctx.fillStyle = '#262240'
      ctx.beginPath()
      ctx.moveTo(cx - baseW, cy + 2 * s)
      ctx.lineTo(cx, cy - peakH)
      ctx.lineTo(cx, cy + 2 * s)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#32304e'
      ctx.beginPath()
      ctx.moveTo(cx + baseW, cy + 2 * s)
      ctx.lineTo(cx, cy - peakH)
      ctx.lineTo(cx, cy + 2 * s)
      ctx.closePath()
      ctx.fill()

      const snowLine = peakH * 0.70
      ctx.fillStyle = '#c8c8e0'
      ctx.beginPath()
      ctx.moveTo(cx - baseW * 0.3, cy - snowLine)
      ctx.lineTo(cx, cy - peakH)
      ctx.lineTo(cx + baseW * 0.3, cy - snowLine)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
      ctx.beginPath()
      ctx.moveTo(cx - baseW * 0.12, cy - snowLine - 1)
      ctx.lineTo(cx, cy - peakH + 1)
      ctx.lineTo(cx + baseW * 0.1, cy - snowLine)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = 'rgba(180, 175, 210, 0.40)'
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(cx - baseW * 0.55, cy)
      ctx.lineTo(cx, cy - peakH * 0.82)
      ctx.lineTo(cx + baseW * 0.55, cy)
      ctx.stroke()
      break
    }

    case 'cave': {
      const glowPhase = (Date.now() / 2200) % (Math.PI * 2)
      const innerGlow = 0.28 + Math.sin(glowPhase) * 0.08

      // Stone collar: visible lighter ring marking the cave entrance clearly
      ctx.fillStyle = '#3e3860'
      ctx.beginPath()
      ctx.ellipse(cx, cy - 2 * s, 7.2 * s, 5.5 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      // Outer rocky rim
      ctx.fillStyle = '#22203a'
      ctx.beginPath()
      ctx.ellipse(cx, cy - 2 * s, 6 * s, 4.5 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      // Outer rim texture ; dashed ring
      ctx.strokeStyle = 'rgba(70, 65, 95, 0.40)'
      ctx.lineWidth = 0.5
      ctx.setLineDash([1.5, 2.5])
      ctx.beginPath()
      ctx.ellipse(cx, cy - 2 * s, 5.8 * s, 4.2 * s, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Inner void ; absolute darkness
      ctx.fillStyle = '#04030a'
      ctx.beginPath()
      ctx.ellipse(cx, cy - 1.5 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      // Depth rings ; concentric faint ellipses suggest interior depth
      for (let d = 1; d <= 2; d++) {
        const dr = 1 - d * 0.30
        ctx.strokeStyle = `rgba(50, 45, 80, ${0.18 + d * 0.05})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.ellipse(cx, cy - 1.5 * s, 4 * s * dr, 3 * s * dr, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Warm amber glow rising from the cave floor
      const gGrad = ctx.createRadialGradient(cx, cy - 0.5 * s, 0, cx, cy - 0.5 * s, 4 * s)
      gGrad.addColorStop(0, `rgba(255, 180, 60, ${innerGlow})`)
      gGrad.addColorStop(0.5, `rgba(200, 100, 20, ${innerGlow * 0.4})`)
      gGrad.addColorStop(1, 'rgba(100, 40, 0, 0)')
      ctx.fillStyle = gGrad
      ctx.beginPath()
      ctx.ellipse(cx, cy - 1.5 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      // Stalactites ; dark mineral formations hanging from the cave mouth top
      const voidTopY = (cy - 1.5 * s) - 3 * s
      const stalConfigs: [number, number][] = [
        [-1.8 * s, 2.4 * s],
        [-0.6 * s, 2.9 * s],
        [ 0.7 * s, 2.2 * s],
        [ 1.9 * s, 1.8 * s],
        [-1.1 * s, 1.5 * s],
      ]
      for (const [xOff, stalH] of stalConfigs) {
        const stx = cx + xOff
        const sty = voidTopY + 0.3 * s
        ctx.fillStyle = '#2c2a48'
        ctx.beginPath()
        ctx.moveTo(stx - 0.65 * s, sty)
        ctx.lineTo(stx + 0.65 * s, sty)
        ctx.lineTo(stx, sty + stalH)
        ctx.closePath()
        ctx.fill()
        // Moisture glint at stalactite tip
        ctx.fillStyle = `rgba(180, 160, 255, ${innerGlow * 0.75})`
        ctx.beginPath()
        ctx.arc(stx, sty + stalH - 0.1 * s, 0.20 * s, 0, Math.PI * 2)
        ctx.fill()
      }

      // Rim catchlight ; upper arc of void catches ambient surface light
      ctx.strokeStyle = 'rgba(100, 90, 145, 0.72)'
      ctx.lineWidth = 0.9
      ctx.beginPath()
      ctx.ellipse(cx, cy - 1.5 * s, 4 * s, 3 * s, 0, Math.PI, Math.PI * 2)
      ctx.stroke()
      break
    }

    case 'cliff': {
      const elev = tile.elevation ?? 0.65
      const dropH = (6 + (elev - 0.4) * 12) * s
      const w2 = 7 * s

      // Shadow face (right/east — away from isometric light source)
      ctx.fillStyle = '#181526'
      ctx.beginPath()
      ctx.moveTo(cx, cy + 1 * s)
      ctx.lineTo(cx + w2, cy + 1 * s)
      ctx.lineTo(cx + w2 * 0.6, cy - dropH)
      ctx.lineTo(cx, cy - dropH)
      ctx.closePath()
      ctx.fill()

      // Lit face (left/west — toward isometric light source)
      ctx.fillStyle = '#3a3658'
      ctx.beginPath()
      ctx.moveTo(cx - w2, cy + 1 * s)
      ctx.lineTo(cx, cy + 1 * s)
      ctx.lineTo(cx, cy - dropH)
      ctx.lineTo(cx - w2 * 0.6, cy - dropH)
      ctx.closePath()
      ctx.fill()

      // Bright top-ledge highlight (catches the most light)
      ctx.strokeStyle = 'rgba(160, 155, 210, 0.88)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(cx - w2 * 0.6, cy - dropH)
      ctx.lineTo(cx + w2 * 0.6, cy - dropH)
      ctx.stroke()

      // Base ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 2.5 * s, w2 * 0.7, 1.5 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      // Strata lines
      ctx.strokeStyle = 'rgba(90, 80, 130, 0.55)'
      ctx.lineWidth = 0.6
      for (let i = 1; i <= 3; i++) {
        const ly = cy - dropH * (i / 4)
        const lw = w2 * (0.5 + (4 - i) * 0.08)
        ctx.beginPath()
        ctx.moveTo(cx - lw, ly)
        ctx.lineTo(cx + lw, ly)
        ctx.stroke()
      }

      // Base edge line
      ctx.strokeStyle = 'rgba(140, 130, 170, 0.70)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(cx - w2, cy + 1 * s)
      ctx.lineTo(cx + w2, cy + 1 * s)
      ctx.stroke()
      break
    }

    case 'mud': {
      ctx.fillStyle = 'rgba(30, 65, 95, 0.32)'
      ctx.beginPath()
      ctx.ellipse(cx, cy, 8 * s, 3.5 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(120, 180, 220, 0.18)'
      ctx.beginPath()
      ctx.ellipse(cx + 2 * s, cy - 0.5 * s, 2.2 * s, 1 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'death_site': {
      const siteAge = tile.deathSiteAge ?? 0
      const freshness = Math.max(0, 1 - siteAge / DEATH_SITE_DECAY_DAYS)
      const alpha = 0.25 + freshness * 0.55

      ctx.strokeStyle = `rgba(255, 90, 110, ${alpha})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, 7 * s, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = `rgba(255, 120, 140, ${alpha * 0.85})`
      ctx.lineWidth = 0.9
      ctx.beginPath()
      ctx.moveTo(cx - 2 * s, cy)
      ctx.lineTo(cx + 2 * s, cy)
      ctx.moveTo(cx, cy - 2 * s)
      ctx.lineTo(cx, cy + 2 * s)
      ctx.stroke()
      break
    }

    case 'barren': {
      ctx.strokeStyle = 'rgba(130, 108, 75, 0.45)'
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(cx - 5 * s, cy - s)
      ctx.lineTo(cx - s, cy + s)
      ctx.lineTo(cx + 3 * s, cy + 2.5 * s)
      ctx.moveTo(cx + 4 * s, cy - 3 * s)
      ctx.lineTo(cx, cy + 3 * s)
      ctx.moveTo(cx - 2 * s, cy - 3.5 * s)
      ctx.lineTo(cx + 2 * s, cy - 0.5 * s)
      ctx.stroke()
      ctx.fillStyle = 'rgba(100, 85, 65, 0.30)'
      ctx.beginPath()
      ctx.arc(cx + 2 * s, cy - 2 * s, 0.9 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx - 3 * s, cy + 1.5 * s, 0.7 * s, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'bush': {
      // bs ensures foliage is visible at all zoom levels; at default zoom (s=0.5), bs=1.0
      const bs = Math.max(1.0, s * 2)
      const foodLevel = Math.max(0, Math.min(1, (tile.foodAmount ?? 0) / 35))
      // foodAmount proxies maturity: depleted/winter = sparse/juvenile, full = dense/mature
      const maturity = foodLevel
      const isWinter = season === 'winter'
      const isAutumn = season === 'autumn'

      // Ground shadow scales with current size
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 0.5 * bs, (3 + maturity * 3) * bs, (1.2 + maturity) * bs, 0, 0, Math.PI * 2)
      ctx.fill()

      if (isWinter) {
        if (maturity < 0.22) {
          // Juvenile winter: barely-visible 1-2 sticks
          ctx.strokeStyle = 'rgba(35, 45, 28, 0.45)'
          ctx.lineWidth = Math.max(0.4, bs * 0.35)
          ctx.beginPath()
          ctx.moveTo(cx, cy + 0.5 * bs)
          ctx.lineTo(cx, cy - 2 * bs)
          ctx.moveTo(cx - 1.5 * bs, cy + 0.3 * bs)
          ctx.lineTo(cx + 0.5 * bs, cy - 1.5 * bs)
          ctx.stroke()
        } else {
          // Mature winter skeleton: sparse crossing branches
          ctx.strokeStyle = 'rgba(45, 55, 38, 0.75)'
          ctx.lineWidth = Math.max(0.9, bs * 0.7)
          ctx.beginPath()
          ctx.moveTo(cx - 4 * bs, cy + 0.5 * bs)
          ctx.lineTo(cx + 0.5 * bs, cy - 3 * bs)
          ctx.moveTo(cx, cy + 0.5 * bs)
          ctx.lineTo(cx, cy - 3.5 * bs)
          ctx.moveTo(cx + 3.5 * bs, cy + 0.5 * bs)
          ctx.lineTo(cx - 2 * bs, cy - 3 * bs)
          ctx.stroke()
          ctx.strokeStyle = 'rgba(35, 45, 28, 0.55)'
          ctx.lineWidth = Math.max(0.5, bs * 0.4)
          ctx.beginPath()
          ctx.moveTo(cx + 0.5 * bs, cy - 3 * bs)
          ctx.lineTo(cx + 2.5 * bs, cy - 4.5 * bs)
          ctx.moveTo(cx + 0.5 * bs, cy - 3 * bs)
          ctx.lineTo(cx - 0.5 * bs, cy - 4.5 * bs)
          ctx.moveTo(cx, cy - 3.5 * bs)
          ctx.lineTo(cx + 2 * bs, cy - 5 * bs)
          ctx.stroke()
        }
      } else if (maturity < 0.22) {
        // Juvenile: thin stem + 2-3 tiny bud circles
        ctx.fillStyle = '#4a3818'
        ctx.fillRect(cx - 0.35 * bs, cy - 1.8 * bs, 0.7 * bs, 1.8 * bs)
        const budColor = isAutumn ? '#4a5020' : '#2e7018'
        const buds: [number, number][] = [[0, -2 * bs], [-1.3 * bs, -1.1 * bs], [1.2 * bs, -1.3 * bs]]
        for (const [bx, by] of buds) {
          ctx.fillStyle = budColor
          ctx.beginPath()
          ctx.arc(cx + bx, cy + by, 0.95 * bs, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (maturity < 0.60) {
        // Growing: 2-3 medium overlapping ellipses sized proportionally to maturity
        const g = 0.55 + maturity * 0.75
        const bushColor = isAutumn ? '#4a5020' : '#1e5a1a'
        ctx.fillStyle = bushColor
        ctx.beginPath()
        ctx.ellipse(cx, cy - 1.5 * bs * g, 3.5 * bs * g, 2.5 * bs * g, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = isAutumn ? '#333a12' : '#175212'
        ctx.beginPath()
        ctx.ellipse(cx + 1.8 * bs * g, cy - 0.8 * bs * g, 2.4 * bs * g, 1.8 * bs * g, 0.35, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(100, 190, 80, 0.10)'
        ctx.beginPath()
        ctx.ellipse(cx - 0.5 * bs, cy - 2.5 * bs * g, 1.5 * bs * g, bs * g, -0.3, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Mature: full dense design
        const bushColor = isAutumn ? '#4a5020' : '#1e5a1a'
        ctx.fillStyle = bushColor
        ctx.beginPath()
        ctx.ellipse(cx, cy - 2 * bs, 5 * bs, 3.5 * bs, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = isAutumn ? '#333a12' : '#175212'
        ctx.beginPath()
        ctx.ellipse(cx + 2.5 * bs, cy - 1 * bs, 3.5 * bs, 2.6 * bs, 0.35, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = isAutumn ? '#585e28' : '#226618'
        ctx.beginPath()
        ctx.ellipse(cx - 2.2 * bs, cy - 2.5 * bs, 2.4 * bs, 1.8 * bs, -0.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(100, 190, 80, 0.13)'
        ctx.beginPath()
        ctx.ellipse(cx - 1 * bs, cy - 3.5 * bs, 2.5 * bs, 1.5 * bs, -0.3, 0, Math.PI * 2)
        ctx.fill()
        if (!isAutumn && foodLevel > 0.2) {
          ctx.fillStyle = `rgba(200, 60, 80, ${0.28 * foodLevel})`
          ctx.beginPath()
          ctx.ellipse(cx + 0.5 * bs, cy - 1.8 * bs, 2 * bs * foodLevel, 1.4 * bs * foodLevel, 0.1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }

    case 'healroot': {
      // Distinct medicinal herb patch — teal-green with small star-shaped rosette fronds.
      // Potency (0-100) controls how lush the patch looks.
      const potency = Math.max(0, Math.min(1, (tile.healrootAmount ?? 0) / 100))
      if (potency < 0.05) break  // fully depleted; nothing to show

      const hs = Math.max(0.8, s * 1.6)

      // Soft ground glow — teal-tinted earth
      ctx.fillStyle = `rgba(20, 80, 70, ${0.30 * potency})`
      ctx.beginPath()
      ctx.ellipse(cx, cy + hs, 5.5 * hs, 2 * hs, 0, 0, Math.PI * 2)
      ctx.fill()

      // Draw 3-5 rosette fronds radiating from center
      const frondCount = Math.round(3 + potency * 2)
      const frondColor = season === 'winter'
        ? `rgba(40, 90, 80, ${0.6 * potency})`
        : `rgba(30, 160, 130, ${0.85 * potency})`
      const tipColor = season === 'winter'
        ? `rgba(60, 110, 95, ${0.5 * potency})`
        : `rgba(90, 220, 180, ${0.75 * potency})`

      const frondPositions: [number, number, number][] = [
        [0,        -3 * hs,  0.0],
        [-2.5*hs,  -1.5*hs, -0.6],
        [ 2.5*hs,  -1.5*hs,  0.6],
        [-1.5*hs,   1.5*hs, -0.3],
        [ 1.5*hs,   1.5*hs,  0.3],
      ]
      for (let i = 0; i < frondCount; i++) {
        const [fx, fy, tilt] = frondPositions[i]
        // Stem
        ctx.strokeStyle = frondColor
        ctx.lineWidth = Math.max(0.6, hs * 0.55)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + fx, cy + fy)
        ctx.stroke()
        // Leaf blade — small filled teardrop
        ctx.save()
        ctx.translate(cx + fx, cy + fy)
        ctx.rotate(tilt)
        ctx.fillStyle = frondColor
        ctx.beginPath()
        ctx.ellipse(0, 0, hs * 0.9, hs * 1.6, 0, 0, Math.PI * 2)
        ctx.fill()
        // Vein highlight
        ctx.strokeStyle = tipColor
        ctx.lineWidth = Math.max(0.4, hs * 0.35)
        ctx.beginPath()
        ctx.moveTo(0, hs * 1.4)
        ctx.lineTo(0, -hs * 1.4)
        ctx.stroke()
        ctx.restore()
      }

      // Tiny healing-glow dots when potency is high
      if (potency > 0.5 && season !== 'winter') {
        const glowAlpha = (potency - 0.5) * 0.9
        ctx.fillStyle = `rgba(120, 255, 200, ${glowAlpha})`
        const glowPos: [number,number][] = [[-2*hs,-2.5*hs],[2.5*hs,-1*hs],[-0.5*hs,1.5*hs]]
        for (const [gx, gy] of glowPos) {
          ctx.beginPath()
          ctx.arc(cx + gx, cy + gy, 0.55 * hs, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
  }

  // Fire overlay ; drawn over ANY burning tile
  if ((tile.burning ?? 0) > 0) {
    drawFireOverlay(ctx, tile, cx, cy, s)
  }

  // ── Snow depth overlay ────────────────────────────────────────────────────
  const snowDepth = tile.snowDepth ?? 0
  if (snowDepth > 0.05 && tile.type !== 'mountain' && tile.type !== 'cliff') {
    const snowAlpha = Math.min(0.80, snowDepth * 0.95)
    ctx.fillStyle = `rgba(220, 238, 255, ${snowAlpha})`
    ctx.beginPath()
    ctx.moveTo(sx,                         sy + ISO_TILE_HEIGHT * 0.12)
    ctx.lineTo(sx + ISO_TILE_WIDTH / 2,    sy + ISO_TILE_HEIGHT * 0.5)
    ctx.lineTo(sx,                         sy + ISO_TILE_HEIGHT * 0.88)
    ctx.lineTo(sx - ISO_TILE_WIDTH / 2,    sy + ISO_TILE_HEIGHT * 0.5)
    ctx.closePath()
    ctx.fill()
    // Surface highlight at high depths
    if (snowDepth > 0.55) {
      ctx.fillStyle = `rgba(255,255,255,${(snowDepth - 0.55) * 0.45})`
      ctx.beginPath()
      ctx.ellipse(sx, sy + ISO_TILE_HEIGHT * 0.38, ISO_TILE_WIDTH * 0.2, ISO_TILE_HEIGHT * 0.06, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ── Puddle / standing water overlay ───────────────────────────────────────
  const puddleLevel = tile.puddleLevel ?? 0
  if (puddleLevel > 0.08 && tile.type !== 'river') {
    const phase = (Date.now() / 1800) % (Math.PI * 2)
    const baseAlpha = Math.min(0.48, puddleLevel * 0.60)
    const shimAlpha = baseAlpha * (0.82 + Math.sin(phase) * 0.18)
    ctx.fillStyle = `rgba(70, 150, 220, ${shimAlpha})`
    ctx.beginPath()
    ctx.moveTo(sx,                       sy + ISO_TILE_HEIGHT * 0.30)
    ctx.lineTo(sx + ISO_TILE_WIDTH / 2,  sy + ISO_TILE_HEIGHT * 0.58)
    ctx.lineTo(sx,                       sy + ISO_TILE_HEIGHT * 0.85)
    ctx.lineTo(sx - ISO_TILE_WIDTH / 2,  sy + ISO_TILE_HEIGHT * 0.58)
    ctx.closePath()
    ctx.fill()
    // Reflection strip
    ctx.fillStyle = `rgba(180, 225, 255, ${shimAlpha * 0.45})`
    ctx.beginPath()
    ctx.ellipse(sx, sy + ISO_TILE_HEIGHT * 0.52,
      ISO_TILE_WIDTH * 0.20, ISO_TILE_HEIGHT * 0.07, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Lightning flash ; drawn last so bolt appears over everything
  if ((tile.lightningFlash ?? 0) > 0) {
    const flashAge = Date.now() - (tile.lightningFlash ?? 0)
    if (flashAge < LIGHTNING_VISUAL_DURATION_MS) {
      drawLightningEffect(ctx, cx, cy, flashAge, s)
    }
  }
}

// ─── Fire overlay ─────────────────────────────────────────────────────────────

function drawFireOverlay(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  cx: number,
  cy: number,
  s: number
): void {
  const now = Date.now()
  const flick = (now / 80) % (Math.PI * 2)
  const flick2 = (now / 55) % (Math.PI * 2)
  const intensity = Math.min(1, (tile.burning ?? 0) / 8)
  const flameH = (5 + Math.sin(flick) * 1.8) * s * (0.7 + intensity * 0.3)

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, flameH * 2.2)
  gradient.addColorStop(0, `rgba(255, 140, 30, ${0.45 + intensity * 0.2})`)
  gradient.addColorStop(0.5, 'rgba(255, 80, 10, 0.18)')
  gradient.addColorStop(1, 'rgba(200, 50, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(cx - flameH * 2.5, cy - flameH * 2.5, flameH * 5, flameH * 5)

  const tongues: [number, number, number][] = [
    [0, 1.0, 1.0],
    [-flameH * 0.35, 0.85, 0.88],
    [flameH * 0.30, 0.78, 0.92],
  ]
  for (const [ox, hScale, alphaBase] of tongues) {
    const fh = flameH * hScale
    ctx.fillStyle = `rgba(255, 180, 40, ${alphaBase * (0.62 + Math.sin(flick2 + ox) * 0.14)})`
    ctx.beginPath()
    ctx.moveTo(cx + ox, cy - fh)
    ctx.quadraticCurveTo(cx + ox + fh * 0.45, cy - fh * 0.25, cx + ox + fh * 0.22, cy + fh * 0.38)
    ctx.quadraticCurveTo(cx + ox, cy + fh * 0.12, cx + ox - fh * 0.22, cy + fh * 0.38)
    ctx.quadraticCurveTo(cx + ox - fh * 0.45, cy - fh * 0.25, cx + ox, cy - fh)
    ctx.closePath()
    ctx.fill()
  }

  ctx.fillStyle = `rgba(255, 248, 200, ${0.80 + Math.sin(flick * 2.1) * 0.12})`
  ctx.beginPath()
  ctx.moveTo(cx, cy - flameH * 0.65)
  ctx.quadraticCurveTo(cx + flameH * 0.18, cy - flameH * 0.08, cx, cy + flameH * 0.18)
  ctx.quadraticCurveTo(cx - flameH * 0.18, cy - flameH * 0.08, cx, cy - flameH * 0.65)
  ctx.closePath()
  ctx.fill()

  for (let i = 0; i < 5; i++) {
    const cycle = ((now / 280 + i * 0.62) % 1.0)
    const ex = cx + Math.sin(now / 450 + i * 2.2) * flameH * 0.55
    const ey = cy - flameH * (0.7 + cycle * 1.8)
    const eAlpha = (1 - cycle) * 0.85
    const er = Math.max(0.4, (0.5 + (1 - cycle) * 0.9) * s)
    ctx.fillStyle = `rgba(255, ${Math.floor(80 + cycle * 80)}, 20, ${eAlpha})`
    ctx.beginPath()
    ctx.arc(ex, ey, er, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 3; i++) {
    const cycle = ((now / 600 + i * 0.4) % 1.0)
    const smokeX = cx + Math.sin(now / 800 + i * 1.9) * flameH * 0.6
    const smokeY = cy - flameH * (1.3 + cycle * 2.0)
    const smokeAlpha = (1 - cycle) * 0.18
    const smokeR = (1.2 + cycle * 2.5) * s
    ctx.fillStyle = `rgba(40, 30, 20, ${smokeAlpha})`
    ctx.beginPath()
    ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ─── Lightning bolt effect ─────────────────────────────────────────────────────

function drawLightningEffect(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  age: number,
  s: number
): void {
  const progress = age / LIGHTNING_VISUAL_DURATION_MS
  const alpha = Math.max(0, 1 - progress * progress)

  ctx.save()

  const flashR = (12 + (1 - progress) * 18) * s
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR)
  flashGrad.addColorStop(0, `rgba(200, 240, 255, ${alpha * 0.75})`)
  flashGrad.addColorStop(0.4, `rgba(120, 200, 255, ${alpha * 0.35})`)
  flashGrad.addColorStop(1, 'rgba(60, 120, 255, 0)')
  ctx.fillStyle = flashGrad
  ctx.fillRect(cx - flashR, cy - flashR, flashR * 2, flashR * 2)

  if (progress < 0.55) {
    const boltAlpha = (1 - progress / 0.55)
    const boltTopY = cy - 52 * s

    const segs = 7
    const pts: { x: number; y: number }[] = [{ x: cx, y: boltTopY }]
    for (let i = 1; i < segs; i++) {
      const t = i / segs
      const jitter = Math.sin(i * 4.71 + progress * 8) * 5 * s * (1 - progress)
      pts.push({ x: cx + jitter, y: boltTopY + (cy - boltTopY) * t })
    }
    pts.push({ x: cx, y: cy })

    ctx.strokeStyle = `rgba(160, 220, 255, ${boltAlpha * 0.45})`
    ctx.lineWidth = 3.5 * s
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()

    ctx.strokeStyle = `rgba(200, 240, 255, ${boltAlpha * 0.70})`
    ctx.lineWidth = 1.8 * s
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()

    ctx.strokeStyle = `rgba(255, 255, 255, ${boltAlpha * 0.95})`
    ctx.lineWidth = 0.7 * s
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()

    for (const forkPt of [pts[2], pts[4]]) {
      ctx.strokeStyle = `rgba(220, 240, 255, ${boltAlpha * 0.4})`
      ctx.lineWidth = 0.6 * s
      ctx.beginPath()
      ctx.moveTo(forkPt.x, forkPt.y)
      ctx.lineTo(forkPt.x + 4 * s, forkPt.y + 5 * s)
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ─── Enrichment item rendering ────────────────────────────────────────────────

export function drawEnrichmentItem(
  ctx: CanvasRenderingContext2D,
  item: EnrichmentItem,
  screenX: number,
  screenY: number
): void {
  const s = ISO_TILE_HEIGHT / 18
  const cx = screenX
  const cy = screenY + ISO_TILE_HEIGHT * 0.5
  const now = Date.now()
  const inUse = !!item.usedBy
  const maxUses = item.maxUses ?? 40
  const durabilityAlpha = Math.max(0.35, (item.usesRemaining ?? maxUses) / maxUses)

  ctx.save()
  ctx.globalAlpha = durabilityAlpha

  switch (item.type) {
    case 'resting_spot': {
      // Soft oval nest ; slow breathing pulse
      const pulse = 1 + Math.sin(now / 1800) * 0.06
      ctx.fillStyle = '#5a3e20'
      ctx.beginPath()
      ctx.ellipse(cx, cy + s, 6.5 * s * pulse, 3 * s * pulse, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#7a5230'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 0.5 * s, 4.5 * s * pulse, 2 * s * pulse, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#9a6840'
      ctx.beginPath()
      ctx.ellipse(cx, cy, 2.5 * s * pulse, 1.1 * s * pulse, 0, 0, Math.PI * 2)
      ctx.fill()
      if (inUse) {
        ctx.fillStyle = `rgba(255, 220, 140, ${0.14 + Math.sin(now / 900) * 0.08})`
        ctx.beginPath()
        ctx.ellipse(cx, cy, 3 * s, 1.3 * s, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'scratching_post': {
      // Vertical post with scratch marks; wobbles when in use
      const wobble = inUse ? Math.sin(now / 120) * 0.08 : 0
      ctx.save()
      ctx.translate(cx, cy + 2 * s)
      ctx.rotate(wobble)
      ctx.fillStyle = '#5a4020'
      ctx.beginPath()
      ctx.ellipse(0, 0, 4 * s, 1.5 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      const postH = 8 * s
      ctx.fillStyle = '#7a5a30'
      ctx.fillRect(-1.2 * s, -postH, 2.4 * s, postH)
      ctx.strokeStyle = '#3a2810'
      ctx.lineWidth = 0.6
      for (let i = 1; i <= 4; i++) {
        const markY = -postH * (i / 5.5)
        ctx.beginPath()
        ctx.moveTo(-1.2 * s, markY)
        ctx.lineTo(1.2 * s, markY)
        ctx.stroke()
      }
      ctx.fillStyle = '#9a7040'
      ctx.beginPath()
      ctx.ellipse(0, -postH, 1.4 * s, 0.7 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      break
    }

    case 'burrow': {
      // Dark pit with soil mound and dig particles when active
      ctx.fillStyle = '#3a2a14'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 0.5 * s, 6.5 * s, 2.8 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#100a04'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 0.5 * s, 4.0 * s, 1.8 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      if (inUse) {
        for (let p = 0; p < 4; p++) {
          const pcycle = ((now / 400 + p * 0.25) % 1.0)
          const px = cx + Math.cos(now / 300 + p * 1.57) * 5 * s * pcycle
          const py = cy - pcycle * 5 * s
          ctx.fillStyle = `rgba(120, 85, 45, ${(1 - pcycle) * 0.7})`
          ctx.beginPath()
          ctx.arc(px, py, (0.4 + (1 - pcycle) * 0.5) * s, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.strokeStyle = 'rgba(80, 60, 30, 0.55)'
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.ellipse(cx, cy + 0.5 * s, 4.0 * s, 1.8 * s, 0, Math.PI, Math.PI * 2)
      ctx.stroke()
      break
    }

    case 'warm_stone': {
      // Rounded boulder with animated heat shimmer rings
      ctx.fillStyle = '#5a4820'
      ctx.beginPath()
      ctx.ellipse(cx, cy + s, 5.5 * s, 3.5 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#7a6030'
      ctx.beginPath()
      ctx.ellipse(cx - 0.3 * s, cy - 0.5 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(200, 170, 80, 0.25)'
      ctx.beginPath()
      ctx.ellipse(cx - s, cy - 1.5 * s, 1.5 * s, 0.8 * s, -0.4, 0, Math.PI * 2)
      ctx.fill()
      for (let r = 0; r < 3; r++) {
        const rcycle = ((now / 1200 + r * 0.33) % 1.0)
        const rAlpha = (1 - rcycle) * (0.22 + (inUse ? 0.15 : 0))
        ctx.strokeStyle = `rgba(255, 180, 60, ${rAlpha})`
        ctx.lineWidth = 0.7
        ctx.beginPath()
        ctx.ellipse(cx, cy, 5.5 * s * (0.5 + rcycle), 3.5 * s * (0.3 + rcycle * 0.4), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }

    case 'mud_pool': {
      // Oval clay depression with animated mud ripples
      ctx.fillStyle = '#2a1e10'
      ctx.beginPath()
      ctx.ellipse(cx, cy + s, 6 * s, 2.8 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3a2a16'
      ctx.beginPath()
      ctx.ellipse(cx, cy + s, 5 * s, 2.2 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      // Muddy sheen
      ctx.fillStyle = 'rgba(80, 60, 30, 0.30)'
      ctx.beginPath()
      ctx.ellipse(cx - s, cy + 0.5 * s, 2 * s, 0.8 * s, -0.2, 0, Math.PI * 2)
      ctx.fill()
      const ripPhase = (now / 1200) % (Math.PI * 2)
      for (let r = 0; r < 2; r++) {
        const rAlpha = 0.12 + Math.sin(ripPhase + r * Math.PI) * 0.06
        ctx.strokeStyle = `rgba(120, 90, 50, ${rAlpha})`
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.ellipse(cx + (r - 0.5) * s, cy + s, 2.2 * s, 0.9 * s, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(60, 45, 22, 0.50)'
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.ellipse(cx, cy + s, 6 * s, 2.8 * s, 0, Math.PI, Math.PI * 2)
      ctx.stroke()
      break
    }

    case 'worn_path': {
      // Circular worn-earth trail; a small scuff mark rotates when in use
      const trackR = 5 * s
      const dustPhase = (now / (inUse ? 600 : 3000)) % (Math.PI * 2)
      // Packed earth base
      ctx.fillStyle = '#2e2010'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 0.5 * s, trackR + s, (trackR + s) * 0.45, 0, 0, Math.PI * 2)
      ctx.fill()
      // Track groove
      ctx.strokeStyle = '#1e1408'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.ellipse(cx, cy + 0.5 * s, trackR, trackR * 0.42, 0, 0, Math.PI * 2)
      ctx.stroke()
      // Dust puff when in use
      if (inUse) {
        const dustX = cx + Math.cos(dustPhase) * trackR
        const dustY = cy + 0.5 * s + Math.sin(dustPhase) * trackR * 0.42
        ctx.fillStyle = `rgba(160, 120, 60, ${0.20 + Math.sin(now / 80) * 0.10})`
        ctx.beginPath()
        ctx.ellipse(dustX, dustY, 1.8 * s, 1 * s, dustPhase, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'play_stones': {
      // Cluster of smooth rounded pebbles; scatter bounces when in use
      const baseY = cy + 0.5 * s
      const stones: [number, number, number, string][] = [
        [-2 * s, -s,      2.2 * s, '#5a5272'],
        [ s,     -1.5 * s, 1.8 * s, '#4a4060'],
        [ 2.5 * s, 0.5 * s, 1.5 * s, '#625870'],
        [-3 * s,  0.5 * s, 1.2 * s, '#383050'],
        [-0.5 * s, s,      1.4 * s, '#524868'],
      ]
      for (const [ox, oy, r, col] of stones) {
        const bounce = inUse ? Math.sin(now / 200 + ox) * 1.5 * s : 0
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.ellipse(cx + ox, baseY + oy + bounce, r, r * 0.75, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(200, 180, 255, 0.18)'
        ctx.beginPath()
        ctx.ellipse(cx + ox - r * 0.25, baseY + oy + bounce - r * 0.3, r * 0.4, r * 0.3, -0.5, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'springy_moss': {
      // Rounded sphagnum pad; compresses when in use, releases with visible spring
      const compressed = inUse ? Math.max(0.65, 1 - Math.abs(Math.sin(now / 160)) * 0.35) : 1.0
      const mossH = 3.5 * s * compressed
      const mossW = 6 * s / compressed
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.20)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 0.8 * s, mossW * 0.85, 1.2 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      // Main moss body
      ctx.fillStyle = '#1a4010'
      ctx.beginPath()
      ctx.ellipse(cx, cy - mossH * 0.5 + 0.5 * s, mossW * 0.5, mossH * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#246018'
      ctx.beginPath()
      ctx.ellipse(cx, cy - mossH * 0.35 + 0.5 * s, mossW * 0.45, mossH * 0.45, 0, 0, Math.PI * 2)
      ctx.fill()
      // Highlight ; captures the sponginess of sphagnum
      ctx.fillStyle = 'rgba(80, 180, 60, 0.14)'
      ctx.beginPath()
      ctx.ellipse(cx - mossW * 0.12, cy - mossH * 0.55 + 0.5 * s, mossW * 0.26, mossH * 0.22, 0, 0, Math.PI * 2)
      ctx.fill()
      // Textured surface dots
      ctx.fillStyle = '#1e5016'
      for (let d = 0; d < 6; d++) {
        const ang = (d / 6) * Math.PI * 2
        const dr = mossW * 0.22
        ctx.beginPath()
        ctx.arc(cx + Math.cos(ang) * dr, cy + Math.sin(ang) * mossH * 0.28 - mossH * 0.4 + 0.5 * s, 0.6 * s, 0, Math.PI * 2)
        ctx.fill()
      }
      if (inUse && compressed < 0.85) {
        ctx.strokeStyle = `rgba(100, 220, 80, ${(1 - compressed) * 0.55})`
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.ellipse(cx, cy - mossH * 0.35 + 0.5 * s, mossW * 0.55, mossH * 0.55, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }
  }

  // Shared: pulsing shimmer ring when actively in use
  if (inUse) {
    const shimR = 7 * s + Math.sin(now / 150) * s
    ctx.globalAlpha = 0.20 * durabilityAlpha
    ctx.strokeStyle = '#c8b870'
    ctx.lineWidth = 0.6
    ctx.setLineDash([1.5, 2])
    ctx.beginPath()
    ctx.arc(cx, cy, shimR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.restore()
}