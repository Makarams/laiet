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
    ctx.save()

    // Dark overcast sky tint; storm is significantly gloomier than plain rain
    if (heavy) {
      const overcastAlpha = phase === 'night' ? 0.10 : phase === 'day' ? 0.18 : 0.14
      ctx.fillStyle = `rgba(22, 28, 55, ${overcastAlpha})`
      ctx.fillRect(0, 0, width, height)
    } else {
      const overcastAlpha = phase === 'day' ? 0.06 : 0
      if (overcastAlpha > 0) {
        ctx.fillStyle = `rgba(40, 50, 80, ${overcastAlpha})`
        ctx.fillRect(0, 0, width, height)
      }
    }

    // Two rain layers: background (finer, slower) and foreground (heavier, faster).
    // The dual-layer gives a sense of depth and volume to the precipitation.
    const layers = heavy
      ? [
          { count: 120, speed: 320, angle: 0.42, width: 0.6, lenBase: 9, lenVar: 5, alphaBase: 0.18, color: phase === 'night' ? [70,95,185] : [155,190,240] },
          { count:  85, speed: 220, angle: 0.28, width: 1.1, lenBase: 7, lenVar: 4, alphaBase: 0.26, color: phase === 'night' ? [80,110,200] : [175,210,255] },
        ]
      : [
          { count:  70, speed: 380, angle: 0.30, width: 0.5, lenBase: 7, lenVar: 3, alphaBase: 0.12, color: phase === 'night' ? [70,95,180] : [150,185,235] },
          { count:  45, speed: 260, angle: 0.20, width: 0.8, lenBase: 6, lenVar: 3, alphaBase: 0.18, color: phase === 'night' ? [80,110,195] : [170,205,250] },
        ]

    ctx.lineCap = 'round'
    for (const layer of layers) {
      const scroll = (now / layer.speed) % (height + 80)
      const [r, g, b] = layer.color
      ctx.strokeStyle = `rgba(${r},${g},${b},${layer.alphaBase})`
      ctx.lineWidth = layer.width
      ctx.beginPath()
      for (let i = 0; i < layer.count; i++) {
        const seed = i * 173.3 + 7.1 + layer.speed
        const bx = ((seed % (width + 60) + scroll * layer.angle) % (width + 60)) - 30
        const by = ((seed * 0.618 % (height + 80) + scroll) % (height + 80)) - 40
        const len = layer.lenBase + (i % 7) * (layer.lenVar / 7)
        ctx.moveTo(bx, by)
        ctx.lineTo(bx + len * layer.angle, by + len)
      }
      ctx.stroke()
    }

    // Ground splash at the very bottom — tiny horizontal dashes where drops hit
    if (phase !== 'night') {
      const splashAlpha = heavy ? 0.12 : 0.07
      ctx.strokeStyle = `rgba(160, 210, 255, ${splashAlpha})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      const splashScroll = (now / 180) % (width + 40)
      for (let i = 0; i < 40; i++) {
        const seed = i * 311.1 + 5.5
        const sx2 = ((seed % (width + 40) + splashScroll * 0.05) % (width + 40)) - 20
        const sy2 = height * 0.88 + (seed * 0.5 % (height * 0.12))
        ctx.moveTo(sx2, sy2)
        ctx.lineTo(sx2 + 2.5 + (i % 3), sy2)
      }
      ctx.stroke()
    }

    // Storm: heavy rolling ground mist + lightning-sky glow
    if (heavy) {
      // Two-pass mist: deep base + lighter upper fringe
      const mistGrad = ctx.createLinearGradient(0, height * 0.62, 0, height)
      mistGrad.addColorStop(0, 'rgba(60, 80, 150, 0)')
      mistGrad.addColorStop(0.6, phase === 'night' ? 'rgba(30, 45, 120, 0.08)' : 'rgba(80, 110, 185, 0.06)')
      mistGrad.addColorStop(1,   phase === 'night' ? 'rgba(20, 30, 100, 0.14)' : 'rgba(60, 90, 160, 0.10)')
      ctx.fillStyle = mistGrad
      ctx.fillRect(0, height * 0.62, width, height * 0.38)

      // Rolling mist wisps at ground level
      const mistScroll = (now / 2800) % (width + 160)
      for (let i = 0; i < 7; i++) {
        const wx = ((i * 211.3 + mistScroll) % (width + 160)) - 80
        const wy = height * 0.78 + (i % 3) * height * 0.05
        const wa = 0.04 + Math.sin(now / 1800 + i) * 0.02
        ctx.fillStyle = phase === 'night'
          ? `rgba(50, 70, 150, ${wa})`
          : `rgba(100, 130, 200, ${wa})`
        ctx.beginPath()
        ctx.ellipse(wx, wy, 110 + (i % 4) * 55, 14 + (i % 3) * 7, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()

  // ── Snow ─────────────────────────────────────────────────────────────────────
  // Three-layer approach: distant fine flurry, main mid-size flakes, close large flakes.
  // Layered speeds create a parallax that reads as true depth and volume.
  } else if (weather === 'snow') {
    ctx.save()

    // Wind sway: a slow oscillating horizontal bias so flakes drift rather than fall straight
    const windBias = Math.sin(now / 7000) * 0.55 + 0.20  // 0→0.75 bias factor

    // Layer A — distant fine flurry (small, faster, semi-transparent)
    {
      const scroll = (now / 420) % (height + 30)
      const col = phase === 'night' ? '185, 215, 255' : '248, 254, 255'
      const baseAlpha = phase === 'night' ? 0.38 : 0.55
      ctx.fillStyle = `rgba(${col}, ${baseAlpha})`
      for (let i = 0; i < 110; i++) {
        const seed = i * 137.5 + 3.7
        const bx = ((seed % (width + 20) + windBias * scroll * 0.10) % (width + 20))
        const by = ((seed * 0.618 % (height + 30) + scroll) % (height + 30)) - 15
        const r = 0.55 + (i % 4) * 0.22
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Layer B — main mid-size flakes (moderate size and opacity)
    {
      const scroll = (now / 700) % (height + 55)
      for (let i = 0; i < 75; i++) {
        const seed = i * 237.7 + 13.3
        const bx = ((seed % (width + 30) + windBias * scroll * 0.14) % (width + 30))
        const by = ((seed * 0.713 % (height + 55) + scroll) % (height + 55)) - 28
        const r = 1.1 + (i % 5) * 0.52
        const a = (phase === 'night' ? 0.52 : 0.78) * (0.62 + (i % 7) * 0.055)
        ctx.fillStyle = phase === 'night'
          ? `rgba(190, 218, 255, ${a})`
          : `rgba(252, 255, 255, ${a})`
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Layer C — close large flakes (few, slowest, fully visible, most dramatic)
    {
      const scroll = (now / 1150) % (height + 75)
      for (let i = 0; i < 22; i++) {
        const seed = i * 411.1 + 77.7
        const bx = ((seed % (width + 40) + windBias * scroll * 0.07) % (width + 40))
        const by = ((seed * 0.500 % (height + 75) + scroll) % (height + 75)) - 38
        const r = 2.4 + (i % 4) * 0.90
        const a = phase === 'night' ? 0.60 : 0.90
        ctx.fillStyle = phase === 'night'
          ? `rgba(182, 212, 255, ${a})`
          : `rgba(255, 255, 255, ${a})`
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Ground accumulation bank — a gradient veil at the base of the screen that
    // reinforces the sense of built-up snow on the horizon / foreground.
    const bankGrad = ctx.createLinearGradient(0, height * 0.78, 0, height)
    bankGrad.addColorStop(0, 'rgba(232, 248, 255, 0.00)')
    bankGrad.addColorStop(0.5, phase === 'night' ? 'rgba(170, 205, 240, 0.08)' : 'rgba(235, 250, 255, 0.12)')
    bankGrad.addColorStop(1,   phase === 'night' ? 'rgba(155, 192, 235, 0.18)' : 'rgba(240, 252, 255, 0.26)')
    ctx.fillStyle = bankGrad
    ctx.fillRect(0, height * 0.78, width, height * 0.22)

    ctx.restore()

  // ── Heatwave ─────────────────────────────────────────────────────────────────
  // Layered: base amber tint + oscillating shimmer bands + rising heat particles
  } else if (weather === 'heatwave') {
    ctx.save()

    // Base amber wash — stronger at noon, faint at night
    const baseAlpha = phase === 'night' ? 0.032 : phase === 'day' ? 0.085 : 0.058
    const shimmer   = Math.sin(now / 620) * 0.022
    ctx.fillStyle = `rgba(235, 115, 20, ${baseAlpha + shimmer})`
    ctx.fillRect(0, 0, width, height)

    if (phase === 'day' || phase === 'dusk') {
      // Undulating heat-distortion bands rising from the ground.
      // More bands, slower oscillation, more varied in position.
      for (let i = 0; i < 10; i++) {
        const speed1 = 520 + i * 38
        const speed2 = 600 + i * 25
        const bandY = height * (0.38 + i * 0.065) + Math.sin(now / speed1 + i * 1.35) * 8
        const bandA = 0.028 + Math.sin(now / speed2 + i * 0.7) * 0.018
        ctx.fillStyle = `rgba(255, 145, 32, ${bandA})`
        ctx.fillRect(0, bandY, width, 10)
      }

      // Rising heat-shimmer particles — tiny fast-rising dots that evoke hot air.
      for (let i = 0; i < 18; i++) {
        const cycle = ((now / 900 + i * 0.055) % 1.0)
        const px = width * (0.05 + (i * 173.3 % 0.90))
        const py = height * (0.55 + (1 - cycle) * 0.40)
        const pa = cycle < 0.12 ? cycle / 0.12 : cycle > 0.75 ? (1 - cycle) / 0.25 : 1.0
        ctx.fillStyle = `rgba(255, 175, 60, ${pa * 0.07})`
        ctx.beginPath()
        ctx.ellipse(px, py, 3 + (i % 5), 1.4, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Heavy ground shimmer: full-width gradient at the horizon bottom
      const groundGrad = ctx.createLinearGradient(0, height * 0.70, 0, height)
      groundGrad.addColorStop(0, 'rgba(240, 130, 25, 0)')
      groundGrad.addColorStop(0.5, `rgba(245, 140, 30, ${0.035 + Math.sin(now / 440) * 0.018})`)
      groundGrad.addColorStop(1, `rgba(255, 155, 40, ${0.055 + Math.sin(now / 310) * 0.022})`)
      ctx.fillStyle = groundGrad
      ctx.fillRect(0, height * 0.70, width, height * 0.30)
    }

    ctx.restore()

  // ── Fog ───────────────────────────────────────────────────────────────────────
  // Multiple drifting layers at different heights; not just a flat tint.
  } else if (weather === 'fog') {
    ctx.save()

    // Sky-wide base fill
    const baseAlpha = phase === 'night' ? 0.20 : phase === 'day' ? 0.11 : 0.17
    ctx.fillStyle = `rgba(175, 192, 208, ${baseAlpha})`
    ctx.fillRect(0, 0, width, height)

    // Three fog band heights, each moving at different speed and opacity
    const fogLayers = [
      { speed: 2800, count: 7,  yBase: 0.08, ySpread: 0.28, wBase: 110, wVar: 55, hBase: 18, hVar: 10, aScale: 0.50 },
      { speed: 4200, count: 9,  yBase: 0.32, ySpread: 0.25, wBase: 130, wVar: 65, hBase: 22, hVar: 12, aScale: 0.60 },
      { speed: 1800, count: 6,  yBase: 0.66, ySpread: 0.22, wBase: 150, wVar: 70, hBase: 28, hVar: 14, aScale: 0.45 },
    ]
    for (const layer of fogLayers) {
      const fogScroll = (now / layer.speed) % (width + 160)
      for (let i = 0; i < layer.count; i++) {
        const wx = ((i * 197.3 + fogScroll) % (width + 160)) - 80
        const wy = height * (layer.yBase + (i % 5) * (layer.ySpread / 5))
        const wa = baseAlpha * (0.40 + Math.sin(now / 2200 + i * 0.9) * 0.20) * layer.aScale
        ctx.fillStyle = `rgba(205, 220, 232, ${wa})`
        ctx.beginPath()
        ctx.ellipse(wx, wy, layer.wBase + (i % 3) * (layer.wVar / 3), layer.hBase + (i % 4) * (layer.hVar / 4), 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Dense ground-hugging fog bank at the base
    const fogBankGrad = ctx.createLinearGradient(0, height * 0.72, 0, height)
    fogBankGrad.addColorStop(0, 'rgba(188, 208, 224, 0)')
    fogBankGrad.addColorStop(1, `rgba(196, 216, 230, ${phase === 'night' ? 0.28 : 0.18})`)
    ctx.fillStyle = fogBankGrad
    ctx.fillRect(0, height * 0.72, width, height * 0.28)

    ctx.restore()

  // ── Drought ──────────────────────────────────────────────────────────────────
  // Warm: amber shimmer, dust particles, cracked-air heat. Winter: cold still grey.
  } else if (weather === 'drought') {
    ctx.save()
    if (season === 'winter') {
      // Frost-drought: cold dry air — a faint grey-blue still-air chill.
      const baseAlpha = phase === 'night' ? 0.012 : 0.026
      ctx.fillStyle = `rgba(155, 182, 210, ${baseAlpha})`
      ctx.fillRect(0, 0, width, height)
    } else {
      // Warm drought: amber shimmer and heat-band distortion
      const baseAlpha = phase === 'night' ? 0.022 : phase === 'day' ? 0.060 : 0.040
      const shimmer = Math.sin(now / 880) * 0.014
      ctx.fillStyle = `rgba(218, 158, 38, ${baseAlpha + shimmer})`
      ctx.fillRect(0, 0, width, height)

      if (phase === 'day' || phase === 'dusk') {
        // Ground shimmer bands
        for (let i = 0; i < 5; i++) {
          const bandY = height * (0.52 + i * 0.11) + Math.sin(now / 680 + i * 1.1) * 5
          const ba = 0.018 + Math.sin(now / 520 + i * 0.8) * 0.010
          ctx.fillStyle = `rgba(255, 178, 58, ${ba})`
          ctx.fillRect(0, bandY, width, 7)
        }

        // Floating dust motes — tiny drifting specks that evoke bone-dry air
        for (let i = 0; i < 14; i++) {
          const driftX = (now / (1400 + i * 130) + i * 0.618) % 1.0
          const driftY = 0.25 + ((i * 0.382) % 0.65)
          const dustA = 0.035 + Math.sin(now / 900 + i * 1.3) * 0.020
          ctx.fillStyle = `rgba(210, 165, 55, ${dustA})`
          ctx.beginPath()
          ctx.arc(driftX * width, driftY * height, 1.0 + (i % 3) * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }

        // Horizon heat shimmer gradient
        const dustGrad = ctx.createLinearGradient(0, height * 0.68, 0, height)
        dustGrad.addColorStop(0, 'rgba(225, 165, 42, 0)')
        dustGrad.addColorStop(1, `rgba(235, 175, 50, ${0.040 + Math.sin(now / 340) * 0.018})`)
        ctx.fillStyle = dustGrad
        ctx.fillRect(0, height * 0.68, width, height * 0.32)
      }
    }
    ctx.restore()
  }

  // ── Phase tint ; modulated by weather ────────────────────────────────────────
  if (phase === 'night') {
    // Storm deepens dark; snow reflects moonlight (lighter night); fog thickens darkness.
    const nightAlpha = weather === 'storm'    ? 0.52
      : weather === 'drought'                ? 0.34
      : weather === 'rain'                   ? 0.47
      : weather === 'snow'                   ? 0.36   // snow reflects moonlight; perceptibly lighter
      : weather === 'heatwave'               ? 0.29   // warm night; amber residual glow
      : weather === 'fog'                    ? 0.54   // fog absorbs and scatters moonlight
      : 0.42
    ctx.fillStyle = `rgba(6, 8, 32, ${nightAlpha})`
    ctx.fillRect(0, 0, width, height)
  } else if (phase === 'dawn') {
    if (weather === 'rain' || weather === 'storm') {
      ctx.fillStyle = weather === 'storm'
        ? 'rgba(80, 100, 155, 0.10)'   // storm dawn is notably grey and oppressive
        : 'rgba(120, 140, 180, 0.06)'
    } else if (weather === 'drought') {
      ctx.fillStyle = season === 'winter'
        ? 'rgba(180, 205, 225, 0.07)'
        : 'rgba(240, 155, 55, 0.12)'
    } else if (weather === 'snow') {
      ctx.fillStyle = 'rgba(185, 215, 248, 0.09)'  // cool blue-grey snow dawn
    } else if (weather === 'heatwave') {
      ctx.fillStyle = 'rgba(255, 128, 22, 0.15)'   // scorched orange pre-dawn
    } else if (weather === 'fog') {
      ctx.fillStyle = 'rgba(155, 178, 198, 0.12)'  // muted grey-blue foggy dawn
    } else {
      ctx.fillStyle = 'rgba(220, 150, 80, 0.07)'
    }
    ctx.fillRect(0, 0, width, height)
  } else if (phase === 'dusk') {
    if (weather === 'rain' || weather === 'storm') {
      ctx.fillStyle = weather === 'storm'
        ? 'rgba(60, 50, 100, 0.12)'   // bruised purple-grey storm dusk
        : 'rgba(100, 80, 120, 0.07)'
    } else if (weather === 'drought') {
      ctx.fillStyle = season === 'winter'
        ? 'rgba(140, 165, 200, 0.09)'
        : 'rgba(215, 88, 58, 0.13)'   // deep terracotta drought dusk
    } else if (weather === 'snow') {
      ctx.fillStyle = 'rgba(135, 168, 215, 0.08)'  // blue-violet snow dusk
    } else if (weather === 'heatwave') {
      ctx.fillStyle = 'rgba(242, 88, 16, 0.18)'    // deep amber-red heatwave dusk
    } else if (weather === 'fog') {
      ctx.fillStyle = 'rgba(115, 138, 162, 0.10)'  // dim blued foggy dusk
    } else {
      ctx.fillStyle = 'rgba(180, 70, 100, 0.09)'
    }
    ctx.fillRect(0, 0, width, height)
  }
  // 'day' phase has no tint (clear or handled by drought/rain/heatwave above)
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
