import { CaretakerProfile, SimModifiers } from '@/types'

// Defaults sit at the orthogonal centre — every multiplier is 1.0 and every
// hand-picked value is the "neutral" expression of its axis. Every choice the
// player makes pulls one axis in one direction with a meaningful trade-off;
// no choice is dominant, and no two settings touch the same axis.
//
// healCharges / foodDropCooldownMs are no longer set — the daily-charge gating
// system was replaced with the actionLoad soft-pressure curve in CaretakerState.
export const DEFAULT_MODIFIERS: SimModifiers = {
  foodRegrowMult:           1.0,
  droughtDurationMult:      1.0,
  bondSpeedMult:            1.0,
  mutationChance:           0.10,
  sentienceGrowthMult:      1.0,
  awarenessMessageMult:     1.0,
  weatherSeverityMult:      1.0,
  diseasePressureMult:      1.0,
  tribeFormationMult:       1.0,
  enrichmentSpawnMult:      1.0,
  lineageHostilityBaseline: 0,
  fractureEligibilityMult:  1.0,
  adaptationInheritMult:    1.0,
  morphologyDriftMult:      1.0,
  caretakerVisibilityMult:  1.0,
  lifespanMult:             1.0,
}

// Derive SimModifiers from the player's CaretakerProfile answers.
//
// Each setting controls one *primary* axis with a clearly different feel.
// Where a setting reaches into more than one modifier, the secondary effects
// reinforce the primary's identity rather than overlapping another setting.
//
// AXIS MAP (Presence axis removed — actions are unlimited; load curve handles balance)
//   World       → environment baseline (foodRegrowMult, droughtDurationMult,
//                                       weatherSeverityMult, diseasePressureMult)
//   Evolution   → genetic rates (mutationChance, adaptationInheritMult,
//                                morphologyDriftMult)
//   Focus       → colony social emphasis (bondSpeedMult, tribeFormationMult,
//                                          enrichmentSpawnMult, sentienceGrowthMult)
//   Expectation → narrative arc bias (lineageHostilityBaseline,
//                                      fractureEligibilityMult)
//   Visibility  → colony-perceives-you axis (caretakerVisibilityMult,
//                                             awarenessMessageMult)
//
// Trade-offs: 'fertile' world is easier but reduces evolutionary pressure;
// 'fast' evolution gives variety but destabilises lineages; 'awareness' focus
// produces more colony speech but slows reproduction; 'fracture' expectation
// is more dramatic but extinguishes faster; 'attentive' visibility makes the
// colony notice you but reduces their autonomy.
export function computeSimModifiers(profile: CaretakerProfile): SimModifiers {
  const m: SimModifiers = { ...DEFAULT_MODIFIERS }

  // ── World ─────────────────────────────────────────────────────────────────
  // PRIMARY axis: environment baseline.
  // Fertile makes survival easy but reduces evolutionary pressure (mutation crisis-boost
  // rarely fires). Scarce forces adaptation but extinction risk is real.
  if (profile.world === 'fertile') {
    m.foodRegrowMult        *= 1.55
    m.droughtDurationMult   *= 0.55
    m.weatherSeverityMult   = (m.weatherSeverityMult ?? 1) * 0.80
    m.diseasePressureMult   = (m.diseasePressureMult ?? 1) * 0.85
  } else if (profile.world === 'scarce') {
    m.foodRegrowMult        *= 0.55
    m.droughtDurationMult   *= 1.55
    m.weatherSeverityMult   = (m.weatherSeverityMult ?? 1) * 1.35
    m.diseasePressureMult   = (m.diseasePressureMult ?? 1) * 1.20
  }
  // 'varied' uses neutral defaults

  // ── Evolution ─────────────────────────────────────────────────────────────
  // PRIMARY axis: genetic rates.
  // Fast = more mutations, faster morphology drift, more rare births and race
  // emergences, but more visible deformations and lineage instability.
  // Slow = stable phenotypes; mutations are rare events when they happen.
  // Drift = the middle; mutation present, drift present, but neither dominates.
  if (profile.evolution === 'fast') {
    m.mutationChance        = 0.18
    m.morphologyDriftMult   = (m.morphologyDriftMult ?? 1) * 1.60
    m.adaptationInheritMult = (m.adaptationInheritMult ?? 1) * 1.30
  } else if (profile.evolution === 'slow') {
    m.mutationChance        = 0.04
    m.morphologyDriftMult   = (m.morphologyDriftMult ?? 1) * 0.55
    m.adaptationInheritMult = (m.adaptationInheritMult ?? 1) * 0.80
  } else {
    // 'drift' — explicit middle; uses defaults
  }

  // ── Focus ─────────────────────────────────────────────────────────────────
  // PRIMARY axis: colony social emphasis.
  // bonds:     pair-bonds form fast; tribes coalesce easier; more reproduction
  //            but slower sentience accumulation (creatures focused on each other)
  // survival:  enrichment density up (the world provides more to work with);
  //            bonds form slower (creatures are busy surviving); awareness slower
  // awareness: sentience grows faster; colony speaks more; bonds slightly slower
  //            (introspection competes with social attention)
  if (profile.focus === 'bonds') {
    m.bondSpeedMult         *= 1.45
    m.tribeFormationMult    = (m.tribeFormationMult ?? 1) * 1.40
    m.sentienceGrowthMult   *= 0.85
  } else if (profile.focus === 'survival') {
    m.enrichmentSpawnMult   = (m.enrichmentSpawnMult ?? 1) * 1.35
    m.bondSpeedMult         *= 0.85
    m.sentienceGrowthMult   *= 0.90
  } else if (profile.focus === 'awareness') {
    m.sentienceGrowthMult   *= 1.40
    m.awarenessMessageMult  *= 0.75  // cooldown shrinks; more colony speech
    m.bondSpeedMult         *= 0.90
  }

  // ── Expectation ───────────────────────────────────────────────────────────
  // PRIMARY axis: narrative arc bias. THIRD OPTION restored.
  // persistence: neutral — the colony goes where it goes
  // adaptation:  the colony tilts toward genetic resilience under pressure;
  //              mutation crisis-boost is amplified; adaptation inheritance up;
  //              lineages diversify rather than fracture
  // fracture:    new lineageRelations seeded slightly hostile; sustained
  //              conflict fractures sooner; more lineage_fork events; dramatic
  //              but extinction risk rises from internal conflict
  if (profile.expectation === 'adaptation') {
    m.adaptationInheritMult = (m.adaptationInheritMult ?? 1) * 1.25
    m.mutationChance        *= 1.20   // small boost on top of evolution axis
    m.lineageHostilityBaseline = 5    // very mild positive; allies form easier
  } else if (profile.expectation === 'fracture') {
    m.lineageHostilityBaseline = -15  // new pairs start mildly hostile
    m.fractureEligibilityMult  = (m.fractureEligibilityMult ?? 1) * 0.65  // sustained conflict fractures sooner
    m.tribeFormationMult       = (m.tribeFormationMult ?? 1) * 1.20  // more, smaller tribes
  }

  // ── Lifespan ──────────────────────────────────────────────────────────────
  // PRIMARY axis: how long individual creatures persist. Doesn't change tick
  // rate or season length — only multiplies MAX_AGE_BY_BODY for every body
  // type when computing each creature's maxAge at spawn time.
  // brief:    individuals turn over fast; evolution surfaces quickly;
  //           generational depth piles up; the colony feels ephemeral
  // standard: neutral; the v3-era baseline
  // long:     patient observation; deeper individual histories; slower
  //           generational depth but more time for sentience to mature
  if (profile.lifespan === 'brief') {
    m.lifespanMult = 0.60
  } else if (profile.lifespan === 'long') {
    m.lifespanMult = 1.80
  }

  // ── Visibility ────────────────────────────────────────────────────────────
  // PRIMARY axis: how strongly the colony registers your presence.
  // attentive: caretaker_contact fires at greater radius; awareness messages more frequent
  // hidden:    creatures barely register you; awareness messages rarer; colony has more autonomy
  if (profile.visibility === 'attentive') {
    m.caretakerVisibilityMult = (m.caretakerVisibilityMult ?? 1) * 1.50
    m.awarenessMessageMult   *= 0.80
  } else if (profile.visibility === 'hidden') {
    m.caretakerVisibilityMult = (m.caretakerVisibilityMult ?? 1) * 0.55
    m.awarenessMessageMult   *= 1.20
  }

  return m
}
