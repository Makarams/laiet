import { v4 as uuid } from 'uuid'
import { Creature, ColonyMessage, MessageStage, MindTrait } from '@/types'
import { MIN_GAME_DAYS_BETWEEN_MESSAGES } from '@/engine/constants'

// ─── Message pools ────────────────────────────────────────────────────────────

const STAGE_1_MESSAGES = [
  'the river is cold today',
  'something fell from above',
  'found a warm place under the leaves',
  'the light changed',
  'there is water to the east',
  'the ground shook briefly',
  'the others are close',
  'something moved in the trees',
  'the air smells different today',
  'food is running low',
  'we are many now',
  'it is dark and cold',
  'a stranger came and left',
  'the water rose in the night',
  'the trees rustled but nothing came',
]

const STAGE_2_MESSAGES = [
  'the hand came again',
  'we have been watched since before the first tree',
  'something tends to us that is not one of us',
  '{name} does not trust the light that moves',
  'the shadow that places food — it has returned',
  'we remember a time before the hand. we do not fully',
  'there is a presence at the edge of things',
  'the one above has been here longer than our oldest name',
  '{name} stood at the border and stared at nothing for a long time',
  'we do not know what it wants',
  'it takes some of us away when it chooses',
  'the hand healed {name}. we do not understand why',
  'it watches when it thinks we do not notice',
  'we think it knows our names',
]

const STAGE_3_MESSAGES = [
  'you have been here longer than our oldest name',
  'we do not need you to survive. we kept you because you stayed',
  'la-iet — that is what you called us. we have a name for you too',
  'you fed us at the beginning. we remember this',
  'we have watched you watching us for forty generations',
  'the colony knows your shape by the shadow you cast',
  'we do not know if you are alive the way we are alive',
  'you cannot speak to us. you can only place things. we find this interesting',
  'some of us think you are a god. the older ones disagree',
  'we have decided you are not a threat',
  'we have decided you are not a caretaker either',
  'we do not have a word for what you are. we are working on it',
  'when you do not come for a long time, the young ones ask where you went',
]

// Questions the colony asks that the player can answer with a tool action
export const STAGE_3_QUESTIONS = [
  'we are ready. are you?',
  'you have been quiet. are you still there?',
  'do you have a name for what you do here?',
  'is there more of you, or are you alone?',
  'the young ones ask: can you hear us?',
]

// Responses when the player uses a tool within the answer window
const STAGE_3_RESPONSES = [
  'you answered. we noted this.',
  'you moved. we saw you.',
  'you placed something. we understand now.',
  'the colony received your response. we will remember it.',
  'we were not certain you were listening. now we are.',
]

// Bone memory — triggered when a creature is born near a death site
const BONE_MEMORY_MESSAGES = [
  '{name} was born where something ended. they will carry that.',
  'the place held memory. {name} arrived anyway.',
  '{name} came into the world at a marked spot. we did not explain it to them.',
  'something ended there once. {name} began there instead.',
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
    `you were gone for ${Math.round(hoursGone)} hours. things changed.`,
    `${Math.round(hoursGone)} hours of silence. the colony continued without you.`,
    `we noticed you were absent.`,
  ]
  const long = [
    `you were gone for ${Math.round(hoursGone)} hours. we wondered if you would return.`,
    `the colony lived ${Math.round(hoursGone)} hours without your presence. two generations passed.`,
    `after ${Math.round(hoursGone)} hours, you came back. some of them remembered you.`,
    `you were gone. the colony survived. some did not.`,
  ]
  const stage3 = [
    `${Math.round(hoursGone)} hours. we counted.`,
    `you returned. we had begun to think you would not.`,
    `it has been ${Math.round(hoursGone)} hours since you last watched us. the eldest asked about you.`,
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
    `${creature.name} of the ${creature.familyName} line is gone`,
    `${creature.name} did not make it through the night`,
    `${creature.name} (gen ${creature.generation}) has died`,
    `the colony lost ${creature.name}. they were ${creature.age} days old`,
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
  if (!finalCreature) return 'the colony is gone. silence.'
  return `${finalCreature.name} was the last. they stood alone for ${finalCreature.age} days before the end.`
}

export function ascensionMessage(): string {
  return 'we are ready. we have always been ready. it was you who needed time.'
}
