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
  season: Season
): void {
  const now = Date.now()

  // ── Rain / Storm ─────────────────────────────────────────────────────────────
  if (weather === 'rain' || weather === 'storm') {
    const heavy = weather === 'storm'
    const count = heavy ? 200 : 100

    // Night rain is barely visible ; ambient light is low, streaks are darker
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

    // Storm: ground mist at lower third ; tinted for night vs day
    if (heavy) {
      ctx.fillStyle = phase === 'night'
        ? 'rgba(30, 50, 120, 0.07)'
        : 'rgba(100, 130, 200, 0.04)'
      ctx.fillRect(0, height * 0.68, width, height * 0.32)
    }

    ctx.restore()

  // ── Snow ─────────────────────────────────────────────────────────────────────
  } else if (weather === 'snow') {
    const count = 160
    const phaseAlpha = phase === 'night' ? 0.55
      : (phase === 'dawn' || phase === 'dusk') ? 0.62
      : 0.70
    ctx.save()

    // Slower, softer flakes ; drift diagonally
    const scroll  = (now / 600) % (height + 40)
    const driftX  = Math.sin(now / 4000) * 0.35   // gentle horizontal sway

    for (let i = 0; i < count; i++) {
      const seed   = i * 237.7 + 13.3
      const baseX  = ((seed % width + driftX * scroll * 0.15) % (width + 20))
      const baseY  = ((seed * 0.713 % (height + 40) + scroll) % (height + 40)) - 20
      const radius = 1.0 + (i % 5) * 0.55   // variety of flake sizes
      const alpha  = phaseAlpha * (0.55 + (i % 7) * 0.07)

      // Night snow is pale blue-white, day snow is pure white
      ctx.fillStyle = phase === 'night'
        ? `rgba(180, 210, 255, ${alpha})`
        : `rgba(235, 245, 255, ${alpha})`

      ctx.beginPath()
      ctx.arc(baseX, baseY, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Blizzard ground haze at base of screen
    ctx.fillStyle = phase === 'night'
      ? 'rgba(140, 180, 230, 0.06)'
      : 'rgba(220, 235, 255, 0.08)'
    ctx.fillRect(0, height * 0.72, width, height * 0.28)

    ctx.restore()

  // ── Heatwave ─────────────────────────────────────────────────────────────────
  } else if (weather === 'heatwave') {
    const baseAlpha = phase === 'night' ? 0.028 : phase === 'day' ? 0.075 : 0.050
    const shimmer = Math.sin(now / 650) * 0.020
    ctx.fillStyle = `rgba(235, 115, 18, ${baseAlpha + shimmer})`
    ctx.fillRect(0, 0, width, height)
    if (phase === 'day' || phase === 'dusk') {
      for (let i = 0; i < 7; i++) {
        const bandY = height * (0.42 + i * 0.09) + Math.sin(now / 480 + i * 1.4) * 7
        const bandAlpha = 0.022 + Math.sin(now / 550 + i) * 0.013
        ctx.fillStyle = `rgba(255, 145, 30, ${bandAlpha})`
        ctx.fillRect(0, bandY, width, 9)
      }
    }

  // ── Fog ───────────────────────────────────────────────────────────────────────
  } else if (weather === 'fog') {
    ctx.save()
    const baseAlpha = phase === 'night' ? 0.22 : phase === 'day' ? 0.13 : 0.19
    ctx.fillStyle = `rgba(175, 192, 208, ${baseAlpha})`
    ctx.fillRect(0, 0, width, height)
    // Drifting fog wisps
    const fogScroll = (now / 3200) % (width + 120)
    for (let i = 0; i < 9; i++) {
      const wipX = ((i * 197.3 + fogScroll) % (width + 120)) - 60
      const wipY = height * (0.15 + (i % 5) * 0.17)
      const wipAlpha = baseAlpha * (0.45 + Math.sin(now / 2200 + i * 0.9) * 0.22)
      ctx.fillStyle = `rgba(200, 218, 230, ${wipAlpha})`
      ctx.beginPath()
      ctx.ellipse(wipX, wipY, 90 + (i % 3) * 45, 16 + (i % 4) * 9, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

  // ── Drought ──────────────────────────────────────────────────────────────────
  } else if (weather === 'drought') {
    if (season === 'winter') {
      // Frost-drought: cold dry air with no warmth; suppress the amber haze entirely.
      // Renders as a faint grey-blue chill layer consistent with frozen winter skies.
      const baseAlpha = phase === 'night' ? 0.010 : 0.024
      ctx.fillStyle = `rgba(160, 185, 210, ${baseAlpha})`
      ctx.fillRect(0, 0, width, height)
    } else {
      // Warm drought: amber shimmer and heat-band distortion
      const baseAlpha = phase === 'night' ? 0.020 : phase === 'day' ? 0.055 : 0.035
      const shimmer = Math.sin(now / 900) * 0.012
      ctx.fillStyle = `rgba(220, 160, 40, ${baseAlpha + shimmer})`
      ctx.fillRect(0, 0, width, height)
      // Ground shimmer bands; only legible during day and dusk
      if (phase === 'day' || phase === 'dusk') {
        ctx.fillStyle = 'rgba(255, 180, 60, 0.022)'
        for (let i = 0; i < 4; i++) {
          const bandY = height * (0.55 + i * 0.12) + Math.sin(now / 700 + i) * 4
          ctx.fillRect(0, bandY, width, 6)
        }
      }
    }
  }

  // ── Phase tint ; modulated by weather ────────────────────────────────────────
  if (phase === 'night') {
    // Storm deepens dark, drought clears it slightly (dry air = clearer sky)
    const nightAlpha = weather === 'storm'    ? 0.50
      : weather === 'drought'                ? 0.34
      : weather === 'rain'                   ? 0.46
      : weather === 'snow'                   ? 0.38   // snow reflects moonlight; lighter night
      : weather === 'heatwave'               ? 0.30   // warm night; amber glow bleeds into dark
      : weather === 'fog'                    ? 0.52   // fog thickens darkness
      : 0.42
    ctx.fillStyle = `rgba(6, 8, 32, ${nightAlpha})`
    ctx.fillRect(0, 0, width, height)
  } else if (phase === 'dawn') {
    // Rain dulls the warm dawn glow; drought makes it more saturated and orange
    if (weather === 'rain' || weather === 'storm') {
      ctx.fillStyle = 'rgba(120, 140, 180, 0.06)'
    } else if (weather === 'drought') {
      ctx.fillStyle = season === 'winter'
        ? 'rgba(180, 205, 225, 0.07)'
        : 'rgba(240, 155, 55, 0.11)'
    } else if (weather === 'snow') {
      ctx.fillStyle = 'rgba(180, 210, 245, 0.08)'
    } else if (weather === 'heatwave') {
      ctx.fillStyle = 'rgba(255, 130, 25, 0.14)'   // scorched orange pre-dawn
    } else if (weather === 'fog') {
      ctx.fillStyle = 'rgba(155, 178, 198, 0.11)'  // muted grey-blue foggy dawn
    } else {
      ctx.fillStyle = 'rgba(220, 150, 80, 0.07)'
    }
    ctx.fillRect(0, 0, width, height)
  } else if (phase === 'dusk') {
    if (weather === 'rain' || weather === 'storm') {
      ctx.fillStyle = 'rgba(100, 80, 120, 0.07)'
    } else if (weather === 'drought') {
      ctx.fillStyle = season === 'winter'
        ? 'rgba(140, 165, 200, 0.09)'
        : 'rgba(210, 90, 60, 0.12)'
    } else if (weather === 'snow') {
      ctx.fillStyle = 'rgba(140, 170, 210, 0.07)'
    } else if (weather === 'heatwave') {
      ctx.fillStyle = 'rgba(240, 90, 18, 0.16)'    // deep amber-red heatwave dusk
    } else if (weather === 'fog') {
      ctx.fillStyle = 'rgba(115, 138, 162, 0.09)'  // dim blued foggy dusk
    } else {
      ctx.fillStyle = 'rgba(180, 70, 100, 0.09)'
    }
    ctx.fillRect(0, 0, width, height)
  }
  // 'day' phase has no tint (clear or handled by drought/rain above)
}

// ─── Scanlines ; removed in Field Guide design (replaced by vignette only) ─────

export function drawScanlines(
  _ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number
): void {
  // No-op: scanlines were a sci-fi CRT aesthetic.
  // The Field Guide system uses clean isometric rendering.
}

// ─── Vignette ; dark corners for depth ────────────────────────────────────────

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
