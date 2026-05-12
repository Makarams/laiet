import { Tile, TileType, Season, EnrichmentItem } from '@/types'
import {
  ISO_TILE_WIDTH, ISO_TILE_HEIGHT, CANVAS_PADDING_Y,
  DEATH_SITE_DECAY_DAYS, LIGHTNING_VISUAL_DURATION_MS,
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

// ─── Tile palette — Bioluminescent Specimen Cabinet ───────────────────────────

const TILE_COLORS: Record<TileType, { top: string; left: string; right: string }> = {
  grass:      { top: '#16321e', left: '#0e2214', right: '#0a1a10' },
  tree:       { top: '#103018', left: '#0a2010', right: '#08180c' },
  shelter:    { top: '#1c4028', left: '#143018', right: '#0e2412' },
  river:      { top: '#0a2848', left: '#061a32', right: '#041024' },
  mud:        { top: '#241a14', left: '#1a130e', right: '#140e0a' },
  rock:       { top: '#2e2c40', left: '#22202e', right: '#181624' },
  food_patch: { top: '#284018', left: '#1c2e10', right: '#142208' },
  barren:     { top: '#1c1820', left: '#141018', right: '#0e0a12' },
  flooded:    { top: '#0a2244', left: '#061830', right: '#040f22' },
  death_site: { top: '#2c0e1a', left: '#1e0810', right: '#16060a' },
  mountain:   { top: '#363450', left: '#262240', right: '#1a1830' },
  cave:       { top: '#100e1c', left: '#0a0812', right: '#07060e' },
  cliff:      { top: '#282438', left: '#1c1a2a', right: '#14121e' },
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
  const depth = Math.max(3, Math.ceil(ISO_TILE_HEIGHT * 0.45))

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
      const mature = tile.treeAge >= 300 || tile.shelter
      const trunkH = mature ? 14 * s : 7 * s
      const canopyR = mature ? 8 * s : 4.5 * s

      ctx.fillStyle = '#3a2614'
      ctx.fillRect(cx - 1.5 * s, cy - trunkH + 5 * s, 3 * s, trunkH - 2 * s)

      if (mature) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
        ctx.beginPath()
        ctx.ellipse(cx, cy - trunkH + 4 * s + 2, canopyR + 2 * s, (canopyR + 2 * s) * 0.4, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = season === 'autumn' ? '#5a4818' : season === 'winter' ? '#22382a' : '#1e6a26'
        ctx.beginPath()
        ctx.ellipse(cx, cy - trunkH + 7 * s, canopyR + 2 * s, canopyR * 0.65, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      const treeColor = season === 'winter' ? '#2a3e30'
        : season === 'autumn' ? '#8a4818'
        : mature ? '#2a8030' : '#356420'
      ctx.fillStyle = treeColor
      ctx.beginPath()
      ctx.arc(cx, cy - trunkH + 4 * s, canopyR, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = season === 'winter'
        ? 'rgba(180, 220, 255, 0.12)'
        : 'rgba(180, 255, 200, 0.14)'
      ctx.beginPath()
      ctx.arc(cx - s, cy - trunkH + 2 * s, canopyR * 0.48, 0, Math.PI * 2)
      ctx.fill()

      // Fruit/apple drops — visible on mature trees in spring/summer/autumn
      // These are the primary food source; creatures seek food_patches nearby.
      if (mature && season !== 'winter') {
        const appleOffsets: [number, number][] = [
          [-canopyR * 0.45, canopyR * 0.20],
          [ canopyR * 0.50, canopyR * 0.10],
          [ canopyR * 0.15, canopyR * 0.40],
          [-canopyR * 0.20, canopyR * 0.38],
        ]
        const appleColor = season === 'autumn' ? '#cc4420' : '#cc2828'
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
          // Tiny stem
          ctx.strokeStyle = '#5a3a10'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(cx + aox, canopyTopY + aoy - 1.4 * s)
          ctx.lineTo(cx + aox, canopyTopY + aoy - 2.2 * s)
          ctx.stroke()
        }
      } else if (mature && (season === 'spring' || season === 'summer') && tile.shelter) {
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
      const fullness = Math.max(0, Math.min(1, tile.foodAmount / 100))
      ctx.fillStyle = fullness > 0.5 ? '#305210' : '#22380a'
      ctx.beginPath()
      ctx.ellipse(cx, cy + s, 7 * s, 3 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      const berryColor = fullness > 0.65 ? '#88f038'
        : fullness > 0.35 ? '#a8c040'
        : '#807040'
      const offsets: [number, number][] = [[-5*s, 0], [0, -2*s], [5*s, s], [-2*s, 3*s], [4*s, -1.5*s]]
      for (const [ox, oy] of offsets) {
        if (Math.abs(ox) + Math.abs(oy) < fullness * 12 * s + 3 * s) {
          ctx.fillStyle = berryColor
          ctx.beginPath()
          ctx.arc(cx + ox, cy + oy, 2.2 * s, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
          ctx.beginPath()
          ctx.arc(cx + ox - 0.5 * s, cy + oy - 0.5 * s, 0.7 * s, 0, Math.PI * 2)
          ctx.fill()
        }
      }
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

      ctx.fillStyle = '#2a2840'
      ctx.beginPath()
      ctx.ellipse(cx, cy - 2 * s, 5.5 * s, 4 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#06040c'
      ctx.beginPath()
      ctx.ellipse(cx, cy - 1.5 * s, 3.5 * s, 2.8 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      const gGrad = ctx.createRadialGradient(cx, cy - 1 * s, 0, cx, cy - 1 * s, 3.2 * s)
      gGrad.addColorStop(0, `rgba(255, 180, 60, ${innerGlow})`)
      gGrad.addColorStop(0.6, `rgba(200, 100, 20, ${innerGlow * 0.4})`)
      gGrad.addColorStop(1, 'rgba(100, 40, 0, 0)')
      ctx.fillStyle = gGrad
      ctx.beginPath()
      ctx.ellipse(cx, cy - 1.5 * s, 3.5 * s, 2.8 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(80, 76, 110, 0.65)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.ellipse(cx, cy - 1.5 * s, 3.5 * s, 2.8 * s, 0, Math.PI, Math.PI * 2)
      ctx.stroke()
      break
    }

    case 'cliff': {
      const elev = tile.elevation ?? 0.65
      const dropH = (6 + (elev - 0.4) * 12) * s
      const w2 = 7 * s

      ctx.fillStyle = '#181526'
      ctx.beginPath()
      ctx.moveTo(cx - w2, cy + 1 * s)
      ctx.lineTo(cx + w2, cy + 1 * s)
      ctx.lineTo(cx + w2 * 0.6, cy - dropH)
      ctx.lineTo(cx - w2 * 0.6, cy - dropH)
      ctx.closePath()
      ctx.fill()

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
  }

  // Fire overlay — drawn over ANY burning tile
  if ((tile.burning ?? 0) > 0) {
    drawFireOverlay(ctx, tile, cx, cy, s)
  }

  // Lightning flash — drawn last so bolt appears over everything
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
// Five condensed categories — each visually distinct.

const ENRICHMENT_COLORS: Record<string, string> = {
  rest_nest:       '#8a7050',  // warm amber — rest and recovery
  shelter_den:     '#4a3870',  // deep violet — shelter and safety
  play_toy:        '#d05858',  // vibrant coral — play and social
  energy_cache:    '#4a9858',  // leaf green — energy regulation
  terrain_feature: '#5888b8',  // sky blue — environmental observation
}

const ENRICHMENT_GLYPHS: Record<string, string> = {
  rest_nest:       '≈',   // wavy rest symbol
  shelter_den:     '◡',   // cupped shelter
  play_toy:        '●',   // round toy
  energy_cache:    '◈',   // geometric resource store
  terrain_feature: '△',   // elevation / perch
}

export function drawEnrichmentItem(
  ctx: CanvasRenderingContext2D,
  item: EnrichmentItem,
  screenX: number,
  screenY: number
): void {
  const s = ISO_TILE_HEIGHT / 18
  const cx = screenX
  const cy = screenY + ISO_TILE_HEIGHT * 0.5
  const color = ENRICHMENT_COLORS[item.type] ?? '#8888b8'
  const pulse = item.usedBy ? 0.55 + Math.sin(Date.now() / 200) * 0.45 : 1.0

  // Durability fade — as uses run out, item becomes more transparent
  const maxUses = item.maxUses ?? 40
  const durabilityAlpha = Math.max(0.35, (item.usesRemaining ?? maxUses) / maxUses)

  ctx.save()
  ctx.globalAlpha = 0.85 * durabilityAlpha

  // Base platform
  ctx.fillStyle = color + '55'
  ctx.strokeStyle = color
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.ellipse(cx, cy + 2 * s, 5 * s, 2 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Glyph label
  ctx.globalAlpha = pulse * 0.90 * durabilityAlpha
  ctx.font = `bold ${Math.round(7 * s)}px monospace`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowBlur = 4
  ctx.shadowColor = color
  ctx.fillText(ENRICHMENT_GLYPHS[item.type] ?? '?', cx, cy - 1 * s)
  ctx.shadowBlur = 0

  // "In use" shimmer ring — pulses when actively used
  if (item.usedBy) {
    const shimR = 6 * s + Math.sin(Date.now() / 150) * 1.2 * s
    ctx.globalAlpha = 0.35 * durabilityAlpha
    ctx.strokeStyle = color
    ctx.lineWidth = 0.7
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.arc(cx, cy, shimR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.restore()
}
