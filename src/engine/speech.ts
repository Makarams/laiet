import { Creature, CommunityRole, MindTrait, ExperienceEventType } from '@/types'

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

// ROLE_EMOJI has been removed. Roles no longer grant designer-curated symbol
// pools. A creature's vocabulary traces entirely to what they personally
// experienced (EXPERIENTIAL_SYMBOL_TABLE in tick.ts), what their parents
// passed on (inheritEmoji), what bonded peers taught them (learnFromNearby),
// and what their sentience unlocked from the tier pools (unlockTierEmoji).
// The role label is now purely a behavioural-history *summary*, not an
// active source of new knowledge.

// ─── Experience-aligned emoji unlock map ─────────────────────────────────────
// Maps each experience event type to emoji that conceptually align with it.
// When a creature unlocks a new symbol, if they have recent experiences, the
// unlock is biased toward concepts they've actually lived — not random acquisition.
export const EXPERIENCE_EMOJI_MAP: Partial<Record<ExperienceEventType, string[]>> = {
  bond_formed:         ['❤️', '💖', '🫶', '🪢', '😊', '👁️'],
  bond_lost:           ['💔', '🌘', '😔', '🦴', '🕊️', '😮'],
  witnessed_death:     ['💀', '🕊️', '🦴', '😔', '😱', '🌑'],
  raised_offspring:    ['🐣', '🌱', '❤️', '🫶', '🤲', '😊'],
  survived_starvation: ['🍎', '😰', '💀', '🌱', '💪', '😌'],
  survived_combat:     ['🩸', '💥', '😌', '💪', '😤', '🛡️'],
  discovered_biome:    ['🗺️', '🌊', '🏔️', '🌳', '🐾', '👁️'],
  long_solitude:       ['🌑', '🪨', '😔', '🐚', '💤', '😌'],
  caretaker_contact:   ['🌀', '✨', '👆', '🌠', '❓', '👁️'],
  cross_lineage_bond:  ['🌍', '🔗', '🧬', '💖', '🌈', '🧿'],
}

// ─── Composition-based speech ────────────────────────────────────────────────
//
// Speech is *composed* tick by tick from real state, not selected from
// authored sentence templates. The pipeline:
//
//   deriveSpeechFocus(creature, state) → SpeechFocus | null
//   composeUtterance(creature, focus)  → string[]
//
// SpeechContext is preserved as a label for behavioral consequences (so the
// tick engine can route alarm calls and food calls to listeners), but no
// fixed SENTENCE_PATTERNS table dictates which tokens fire for which context.
// The primary token is the symbolic match for what the creature is currently
// experiencing or recently observed; modifiers come from drives; closers come
// from communicative intent. The result feels grammatical without being
// authored.

export type SpeechContext =
  | 'hungry'    | 'thirsty'    | 'cold'         | 'threat'
  | 'bonding'   | 'mourning'   | 'food_found'   | 'water_found'
  | 'birth'     | 'greeting'   | 'wonder'       | 'question_caretaker'
  | 'territory' | 'season'     | 'death_memory' | 'fire'
  | 'rain'      | 'drought'    | 'sick'         | 'playing'
  | 'stress'    | 'migration'  | 'mutation'     | 'dying'
  | 'storm'     | 'snow'       | 'content'      | 'scavenging'
  | 'healing'   | 'grooming'   | 'carrying'     | 'recovered'
  | 'fighting'  | 'fleeing'    | 'dominant'     | 'observing'
  | 'resting'   | 'exploring'  | 'warmth'       | 'building'
  | 'lineage_pride' | 'predator_alert' | 'seasonal_turn' | 'edge_witnessed'
  | 'caretaker_witnessed' | 'memory_event'

// What the creature wants to express; shapes which closing particles are used.
export type SpeechIntent = 'assert' | 'ask' | 'warn' | 'mourn' | 'share' | 'neutral'

export interface SpeechFocus {
  context: SpeechContext   // for downstream listener routing
  primary: string           // anchor token (must be in known vocab or a universal)
  secondary?: string        // optional second concept the creature is also tracking
  intent: SpeechIntent
  urgency: number           // 0..1 — scales talker probability and modifier reach
}

/* SENTENCE_PATTERNS removed — speech is now composed, not selected. The
   per-context emoji palette below is preserved as a *concept→symbol palette*
   that the composer draws from when picking a primary token. This is a
   translation lookup (the engine doesn't speak emoji natively), not a
   sentence template. The composer chooses ONE token from the palette,
   filtered by what the speaker actually knows. */
const _CONCEPT_PALETTE: Record<SpeechContext, string[]> = {
  hungry:        ['🍎', '🌳'],
  thirsty:       ['💧', '🌊'],
  cold:          ['❄️', '🥶', '🪨', '🌑'],
  threat:        ['⚠️', '💀', '🐾'],
  bonding:       ['❤️', '😊', '🫶', '💖'],
  mourning:      ['🦴', '💀', '💔', '🕊️'],
  food_found:    ['🍎', '🌳', '🌿', '✨'],
  water_found:   ['💧', '🌊'],
  birth:         ['🌱', '🐣', '❤️'],
  greeting:      ['👁️', '😊', '👀'],
  wonder:        ['✨', '🌀', '🌠', '🌈'],
  question_caretaker: ['👆', '🫵', '🔭', '🌍', '🌌'],
  territory:     ['🗺️', '🏔️', '🪨', '📍'],
  season:        ['🔄', '🌸', '🍁', '❄️', '🌒', '🌘'],
  death_memory:  ['🦴', '💀', '🌙', '🐚'],
  fire:          ['🔥', '🎇', '💨'],
  rain:          ['🌧️', '💧', '🌿'],
  drought:       ['🌾', '🥵', '🌞'],
  sick:          ['🤢', '🩸', '🤧', '🌿'],
  playing:       ['😊', '🌈', '💨'],
  stress:        ['😰', '💢', '⚠️'],
  migration:     ['🐾', '🏔️', '🌳', '🧭'],
  mutation:      ['🧬', '🦋', '✨'],
  dying:         ['💀', '❤️', '🌑'],
  storm:         ['🌪️', '🌩️', '🌧️', '⚠️'],
  snow:          ['❄️', '💤', '🧊'],
  content:       ['😊', '😌', '🌞'],
  scavenging:    ['💀', '🍎', '🦴'],
  healing:       ['🌿', '🩹', '😌'],
  grooming:      ['🫶', '❤️', '😌'],
  carrying:      ['🤲', '🐾', '🌿'],
  recovered:     ['😌', '💫', '🌱'],
  fighting:      ['💥', '😤', '💢'],
  fleeing:       ['😱', '💨', '😰'],
  dominant:      ['❗', '😤', '💪', '🏔️'],
  observing:     ['👁️', '🔭', '🌌'],
  resting:       ['😴', '💤', '😌'],
  exploring:     ['❓', '🐾', '✨', '🧭'],
  warmth:        ['🌞', '🪨', '😌'],
  building:      ['🪸', '🫳', '💪'],
  lineage_pride: ['🦴', '🧬', '💖'],
  predator_alert:['🦁', '⚠️', '😱'],
  seasonal_turn: ['🍁', '🌸', '🔄'],
  edge_witnessed:['🌁', '🏔️', '🌌', '🕳️'],
  caretaker_witnessed: ['🌀', '🪄', '👆', '🌠'],
  memory_event:  ['🦴', '⏳', '🐚'],
}

/* OLD SENTENCE_PATTERNS table — preserved here as commented documentation
   so editors can see the original phrasing intent for each context. The
   composer below does not reference it. */
/*
const _LEGACY_SENTENCE_PATTERNS_REFERENCE_ONLY: Record<string, string[][]> = {
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
*/

// ─── Universals — symbols every creature can produce ────────────────────────
// These are logical primitives, not vocabulary. A creature with three words
// can still ask a question (❓) or assert a claim (❗).
const UNIVERSALS = new Set(['❓', '❗', '⚠️', '🚫', '➡️', '⬆️', '⬇️'])

// Pick the best concept token for a context: filter the palette down to what
// the creature actually knows; fall back to a universal if the palette is
// inaccessible. Returns null when the creature has nothing to say.
function pickPaletteToken(ctx: SpeechContext, known: Set<string>): string | null {
  const palette = _CONCEPT_PALETTE[ctx] ?? []
  // First, prefer a learned token (carries lived meaning for the creature)
  for (const t of palette) {
    if (known.has(t)) return t
  }
  // Fall back to a universal if the palette has none
  for (const t of palette) {
    if (UNIVERSALS.has(t)) return t
  }
  return null
}

// Drives → modifier token mapping. When a drive is strongly expressed (>0.55),
// the speaker prepends or weaves in its associated concept token if known.
// This is how individuality colors the same context: a high-vigilance creature
// describing food adds a danger qualifier; a high-sociality creature adds an
// affection qualifier; a high-curiosity creature adds an interrogative.
const DRIVE_MODIFIERS: Record<keyof import('@/types').CreatureDrives, string[]> = {
  vigilance:   ['👁️', '⚠️', '🦻'],
  sociality:   ['❤️', '🫶', '😊'],
  curiosity:   ['❓', '✨', '👀'],
  dominance:   ['❗', '😤', '💪'],
  reclusion:   ['🌑', '🤫', '😔'],
  acquisitive: ['🍎', '🤲', '🌾'],
  mobility:    ['🐾', '💨', '🏃'],
}

// Closing particle for the speaker's communicative intent. Universals are
// always available so even minimal-vocab creatures can question or assert.
function intentParticle(intent: SpeechIntent): string | null {
  switch (intent) {
    case 'ask':    return '❓'
    case 'assert': return '❗'
    case 'warn':   return '⚠️'
    case 'mourn':  return null   // grief carries no particle; the symbol itself speaks
    case 'share':  return null   // sharing is implied by the offering token in the palette
    case 'neutral':return null
  }
}

// ─── Speech focus — derived from real state, not from authored cascades ─────
// Priority order is still encoded here but each branch returns a structured
// SpeechFocus pointing at a context palette + intent, instead of choosing a
// pre-written sentence template. Creatures with no relevant vocabulary for
// the chosen context still produce a graceful fallback via the composer.
export function deriveSpeechFocus(c: Creature, awarenessStage: number): SpeechFocus | null {
  const drives = c.drives
  // Reclusion drive damps speech rate; recluses speak rarely regardless of role.
  if (drives && drives.reclusion > 0.75 && Math.random() > 0.10) return null

  // Helper: peek the most recent personal observation matching a kind filter
  const recentObs = (kinds: string[], windowDays = 12) => {
    const log = c.observedEvents ?? []
    for (let i = log.length - 1; i >= 0; i--) {
      const o = log[i]
      if (kinds.includes(o.kind as string) && Math.abs(awarenessStage) >= 0) {
        if ((o.day === undefined) || true) return o
      }
      // Ignore window check here; we only look at the tail of the ring anyway
      void windowDays
    }
    return null
  }

  // ── Highest-priority biological imperatives ──────────────────────────────
  if (c.state === 'dying' && Math.random() < 0.18) {
    return { context: 'dying', primary: '💀', intent: 'mourn', urgency: 1.0 }
  }
  if (c.state === 'mourning') {
    return { context: 'mourning', primary: '💔', intent: 'mourn', urgency: 0.8 }
  }
  if (c.state === 'sick' && c.health < 35) {
    return { context: 'sick', primary: '🤢', intent: 'warn', urgency: 0.9 }
  }
  if (c.hunger > 80) {
    return { context: 'hungry', primary: '🍎', intent: 'ask', urgency: 0.9 }
  }
  if (c.thirst > 80) {
    return { context: 'thirsty', primary: '💧', intent: 'ask', urgency: 0.9 }
  }
  if (c.warmth < 18) {
    return { context: 'cold', primary: '❄️', intent: 'warn', urgency: 0.9 }
  }

  // ── State-driven contexts (the creature speaks while doing) ───────────────
  if (c.state === 'fighting') {
    const hasBondedFoe = c.bonds.some(b => b.strength > 40)
    return {
      context: 'fighting', primary: '💥',
      intent: hasBondedFoe ? 'mourn' : 'assert',
      urgency: 0.8,
    }
  }
  if (c.state === 'fleeing') {
    return { context: 'fleeing', primary: '😱', intent: 'warn', urgency: 0.85 }
  }
  if (c.state === 'scavenging') {
    return { context: 'scavenging', primary: '💀', intent: 'neutral', urgency: 0.5 }
  }
  if (c.state === 'grooming') {
    return { context: 'grooming', primary: '🫶', intent: 'share', urgency: 0.4 }
  }
  if (c.state === 'playing') {
    return { context: 'playing', primary: '😊', intent: 'share', urgency: 0.4 }
  }
  if (c.state === 'bonding') {
    return { context: 'bonding', primary: '❤️', intent: 'share', urgency: 0.5 }
  }
  if (c.state === 'observing') {
    return { context: 'observing', primary: '👁️', intent: awarenessStage >= 3 ? 'ask' : 'neutral', urgency: 0.5 }
  }
  if (c.state === 'dreaming') {
    return { context: 'death_memory', primary: '🦴', intent: awarenessStage >= 3 ? 'ask' : 'mourn', urgency: 0.5 }
  }
  if (c.state === 'building' || c.state === 'harvesting') {
    return { context: 'building', primary: '🪸', intent: 'assert', urgency: 0.4 }
  }
  if (c.state === 'seeking_healroot' || c.carrying === 'healroot') {
    return { context: 'healing', primary: '🌿', intent: 'share', urgency: 0.4 }
  }
  if (c.state === 'seeking_food' && c.hunger < 35) {
    return { context: 'food_found', primary: '🍎', intent: 'share', urgency: 0.6 }
  }
  if (c.state === 'seeking_water' && c.thirst < 35) {
    return { context: 'water_found', primary: '💧', intent: 'share', urgency: 0.6 }
  }

  // ── Recent observations — let the creature voice what it just witnessed ──
  const fireObs = recentObs(['witnessed_fire', 'fire_outbreak'])
  if (fireObs && Math.random() < 0.35) {
    return { context: 'fire', primary: '🔥', intent: 'warn', urgency: 0.6 }
  }
  const lightObs = recentObs(['witnessed_lightning', 'lightning_strike'])
  if (lightObs && Math.random() < 0.30) {
    return { context: 'storm', primary: '🌩️', intent: 'warn', urgency: 0.5 }
  }
  const edgeObs = recentObs(['reached_edge', 'edge_encounter'])
  if (edgeObs && c.genome.mind !== 'Feral' && Math.random() < 0.30) {
    return { context: 'edge_witnessed', primary: '🌁',
      intent: awarenessStage >= 3 ? 'ask' : 'neutral', urgency: 0.4 }
  }
  const careObs = recentObs(['caretaker_contact'])
  if (careObs && c.genome.mind === 'Sentinel' && awarenessStage >= 3 && Math.random() < 0.25) {
    return { context: 'question_caretaker', primary: '👆', intent: 'ask', urgency: 0.5 }
  }

  // ── Sub-critical needs ───────────────────────────────────────────────────
  if (c.hunger > 60) return { context: 'hungry',  primary: '🍎', intent: 'ask',  urgency: 0.6 }
  if (c.thirst > 60) return { context: 'thirsty', primary: '💧', intent: 'ask',  urgency: 0.6 }
  if (c.warmth < 28) return { context: 'cold',    primary: '❄️', intent: 'warn', urgency: 0.6 }
  if (c.stress > 70) return { context: 'stress',  primary: '😰', intent: 'warn', urgency: 0.6 }

  // ── Drive-led ambient expression (the creature speaks because of who they are) ──
  if (drives) {
    // Vigilance dominates → boundary watch / alarm tone
    if (drives.vigilance > 0.65 && c.stress > 30 && Math.random() < 0.18) {
      return { context: 'observing', primary: '👁️', intent: 'neutral', urgency: 0.3 }
    }
    // Sociality dominates → greeting / bonding while at rest
    if (drives.sociality > 0.65 && c.bonds.length > 0 && Math.random() < 0.16) {
      return { context: 'greeting', primary: '😊', intent: 'share', urgency: 0.3 }
    }
    // Curiosity dominates → exploratory wonder
    if (drives.curiosity > 0.65 && (c.state === 'wandering' || c.state === 'migrating')
        && Math.random() < 0.20) {
      return { context: 'exploring', primary: '❓', intent: 'ask', urgency: 0.3 }
    }
    // Dominance + held territory → marking / assertion
    if (drives.dominance > 0.65 && c.territoryClaim !== null && Math.random() < 0.18) {
      return { context: 'territory', primary: '🗺️', intent: 'assert', urgency: 0.3 }
    }
    // Acquisitive + carrying fruit → offering
    if (drives.acquisitive > 0.6 && c.carrying === 'fruit' && Math.random() < 0.25) {
      return { context: 'food_found', primary: '🤲', intent: 'share', urgency: 0.4 }
    }
  }

  // ── Mutation-aware speech (the creature itself just changed) ─────────────
  if (c.recentMutation !== undefined && Math.random() < 0.30) {
    return { context: 'mutation', primary: '🧬', intent: 'ask', urgency: 0.4 }
  }

  // ── Sentinel/Dreaming ambient wonder ─────────────────────────────────────
  if (c.genome.mind === 'Sentinel' && awarenessStage >= 4 && Math.random() < 0.18) {
    return { context: 'wonder', primary: '🌌', intent: 'ask', urgency: 0.3 }
  }
  if (c.genome.mind === 'Dreaming' && Math.random() < 0.20) {
    return { context: 'wonder', primary: '✨', intent: 'ask', urgency: 0.3 }
  }

  // ── Wellbeing fallbacks ──────────────────────────────────────────────────
  if (c.needSatisfaction > 75 && c.bonds.length > 0 && Math.random() < 0.20) {
    return { context: 'content', primary: '😊', intent: 'neutral', urgency: 0.2 }
  }
  if (c.state === 'idle' && c.needSatisfaction > 65 && Math.random() < 0.10) {
    return { context: 'resting', primary: '😌', intent: 'neutral', urgency: 0.2 }
  }
  return null
}

// Backward-compat alias for callers that only need the context label
// (used by tick.ts listener-consequences routing). Returns the focus's
// context string or null when no focus exists this tick.
export function getSpeechContext(c: Creature, awarenessStage: number): SpeechContext | null {
  return deriveSpeechFocus(c, awarenessStage)?.context ?? null
}

// ─── Compose an utterance from a focus + the creature's known vocab ─────────
// Tokens are assembled, not selected:
//   [optional drive modifier]  the speaker's individuality
//   [primary focus token]      what they're actually responding to
//   [optional secondary token] richer minds can carry two concepts
//   [optional intent particle] ❓ ❗ ⚠️ closing
//
// Max length scales with mind depth and sentience so a Feral creature emits a
// single grunt while a fully-realised Sentinel can carry a 4-token utterance.
// Universals (❓ ❗ ⚠️) can be produced regardless of learned vocabulary —
// they're logical primitives the body knows how to express.
export function composeUtterance(c: Creature, focus: SpeechFocus): string[] {
  const known = new Set(c.knownEmoji)
  const tokens: string[] = []

  // 1. Drive modifier prefix — only when the focus has at least medium urgency
  //    and the speaker has a strongly expressed drive that semantically fits.
  if (c.drives && focus.urgency >= 0.35) {
    // Find the strongest drive at expression threshold; ignore reclusion (it
    // already gated speech entirely) and acquisitive (already in palette).
    const candidates = ['vigilance', 'sociality', 'curiosity', 'dominance', 'mobility'] as const
    let strongest: typeof candidates[number] | null = null
    let strongestVal = 0.55
    for (const k of candidates) {
      const v = c.drives[k] ?? 0
      if (v > strongestVal) { strongestVal = v; strongest = k }
    }
    if (strongest) {
      const modOptions = DRIVE_MODIFIERS[strongest]
      const mod = modOptions.find(t => known.has(t) || UNIVERSALS.has(t))
      // Only prepend ~50% of the time so utterances vary
      if (mod && mod !== focus.primary && Math.random() < 0.5) tokens.push(mod)
    }
  }

  // 2. Primary anchor — prefer the focus.primary if known; else fall back to
  //    any token from the focus context palette the creature does know; else
  //    emit a universal that matches the intent.
  let anchor: string | null = null
  if (known.has(focus.primary) || UNIVERSALS.has(focus.primary)) {
    anchor = focus.primary
  } else {
    anchor = pickPaletteToken(focus.context, known)
  }
  if (!anchor) {
    // Last resort: emit a universal mapped to intent so we don't drop silent
    anchor = intentParticle(focus.intent) ?? c.knownEmoji[0] ?? null
  }
  if (anchor) tokens.push(anchor)

  // 3. Secondary token — richer minds carry a paired concept (the second
  //    thing they're tracking). Sentinel sentience > 50 can produce four
  //    tokens with both a modifier and a secondary.
  const mind = c.genome.mind
  const canPair = mind === 'Sentinel' || (mind === 'Dreaming' && c.sentience > 40)
  if (canPair && focus.secondary && (known.has(focus.secondary) || UNIVERSALS.has(focus.secondary))) {
    if (!tokens.includes(focus.secondary)) tokens.push(focus.secondary)
  } else if (canPair && focus.urgency > 0.5) {
    // Improvise a secondary from the context palette — pick the second
    // available token that isn't already in the utterance.
    const palette = _CONCEPT_PALETTE[focus.context] ?? []
    for (const p of palette) {
      if ((known.has(p) || UNIVERSALS.has(p)) && !tokens.includes(p)) {
        tokens.push(p)
        break
      }
    }
  }

  // 4. Closing particle from intent — universal so always emittable
  const closer = intentParticle(focus.intent)
  if (closer && !tokens.includes(closer)) {
    // Only some utterances need the closer; high urgency or ask/warn intents always do
    const needsCloser = focus.intent === 'ask' || focus.intent === 'warn'
      || (focus.intent === 'assert' && focus.urgency > 0.5)
    if (needsCloser) tokens.push(closer)
  }

  // 5. Cap length by *actual* cognitive depth — not by mind class. A creature's
  // ability to chain symbols is a function of how much sentience they've grown
  // and how many symbols they actually know. Mind class still affects sentience
  // growth rate elsewhere, so Sentinels naturally end up with longer utterances
  // — but the ceiling is now earned, not assigned.
  const knownDepth = c.knownEmoji.length
  const maxLen = mind === 'Feral' ? 1
    : c.sentience >= 70 && knownDepth >= 18 ? 4
    : c.sentience >= 40 && knownDepth >= 10 ? 3
    : c.sentience >= 15 || knownDepth >= 4 ? 2
    : 1
  if (tokens.length > maxLen) tokens.length = maxLen

  return tokens
}

// Backward-compat shim — buildSentence(c, context) → composeUtterance via focus.
// Used only by tests and legacy callers; the live tick should call composeUtterance directly.
export function buildSentence(c: Creature, context: SpeechContext): string[] {
  const focus: SpeechFocus = {
    context,
    primary: _CONCEPT_PALETTE[context]?.[0] ?? '✨',
    intent: 'neutral',
    urgency: 0.4,
  }
  return composeUtterance(c, focus)
}

/* ─── Legacy getSpeechContext + buildSentence removed ──────────────────────
   The previous implementation was a 150-line if/else cascade returning a
   string label, then a template-pick from SENTENCE_PATTERNS. Both have been
   replaced above by deriveSpeechFocus + composeUtterance, which build
   utterances from the creature's live state, drives, and known vocabulary.
   This block intentionally contains nothing; it preserves the line gap so
   nearby comments still anchor correctly. */

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

export function assignRole(
  c: Creature,
  _tribeSize: number,
  lineageCount: number,
  roleCounts?: Partial<Record<string, number>>
): CommunityRole | undefined {
  const { personality, body, mind } = c.genome

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

  // RECLUSE — social withdrawal earned through behavior, not locked by genome
  // Recluse personality is a strong but not absolute signal; isolated behavior confirms it.
  scores.recluse += personality === 'Recluse' ? 22 : 0
  scores.recluse += c.bonds.filter(b => b.strength >= 20).length === 0 ? 10 : 0
  scores.recluse += c.messagesSent === 0 && c.age > 20 ? 8 : 0
  scores.recluse += c.stress > 60 && c.bonds.length === 0 ? 5 : 0
  scores.recluse += (personality === 'Furtive' || personality === 'Timid')
    && c.bonds.filter(b => b.strength >= 30).length === 0 ? 6 : 0

  // ── No gap-filling: the colony cannot "appoint" a role by need alone ─────
  // A creature with no behavioral signal for guardian does not become one
  // just because the colony lacks one. Roles must be earned through actual
  // history; if no creature qualifies, the role stays absent. This is what
  // makes a Sentinel-deprived colony genuinely fragile to boundary events.
  void roleCounts

  // ── Pick the highest-scoring role ─────────────────────────────────────────
  // Elder and shaman require minimum cognitive depth — genome can't shortcut this.
  if (scores.elder < 25 && scores.shaman < 20) {
    scores.elder = 0
    scores.shaman = 0
  }
  if (c.sentience < 30) { scores.elder = 0; scores.shaman = 0 }

  const roleEntries = Object.entries(scores) as [CommunityRole, number][]
  roleEntries.sort((a, b) => b[1] - a[1])

  const [best] = roleEntries[0]
  // Minimum score threshold — creatures with no strong behavioral signal get no role
  if (roleEntries[0][1] < 10) return undefined
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
// A creature crystallizes new concepts as sentience deepens. When the creature
// has recent experiences, the unlock is biased toward concepts they have lived
// rather than random acquisition — vocabulary grows from life, not luck.
export function unlockTierEmoji(c: Creature, rng: () => number, currentDay: number): string | null {
  const known = new Set(c.knownEmoji)

  // Build a weighted candidate list biased by experience log
  function pickFromPool(pool: string[], chance: number): string | null {
    const missing = pool.filter(e => !known.has(e))
    if (missing.length === 0 || rng() >= chance) return null

    // Collect experience-aligned emoji the creature hasn't learned yet
    const expLog = c.experienceLog ?? {}
    const aligned: string[] = []
    for (const [evType, day] of Object.entries(expLog) as [ExperienceEventType, number][]) {
      // Only count experiences from the last 80 game-days as shaping recent thought
      if (day !== undefined && day >= currentDay - 80) {
        const candidates = EXPERIENCE_EMOJI_MAP[evType] ?? []
        for (const e of candidates) {
          if (missing.includes(e)) aligned.push(e)
        }
      }
    }

    // 60% chance to pick an experience-aligned emoji if available; else random
    if (aligned.length > 0 && rng() < 0.6) {
      return aligned[Math.floor(rng() * aligned.length)]
    }
    return missing[Math.floor(rng() * missing.length)]
  }

  if (c.sentience > 75 && c.genome.mind === 'Sentinel') {
    const result = pickFromPool(EMOJI_TIER_3, 0.002)
    if (result) return result
  }
  if (c.sentience > 50) {
    const result = pickFromPool(EMOJI_TIER_2, 0.003)
    if (result) return result
  }
  if (c.sentience > 20) {
    const result = pickFromPool(EMOJI_TIER_1, 0.005)
    if (result) return result
  }
  // No role-bonus pool. Symbol acquisition is governed entirely by
  // EXPERIENTIAL_SYMBOL_TABLE (in tick.ts, fires when actual conditions hold)
  // and by sentience-gated tier unlock (above). What a creature knows traces
  // to what they lived through, not what label they carry.

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