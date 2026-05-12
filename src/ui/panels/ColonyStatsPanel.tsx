import styled from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ColonyStage, WeatherState } from '@/types'
import { HEAL_CHARGES_PER_DAY } from '@/engine/constants'

// ─── Layout ──────────────────────────────────────────────────────────────────

const Panel = styled.div`
  background:
    linear-gradient(180deg, rgba(20, 20, 50, 0.30), rgba(8, 8, 28, 0.85)),
    #06061a;
  border: 1px solid #2a2a50;
  border-radius: 4px;
  padding: 11px 12px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  color: #f0e6c8;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.40);

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #3a3a70; border-radius: 2px; }
`

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 7px;
  margin-bottom: 8px;
  border-bottom: 1px solid #1c1c40;
`

const PanelTitle = styled.div`
  font-size: 13px;
  color: #d088ff;
  letter-spacing: 0.22em;
  text-shadow: 0 0 10px rgba(200, 120, 240, 0.40);
  font-weight: bold;
`

const PanelTag = styled.div`
  font-size: 11px;
  color: #9090b8;
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
  color: #80e0f0;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin: 3px 0 6px;
  font-weight: bold;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    background: #5ec8e0;
    box-shadow: 0 0 5px #5ec8e0;
    transform: rotate(45deg);
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #2e4e6e, transparent);
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
  color: #a8a8d0;
  font-size: 11.5px;
  letter-spacing: 0.04em;
`

const Value = styled.span<{ accent?: string }>`
  color: ${p => p.accent ?? '#f0e6c8'};
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
  background: ${p => stageColor(p.stage)}14;
  border: 1px solid ${p => stageColor(p.stage)}50;
  color: ${p => stageColor(p.stage)};
  text-align: center;
  letter-spacing: 0.22em;
  box-shadow: 0 0 10px ${p => stageColor(p.stage)}20;
`

const StageProgress = styled.div<{ percent: number; stage: ColonyStage }>`
  margin-top: 5px;
  height: 3px;
  background: #0c0c22;
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: ${p => p.percent}%;
    background: linear-gradient(90deg, ${p => stageColor(p.stage)}, ${p => stageColor(p.stage)}cc);
    box-shadow: 0 0 6px ${p => stageColor(p.stage)};
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
    ? p.level === 3 ? '#c878f0'
    : p.level === 2 ? '#5ec8e0'
    : '#80f0a0'
    : '#0c0c22'};
  border: 1px solid ${p => p.active
    ? p.level === 3 ? '#f0a0ff'
    : p.level === 2 ? '#8af0ff'
    : '#a8ffc0'
    : '#1c1c40'};
  box-shadow: ${p => p.active
    ? `0 0 8px ${p.level === 3 ? '#c878f0' : p.level === 2 ? '#5ec8e0' : '#80f0a0'}`
    : 'none'};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: ${p => p.active ? 'rgba(255,255,255,0.30)' : 'transparent'};
  }
`

const AwarenessLabel = styled.div`
  margin-top: 7px;
  font-size: 10.5px;
  color: #a8a8d0;
  font-style: italic;
  letter-spacing: 0.05em;
  text-align: center;
  line-height: 1.5;
`

// ─── Heal charges ────────────────────────────────────────────────────────────

const HealRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
`

const HealHeart = styled.div<{ active: boolean }>`
  width: 10px;
  height: 10px;
  font-size: 11px;
  line-height: 1;
  color: ${p => p.active ? '#ff5060' : '#1e1828'};
  text-shadow: ${p => p.active ? '0 0 5px rgba(255, 80, 96, 0.55)' : 'none'};

  &::before { content: '♥'; }
`

const HealNote = styled.span`
  font-size: 10px;
  color: #8888b0;
  letter-spacing: 0.12em;
  margin-left: 4px;
`

// ─── Body type bar ───────────────────────────────────────────────────────────

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
  box-shadow: 0 0 5px ${p => p.color};
  flex-shrink: 0;
`

const BodyCount = styled.span`
  font-size: 11px;
  color: #f0e6c8;
  font-weight: bold;
  width: 20px;
`

const BodyLabel = styled.span`
  font-size: 10.5px;
  color: #8888b0;
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
  text-shadow: 0 0 8px ${p => p.color};
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
  color: #8080a0;
  letter-spacing: 0.08em;
  margin-left: auto;
`

// ─── Colors ──────────────────────────────────────────────────────────────────

const WEATHER_GLYPH: Record<WeatherState, string> = {
  clear:   '☀',
  rain:    '☂',
  storm:   '⚡',
  drought: '◌',
}

const WEATHER_COLOR: Record<WeatherState, string> = {
  clear:   '#ffe0a0',
  rain:    '#80c8ff',
  storm:   '#ffe060',
  drought: '#e08850',
}

const BODY_COLOR: Record<string, string> = {
  Spore: '#80f0a0',
  Shell: '#5ec8e0',
  Spike: '#ff8048',
  Wisp:  '#c878f0',
}

function stageColor(stage: ColonyStage): string {
  const map: Record<ColonyStage, string> = {
    genesis:     '#7878a0',
    nascent:     '#5ec8e0',
    growing:     '#80f0a0',
    established: '#ffc060',
    thriving:    '#ffb050',
    ascendant:   '#c878f0',
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

  const { creatures, colonyStage, awarenessStage, totalDeaths, totalCreaturesEver, caretaker, weather, weatherTimer, modifiers } = gameState
  const maxHealCharges = modifiers?.healCharges ?? HEAL_CHARGES_PER_DAY
  const alive = Object.values(creatures).filter(c => c.diedOnDay === null)
  const maxGen = alive.length > 0 ? Math.max(...alive.map(c => c.generation)) : 0

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

  // Progress toward next stage
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
          <Value accent='#80f0a0'>{alive.length}</Value>
        </Row>
        <Row>
          <Label>ever born</Label>
          <Value>{totalCreaturesEver}</Value>
        </Row>
        <Row>
          <Label>deaths</Label>
          <Value accent={totalDeaths > 0 ? '#ff5060' : undefined}>{totalDeaths}</Value>
        </Row>
        <Row>
          <Label>generation</Label>
          <Value accent='#ffb050'>{maxGen}</Value>
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
          <Value accent={avgHealth < 40 ? '#ff5060' : avgHealth > 75 ? '#80f0a0' : '#ffc060'}>
            {avgHealth}%
          </Value>
        </Row>
        <Row>
          <Label>dominant trait</Label>
          <Value accent='#5ec8e0' style={{ fontSize: 9.5, letterSpacing: '0.1em' }}>
            {dominant?.[0]?.toUpperCase() ?? '—'}
          </Value>
        </Row>
      </Section>

      <Section>
        <SectionTitle>environment</SectionTitle>
        <WeatherRow>
          <WeatherGlyph color={WEATHER_COLOR[currentWeather]}>
            {WEATHER_GLYPH[currentWeather]}
          </WeatherGlyph>
          <WeatherName color={WEATHER_COLOR[currentWeather]}>
            {currentWeather.toUpperCase()}
          </WeatherName>
          <WeatherTimer>{Math.round(weatherTimer ?? 0)}d left</WeatherTimer>
        </WeatherRow>
      </Section>

      <Section>
        <SectionTitle>colony stage</SectionTitle>
        <StageBar stage={colonyStage}>{colonyStage.toUpperCase()}</StageBar>
        {nextStage && (
          <>
            <StageProgress percent={stageProgress} stage={colonyStage} />
            <div style={{ fontSize: 8.5, color: '#4a4a70', textAlign: 'right', marginTop: 3, letterSpacing: '0.1em' }}>
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
          <span style={{ fontSize: 9, color: '#7a78a5', marginLeft: 4, letterSpacing: '0.10em' }}>
            stage {awarenessStage} / 3
          </span>
        </AwarenessTrack>
        <AwarenessLabel>{AWARENESS_PROSE[awarenessStage]}</AwarenessLabel>
      </Section>

      <Section>
        <SectionTitle>caretaker</SectionTitle>
        <Row>
          <Label>heal charges</Label>
          <Value accent={caretaker.healCharges > 0 ? '#ff5060' : '#3a3a55'}>
            {caretaker.healCharges} / {maxHealCharges}
          </Value>
        </Row>
        <HealRow>
          {Array.from({ length: maxHealCharges }, (_, i) => i + 1).map(n => (
            <HealHeart key={n} active={caretaker.healCharges >= n} />
          ))}
          <HealNote>resets daily</HealNote>
        </HealRow>

        <Row style={{ marginTop: 6 }}>
          <Label>river redirect</Label>
          <Value accent={caretaker.riverRedirectUsed ? '#3a3a55' : '#5ec8e0'}>
            {caretaker.riverRedirectUsed ? '◌ used' : '◉ ready'}
          </Value>
        </Row>
      </Section>
    </Panel>
  )
}
