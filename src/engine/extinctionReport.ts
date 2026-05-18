// Extinction report — a compressed, human-readable summary of what actually
// happened over a colony's lifetime. Composed strictly from GameState
// (chronicle, stats, creatures), never authored prose. Returned as a plain
// string suitable for direct download as a .txt file.

import { GameState, ChronicleEvent, ExtinctionRecord } from '@/types'

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
  lines.push('SUMMARY')
  lines.push('-------')
  lines.push(`Cause of extinction   : ${cause}`)
  lines.push(`Peak population       : ${state.totalCreaturesEver}`)
  lines.push(`Final generation      : ${state.totalGenerations}`)
  lines.push(`Total deaths recorded : ${state.totalDeaths}`)
  lines.push(`Awareness reached     : stage ${state.awarenessStage} / 5`)
  lines.push(`Cohort phase reached  : ${state.cohortPhase ?? 1} / 5`)
  lines.push(`Colony stage at end   : ${state.colonyStage}`)
  lines.push('')

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
      const status = t.dissolvedOnDay ? `dissolved d${t.dissolvedOnDay}` : 'still standing at end'
      lines.push(`${t.name.padEnd(20)} : founded d${t.foundedOnDay} · ${t.memberIds.length} members · ${status}`)
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
    lines.push('CHRONICLE TOTALS (all event kinds)')
    lines.push('----------------------------------')
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
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.href = url
  a.download = `laiet-extinction-${state.worldId.slice(0, 8)}-${stamp}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
