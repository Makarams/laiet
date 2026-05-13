import styled from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ColonyStage, WeatherState } from '@/types'
import { HEAL_CHARGES_PER_DAY } from '@/engine/constants'

// ─── Biome display ─────────────────────────────────────────────────────────

const BIOME_GLYPH: Record<string, string> = {
  temperate: '·',
  lush:      '♦',
  arid:      '◦',
  rocky:     '▲',
  wetland:   '≋',
}

const BIOME_COLOR: Record<string, string> = {
  temperate: '#7a9060',
  lush:      '#50c060',
  arid:      '#c87040',
  rocky:     '#8878a8',
  wetland:   '#4888a0',
}

const BiomeRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 3px;
`

const BiomeChip = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: ${p => p.color};
  letter-spacing: 0.06em;
`

const SeasonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 3px;
  padding: 3px 0;
`

const SeasonLabel = styled.span<{ color: string }>`
  font-size: 10.5px;
  color: ${p => p.color};
  letter-spacing: 0.14em;
  font-weight: bold;
`

const YearLabel = styled.span`
  font-size: 10px;
  color: #4a4a78;
  letter-spacing: 0.12em;
`

// ─── Layout ──────────────────────────────────────────────────────────────────

const Panel = styled.div`
  background:
    linear-gradient(180deg, rgba(20, 20, 50, 0.30), rgba(8, 8, 28, 0.88)),
    #06061a;
  border: 1px solid #2a2a50;
  border-radius: 4px;
  padding: 11px 12px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  color: #c0c8e0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.40), 0 0 0 1px rgba(80, 120, 200, 0.05);

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #2e2e60; border-radius: 2px; }
`

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 7px;
  margin-bottom: 8px;
  border-bottom: 1px solid #2a2a50;
`

const PanelTitle = styled.div`
  font-size: 13px;
  color: #5ec8e0;
  letter-spacing: 0.22em;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(94, 200, 224, 0.35);
`

const PanelTag = styled.div`
  font-size: 11px;
  color: #4a4a78;
  letter-spacing: 0.18em;
`

// ─── Sections ────────────────────────────────────────────────────────────────

const Section = styled.div`
  margin-bottom: 9px;
`

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: #4a7090;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin: 3px 0 6px;
  font-weight: bold;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    background: #3a6080;
    transform: rotate(45deg);
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #1a2040, transparent);
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  line-height: 1.5;
`

const Label = styled.span`
  color: #7070a0;
  font-size: 11.5px;
  letter-spacing: 0.04em;
`

const Value = styled.span<{ accent?: string }>`
  color: ${p => p.accent ?? '#c0c8e0'};
  font-size: 12px;
  letter-spacing: 0.05em;
  font-weight: bold;
`

// ─── Stage bar ───────────────────────────────────────────────────────────────

const StageBar = styled.div<{ stage: ColonyStage }>`
  margin-top: 4px;
  font-size: 9.5px;
  padding: 6px 8px;
  border-radius: 2px;
  background: ${p => stageColor(p.stage)}18;
  border: 1px solid ${p => stageColor(p.stage)}55;
  color: ${p => stageColor(p.stage)};
  text-align: center;
  letter-spacing: 0.22em;
  text-shadow: 0 0 8px ${p => stageColor(p.stage)}60;
`

const StageProgress = styled.div<{ percent: number; stage: ColonyStage }>`
  margin-top: 5px;
  height: 3px;
  background: #0e0e1e;
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: ${p => p.percent}%;
    background: linear-gradient(90deg, ${p => stageColor(p.stage)}, ${p => stageColor(p.stage)}cc);
    transition: width 0.5s ease;
  }
`

// ─── Awareness ───────────────────────────────────────────────────────────────

const AwarenessTrack = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
`

const AwDot = styled.div<{ active: boolean; level: number }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p => p.active
    ? p.level === 3 ? '#d088ff'
    : p.level === 2 ? '#5ec8e0'
    : '#80f0a0'
    : '#0e0e28'};
  border: 1px solid ${p => p.active
    ? p.level === 3 ? '#e0a8ff'
    : p.level === 2 ? '#7ae8ff'
    : '#a0f8c0'
    : '#2a2a50'};
  box-shadow: ${p => p.active
    ? `0 0 7px ${p.level === 3 ? '#d088ff' : p.level === 2 ? '#5ec8e0' : '#80f0a0'}88`
    : 'none'};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: ${p => p.active ? 'rgba(255,255,255,0.25)' : 'transparent'};
  }
`

const AwarenessLabel = styled.div`
  margin-top: 7px;
  font-size: 10.5px;
  color: #6a6a88;
  font-style: italic;
  letter-spacing: 0.05em;
  text-align: center;
  line-height: 1.5;
`

// ─── Body type grid ──────────────────────────────────────────────────────────

const BodyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
  margin-top: 2px;
`

const BodyCell = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`

const BodyDot = styled.span<{ color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${p => p.color};
  flex-shrink: 0;
`

const BodyCount = styled.span`
  font-size: 11px;
  color: #c0c8e0;
  font-weight: bold;
  width: 20px;
`

const BodyLabel = styled.span`
  font-size: 10.5px;
  color: #4a4a78;
  letter-spacing: 0.06em;
`

// ─── Weather ─────────────────────────────────────────────────────────────────

const WeatherRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
`

const WeatherGlyph = styled.span<{ color: string }>`
  font-size: 16px;
  color: ${p => p.color};
  line-height: 1;
`

const WeatherName = styled.span<{ color: string }>`
  font-size: 11px;
  color: ${p => p.color};
  letter-spacing: 0.14em;
  font-weight: bold;
`

const WeatherTimer = styled.span`
  font-size: 10.5px;
  color: #4a4a78;
  letter-spacing: 0.08em;
  margin-left: auto;
`

// ─── Colors ──────────────────────────────────────────────────────────────────

const SEASON_GLYPH: Record<string, string> = {
  spring: '✦', summer: '◆', autumn: '☁', winter: '❄',
}

const SEASON_COLOR: Record<string, string> = {
  spring: '#80c060',
  summer: '#d4a040',
  autumn: '#c87040',
  winter: '#6888b0',
}

const WEATHER_GLYPH: Record<WeatherState, string> = {
  clear:   '☀',
  rain:    '☂',
  storm:   '⚡',
  drought: '◌',
}

const WEATHER_COLOR: Record<WeatherState, string> = {
  clear:   '#d4a040',
  rain:    '#5888a0',
  storm:   '#d4c040',
  drought: '#c87040',
}

const BODY_COLOR: Record<string, string> = {
  Spore: '#88c060',
  Shell: '#5888a0',
  Spike: '#d47038',
  Wisp:  '#a870c0',
}

function stageColor(stage: ColonyStage): string {
  const map: Record<ColonyStage, string> = {
    genesis:     '#6070a0',
    nascent:     '#5ec8e0',
    growing:     '#80f0a0',
    established: '#80c8ff',
    thriving:    '#ffc060',
    ascendant:   '#d088ff',
  }
  return map[stage]
}

const STAGE_THRESHOLDS: Record<ColonyStage, number> = {
  genesis:      0,
  nascent:      6,
  growing:      16,
  established:  31,
  thriving:     51,
  ascendant:    80,
}

const STAGES: ColonyStage[] = ['genesis', 'nascent', 'growing', 'established', 'thriving', 'ascendant']

const AWARENESS_PROSE = [
  '',
  'the specimen reacts only to need',
  'something within it has begun to notice',
  'it knows you are here, watching',
]

export function ColonyStatsPanel() {
  const gameState = useLaietStore(s => s.gameState)

  if (!gameState) return null

  const { creatures, colonyStage, awarenessStage, totalDeaths, totalCreaturesEver, weather, weatherTimer, caretaker, time } = gameState
  const maxHealCharges = HEAL_CHARGES_PER_DAY
  const alive = Object.values(creatures).filter(c => c.diedOnDay === null)
  const maxGen = alive.length > 0 ? Math.max(...alive.map(c => c.generation)) : 0

  // Biome distribution of alive creatures
  const biomeCounts: Record<string, number> = {}
  for (const c of alive) {
    const b = c.dominantBiome ?? 'temperate'
    biomeCounts[b] = (biomeCounts[b] ?? 0) + 1
  }
  const topBiomes = Object.entries(biomeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const traitCounts = alive.reduce((acc, c) => {
    acc[c.genome.personality] = (acc[c.genome.personality] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const dominant = Object.entries(traitCounts).sort((a, b) => b[1] - a[1])[0]

  const avgHealth = alive.length > 0
    ? Math.round(alive.reduce((s, c) => s + c.health, 0) / alive.length)
    : 0

  const bodyCounts = { Spore: 0, Shell: 0, Spike: 0, Wisp: 0 } as Record<string, number>
  for (const c of alive) bodyCounts[c.genome.body] = (bodyCounts[c.genome.body] ?? 0) + 1

  const currentStageIdx = STAGES.indexOf(colonyStage)
  const nextStage = STAGES[currentStageIdx + 1]
  const stageProgress = nextStage
    ? Math.min(100, ((alive.length - STAGE_THRESHOLDS[colonyStage]) /
        (STAGE_THRESHOLDS[nextStage] - STAGE_THRESHOLDS[colonyStage])) * 100)
    : 100

  const currentWeather: WeatherState = weather ?? 'clear'

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>◇ CENSUS</PanelTitle>
        <PanelTag>OBS-01</PanelTag>
      </PanelHeader>

      <Section>
        <SectionTitle>population</SectionTitle>
        <Row>
          <Label>alive</Label>
          <Value accent='#88c060'>{alive.length}</Value>
        </Row>
        <Row>
          <Label>ever born</Label>
          <Value>{totalCreaturesEver}</Value>
        </Row>
        <Row>
          <Label>deaths</Label>
          <Value accent={totalDeaths > 0 ? '#c85030' : undefined}>{totalDeaths}</Value>
        </Row>
        <Row>
          <Label>generation</Label>
          <Value accent='#d4a040'>{maxGen}</Value>
        </Row>
      </Section>

      <Section>
        <SectionTitle>body types</SectionTitle>
        <BodyGrid>
          {(['Spore', 'Shell', 'Spike', 'Wisp'] as const).map(body => (
            <BodyCell key={body}>
              <BodyDot color={BODY_COLOR[body]} />
              <BodyCount>{bodyCounts[body]}</BodyCount>
              <BodyLabel>{body}</BodyLabel>
            </BodyCell>
          ))}
        </BodyGrid>
      </Section>

      <Section>
        <SectionTitle>vitals</SectionTitle>
        <Row>
          <Label>avg health</Label>
          <Value accent={avgHealth < 40 ? '#c85030' : avgHealth > 75 ? '#88c060' : '#d4a040'}>
            {avgHealth}%
          </Value>
        </Row>
        <Row>
          <Label>dominant trait</Label>
          <Value accent='#5888a0' style={{ fontSize: 9.5, letterSpacing: '0.1em' }}>
            {dominant?.[0]?.toUpperCase() ?? '—'}
          </Value>
        </Row>
      </Section>

      <Section>
        <SectionTitle>environment</SectionTitle>
        <SeasonRow>
          <SeasonLabel color={SEASON_COLOR[time.season]}>
            {SEASON_GLYPH[time.season]} {time.season.toUpperCase()}
          </SeasonLabel>
          <YearLabel>yr {time.year + 1} · d {time.day}</YearLabel>
        </SeasonRow>
        <WeatherRow>
          <WeatherGlyph color={WEATHER_COLOR[currentWeather]}>
            {WEATHER_GLYPH[currentWeather]}
          </WeatherGlyph>
          <WeatherName color={WEATHER_COLOR[currentWeather]}>
            {currentWeather.toUpperCase()}
          </WeatherName>
          <WeatherTimer>{Math.round(weatherTimer ?? 0)}d left</WeatherTimer>
        </WeatherRow>
        {topBiomes.length > 0 && (
          <BiomeRow>
            {topBiomes.map(([biome, count]) => (
              <BiomeChip key={biome} color={BIOME_COLOR[biome] ?? '#4a7090'}>
                <span>{BIOME_GLYPH[biome] ?? '·'}</span>
                <span>{biome}</span>
                <span style={{ color: '#3a3a60' }}>{count}</span>
              </BiomeChip>
            ))}
          </BiomeRow>
        )}
      </Section>

      <Section>
        <SectionTitle>colony stage</SectionTitle>
        <StageBar stage={colonyStage}>{colonyStage.toUpperCase()}</StageBar>
        {nextStage && (
          <>
            <StageProgress percent={stageProgress} stage={colonyStage} />
            <div style={{ fontSize: 8.5, color: '#3a3a60', textAlign: 'right', marginTop: 3, letterSpacing: '0.1em' }}>
              → {nextStage.toUpperCase()}
            </div>
          </>
        )}
      </Section>

      <Section>
        <SectionTitle>awareness</SectionTitle>
        <AwarenessTrack>
          {[1, 2, 3].map(n => (
            <AwDot key={n} active={awarenessStage >= n} level={n} />
          ))}
          <span style={{ fontSize: 9, color: '#4a4a78', marginLeft: 4, letterSpacing: '0.10em' }}>
            stage {awarenessStage} / 3
          </span>
        </AwarenessTrack>
        <AwarenessLabel>{AWARENESS_PROSE[awarenessStage]}</AwarenessLabel>
      </Section>

      <Section>
        <SectionTitle>caretaker</SectionTitle>
        <Row>
          <Label>mode</Label>
          <Value accent='#a870c0'>◈ omnipresent</Value>
        </Row>
        <Row style={{ marginTop: 4 }}>
          <Label>heal charges</Label>
          <Value accent={caretaker.healCharges > 0 ? '#88c060' : '#c85030'}>
            {caretaker.healCharges}/{maxHealCharges}
          </Value>
        </Row>
        <Row>
          <Label>river redirect</Label>
          <Value accent={caretaker.riverRedirectUsed ? '#c87040' : '#88c060'}>
            {caretaker.riverRedirectUsed ? '◌ used' : '◉ ready'}
          </Value>
        </Row>
        <Row>
          <Label>enrichment</Label>
          <Value accent='#7a9060'>◉ degrades naturally</Value>
        </Row>
      </Section>
    </Panel>
  )
}
