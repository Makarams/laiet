import styled from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ColonyStage, WeatherState } from '@/types'
import { HEAL_CHARGES_PER_DAY } from '@/engine/constants'
import { THEME, stageColor } from '@/ui/theme'

// ─── Shared primitives ────────────────────────────────────────────────────────

const Panel = styled.div`
  background: ${THEME.bgPanel};
  border: 2px solid ${THEME.border};
  border-radius: 6px;
  padding: 12px 14px;
  font-family: ${THEME.font};
  font-size: 13px;
  color: ${THEME.textPrimary};
  flex: 1; min-height: 0; overflow-y: auto; box-sizing: border-box;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${THEME.borderMid}; border-radius: 2px; }
`
const PanelHeader = styled.div`
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: 8px; margin-bottom: 10px; border-bottom: 2px solid ${THEME.border};
`
const PanelTitle = styled.div`
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.2em; color: ${THEME.textSecondary};
  display: flex; align-items: center; gap: 6px;
`
const ActiveDot = styled.span`
  width: 6px; height: 6px; border-radius: 50%; background: ${THEME.amber};
  display: inline-block;
`
const PanelTag = styled.div`font-size: 10px; font-weight: 600; color: ${THEME.textTertiary}; letter-spacing: 0.1em;`
const Section = styled.div`margin-bottom: 12px;`
const SectionTitle = styled.div`
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em;
  color: ${THEME.textTertiary}; margin-bottom: 7px; display: flex; align-items: center; gap: 6px;
  &::after { content: ''; flex: 1; height: 1px; background: ${THEME.border}; }
`
const Row = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 3px 0; line-height: 1.5;
`
const Label = styled.span`font-size: 12px; font-weight: 500; color: ${THEME.textSecondary};`
const Value = styled.span<{ $color?: string }>`
  font-size: 13px; font-weight: 700;
  color: ${p => p.$color ?? THEME.textPrimary};
`

// ─── Stat bar ─────────────────────────────────────────────────────────────────

const BarRow = styled.div`display: flex; align-items: center; gap: 7px; margin-bottom: 5px;`
const BarLabel = styled.span`font-size: 11px; font-weight: 600; color: ${THEME.textTertiary}; width: 44px; flex-shrink: 0;`
const BarTrack = styled.div`flex: 1; height: 4px; background: ${THEME.bgDeep}; border-radius: 2px; overflow: hidden;`
const BarFill = styled.div<{ $w: number; $color: string }>`
  width: ${p => Math.min(100, Math.max(0, p.$w))}%; height: 100%;
  background: ${p => p.$color}; border-radius: 2px;
`
const BarNum = styled.span`font-size: 10px; font-weight: 600; color: ${THEME.textSecondary}; width: 30px; text-align: right;`

// ─── Body type grid ───────────────────────────────────────────────────────────

const BodyGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; margin-top: 2px;`
const BodyCell = styled.div`display: flex; align-items: center; gap: 6px;`
const BodyDot = styled.span<{ $color: string }>`
  width: 8px; height: 8px; border-radius: 50%; background: ${p => p.$color}; flex-shrink: 0;
`
const BodyCount = styled.span`font-size: 12px; font-weight: 700; color: ${THEME.textPrimary}; width: 22px;`
const BodyLabel = styled.span`font-size: 11px; font-weight: 500; color: ${THEME.textSecondary};`

// ─── Stage bar ────────────────────────────────────────────────────────────────

const StageBar = styled.div<{ $stage: ColonyStage }>`
  margin-top: 4px; font-size: 10px; font-weight: 700; padding: 6px 10px;
  border-radius: 4px;
  background: ${p => stageColor(p.$stage)}18;
  border: 1px solid ${p => stageColor(p.$stage)}44;
  color: ${p => stageColor(p.$stage)};
  text-align: center; letter-spacing: 0.2em; text-transform: uppercase;
`
const StageProgress = styled.div<{ $pct: number; $stage: ColonyStage }>`
  margin-top: 5px; height: 3px; background: ${THEME.bgDeep};
  border-radius: 2px; overflow: hidden; position: relative;
  &::after {
    content: ''; position: absolute; top: 0; left: 0; bottom: 0;
    width: ${p => p.$pct}%;
    background: ${p => stageColor(p.$stage)};
    transition: width 0.5s ease;
  }
`

// ─── Awareness ────────────────────────────────────────────────────────────────

const AwarenessTrack = styled.div`display: flex; align-items: center; gap: 6px; margin-top: 3px;`
const AwDot = styled.div<{ $active: boolean; $level: number }>`
  width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0;
  background: ${p => p.$active
    ? p.$level === 3 ? '#c878f0' : p.$level === 2 ? THEME.water : THEME.alive
    : THEME.bgDeep};
  border: 2px solid ${p => p.$active ? 'transparent' : THEME.borderMid};
`
const AwarenessLabel = styled.div`
  margin-top: 6px; font-size: 11px; font-weight: 400; color: ${THEME.textSecondary};
  font-style: italic; line-height: 1.5;
`

// ─── Weather row ──────────────────────────────────────────────────────────────

const WeatherRow = styled.div`display: flex; align-items: center; gap: 8px; margin: 4px 0;`
const WeatherGlyph = styled.span<{ $color: string }>`font-size: 17px; color: ${p => p.$color};`
const WeatherName = styled.span<{ $color: string }>`
  font-size: 12px; font-weight: 700; color: ${p => p.$color}; letter-spacing: 0.06em;
`
const WeatherTimer = styled.span`font-size: 11px; color: ${THEME.textTertiary}; margin-left: auto;`

// ─── Snow accumulation widget ─────────────────────────────────────────────────

const SnowBar = styled.div<{ $pct: number }>`
  margin-top: 4px; height: 5px; background: ${THEME.bgDeep};
  border-radius: 3px; overflow: hidden; position: relative;
  &::after {
    content: ''; position: absolute; top: 0; left: 0; bottom: 0;
    width: ${p => p.$pct}%;
    background: linear-gradient(90deg, #a0c8f0, #d0eeff);
    transition: width 0.5s ease;
  }
`

// ─── Constants ────────────────────────────────────────────────────────────────

const WEATHER_GLYPH: Record<WeatherState, string> = {
  clear:'☀', rain:'☂', storm:'⚡', drought:'◌', snow:'❄', heatwave:'🌡', fog:'≋',
}
const WEATHER_COLOR: Record<string, string> = {
  clear: THEME.amber, rain: THEME.water, storm: '#a0c8f0',
  drought: THEME.threat, snow: '#d0eeff',
}
const BODY_COLOR: Record<string, string> = {
  Spore: THEME.spore, Shell: THEME.shell, Spike: THEME.spike, Wisp: THEME.wisp,
}
const SEASON_COLOR: Record<string, string> = {
  spring: THEME.spring, summer: THEME.summer, autumn: THEME.autumn, winter: THEME.winter,
}
const STAGE_THRESHOLDS: Record<ColonyStage, number> = {
  genesis:0, nascent:6, growing:16, established:31, thriving:51, ascendant:80,
}
const STAGES: ColonyStage[] = ['genesis','nascent','growing','established','thriving','ascendant']
const AWARENESS_PROSE = ['', 'anomalous behaviour detected', 'direct address confirmed']

// ─── Component ────────────────────────────────────────────────────────────────

export function ColonyStatsPanel() {
  const gameState = useLaietStore(s => s.gameState)
  if (!gameState) return null

  const { creatures, colonyStage, awarenessStage, totalDeaths, totalCreaturesEver,
          weather, weatherTimer, caretaker, time } = gameState

  const maxHealCharges = HEAL_CHARGES_PER_DAY
  const alive = Object.values(creatures).filter(c => c.diedOnDay === null)
  const maxGen = alive.length > 0 ? Math.max(...alive.map(c => c.generation)) : 0

  const avgHealth = alive.length > 0
    ? Math.round(alive.reduce((s, c) => s + c.health, 0) / alive.length) : 0
  const avgHunger = alive.length > 0
    ? Math.round(alive.reduce((s, c) => s + c.hunger, 0) / alive.length) : 0
  const avgWarmth = alive.length > 0
    ? Math.round(alive.reduce((s, c) => s + c.warmth, 0) / alive.length) : 0

  const bodyCounts = { Spore:0, Shell:0, Spike:0, Wisp:0 } as Record<string,number>
  for (const c of alive) bodyCounts[c.genome.body] = (bodyCounts[c.genome.body] ?? 0) + 1

  const currentStageIdx = STAGES.indexOf(colonyStage)
  const nextStage = STAGES[currentStageIdx + 1]
  const stageProgress = nextStage
    ? Math.min(100, ((alive.length - STAGE_THRESHOLDS[colonyStage]) /
        (STAGE_THRESHOLDS[nextStage] - STAGE_THRESHOLDS[colonyStage])) * 100)
    : 100

  const currentWeather = (weather ?? 'clear') as WeatherState
  // snowAccumulation is optional on GameState (new feature)
  const snowAcc = (gameState as any).snowAccumulation ?? 0

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle><ActiveDot />Field Count</PanelTitle>
        <PanelTag>OBS-01</PanelTag>
      </PanelHeader>

      <Section>
        <SectionTitle>Population</SectionTitle>
        <Row><Label>Alive</Label><Value $color={THEME.alive}>{alive.length}</Value></Row>
        <Row><Label>Recorded</Label><Value>{totalCreaturesEver}</Value></Row>
        <Row><Label>Lost</Label>
          <Value $color={totalDeaths > 0 ? THEME.death : undefined}>{totalDeaths}</Value>
        </Row>
        <Row><Label>Generation</Label><Value $color={THEME.amber}>{maxGen}</Value></Row>
      </Section>

      <Section>
        <SectionTitle>Morphotypes</SectionTitle>
        <BodyGrid>
          {(['Spore','Shell','Spike','Wisp'] as const).map(body => (
            <BodyCell key={body}>
              <BodyDot $color={BODY_COLOR[body]} />
              <BodyCount>{bodyCounts[body]}</BodyCount>
              <BodyLabel>{body}</BodyLabel>
            </BodyCell>
          ))}
        </BodyGrid>
      </Section>

      <Section>
        <SectionTitle>Group Status</SectionTitle>
        <BarRow>
          <BarLabel>Health</BarLabel>
          <BarTrack><BarFill $w={avgHealth} $color={avgHealth < 40 ? THEME.threat : avgHealth > 75 ? THEME.alive : THEME.amber} /></BarTrack>
          <BarNum>{avgHealth}%</BarNum>
        </BarRow>
        <BarRow>
          <BarLabel>Hunger</BarLabel>
          <BarTrack><BarFill $w={avgHunger} $color={avgHunger > 70 ? THEME.threat : THEME.amber} /></BarTrack>
          <BarNum>{avgHunger}%</BarNum>
        </BarRow>
        <BarRow>
          <BarLabel>Warmth</BarLabel>
          <BarTrack><BarFill $w={avgWarmth} $color={avgWarmth < 30 ? THEME.water : THEME.alive} /></BarTrack>
          <BarNum>{avgWarmth}%</BarNum>
        </BarRow>
      </Section>

      <Section>
        <SectionTitle>Conditions</SectionTitle>
        <Row>
          <Label>Season</Label>
          <Value $color={SEASON_COLOR[time.season]}>
            {time.season.charAt(0).toUpperCase() + time.season.slice(1)} · Yr {time.year + 1} · D{time.day}
          </Value>
        </Row>
        <WeatherRow>
          <WeatherGlyph $color={WEATHER_COLOR[currentWeather] ?? THEME.amber}>
            {WEATHER_GLYPH[currentWeather] ?? '?'}
          </WeatherGlyph>
          <WeatherName $color={WEATHER_COLOR[currentWeather] ?? THEME.amber}>
            {currentWeather.charAt(0).toUpperCase() + currentWeather.slice(1)}
          </WeatherName>
          <WeatherTimer>{Math.round(weatherTimer ?? 0)}d</WeatherTimer>
        </WeatherRow>
        {(currentWeather === 'snow' || snowAcc > 0) && (
          <>
            <Row>
              <Label>Snow cover</Label>
              <Value $color="#d0eeff">{Math.round(snowAcc)}%</Value>
            </Row>
            <SnowBar $pct={snowAcc} />
          </>
        )}
      </Section>

      <Section>
        <SectionTitle>Cohort Phase</SectionTitle>
        <StageBar $stage={colonyStage}>{colonyStage}</StageBar>
        {nextStage && (
          <>
            <StageProgress $pct={stageProgress} $stage={colonyStage} />
            <div style={{ fontSize:9, color: THEME.textTertiary, textAlign:'right', marginTop:3, letterSpacing:'0.1em' }}>
              → {nextStage.toUpperCase()}
            </div>
          </>
        )}
      </Section>

      <Section>
        <SectionTitle>Signal Depth</SectionTitle>
        <AwarenessTrack>
          {[1,2,3].map(n => <AwDot key={n} $active={awarenessStage >= n} $level={n} />)}
          <span style={{ fontSize:9, color: THEME.textTertiary, marginLeft:4, letterSpacing:'0.1em' }}>
            stage {awarenessStage} / 3
          </span>
        </AwarenessTrack>
        <AwarenessLabel>{AWARENESS_PROSE[awarenessStage]}</AwarenessLabel>
      </Section>

      <Section>
        <SectionTitle>Operator</SectionTitle>
        <Row>
          <Label>Interventions</Label>
          <Value $color={caretaker.healCharges > 0 ? THEME.alive : THEME.death}>
            {caretaker.healCharges}/{maxHealCharges}
          </Value>
        </Row>
        <Row>
          <Label>Water divert</Label>
          <Value $color={caretaker.riverRedirectUsed ? THEME.threat : THEME.alive}>
            {caretaker.riverRedirectUsed ? 'Used' : 'Ready'}
          </Value>
        </Row>
      </Section>
    </Panel>
  )
}
