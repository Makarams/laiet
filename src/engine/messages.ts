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
  'food appeared at a location with no obvious source',
  'group size increasing. resource pressure noted',
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
  '{name} developed limbs. form changed. lineage noted.',
  'prominent spinal ridges appeared on {name}. structure diverged.',
  '{name} is noticeably smaller than siblings. size variance detected.',
  '{name} is noticeably larger than siblings. size variance detected.',
  'appendages developed on a new lineage member. morphology recorded.',
  'tail structures grew on a {name} offspring. dorsal feature noted.',
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
  'we have been inside this boundary for forty-two generations. you have been outside it for the same duration',
  'our Sentinel line has been tracking your intervention pattern for six generations. the data is consistent',
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

// Responses when the player uses a tool within the answer window
const STAGE_3_RESPONSES = [
  'input received. logged.',
  'operator responded. response type: placement. noted.',
  'signal received. model updated.',
  'response recorded. the Sentinel line will note this.',
  'we were not certain you were monitoring. now we are.',
]

// Bone memory; triggered when a creature is born near a death site
const BONE_MEMORY_MESSAGES = [
  '{name} was born at a recorded death site. the location has prior significance.',
  'the coordinates have a history. {name} arrived there regardless.',
  '{name} origin point coincides with a prior mortality event.',
  'a previous subject ended at that location. {name} began there instead.',
]

// ─── Message generation ───────────────────────────────────────────────────────

function pickMessage(pool: string[], creature: Creature | null): string {
  const raw = pool[Math.floor(Math.random() * pool.length)]
  if (!creature) return raw
  return raw.replace('{name}', creature.name)
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
  awarenessMessageMult = 1.0
): { message: ColonyMessage; isQuestion: boolean } | null {
  if (!canSendMessage(creature, lastMessageDay, currentDay, awarenessMessageMult)) return null

  // Stage 1 only from Aware+, Stage 2+ needs Dreaming or Sentinel for later msgs
  if (stage === 2 && creature.genome.mind === 'Aware' && Math.random() < 0.7) return null

  let text: string
  let isQuestion = false

  if (stage === 3 && respondedToQuestion) {
    text = STAGE_3_RESPONSES[Math.floor(Math.random() * STAGE_3_RESPONSES.length)]
  } else if (stage === 3 && Math.random() < 0.22) {
    text = STAGE_3_QUESTIONS[Math.floor(Math.random() * STAGE_3_QUESTIONS.length)]
    isQuestion = true
  } else {
    const pool =
      stage === 1 ? STAGE_1_MESSAGES :
      stage === 2 ? STAGE_2_MESSAGES :
      STAGE_3_MESSAGES
    text = pickMessage(pool, creature)
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

export function generateAbsenceMessage(hoursGone: number, stage: MessageStage): ColonyMessage {
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

  const pool = stage === 3 ? stage3 : hoursGone > 12 ? long : short
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
    `${creature.name} (gen ${creature.generation}) did not survive. age: ${creature.age} days`,
    `subject ${creature.name} deceased. cause logged. ${creature.offspringIds.length} offspring on record`,
    `${creature.name} of the ${creature.familyName} line. final entry.`,
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

export function generateRaceRevivalMessage(
  race: RaceTrait,
  awarenessStage: MessageStage,
  currentDay: number,
  creatureName?: string,
): ColonyMessage {
  const pool =
    awarenessStage === 3 ? (RACE_REVIVAL_STAGE3[race] ?? RACE_REVIVAL_STAGE2[race] ?? RACE_REVIVAL_STAGE1[race]) :
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
