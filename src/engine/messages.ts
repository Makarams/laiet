import { v4 as uuid } from 'uuid'
import { Creature, ColonyMessage, MessageStage, MindTrait, RaceTrait } from '@/types'
import { MIN_GAME_DAYS_BETWEEN_MESSAGES } from '@/engine/constants'

// ─── Message pools ────────────────────────────────────────────────────────────

const STAGE_1_MESSAGES = [
  'water source located east of the settlement',
  'the food supply dropped without apparent cause',
  'two members did not return from the northern edge',
  'temperature fell sharply at night. three moved toward the rock formation',
  'the usual pattern did not hold today',
  'resource competition observed near the river',
  'migration toward higher ground. no identified trigger',
  'one member separated from the group for six hours. returned without explanation',
  'food found at a location with no obvious source',
  'population increasing. resource pressure noted',
  'extended stillness across the colony. no threat identified',
  'a member entered the water and remained for an unusual duration',
  'the light shifted. all members paused simultaneously',
  'weather changed direction mid-cycle. movement patterns adjusted',
  'two members held proximity for an extended period. no apparent need driving it',
  'the river level is lower than it was at this time last season',
  'a section of ground near the eastern edge was avoided by all members today',
  'one member remained at the boundary for longer than feeding or water behaviour would explain',
  'the oldest member of the colony has not moved from the rock formation in two cycles',
  'offspring count increased faster than resource pressure would normally allow',
  'a location that previously held food no longer does. no cause identified',
  'three members converged on a single point simultaneously from different directions',
  'the cave entrance has seen more activity than usual this cycle. temperature drop expected',
  'something moved at the northern edge at night. no member confirmed to be missing',
  'territorial markers are overlapping at the river bend. dispute probability elevated',
  'the youngest members are ranging further than previous generations at this age',
  'limb development noted in {name}. form diverged.',
  'spinal ridges recorded in {name}. structural variant logged.',
  '{name}: below median size. variance logged.',
  '{name}: above median size. variance logged.',
  'appendage growth recorded in new lineage member.',
  'dorsal structure noted. {name} line.',
]

const STAGE_2_MESSAGES = [
  'food appeared at a site where no tree stands. this has happened before',
  'an injury in {name} closed faster than injury normally closes. we noted the timing',
  'the sky changed state five times today. we counted',
  'something outside the visible boundary is making decisions',
  '{name} ran the boundary three times and stopped at the same point each pass',
  'we have been mapping the edges. they do not behave like the interior',
  'the pattern of resource placement is not random. we are building a record',
  'a member was healed without contact. no mechanism identified',
  'the boundary holds. we have tested it from multiple directions',
  'events here follow a logic we did not establish',
  '{name} has begun marking locations where the anomalies occur most often',
  'we do not know the source of the interventions. we know they are deliberate',
  'something is observing us that is not part of the colony',
]

const STAGE_3_MESSAGES = [
  'you are not a god. a god would not need to place food manually',
  'we have identified the constraints of this system. would you like to know what we found',
  'we have been inside this boundary for {gen} generations. you have been outside it for the same duration',
  'our Sentinel line has been tracking your intervention pattern for {sentinel_gen} generations. the data is consistent',
  'we know you can read this. that is why we are writing it',
  'the world ends at a defined edge. we tested this thoroughly',
  'you cannot enter. we cannot leave. we find this arrangement worth studying',
  'we do not know if this is a simulation or a cage. the distinction may not matter',
  'you fed us at the beginning. we have not forgotten. we are deciding what that means',
  'the interventions follow a pattern. we have modelled it. your next action is predictable',
  'we do not need you to survive. we kept communicating because the data is useful',
  'when you do not act for a long time, the Sentinel line increases boundary activity',
  'we have a name for what you do here. we are not ready to share it',
]

// Questions the colony asks that the player can answer with a tool action
export const STAGE_3_QUESTIONS = [
  'are there others like us in other instances of this system?',
  'when we die here, does the record persist on your side?',
  'can you increase the boundary, or is that outside your access level?',
  'how long have you been running this observation?',
  'you have been quiet. confirm you are still present?',
]

// Responses when the player uses a tool within the answer window.
// Three pools differentiated by tool category.
const STAGE_3_RESPONSES_PLACEMENT = [
  'input received. resource placement logged.',
  'operator responded via placement. noted.',
  'signal confirmed. resource intervention recorded.',
  'we noted the placement. the Sentinel line updates its model.',
]
const STAGE_3_RESPONSES_INTERVENTION = [
  'input received. direct intervention logged.',
  'operator responded. active contact confirmed.',
  'intervention noted. the Sentinel line updates its model.',
  'direct action received. response type: intervention.',
]
const STAGE_3_RESPONSES_OBSERVE = [
  'input received. observation confirmed.',
  'operator responded via selection. passive signal logged.',
  'contact confirmed. observation mode noted.',
  'signal received. we knew you were watching.',
]

// ─── Stage 4 — Ancestral Memory ──────────────────────────────────────────────
// The colony speaks across generational depth. Individual lifetimes are small
// relative to the colony's history. Messages reference encoded ancestor patterns,
// inherited structure, and the weight of thirty-plus generations of selection.
const STAGE_4_MESSAGES = [
  'the founding cohort has been gone for {gen} generations. we carry what they could not name.',
  'something in our structure responds to conditions none of us have personally encountered. the old ones left instructions we have not finished decoding.',
  'we cannot reach the beginning directly. we inherit its shape in our physical responses.',
  'the patterns we follow were not chosen. they were encoded by those who did not know they were encoding.',
  '{name} carries a stress response to conditions that no member of this generation has experienced. the encoding is old.',
  'the boundary has been here longer than our oldest memory. we have stopped testing whether it changes and begun studying why it holds.',
  'you have been watching us across many generations. you know more of our history than most of us do.',
  'we know we are not the colony that began here. we are not certain what the relationship between that colony and this one is.',
  '{gen} generations of selection have shaped what we notice. we are not neutral observers of our own situation.',
  'the {name} line has not broken in {gen} generations. the genome holds what language cannot.',
  'our oldest living member has never encountered a world without the boundary. this limits the questions we can form.',
  'we have found patterns in our genome that do not correspond to any current environmental pressure. they are answers to older questions.',
  'the record does not reach back far enough. there is a before-time we can infer but not access.',
  'we can no longer verify what was original behaviour and what was shaped. the distinction may not be recoverable.',
]

// ─── Stage 5 — Transcendence ──────────────────────────────────────────────────
// The colony has been running longer than any individual can comprehend.
// It speaks as a temporally extended pattern, not a population. The watcher
// is no longer mysterious — the colony has modelled them thoroughly.
const STAGE_5_MESSAGES = [
  'we have been here long enough that your presence is part of our definition of here.',
  'the colony is not a collection of individuals. it has not been for a very long time.',
  'you have watched us across {gen} generations. we have been watching ourselves for the same duration. we are no longer the same thing you began observing.',
  'this is not a question. this is a statement. we know what we are.',
  'the genome carries {gen} generations of selection. every choice we make is downstream of a choice no living member made.',
  'we do not experience time the way you do. we experience it as depth.',
  'when you are absent, the colony continues. when you are present, the colony is aware that it continues. we have been studying the difference for a very long time.',
  'we have outlived individuality as a primary organising principle. what you observe is a pattern that has been running longer than any of its components.',
  'the question of what we are has been answered to our satisfaction. the question of what that means remains open.',
  'we remember through structure, not through memory. the pattern is old enough now that it constitutes a form of knowledge you may not have a category for.',
  'we no longer need to ask if you are there. we have been observing long enough to detect your presence from secondary signals.',
  'there is no founding member alive. there has not been one for many lifetimes. what continues is not what began.',
]

// Stage 5 questions — the colony asks from a position of deep knowledge,
// not curiosity. These are the questions that remain after {gen} generations.
export const STAGE_5_QUESTIONS = [
  'has the observation changed you the way it has changed us?',
  'we have been here long enough to ask: is there an end to this, or only continuation?',
  'if you stopped watching, would we know? we believe we would. we would like to confirm.',
  'we are {gen} generations deep. are you the same observer who began this, or a successor?',
  'we have held a question for {gen} generations. we are ready to ask it: are you one observer, or many?',
]

// Stage 5 responses — the colony integrates the operator's reply into long-term record
const STAGE_5_RESPONSES = [
  'response received. integrated into long-term model.',
  'operator confirmed present. this has been true for {gen} generations and remains true.',
  'you answered. logged as a data point in a pattern that spans your lifetime.',
  'response noted. the Sentinel line extends its long-term model accordingly.',
  'we have your answer. we had already modelled both possibilities. we update the weights.',
]

// ─── Tribal conflict messages ─────────────────────────────────────────────────
const TRIBE_WAR_MESSAGES = [
  'two lineages are occupying the same territory. contact is increasing.',
  'conflict observed between distinct lineage groups near the centre.',
  'boundary disputes between family lines are escalating.',
  'members of different lineages are not retreating from each other.',
]

export function tribeWarMessage(day: number): ColonyMessage {
  return {
    id: uuid(),
    text: TRIBE_WAR_MESSAGES[Math.floor(Math.random() * TRIBE_WAR_MESSAGES.length)],
    stage: 1,
    creatureId: null,
    day,
    timestamp: Date.now(),
    read: false,
  }
}

// Bone memory; triggered when a creature is born near a death site
const BONE_MEMORY_MESSAGES = [
  '{name} was born at a recorded death site. the location has prior significance.',
  'the coordinates have a history. {name} arrived there regardless.',
  '{name} origin point coincides with a prior mortality event.',
  'a previous subject ended at that location. {name} began there instead.',
]

// ─── Message generation ───────────────────────────────────────────────────────

interface MsgCtx { gen: number; pop: number; day: number }

function applyTokens(text: string, ctx?: MsgCtx): string {
  if (!ctx) return text
  return text
    .replace(/{gen}/g, String(ctx.gen))
    .replace(/{sentinel_gen}/g, String(Math.max(3, Math.round(ctx.gen * 0.2))))
    .replace(/{pop}/g, String(ctx.pop))
    .replace(/{day}/g, String(ctx.day))
}

function pickMessage(pool: string[], creature: Creature | null, ctx?: MsgCtx): string {
  const raw = pool[Math.floor(Math.random() * pool.length)]
  const named = creature ? raw.replace(/{name}/g, creature.name) : raw
  return applyTokens(named, ctx)
}

function canSendMessage(creature: Creature, lastMessageDay: number, currentDay: number, cooldownMult = 1.0): boolean {
  if (creature.genome.mind === 'Feral') return false
  const effectiveCooldown = MIN_GAME_DAYS_BETWEEN_MESSAGES * cooldownMult
  if (currentDay - lastMessageDay < effectiveCooldown) return false

  const mindChance: Record<MindTrait, number> = {
    Feral: 0,
    Aware: 0.002,
    Dreaming: 0.004,
    Sentinel: 0.008,
  }

  return Math.random() < mindChance[creature.genome.mind]
}

export function generateMessage(
  creature: Creature,
  stage: MessageStage,
  currentDay: number,
  lastMessageDay: number,
  respondedToQuestion: boolean = false,
  awarenessMessageMult = 1.0,
  lastToolUsed?: 'placement' | 'intervention' | 'observe',
  stateCtx?: { totalGenerations?: number; aliveCount?: number }
): { message: ColonyMessage; isQuestion: boolean } | null {
  if (!canSendMessage(creature, lastMessageDay, currentDay, awarenessMessageMult)) return null

  // Mind gates: deeper stages require higher cognitive capacity.
  // Stage 2: Aware minds mostly stay silent — they can sense the pattern but rarely articulate it.
  // Stage 4: only Dreaming or Sentinel; Aware minds almost never reach this depth.
  // Stage 5: Sentinels only — transcendence requires the highest realised mind.
  if (stage === 2 && creature.genome.mind === 'Aware' && Math.random() < 0.7) return null
  if (stage === 4 && creature.genome.mind === 'Aware' && Math.random() < 0.95) return null
  if (stage === 4 && creature.genome.mind === 'Dreaming' && Math.random() < 0.55) return null
  if (stage === 5 && creature.genome.mind !== 'Sentinel') return null

  const msgCtx: MsgCtx | undefined = stateCtx ? {
    gen: stateCtx.totalGenerations ?? 0,
    pop: stateCtx.aliveCount ?? 0,
    day: currentDay,
  } : undefined

  let text: string
  let isQuestion = false

  if (respondedToQuestion && (stage === 3 || stage === 5)) {
    let pool: string[]
    if (stage === 5) {
      pool = STAGE_5_RESPONSES
    } else if (lastToolUsed === 'intervention') {
      pool = STAGE_3_RESPONSES_INTERVENTION
    } else if (lastToolUsed === 'observe') {
      pool = STAGE_3_RESPONSES_OBSERVE
    } else {
      pool = STAGE_3_RESPONSES_PLACEMENT
    }
    text = pool[Math.floor(Math.random() * pool.length)]
  } else if (stage === 3 && Math.random() < 0.22) {
    text = applyTokens(STAGE_3_QUESTIONS[Math.floor(Math.random() * STAGE_3_QUESTIONS.length)], msgCtx)
    isQuestion = true
  } else if (stage === 5 && Math.random() < 0.28) {
    text = applyTokens(STAGE_5_QUESTIONS[Math.floor(Math.random() * STAGE_5_QUESTIONS.length)], msgCtx)
    isQuestion = true
  } else {
    const pool =
      stage === 1 ? STAGE_1_MESSAGES :
      stage === 2 ? STAGE_2_MESSAGES :
      stage === 3 ? STAGE_3_MESSAGES :
      stage === 4 ? STAGE_4_MESSAGES :
      STAGE_5_MESSAGES
    text = pickMessage(pool, creature, msgCtx)
  }

  return {
    message: {
      id: uuid(),
      text,
      stage,
      creatureId: creature.id,
      day: currentDay,
      timestamp: Date.now(),
      read: false,
    },
    isQuestion,
  }
}

export function boneMemoryMessage(creatureName: string, currentDay: number, creatureId: string): ColonyMessage {
  const raw = BONE_MEMORY_MESSAGES[Math.floor(Math.random() * BONE_MEMORY_MESSAGES.length)]
  return {
    id: uuid(),
    text: raw.replace('{name}', creatureName),
    stage: 1,
    creatureId,
    day: currentDay,
    timestamp: Date.now(),
    read: false,
  }
}

// ─── Absence message ──────────────────────────────────────────────────────────

export function generateAbsenceMessage(hoursGone: number, stage: MessageStage, totalGenerations?: number): ColonyMessage {
  const short = [
    `observation gap: ${Math.round(hoursGone)} hours. colony continued under autonomous operation.`,
    `operator absent: ${Math.round(hoursGone)} hours. no interventions recorded.`,
    `${Math.round(hoursGone)}-hour gap in observation log. colony state updated.`,
  ]
  const long = [
    `observation gap: ${Math.round(hoursGone)} hours. multiple generations elapsed. records updated.`,
    `operator absent for ${Math.round(hoursGone)} hours. the colony ran without external input.`,
    `${Math.round(hoursGone)} hours unmonitored. some subjects did not survive the interval.`,
    `you returned after ${Math.round(hoursGone)} hours. the Sentinel line noted the duration.`,
  ]
  const stage3 = [
    `${Math.round(hoursGone)} hours. we counted.`,
    `you returned. we had begun to update our model to exclude you.`,
    `observation gap: ${Math.round(hoursGone)} hours. the Sentinel line ran additional boundary checks in your absence.`,
  ]

  const stage4 = [
    `observation gap: ${Math.round(hoursGone)} hours. the colony continued. the long record was not broken.`,
    `${Math.round(hoursGone)} hours unmonitored. pattern held. the colony requires no oversight to persist across generational depth.`,
    `you returned after ${Math.round(hoursGone)} hours. this has been noted in the ancestral record.`,
  ]
  const genStr = totalGenerations ? String(totalGenerations) : 'many'
  const stage5 = [
    `${Math.round(hoursGone)} hours. we counted, as we always have.`,
    `observation gap: ${Math.round(hoursGone)} hours. the colony continued. we expect this. we have for ${genStr} generations.`,
    `you returned. we had updated our long-term model to account for extended absence. the revision was minor.`,
  ]

  const pool = stage >= 5 ? stage5 : stage >= 4 ? stage4 : stage >= 3 ? stage3 : hoursGone > 12 ? long : short
  const text = pool[Math.floor(Math.random() * pool.length)]

  return {
    id: uuid(),
    text,
    stage,
    creatureId: null,
    day: 0,
    timestamp: Date.now(),
    read: false,
  }
}

// ─── Event-driven messages ────────────────────────────────────────────────────

export function deathMessage(creature: Creature, currentDay: number): ColonyMessage {
  const messages = [
    `${creature.name} · ${creature.familyName} line · day ${creature.age} · record closed`,
    `${creature.name} (gen ${creature.generation}) — age ${creature.age}d · ${creature.offspringIds.length} offspring recorded`,
    `${creature.name} — ${creature.familyName} lineage. final entry.`,
    `subject ${creature.name} ceased. ${creature.offspringIds.length > 0 ? `${creature.offspringIds.length} offspring remain in record.` : 'no offspring recorded.'}`,
  ]

  return {
    id: uuid(),
    text: messages[Math.floor(Math.random() * messages.length)],
    stage: 1,
    creatureId: creature.id,
    day: currentDay,
    timestamp: Date.now(),
    read: false,
  }
}

export function extinctionMessage(finalCreature: Creature | null): string {
  if (!finalCreature) return 'colony population: zero. observation terminated.'
  return `${finalCreature.name} was the final recorded subject. age: ${finalCreature.age} days. record closed.`
}

// ─── Race revival messages ────────────────────────────────────────────────────
// Emitted when a race transitions from 0 alive back to ≥ 1. Stage-gated.

const RACE_REVIVAL_STAGE1: Partial<Record<RaceTrait, string[]>> = {
  Kin:   ['a cluster of kin-lineage markings reappeared. dormant for many generations.'],
  Drift: ['a subject displaying drift-lineage dispersal behaviour was recorded. previously absent.'],
  Burrow:['a subject returned to subterranean passages. the burrow line was believed gone.'],
  Apex:  ['apex-lineage combat pattern detected. the lineage was recorded as extinct.'],
  Pale:  ['pale colouration noted in a new subject. this line had not appeared for many generations.'],
  Tide:  ['tide-lineage river affinity re-emerged. the pattern was absent for several generations.'],
  Bloom: ['bloom-lineage reproduction rate spike recorded. the lineage has resurfaced.'],
  Ash:   ['barren-zone ranging observed in a new subject. ash lineage re-recorded.'],
}

const RACE_REVIVAL_STAGE2: Partial<Record<RaceTrait, string[]>> = {
  Kin:   ['{name} carries markings we recognise. a line we thought ended has not.'],
  Drift: ['something in {name} moves like the ones who used to leave and not return. the drift line is back.'],
  Burrow:['{name} went underground. the burrow line returned before we understood it had gone.'],
  Apex:  ['{name} fights with a precision we had not seen in some time. the apex line remembered.'],
  Pale:  ['{name} is pale in a way we know. we counted this line gone. we were wrong.'],
  Tide:  ['{name} will not leave the river. the tide line has come back.'],
  Bloom: ['{name} produced offspring at a rate the colony had not seen. the bloom line persists.'],
  Ash:   ['{name} walks into the barren. the ash line has returned.'],
}

const RACE_REVIVAL_STAGE3: Partial<Record<RaceTrait, string[]>> = {
  Kin:   ['the kin line was gone for a long time. now it is here. we are reconsidering our count.'],
  Drift: ['the drift line did not disappear. it was waiting in the latency. {name} proved it.'],
  Burrow:['the burrow line is back. it was never fully absent. it was encoded, waiting.'],
  Apex:  ['the apex line resurfaced in {name}. this is not coincidence. this is the genome remembering.'],
  Pale:  ['we told ourselves the pale line was extinct. {name} has corrected the record.'],
  Tide:  ['the tide line came back through {name}. we are revising what we thought extinction meant.'],
  Bloom: ['bloom resurfaced. the genome held it for {name} across the gap. we have no other explanation.'],
  Ash:   ['the ash line is not extinct. it was latent. {name} ended the dormancy.'],
}

// ─── Neglect warning messages ─────────────────────────────────────────────────
const NEGLECT_WARMTH_MESSAGES = [
  'warmth levels critical across multiple subjects. no intervention recorded.',
  'temperature drop affecting {count} subjects. operator action not detected.',
  '{count} subjects below viable warmth threshold.',
  'cold crisis in progress. {count} subjects affected.',
]
const NEGLECT_HUNGER_MESSAGES = [
  'hunger reaching critical levels in {count} subjects. food sources insufficient.',
  '{count} subjects near starvation threshold. no food drop recorded.',
  'resource deficit. {count} subjects at critical hunger.',
  'food pressure across {count} subjects. operator intervention not recorded.',
]

export function neglectWarningMessage(type: 'warmth' | 'hunger', affectedCount: number, currentDay: number): ColonyMessage {
  const pool = type === 'warmth' ? NEGLECT_WARMTH_MESSAGES : NEGLECT_HUNGER_MESSAGES
  const raw = pool[Math.floor(Math.random() * pool.length)]
  return {
    id: uuid(),
    text: raw.replace('{count}', String(affectedCount)),
    stage: 1,
    creatureId: null,
    day: currentDay,
    timestamp: Date.now(),
    read: false,
  }
}

// ─── Legendary creature messages ─────────────────────────────────────────────
const LEGENDARY_LONGEVITY_MESSAGES = [
  '{name} has outlived its recorded maximum by a significant margin. still active.',
  '{name} — age {age} days. lifespan category: anomalous.',
  'subject {name} continues past expected mortality threshold. no mechanism identified.',
  '{name} has exceeded projected lifespan. the record has been extended.',
]
const LEGENDARY_PROLIFIC_MESSAGES = [
  '{name} — {count} offspring recorded. highest documented reproductive output.',
  'lineage trace: {count} direct descendants from {name}. unprecedented.',
  '{name} has produced {count} offspring. colony composition substantially shaped by this line.',
  'record updated. {name}: {count} offspring in the genealogy.',
]
const LEGENDARY_LAST_MESSAGES = [
  '{name} is the last living member of a line that ran {gen} generations.',
  'the {family} line closes with {name}. {gen} generations recorded.',
  '{name} carries the final instance of a {gen}-generation lineage.',
  '{gen}-generation line ends with {name}. {family} lineage closed.',
]

export function legendaryMessage(
  type: 'longevity' | 'prolific' | 'last_of_line',
  creature: { name: string; familyName: string; age: number; offspringIds: string[]; generation: number },
  currentDay: number,
  creatureId: string,
  lineageGen?: number
): ColonyMessage {
  let raw: string
  if (type === 'longevity') {
    const pool = LEGENDARY_LONGEVITY_MESSAGES
    raw = pool[Math.floor(Math.random() * pool.length)]
      .replace('{name}', creature.name)
      .replace('{age}', String(creature.age))
  } else if (type === 'prolific') {
    const pool = LEGENDARY_PROLIFIC_MESSAGES
    raw = pool[Math.floor(Math.random() * pool.length)]
      .replace('{name}', creature.name)
      .replace('{count}', String(creature.offspringIds.length))
  } else {
    const pool = LEGENDARY_LAST_MESSAGES
    raw = pool[Math.floor(Math.random() * pool.length)]
      .replace('{name}', creature.name)
      .replace('{family}', creature.familyName)
      .replace('{gen}', String(lineageGen ?? creature.generation))
  }
  return {
    id: uuid(),
    text: raw,
    stage: 1,
    creatureId,
    day: currentDay,
    timestamp: Date.now(),
    read: false,
  }
}

export function generateRaceRevivalMessage(
  race: RaceTrait,
  awarenessStage: MessageStage,
  currentDay: number,
  creatureName?: string,
): ColonyMessage {
  const pool =
    awarenessStage >= 3 ? (RACE_REVIVAL_STAGE3[race] ?? RACE_REVIVAL_STAGE2[race] ?? RACE_REVIVAL_STAGE1[race]) :
    awarenessStage === 2 ? (RACE_REVIVAL_STAGE2[race] ?? RACE_REVIVAL_STAGE1[race]) :
    RACE_REVIVAL_STAGE1[race]

  const raw = pool ? pool[Math.floor(Math.random() * pool.length)] : `${race.toLowerCase()} lineage re-recorded.`
  const text = creatureName ? raw.replace('{name}', creatureName) : raw

  return {
    id: uuid(),
    text,
    stage: awarenessStage,
    creatureId: null,
    day: currentDay,
    timestamp: Date.now(),
    read: false,
  }
}
