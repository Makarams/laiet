import styled from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ColonyStage, WeatherState } from '@/types'
import { HEAL_CHARGES_PER_DAY } from '@/engine/constants'
import { THEME, stageColor, weatherColor } from '@/ui/theme'

// ─── Shared primitives ────────────────────────────────────────────────────────

const Panel = styled.div`
  background: ${THEME.panelGradient};
  border: 1px solid ${THEME.borderMid};
  border-radius: ${THEME.radius.lg}px;
  padding: ${THEME.space.lg}px ${THEME.space.xl}px;
  font-family: ${THEME.font};
  font-size: ${THEME.type.lg}px;
  color: ${THEME.textPrimary};
  flex: 1; min-height: 0; overflow-y: auto; box-sizing: border-box;
  box-shadow: ${THEME.shadow.panel};
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: ${THEME.borderMid}; border-radius: 999px; }
`
const PanelHeader = styled.div`
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: ${THEME.space.md}px;
  margin-bottom: ${THEME.space.lg}px;
  border-bottom: 1px solid ${THEME.border};
`
const PanelTitle = styled.div`
  font-size: ${THEME.type.base}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.22em;
  color: ${THEME.textSecondary};
  display: flex; align-items: center; gap: ${THEME.space.sm}px;
`
const ActiveDot = styled.span`
  width: 7px; height: 7px; border-radius: 50%;
  background: ${THEME.amber};
  box-shadow: 0 0 8px ${THEME.amberGlow};
  display: inline-block;
`
const PanelTag = styled.div`
  font-size: ${THEME.type.sm}px; font-weight: 600;
  color: ${THEME.textTertiary}; letter-spacing: 0.12em;
`
const Section = styled.div`margin-bottom: ${THEME.space.lg}px;`
const SectionTitle = styled.div`
  font-size: ${THEME.type.xs}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.24em;
  color: ${THEME.textTertiary};
  margin-bottom: ${THEME.space.md}px;
  display: flex; align-items: center; gap: ${THEME.space.sm}px;
  &::after { content: ''; flex: 1; height: 1px; background: ${THEME.border}; }
`
const Row = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 3px 0; line-height: 1.55;
`
const Label = styled.span`
  font-size: ${THEME.type.md}px; font-weight: 500;
  color: ${THEME.textSecondary};
`
const Value = styled.span<{ $color?: string }>`
  font-size: ${THEME.type.lg}px; font-weight: 700;
  color: ${p => p.$color ?? THEME.textPrimary};
`

// ─── Stat bar ─────────────────────────────────────────────────────────────────

const BarRow = styled.div`display: flex; align-items: center; gap: ${THEME.space.md}px; margin-bottom: ${THEME.space.sm}px;`
const BarLabel = styled.span`
  font-size: ${THEME.type.base}px; font-weight: 600;
  color: ${THEME.textTertiary}; width: 48px; flex-shrink: 0;
  letter-spacing: 0.04em;
`
const BarTrack = styled.div`
  flex: 1; height: 5px;
  background: ${THEME.bgDeep};
  border-radius: ${THEME.radius.pill}px;
  overflow: hidden;
  box-shadow: inset 0 1px 1px rgba(0,0,0,0.4);
`
const BarFill = styled.div<{ $w: number; $color: string }>`
  width: ${p => Math.min(100, Math.max(0, p.$w))}%; height: 100%;
  background: linear-gradient(90deg, ${p => p.$color}cc, ${p => p.$color});
  border-radius: ${THEME.radius.pill}px;
  box-shadow: 0 0 6px ${p => p.$color}66;
  transition: width 0.4s ${THEME.motion.easeOut};
`
const BarNum = styled.span`
  font-size: ${THEME.type.sm}px; font-weight: 700;
  color: ${THEME.textSecondary}; width: 32px; text-align: right;
`

// ─── Body type grid ───────────────────────────────────────────────────────────

const BodyGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr;
  gap: ${THEME.space.sm}px ${THEME.space.lg}px;
  margin-top: ${THEME.space.xs}px;
`
const BodyCell = styled.div`
  display: flex; align-items: center; gap: ${THEME.space.sm}px;
  padding: ${THEME.space.xs}px ${THEME.space.sm}px;
  background: ${THEME.bgChip};
  border-radius: ${THEME.radius.sm}px;
`
const BodyDot = styled.span<{ $color: string }>`
  width: 9px; height: 9px; border-radius: 50%;
  background: ${p => p.$color};
  box-shadow: 0 0 6px ${p => p.$color}88;
  flex-shrink: 0;
`
const BodyCount = styled.span`
  font-size: ${THEME.type.md}px; font-weight: 700;
  color: ${THEME.textPrimary}; width: 22px;
`
const BodyLabel = styled.span`
  font-size: ${THEME.type.base}px; font-weight: 500;
  color: ${THEME.textSecondary};
`

// ─── Stage bar ────────────────────────────────────────────────────────────────

const StageBar = styled.div<{ $stage: ColonyStage }>`
  margin-top: ${THEME.space.xs}px;
  font-size: ${THEME.type.sm}px; font-weight: 700;
  padding: ${THEME.space.md}px ${THEME.space.lg}px;
  border-radius: ${THEME.radius.md}px;
  background: linear-gradient(180deg, ${p => stageColor(p.$stage)}1c, ${p => stageColor(p.$stage)}10);
  border: 1px solid ${p => stageColor(p.$stage)}55;
  color: ${p => stageColor(p.$stage)};
  text-align: center; letter-spacing: 0.22em; text-transform: uppercase;
  box-shadow: 0 0 14px ${p => stageColor(p.$stage)}22;
`
const StageProgress = styled.div<{ $pct: number; $stage: ColonyStage }>`
  margin-top: ${THEME.space.sm}px; height: 3px;
  background: ${THEME.bgDeep};
  border-radius: ${THEME.radius.pill}px;
  overflow: hidden; position: relative;
  &::after {
    content: ''; position: absolute; top: 0; left: 0; bottom: 0;
    width: ${p => p.$pct}%;
    background: linear-gradient(90deg, ${p => stageColor(p.$stage)}aa, ${p => stageColor(p.$stage)});
    box-shadow: 0 0 8px ${p => stageColor(p.$stage)}66;
    transition: width 0.5s ${THEME.motion.easeOut};
  }
`

// ─── Awareness ────────────────────────────────────────────────────────────────

const AwarenessTrack = styled.div`
  display: flex; align-items: center; gap: ${THEME.space.sm}px;
  margin-top: ${THEME.space.xs}px;
`
const AwDot = styled.div<{ $active: boolean; $level: number }>`
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
  background: ${p => p.$active
    ? p.$level === 5 ? THEME.stage5
    : p.$level === 4 ? THEME.stage4
    : p.$level === 3 ? THEME.stage3
    : p.$level === 2 ? THEME.stage2
    : THEME.stage1
    : THEME.bgDeep};
  border: 1.5px solid ${p => p.$active ? 'transparent' : THEME.borderMid};
  box-shadow: ${p => {
    if (!p.$active) return 'none'
    const c = p.$level === 5 ? THEME.stage5
            : p.$level === 4 ? THEME.stage4
            : p.$level === 3 ? THEME.stage3
            : p.$level === 2 ? THEME.stage2
            : THEME.stage1
    return `0 0 12px ${c}88`
  }};
`
const AwarenessLabel = styled.div`
  margin-top: ${THEME.space.sm}px;
  font-size: ${THEME.type.base}px; font-weight: 400;
  color: ${THEME.textSecondary};
  font-style: italic; line-height: 1.5;
`

// ─── Weather row ──────────────────────────────────────────────────────────────

const WeatherRow = styled.div`
  display: flex; align-items: center;
  gap: ${THEME.space.md}px;
  padding: ${THEME.space.sm}px ${THEME.space.md}px;
  background: ${THEME.bgChip};
  border-radius: ${THEME.radius.sm}px;
  margin: ${THEME.space.xs}px 0;
`
const WeatherGlyph = styled.span<{ $color: string }>`
  font-size: ${THEME.type.xl}px;
  color: ${p => p.$color};
  filter: drop-shadow(0 0 6px ${p => p.$color}88);
  line-height: 1;
`
const WeatherName = styled.span<{ $color: string }>`
  font-size: ${THEME.type.md}px; font-weight: 700;
  color: ${p => p.$color};
  letter-spacing: 0.06em;
`
const WeatherTimer = styled.span`
  font-size: ${THEME.type.base}px;
  color: ${THEME.textTertiary};
  margin-left: auto;
`

// ─── Snow accumulation widget ─────────────────────────────────────────────────

const SnowBar = styled.div<{ $pct: number }>`
  margin-top: ${THEME.space.xs}px; height: 6px;
  background: ${THEME.bgDeep};
  border-radius: ${THEME.radius.pill}px;
  overflow: hidden; position: relative;
  &::after {
    content: ''; position: absolute; top: 0; left: 0; bottom: 0;
    width: ${p => p.$pct}%;
    background: linear-gradient(90deg, ${THEME.weatherStorm}, ${THEME.weatherSnow});
    box-shadow: 0 0 8px ${THEME.weatherSnow}66;
    transition: width 0.5s ${THEME.motion.easeOut};
  }
`

// ─── Constants ────────────────────────────────────────────────────────────────

const WEATHER_GLYPH: Record<WeatherState, string> = {
  clear:'☀', rain:'☂', storm:'⚡', drought:'◌', snow:'❄', heatwave:'🌡', fog:'≋',
  windstorm: '↯', bloom: '✿', ashfall: '░',
}
// Single source of truth for weather colors lives in theme; alias for readability
const WEATHER_COLOR = (w: string) => weatherColor(w)
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
const AWARENESS_PROSE = [
  '',
  'anomalous behaviour detected',   // 1
  'direct address confirmed',        // 2
  'watcher identified',              // 3
  'ancestral memory active',         // 4
  'pattern transcends generation',   // 5
]
const COHORT_PHASE_NAMES: Record<number, string> = {
  1: 'Primal', 2: 'Clan', 3: 'Lineage', 4: 'Ancestral', 5: 'Eternal',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ColonyStatsPanel() {
  const gameState = useLaietStore(s => s.gameState)
  if (!gameState) return null

  const { creatures, colonyStage, awarenessStage, cohortPhase, totalDeaths, totalCreaturesEver,
          totalGenerations, weather, weatherTimer, caretaker, time } = gameState

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

  // Count distinct lineage roots among the living (each '_' branch traces back to one root)
  const lineageRoots = new Set(alive.map(c =>
    c.lineageId.includes('_') ? c.lineageId.split('_')[0] :
    c.lineageId.includes('+') ? c.lineageId : c.lineageId
  ))
  const lineageCount = lineageRoots.size

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
        <Row>
          <Label>Lineages</Label>
          <Value $color={lineageCount > 1 ? THEME.amber : THEME.textTertiary}>{lineageCount}</Value>
        </Row>
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
          <WeatherGlyph $color={WEATHER_COLOR(currentWeather)}>
            {WEATHER_GLYPH[currentWeather] ?? '?'}
          </WeatherGlyph>
          <WeatherName $color={WEATHER_COLOR(currentWeather)}>
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
          {[1,2,3,4,5].map(n => <AwDot key={n} $active={awarenessStage >= n} $level={n} />)}
          <span style={{ fontSize:9, color: THEME.textTertiary, marginLeft:4, letterSpacing:'0.1em' }}>
            depth {awarenessStage} / 5
          </span>
        </AwarenessTrack>
        <AwarenessLabel>{AWARENESS_PROSE[awarenessStage]}</AwarenessLabel>
        <Row style={{ marginTop: 6 }}>
          <Label>Cohort Phase</Label>
          <Value>{COHORT_PHASE_NAMES[cohortPhase ?? 1]} · gen {totalGenerations}</Value>
        </Row>
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

      {gameState.fossilRecord && gameState.fossilRecord.length > 0 && (
        <Section>
          <SectionTitle>Past Extinctions</SectionTitle>
          {gameState.fossilRecord.slice(-3).map(record => (
            <div key={record.id} style={{ marginBottom: 8 }}>
              <Row>
                <Label>Day {record.extinctionDay}</Label>
                <Value $color={THEME.death}>{record.extinctionCause}</Value>
              </Row>
              <div style={{ fontSize:10, color: THEME.textTertiary, lineHeight:1.5 }}>
                gen {record.generationsReached} · {record.peakPopulation} recorded
              </div>
            </div>
          ))}
        </Section>
      )}
    </Panel>
  )
}
