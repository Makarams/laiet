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
  '💔', // broken bond / grief / loss — they lose companions; a felt internal rupture distinct from mourning
  '🥶', // extreme cold / the body freezing — not ❄️ (the thing outside); this is internal suffering
  '🥵', // fever / heat exhaustion / the body too hot — drought heat, sickness, overexertion burning inside
  '😔', // sadness / quiet grief / low mood — not acute mourning; a persistent heaviness after loss
  '😮', // surprise / startled / unexpected event — milder than 😱; wonder-alarm at something new
  // ── New Tier 0 additions ──
  '🍄', // growth-from-death / fungus / the strange that appears at decay sites
  '🌰', // seed / stored-potential / what a thing becomes before it is anything
  '🦶', // my-track / I-was-here / trace I left — distinct from 🐾 (reading others' tracks)
  '👃', // scent / smell-alert / detecting something invisible in the air
  '🤫', // hush / be-still / danger-quiet — universal body signal for silence
  '🫸', // push-back / stop / keep-distance — defensive body gesture
  '🤲', // offering / presenting / sharing with open hands
  '💪', // strong / well-fed / body-capable — felt physical capacity
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
  '🌺', // flowering / seasonal bloom / harvest abundance — they see plants burst open in spring
  '🐣', // birth / hatching / emergence — they witness new creatures arriving; they understand this event
  '👀', // social watching / observing others with interest — the gaze of curiosity directed at another
  '🫣', // hiding to watch / peering from concealment — timid or furtive watching from safety
  '💭', // inner thought / wondering / invisible internal state — the awareness of one's own mind beginning
  '🌤️', // clearing / sun returning after storm — the world brightening; relief that arrives with light
  '🫤', // ambivalence / mixed feeling / not-knowing — uncertainty; two things at once, neither resolved
  '💢', // frustration / anger before aggression — blocked desire, tension that hasn't broken into fighting yet
  // ── New Tier 1 additions ──
  '🍂', // leaf-fall / decay / end-of-something — autumn, things ending, the cycle of loss
  '🍃', // living-and-fresh / still-growing / not-yet-gone — the complement of 🍂
  '🌒', // waxing / coming / building-toward — something approaching, strength gathering
  '🌘', // waning / leaving / diminishing — something fading, going away
  '🌓', // half / partial / between-states — gradation, the threshold moment
  '🏃', // urgency / running / fast-movement — the body moving beyond its normal pace
  '🪸', // built-structure / made-thing / something-placed-with-intent — constructed landmark
  '🦻', // alert-to-sound / listening / awareness-through-hearing (something heard, not seen)
  '🫳', // placing / setting-down / I-put-this-here — the act of deliberate placement
  '🌁', // obscured / fog-over-hills / I-cannot-see-there — hidden terrain, covered danger
  '🌻', // turning-toward-warmth / sun-directed / seeking-the-light — they face warmth instinctively
  '🏕️', // sheltering-together / group-settled / gathered-overnight — a known gathering point
  '🧭', // direction-sense / knowing-which-way / finding-the-path
  '🌐', // the-whole-world / everywhere / all-of-here — spatial comprehension of totality
  '📍', // this-exact-spot / marked / pinpointed — precise location awareness
  '🦗', // other-small-creature / not-the-only-kind / something-like-us-but-not
  '🦁', // danger-creature / larger-predator / something-bigger-than-us
  '🌴', // different-tall-plant / unusual-landmark / southern-tree
  '🍁', // seasonal-change-marker / autumn-signal / the-turning
  '🦋', // transformation / metamorphosis / change-across-time — they witness mutation and generation drift
  '🌩️', // storm-lightning / the-electrical-threat — distinct from 🌪️ (wind) and 🔥 (fire)
  '🐛', // the-young-that-changes / larva / pre-metamorphosis — they see this before the butterfly
  '🫦', // calling-out / vocal-signal / sound-from-body — they communicate with sound
  '🐝', // coordinated-activity / many-working-as-one / the-buzzing-colony
  '🌵', // thorned-landmark / do-not-eat / arid-sentinel — a plant with a warning
  '🪹', // empty-place / was-home / abandoned-site — a nest that is no longer used
  '🗻', // highest-point / the-unreachable-summit / peak-of-the-territory
  '🌦️', // mixed-sky / uncertain-weather / sun-in-rain — the ambiguous condition
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
  '🦋', // transformation / metamorphosis / change-across-time — Dreaming minds arrive at deeper meaning
  '💖', // deep love / profound bond — richer than ❤️; the bond that has shaped identity itself
  '🪺', // the nest / home / belonging-place — territory not as boundary but as where one is from
  '🧊', // frozen / suspended / still — winter stasis, something halted, the unchanging cold
  '🩹', // wound healing / the body repairing itself — they observe their own and others' recovery
  '🐚', // ancient thing / past-preserved — death sites, bones, something that endured when others didn't
  // ── New Tier 2 additions ──
  '🌋', // catastrophe / fire-from-earth / the-world-itself-burning — extreme dangerous event
  '🧩', // incomplete / something-missing / the-gap — absence felt as a shape
  '🔍', // looking-closely / examination / trying-to-understand-detail — directed investigation
  '🔓', // opened / accessible / passage-clear — what was blocked is no longer
  '🔒', // sealed / closed / kept-out — barrier, exclusion, the door that does not open
  '⚡', // lightning / strike-from-above / caretaker-power — they have seen thunder strikes
  '🎇', // sparks-dying / fire-ending / remnant-of-heat — the event fading, aftermath
  '♟️', // deliberate-placement / planned-move / positioned-with-intent — not random, chosen
  '🪄', // inexplicable-change / sudden-transformation-by-unknown — caretaker intervention
  '🔇', // silence / nothing / absence-of-signal — the void where something should be
  '🧿', // watched-back / mutual-observation / the-watcher-noticed — the gaze returned
  '🗝️', // access / the-thing-that-opens / core-insight — what unlocks the next understanding
  '🪢', // bound-together / inseparable / tied-across-distance — the connection that persists
  '🔆', // brightening / intensifying / growing-stronger — a process that increases
  '🌊', // (flood / overwhelming force — same glyph as T1 river but Dreaming minds use it for collapse and surge)
  '🧭', // (direction / purpose — same glyph as T1 navigation but at T2 it means "the reason I go")
  '🌐', // everywhere / the-world-as-bounded-whole / the-limits-as-a-shape
  '🪬', // protected / warded / something-is-keeping-us-safe — abstract sense of being guarded
  '🌒', // (waxing / anticipation — at T2 this means the unseen thing that is building toward event)
  '🎆', // dispersal / burst / scattered-from-center — fracture, explosion, the colony spreading apart
  '🌉', // crossing / the-connection-between-two-places — metaphor for joining or between-states
  '🌄', // the-light-from-below / dawn-over-valley / warmth-returning-after-darkness
  '🏞️', // the-land-spread-before-them / open-vista / the-world-as-seen-from-above
  '🪔', // small-persistent-light / warmth-in-cold / something-kept-alive-deliberately
  '🗼', // high-marker / visible-from-far / landmark-of-power (the thing they can always navigate by)
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
  // ── New Tier 3 additions ──
  '🌌', // the-beyond / what-exists-outside-the-boundary / cosmos — the unknowable past the edge
  '🔬', // deepest-examination / understanding-the-small / fundamental-structure — the root of things
  '💎', // crystallized / achieved / perfect-form — something that has become what it always was
  '📡', // signal / receiving-from-outside / detection-across-distance — the broadcast presence
  '🧲', // attracted / drawn-toward / the-pull — not chosen; inevitable
  '⚗️', // becoming / the-process-of-transformation / in-progress — not yet complete
  '🔑', // core-insight / the-thing-that-opens / what-unlocks-understanding
  '🕯️', // small-persistent-light / surviving-against-darkness / individual-in-the-void
  '🧶', // woven / accumulated-layer-upon-layer / generational-depth — what many lives build
  '🌗', // (at T3: the-threshold / between-knowing-and-not / the-half-understood)
]

// ─── Role-specific bonus emoji ────────────────────────────────────────────────
// Earned through the role, not given at birth — unlockTierEmoji handles acquisition.
// Each role's lived experience shapes what concepts they develop words for.
export const ROLE_EMOJI: Record<CommunityRole, string[]> = {
  // Shaman — keeper of memory, interprets anomalies, reads the sky
  shaman:   ['🌀', '✨', '🌙', '🦴', '🫧', '👁️', '🌠', '🔮', '🌈', '🕳️', '💫', '🦋', '💭', '🪺',
             '🌒', '🌘', '🍂', '🌄', '🎆'],

  // Guardian — threat, boundary, combat, territorial assertion
  guardian: ['⚠️', '🔥', '🪨', '🌑', '💥', '🚫', '🩸', '🌪️', '😤', '💢', '🪺',
             '🪸', '🦶', '💪', '🌩️', '♟️'],

  // Forager — knows the land; spatial, resource, seasonal vocabulary
  forager:  ['🍎', '🌿', '🌳', '🗺️', '🐾', '🌾', '🌸', '🌧️', '😌', '🌺', '🐣', '🌤️',
             '🍂', '🍃', '🌵', '🍄', '🌰', '🧭', '📍'],

  // Nurturer — life cycle focused; bonds, birth, growth, healing, calm
  nurturer: ['🌱', '❤️', '🌳', '💧', '🕊️', '😊', '💤', '🩸', '🫶', '😌', '💔', '🩹', '🐣',
             '🤲', '🐛', '🪹', '🫦', '🌻'],

  // Elder — lineage, memory, cycle knowledge, the long view
  elder:    ['🦴', '🔄', '♾️', '📜', '🌍', '🌙', '🌸', '⏳', '🫂', '😌', '🦋', '🐚', '💖',
             '🧶', '🗼', '🌉', '🍁', '🌐'],

  // Scout — spatial pioneers; edges, elevations, weather, new terrain; encounters danger
  scout:    ['🐾', '🗺️', '🏔️', '🌊', '🌬️', '👁️', '🌫️', '💨', '😱', '👀', '🫣', '😮', '🌤️',
             '🗻', '🦁', '🦗', '🧭', '🌦️', '🦻', '🌁'],

  // Healer — recovery, calm, warmth, the body restoring itself
  healer:   ['💧', '🌿', '🌞', '🕊️', '❤️', '🌱', '🤢', '🩸', '😊', '🫶', '🤧', '🩺', '😌', '🩹', '💔',
             '🌻', '🪔', '🌒', '🤲'],

  // Recluse — minimal speech; darkness, stone, wind, solitary calm
  recluse:  ['🌑', '🪨', '🌬️', '💤', '😌', '😔', '🐚', '🌁', '🪹', '🌘'],
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
  | 'fear_curiosity' | 'dominant_territory' | 'sick_recovering' | 'hunger_migrating'
  | 'stress_playing'  | 'wonder_mourning'   | 'cold_urgent'     | 'bond_fight'
  | 'building'  | 'listening'  | 'decay_growth' | 'waxing'
  | 'waning'    | 'offering'   | 'marking'      | 'lineage_pride'
  | 'predator_alert' | 'seasonal_turn'

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

  // ── Blended / overlapping emotional states ─────────────────────────────
  // These fire when two in-simulation conditions are simultaneously true.
  // fear_curiosity: moving into danger while drawn forward — Curious or Timid under threat
  fear_curiosity:     [['😰', '❓'], ['👁️', '😰'], ['❓', '⚠️'], ['🫣', '❓'], ['😮', '🐾', '❓'],
                       ['👁️', '⚠️', '❓'], ['😰', '✨', '❓']],
  // dominant_territory: fighting while holding a territory claim — rage + possession
  dominant_territory: [['💥', '🗺️'], ['😤', '🗺️', '❗'], ['🩸', '🗺️'], ['💥', '🏔️', '❗'],
                       ['😤', '🗺️', '💥'], ['💢', '🗺️', '❗']],
  // sick_recovering: health returning during sickness — ambivalent, not pure distress
  sick_recovering:    [['🤢', '😌'], ['🌿', '🤢', '😊'], ['🤢', '❤️', '🌱'], ['💫', '🌿'],
                       ['😔', '🌿', '😊'], ['🤢', '😌', '🌱']],
  // hunger_migrating: starving while actively moving — urgency overrides pure migration tone
  hunger_migrating:   [['🍎', '🐾'], ['😰', '🐾'], ['🍎', '❓', '🐾'], ['😰', '🌳', '🐾'],
                       ['💀', '🍎', '🐾'], ['😔', '🍎', '🐾']],
  // stress_playing: trying to play while anxious — joy and tension simultaneously
  stress_playing:     [['😊', '😰'], ['❤️', '😰'], ['😊', '⚠️'], ['😌', '😊', '😰'],
                       ['❤️', '😊', '💢'], ['😊', '💢', '❓']],
  // wonder_mourning: Dreaming mind at a death site — grief transmuted into transcendence
  wonder_mourning:    [['💀', '✨'], ['🦴', '✨', '❓'], ['💀', '🌀', '❓'], ['✨', '🦴'],
                       ['💀', '😌', '✨'], ['🦋', '💀', '✨'], ['🔮', '🦴', '❓']],
  // cold_urgent: extreme cold + high stress — body panic, not just cold observation
  cold_urgent:        [['❄️', '😰'], ['🥶', '⚠️'], ['❄️', '💀'], ['🥶', '😰', '❤️'],
                       ['❄️', '🔥', '❓'], ['🥶', '❄️', '😱']],
  // bond_fight: fighting someone bonded to — conflicted; love and aggression coexist
  bond_fight:         [['❤️', '💥'], ['💥', '❤️', '❓'], ['❤️', '😤'], ['💔', '💥'],
                       ['💥', '❤️', '😰'], ['❤️', '⚠️', '💥'], ['💔', '😰']],

  // ── New combinable contexts ────────────────────────────────────────────────

  // building: placing a constructed barrier; territorial assertion through craft
  building:       [['🪸', '❗'], ['🫳', '🪨'], ['🫳', '🌳'], ['🪸', '🗺️'],
                   ['💪', '🪸'], ['🫳', '❗', '🗺️'], ['🪸', '😤', '❗'], ['🗺️', '🪸', '💪']],

  // listening: alertness through sound — detecting the hidden via hearing
  listening:      [['🦻', '❓'], ['🦻', '⚠️'], ['🦻', '🐾', '❓'], ['🦻', '🌑'],
                   ['🤫', '🦻'], ['🦻', '💨', '❓'], ['🦻', '⚠️', '🤫']],

  // decay_growth: death as precondition for new life — seen at death sites, in fungal growth
  decay_growth:   [['🍄', '🌱'], ['💀', '🌱'], ['🍂', '🌱'], ['🦴', '🌱', '❓'],
                   ['🍄', '❓'], ['💀', '🍃'], ['🍂', '🍃', '🔄'], ['🦴', '🌱', '🔄']],

  // waxing: something building, approaching, growing stronger — anticipation
  waxing:         [['🌒', '❤️'], ['🌒', '🌱'], ['🌒', '⚠️'], ['💪', '🌒'],
                   ['🌒', '✨'], ['🌱', '🌒', '❓'], ['🌒', '🌸']],

  // waning: something fading, leaving, diminishing — acceptance or grief
  waning:         [['🌘', '❤️'], ['🌘', '🌱'], ['🌘', '🌞'], ['💔', '🌘'],
                   ['🌘', '😔'], ['❤️', '🌘', '🦴'], ['🌘', '🌸', '💔']],

  // offering: sharing food or care — presentational gesture; I have this and give it
  offering:       [['🤲', '🍎'], ['🤲', '💧'], ['🤲', '🌿'], ['🤲', '❤️'],
                   ['🫶', '🤲', '🍎'], ['🤲', '😊'], ['🍎', '🤲', '👁️']],

  // marking: I-was-here / claiming this place / leaving trace for others to read
  marking:        [['🦶', '❗'], ['🦶', '🗺️'], ['🦶', '🐾', '❗'], ['📍', '❗'],
                   ['🦶', '😤'], ['🦶', '🌳', '❗'], ['📍', '🗺️', '❗']],

  // lineage_pride: elder/guardian expressing the value of the unbroken line
  lineage_pride:  [['🦴', '❤️', '❗'], ['🧬', '❗'], ['🔄', '🌱', '❗'], ['💪', '🧬'],
                   ['🦴', '🌱', '❤️'], ['🔄', '❤️', '❗'], ['🧬', '🌱', '🔄']],

  // predator_alert: sensing something larger or more dangerous; alarm + size awareness
  predator_alert: [['🦁', '⚠️'], ['🦁', '😰'], ['⚠️', '💥', '🦁'], ['🤫', '🦁'],
                   ['🦁', '💥', '⚠️'], ['🦻', '🦁', '⚠️'], ['😱', '🦁']],

  // seasonal_turn: the world changing season; the colony reads the shift and responds
  seasonal_turn:  [['🍁', '🔄'], ['🌸', '🌒'], ['❄️', '🌒'], ['🍂', '⚠️'],
                   ['🌸', '🌘'], ['🍁', '😔'], ['🌒', '🌸', '❓'], ['🔄', '🍁', '🌱']],
}

// ─── Speech context from creature state and condition ────────────────────────
export function getSpeechContext(c: Creature, awarenessStage: number): SentenceContext | null {
  // Recluses almost never speak — only under extreme duress
  if (c.role === 'recluse' && Math.random() > 0.08) return null
  // The dying don't speak often, but they do sometimes
  if (c.state === 'dying' && Math.random() < 0.15) return 'dying'

  // ── Blended states — overlapping conditions intercepted before single-state returns ──
  // These fire when two simultaneous in-simulation conditions are both true.
  // sick but health recovering (above 45): ambivalent — not pure distress
  if (c.state === 'sick' && c.health > 45 && Math.random() < 0.30) return 'sick_recovering'
  // fighting someone bonded to: conflicted, love and aggression coexist
  if (c.state === 'fighting' && c.bonds.some(b => b.strength > 40) && Math.random() < 0.25) return 'bond_fight'
  // fighting while holding territory: asserting claim, not just rage
  if (c.state === 'fighting' && c.territoryClaim !== null && Math.random() < 0.25) return 'dominant_territory'
  // playing while stressed: joy and tension coexist
  if (c.state === 'playing' && c.stress > 40 && Math.random() < 0.25) return 'stress_playing'

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

  // ── Dreaming — blended wonder-mourning fires first; ritual death memory second ──
  if (c.state === 'dreaming' && c.genome.mind === 'Dreaming' && Math.random() < 0.30) return 'wonder_mourning'
  if (c.state === 'dreaming' && c.role === 'shaman') return 'death_memory'

  // ── Urgent physical needs ─────────────────────────────────────────────
  if (c.hunger > 65)  return 'hungry'
  if (c.thirst > 65)  return 'thirsty'
  // extreme cold + high stress → body panic, not just observation
  if (c.warmth < 20 && c.stress > 60 && Math.random() < 0.45) return 'cold_urgent'
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
  // fear + curiosity: moving into danger while drawn forward — Curious or Timid under stress
  if ((c.state === 'wandering' || c.state === 'migrating')
      && (c.genome.personality === 'Curious' || c.genome.personality === 'Timid')
      && c.stress > 40 && c.health < 55
      && Math.random() < 0.30) return 'fear_curiosity'
  // migrating while starving: urgency + movement
  if (c.state === 'migrating' && c.hunger > 55 && Math.random() < 0.30) return 'hunger_migrating'
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

  // ── Building / construction ──────────────────────────────────────────
  if (c.state === 'harvesting' || c.state === 'building') return 'building'

  // ── Marking / territory inscription ─────────────────────────────────
  if (c.territoryClaim !== null
      && (c.genome.personality === 'Territorial' || c.genome.personality === 'Aggressive')
      && Math.random() < 0.18) return 'marking'

  // ── Predator alert ───────────────────────────────────────────────────
  if (c.stress > 55 && c.health > 35
      && (c.genome.personality === 'Timid' || c.genome.personality === 'Furtive')
      && Math.random() < 0.20) return 'predator_alert'

  // ── Listening ────────────────────────────────────────────────────────
  if (c.state === 'idle' && c.stress > 30 && c.stress < 65
      && Math.random() < 0.12) return 'listening'

  // ── Seasonal turn ────────────────────────────────────────────────────
  if (c.role === 'elder' || c.role === 'shaman') {
    if (Math.random() < 0.12) return 'seasonal_turn'
  }

  // ── Offering ─────────────────────────────────────────────────────────
  if (c.carrying === 'fruit' && Math.random() < 0.25) return 'offering'

  // ── Lineage pride ────────────────────────────────────────────────────
  if (c.generation >= 3 && c.offspringIds.length >= 2
      && (c.role === 'elder' || c.role === 'guardian')
      && Math.random() < 0.15) return 'lineage_pride'

  // ── Decay & growth ───────────────────────────────────────────────────
  if (c.state === 'dreaming' && c.role !== 'shaman' && Math.random() < 0.20) return 'decay_growth'

  // ── Waxing / waning ──────────────────────────────────────────────────
  if (c.hunger < 20 && c.health > 75 && Math.random() < 0.10) return 'waxing'
  if (c.bonds.length > 0
      && c.bonds.some(b => b.strength > 60)
      && c.age > c.maxAge * 0.65
      && Math.random() < 0.15) return 'waning'

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
// ─── Behavior-history role weights ───────────────────────────────────────────
// Roles are not fixed personality→title mappings. They emerge from what the
// creature has actually done. Each role has a score computed from behavioral
// evidence; the highest scorer wins. Genome biases the starting weights but
// cannot lock a creature into a role — actions override genetics over time.
//
// Evidence sources:
//   killCount         — defensive history (guardian)
//   offspringIds      — reproductive investment (nurturer/healer)
//   messagesSent      — communicative history (shaman/elder)
//   bonds.length      — social investment (nurturer)
//   sentience         — reflective depth (elder/shaman)
//   age               — survival depth (elder)
//   experienceWeight  — breadth of life events (shaman)
//   generation        — lineage depth (elder)

export function assignRole(c: Creature, _tribeSize: number, lineageCount: number): CommunityRole | undefined {
  const { personality, body, mind } = c.genome

  // Recluse is a behavioral commitment, not a genetic destiny — but persistent
  // social withdrawal (very few bonds, no messages sent) earns it organically too.
  const isRecluse = personality === 'Recluse'
    || (c.bonds.filter(b => b.strength >= 20).length === 0 && c.messagesSent === 0 && c.age > 20)
  if (isRecluse) return 'recluse'

  // ── Score each role from behavioral evidence ──────────────────────────────
  const scores: Record<CommunityRole, number> = {
    elder: 0, shaman: 0, guardian: 0, nurturer: 0,
    healer: 0, scout: 0, forager: 0, recluse: 0,
  }

  // ELDER — earned through survival depth, generational witness, and cognitive seniority
  // Genome Sentinel is a bias, not a requirement; any creature that has survived long
  // enough and witnessed enough becomes a cultural anchor.
  scores.elder += mind === 'Sentinel' ? 15 : mind === 'Dreaming' ? 8 : 2
  scores.elder += Math.min(20, c.age * 0.12)                         // long survival
  scores.elder += Math.min(15, c.sentience * 0.18)                   // cognitive depth
  scores.elder += Math.min(10, c.generation * 1.5)                   // lineage depth
  scores.elder += Math.min(10, lineageCount * 2.0)                   // witnessed many lineages
  scores.elder += c.messagesSent >= 5 ? 8 : 0                        // has communicated

  // SHAMAN — pattern-readers and memory-keepers; broad experience + communication
  scores.shaman += (personality === 'Curious' || personality === 'Wanderer') ? 12 : 3
  scores.shaman += (mind === 'Dreaming' || mind === 'Sentinel') ? 10 : 2
  scores.shaman += Math.min(15, (c.experienceWeight ?? 0) * 0.15)    // breadth of experience
  scores.shaman += Math.min(10, c.messagesSent * 1.2)                // communicative history
  scores.shaman += c.sentience >= 50 ? 8 : 0                         // deep enough to interpret

  // GUARDIAN — proven through combat history and territorial behavior
  scores.guardian += (personality === 'Aggressive' || personality === 'Territorial') ? 14 : 3
  scores.guardian += body === 'Spike' ? 8 : 0
  scores.guardian += Math.min(20, c.killCount * 3)                   // combat history is primary
  scores.guardian += c.territoryClaim !== null ? 6 : 0               // actively holds territory

  // HEALER — proven through offspring survival and care investment
  scores.healer += personality === 'Nurturing' ? 12 : personality === 'Empath' ? 9 : 2
  scores.healer += mind === 'Dreaming' ? 8 : 0
  scores.healer += Math.min(20, c.offspringIds.length * 3)           // reproductive investment
  scores.healer += c.bonds.filter(b => b.strength >= 50).length * 3  // deep bonds = care history

  // NURTURER — social investment without the specialization depth of healer
  scores.nurturer += personality === 'Nurturing' ? 10 : personality === 'Social' ? 7 : 2
  scores.nurturer += Math.min(12, c.offspringIds.length * 2)
  scores.nurturer += c.bonds.filter(b => b.strength >= 35).length * 2

  // SCOUT — ranging history and perceptual acuity
  scores.scout += body === 'Wisp' ? 12 : 0
  scores.scout += (personality === 'Wanderer' || personality === 'Curious') ? 10 : 3
  scores.scout += c.generation >= 2 ? 6 : 0                          // survived long enough to range
  scores.scout += Math.min(10, ((c.experienceLog?.discovered_biome !== undefined) ? 10 : 0))

  // FORAGER — resource acquisition history
  scores.forager += (personality === 'Wanderer' || personality === 'Greedy' || personality === 'Hoarder') ? 12 : 3
  scores.forager += body === 'Spore' ? 6 : 0
  scores.forager += c.carrying !== undefined ? 4 : 0                 // actively gathering right now

  // ── Pick the highest-scoring role ─────────────────────────────────────────
  // Elder and shaman require minimum cognitive depth — genome can't shortcut this.
  if (scores.elder < 25 && scores.shaman < 20) {
    scores.elder = 0
    scores.shaman = 0
  }
  if (c.sentience < 30) { scores.elder = 0; scores.shaman = 0 }

  const roles = Object.entries(scores) as [CommunityRole, number][]
  roles.sort((a, b) => b[1] - a[1])

  const [best] = roles[0]
  // Minimum score threshold — creatures with no strong behavioral signal get no role
  if (roles[0][1] < 10) return undefined
  return best
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
  if (personality === 'Nurturing')   seeds.push('❤️', '🌱', '😊', '😌', '💔', '🐣')
  if (personality === 'Aggressive')  seeds.push('⚠️', '💥', '😤', '💢')
  if (personality === 'Curious')     seeds.push('👁️', '✨', '❓', '😮', '👀')
  if (personality === 'Wanderer')    seeds.push('🐾', '🏔️', '💨', '👀')
  if (personality === 'Timid')       seeds.push('😰', '🌑', '😱', '💤', '🥶', '😔')
  if (personality === 'Greedy')      seeds.push('🍎', '🌿', '😊')
  if (personality === 'Lazy')        seeds.push('😴', '🪨', '😌')
  if (personality === 'Hoarder')     seeds.push('🍎', '😤', '💤', '💢')  // food-possessive, guarding
  if (personality === 'Empath')      seeds.push('❤️', '😰', '😌', '💔', '😔')  // feeling others' pain and grief
  if (personality === 'Furtive')     seeds.push('🌑', '🌫️', '💨', '🫣', '👀') // shadow, mist, covert observation
  if (personality === 'Territorial') seeds.push('⚠️', '💥', '😤', '💢')  // claim, fight, assert
  if (personality === 'Social')      seeds.push('❤️', '😊', '👁️', '👀', '😮') // connection, joy, excitable watching
  if (personality === 'Stoic')       seeds.push('😌', '🌞', '🪨')        // calm endurance, steadiness
  // Recluse gets very few words — they don't engage much
  if (personality === 'Recluse')     seeds.push('🌑', '🪨', '😌', '😔')

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