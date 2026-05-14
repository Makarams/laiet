import { useState } from 'react'
import styled from 'styled-components'
import { Season, DayPhase, MessageStage, EnrichmentType } from '@/types'
import { useLaietStore } from '@/store/gameStore'
import { THUNDER_CHARGES_PER_DAY, FIRE_CHARGES_PER_DAY } from '@/engine/constants'
import { THEME } from '@/ui/theme'

const Bar = styled.div`
  display: flex;
  align-items: stretch;
  height: 44px;
  background: #242424;
  border: 2px solid ${THEME.border};
  border-radius: 6px;
  font-family: ${THEME.font};
  font-size: 12px;
  flex-shrink: 0;
  overflow: visible;
`
const Brand = styled.div`
  display: flex; align-items: center; padding: 0 16px;
  border-right: 2px solid ${THEME.border}; gap: 8px; flex-shrink: 0;
`
const BrandLogo = styled.div`
  font-size: 14px; font-weight: 700; color: ${THEME.textPrimary}; letter-spacing: 0.04em;
`
const BrandSub = styled.div`
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.2em; color: ${THEME.textTertiary};
`
const ToolGroup = styled.div`display: flex; align-items: stretch;`
const ToolBtn = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? 'rgba(232,200,74,0.10)' : 'transparent'};
  border: none;
  border-right: 1px solid ${THEME.border};
  border-bottom: 2px solid ${p => p.$active ? THEME.amber : 'transparent'};
  color: ${p => p.$active ? THEME.amber : THEME.textSecondary};
  font-family: ${THEME.font}; font-size: 11px; font-weight: ${p => p.$active ? 700 : 500};
  padding: 0 11px; cursor: pointer; display: flex; align-items: center;
  gap: 5px; white-space: nowrap; transition: color 0.12s, background 0.12s;
  position: relative; margin-bottom: -2px;
  &:hover { color: ${THEME.textPrimary}; background: rgba(255,255,255,0.04); }
`
const KeyHint = styled.span`font-size: 9px; color: ${THEME.textTertiary};`
const ChargeBadge = styled.span<{ $empty: boolean }>`
  position: absolute; top: 4px; right: 4px;
  background: ${p => p.$empty ? 'rgba(200,80,80,0.15)' : 'rgba(120,200,120,0.15)'};
  border: 1px solid ${p => p.$empty ? '#7a2828' : '#3a6a3a'};
  color: ${p => p.$empty ? THEME.death : THEME.alive};
  font-size: 9px; font-weight: 700; padding: 0 4px; border-radius: 3px;
`
const EnrichDropdown = styled.div`
  position: absolute; top: calc(100% + 4px); left: 0;
  background: #242424; border: 2px solid ${THEME.border}; border-radius: 6px;
  z-index: 200; min-width: 200px; overflow: hidden;
`
const EnrichOption = styled.button<{ $selected: boolean }>`
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; background: ${p => p.$selected ? 'rgba(120,200,120,0.10)' : 'transparent'};
  border: none; border-bottom: 1px solid ${THEME.border};
  color: ${p => p.$selected ? THEME.alive : THEME.textSecondary};
  font-family: ${THEME.font}; font-size: 12px; font-weight: 500;
  padding: 9px 13px; cursor: pointer; text-align: left;
  &:hover { background: rgba(255,255,255,0.05); color: ${THEME.textPrimary}; }
  &:last-child { border-bottom: none; }
`
const Spacer = styled.div`flex: 1; min-width: 4px;`
const StatusBlock = styled.div`
  display: flex; align-items: stretch;
  border-left: 2px solid ${THEME.border}; border-right: 2px solid ${THEME.border};
`
const StatusCell = styled.div`
  display: flex; flex-direction: column; justify-content: center;
  align-items: flex-start; padding: 0 13px;
  border-right: 1px solid ${THEME.border}; gap: 1px;
  &:last-child { border-right: none; }
`
const StatusLabel = styled.span`
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.2em; color: ${THEME.textTertiary};
`
const StatusValue = styled.span<{ $color?: string }>`
  font-size: 13px; font-weight: 700;
  color: ${p => p.$color ?? THEME.textPrimary};
`
const AwarenessPips = styled.div`display: flex; gap: 4px; align-items: center; margin-top: 2px;`
const Pip = styled.span<{ $active: boolean; $level: number }>`
  width: 8px; height: 8px; border-radius: 50%;
  background: ${p => p.$active
    ? p.$level === 3 ? '#c878f0' : p.$level === 2 ? THEME.water : THEME.alive
    : THEME.border};
  border: 1px solid ${p => p.$active ? 'transparent' : THEME.borderMid};
`
const CtrlBtn = styled.button<{ $active?: boolean }>`
  background: ${p => p.$active ? 'rgba(232,200,74,0.10)' : 'transparent'};
  border: none; border-left: 2px solid ${THEME.border};
  color: ${p => p.$active ? THEME.amber : THEME.textSecondary};
  font-family: ${THEME.font}; font-size: 11px; font-weight: 600;
  padding: 0 12px; cursor: pointer; display: flex; align-items: center;
  gap: 5px; white-space: nowrap; transition: all 0.12s;
  &:hover { color: ${THEME.textPrimary}; background: rgba(255,255,255,0.05); }
`
const SpeedGroup = styled.div`display: flex; align-items: stretch; border-left: 2px solid ${THEME.border};`
const SpeedBtn = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? 'rgba(232,200,74,0.10)' : 'transparent'};
  border: none; border-right: 1px solid ${THEME.border};
  color: ${p => p.$active ? THEME.amber : THEME.textTertiary};
  font-family: ${THEME.font}; font-size: 11px; font-weight: 700;
  padding: 0 10px; cursor: pointer; transition: all 0.12s;
  &:last-child { border-right: none; }
  &:hover { color: ${THEME.textPrimary}; background: rgba(255,255,255,0.04); }
`

const WEATHER_GLYPH: Record<string, string> = { clear:'☀', rain:'☂', storm:'⚡', drought:'◌', snow:'❄' }
const WEATHER_COLOR: Record<string, string> = { clear: THEME.amber, rain: THEME.water, storm: '#a0c8f0', drought: THEME.threat, snow: '#d0eeff' }
const SEASON_COLOR: Record<string, string> = { spring: THEME.spring, summer: THEME.summer, autumn: THEME.autumn, winter: THEME.winter }
const PHASE_COLOR: Record<string, string> = { dawn:'#ffc070', day: THEME.textPrimary, dusk: THEME.threat, night: THEME.water }

export type Tool = 'select' | 'food' | 'tree' | 'river' | 'thunder' | 'fire' | 'enrich'

const ENRICHMENT_OPTIONS: { type: EnrichmentType; label: string; hint: string }[] = [
  { type: 'resting_spot',    label: 'Rest site',     hint: 'stress↓ warmth↑' },
  { type: 'scratching_post', label: 'Scratch Post',  hint: 'stress↓↓' },
  { type: 'burrow',          label: 'Burrow',        hint: 'stress↓ warmth↑↑' },
  { type: 'warm_stone',      label: 'Heat stone',    hint: 'warmth↑↑↑' },
  { type: 'mud_pool',        label: 'Mud Pool',      hint: 'thirst↓↓' },
  { type: 'worn_path',       label: 'Worn Path',     hint: 'exercise' },
  { type: 'play_stones',     label: 'Play Stones',   hint: 'stress↓↓ social' },
  { type: 'springy_moss',    label: 'Springy Moss',  hint: 'stress↓↓↓ health↑' },
]

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
  awarenessStage: MessageStage
  selectedEnrichment: EnrichmentType
  onEnrichmentChange: (type: EnrichmentType) => void
}

export function Toolbar({
  activeTool, onToolChange, onMuteToggle, onRestartRequest, onSave, isMuted,
  isPaused, simSpeed, onPauseToggle, onSpeedChange,
  day, year, season, phase, alive, awarenessStage,
  selectedEnrichment, onEnrichmentChange,
}: ToolbarProps) {
  const [showEnrichDropdown, setShowEnrichDropdown] = useState(false)
  const caretaker = useLaietStore(s => s.gameState?.caretaker)
  const weather    = useLaietStore(s => s.gameState?.weather ?? 'clear')

  const thunderCharges = caretaker?.thunderChargesToday ?? THUNDER_CHARGES_PER_DAY
  const fireCharges    = caretaker?.fireChargesToday    ?? FIRE_CHARGES_PER_DAY

  const tools: { key: Tool; label: string; hotkey: string; charge?: { used: number; max: number } }[] = [
    { key: 'select',  label: 'Observe',  hotkey: '1' },
    { key: 'food',    label: 'Feed',     hotkey: '2' },
    { key: 'tree',    label: 'Plant',    hotkey: '3' },
    { key: 'river',   label: 'Divert',   hotkey: '4' },
    { key: 'thunder', label: 'Strike',   hotkey: '5', charge: { used: thunderCharges, max: THUNDER_CHARGES_PER_DAY } },
    { key: 'fire',    label: 'Ignite',   hotkey: '6', charge: { used: fireCharges,    max: FIRE_CHARGES_PER_DAY } },
  ]

  const activeEnrichOption = ENRICHMENT_OPTIONS.find(o => o.type === selectedEnrichment) ?? ENRICHMENT_OPTIONS[0]

  return (
    <Bar>
      <Brand>
        <BrandLogo>LAIET</BrandLogo>
        <BrandSub>Field Log</BrandSub>
      </Brand>

      <ToolGroup>
        {tools.map(t => (
          <ToolBtn key={t.key} $active={activeTool === t.key}
            onClick={() => onToolChange(t.key)} title={`${t.label} [${t.hotkey}]`}>
            {t.label}
            <KeyHint>[{t.hotkey}]</KeyHint>
            {t.charge && <ChargeBadge $empty={t.charge.used <= 0}>{t.charge.used}</ChargeBadge>}
          </ToolBtn>
        ))}
        <div style={{ position: 'relative', display: 'flex', alignSelf: 'stretch' }}>
          <ToolBtn $active={activeTool === 'enrich'}
            onClick={() => { onToolChange('enrich'); setShowEnrichDropdown(v => !v) }}
            title={`Enrich: ${activeEnrichOption.label} [7]`}>
            Enrich <KeyHint>[7]</KeyHint>
          </ToolBtn>
          {showEnrichDropdown && activeTool === 'enrich' && (
            <EnrichDropdown>
              {ENRICHMENT_OPTIONS.map(opt => (
                <EnrichOption key={opt.type} $selected={selectedEnrichment === opt.type}
                  onClick={() => { onEnrichmentChange(opt.type); setShowEnrichDropdown(false) }}>
                  {opt.label}
                  <span style={{ fontSize: 10, color: THEME.textTertiary }}>{opt.hint}</span>
                </EnrichOption>
              ))}
            </EnrichDropdown>
          )}
        </div>
      </ToolGroup>

      <Spacer />

      <StatusBlock>
        <StatusCell>
          <StatusLabel>Day</StatusLabel>
          <StatusValue>
            {day}
            <span style={{ color: THEME.textTertiary, fontWeight: 500, fontSize: 11, marginLeft: 4 }}>Y{year + 1}</span>
          </StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Season</StatusLabel>
          <StatusValue $color={SEASON_COLOR[season]}>{season.charAt(0).toUpperCase() + season.slice(1)}</StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Phase</StatusLabel>
          <StatusValue $color={PHASE_COLOR[phase]}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Weather</StatusLabel>
          <StatusValue $color={WEATHER_COLOR[weather] ?? THEME.amber}>
            {WEATHER_GLYPH[weather] ?? '?'} {weather.charAt(0).toUpperCase() + weather.slice(1)}
          </StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Alive</StatusLabel>
          <StatusValue $color={alive > 0 ? THEME.alive : THEME.death}>{alive}</StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Signal</StatusLabel>
          <AwarenessPips>
            {[1, 2, 3].map(n => <Pip key={n} $active={awarenessStage >= n} $level={n} />)}
          </AwarenessPips>
        </StatusCell>
      </StatusBlock>

      <CtrlBtn $active={isPaused} onClick={onPauseToggle}>{isPaused ? '▶ Resume' : '⏸ Pause'}</CtrlBtn>
      <SpeedGroup>
        {([1, 2, 4] as const).map(s => (
          <SpeedBtn key={s} $active={simSpeed === s && !isPaused} onClick={() => onSpeedChange(s)}>{s}×</SpeedBtn>
        ))}
      </SpeedGroup>
      <CtrlBtn onClick={onMuteToggle}>{isMuted ? '♪' : '♫'}</CtrlBtn>
      <CtrlBtn onClick={onSave}>Save</CtrlBtn>
      <CtrlBtn onClick={onRestartRequest} style={{ color: THEME.textTertiary, borderRight: 'none' }}>Reset</CtrlBtn>
    </Bar>
  )
}
