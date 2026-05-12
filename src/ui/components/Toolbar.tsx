import styled from 'styled-components'
import { Season, DayPhase, ColonyStage, MessageStage } from '@/types'
import { useLaietStore } from '@/store/gameStore'

const Bar = styled.div`
  display: flex;
  gap: 8px;
  align-items: stretch;
  padding: 7px 12px;
  background:
    linear-gradient(180deg, rgba(20, 20, 50, 0.55), rgba(12, 12, 36, 0.85)),
    #0a0a22;
  border: 1px solid #1c1c40;
  border-radius: 4px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  flex-wrap: wrap;
  row-gap: 6px;
  box-shadow:
    0 0 0 1px rgba(80, 60, 140, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.025);
`

// ─── Brand block ─────────────────────────────────────────────────────────────

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 14px 0 4px;
  border-right: 1px solid #2a2a55;
`

const BrandLogo = styled.div`
  font-size: 14px;
  letter-spacing: 0.32em;
  color: #d088ff;
  text-shadow: 0 0 10px rgba(200, 120, 240, 0.45);
  font-weight: bold;
`

const BrandSub = styled.div`
  font-size: 10px;
  letter-spacing: 0.24em;
  color: #9090b8;
  margin-top: 2px;
`

// ─── Tools ───────────────────────────────────────────────────────────────────

const ToolGroup = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
`

const ToolBtn = styled.button<{ active: boolean; accent: string }>`
  background: ${p => p.active ? `${p.accent}28` : 'rgba(28, 28, 50, 0.35)'};
  border: 1px solid ${p => p.active ? p.accent : '#3a3a60'};
  color: ${p => p.active ? p.accent : '#b0b0d8'};
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.08em;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  font-weight: ${p => p.active ? 'bold' : 'normal'};

  ${p => p.active && `
    box-shadow: 0 0 12px ${p.accent}55, inset 0 0 10px ${p.accent}20;
    text-shadow: 0 0 6px ${p.accent}80;
  `}

  &:hover {
    border-color: ${p => p.accent};
    color: ${p => p.accent};
  }
`

const ToolGlyph = styled.span`
  font-size: 13px;
  line-height: 1;
`

const KeyHint = styled.span`
  font-size: 10px;
  opacity: 0.80;
  margin-left: 2px;
`

// ─── Status block (center) ───────────────────────────────────────────────────

const Spacer = styled.div`
  flex: 1;
  min-width: 4px;
`

const StatusBlock = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 0 14px;
  border-left: 1px solid #2a2a55;
  border-right: 1px solid #2a2a55;
  flex-wrap: wrap;
  row-gap: 4px;
`

const StatusCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 46px;
`

const StatusLabel = styled.span`
  font-size: 10px;
  color: #9898c0;
  letter-spacing: 0.22em;
  text-transform: uppercase;
`

const StatusValue = styled.span<{ accent?: string }>`
  font-size: 13px;
  color: ${p => p.accent ?? '#f0e6c8'};
  letter-spacing: 0.06em;
  font-weight: bold;
`

// ─── Awareness pips ──────────────────────────────────────────────────────────

const AwarenessPips = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`

const Pip = styled.span<{ active: boolean; level: number }>`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${p => p.active
    ? p.level === 3 ? '#d088ff'
    : p.level === 2 ? '#5ec8e0'
    : '#80f0a0'
    : '#1a1a32'};
  box-shadow: ${p => p.active
    ? `0 0 7px ${p.level === 3 ? '#d088ff' : p.level === 2 ? '#5ec8e0' : '#80f0a0'}`
    : 'none'};
  border: 1px solid ${p => p.active ? 'transparent' : '#2e2e54'};
`

// ─── Charge badge ────────────────────────────────────────────────────────────

const ChargeBadge = styled.span<{ full: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.full ? 'rgba(0,0,0,0.35)' : 'rgba(255,80,96,0.18)'};
  border: 1px solid ${p => p.full ? 'rgba(255,255,255,0.12)' : '#ff5060'};
  color: ${p => p.full ? 'rgba(255,255,255,0.45)' : '#ff8090'};
  border-radius: 2px;
  font-size: 10px;
  padding: 1px 4px;
  letter-spacing: 0.04em;
  margin-left: 2px;
  line-height: 1;
  min-width: 18px;
`

// ─── Right-side controls ─────────────────────────────────────────────────────

const CtrlBtn = styled.button<{ active?: boolean; accent?: string }>`
  background: ${p => p.active ? `${p.accent ?? '#5ec8e0'}22` : 'rgba(28, 28, 50, 0.35)'};
  border: 1px solid ${p => p.active ? (p.accent ?? '#5ec8e0') : '#3a3a60'};
  color: ${p => p.active ? (p.accent ?? '#8af0ff') : '#9a9ac0'};
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.10em;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;

  &:hover {
    border-color: ${p => p.accent ?? '#5ec8e0'};
    color: ${p => p.accent ?? '#8af0ff'};
    box-shadow: 0 0 8px ${p => p.accent ? `${p.accent}44` : 'rgba(94, 200, 224, 0.25)'};
  }
`

// Keep alias for mute button (semantically identical, just named)
const MuteBtn = CtrlBtn

const SpeedGroup = styled.div`
  display: flex;
  border: 1px solid #2a2a50;
  border-radius: 2px;
  overflow: hidden;
`

const SpeedBtn = styled.button<{ active: boolean }>`
  background: ${p => p.active ? 'rgba(180, 160, 240, 0.18)' : 'transparent'};
  border: none;
  border-right: 1px solid #2a2a50;
  color: ${p => p.active ? '#d0b8ff' : '#6868a0'};
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 10px;
  padding: 5px 8px;
  cursor: pointer;
  letter-spacing: 0.06em;
  transition: all 0.12s;

  &:last-child { border-right: none; }
  &:hover { background: rgba(180, 160, 240, 0.10); color: #c0a8ff; }
`

// ─── Constants ───────────────────────────────────────────────────────────────

const SEASON_GLYPH: Record<Season, string> = {
  spring: '✦', summer: '◆', autumn: '☁', winter: '❄',
}

const SEASON_COLOR: Record<Season, string> = {
  spring: '#80f0a0',
  summer: '#ffc060',
  autumn: '#ff8048',
  winter: '#80c8ff',
}

const PHASE_LABEL: Record<DayPhase, string> = {
  dawn: 'DAWN', day: 'DAY', dusk: 'DUSK', night: 'NIGHT',
}

const PHASE_COLOR: Record<DayPhase, string> = {
  dawn:  '#ffc070',
  day:   '#f0e6c8',
  dusk:  '#ff9070',
  night: '#b0a8e8',
}

const STAGE_COLOR: Record<ColonyStage, string> = {
  genesis:     '#9090b8',
  nascent:     '#5ec8e0',
  growing:     '#80f0a0',
  established: '#ffc060',
  thriving:    '#ffb050',
  ascendant:   '#d088ff',
}

export type Tool = 'select' | 'food' | 'tree' | 'river' | 'thunder' | 'fire'

interface ToolbarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
  onMuteToggle: () => void
  onRestartRequest: () => void
  onSave: () => void
  isMuted: boolean
  isPaused: boolean
  simSpeed: 1 | 2 | 4
  onPauseToggle: () => void
  onSpeedChange: (s: 1 | 2 | 4) => void
  day: number
  year: number
  season: Season
  phase: DayPhase
  alive: number
  colonyStage: ColonyStage
  awarenessStage: MessageStage
}

export function Toolbar({
  activeTool, onToolChange, onMuteToggle, onRestartRequest, onSave, isMuted,
  isPaused, simSpeed, onPauseToggle, onSpeedChange,
  day, year, season, phase, alive, colonyStage, awarenessStage,
}: ToolbarProps) {
  const caretaker = useLaietStore(s => s.gameState?.caretaker)

  const thunderLeft = caretaker ? caretaker.thunderChargesToday : 2
  const fireLeft    = caretaker ? caretaker.fireChargesToday    : 3

  const tools: { key: Tool; label: string; glyph: string; hotkey: string; accent: string; charge?: { left: number; max: number } }[] = [
    { key: 'select',  label: 'OBSERVE', glyph: '◎', hotkey: '1', accent: '#5ec8e0' },
    { key: 'food',    label: 'FEED',    glyph: '✦', hotkey: '2', accent: '#80f0a0' },
    { key: 'tree',    label: 'PLANT',   glyph: '⬡', hotkey: '3', accent: '#a8c060' },
    { key: 'river',   label: 'REDIRECT',glyph: '≋', hotkey: '4', accent: '#80c8ff' },
    { key: 'thunder', label: 'STRIKE',  glyph: '⚡', hotkey: '5', accent: '#ffe060', charge: { left: thunderLeft, max: 2 } },
    { key: 'fire',    label: 'IGNITE',  glyph: '◈', hotkey: '6', accent: '#ff7848', charge: { left: fireLeft,    max: 3 } },
  ]

  return (
    <Bar>
      <Brand>
        <BrandLogo>◈ LA-IET</BrandLogo>
        <BrandSub>specimen cabinet</BrandSub>
      </Brand>

      <ToolGroup>
        {tools.map(t => (
          <ToolBtn
            key={t.key}
            active={activeTool === t.key}
            accent={t.accent}
            onClick={() => onToolChange(t.key)}
            title={`Hotkey: ${t.hotkey}${t.charge ? ` · ${t.charge.left}/${t.charge.max} charges` : ''}`}
          >
            <ToolGlyph>{t.glyph}</ToolGlyph>
            {t.label}
            {t.charge && (
              <ChargeBadge full={t.charge.left > 0}>
                {t.charge.left}/{t.charge.max}
              </ChargeBadge>
            )}
            <KeyHint>[{t.hotkey}]</KeyHint>
          </ToolBtn>
        ))}
      </ToolGroup>

      <Spacer />

      <StatusBlock>
        <StatusCell>
          <StatusLabel>day</StatusLabel>
          <StatusValue>
            {day}
            <span style={{ color: '#8888b0', fontSize: 10, marginLeft: 4, fontWeight: 'normal' }}>y{year}</span>
          </StatusValue>
        </StatusCell>

        <StatusCell>
          <StatusLabel>season</StatusLabel>
          <StatusValue accent={SEASON_COLOR[season]}>
            {SEASON_GLYPH[season]} {season.toUpperCase()}
          </StatusValue>
        </StatusCell>

        <StatusCell>
          <StatusLabel>phase</StatusLabel>
          <StatusValue accent={PHASE_COLOR[phase]}>{PHASE_LABEL[phase]}</StatusValue>
        </StatusCell>

        <StatusCell>
          <StatusLabel>alive</StatusLabel>
          <StatusValue accent={alive > 0 ? '#80f0a0' : '#ff5060'}>
            {alive}
          </StatusValue>
        </StatusCell>

        <StatusCell>
          <StatusLabel>stage</StatusLabel>
          <StatusValue accent={STAGE_COLOR[colonyStage]} style={{ fontSize: 11, letterSpacing: '0.14em' }}>
            {colonyStage.toUpperCase()}
          </StatusValue>
        </StatusCell>

        <StatusCell>
          <StatusLabel>awareness</StatusLabel>
          <AwarenessPips style={{ marginTop: 3 }}>
            {[1, 2, 3].map(n => (
              <Pip key={n} active={awarenessStage >= n} level={n} />
            ))}
          </AwarenessPips>
        </StatusCell>
      </StatusBlock>

      {/* Pause / resume */}
      <CtrlBtn
        onClick={onPauseToggle}
        active={isPaused}
        accent='#ffc060'
        title='Pause / resume simulation [Space]'
      >
        <span style={{ fontSize: 13 }}>{isPaused ? '▶' : '⏸'}</span>
        {isPaused ? 'PAUSED' : 'LIVE'}
      </CtrlBtn>

      {/* Speed selector */}
      <SpeedGroup title='Simulation speed'>
        {([1, 2, 4] as const).map(s => (
          <SpeedBtn key={s} active={simSpeed === s && !isPaused} onClick={() => onSpeedChange(s)}>
            {s}×
          </SpeedBtn>
        ))}
      </SpeedGroup>

      <MuteBtn onClick={onMuteToggle} active={!isMuted} accent='#5ec8e0' title='Toggle audio'>
        <span style={{ fontSize: 13 }}>{isMuted ? '♪' : '♫'}</span>
        {isMuted ? 'MUTED' : 'AUDIO'}
      </MuteBtn>

      <CtrlBtn onClick={onSave} title='Save colony (Ctrl+S)'>
        <span style={{ fontSize: 12 }}>◈</span>
        SAVE
      </CtrlBtn>

      <CtrlBtn
        onClick={onRestartRequest}
        title='Reset colony'
        style={{ borderColor: '#3a2040', color: '#9070a8' }}
      >
        <span style={{ fontSize: 12 }}>◇</span>
        RESET
      </CtrlBtn>
    </Bar>
  )
}
