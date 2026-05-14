import { useEffect, useRef, useCallback, useState } from 'react'
import styled from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import {
  drawTile, drawCreature, drawAtmosphere, drawScanlines, drawVignette,
  gridToIso, canvasOrigin, isoToGrid, resetCanvasState, drawEnrichmentItem,
} from '@/ui/renderer'
import { WORLD_SIZE, ISO_TILE_HEIGHT } from '@/engine/constants'
import type { GameState, Season, EnrichmentType } from '@/types'

const TICK_MS = 1000

const ZOOM_MIN  = 0.08
const ZOOM_MAX  = 5.0
const ZOOM_INIT = 2.8   // Start zoomed in on creatures for better performance; reduces tile rendering

const CanvasWrapper = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  background: #141414;
  border: 2px solid #2a2a2a;
  border-radius: 6px;
  overflow: hidden;
  cursor: crosshair;
  user-select: none;

  canvas { display: block; }
`

const Corner = styled.div<{ pos: string }>`
  position: absolute;
  ${p => p.pos.includes('top')    ? 'top: 8px;'    : ''}
  ${p => p.pos.includes('bottom') ? 'bottom: 8px;' : ''}
  ${p => p.pos.includes('left')   ? 'left: 10px;'  : ''}
  ${p => p.pos.includes('right')  ? 'right: 10px;' : ''}
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #444444;
  pointer-events: none;
  z-index: 3;
  user-select: none;
`

// CRTOverlay removed ; Field Guide design uses clean isometric rendering
const CRTOverlay = styled.div`display: none;`

const ToolHint = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #888888;
  background: rgba(20, 20, 20, 0.82);
  padding: 5px 14px;
  border-radius: 4px;
  border: 1px solid #2a2a2a;
  pointer-events: none;
  z-index: 3;
  white-space: nowrap;
`

const CameraReadout = styled.div`
  position: absolute;
  top: 8px;
  right: 10px;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #444444;
  pointer-events: none;
  z-index: 3;
  text-align: right;
  line-height: 1.5;
`

const CameraHelp = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #3a3a3a;
  line-height: 1.9;
  text-align: right;
  pointer-events: none;
  user-select: none;
`

type Tool = 'select' | 'food' | 'tree' | 'river' | 'thunder' | 'fire' | 'enrich'

interface GameCanvasProps {
  activeTool: Tool
  selectedEnrichment?: EnrichmentType
}

interface Camera {
  zoom: number
  panX: number
  panY: number
  rot: number   // 0..3 = 0°, 90°, 180°, 270°
}

// ─── Grid rotation helpers (float-safe) ───────────────────────────────────────
function rotateGrid(x: number, y: number, rot: number, n: number): { x: number; y: number } {
  const last = n - 1
  switch (((rot % 4) + 4) % 4) {
    case 1: return { x: last - y, y: x }
    case 2: return { x: last - x, y: last - y }
    case 3: return { x: y,        y: last - x }
    default: return { x, y }
  }
}
function unrotateGrid(x: number, y: number, rot: number, n: number) {
  return rotateGrid(x, y, (4 - (((rot % 4) + 4) % 4)) % 4, n)
}

// Convert screen-local coords (within canvas) to pre-camera untransformed coords
function screenToCanvas(lx: number, ly: number, cam: Camera, cw: number, ch: number) {
  const ux = (lx - cw / 2 - cam.panX) / cam.zoom + cw / 2
  const uy = (ly - ch / 2 - cam.panY) / cam.zoom + ch / 2
  return { x: ux, y: uy }
}

function makeInitialCamera(_cw: number, ch: number): Camera {
  const padY = 55
  const worldCenterY = padY + (WORLD_SIZE / 2) * ISO_TILE_HEIGHT
  const panY = (ch / 2) - ch / 2 - (worldCenterY - ch / 2) * ZOOM_INIT
  return { zoom: ZOOM_INIT, panX: 0, panY, rot: 0 }
}

function zoomAt(cam: Camera, lx: number, ly: number, newZoomRaw: number, cw: number, ch: number) {
  const oldZoom = cam.zoom
  const newZoom = clamp(newZoomRaw, ZOOM_MIN, ZOOM_MAX)
  if (newZoom === oldZoom) return
  cam.panX = lx - cw / 2 - (lx - cw / 2 - cam.panX) * (newZoom / oldZoom)
  cam.panY = ly - ch / 2 - (ly - ch / 2 - cam.panY) * (newZoom / oldZoom)
  cam.zoom = newZoom
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v))
}

const SEASON_LABELS: Record<Season, string> = {
  spring: 'spring arrives.',
  summer: 'summer arrives.',
  autumn: 'autumn arrives.',
  winter: 'winter arrives.',
}

export function GameCanvas({ activeTool, selectedEnrichment = 'resting_spot' }: GameCanvasProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const wrapperRef   = useRef<HTMLDivElement>(null)
  const gameState    = useLaietStore(s => s.gameState)
  const selectedCreatureId = useLaietStore(s => s.selectedCreatureId)
  const selectCreature     = useLaietStore(s => s.selectCreature)
  const hoverTile    = useLaietStore(s => s.hoverTile)
  const hoveredTile  = useLaietStore(s => s.hoveredTile)
  const dropFood     = useLaietStore(s => s.dropFood)
  const plantTree    = useLaietStore(s => s.plantTree)
  const thunderStrike = useLaietStore(s => s.thunderStrike)
  const igniteFire    = useLaietStore(s => s.igniteFire)
  const redirectRiver = useLaietStore(s => s.redirectRiver)
  const placeEnrichment = useLaietStore(s => s.placeEnrichment)

  // Canvas pixel dimensions ; updated by ResizeObserver
  const [cw, setCw] = useState(1120)
  const [ch, setCh] = useState(580)
  const cwRef = useRef(1120)
  const chRef = useRef(580)

  const gameStateRef    = useRef<GameState | null>(gameState)
  const selectedIdRef   = useRef<string | null>(selectedCreatureId)
  const hoveredTileRef  = useRef(hoveredTile)
  const prevPositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const lastTickTimeRef  = useRef(Date.now())

  // Season transition overlay
  const prevSeasonRef = useRef<Season | null>(null)
  const seasonOverlayRef = useRef<{ text: string; startTime: number } | null>(null)

  // River redirect two-click state
  const [riverSource, setRiverSource] = useState<{ x: number; y: number } | null>(null)
  const riverSourceRef = useRef<{ x: number; y: number } | null>(null)

  // Camera ; mutable ref so animation loop and event handlers share state
  const cameraRef = useRef<Camera>(makeInitialCamera(1120, 580))
  const [, setCameraTick] = useState(0)

  const dragRef = useRef<{ active: boolean; sx: number; sy: number; px: number; py: number }>({
    active: false, sx: 0, sy: 0, px: 0, py: 0,
  })

  // ── Responsive canvas sizing via ResizeObserver ──────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ro = new ResizeObserver(entries => {
      const e = entries[0]
      if (!e) return
      const w = Math.floor(e.contentRect.width)
      const h = Math.floor(e.contentRect.height)
      if (w < 10 || h < 10) return
      cwRef.current = w
      chRef.current = h
      setCw(w)
      setCh(h)
      // Recenter camera on resize keeping current zoom
      const cam = cameraRef.current
      cam.panX = 0
      const padY = 55
      const worldCenterY = padY + (WORLD_SIZE / 2) * ISO_TILE_HEIGHT
      cam.panY = (h / 2) - h / 2 - (worldCenterY - h / 2) * cam.zoom
    })
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [])

  useEffect(() => { selectedIdRef.current = selectedCreatureId }, [selectedCreatureId])
  useEffect(() => { hoveredTileRef.current = hoveredTile }, [hoveredTile])
  useEffect(() => { riverSourceRef.current = riverSource }, [riverSource])
  useEffect(() => {
    if (activeTool !== 'river') setRiverSource(null)
  }, [activeTool])

  useEffect(() => {
    const prev = gameStateRef.current
    if (prev && gameState && prev !== gameState) {
      const snap: Record<string, { x: number; y: number }> = {}
      for (const id in prev.creatures) {
        const c = prev.creatures[id]
        if (!c.diedOnDay) snap[id] = { x: c.x, y: c.y }
      }
      prevPositionsRef.current = snap
      lastTickTimeRef.current = Date.now()

      // Detect season transition and arm overlay (skip first render)
      const newSeason = gameState.time.season
      if (prevSeasonRef.current && prevSeasonRef.current !== newSeason) {
        seasonOverlayRef.current = { text: SEASON_LABELS[newSeason], startTime: Date.now() }
      }
      prevSeasonRef.current = newSeason
    } else if (!prev && gameState) {
      const snap: Record<string, { x: number; y: number }> = {}
      for (const id in gameState.creatures) {
        const c = gameState.creatures[id]
        if (!c.diedOnDay) snap[id] = { x: c.x, y: c.y }
      }
      prevPositionsRef.current = snap
      lastTickTimeRef.current = Date.now() - TICK_MS
      prevSeasonRef.current = gameState.time.season
    }
    gameStateRef.current = gameState
  }, [gameState])

  // ── Keyboard: Q/E rotate, +/- zoom, 0 recenter ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      const cam = cameraRef.current
      const cw_ = cwRef.current
      const ch_ = chRef.current
      if (e.key === 'q' || e.key === 'Q') {
        cam.rot = (cam.rot + 3) % 4
        setCameraTick(t => t + 1)
      } else if (e.key === 'e' || e.key === 'E') {
        cam.rot = (cam.rot + 1) % 4
        setCameraTick(t => t + 1)
      } else if (e.key === '+' || e.key === '=') {
        zoomAt(cam, cw_ / 2, ch_ / 2, cam.zoom * 1.15, cw_, ch_)
        setCameraTick(t => t + 1)
      } else if (e.key === '-' || e.key === '_') {
        zoomAt(cam, cw_ / 2, ch_ / 2, cam.zoom / 1.15, cw_, ch_)
        setCameraTick(t => t + 1)
      } else if (e.key === '0') {
        const reset = makeInitialCamera(cw_, ch_)
        cam.zoom = reset.zoom
        cam.panX = reset.panX
        cam.panY = reset.panY
        cam.rot  = 0
        setCameraTick(t => t + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Animation loop ──
  useEffect(() => {
    let rafId: number

    const loop = () => {
      const gs = gameStateRef.current
      const canvas = canvasRef.current
      if (!gs || !canvas) { rafId = requestAnimationFrame(loop); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafId = requestAnimationFrame(loop); return }
      const cam = cameraRef.current
      const cw_ = cwRef.current
      const ch_ = chRef.current

      resetCanvasState(ctx)

      const t = Math.min(1, (Date.now() - lastTickTimeRef.current) / TICK_MS)

      ctx.clearRect(0, 0, cw_, ch_)
      ctx.fillStyle = '#141414'
      ctx.fillRect(0, 0, cw_, ch_)

      // Camera transform
      ctx.save()
      ctx.translate(cw_ / 2 + cam.panX, ch_ / 2 + cam.panY)
      ctx.scale(cam.zoom, cam.zoom)
      ctx.translate(-cw_ / 2, -ch_ / 2)

      const origin = canvasOrigin(cw_)
      const { season, phase } = gs.time
      const rot = cam.rot

      const hoverScreenPos = hoveredTileRef.current
        ? rotateGrid(hoveredTileRef.current.x, hoveredTileRef.current.y, rot, WORLD_SIZE)
        : null

      // Viewport culling: compute visible canvas-space bounds once and skip
      // tiles whose top vertex is off-screen. At default zoom (~1×) this cuts
      // ~60% of drawTile calls; at higher zoom even more.
      const halfCw = cw_ / 2, halfCh = ch_ / 2
      const cullMargin = 30  // covers tile diamond overhang at any zoom level
      const sxMin = halfCw - (halfCw + cam.panX) / cam.zoom - cullMargin
      const sxMax = halfCw + (halfCw - cam.panX) / cam.zoom + cullMargin
      const syMin = halfCh - (halfCh + cam.panY) / cam.zoom - cullMargin
      const syMax = halfCh + (halfCh - cam.panY) / cam.zoom + cullMargin

      for (let py = 0; py < WORLD_SIZE; py++) {
        for (let px = 0; px < WORLD_SIZE; px++) {
          const orig = unrotateGrid(px, py, rot, WORLD_SIZE)
          const tile = gs.tiles[orig.y]?.[orig.x]
          if (!tile) continue   // bounds-safe for old 60×60 saves
          const iso = gridToIso(px, py)
          const sx = origin.x + iso.x
          const sy = origin.y + iso.y
          if (sx < sxMin || sx > sxMax || sy < syMin || sy > syMax) continue
          const hovered = hoverScreenPos !== null && hoverScreenPos.x === px && hoverScreenPos.y === py
          drawTile(ctx, tile, sx, sy, hovered, season)
        }
      }

      // Creatures ; depth sorted
      const alive = Object.values(gs.creatures)
        .filter(c => c.diedOnDay === null)
        .map(c => {
          const prev = prevPositionsRef.current[c.id]
          const px = prev?.x ?? c.x
          const py = prev?.y ?? c.y
          const lx = px + (c.x - px) * t
          const ly = py + (c.y - py) * t
          const r  = rotateGrid(lx, ly, rot, WORLD_SIZE)
          return { c, r }
        })
        .sort((a, b) => (a.r.x + a.r.y) - (b.r.x + b.r.y))

      for (const { c, r } of alive) {
        const orig = unrotateGrid(Math.round(r.x), Math.round(r.y), rot, WORLD_SIZE)
        const isInCave = gs.tiles[orig.y]?.[orig.x]?.type === 'cave'
        const iso = gridToIso(r.x, r.y)
        const sx = origin.x + iso.x
        const sy = origin.y + iso.y
        drawCreature(ctx, c, sx, sy, c.id === selectedIdRef.current, phase, isInCave, gs.time.day)
      }

      // Enrichment items
      for (const item of Object.values(gs.enrichmentItems ?? {})) {
        const ir = rotateGrid(item.x, item.y, rot, WORLD_SIZE)
        const iso = gridToIso(ir.x, ir.y)
        const esx = origin.x + iso.x
        const esy = origin.y + iso.y
        drawEnrichmentItem(ctx, item, esx, esy)
      }

      // River redirect preview ; dotted line from source to hovered tile
      const src = riverSourceRef.current
      const hov = hoveredTileRef.current
      if (src && hov) {
        const srcRot = rotateGrid(src.x, src.y, rot, WORLD_SIZE)
        const hovRot = rotateGrid(hov.x, hov.y, rot, WORLD_SIZE)
        const srcIso = gridToIso(srcRot.x, srcRot.y)
        const hovIso = gridToIso(hovRot.x, hovRot.y)
        const sx0 = origin.x + srcIso.x
        const sy0 = origin.y + srcIso.y
        const sx1 = origin.x + hovIso.x
        const sy1 = origin.y + hovIso.y
        ctx.save()
        ctx.setLineDash([4, 4])
        ctx.strokeStyle = 'rgba(80, 180, 220, 0.75)'
        ctx.lineWidth = 1.5 / cam.zoom
        ctx.beginPath()
        ctx.moveTo(sx0, sy0)
        ctx.lineTo(sx1, sy1)
        ctx.stroke()
        ctx.setLineDash([])
        // Highlight source tile
        ctx.strokeStyle = 'rgba(80, 180, 220, 0.90)'
        ctx.lineWidth = 2 / cam.zoom
        ctx.beginPath()
        ctx.arc(sx0, sy0, 4 / cam.zoom, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      ctx.restore()

      // Full-canvas overlays (no camera transform) ; atmosphere combines weather + phase
      drawAtmosphere(ctx, cw_, ch_, gs.weather ?? 'clear', phase, season)
      drawVignette(ctx, cw_, ch_)
      drawScanlines(ctx, cw_, ch_)

      // Season transition overlay ; brief lowercase text fades in/out over 3 seconds
      const overlay = seasonOverlayRef.current
      if (overlay) {
        const elapsed = Date.now() - overlay.startTime
        const duration = 3000
        if (elapsed < duration) {
          const t2 = elapsed / duration
          // Fade in over first 15%, hold, fade out over last 25%
          const alpha = t2 < 0.15 ? t2 / 0.15
            : t2 > 0.75 ? (1 - t2) / 0.25
            : 1.0
          ctx.save()
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.82
          ctx.font = '600 12px "Space Grotesk", system-ui, sans-serif'
          ctx.fillStyle = '#888888'
          ctx.textAlign = 'center'
          ctx.letterSpacing = '0.2em'
          ctx.fillText(overlay.text, cw_ / 2, ch_ - 28)
          ctx.restore()
        } else {
          seasonOverlayRef.current = null
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // ── eventToGrid ──────────────────────────────────────────────────────────────
  const eventToGrid = useCallback((e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const lx = e.clientX - rect.left
    const ly = e.clientY - rect.top
    // Scale from CSS pixels to canvas pixels
    const scaleX = cwRef.current / rect.width
    const scaleY = chRef.current / rect.height
    const u = screenToCanvas(lx * scaleX, ly * scaleY, cameraRef.current, cwRef.current, chRef.current)
    const origin = canvasOrigin(cwRef.current)
    const iso = isoToGrid(u.x - origin.x, u.y - origin.y)
    const orig = unrotateGrid(iso.x, iso.y, cameraRef.current.rot, WORLD_SIZE)
    return { x: Math.round(orig.x), y: Math.round(orig.y) }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragRef.current.active) {
      const cam = cameraRef.current
      cam.panX = dragRef.current.px + (e.clientX - dragRef.current.sx)
      cam.panY = dragRef.current.py + (e.clientY - dragRef.current.sy)
      setCameraTick(t => t + 1)
      return
    }
    const grid = eventToGrid(e)
    if (grid && grid.x >= 0 && grid.x < WORLD_SIZE && grid.y >= 0 && grid.y < WORLD_SIZE) {
      hoverTile(grid)
    } else {
      hoverTile(null)
    }
  }, [eventToGrid, hoverTile])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault()
      const cam = cameraRef.current
      dragRef.current = {
        active: true,
        sx: e.clientX,
        sy: e.clientY,
        px: cam.panX,
        py: cam.panY,
      }
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.shiftKey || e.button !== 0) return
    const gs = gameStateRef.current
    if (!gs) return
    const grid = eventToGrid(e)
    if (!grid) return
    if (grid.x < 0 || grid.x >= WORLD_SIZE || grid.y < 0 || grid.y >= WORLD_SIZE) return

    switch (activeTool) {
      case 'food':    dropFood(grid.x, grid.y); break
      case 'tree':    plantTree(grid.x, grid.y); break
      case 'thunder': thunderStrike(grid.x, grid.y); break
      case 'fire':    igniteFire(grid.x, grid.y); break
      case 'river': {
        const src = riverSourceRef.current
        if (!src) {
          // First click ; mark source
          setRiverSource({ x: grid.x, y: grid.y })
        } else {
          // Second click ; confirm redirect and clear
          redirectRiver(src.x, src.y, grid.x, grid.y)
          setRiverSource(null)
        }
        break
      }
      case 'enrich': placeEnrichment(grid.x, grid.y, selectedEnrichment); break
      case 'select': {
        const creature = Object.values(gs.creatures).find(
          c => c.x === grid.x && c.y === grid.y && c.diedOnDay === null
        )
        selectCreature(creature?.id ?? null)
        break
      }
    }
  }, [activeTool, selectedEnrichment, dropFood, plantTree, thunderStrike, igniteFire, redirectRiver, selectCreature, placeEnrichment, eventToGrid])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const lx = (e.clientX - rect.left) * (cwRef.current / rect.width)
    const ly = (e.clientY - rect.top)  * (chRef.current / rect.height)
    const cam = cameraRef.current
    const delta = -e.deltaY * 0.0014
    zoomAt(cam, lx, ly, cam.zoom * (1 + delta), cwRef.current, chRef.current)
    setCameraTick(t => t + 1)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const toolHints: Record<Tool, string> = {
    select:  'Click specimen to inspect',
    food:    'Click tile to drop food',
    tree:    'Click tile to plant tree',
    river:   riverSource
      ? 'Click destination to redirect river'
      : 'Click source tile to begin redirect',
    thunder: 'Click to strike ; kills creatures and trees',
    fire:    'Click flammable tile to ignite ; fire spreads',
    enrich:  'Click tile to place enrichment item',
  }

  const cam = cameraRef.current
  const rotLabel = `${cam.rot * 90}°`

  return (
    <CanvasWrapper ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        width={cw}
        height={ch}
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        onMouseLeave={() => { hoverTile(null); dragRef.current.active = false }}
      />
      <CRTOverlay />
      <Corner pos='top-left'>Observation Field</Corner>
      <Corner pos='bottom-left'>ID {gameStateRef.current?.worldId.slice(0, 8) ?? ';'}</Corner>
      <CameraReadout>
        ZOOM ×{cam.zoom.toFixed(2)}<br />
        ROT  {rotLabel}
      </CameraReadout>
      <CameraHelp>
        WHEEL · ZOOM<br />
        DRAG · PAN<br />
        Q · E · ROTATE<br />
        0 · RECENTER
      </CameraHelp>
      <ToolHint>{toolHints[activeTool]}</ToolHint>
    </CanvasWrapper>
  )
}
