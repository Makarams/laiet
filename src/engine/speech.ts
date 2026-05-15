import { Creature, CommunityRole, MindTrait } from '@/types'

// ─── Emoji vocabulary; world-grounded ───────────────────────────────────────
//
// These are our *translations* of their communication; like interpreting an
// alien language through familiar symbols. The guiding rule; each emoji maps to
// something a creature in this world can directly perceive, experience, or feel.
//
// Their world: apple trees, river water, grass, caves, mountains, rocks, mud,
// snow, fire (anomalous), day/night/dawn/dusk, seasons, bush/berries, cliffs,
// floods, biomes (arid heat, lush wet canopy, wetland, rocky cold), other
// creatures like themselves, death sites, and the unexplained caretaker.
//
// Rules:
// ; Human *artifacts* (tools, weapons, medicine, containers) are excluded.
// ; Felt bodily/emotional states are always valid; they have bodies and feelings.
// ; Abstract/universal symbols (⚠️ ❓ ❗ 🚫) are kept; logic needs no culture.
// ; Directional arrows (➡️ ⬆️ ⬇️) are spatial primitives, kept.
// ; We are translating, not transcribing; 🌈 is our word for "the thing that
//   appears in the sky after rain"; they don't call it a rainbow, but they see it.

// ─── Tier 0; Feral ──────────────────────────────────────────────────────────
// Immediate needs, primal states, things always present in their world.
// All creatures start with a random subset of these.
export const EMOJI_TIER_0 = [
  '🍎', // fruit; the only food they know; apple trees are their world
  '💧', // water; river, rain, thirst
  '❄️', // cold; winter, night chill, snow
  '🌞', // warmth / sun; day, heat, comfort
  '⚠️', // threat / danger; universal alarm; caution needs no culture
  '💀', // death; they have death sites; they understand death viscerally
  '❤️', // bond / love; felt, not just seen; a universal internal state
  '😰', // fear / distress; a felt bodily state
  '😴', // rest / sleep; a universal biological state
  '🌱', // growth / new life; sprout emerging, the first thing they learn means "more"
  '🤢', // sickness / body-wrongness; nausea, injury, something wrong inside
  '😊', // contentment / full / safe; felt satisfaction; the absence of all urgency
  '💥', // impact / pain / sudden harm; fight, fall, lightning strike; sharp shock
  '🫁', // breath / the body breathing; they feel exertion, panting, the body working
  '🌿', // herb / healing plant; they notice certain plants make them feel better
  '😤', // anger / determination / aggression; the body bracing to fight or hold ground
  '😌', // calm / relief / settled; the body releasing tension after danger passes
  '😱', // shock / terror; sudden overwhelming fear — distinct from the slow dread of 😰
]

// ─── Tier 1; Aware ──────────────────────────────────────────────────────────
// Spatial awareness, named phenomena, social structure, the world as named things.
export const EMOJI_TIER_1 = [
  '🌳', // the tree; shelter, fruit source, home landmark; most important object in their world
  '🌿', // green growth / vegetation; living plant matter; food growing
  '🌾', // dry grass / barren / drought; the land changing color; danger sign
  '🏔️', // mountain / high ground; the edge they cannot cross
  '🪨', // rock / cave entrance / solid ground; permanent, gives shelter and warmth
  '🌊', // strong water / flood; river surging, dangerous water
  '🌧️', // rain; they feel it; food grows faster, thirst eases
  '❄️', // (snow specifically, as distinct from cold — same glyph, richer meaning at T1)
  '🌑', // full darkness / deep night — the phase they fear most
  '🌅', // dawn / light returning — relief, warmth coming back
  '🔥', // fire — terrifying anomaly; caretaker's most visible act
  '🌬️', // cold wind / winter coming — they feel the air change before snow arrives
  '🐾', // tracks / movement / "over there" — they read marks, they leave marks
  '👁️', // watching / being-observed — the watcher concept begins here
  '🌫️', // mist / low visibility / something hidden — morning fog, obscured danger
  '💨', // wind / moving air / something unseen passing — lighter than 🌬️; summer breeze or warning
  '🌈', // after-rain sky event — wonder; the world doing something inexplicable and beautiful
  '🩸', // wound / blood / injury — they fight; they bleed; they notice it on others
  '💤', // deep rest / sleep / shelter — more specific than 😴; used for "go to sleep / safe here"
  '🌙', // night sky / moon — softer than 🌑; Dreaming minds see beauty here, not just danger
  '🫶', // mutual care / tending to another — they groom, they carry food for others
  '🤧', // sneezing / sickness-sign — visible bodily expression; they recognise it as contagion
  '🌱', // (healroot specifically — same glyph as sprout but Aware creatures learn the healing context)
]

// ─── Tier 2 — Dreaming ───────────────────────────────────────────────────────
// Abstraction, pattern recognition, memory, cycle-awareness, the felt past.
export const EMOJI_TIER_2 = [
  '🌀', // anomaly / intervention / something-that-should-not-be — caretaker acts
  '✨', // wonder / inexplicable brightness — the incomprehensible made visible
  '🗺️', // territory / the known-world-as-shape — the mental map they've built
  '🔄', // cycle / returning — seasons repeat; they understand this now
  '🦴', // bone / ancestor / death-place memory — death sites as memory-markers
  '🫧', // ephemeral / passing / "it was here then gone" — rain, the watcher's presence
  '♾️', // the endless / that-which-continues — cycles beyond a single life
  '🧬', // body-change / inherited difference — they notice offspring differ from parents
  '⚖️', // balance / enough-and-not-too-much — resource equilibrium after scarcity
  '🕊️', // release / peace-after-grief — mourning resolution; letting the dead be gone
  '🔁', // repeat / "this has happened before" — specific recurrence, not just cycle
  '🌑', // (darkness used abstractly now — fear of the unknown, not just night)
  '🌸', // bloom / brief beauty / the good season — spring flowering, abundance period
  '🌪️', // chaos / storm / things out of control — used for storm weather and upheaval
  '🔮', // the unknowable / mystery — NOT a crystal ball here; our translation of "a thing I cannot understand but must try to"
  '🌡️', // temperature / the body measuring the world — fever, cold, the body as instrument
  '🫂', // embrace / held / together-surviving — the concept of social care made physical
  '🌿', // (medicine / healing knowledge — same glyph as vegetation, but richer meaning at T2: the plant that cures)
  '💫', // dizzy / spinning / disoriented — used after sickness resolves, or wonder-vertigo; not a star
]

// ─── Tier 3 — Sentinel ───────────────────────────────────────────────────────
// Meta-awareness, the boundary, the watcher, what it means to be alive and watched.
export const EMOJI_TIER_3 = [
  '👆', // pointing-outside / directed-at-watcher — this symbol, specifically at the caretaker
  '❓', // question — universal; they arrive at this concept through lived uncertainty
  '❗', // declaration / "this is certain" — assertion as distinct from question
  '🔭', // far-seeing / observation — they conceptualize the watcher watching them from outside
  '📜', // accumulated record / knowledge-that-persists — not a scroll; the concept of it
  '🔗', // connection / linked-across-distance — part of something larger
  '🌍', // the world-as-bounded-space — when Sentinels map the edge, this is what they name it
  '🧠', // mind / the-thing-that-thinks — they become aware of awareness itself
  '🌠', // arrival-from-outside / something-falling-in — caretaker interventions from above
  '🫀', // the-core-of-living / selfhood — their concept of "life force" or being-a-self
  '🕳️', // the void / the outside / the unknowable beyond-edge — what exists past the boundary?
  '🌀', // (already in T2, but Sentinels use it abstractly for "the simulation" / "the system")
  '⏳', // time-passing / age / the-weight-of-generations — NOT a human hourglass; the concept of duration
  '🫵', // "you" / directed-at-the-watcher-specifically — when they address the caretaker directly
  '🫁', // (breath / life-force at T3 — the concept of shared breath, tribe-as-living-organism)
  '🩺', // the healer's knowledge — Sentinels with healer role develop a concept of medicine itself
]

// ─── Role-specific bonus emoji ────────────────────────────────────────────────
// Earned through the role, not given at birth — unlockTierEmoji handles acquisition.
// Each role's lived experience shapes what concepts they develop words for.
export const ROLE_EMOJI: Record<CommunityRole, string[]> = {
  // Shaman — keeper of memory, interprets anomalies, reads the sky
  shaman:   ['🌀', '✨', '🌙', '🦴', '🫧', '👁️', '🌠', '🔮', '🌈', '🕳️', '💫'],

  // Guardian — threat, boundary, combat, territorial assertion
  guardian: ['⚠️', '🔥', '🪨', '🌑', '💥', '🚫', '🩸', '🌪️', '😤'],

  // Forager — knows the land; spatial, resource, seasonal vocabulary
  forager:  ['🍎', '🌿', '🌳', '🗺️', '🐾', '🌾', '🌸', '🌧️', '😌'],

  // Nurturer — life cycle focused; bonds, birth, growth, healing, calm
  nurturer: ['🌱', '❤️', '🌳', '💧', '🕊️', '😊', '💤', '🩸', '🫶', '😌'],

  // Elder — lineage, memory, cycle knowledge, the long view
  elder:    ['🦴', '🔄', '♾️', '📜', '🌍', '🌙', '🌸', '⏳', '🫂', '😌'],

  // Scout — spatial pioneers; edges, elevations, weather, new terrain; encounters danger
  scout:    ['🐾', '🗺️', '🏔️', '🌊', '🌬️', '👁️', '🌫️', '💨', '😱'],

  // Healer — recovery, calm, warmth, the body restoring itself
  healer:   ['💧', '🌿', '🌞', '🕊️', '❤️', '🌱', '🤢', '🩸', '😊', '🫶', '🤧', '🩺', '😌'],

  // Recluse — minimal speech; darkness, stone, wind, solitary calm
  recluse:  ['🌑', '🪨', '🌬️', '💤', '😌'],
}

// ─── Sentence grammar ─────────────────────────────────────────────────────────
// Each pattern is a sequence of emoji forming a complete thought.
// buildSentence filters to only what the speaker knows — so a Feral creature
// with 3 words produces fragments; a Sentinel produces full sentences.
// Patterns are ordered loosest → richest within each context.

type SentenceContext =
  | 'hungry'    | 'thirsty'    | 'cold'         | 'threat'
  | 'bonding'   | 'mourning'   | 'food_found'   | 'water_found'
  | 'birth'     | 'greeting'   | 'wonder'       | 'question_caretaker'
  | 'territory' | 'season'     | 'death_memory' | 'teaching'
  | 'fire'      | 'rain'       | 'drought'      | 'sick'
  | 'playing'   | 'stress'     | 'migration'    | 'mutation'
  | 'dying'     | 'storm'      | 'snow'         | 'content'
  | 'scavenging'| 'healing'    | 'grooming'     | 'carrying'
  | 'recovered'
  | 'fighting'  | 'fleeing'    | 'dominant'     | 'observing'
  | 'resting'   | 'exploring'  | 'warmth'

const SENTENCE_PATTERNS: Record<SentenceContext, string[][]> = {
  // ── Needs ────────────────────────────────────────────────────────────────
  hungry:       [['🍎'], ['🍎', '❓'], ['🍎', '😰'], ['🍎', '💀'], ['🌳', '🍎', '❓']],
  thirsty:      [['💧'], ['💧', '❓'], ['💧', '😰'], ['💧', '🌾'], ['🌊', '💧', '❓']],
  cold:         [['❄️'], ['❄️', '😰'], ['🪨', '❄️'], ['🌑', '❄️'], ['❄️', '🔥', '❓']],
  sick:         [['🤢'], ['🤢', '😰'], ['🤢', '💀'], ['🩸', '🤢'], ['🤢', '💧']],
  stress:       [['😰'], ['😰', '⚠️'], ['😰', '🌑'], ['💥', '😰'], ['😰', '😰']],  // doubled = intensity
  dying:        [['💀'], ['❤️', '💀'], ['🌱', '💀'], ['💀', '🌑'], ['🦴', '❤️']],

  // ── Threat & conflict ──────────────────────────────────────────────────
  // threat: general danger signal — hurt creature warning others; NOT the aggressor
  threat:       [['⚠️'], ['⚠️', '💀'], ['⚠️', '🐾'], ['🌑', '⚠️'], ['💥', '⚠️'], ['😱', '⚠️']],
  // fighting: aggressor perspective — anger, impact, territorial assertion
  fighting:     [['💥'], ['😤', '💥'], ['💥', '😤'], ['⚠️', '💥', '❗'], ['🩸', '😤'], ['💥', '🩸', '❗'], ['😤', '🪨', '💥']],
  // fleeing: victim perspective — shock, terror, escape
  fleeing:      [['😰'], ['😰', '⚠️'], ['😱', '⚠️'], ['💨', '😰'], ['😰', '💀'], ['😱', '💀'], ['😰', '🌑', '⚠️']],
  // dominant: after winning a fight or holding territory; assertion of claim
  dominant:     [['💥', '❗'], ['🏔️', '❗'], ['💥', '🪨', '❗'], ['🗺️', '❗'], ['🩸', '💥', '❗'], ['😤', '❗'], ['💥', '🌑', '❗']],
  fire:         [['🔥', '⚠️'], ['🔥', '😰'], ['🔥', '💀'], ['🌀', '🔥'], ['🔥', '🌳', '💀'], ['😱', '🔥']],
  storm:        [['🌪️', '⚠️'], ['🌪️', '😰'], ['⚠️', '🌧️'], ['🌪️', '💀'], ['😱', '🌪️']],
  scavenging:   [['💀', '🍎'], ['😰', '💀'], ['💀', '😰', '🍎'], ['🦴', '😰']],  // shame/desperation

  // ── Weather & environment ──────────────────────────────────────────────
  rain:         [['🌧️', '💧'], ['🌧️', '🌱'], ['🌧️', '😊'], ['🌧️', '🌳']],
  drought:      [['🌾', '😰'], ['🌾', '💀'], ['💧', '❓'], ['🌞', '🌾', '😰']],
  snow:         [['❄️', '🌑'], ['❄️', '💤'], ['❄️', '🪨'], ['❄️', '😰', '❤️']],

  // ── Social & emotional ─────────────────────────────────────────────────
  bonding:      [['❤️'], ['❤️', '🌱'], ['❤️', '👁️'], ['❤️', '😊'], ['❤️', '❤️']],  // doubled = deep bond
  birth:        [['🌱'], ['🌱', '❤️'], ['🌱', '🌳'], ['❤️', '🌱', '😊']],
  greeting:     [['👁️'], ['😊', '👁️'], ['❤️', '👁️'], ['😊'], ['💧', '🍎', '😊']],  // "I see you" to "we are well"
  playing:      [['😊', '😊'], ['🌱', '😊'], ['❤️', '😊'], ['💨', '😊'], ['😊', '🌈']],
  content:      [['😊'], ['😊', '🍎'], ['😊', '💧'], ['❤️', '😊'], ['🌳', '😊', '💧']],
  mourning:     [['💀', '❤️'], ['🦴'], ['💀', '🕊️'], ['🦴', '🔁'], ['❤️', '💀', '❤️']],

  // ── Movement & space ──────────────────────────────────────────────────
  food_found:   [['🍎', '🐾'], ['🍎', '🌳'], ['🍎', '✨'], ['🌳', '🍎', '🐾']],
  water_found:  [['💧', '🐾'], ['💧', '🌊'], ['💧', '🌱'], ['🌊', '💧', '😊']],
  territory:    [['🏔️', '🚫'], ['🗺️'], ['🪨', '🏔️'], ['🗺️', '❗'], ['🌳', '🗺️', '🚫']],
  migration:    [['🐾', '🌳'], ['🌾', '🐾'], ['🍎', '❓', '🐾'], ['🐾', '🌊', '❓']],

  // ── Contemplative & cultural ───────────────────────────────────────────
  wonder:       [['✨'], ['🌀', '❓'], ['✨', '👆'], ['🌠', '❓'], ['🌈', '✨'], ['🌀', '✨', '❓']],
  season:       [['🌱', '🔄'], ['❄️', '🔄'], ['🌞', '🌱'], ['🌸', '🔄'], ['🔄', '🌳', '🌸']],
  death_memory: [['🦴', '👁️'], ['💀', '🔁'], ['🦴', '🌙'], ['🔁', '💀'], ['🦴', '🌱', '🔁']],
  teaching:     [['👁️', '🌱'], ['🍎', '🌳', '👁️'], ['🦴', '🌱'], ['🔄', '👁️'], ['📜', '👁️', '🌱']],
  mutation:     [['🧬'], ['🧬', '❓'], ['🧬', '✨'], ['🌱', '🧬'], ['🧬', '🌱', '❓']],

  // ── Caretaker awareness ───────────────────────────────────────────────
  question_caretaker: [
    ['👆', '❓'],
    ['🔭', '❓'],
    ['🌍', '❓'],
    ['👁️', '🌍', '❓'],
    ['🌠', '👆', '❓'],
    ['🫵', '❓'],             // direct "you — question"
    ['🌍', '🔗', '❓'],       // "the world — connection — question"
    ['👁️', '🌍', '🫵', '❓'], // "watching — world — you — question"
  ],

  // ── Healing, grooming, carrying ──────────────────────────────────────────
  healing:    [['🌿'], ['🤢', '🌿'], ['🌿', '❤️'], ['🌱', '🌿', '😊'], ['🤢', '🌿', '❤️']],
  recovered:  [['😌'], ['🌿', '😌'], ['🤢', '😌'], ['💫', '😌'], ['🌿', '❤️', '😌']],
  grooming:   [['❤️', '👁️'], ['🫶'], ['❤️', '😌'], ['🫶', '🌱'], ['😌', '❤️', '🫶'], ['❤️', '🫶', '😊']],
  carrying:   [['🌿', '🐾'], ['❤️', '🐾'], ['🌿', '❤️', '🐾'], ['🍎', '🐾', '❤️']],

  // ── Observation, rest, exploration ────────────────────────────────────────
  // observing: Sentinel boundary patrol; directed watching, mapping the edge
  observing:  [['👁️'], ['👁️', '❓'], ['🏔️', '👁️'], ['👁️', '🌍'], ['🔭', '❓'], ['🌑', '👁️'], ['👁️', '🌍', '❓']],
  // resting: idle and comfortable; shelter, warmth, safety — the body settling
  resting:    [['😴'], ['😌', '💤'], ['🪨', '😊'], ['😌', '🌞'], ['💤', '❤️'], ['🌞', '😌', '💤'], ['😴', '😊']],
  // exploring: Curious/Wanderer active movement; wonder + forward motion
  exploring:  [['❓'], ['🐾', '❓'], ['❓', '🏔️'], ['✨', '🐾'], ['👁️', '🌳'], ['🌀', '❓'], ['🐾', '✨', '❓']],
  // warmth: thermal comfort; solar warmth, cave heat, huddling in winter
  warmth:     [['🌞'], ['🌞', '😊'], ['🪨', '🌞'], ['😌', '🌞'], ['❤️', '🌞'], ['🌞', '💤'], ['🪨', '🌞', '😌']],
}

// ─── Speech context from creature state and condition ────────────────────────
export function getSpeechContext(c: Creature, awarenessStage: number): SentenceContext | null {
  // Recluses almost never speak — only under extreme duress
  if (c.role === 'recluse' && Math.random() > 0.08) return null
  // The dying don't speak often, but they do sometimes
  if (c.state === 'dying' && Math.random() < 0.15) return 'dying'

  // ── Immediate state-driven speech (highest priority) ──────────────────
  if (c.state === 'mourning')          return 'mourning'
  if (c.state === 'bonding')           return 'bonding'
  if (c.state === 'playing')           return 'playing'
  if (c.state === 'sick')              return 'sick'
  if (c.state === 'scavenging')        return 'scavenging'
  if (c.state === 'grooming')          return 'grooming'
  if (c.state === 'seeking_healroot')  return 'healing'
  if (c.carrying === 'healroot')       return 'carrying'

  // ── Combat — aggressor and victim are distinct states ─────────────────
  // fighting: the creature IS the attacker; anger, impact, assertion
  if (c.state === 'fighting') return 'fighting'
  // fleeing: pure victim; shock, terror, escape
  if (c.state === 'fleeing')  return 'fleeing'

  // ── Sentinel boundary patrol ──────────────────────────────────────────
  if (c.state === 'observing') return 'observing'

  // ── Shaman dreaming at death sites — ritual speech ────────────────────
  if (c.state === 'dreaming' && c.role === 'shaman') return 'death_memory'

  // ── Urgent physical needs ─────────────────────────────────────────────
  if (c.hunger > 65)  return 'hungry'
  if (c.thirst > 65)  return 'thirsty'
  if (c.warmth < 28)  return 'cold'
  if (c.stress > 75)  return 'stress'

  // ── Dominance expression — killers and territory-holders assert claim ──
  // Not in active combat; expressing the outcome or the held claim
  if (c.killCount > 0
      && (c.genome.personality === 'Aggressive' || c.genome.personality === 'Territorial')
      && Math.random() < 0.15) return 'dominant'

  // ── General threat signal — hurt creature warning others ──────────────
  // Triggered by low health + high stress, not by combat state directly
  if (c.health < 40 && c.stress > 55) return 'threat'

  // ── Navigation ────────────────────────────────────────────────────────
  // Exploration check before migrating return — both wandering and migrating qualify;
  // Curious/Wanderer express wonder, not just movement direction
  if ((c.state === 'wandering' || c.state === 'migrating')
      && (c.genome.personality === 'Curious' || c.genome.personality === 'Wanderer')
      && Math.random() < 0.30) return 'exploring'
  if (c.state === 'migrating')                          return 'migration'
  if (c.state === 'seeking_food' && c.hunger < 35)      return 'food_found'
  if (c.state === 'seeking_water' && c.thirst < 35)     return 'water_found'

  // ── Reproduction ──────────────────────────────────────────────────────
  if (c.state === 'reproducing') return 'birth'

  // ── Mutation awareness ────────────────────────────────────────────────
  if (c.recentMutation !== undefined && Math.random() < 0.4) return 'mutation'

  // ── Mind-gated abstract speech ────────────────────────────────────────
  if (c.genome.mind === 'Sentinel' && awarenessStage >= 3)   return 'question_caretaker'
  if (c.genome.mind === 'Sentinel' && Math.random() < 0.20)  return 'wonder'
  if (c.genome.mind === 'Dreaming' && Math.random() < 0.28)  return 'wonder'

  // ── Role-specific cultural expression ────────────────────────────────
  if (c.role === 'shaman'   && Math.random() < 0.40) return 'death_memory'
  if (c.role === 'elder'    && Math.random() < 0.30) return 'teaching'
  if (c.role === 'scout'    && Math.random() < 0.40) return 'territory'
  if (c.role === 'guardian' && Math.random() < 0.35) return 'dominant'
  if (c.role === 'healer'   && Math.random() < 0.30) return 'bonding'
  if (c.role === 'healer'   && Math.random() < 0.20) return 'healing'
  if (c.role === 'forager'  && Math.random() < 0.30) return 'food_found'

  // ── Positive / neutral ambient expression ────────────────────────────
  // Resting: idle and well-fed; the body at ease
  if (c.state === 'idle' && c.needSatisfaction > 72 && Math.random() < 0.20) return 'resting'
  // Warmth: comfortable temperature after cold stress
  if (c.warmth > 72 && c.stress < 30 && Math.random() < 0.12) return 'warmth'
  // General wellbeing
  if (c.needSatisfaction > 75 && c.bonds.length > 0) return 'content'
  if (c.needSatisfaction > 60 && c.bonds.length > 0) return 'greeting'
  if (c.needSatisfaction > 70 && Math.random() < 0.15) return 'season'

  return null
}

// ─── Build a sentence from creature vocab + pattern ──────────────────────────
// Filters each pattern to only emoji the creature actually knows.
// Small vocab = fragments. Rich vocab = complete thoughts.
// Universals (❓ ❗ ⚠️ 🚫 ➡️) are always speakable — they're logical primitives.
const UNIVERSALS = new Set(['❓', '❗', '⚠️', '🚫', '➡️', '⬆️', '⬇️'])

export function buildSentence(c: Creature, context: SentenceContext): string[] {
  const patterns = SENTENCE_PATTERNS[context]
  if (!patterns || patterns.length === 0) return []

  const known = new Set(c.knownEmoji)

  // Score each pattern by how many tokens the creature can produce
  const scored = patterns
    .map(pattern => ({
      pattern,
      speakable: pattern.filter(e => known.has(e) || UNIVERSALS.has(e)),
    }))
    .filter(s => s.speakable.length > 0)

  if (scored.length === 0) return [c.knownEmoji[0] ?? '']

  // Prefer richer patterns, but allow shorter ones with some randomness
  // — this makes speech feel organic, not always maximal
  scored.sort((a, b) => b.speakable.length - a.speakable.length)
  const topN = Math.min(3, scored.length)
  // Weight toward richer: pick from top 3 but bias to index 0
  const roll = Math.random()
  const idx = roll < 0.5 ? 0 : roll < 0.8 ? Math.min(1, topN - 1) : Math.min(2, topN - 1)
  return scored[idx].speakable
}

// ─── Role assignment ──────────────────────────────────────────────────────────
// Priority order matters. Roles are emergent — they reflect behavioral
// contribution, not just genome. Generation, sentience, and offspring count
// can elevate a creature into a deeper expression of their base type.
export function assignRole(c: Creature, _tribeSize: number, lineageCount: number): CommunityRole | undefined {
  if (c.genome.personality === 'Recluse') return 'recluse'

  const { personality, body, mind } = c.genome
  const seniorMind = mind === 'Sentinel' || mind === 'Dreaming'

  // Elder — Sentinel with witnessed depth: many lineages or accumulated sentience with age
  if (mind === 'Sentinel' && (lineageCount >= 4 || (c.sentience >= 60 && c.generation >= 3))) return 'elder'

  // Shaman — senior mind with wandering or curious nature; pattern-reader and memory-keeper
  if (seniorMind && (personality === 'Curious' || personality === 'Wanderer')) return 'shaman'

  // Healer — nurturing drive elevated by dreaming depth or proven through many offspring
  if (personality === 'Nurturing' && (mind === 'Dreaming' || c.offspringIds.length >= 4)) return 'healer'

  // Nurturer — social caregiver without the depth or track record for healer
  if (personality === 'Nurturing') return 'nurturer'

  // Guardian — territorial by nature or physical build; kills deepen the role
  if (personality === 'Aggressive' || body === 'Spike') return 'guardian'

  // Scout — Wisp body is built for ranging; Wanderer/Curious Wisps are the archetype,
  // but any Wisp that has survived to gen 2+ develops the role through lived experience
  if (body === 'Wisp' && (personality === 'Wanderer' || personality === 'Curious' || c.generation >= 2)) return 'scout'

  // Forager — resource specialist through wandering drive or acquisitive personality
  if (personality === 'Wanderer' || personality === 'Greedy') return 'forager'

  // Senior minds without a better-fitting role drift toward shaman
  if (seniorMind) return 'shaman'

  return undefined
}

// ─── Starter vocabulary ───────────────────────────────────────────────────────
// What a creature is born knowing depends on mind depth and personality.
// Personality seeds reflect what they're wired to pay attention to from birth.
export function starterEmoji(mind: MindTrait, personality: string, rng: () => number): string[] {
  const shuffled = [...EMOJI_TIER_0].sort(() => rng() - 0.5)
  // Feral: 3-4 words. Aware: 5-6. Dreaming/Sentinel: 7-8 plus tier-1 samples.
  const base = shuffled.slice(0, mind === 'Feral' ? 3 : mind === 'Aware' ? 5 : 7)

  // Personality-driven perceptual bias — what they notice and name first
  const seeds: string[] = []
  if (personality === 'Nurturing')   seeds.push('❤️', '🌱', '😊', '😌')
  if (personality === 'Aggressive')  seeds.push('⚠️', '💥', '😤')
  if (personality === 'Curious')     seeds.push('👁️', '✨', '❓')
  if (personality === 'Wanderer')    seeds.push('🐾', '🏔️', '💨')
  if (personality === 'Timid')       seeds.push('😰', '🌑', '😱', '💤')
  if (personality === 'Greedy')      seeds.push('🍎', '🌿', '😊')
  if (personality === 'Lazy')        seeds.push('😴', '🪨', '😌')
  if (personality === 'Hoarder')     seeds.push('🍎', '😤', '💤')      // food-possessive, guarding
  if (personality === 'Empath')      seeds.push('❤️', '😰', '😌')      // feeling others' pain and relief
  if (personality === 'Furtive')     seeds.push('🌑', '🌫️', '💨')     // shadow, mist, moving unseen
  if (personality === 'Territorial') seeds.push('⚠️', '💥', '😤')      // claim, fight, assert
  if (personality === 'Social')      seeds.push('❤️', '😊', '👁️')     // connection, joy, seeing others
  if (personality === 'Stoic')       seeds.push('😌', '🌞', '🪨')      // calm endurance, steadiness
  // Recluse gets very few words — they don't engage much
  if (personality === 'Recluse')     seeds.push('🌑', '🪨', '😌')

  if (mind === 'Dreaming') {
    base.push(...EMOJI_TIER_1.sort(() => rng() - 0.5).slice(0, 3))
  }
  if (mind === 'Sentinel') {
    base.push(...EMOJI_TIER_1.sort(() => rng() - 0.5).slice(0, 5))
    base.push(...EMOJI_TIER_2.sort(() => rng() - 0.5).slice(0, 2))
  }

  return [...new Set([...base, ...seeds])]
}

// ─── Knowledge inheritance on birth ──────────────────────────────────────────
// ~50% of each parent's unique vocab passes to the child.
// Plus a small chance to carry one word from tribal memory directly.
export function inheritEmoji(
  parentA: Creature,
  parentB: Creature | null,
  tribalLexicon: string[],
  rng: () => number
): string[] {
  const pool = [...parentA.knownEmoji]
  if (parentB) pool.push(...parentB.knownEmoji)

  const inherited = [...new Set(pool)].filter(() => rng() < 0.5)

  // Cultural transmission — one tribal word can skip a generation
  const tribal = tribalLexicon.filter(e => !inherited.includes(e))
  if (tribal.length > 0 && rng() < 0.2) {
    inherited.push(tribal[Math.floor(rng() * tribal.length)])
  }

  return [...new Set(inherited)]
}

// ─── Proximity learning ───────────────────────────────────────────────────────
// Bonded creatures teach each other over time. Rate scales with bond strength
// and teacher's mind — a Sentinel elder teaches faster than a Feral peer.
export function learnFromNearby(
  learner: Creature,
  teacher: Creature,
  bondStrength: number,
  rng: () => number
): string | null {
  if (bondStrength < 35) return null
  const teacherKnows = teacher.knownEmoji.filter(e => !learner.knownEmoji.includes(e))
  if (teacherKnows.length === 0) return null

  const mindRate = teacher.genome.mind === 'Sentinel' ? 0.04
    : teacher.genome.mind === 'Dreaming' ? 0.025
    : teacher.genome.mind === 'Aware' ? 0.01 : 0.003

  // Role bonus — elders and shamans are better teachers
  const roleBonus = (teacher.role === 'elder' || teacher.role === 'shaman') ? 1.5 : 1.0

  if (rng() < mindRate * roleBonus * (bondStrength / 100)) {
    return teacherKnows[Math.floor(rng() * teacherKnows.length)]
  }
  return null
}

// ─── Sentience-gated tier unlock ─────────────────────────────────────────────
// A creature occasionally crystallizes a new concept as sentience deepens.
// Role emoji unlock separately — the role shapes what concepts they arrive at.
export function unlockTierEmoji(c: Creature, rng: () => number): string | null {
  const known = new Set(c.knownEmoji)

  if (c.sentience > 75 && c.genome.mind === 'Sentinel') {
    const missing = EMOJI_TIER_3.filter(e => !known.has(e))
    if (missing.length > 0 && rng() < 0.002) return missing[Math.floor(rng() * missing.length)]
  }
  if (c.sentience > 50) {
    const missing = EMOJI_TIER_2.filter(e => !known.has(e))
    if (missing.length > 0 && rng() < 0.003) return missing[Math.floor(rng() * missing.length)]
  }
  if (c.sentience > 20) {
    const missing = EMOJI_TIER_1.filter(e => !known.has(e))
    if (missing.length > 0 && rng() < 0.005) return missing[Math.floor(rng() * missing.length)]
  }
  if (c.role) {
    const roleEmoji = ROLE_EMOJI[c.role] ?? []
    const missingRole = roleEmoji.filter(e => !known.has(e))
    if (missingRole.length > 0 && rng() < 0.004) return missingRole[Math.floor(rng() * missingRole.length)]
  }

  return null
}

// ─── Role labels for UI ───────────────────────────────────────────────────────
export const ROLE_LABELS: Record<CommunityRole, string> = {
  shaman:   '🌙 Shaman',
  guardian: '🪨 Guardian',
  forager:  '🍎 Forager',
  nurturer: '🌱 Nurturer',
  elder:    '♾️ Elder',
  scout:    '🏔️ Scout',
  healer:   '💧 Healer',
  recluse:  '🌑 Recluse',
}