// ─── Field Guide Design System ────────────────────────────────────────────────
// High-Contrast Field Guide; works across all brightness conditions.
// Core palette: near-black surface, warm-white text, amber accent,
// semantic colors for each ecological state.
// Typography: Space Grotesk only, no monospace anywhere.

export const THEME = {
  // ── Surfaces ──
  bg:        '#1c1c1c',
  bgDeep:    '#141414',
  bgPanel:   '#1c1c1c',
  bgCanvas:  '#141414',
  border:    '#2a2a2a',
  borderMid: '#333333',

  // ── Text ──
  textPrimary:   '#f0ede8',
  textSecondary: '#888888',
  textTertiary:  '#444444',
  textLabel:     '#555555',  // uppercase labels

  // ── Accent (amber-gold; active tool, CTAs, key values) ──
  amber:      '#e8c84a',
  amberDim:   'rgba(232,200,74,0.12)',
  amberBorder:'rgba(232,200,74,0.3)',

  // ── Semantic status colors ──
  alive:      '#78c878',   // health / alive / positive
  aliveDim:   'rgba(120,200,120,0.12)',
  water:      '#64b5f6',   // thirst / water / info
  waterDim:   'rgba(100,181,246,0.10)',
  threat:     '#ff8050',   // dying / warmth critical / fire
  threatDim:  'rgba(255,128,80,0.10)',
  death:      '#c85050',   // deaths / danger
  deathDim:   'rgba(200,80,80,0.10)',

  // ── Creature type tints ──
  spore: '#78c878',
  shell: '#64b5f6',
  spike: '#ff8050',
  wisp:  '#e8c84a',

  // ── Season colors ──
  spring: '#78c878',
  summer: '#e8c84a',
  autumn: '#ff8050',
  winter: '#a0c8f0',

  // ── Weather colors ──
  weatherClear:   '#e8c84a',
  weatherRain:    '#64b5f6',
  weatherStorm:   '#a0c8f0',
  weatherSnow:    '#d0eeff',
  weatherDrought: '#ff8050',

  // ── Font stack ──
  font: `'Space Grotesk', 'Outfit', system-ui, sans-serif`,
} as const

// Creature type → tint color
export function creatureColor(body: string): string {
  const map: Record<string, string> = {
    Spore: THEME.spore,
    Shell: THEME.shell,
    Spike: THEME.spike,
    Wisp:  THEME.wisp,
  }
  return map[body] ?? THEME.textSecondary
}

// Colony stage → accent color
export function stageColor(stage: string): string {
  const map: Record<string, string> = {
    genesis:     '#888888',
    nascent:     '#64b5f6',
    growing:     '#78c878',
    established: '#a0c8f0',
    thriving:    '#e8c84a',
    ascendant:   '#c878f0',
  }
  return map[stage] ?? '#888888'
}
