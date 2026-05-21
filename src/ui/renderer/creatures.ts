import { Creature, DayPhase, WeatherState } from '@/types'
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT, CAVE_CREATURE_ALPHA, MUTATION_DISPLAY_DAYS, MICRO_ANIM_DURATION_MS } from '@/engine/constants'
import { genomeColor, mindGlow } from '@/engine/genetics'
import { lighten, darken, adjustBrightness } from './utils'

// ─── Biome environmental tints applied over the body ──────────────────────────
// Represent long-term environmental exposure on the creature's appearance.
const BIOME_TINT: Record<string, [number, number, number, number]> = {
  arid:      [200, 140, 40,  0.09],   // warm dust coat
  wetland:   [40,  120, 160, 0.07],   // cool wet sheen
  lush:      [60,  200, 100, 0.06],   // verdant glow
  rocky:     [100, 100, 120, 0.08],   // grey mineral dust
  temperate: [0,   0,   0,   0],      // neutral ; no overlay
}

// ─── Draw creature ─────────────────────────────────────────────────────────────

export function drawCreature(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  screenX: number,
  screenY: number,
  selected: boolean,
  phase: DayPhase,
  isInCave = false,
  currentDay = 0,
  weather?: WeatherState
): void {
  if (creature.diedOnDay !== null) return

  ctx.save()
  ctx.globalAlpha = 1.0
  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'

  const baseColor = genomeColor(creature.genome)
  const healthFade = 0.65 + (creature.health / 100) * 0.35
  const bodyColor = adjustBrightness(baseColor, healthFade)
  const glow = mindGlow(creature.genome.mind)

  // Playing state ; slight vertical bounce
  const playBounce = creature.state === 'playing'
    ? Math.sin(Date.now() / 120 + creature.id.charCodeAt(0)) * 3.5
    : 0

  // Micro-animation ; a short body-language burst (jump / shake / sneeze /
  // groom / wag). The simulation (tick.ts) sets creature.microAnim = { type,
  // startMs }; the renderer plays it out over MICRO_ANIM_DURATION_MS as a
  // translation offset, the same way playBounce folds into the anchor.
  let animX = 0, animY = 0
  if (creature.microAnim) {
    const dur = MICRO_ANIM_DURATION_MS[creature.microAnim.type] ?? 0
    const p = dur > 0 ? (Date.now() - creature.microAnim.startMs) / dur : 1
    if (p >= 0 && p < 1) {
      switch (creature.microAnim.type) {
        case 'jump':   animY = -Math.sin(p * Math.PI) * 5.5; break
        case 'shake':  animX = Math.sin(p * Math.PI * 9) * 3.0 * (1 - p); break
        case 'sneeze': animY = -Math.sin(Math.min(1, p * 2) * Math.PI) * 2.6; break
        case 'groom':  animX = Math.sin(p * Math.PI * 2) * 1.8; break
        case 'wag':    animX = Math.sin(p * Math.PI * 5) * 2.4 * (1 - p * 0.5); break
      }
    }
  }

  const cx = screenX + animX
  const cy = screenY + ISO_TILE_HEIGHT * 0.5 + playBounce + animY

  // Age factor ; grows from 60% at birth to 100% at maturity
  const ageRatio = Math.min(1.0, creature.age / 40)
  const ageFactor = 0.60 + ageRatio * 0.40
  const morphSize = 0.85 + (creature.genome.morphSeed ?? 0.5) * 0.30
  const asym = ((creature.genome.morphSeed ?? 0.5) - 0.5) * 0.18

  // Accumulated heritable morphology ; drives per-lineage structural divergence.
  // Falls back to neutral defaults for old saves without morphology data.
  const morph = creature.genome.morphology ?? { sizeScale: 1.0, limbLength: 0, spinalLength: 0, colorDrift: 0, eyeSize: 1.0 }

  // sizeScale from morphology multiplies the base size so evolved lineages
  // develop noticeably different proportions over 5-10 generations.
  const r = Math.max(3.2, ISO_TILE_WIDTH * 0.36 * ageFactor * morphSize * morph.sizeScale)

  // Generation factor ; unlocks and deepens visual features over lineage history.
  // Gen 0: minimal, Gen 3: intermediate, Gen 5+: fully expressed.
  // Works alongside morphology: genFactor gates the feature class, morphology
  // controls how far that feature has evolved within this specific lineage.
  const genFactor = Math.min(1.0, (creature.generation ?? 0) / 5)

  // Night dimming ; nocturnal traits stay bright
  const isNight = phase === 'night'
  const nocturnal = creature.genome.personality === 'Curious' || creature.genome.mind === 'Dreaming'
  let baseAlpha = isNight ? (nocturnal ? 0.92 : 0.55) : 1.0
  // Cave depth ; creatures inside caves appear dimmer and tinted
  if (isInCave) baseAlpha *= CAVE_CREATURE_ALPHA
  ctx.globalAlpha = baseAlpha

  // Glow for sentient creatures ; intensity grows with generation
  if (glow !== 'transparent' && creature.sentience > 15) {
    ctx.shadowColor = glow
    ctx.shadowBlur = r * (2.0 + genFactor * 0.8)
  }

  // Newborn halo ; pulsing yellow halo for age < 60 ticks
  if (creature.age < 60) {
    const newbornFade = 1 - creature.age / 60
    const pulse = 0.65 + Math.sin(Date.now() / 180) * 0.35
    ctx.save()
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
    const nbGrad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r + 6)
    nbGrad.addColorStop(0, `rgba(255, 255, 200, ${newbornFade * pulse * 0.6})`)
    nbGrad.addColorStop(1, 'rgba(255, 240, 100, 0)')
    ctx.fillStyle = nbGrad
    ctx.beginPath()
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(255, 230, 80, ${newbornFade * pulse * 0.9})`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // Selection ring ; cyan dashed
  if (selected) {
    ctx.save()
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = '#8af0ff'
    ctx.lineWidth = 1.3
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.arc(cx, cy, r + 3.8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  // ─── Body shape by genome.body ─────────────────────────────────────────────
  // Features are unlocked/enhanced by generation (genFactor) and age (ageRatio).
  // Early generations are simpler; evolved lineages display richer morphology.

  if (creature.genome.body === 'Shell') {
    // Shell thickness scales with age, generation, and accumulated spinal growth.
    const shellThick = Math.max(0.8, r * (0.18 + ageRatio * 0.10 + genFactor * 0.05 + morph.spinalLength * 0.08))
    ctx.beginPath()
    ctx.ellipse(cx, cy + r * 0.08, r * 1.25, r * 0.92, 0, 0, Math.PI * 2)
    ctx.fillStyle = bodyColor
    ctx.fill()
    // Lower rim shadow
    ctx.fillStyle = darken(bodyColor, 18)
    ctx.beginPath()
    ctx.ellipse(cx, cy + r * 0.22, r * 1.18, r * 0.4, 0, 0, Math.PI)
    ctx.fill()
    // Primary dorsal arc
    ctx.beginPath()
    ctx.arc(cx - r * 0.18, cy - r * 0.08, r * 0.62, Math.PI * 1.1, Math.PI * 1.88)
    ctx.strokeStyle = lighten(bodyColor, 32)
    ctx.lineWidth = shellThick
    ctx.stroke()
    // Second ridge ; adults, or lineages with developed spinal morphology
    if (ageRatio > 0.5 || genFactor > 0.4 || morph.spinalLength > 0.25) {
      ctx.beginPath()
      ctx.arc(cx - r * 0.08, cy - r * 0.02, r * 0.40, Math.PI * 1.15, Math.PI * 1.82)
      ctx.strokeStyle = lighten(bodyColor, 18)
      ctx.lineWidth = shellThick * 0.6
      ctx.stroke()
    }
    // Third ornamental ridge ; high-gen OR lineages with strong spinal elongation
    if (genFactor > 0.7 || morph.spinalLength > 0.55) {
      ctx.beginPath()
      ctx.arc(cx + r * 0.04, cy + r * 0.06, r * (0.25 + morph.spinalLength * 0.12), Math.PI * 1.2, Math.PI * 1.75)
      ctx.strokeStyle = lighten(bodyColor, 10)
      ctx.lineWidth = shellThick * 0.35
      ctx.stroke()
    }
    // Lateral lobes ; lineages with high limb morphology develop side flanges
    // like a trilobite acquiring lateral shields; visible once limbLength > 0.35
    if (morph.limbLength > 0.35) {
      const lobeAlpha = Math.round(((morph.limbLength - 0.35) / 0.65) * 180)
      const lobHex = lobeAlpha.toString(16).padStart(2, '0')
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(
          cx + side * r * 1.05,
          cy + r * 0.12,
          r * (0.18 + morph.limbLength * 0.22),
          r * (0.11 + morph.limbLength * 0.09),
          side * 0.35,
          0, Math.PI * 2,
        )
        ctx.fillStyle = darken(bodyColor, 14) + lobHex
        ctx.fill()
        ctx.strokeStyle = lighten(bodyColor, 8) + lobHex
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

  } else if (creature.genome.body === 'Spike') {
    ctx.beginPath()
    ctx.ellipse(cx, cy, r, r * 0.88, 0, 0, Math.PI * 2)
    ctx.fillStyle = bodyColor
    ctx.fill()
    // Dorsal spine ; grows with kills, generation, and accumulated spinal morphology.
    // High spinalLength lineages develop imposing crests even at low generation.
    const spineGrowth = 0.40 + ageRatio * 0.35 + Math.min(creature.killCount * 0.04, 0.30)
      + genFactor * 0.15 + morph.spinalLength * 0.30
    ctx.beginPath()
    ctx.moveTo(cx, cy - r - r * spineGrowth)
    ctx.lineTo(cx - r * 0.20, cy - r * 0.28)
    ctx.lineTo(cx + r * 0.20, cy - r * 0.28)
    ctx.closePath()
    ctx.fillStyle = darken(bodyColor, 20)
    ctx.fill()
    // Spine highlight
    ctx.strokeStyle = lighten(bodyColor, 22)
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(cx, cy - r - r * spineGrowth + 0.5)
    ctx.lineTo(cx, cy - r * 0.32)
    ctx.stroke()
    // Side nubs ; emerge with age/generation OR with high limb morphology.
    // High limbLength lineages grow proper articulated side protrusions.
    if (ageRatio > 0.5 || genFactor > 0.5 || morph.limbLength > 0.30) {
      for (const side of [-1, 1]) {
        const nubLen = r * (1.3 + ageRatio * 0.15 + genFactor * 0.08 + morph.limbLength * 0.28)
        ctx.beginPath()
        ctx.moveTo(cx + side * (r * 0.85), cy)
        ctx.lineTo(cx + side * nubLen, cy - r * 0.28)
        ctx.lineTo(cx + side * (nubLen - r * 0.12), cy + r * 0.20)
        ctx.closePath()
        ctx.fillStyle = darken(bodyColor, 14)
        ctx.fill()
        // Limb segmentation in high-limbLength lineages ; looks like developing legs
        if (morph.limbLength > 0.55) {
          ctx.strokeStyle = darken(bodyColor, 8)
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(cx + side * r * 1.05, cy - r * 0.1)
          ctx.lineTo(cx + side * (nubLen * 0.75), cy + r * 0.08)
          ctx.stroke()
        }
      }
    }
    // Rear barbs ; high-gen OR lineages with high spinal morphology
    if (genFactor > 0.65 || morph.spinalLength > 0.45) {
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(cx + side * r * 0.5, cy + r * 0.6)
        ctx.lineTo(cx + side * r * (0.9 + genFactor * 0.2 + morph.spinalLength * 0.25), cy + r * 0.2)
        ctx.strokeStyle = darken(bodyColor, 10)
        ctx.lineWidth = 0.9
        ctx.stroke()
      }
    }

  } else if (creature.genome.body === 'Wisp') {
    ctx.beginPath()
    ctx.ellipse(cx, cy - r * 0.15, r * 0.72, r * 1.18, 0, 0, Math.PI * 2)
    ctx.fillStyle = bodyColor
    ctx.fill()
    // Tail ; length grows with age, bonds, generation, and accumulated spinal morphology.
    // High spinalLength lineages trail long ghostly streamers even at early generations.
    const tailLen = 1.8 + ageRatio * 0.7 + Math.min(creature.bonds.length * 0.15, 0.5)
      + genFactor * 0.35 + morph.spinalLength * 0.45
    const tailWave = Math.sin(Date.now() / 380 + creature.id.charCodeAt(0)) * 0.25
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.28, cy + r * 1.0)
    ctx.bezierCurveTo(
      cx + tailWave * r - r * 0.75, cy + r * (1.4 + ageRatio * 0.2),
      cx + r * (0.55 + ageRatio * 0.1), cy + r * (1.7 + ageRatio * 0.2),
      cx + tailWave * r * 0.5 + r * 0.08, cy + r * tailLen,
    )
    ctx.strokeStyle = bodyColor + 'b0'
    ctx.lineWidth = Math.max(0.8, r * 0.35)
    ctx.lineCap = 'round'
    ctx.stroke()
    // Secondary fraying strand ; adults, mid-gen, or developed spinal lineages
    if (ageRatio > 0.6 || genFactor > 0.4 || morph.spinalLength > 0.30) {
      ctx.beginPath()
      ctx.moveTo(cx + r * 0.1, cy + r * 0.9)
      ctx.bezierCurveTo(
        cx + r * 0.6, cy + r * 1.5,
        cx + r * 0.3, cy + r * 2.0,
        cx + r * 0.5, cy + r * (tailLen * 0.8),
      )
      ctx.strokeStyle = bodyColor + '60'
      ctx.lineWidth = Math.max(0.5, r * 0.18)
      ctx.stroke()
    }
    // Trailing filaments ; high-gen OR high spinal morphology lineages
    if (genFactor > 0.6 || morph.spinalLength > 0.50) {
      const wave2 = Math.sin(Date.now() / 260 + creature.id.charCodeAt(1)) * 0.18
      ctx.beginPath()
      ctx.moveTo(cx - r * 0.1, cy + r * 0.8)
      ctx.bezierCurveTo(
        cx - r * 0.5 + wave2 * r, cy + r * 1.6,
        cx - r * 0.2, cy + r * 2.2,
        cx - r * 0.35, cy + r * (tailLen * 0.7),
      )
      ctx.strokeStyle = bodyColor + '40'
      ctx.lineWidth = Math.max(0.4, r * 0.12)
      ctx.stroke()
    }
    // Lateral fin-like appendages ; lineages with high limb morphology develop
    // diaphanous side fins like a deep-sea siphonophore; animate with the tail wave.
    if (morph.limbLength > 0.30) {
      const finAlpha = Math.round(((morph.limbLength - 0.30) / 0.70) * 160)
      const finHex = finAlpha.toString(16).padStart(2, '0')
      for (const side of [-1, 1]) {
        const finWave = Math.sin(Date.now() / 300 + creature.id.charCodeAt(0) + side) * 0.12
        ctx.beginPath()
        ctx.moveTo(cx + side * r * 0.55, cy - r * 0.2)
        ctx.bezierCurveTo(
          cx + side * r * (1.0 + morph.limbLength * 0.55 + finWave),
          cy - r * 0.4,
          cx + side * r * (1.1 + morph.limbLength * 0.40),
          cy + r * 0.35,
          cx + side * r * 0.60,
          cy + r * 0.55,
        )
        ctx.closePath()
        ctx.fillStyle = bodyColor + finHex
        ctx.fill()
      }
    }

  } else {
    // Spore ; asymmetric blob that develops pseudopods and lobes over generations.
    // limbLength drives the number and size of cellular extensions; spinalLength
    // drives a flagellum-like tail that longer-evolved lines develop.
    ctx.beginPath()
    ctx.ellipse(cx, cy, r * (1 + asym), r * (1 - asym), asym * 2, 0, Math.PI * 2)
    ctx.fillStyle = bodyColor
    ctx.fill()

    // Pseudopods / cellular lobes ; lineages with high limb morphology extend
    // multiple lobes, resembling an amoeba developing specialised protrusions.
    if (morph.limbLength > 0.20) {
      const lobCount = Math.min(5, Math.floor(1 + morph.limbLength * 4))
      for (let i = 0; i < lobCount; i++) {
        const ang = creature.genome.morphSeed * 6.28 + i * (6.28 / lobCount)
        const dist = r * (0.72 + morph.limbLength * 0.45)
        const lobR = r * (0.22 + morph.limbLength * 0.18)
        ctx.beginPath()
        ctx.ellipse(
          cx + Math.cos(ang) * dist,
          cy + Math.sin(ang) * dist,
          lobR, lobR * 0.80,
          ang, 0, Math.PI * 2,
        )
        ctx.fillStyle = bodyColor + 'b0'
        ctx.fill()
      }
    }

    // Flagellum ; high spinal morphology Spores develop a trailing whip; unique
    // visual signature that distinguishes fast-dividing evolved strains.
    if (morph.spinalLength > 0.35) {
      const flagLen = r * (1.2 + morph.spinalLength * 1.6)
      const flagWave = Math.sin(Date.now() / 220 + creature.id.charCodeAt(0)) * 0.30
      ctx.beginPath()
      ctx.moveTo(cx + asym * r, cy + r * 0.8)
      ctx.bezierCurveTo(
        cx + flagWave * r, cy + r * (1.2 + morph.spinalLength * 0.4),
        cx - flagWave * r * 0.5, cy + r * (1.6 + morph.spinalLength * 0.5),
        cx + flagWave * r * 0.3, cy + flagLen,
      )
      ctx.strokeStyle = bodyColor + '90'
      ctx.lineWidth = Math.max(0.5, r * 0.14)
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    // Lineage speckles ; more speckles in evolved lineages
    const speckleCount = Math.floor((creature.genome.morphSeed ?? 0) * 4
      * Math.min(1, ageRatio * 2)
      * (1 + genFactor))
    if (speckleCount > 0) {
      ctx.fillStyle = darken(bodyColor, 30)
      for (let i = 0; i < Math.min(speckleCount, 7); i++) {
        const ang = (creature.genome.morphSeed * 6.28 + i * 2.1)
        ctx.beginPath()
        ctx.arc(
          cx + Math.cos(ang) * r * 0.45,
          cy + Math.sin(ang) * r * 0.45,
          Math.max(0.7, r * 0.18), 0, Math.PI * 2,
        )
        ctx.fill()
      }
    }

    // Specular highlight
    ctx.beginPath()
    ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.36, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.20)'
    ctx.fill()

    // Budding site ; Spores that have produced offspring show a faint division
    // scar; in high-limbLength lineages the scar becomes a ring of lobes.
    if (genFactor > 0.3 && creature.offspringIds.length > 0) {
      const budAng = creature.genome.morphSeed * Math.PI * 2
      ctx.strokeStyle = lighten(bodyColor, 14) + '60'
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.arc(cx + Math.cos(budAng) * r * 0.68, cy + Math.sin(budAng) * r * 0.68, r * 0.22, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // ── Biome environmental tint ───────────────────────────────────────────────
  // Overlay that represents long-term environmental exposure on the body surface
  const tint = BIOME_TINT[creature.dominantBiome ?? 'temperate']
  if (tint && tint[3] > 0) {
    ctx.fillStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${tint[3]})`
    ctx.beginPath()
    ctx.ellipse(cx, cy, r * 1.1, r * 1.1, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── Environmental adaptation overlays ─────────────────────────────────────
  drawAdaptationOverlays(ctx, creature, cx, cy, r, weather)

  // ── Stress stress marks ; visible wear at high stress ─────────────────────
  // Jagged micro-cracks across the body surface indicate chronic stress
  if (creature.stress > 65 && creature.age > 20) {
    const stressIntensity = (creature.stress - 65) / 35   // 0..1
    ctx.strokeStyle = `rgba(80, 40, 40, ${stressIntensity * 0.25})`
    ctx.lineWidth = 0.5
    const morphOff = (creature.genome.morphSeed ?? 0.5) * Math.PI
    for (let i = 0; i < 3; i++) {
      const ang = morphOff + i * 2.09
      const rx = cx + Math.cos(ang) * r * 0.35
      const ry = cy + Math.sin(ang) * r * 0.35
      ctx.beginPath()
      ctx.moveTo(rx - r * 0.18, ry)
      ctx.lineTo(rx + r * 0.08, ry + r * 0.14)
      ctx.lineTo(rx + r * 0.22, ry - r * 0.08)
      ctx.stroke()
    }
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'

  // ── Eyes by genome.mind ────────────────────────────────────────────────────
  if (creature.genome.mind !== 'Feral') {
    // Rocky/cave-biome creatures develop slightly larger eyes (low-light adapted).
    // cave_sighted adaptation gives a heritable eye enlargement on top of biome and morphology.
    const caveSightedBoost = creature.genome.adaptations?.includes('cave_sighted') ? 1.40 : 1.0
    const eyeEnlarge = (creature.dominantBiome === 'rocky' ? 1.25 : 1.0) * (morph.eyeSize ?? 1.0) * caveSightedBoost
    const eyeR = Math.max(0.6, r * 0.20 * eyeEnlarge)
    const eyeOff = r * 0.30

    // Eye position shifts upward slightly in evolved lineages (cranial development)
    const eyeY = cy - r * (0.24 + genFactor * 0.04)

    // cave_sighted adaptation gives eyes a pale teal tint — tapetum-like low-light sheen.
    const hasCaveSighted = creature.genome.adaptations?.includes('cave_sighted') ?? false
    const eyeColor = creature.genome.mind === 'Sentinel' ? '#ff7038'
      : creature.genome.mind === 'Dreaming' ? '#a098ff'
      : hasCaveSighted ? '#80dcc0'
      : '#f4eecc'

    ctx.fillStyle = eyeColor
    ctx.beginPath()
    ctx.arc(cx - eyeOff, eyeY, eyeR, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + eyeOff, eyeY, eyeR, 0, Math.PI * 2)
    ctx.fill()

    if (creature.genome.mind === 'Sentinel') {
      ctx.fillStyle = '#ff2010'
      ctx.beginPath()
      ctx.arc(cx - eyeOff, eyeY, eyeR * 0.42, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeOff, eyeY, eyeR * 0.42, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ── Thought symbol ────────────────────────────────────────────────────────
  // Drawn first so it sits closest to the body; the speech bubble floats
  // above it without covering the state indicator.
  if (creature.currentThought && creature.thoughtTimer > 5 && creature.currentThought !== 'content') {
    drawThoughtSymbol(ctx, creature.currentThought, cx, cy - r - 4)
  }

  // ── Speech bubble ; overhead emoji dialogue ───────────────────────────────
  // Centered at cy−r−30 so the pill and its tail clear the thought symbol
  // (~6 px gap at default zoom). Fixed offset regardless of whether a thought
  // is visible to avoid vertical jump when the thought state clears.
  // Fades out over 3.5s. Drawn last so it renders on top of all body layers.
  if (creature.currentSpeech && creature.currentSpeech.sentence.length > 0) {
    const elapsed = Date.now() - creature.currentSpeech.tick
    const fadeWindow = 3500
    if (elapsed < fadeWindow) {
      const fade = Math.max(0, 1 - elapsed / fadeWindow)
      drawSpeechBubble(ctx, creature.currentSpeech.sentence, cx, cy - r - 30, fade)
    }
  }

  // ── Mutation spark ; newly born mutated creatures emit a colored pulse ────
  const mutationAge = creature.recentMutation !== undefined ? currentDay - creature.recentMutation : -1
  if (mutationAge >= 0 && mutationAge < MUTATION_DISPLAY_DAYS) {
    const fade = 1 - mutationAge / MUTATION_DISPLAY_DAYS
    const pulse = 0.6 + Math.sin(Date.now() / 90) * 0.4
    ctx.save()
    ctx.shadowBlur = 0
    ctx.globalAlpha = fade * pulse * 0.85
    ctx.strokeStyle = '#ffee44'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 2])
    const sparkR = r + 5 + Math.sin(Date.now() / 130) * 2
    ctx.beginPath()
    ctx.arc(cx, cy, sparkR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = fade * 0.7
    ctx.strokeStyle = '#ff9900'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(cx, cy, sparkR + 3, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // ── Cave depth overlay ; tint creature blue-black when inside cave ────────
  if (isInCave) {
    ctx.globalAlpha = 0.30
    ctx.fillStyle = 'rgba(10, 8, 28, 0.65)'
    ctx.beginPath()
    ctx.ellipse(cx, cy, r * 1.15, r * 1.15, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = baseAlpha
  }

  // Carried item indicator — small icon above the creature's head for every carry type
  if (creature.carrying) {
    const itemY = cy - r * 1.8
    ctx.save()
    ctx.globalAlpha = 0.90
    switch (creature.carrying) {
      case 'wood':
        ctx.fillStyle = '#8c5c2a'
        ctx.beginPath()
        ctx.ellipse(cx, itemY, r * 0.42, r * 0.22, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#5c3412'
        ctx.lineWidth = 0.8
        ctx.stroke()
        break
      case 'stone':
        ctx.fillStyle = '#7a7870'
        ctx.beginPath()
        ctx.arc(cx, itemY, r * 0.30, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#504e48'
        ctx.lineWidth = 0.8
        ctx.stroke()
        break
      case 'healroot': {
        // Green herb circle with medicinal cross
        ctx.fillStyle = '#4caa60'
        ctx.beginPath()
        ctx.arc(cx, itemY, r * 0.28, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#2a7040'
        ctx.lineWidth = 0.7
        ctx.stroke()
        ctx.strokeStyle = '#d8ffd0'
        ctx.lineWidth = 0.9
        ctx.beginPath()
        ctx.moveTo(cx - r * 0.14, itemY)
        ctx.lineTo(cx + r * 0.14, itemY)
        ctx.moveTo(cx, itemY - r * 0.14)
        ctx.lineTo(cx, itemY + r * 0.14)
        ctx.stroke()
        break
      }
      case 'fruit': {
        // Red-orange berry with specular highlight
        ctx.fillStyle = '#d84040'
        ctx.beginPath()
        ctx.arc(cx, itemY, r * 0.26, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#941818'
        ctx.lineWidth = 0.7
        ctx.stroke()
        ctx.fillStyle = 'rgba(255, 180, 160, 0.38)'
        ctx.beginPath()
        ctx.arc(cx - r * 0.08, itemY - r * 0.08, r * 0.10, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'pebble':
        ctx.fillStyle = '#686660'
        ctx.beginPath()
        ctx.arc(cx, itemY, r * 0.20, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#3e3c38'
        ctx.lineWidth = 0.6
        ctx.stroke()
        break
    }
    ctx.restore()
  }

  // Building state: animated dust ring
  if (creature.state === 'building') {
    const t2 = (Date.now() / 300 + creature.id.charCodeAt(0)) % (Math.PI * 2)
    ctx.save()
    ctx.globalAlpha = 0.40 + Math.sin(t2) * 0.20
    ctx.strokeStyle = '#c8a060'
    ctx.lineWidth = 1.2
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.ellipse(cx, cy + r * 0.4, r * 1.4, r * 0.55, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  ctx.restore()
}

// ─── Environmental adaptation overlays ───────────────────────────────────────
// Drawn after biome tint, before stress marks. Each visual is subtle at low r
// and scales naturally with zoom. Multiple adaptations stack.

function drawAdaptationOverlays(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  cx: number,
  cy: number,
  r: number,
  weather?: WeatherState,
): void {
  const adaptations = creature.genome.adaptations
  if (!adaptations || adaptations.length === 0) return
  const now = Date.now()
  const seed = creature.id.charCodeAt(0)

  ctx.save()
  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'

  if (adaptations.includes('cold_hardy')) {
    // Frost shimmer ring: pale blue-white pulsing halo
    const shimmer = 0.10 + Math.sin(now / 700 + seed) * 0.04
    ctx.strokeStyle = `rgba(160, 215, 255, ${shimmer})`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(cx, cy, r + 2.5, 0, Math.PI * 2)
    ctx.stroke()
    // Orbiting ice-crystal dots
    for (let i = 0; i < 5; i++) {
      const ang = now / 3500 + i * 1.257 + seed
      const dotAlpha = 0.35 + Math.sin(now / 900 + i) * 0.15
      ctx.fillStyle = `rgba(220, 242, 255, ${dotAlpha})`
      ctx.beginPath()
      ctx.arc(cx + Math.cos(ang) * (r + 3.5), cy + Math.sin(ang) * (r + 3.5), Math.max(0.8, r * 0.08), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (adaptations.includes('thick_pelt')) {
    // Dense woolly coat: warm amber body glow + ring of close-packed bristle dots.
    // Stacks with cold_hardy (ice dots at r+3.5 stay visible outside the fur ring at r+1.5).
    const peltAlpha = 0.13 + Math.sin(now / 1400 + seed) * 0.04
    ctx.fillStyle = `rgba(170, 90, 35, ${peltAlpha})`
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 12; i++) {
      const ang = i * (Math.PI * 2 / 12) + seed * 0.08
      const bAlpha = 0.20 + Math.sin(now / 900 + i * 0.8) * 0.07
      ctx.fillStyle = `rgba(155, 70, 22, ${bAlpha})`
      ctx.beginPath()
      ctx.arc(
        cx + Math.cos(ang) * (r + 1.5),
        cy + Math.sin(ang) * (r + 1.5),
        Math.max(0.6, r * 0.085), 0, Math.PI * 2,
      )
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(195, 130, 60, 0.16)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(cx, cy, r + 2.8, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (adaptations.includes('drought_tough')) {
    // Amber chitin plate lines radiating from centre
    ctx.strokeStyle = 'rgba(210, 138, 32, 0.30)'
    ctx.lineWidth = Math.max(0.6, r * 0.06)
    const morphOff = creature.genome.morphSeed * 6.28
    for (let i = 0; i < 4; i++) {
      const ang = morphOff + i * 1.571
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(ang) * r * 0.28, cy + Math.sin(ang) * r * 0.28)
      ctx.lineTo(cx + Math.cos(ang) * r * 0.82, cy + Math.sin(ang) * r * 0.82)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(195, 110, 18, 0.055)'
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  if (adaptations.includes('cave_sighted')) {
    // Bioluminescent inner ring; slow pulse
    const bioAlpha = 0.09 + Math.sin(now / 1400 + seed) * 0.04
    ctx.strokeStyle = `rgba(160, 255, 180, ${bioAlpha})`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2)
    ctx.stroke()
    // Faint green glow fill
    ctx.fillStyle = `rgba(120, 220, 150, ${bioAlpha * 0.5})`
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2)
    ctx.fill()
  }

  if (adaptations.includes('hydro_fins')) {
    // Wet sheen: rippling blue highlight ellipse + fine outer ring
    const ripple = Math.sin(now / 850 + seed) * 0.025
    ctx.fillStyle = `rgba(38, 118, 200, ${0.06 + ripple})`
    ctx.beginPath()
    ctx.ellipse(cx, cy, r * 1.04, r * 0.94, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(80, 165, 245, 0.16)`
    ctx.lineWidth = 1.0
    ctx.beginPath()
    ctx.arc(cx, cy, r + 1.8, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (adaptations.includes('heat_plated')) {
    // Gold chitin horizontal stripes across body (3 bands)
    ctx.strokeStyle = 'rgba(218, 162, 28, 0.26)'
    ctx.lineWidth = Math.max(0.5, r * 0.055)
    for (let i = 0; i < 3; i++) {
      const yOff = cy + r * (-0.38 + i * 0.38)
      const t = -0.38 + i * 0.38
      const halfW = r * Math.sqrt(Math.max(0, 1 - t * t)) * 0.68
      ctx.beginPath()
      ctx.moveTo(cx - halfW, yOff)
      ctx.lineTo(cx + halfW, yOff)
      ctx.stroke()
    }
    // Faint gold fill
    ctx.fillStyle = 'rgba(240, 175, 10, 0.048)'
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    // Heatwave active: shimmering gold aura marks the resistance in action
    if (weather === 'heatwave') {
      const heatAlpha = 0.13 + Math.sin(now / 350 + seed) * 0.07
      ctx.strokeStyle = `rgba(255, 190, 20, ${heatAlpha})`
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.arc(cx, cy, r + 3.5, 0, Math.PI * 2)
      ctx.stroke()
      const innerAlpha = 0.055 + Math.sin(now / 220 + seed + 1) * 0.025
      ctx.fillStyle = `rgba(255, 160, 10, ${innerAlpha})`
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (adaptations.includes('storm_braced')) {
    // Metallic border + electric arc dots; both intensify when a storm is active.
    const inStorm = weather === 'storm'
    ctx.strokeStyle = inStorm ? 'rgba(80, 115, 190, 0.42)' : 'rgba(55, 75, 120, 0.28)'
    ctx.lineWidth = Math.max(1.2, r * 0.14)
    ctx.beginPath()
    ctx.arc(cx, cy, r + 0.6, 0, Math.PI * 2)
    ctx.stroke()
    // Crackling arc dots: 3 at rest, 6 during a live storm, cycling much faster
    const dotCount  = inStorm ? 6 : 3
    const dotSpread = inStorm ? 1.047 : 2.094
    const crackSpeed = inStorm ? 300 : 1800
    const crackAlpha = (inStorm ? 0.36 : 0.22) + Math.sin(now / 220 + seed) * 0.14
    const dotColor   = inStorm ? `rgba(165, 215, 255, ${crackAlpha})` : `rgba(130, 175, 255, ${crackAlpha})`
    for (let i = 0; i < dotCount; i++) {
      const ang = creature.genome.morphSeed * 6.28 + i * dotSpread + now / crackSpeed
      ctx.fillStyle = dotColor
      ctx.beginPath()
      ctx.arc(
        cx + Math.cos(ang) * r * 0.82,
        cy + Math.sin(ang) * r * 0.82,
        Math.max(0.9, r * (inStorm ? 0.12 : 0.10)), 0, Math.PI * 2,
      )
      ctx.fill()
    }
  }

  ctx.restore()
}

// ─── Thought symbol ───────────────────────────────────────────────────────────

const THOUGHT_SYMBOLS: Record<string, string> = {
  hungry: '!', thirsty: '~', cold: '*', stressed: '?',
  content: '·', fighting: '×', bonding: '♥', curious: '→',
  mourning: '…', watching: '◉', dreaming: '∿', sick: '+',
  playing: '♪', mutated: '⚡', grooming: '♡', carrying: '↑',
}

const THOUGHT_COLORS: Record<string, string> = {
  hungry: '#ffb050', thirsty: '#80c8ff', cold: '#b0d8ff', stressed: '#ff7080',
  content: '#cdc4a8', fighting: '#ff5060', bonding: '#ff9aff', curious: '#80f0a0',
  mourning: '#7878a0', watching: '#ff8048', dreaming: '#c878f0', sick: '#ff5060',
  playing: '#80f0e0', mutated: '#ffee44', grooming: '#ffbbff', carrying: '#88ddaa',
}

function drawThoughtSymbol(
  ctx: CanvasRenderingContext2D,
  thought: string,
  cx: number,
  cy: number
): void {
  const symbol = THOUGHT_SYMBOLS[thought] ?? '·'
  const fontSize = Math.max(9, Math.round(ISO_TILE_WIDTH * 0.55))
  ctx.font = `bold ${fontSize}px monospace`
  ctx.fillStyle = THOUGHT_COLORS[thought] ?? '#cdc4a8'
  ctx.textAlign = 'center'
  ctx.fillText(symbol, cx, cy)
}

// ─── Speech bubble / thought symbol layout — design decisions ─────────────────
//
// Q1. Which layer is rendered on top when both speech bubble and thought symbol
//     are active simultaneously?
//   a) Speech bubble    b) Thought symbol    c) Last one drawn wins
//   → (a/c) Speech bubble. It is drawn last in drawCreature, so it paints over
//     any overlap. The position fix (~6 px gap) ensures they don't visually clash.
//
// Q2. Does the speech bubble Y position change depending on whether a thought
//     symbol is currently visible?
//   a) Yes — snaps down when no thought is showing
//   b) No — fixed offset of cy−r−30 at all times
//   → (b) Fixed. Removing the conditional keeps the bubble stable and avoids a
//     jarring vertical jump when the thought state clears mid-display.
//
// Q3. Which element persists longer when both appear at the same time?
//   a) Speech bubble (hard 3.5 s fade)
//   b) Thought symbol (driven by thoughtTimer, no fixed cap)
//   → (b) Thought symbol. It stays visible as long as thoughtTimer > 5 ticks.
//     The bubble is time-limited; the thought can outlive it by many ticks.
//
// Q4. What is the minimum vertical gap between the speech bubble tail and the
//     top edge of the thought symbol at default zoom (ISO_TILE_WIDTH = 18)?
//   a) 0 px (they touch)    b) ~6 px    c) 20 px+
//   → (b) ~6 px. Thought symbol top ≈ cy−r−14; bubble tail bottom ≈ cy−r−20.
//     The gap scales naturally with zoom since all offsets are pixel-space.
//
// Q5. What happens to both elements at very small zoom levels?
//   a) They collapse into each other unreadably
//   b) Font size floors keep both legible (thought: 9 px min, bubble: 7 px min)
//   c) They are hidden below a zoom threshold
//   → (b) Both drawThoughtSymbol and drawSpeechBubble use Math.max() font floors
//     so glyphs never shrink below their minimums regardless of canvas zoom.
//
// ─── Speech bubble ─────────────────────────────────────────────────────────────
// Renders a small pill-shaped bubble with 1-3 emoji as a sentence.
// Fades out over 3.5s. cy parameter is the vertical center of the pill.

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  sentence: string[],
  cx: number,
  cy: number,
  alpha: number
): void {
  if (sentence.length === 0 || alpha <= 0) return

  ctx.save()
  ctx.globalAlpha = alpha

  const fontSize = Math.max(7, Math.round(ISO_TILE_WIDTH * 0.32))
  ctx.font = `${fontSize}px serif`  // serif renders emoji more reliably
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Measure total width
  const gap = 1
  const charWidths = sentence.map(e => ctx.measureText(e).width)
  const totalW = charWidths.reduce((a, b) => a + b, 0) + gap * (sentence.length - 1)
  const padX = 3
  const padY = 2
  const bubbleW = totalW + padX * 2
  const bubbleH = fontSize + padY * 2

  const bx = cx - bubbleW / 2
  const by = cy - bubbleH / 2

  // Bubble background
  ctx.fillStyle = 'rgba(12, 10, 24, 0.82)'
  ctx.strokeStyle = 'rgba(180, 160, 100, 0.55)'
  ctx.lineWidth = 0.8
  const r = 4
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.lineTo(bx + bubbleW - r, by)
  ctx.quadraticCurveTo(bx + bubbleW, by, bx + bubbleW, by + r)
  ctx.lineTo(bx + bubbleW, by + bubbleH - r)
  ctx.quadraticCurveTo(bx + bubbleW, by + bubbleH, bx + bubbleW - r, by + bubbleH)
  ctx.lineTo(bx + r, by + bubbleH)
  ctx.quadraticCurveTo(bx, by + bubbleH, bx, by + bubbleH - r)
  ctx.lineTo(bx, by + r)
  ctx.quadraticCurveTo(bx, by, bx + r, by)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Small tail pointing downward toward creature
  ctx.beginPath()
  ctx.moveTo(cx - 3, by + bubbleH)
  ctx.lineTo(cx, by + bubbleH + 4)
  ctx.lineTo(cx + 3, by + bubbleH)
  ctx.closePath()
  ctx.fillStyle = 'rgba(12, 10, 24, 0.82)'
  ctx.fill()

  // Emoji text
  let drawX = cx - totalW / 2
  for (let i = 0; i < sentence.length; i++) {
    ctx.fillText(sentence[i], drawX + charWidths[i] / 2, cy)
    drawX += charWidths[i] + gap
  }

  ctx.restore()
}