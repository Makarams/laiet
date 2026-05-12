import { DayPhase, WeatherState, Season } from '@/types'

// ─── Unified atmospheric overlay ──────────────────────────────────────────────
// Weather and day phase interact; separating them produces inconsistencies
// (storm at night looks identical to clear night + rain layer on top).
// This single function handles both together so the result is always coherent.
//
// Render order inside this function:
//   1. Weather effects (rain streaks / drought haze)
//   2. Phase tint (dawn/dusk/night), modulated by weather
//
// Called after tile + creature layers but before scanlines + vignette.

export function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  weather: WeatherState,
  phase: DayPhase,
  _season: Season
): void {
  const now = Date.now()

  // ── Rain / Storm ─────────────────────────────────────────────────────────────
  if (weather === 'rain' || weather === 'storm') {
    const heavy = weather === 'storm'
    const count = heavy ? 200 : 100

    // Night rain is barely visible — ambient light is low, streaks are darker
    const phaseAlpha = phase === 'night' ? 0.10
      : (phase === 'dawn' || phase === 'dusk') ? 0.16
      : 0.22
    const alpha = heavy ? phaseAlpha * 1.35 : phaseAlpha

    ctx.save()
    // Night streaks shift blue-grey; day streaks are silver-white
    ctx.strokeStyle = phase === 'night'
      ? `rgba(80, 110, 200, ${alpha})`
      : (phase === 'dawn' || phase === 'dusk')
        ? `rgba(140, 160, 200, ${alpha})`
        : `rgba(180, 210, 255, ${alpha})`
    ctx.lineWidth = heavy ? 0.9 : 0.6
    ctx.lineCap = 'round'

    const scroll = (now / 280) % 80
    for (let i = 0; i < count; i++) {
      const seed = i * 173.3 + 7.1
      const baseX = ((seed % width + scroll * 0.45) % (width + 60)) - 30
      const baseY = ((seed * 0.618 % height + scroll) % (height + 60)) - 30
      const len = 8 + (i % 7) * 1.2
      ctx.beginPath()
      ctx.moveTo(baseX, baseY)
      ctx.lineTo(baseX + len * 0.32, baseY + len)
      ctx.stroke()
    }

    // Storm: ground mist at lower third — tinted for night vs day
    if (heavy) {
      ctx.fillStyle = phase === 'night'
        ? 'rgba(30, 50, 120, 0.07)'
        : 'rgba(100, 130, 200, 0.04)'
      ctx.fillRect(0, height * 0.68, width, height * 0.32)
    }

    ctx.restore()

  // ── Drought ──────────────────────────────────────────────────────────────────
  } else if (weather === 'drought') {
    const baseAlpha = phase === 'night' ? 0.020 : phase === 'day' ? 0.055 : 0.035
    const shimmer = Math.sin(now / 900) * 0.012
    ctx.fillStyle = `rgba(220, 160, 40, ${baseAlpha + shimmer})`
    ctx.fillRect(0, 0, width, height)

    // Ground shimmer bands — only legible during day and dusk
    if (phase === 'day' || phase === 'dusk') {
      ctx.fillStyle = 'rgba(255, 180, 60, 0.022)'
      for (let i = 0; i < 4; i++) {
        const bandY = height * (0.55 + i * 0.12) + Math.sin(now / 700 + i) * 4
        ctx.fillRect(0, bandY, width, 6)
      }
    }
  }

  // ── Phase tint — modulated by weather ────────────────────────────────────────
  if (phase === 'night') {
    // Storm deepens dark, drought clears it slightly (dry air = clearer sky)
    const nightAlpha = weather === 'storm' ? 0.50
      : weather === 'drought'              ? 0.34
      : weather === 'rain'                 ? 0.46
      : 0.42
    ctx.fillStyle = `rgba(6, 8, 32, ${nightAlpha})`
    ctx.fillRect(0, 0, width, height)
  } else if (phase === 'dawn') {
    // Rain dulls the warm dawn glow; drought makes it more saturated and orange
    if (weather === 'rain' || weather === 'storm') {
      ctx.fillStyle = 'rgba(120, 140, 180, 0.06)'
    } else if (weather === 'drought') {
      ctx.fillStyle = 'rgba(240, 155, 55, 0.11)'
    } else {
      ctx.fillStyle = 'rgba(220, 150, 80, 0.07)'
    }
    ctx.fillRect(0, 0, width, height)
  } else if (phase === 'dusk') {
    if (weather === 'rain' || weather === 'storm') {
      ctx.fillStyle = 'rgba(100, 80, 120, 0.07)'
    } else if (weather === 'drought') {
      ctx.fillStyle = 'rgba(210, 90, 60, 0.12)'
    } else {
      ctx.fillStyle = 'rgba(180, 70, 100, 0.09)'
    }
    ctx.fillRect(0, 0, width, height)
  }
  // 'day' phase has no tint (clear or handled by drought/rain above)
}

// ─── Scanlines (CRT aesthetic) ─────────────────────────────────────────────────

export function drawScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1)
  }
}

// ─── Vignette — dark corners for depth ────────────────────────────────────────

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const cx = width / 2
  const cy = height / 2
  const gradient = ctx.createRadialGradient(
    cx, cy, Math.min(cx, cy) * 0.55,
    cx, cy, Math.max(cx, cy) * 1.05
  )
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, 'rgba(0, 0, 8, 0.55)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}
