// Run reports — compressed, human-readable summaries of what actually happened
// in a colony. Composed strictly from GameState (chronicle, stats, creatures,
// messages), never authored prose. Returned as plain UTF-8 text suitable for
// direct download as a .txt file.
//
// Two flavours:
//   * generateExtinctionReport — terminal summary, includes fossil record
//   * generateRunLogReport     — in-game export, available at any time

import { GameState, ChronicleEvent, ExtinctionRecord, ColonyMessage } from '@/types'

interface ReportInput {
  state: GameState
  fossil?: ExtinctionRecord
}

function fmtDay(d: number): string {
  // 30 days = 1 season; 4 seasons = 1 year
  const year   = Math.floor(d / 120)
  const season = Math.floor((d % 120) / 30)
  const day    = d % 30
  const seasons = ['spring', 'summer', 'autumn', 'winter']
  return `Y${year + 1} ${seasons[season]} d${day + 1}`
}

// Real-world elapsed time, compact ("1h 4m" / "37m 14s" / "9s").
function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

function countBy<K extends string>(items: { [k in K]?: string }[], key: K): Record<string, number> {
  const out: Record<string, number> = {}
  for (const it of items) {
    const v = it[key]
    if (!v) continue
    out[v] = (out[v] ?? 0) + 1
  }
  return out
}

function topN(counts: Record<string, number>, n: number): [string, number][] {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function chronicleFrequency(chron: ChronicleEvent[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of chron) out[e.kind] = (out[e.kind] ?? 0) + 1
  return out
}

export function generateExtinctionReport({ state, fossil }: ReportInput): string {
  const lines: string[] = []
  const chron = state.colonyChronicle ?? []
  const extinctionDay = fossil?.extinctionDay ?? state.time.day
  const cause = fossil?.extinctionCause ?? 'unknown'

  // ── Header ─────────────────────────────────────────────────────────────
  lines.push('LA-IET.EXE — EXTINCTION REPORT')
  lines.push('================================')
  lines.push('')
  lines.push(`World ID         : ${state.worldId}`)
  lines.push(`Seed             : ${state.worldSeed}`)
  lines.push(`Started          : ${new Date(state.createdAt).toISOString()}`)
  lines.push(`Ended            : ${fmtDay(extinctionDay)}  (game day ${extinctionDay})`)
  lines.push(`Generated        : ${new Date().toISOString()}`)
  lines.push('')

  // ── Headline stats ─────────────────────────────────────────────────────
  // Peak population is the true high-water mark of concurrently-living
  // creatures — distinct from totalCreaturesEver, the cumulative count of
  // every creature ever born (which, on extinction, equals total deaths).
  const peak = state.peakPopulation ?? fossil?.peakPopulation ?? state.totalCreaturesEver
  const peakDay = state.peakPopulationDay
  lines.push('SUMMARY')
  lines.push('-------')
  lines.push(`Cause of extinction   : ${cause}`)
  lines.push(`Peak population       : ${peak}${peakDay !== undefined ? `  (reached ${fmtDay(peakDay)})` : ''}`)
  lines.push(`Total creatures ever  : ${state.totalCreaturesEver}`)
  lines.push(`Final generation      : ${state.totalGenerations}`)
  lines.push(`Total deaths recorded : ${state.totalDeaths}`)
  lines.push(`Awareness reached     : stage ${state.awarenessStage} / 5`)
  lines.push(`Cohort phase reached  : ${state.cohortPhase ?? 1} / 5`)
  lines.push(`Colony stage at end   : ${state.colonyStage}`)
  lines.push('')

  // ── Derived run metrics ────────────────────────────────────────────────
  {
    const deadList = Object.values(state.creatures).filter(c => c.diedOnDay !== null)
    const lifespans = deadList
      .map(c => (c.diedOnDay as number) - c.bornOnDay)
      .filter(n => n >= 0)
    const avgLife = lifespans.length
      ? lifespans.reduce((a, b) => a + b, 0) / lifespans.length
      : 0
    const maxLife = lifespans.reduce((m, n) => Math.max(m, n), 0)
    const cadence = state.totalGenerations > 0
      ? (extinctionDay / state.totalGenerations).toFixed(1)
      : 'n/a'
    lines.push('RUN METRICS')
    lines.push('-----------')
    lines.push(`Real time elapsed     : ${fmtDuration(Date.now() - state.createdAt)}`)
    lines.push(`Generation cadence    : ${cadence} days per generation`)
    if (lifespans.length > 0) {
      lines.push(`Lifespan (recorded)   : avg ${avgLife.toFixed(1)}d · longest ${maxLife}d  (${lifespans.length} deaths)`)
    }
    lines.push(`Winters survived      : ${Math.floor(extinctionDay / 120)}`)
    lines.push('')
  }

  // ── Profile + modifiers ────────────────────────────────────────────────
  if (state.profile) {
    lines.push('CARETAKER PROFILE')
    lines.push('-----------------')
    for (const [k, v] of Object.entries(state.profile)) {
      lines.push(`${k.padEnd(18)} : ${v}`)
    }
    lines.push('')
  }

  // ── Death-cause breakdown ─────────────────────────────────────────────
  const dc = state.deathCauseCounts ?? {}
  const dcList = Object.entries(dc).sort((a, b) => b[1] - a[1])
  if (dcList.length > 0) {
    lines.push('DEATH CAUSES')
    lines.push('------------')
    for (const [cause, n] of dcList) {
      lines.push(`${cause.padEnd(14)} : ${n}`)
    }
    lines.push('')
  }

  // ── Race populations ──────────────────────────────────────────────────
  const races = state.racePopulations ?? {}
  const extinct = state.extinctRaces ?? []
  if (Object.keys(races).length > 0 || extinct.length > 0) {
    lines.push('RACES')
    lines.push('-----')
    for (const [r, n] of Object.entries(races)) {
      lines.push(`${r.padEnd(10)} : ${n} alive at end`)
    }
    if (extinct.length > 0) {
      lines.push(`extinct        : ${extinct.join(', ')}`)
    }
    lines.push('')
  }

  // ── Tribes ────────────────────────────────────────────────────────────
  const tribes = Object.values(state.tribes ?? {})
  if (tribes.length > 0) {
    lines.push('TRIBES (formed during this run)')
    lines.push('-------------------------------')
    for (const t of tribes) {
      const status = t.dissolvedOnDay ? `dissolved ${fmtDay(t.dissolvedOnDay)}` : 'still standing at end'
      // memberIds shrinks as members die — peakMembers is the tribe's true scale.
      const peakM = t.peakMembers ?? t.memberIds.length
      lines.push(`${t.name.padEnd(20)} : founded ${fmtDay(t.foundedOnDay)} · peak ${peakM} members · ${status}`)
    }
    lines.push('')
  }

  // ── Notable events from the chronicle ─────────────────────────────────
  const NOTABLE = new Set([
    'mass_die_off', 'lineage_extinct', 'lineage_fork', 'hybrid_birth',
    'race_emerged', 'race_lost', 'race_revived', 'subspecies_recognised',
    'tribe_formed', 'tribe_split', 'tribe_dissolved',
    'fire_swept', 'flood_event', 'heatwave_onset', 'snow_blanket',
    'rare_birth', 'apex_emerged', 'caretaker_returned',
  ])
  const notable = chron.filter(e => NOTABLE.has(e.kind))
  if (notable.length > 0) {
    lines.push(`NOTABLE EVENTS (${notable.length})`)
    lines.push('---------------')
    lines.push('(from the colony chronicle — a bounded log; xN = per-event')
    lines.push(' magnitude, meaning varies by event kind)')
    for (const e of notable) {
      const tag = `[${fmtDay(e.day)}]`.padEnd(18)
      const who = e.creatureName ? ` ${e.creatureName}` : ''
      const det = e.detail ? ` (${e.detail})` : ''
      const cnt = e.count !== undefined ? ` x${e.count}` : ''
      lines.push(`${tag} ${e.kind}${who}${det}${cnt}`)
    }
    lines.push('')
  }

  // ── Chronicle frequency (compressed event-kind totals) ────────────────
  const freq = chronicleFrequency(chron)
  const freqSorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
  if (freqSorted.length > 0) {
    lines.push(`CHRONICLE TOTALS (most recent ${chron.length} events)`)
    lines.push('----------------------------------')
    lines.push('note: the chronicle is a bounded ring — these counts reflect only')
    lines.push('its current window, not the colony\'s full history. The DEATH')
    lines.push('CAUSES tally above is complete and uncapped.')
    for (const [kind, n] of freqSorted) {
      lines.push(`${kind.padEnd(28)} : ${n}`)
    }
    lines.push('')
  }

  // ── Top family lines ──────────────────────────────────────────────────
  const creatureList = Object.values(state.creatures)
  const familyCounts = countBy(creatureList as { familyName: string }[], 'familyName')
  const topFamilies = topN(familyCounts, 10)
  if (topFamilies.length > 0) {
    lines.push('MOST POPULOUS LINES (cumulative members)')
    lines.push('----------------------------------------')
    for (const [name, n] of topFamilies) {
      lines.push(`${name.padEnd(20)} : ${n}`)
    }
    lines.push('')
  }

  // ── Closing line ──────────────────────────────────────────────────────
  if (fossil?.finalMessage) {
    lines.push('FINAL OBSERVATION')
    lines.push('-----------------')
    lines.push(fossil.finalMessage)
    lines.push('')
  }

  lines.push(`-- end of report --`)
  return lines.join('\n')
}

// Browser-side download helper. Returns void; called from React.
export function downloadExtinctionReport(state: GameState, fossil?: ExtinctionRecord): void {
  const text = generateExtinctionReport({ state, fossil })
  triggerDownload(text, `laiet-extinction-${state.worldId.slice(0, 8)}`)
}

// ─── In-game run log ─────────────────────────────────────────────────────────
// Mid-run export. Mirrors the four sections the player UI surfaces:
//   OVERVIEW       — snapshot of headline stats
//   KEY EVENTS     — most-significant chronicle entries (NOTABLE set)
//   IMPORTANT LOGS — messages categorised `important` (or stage >= 4)
//   TIMELINE       — day-stamped chronological flow of the last ~30 game days
// Sections are separated by ascii rules; UTF-8 BOM omitted since modern editors
// auto-detect UTF-8.

const NOTABLE_KINDS = new Set<string>([
  'mass_die_off', 'lineage_extinct', 'lineage_fork', 'hybrid_birth',
  'race_emerged', 'race_lost', 'race_revived', 'subspecies_recognised',
  'tribe_formed', 'tribe_split', 'tribe_dissolved',
  'fire_swept', 'fire_outbreak', 'flood_event', 'heatwave_onset', 'snow_blanket',
  'rare_birth', 'apex_emerged', 'caretaker_returned',
  'lightning_strike', 'bloom_began', 'ashfall_began', 'windstorm_began',
])

function isImportantMessage(m: ColonyMessage): boolean {
  if (m.category === 'important') return true
  if (m.stage >= 4) return true
  if (/extinction|silence|mass die-off|lineage|fracture|legendary|race emerged|race revived|race lost|awakened|ascended/i.test(m.text)) {
    return true
  }
  return false
}

function rule(char = '-', width = 56): string {
  return char.repeat(width)
}

function section(title: string): string[] {
  return [title.toUpperCase(), rule('-', Math.max(8, title.length))]
}

export function generateRunLogReport(state: GameState): string {
  const lines: string[] = []
  const chron = state.colonyChronicle ?? []
  const messages = state.messages ?? []
  const now = new Date()
  const alive = Object.values(state.creatures).filter(c => c.diedOnDay === null)

  // ── Header ─────────────────────────────────────────────────────────────
  lines.push('LA-IET.EXE — RUN LOG')
  lines.push(rule('=', 56))
  lines.push('')
  lines.push(`Exported       : ${now.toISOString()}`)
  lines.push(`World ID       : ${state.worldId}`)
  lines.push(`Seed           : ${state.worldSeed}`)
  lines.push(`Started        : ${new Date(state.createdAt).toISOString()}`)
  lines.push(`Current day    : ${fmtDay(state.time.day)} (game day ${state.time.day})`)
  lines.push('')

  // ── 1. OVERVIEW ───────────────────────────────────────────────────────
  lines.push(...section('Overview'))
  lines.push(`Alive                : ${alive.length}`)
  lines.push(`Peak population      : ${state.peakPopulation ?? alive.length}`)
  lines.push(`Recorded (total ever): ${state.totalCreaturesEver}`)
  lines.push(`Deaths               : ${state.totalDeaths}`)
  lines.push(`Generations          : ${state.totalGenerations}`)
  lines.push(`Awareness stage      : ${state.awarenessStage} / 5`)
  lines.push(`Cohort phase         : ${state.cohortPhase ?? 1} / 5`)
  lines.push(`Colony stage         : ${state.colonyStage}`)
  lines.push(`Weather              : ${state.weather ?? 'clear'}`)
  lines.push(`Season               : ${state.time.season}  (phase: ${state.time.phase})`)
  if (state.profile) {
    lines.push('')
    lines.push('Caretaker profile:')
    for (const [k, v] of Object.entries(state.profile)) {
      lines.push(`  ${k.padEnd(14)} : ${v}`)
    }
  }
  lines.push('')

  // ── 2. KEY EVENTS ─────────────────────────────────────────────────────
  const keyEvents = chron.filter(e => NOTABLE_KINDS.has(e.kind))
  lines.push(...section(`Key Events (${keyEvents.length})`))
  if (keyEvents.length === 0) {
    lines.push('  (none recorded yet)')
  } else {
    for (const e of keyEvents) {
      const tag = `[${fmtDay(e.day)}]`.padEnd(18)
      const who = e.creatureName ? ` ${e.creatureName}` : ''
      const det = e.detail ? ` (${e.detail})` : ''
      const cnt = e.count !== undefined ? ` x${e.count}` : ''
      lines.push(`${tag} ${e.kind}${who}${det}${cnt}`)
    }
  }
  lines.push('')

  // ── 3. IMPORTANT LOGS ─────────────────────────────────────────────────
  const important = messages.filter(isImportantMessage)
  lines.push(...section(`Important Logs (${important.length})`))
  if (important.length === 0) {
    lines.push('  (no important entries yet)')
  } else {
    for (const m of important) {
      const tag = `[${fmtDay(m.day)}]`.padEnd(18)
      lines.push(`${tag} ${m.text}`)
    }
  }
  lines.push('')

  // ── 4. TIMELINE ───────────────────────────────────────────────────────
  // Last ~30 game days of message activity, grouped by day, debug noise stripped.
  const timelineDays = 30
  const cutoff = state.time.day - timelineDays
  const recent = messages.filter(m => m.day >= cutoff)
  lines.push(...section(`Timeline (last ${timelineDays} days)`))
  if (recent.length === 0) {
    lines.push('  (nothing in recent window)')
  } else {
    let lastDay = -1
    for (const m of recent) {
      if (m.day !== lastDay) {
        if (lastDay !== -1) lines.push('')
        lines.push(`-- ${fmtDay(m.day)} --`)
        lastDay = m.day
      }
      const stamp = new Date(m.timestamp).toISOString().slice(11, 19)
      lines.push(`  ${stamp}  ${m.text}`)
    }
  }
  lines.push('')

  lines.push(rule('=', 56))
  lines.push(`-- end of run log (day ${state.time.day}) --`)
  return lines.join('\n')
}

// Generic download trigger. Same encoding (UTF-8) for both report flavours.
function triggerDownload(text: string, baseName: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.href = url
  a.download = `${baseName}-${stamp}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadRunLog(state: GameState): void {
  const text = generateRunLogReport(state)
  triggerDownload(text, `laiet-runlog-${state.worldId.slice(0, 8)}`)
}
