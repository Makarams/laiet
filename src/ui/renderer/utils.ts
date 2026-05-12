// ─── Color helpers — clamped to prevent invalid hex ──────────────────────────

export function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = clamp8(((num >> 16) & 0xff) + amount)
  const g = clamp8(((num >> 8) & 0xff) + amount)
  const b = clamp8((num & 0xff) + amount)
  return `#${pad2(r)}${pad2(g)}${pad2(b)}`
}

export function darken(hex: string, amount: number): string {
  return lighten(hex, -amount)
}

export function adjustBrightness(hex: string, factor: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = clamp8(Math.round(((num >> 16) & 0xff) * factor))
  const g = clamp8(Math.round(((num >> 8) & 0xff) * factor))
  const b = clamp8(Math.round((num & 0xff) * factor))
  return `#${pad2(r)}${pad2(g)}${pad2(b)}`
}

export function clamp8(n: number): number {
  return Math.max(0, Math.min(255, n))
}

export function pad2(n: number): string {
  return n.toString(16).padStart(2, '0')
}
