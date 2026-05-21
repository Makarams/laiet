// Headless verification harness — runs the REAL engine entry points.
// Reconstructs exactly what gameStore.initNewWorld() builds, then loops
// tickSimulation() the same way the browser does on its 1s interval.
import { createServer } from 'vite'
import { v4 as uuid } from 'uuid'

const server = await createServer({
  configFile: './vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

const profileMod = await server.ssrLoadModule('/src/engine/profile.ts')
const worldGen   = await server.ssrLoadModule('/src/world/worldGen.ts')
const factory    = await server.ssrLoadModule('/src/creatures/factory.ts')
const tickMod    = await server.ssrLoadModule('/src/engine/tick.ts')

const { computeSimModifiers } = profileMod
const { generateWorld, countTileTypes } = worldGen
const { createStarterCreatures } = factory
const { tickSimulation } = tickMod

// Same profile as the extinction report: varied / drift / survival / persistence / neutral / standard
const profile = {
  world: 'varied', evolution: 'drift', focus: 'survival',
  expectation: 'persistence', visibility: 'neutral', lifespan: 'standard',
}

function newWorld(seed) {
  const modifiers = computeSimModifiers(profile)
  const tiles = generateWorld(seed)
  const creatures = createStarterCreatures([], seed, 0, modifiers.lifespanMult ?? 1)
  const creatureMap = {}
  for (const c of creatures) creatureMap[c.id] = c
  return {
    worldId: uuid(), userId: 'verify', worldSeed: seed, createdAt: Date.now(),
    profile, modifiers,
    time: { day: 0, totalMinutesElapsed: 0, season: 'spring', year: 0, phase: 'day' },
    tiles, creatures: creatureMap, tribes: {}, messages: [], events: [], fossilRecord: [],
    caretaker: { lastActionMs: 0, lastActionX: null, lastActionY: null, actionLoad: 0,
                 bushHeldFood: null, awaitingResponseUntil: 0, respondedToQuestion: false },
    colonyStage: 'genesis', awarenessStage: 1, cohortPhase: 1, endgame: null,
    enrichmentItems: {}, weather: 'clear', weatherTimer: 25,
    totalCreaturesEver: 4, totalGenerations: 0, totalDeaths: 0,
    peakPopulation: 4, peakPopulationDay: 0, lastSaved: Date.now(), lastSessionEnd: null,
    snowAccumulation: 0, tileTypeCount: countTileTypes(tiles),
  }
}

const MAX_TICKS = 7800   // ~130 game days — clears the first winter (d90-119) into year 2
const SAMPLE = 600       // sample every ~10 game days

function alive(s) { return Object.values(s.creatures).filter(c => c.diedOnDay === null).length }

function run(seed, label) {
  let s = newWorld(seed)
  const bodies = Object.values(s.creatures).map(c => c.genome.body).sort()
  const startAges = Object.values(s.creatures).map(c => c.age)
  const traj = []
  let extinctTick = null
  let minAfterPeak = Infinity, sawPeak = false
  for (let t = 1; t <= MAX_TICKS; t++) {
    s = tickSimulation(s)
    const a = alive(s)
    if (a >= 12) sawPeak = true
    if (sawPeak && a < minAfterPeak) minAfterPeak = a
    if (t % SAMPLE === 0) traj.push(`d${s.time.day}:${a}`)
    if (s.endgame || a === 0) { extinctTick = t; break }
  }
  const causes = {}
  for (const c of Object.values(s.creatures)) {
    if (c.diedOnDay !== null) { const k = c.deathCause ?? 'unknown'; causes[k] = (causes[k] ?? 0) + 1 }
  }
  console.log(`\n[${label}] seed=${seed} founders=${bodies.join('/')} startAges=${startAges.join(',')}`)
  console.log(`  trajectory (day:alive): ${traj.join('  ')}`)
  console.log(`  peakPop=${s.peakPopulation}  finalAlive=${alive(s)}  totalEver=${s.totalCreaturesEver}` +
              `  gen=${s.totalGenerations}  awareness=${s.awarenessStage}  endDay=${s.time.day}`)
  console.log(`  minPopAfterReaching12=${minAfterPeak === Infinity ? 'n/a' : minAfterPeak}` +
              `  deaths by cause: ${JSON.stringify(causes)}`)
  console.log(`  result: ${extinctTick ? `EXTINCT at tick ${extinctTick} (day ${s.time.day})` : `SURVIVED ${MAX_TICKS} ticks`}`)
  return { peak: s.peakPopulation, survived: !extinctTick, finalAlive: alive(s) }
}

const results = []
for (let i = 0; i < 6; i++) {
  results.push(run(1000 + i * 7919, `colony ${i + 1}`))
}

const survived = results.filter(r => r.survived).length
console.log(`\n=== SUMMARY: ${survived}/6 survived ${MAX_TICKS} ticks (~130 days) ===`)

await server.close()
process.exit(0)
