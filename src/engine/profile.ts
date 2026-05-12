import { CaretakerProfile, SimModifiers } from '@/types'

export const DEFAULT_MODIFIERS: SimModifiers = {
  foodRegrowMult:              1.0,
  droughtDurationMult:         1.0,
  bondSpeedMult:               1.0,
  mutationChance:              0.15,
  sentienceGrowthMult:         1.0,
  awarenessMessageMult:        1.0,
  healCharges:                 3,
  foodDropCooldownMs:          5_000,
  ascensionThresholdOffset:    0,
}

// Derive SimModifiers from the player's CaretakerProfile answers.
// Modifiers compound multiplicatively where applicable. Each answer layer
// is applied in order: presence → world → evolution → focus → expectation.
export function computeSimModifiers(profile: CaretakerProfile): SimModifiers {
  const m: SimModifiers = { ...DEFAULT_MODIFIERS }

  // ── Presence ──────────────────────────────────────────────────────────────
  // interventionist: more tools, shorter cooldowns
  // observer:        default
  // silent:          colony is slightly more self-sufficient (slower hunger)
  if (profile.presence === 'interventionist') {
    m.healCharges = 4
    m.foodDropCooldownMs = 3_000
  }
  // (silent has no constant modifier here; its effect is narrative/tonal)

  // ── World ─────────────────────────────────────────────────────────────────
  // fertile:  faster food regrowth, shorter droughts
  // varied:   unchanged
  // scarce:   slower regrowth, longer droughts
  if (profile.world === 'fertile') {
    m.foodRegrowMult     *= 1.45
    m.droughtDurationMult *= 0.55
  } else if (profile.world === 'scarce') {
    m.foodRegrowMult     *= 0.60
    m.droughtDurationMult *= 1.55
  }

  // ── Evolution ─────────────────────────────────────────────────────────────
  // fast: higher mutation rate, faster sentience accumulation
  // slow: lower mutation rate, slower drift — lineages are more stable
  if (profile.evolution === 'fast') {
    m.mutationChance     = 0.22
    m.sentienceGrowthMult *= 1.35
  } else {
    m.mutationChance     = 0.10
    m.sentienceGrowthMult *= 0.70
  }

  // ── Focus ─────────────────────────────────────────────────────────────────
  // bonds:    bonds form faster → more reproduction, more social messages
  // survival: harsher environment → drought longer, world slightly more scarce
  // awareness: sentience grows faster → stage transitions appear sooner
  if (profile.focus === 'bonds') {
    m.bondSpeedMult          *= 1.40
    m.awarenessMessageMult   *= 0.85  // slightly more bond messages
  } else if (profile.focus === 'survival') {
    m.droughtDurationMult    *= 1.20
    m.foodRegrowMult         *= 0.88
  } else if (profile.focus === 'awareness') {
    m.sentienceGrowthMult    *= 1.30
    m.awarenessMessageMult   *= 0.75  // awareness messages come more often
  }

  // ── Expectation ───────────────────────────────────────────────────────────
  // ascension:   ascension threshold lowered — easier to trigger the ending
  // persistence: no change
  // extinction:  harsher baseline — drought lingers, food thins
  if (profile.expectation === 'ascension') {
    m.ascensionThresholdOffset = -10
  } else if (profile.expectation === 'extinction') {
    m.droughtDurationMult  *= 1.20
    m.foodRegrowMult       *= 0.88
  }

  return m
}
