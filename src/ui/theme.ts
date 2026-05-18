// ─── Bioluminescent Specimen Cabinet — Design System v2 ──────────────────────
//
// A premium "field laboratory" aesthetic: near-black surfaces with subtle
// gradient depth, warm-white text, an amber bioluminescent accent, and
// semantic colors that glow rather than just tint.
//
// The system exposes tokens for:
//   colors       — surfaces, text, semantic states, body/season/weather/biome
//   spacing      — 4px base scale (xs..3xl) for consistent rhythm
//   radius       — corner radii from sharp to soft
//   shadow       — depth tiers (deep panel shadow → subtle pop)
//   glow         — bioluminescent ring shadows keyed to accent colors
//   motion       — easing curves and duration constants
//   typography   — size scale (xs..xxl) plus weight tokens
//
// All UI styled-components draw from THIS file. Anywhere a literal hex,
// radius, or ms value appears in a component, replace it with a token.

export const THEME = {
  // ── Surfaces — layered for subtle depth ──
  bg:         '#0e0e10',          // page root, deepest
  bgDeep:     '#0a0a0c',          // input wells, scrollbar tracks
  bgPanel:    '#1a1a1d',          // panel base
  bgPanelTop: '#22222a',          // panel top stop for subtle gradient
  bgCanvas:   '#0a0a0c',          // canvas under-color
  bgHover:    'rgba(255,255,255,0.03)',
  bgActive:   'rgba(255,255,255,0.05)',
  bgChip:     'rgba(255,255,255,0.04)',

  // ── Borders ──
  border:     '#26262d',
  borderMid:  '#34343d',
  borderHi:   '#46464f',
  borderGlow: 'rgba(232,200,74,0.35)', // amber-tinted focus ring

  // ── Text ──
  textPrimary:   '#f3f0e8',
  textSecondary: '#9a9a9f',
  textTertiary:  '#5a5a60',
  textLabel:     '#6a6a70',
  textInverse:   '#0e0e10',

  // ── Accent (amber-gold; the bioluminescent signature) ──
  amber:       '#e8c84a',
  amberSoft:   '#f0d875',
  amberDeep:   '#c8a83a',
  amberDim:    'rgba(232,200,74,0.12)',
  amberGlow:   'rgba(232,200,74,0.32)',
  amberRing:   'rgba(232,200,74,0.55)',
  amberBorder: 'rgba(232,200,74,0.40)',

  // ── Semantic state colors ──
  alive:       '#7ad07a',
  aliveDim:    'rgba(122,208,122,0.14)',
  aliveGlow:   'rgba(122,208,122,0.30)',

  water:       '#6cbcf8',
  waterDim:    'rgba(108,188,248,0.12)',
  waterGlow:   'rgba(108,188,248,0.30)',

  threat:      '#ff8a5c',
  threatDim:   'rgba(255,138,92,0.12)',
  threatGlow:  'rgba(255,138,92,0.30)',

  death:       '#d96060',
  deathDim:    'rgba(217,96,96,0.12)',
  deathGlow:   'rgba(217,96,96,0.30)',

  // ── Stage tier colors (Awareness 1-5) ──
  stage1:      '#7ad07a',
  stage2:      '#6cbcf8',
  stage3:      '#ce86f5',
  stage4:      '#f4a64a',
  stage5:      '#d8ecff',

  // ── Body morphotypes ──
  spore:       '#7ad07a',
  shell:       '#6cbcf8',
  spike:       '#ff8a5c',
  wisp:        '#e8c84a',

  // ── Seasons ──
  spring:      '#7ad07a',
  summer:      '#e8c84a',
  autumn:      '#ff8a5c',
  winter:      '#aac8f0',

  // ── Weather (extended for new states) ──
  weatherClear:     '#e8c84a',
  weatherRain:      '#6cbcf8',
  weatherStorm:     '#aac8f0',
  weatherSnow:      '#d8ecff',
  weatherDrought:   '#ff8a5c',
  weatherHeatwave:  '#ff6a48',
  weatherFog:       '#9aa0aa',
  weatherWindstorm: '#c5b896',
  weatherBloom:     '#f5b8d8',
  weatherAshfall:   '#88827a',

  // ── Biomes ──
  biomeTemperate: '#9ac896',
  biomeArid:      '#d8b878',
  biomeLush:      '#5fb87a',
  biomeRocky:     '#a0a4a8',
  biomeWetland:   '#78a8c8',

  // ── Font stack — Space Grotesk variable weights ──
  font:     `'Space Grotesk', 'Outfit', system-ui, sans-serif`,
  fontMono: `'Space Grotesk', 'Outfit', system-ui, sans-serif`,

  // ── Type scale (px) ──
  type: {
    xs:    9,
    sm:    10,
    base:  11,
    md:    12,
    lg:    13,
    xl:    15,
    xxl:   18,
    title: 22,
    hero:  32,
  },

  // ── Spacing scale (px, 4px base) ──
  space: {
    xxs: 2,
    xs:  4,
    sm:  6,
    md:  8,
    lg:  12,
    xl:  16,
    xxl: 22,
    xxxl:32,
  },

  // ── Border radius scale ──
  radius: {
    xs:   3,
    sm:   5,
    md:   7,
    lg:   10,
    xl:   14,
    pill: 999,
  },

  // ── Shadow / depth tokens ──
  shadow: {
    panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 18px rgba(0,0,0,0.45)',
    pop:   '0 6px 26px rgba(0,0,0,0.55)',
    soft:  '0 2px 8px rgba(0,0,0,0.35)',
    inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  },

  // ── Glow rings (bioluminescent accent halos) ──
  glow: {
    amber:  '0 0 0 1px rgba(232,200,74,0.45), 0 0 18px rgba(232,200,74,0.22)',
    alive:  '0 0 0 1px rgba(122,208,122,0.45), 0 0 18px rgba(122,208,122,0.22)',
    water:  '0 0 0 1px rgba(108,188,248,0.45), 0 0 18px rgba(108,188,248,0.22)',
    death:  '0 0 0 1px rgba(217,96,96,0.45), 0 0 18px rgba(217,96,96,0.22)',
    threat: '0 0 0 1px rgba(255,138,92,0.45), 0 0 18px rgba(255,138,92,0.22)',
    soft:   '0 0 0 1px rgba(255,255,255,0.06), 0 0 14px rgba(255,255,255,0.04)',
  },

  // ── Motion (timing + easing) ──
  motion: {
    fast:    '0.12s',
    base:    '0.18s',
    slow:    '0.32s',
    slower:  '0.5s',
    easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },

  // ── Panel gradient helpers — subtle warmth at top, depth at bottom ──
  panelGradient:    'linear-gradient(180deg, #22222a 0%, #1a1a1d 70%, #16161a 100%)',
  panelGradientHi:  'linear-gradient(180deg, #2a2a32 0%, #1d1d22 100%)',
  surfaceGradient:  'linear-gradient(180deg, #14141a 0%, #0e0e10 100%)',

  // ── Specialty: bioluminescent surface (for amber-tinted highlight panels)
  amberSurface:     'linear-gradient(180deg, rgba(232,200,74,0.10) 0%, rgba(232,200,74,0.04) 100%)',
} as const

// ─── Creature/stage helpers (kept as functions for callers) ───────────────────

export function creatureColor(body: string): string {
  const map: Record<string, string> = {
    Spore: THEME.spore,
    Shell: THEME.shell,
    Spike: THEME.spike,
    Wisp:  THEME.wisp,
  }
  return map[body] ?? THEME.textSecondary
}

export function stageColor(stage: string): string {
  const map: Record<string, string> = {
    genesis:     '#9aa0aa',
    nascent:     '#6cbcf8',
    growing:     '#7ad07a',
    established: '#aac8f0',
    thriving:    '#e8c84a',
    ascendant:   '#ce86f5',
  }
  return map[stage] ?? '#9aa0aa'
}

export function awarenessColor(level: number): string {
  if (level >= 5) return THEME.stage5
  if (level >= 4) return THEME.stage4
  if (level >= 3) return THEME.stage3
  if (level >= 2) return THEME.stage2
  return THEME.stage1
}

export function weatherColor(weather: string): string {
  const map: Record<string, string> = {
    clear: THEME.weatherClear,
    rain: THEME.weatherRain,
    storm: THEME.weatherStorm,
    snow: THEME.weatherSnow,
    drought: THEME.weatherDrought,
    heatwave: THEME.weatherHeatwave,
    fog: THEME.weatherFog,
    windstorm: THEME.weatherWindstorm,
    bloom: THEME.weatherBloom,
    ashfall: THEME.weatherAshfall,
  }
  return map[weather] ?? THEME.amber
}
