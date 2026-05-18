import { useState } from 'react'
import styled from 'styled-components'
import { Season, DayPhase, MessageStage, EnrichmentType } from '@/types'
import { useLaietStore } from '@/store/gameStore'
import { THUNDER_CHARGES_PER_DAY, FIRE_CHARGES_PER_DAY } from '@/engine/constants'
import { THEME, awarenessColor, weatherColor } from '@/ui/theme'

// ─── Bar root ─────────────────────────────────────────────────────────────────

const Bar = styled.div`
  display: flex; align-items: stretch;
  height: 52px;
  background: ${THEME.panelGradientHi};
  border: 1px solid ${THEME.borderMid};
  border-radius: ${THEME.radius.lg}px;
  font-family: ${THEME.font};
  font-size: ${THEME.type.md}px;
  flex-shrink: 0;
  overflow: visible;
  box-shadow: ${THEME.shadow.panel};
`

// ─── Brand ────────────────────────────────────────────────────────────────────

const Brand = styled.div`
  display: flex; flex-direction: column; justify-content: center;
  padding: 0 ${THEME.space.xl}px;
  border-right: 1px solid ${THEME.border};
  flex-shrink: 0;
  position: relative;
  &::after {
    content: ''; position: absolute; left: ${THEME.space.xl}px; right: ${THEME.space.xl}px;
    bottom: 8px; height: 2px;
    background: linear-gradient(90deg, ${THEME.amber}, transparent);
    opacity: 0.4;
  }
`
const BrandLogo = styled.div`
  font-size: ${THEME.type.xl}px; font-weight: 700;
  color: ${THEME.textPrimary};
  letter-spacing: 0.06em;
`
const BrandAccent = styled.span`color: ${THEME.amber};`
const BrandSub = styled.div`
  font-size: ${THEME.type.xs}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.24em;
  color: ${THEME.textTertiary};
  margin-top: 1px;
`

// ─── Tool group ───────────────────────────────────────────────────────────────

const ToolGroup = styled.div`display: flex; align-items: stretch;`
const ToolBtn = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? THEME.amberDim : 'transparent'};
  border: none;
  border-right: 1px solid ${THEME.border};
  color: ${p => p.$active ? THEME.amber : THEME.textSecondary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.base}px;
  font-weight: ${p => p.$active ? 700 : 500};
  padding: 0 ${THEME.space.lg}px;
  cursor: pointer;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px;
  white-space: nowrap;
  transition: color ${THEME.motion.fast} ${THEME.motion.easeOut},
              background ${THEME.motion.fast} ${THEME.motion.easeOut};
  position: relative;
  &::after {
    content: ''; position: absolute; left: 6px; right: 6px; bottom: 0; height: 2px;
    background: ${p => p.$active ? THEME.amber : 'transparent'};
    border-radius: 2px 2px 0 0;
    box-shadow: ${p => p.$active ? '0 0 12px ' + THEME.amberGlow : 'none'};
    transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  }
  &:hover {
    color: ${THEME.textPrimary};
    background: ${THEME.bgHover};
  }
`
const ToolGlyph = styled.span<{ $active: boolean }>`
  font-size: ${THEME.type.lg}px;
  line-height: 1;
  color: ${p => p.$active ? THEME.amber : THEME.textSecondary};
  filter: ${p => p.$active ? `drop-shadow(0 0 6px ${THEME.amberGlow})` : 'none'};
`
const ToolLabel = styled.span`
  font-size: ${THEME.type.xs}px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`
const KeyHint = styled.span`
  position: absolute; top: 4px; right: 5px;
  font-size: ${THEME.type.xs}px;
  font-weight: 700;
  color: ${THEME.textTertiary};
  opacity: 0.7;
`
const ChargeBadge = styled.span<{ $empty: boolean }>`
  position: absolute; bottom: 4px; right: 5px;
  background: ${p => p.$empty ? THEME.deathDim : THEME.aliveDim};
  border: 1px solid ${p => p.$empty ? THEME.death : THEME.alive};
  color: ${p => p.$empty ? THEME.death : THEME.alive};
  font-size: ${THEME.type.xs}px; font-weight: 700;
  padding: 0 4px; border-radius: ${THEME.radius.xs}px;
  line-height: 1.3;
`

// ─── Enrichment dropdown ──────────────────────────────────────────────────────

const EnrichDropdown = styled.div`
  position: absolute; top: calc(100% + 6px); left: 0;
  background: ${THEME.panelGradient};
  border: 1px solid ${THEME.borderMid};
  border-radius: ${THEME.radius.md}px;
  z-index: 200; min-width: 220px;
  overflow: hidden;
  box-shadow: ${THEME.shadow.pop};
`
const EnrichOption = styled.button<{ $selected: boolean }>`
  display: flex; align-items: center; justify-content: space-between;
  width: 100%;
  background: ${p => p.$selected ? THEME.aliveDim : 'transparent'};
  border: none;
  border-bottom: 1px solid ${THEME.border};
  color: ${p => p.$selected ? THEME.alive : THEME.textSecondary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.md}px; font-weight: 500;
  padding: ${THEME.space.md}px ${THEME.space.lg}px;
  cursor: pointer; text-align: left;
  transition: background ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:hover { background: ${THEME.bgHover}; color: ${THEME.textPrimary}; }
  &:last-child { border-bottom: none; }
`
const EnrichHint = styled.span`
  font-size: ${THEME.type.sm}px;
  color: ${THEME.textTertiary};
  letter-spacing: 0.04em;
`

// ─── Spacer & status block ────────────────────────────────────────────────────

const Spacer = styled.div`flex: 1; min-width: 4px;`
const StatusBlock = styled.div`
  display: flex; align-items: stretch;
  border-left: 1px solid ${THEME.border};
  border-right: 1px solid ${THEME.border};
`
const StatusCell = styled.div`
  display: flex; flex-direction: column; justify-content: center;
  align-items: flex-start; padding: 0 ${THEME.space.lg}px;
  border-right: 1px solid ${THEME.border};
  gap: 2px;
  &:last-child { border-right: none; }
`
const StatusLabel = styled.span`
  font-size: ${THEME.type.xs}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.22em;
  color: ${THEME.textTertiary};
`
const StatusValue = styled.span<{ $color?: string }>`
  font-size: ${THEME.type.lg}px; font-weight: 700;
  color: ${p => p.$color ?? THEME.textPrimary};
  letter-spacing: 0.02em;
  display: flex; align-items: center; gap: 6px;
`
const StatusGlyph = styled.span<{ $color: string }>`
  font-size: ${THEME.type.xl}px;
  color: ${p => p.$color};
  filter: drop-shadow(0 0 4px ${p => p.$color}55);
  line-height: 1;
`
const YearTag = styled.span`
  color: ${THEME.textTertiary};
  font-weight: 500;
  font-size: ${THEME.type.base}px;
  margin-left: 4px;
`

// ─── Awareness pips ───────────────────────────────────────────────────────────

const AwarenessPips = styled.div`display: flex; gap: 4px; align-items: center; margin-top: 2px;`
const Pip = styled.span<{ $active: boolean; $level: number }>`
  width: 9px; height: 9px; border-radius: 50%;
  background: ${p => p.$active ? awarenessColor(p.$level) : 'transparent'};
  border: 1px solid ${p => p.$active ? 'transparent' : THEME.borderMid};
  box-shadow: ${p => p.$active ? `0 0 8px ${awarenessColor(p.$level)}88` : 'none'};
  transition: box-shadow ${THEME.motion.slow} ${THEME.motion.easeOut};
`

// ─── Control buttons ──────────────────────────────────────────────────────────

const CtrlBtn = styled.button<{ $active?: boolean; $accent?: string }>`
  background: ${p => p.$active ? THEME.amberDim : 'transparent'};
  border: none; border-left: 1px solid ${THEME.border};
  color: ${p => p.$active ? (p.$accent ?? THEME.amber) : THEME.textSecondary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.base}px; font-weight: 600;
  padding: 0 ${THEME.space.lg}px;
  cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  white-space: nowrap;
  letter-spacing: 0.04em;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:hover {
    color: ${THEME.textPrimary};
    background: ${THEME.bgHover};
  }
`
const SpeedGroup = styled.div`display: flex; align-items: stretch; border-left: 1px solid ${THEME.border};`
const SpeedBtn = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? THEME.amberDim : 'transparent'};
  border: none; border-right: 1px solid ${THEME.border};
  color: ${p => p.$active ? THEME.amber : THEME.textTertiary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.base}px; font-weight: 700;
  padding: 0 ${THEME.space.md}px;
  cursor: pointer;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  position: relative;
  &::after {
    content: ''; position: absolute; left: 4px; right: 4px; bottom: 0; height: 2px;
    background: ${p => p.$active ? THEME.amber : 'transparent'};
    border-radius: 2px 2px 0 0;
  }
  &:last-child { border-right: none; }
  &:hover { color: ${THEME.textPrimary}; background: ${THEME.bgHover}; }
`

// ─── Lookups ──────────────────────────────────────────────────────────────────

const WEATHER_GLYPH: Record<string, string> = {
  clear:'☀', rain:'☂', storm:'⚡', drought:'◌',
  snow:'❄', heatwave:'🌡', fog:'≋',
  windstorm:'↯', bloom:'✿', ashfall:'░',
}
const SEASON_COLOR: Record<string, string> = {
  spring: THEME.spring, summer: THEME.summer, autumn: THEME.autumn, winter: THEME.winter,
}
const SEASON_GLYPH: Record<string, string> = {
  spring: '✿', summer: '☀', autumn: '🍂', winter: '❄',
}
const PHASE_COLOR: Record<string, string> = {
  dawn:'#ffc070', day: THEME.textPrimary, dusk: THEME.threat, night: THEME.water,
}
const PHASE_GLYPH: Record<string, string> = {
  dawn: '◐', day: '○', dusk: '◑', night: '●',
}

// Tool definitions with glyphs
const TOOL_GLYPHS: Record<string, string> = {
  select: '◎', food: '◉', tree: '⌬', water: '≈',
  thunder: '⚡', fire: '✦', enrich: '✸',
}

export type Tool = 'select' | 'food' | 'tree' | 'water' | 'thunder' | 'fire' | 'enrich'

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
  simSpeed: 1 | 2 | 4 | 8
  onPauseToggle: () => void
  onSpeedChange: (s: 1 | 2 | 4 | 8) => void
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
    { key: 'water',   label: 'River',    hotkey: '4' },
    { key: 'thunder', label: 'Strike',   hotkey: '5', charge: { used: thunderCharges, max: THUNDER_CHARGES_PER_DAY } },
    { key: 'fire',    label: 'Ignite',   hotkey: '6', charge: { used: fireCharges,    max: FIRE_CHARGES_PER_DAY } },
  ]

  const activeEnrichOption = ENRICHMENT_OPTIONS.find(o => o.type === selectedEnrichment) ?? ENRICHMENT_OPTIONS[0]
  const wColor = weatherColor(weather)

  return (
    <Bar>
      <Brand>
        <BrandLogo>LA<BrandAccent>·</BrandAccent>IET</BrandLogo>
        <BrandSub>Field Log</BrandSub>
      </Brand>

      <ToolGroup>
        {tools.map(t => (
          <ToolBtn key={t.key} $active={activeTool === t.key}
            onClick={() => onToolChange(t.key)} title={`${t.label} [${t.hotkey}]`}>
            <ToolGlyph $active={activeTool === t.key}>{TOOL_GLYPHS[t.key]}</ToolGlyph>
            <ToolLabel>{t.label}</ToolLabel>
            <KeyHint>{t.hotkey}</KeyHint>
            {t.charge && <ChargeBadge $empty={t.charge.used <= 0}>{t.charge.used}</ChargeBadge>}
          </ToolBtn>
        ))}
        <div style={{ position: 'relative', display: 'flex', alignSelf: 'stretch' }}>
          <ToolBtn $active={activeTool === 'enrich'}
            onClick={() => { onToolChange('enrich'); setShowEnrichDropdown(v => !v) }}
            title={`Enrich: ${activeEnrichOption.label} [7]`}>
            <ToolGlyph $active={activeTool === 'enrich'}>{TOOL_GLYPHS.enrich}</ToolGlyph>
            <ToolLabel>Enrich</ToolLabel>
            <KeyHint>7</KeyHint>
          </ToolBtn>
          {showEnrichDropdown && activeTool === 'enrich' && (
            <EnrichDropdown>
              {ENRICHMENT_OPTIONS.map(opt => (
                <EnrichOption key={opt.type} $selected={selectedEnrichment === opt.type}
                  onClick={() => { onEnrichmentChange(opt.type); setShowEnrichDropdown(false) }}>
                  {opt.label}
                  <EnrichHint>{opt.hint}</EnrichHint>
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
          <StatusValue>{day}<YearTag>Y{year + 1}</YearTag></StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Season</StatusLabel>
          <StatusValue $color={SEASON_COLOR[season]}>
            <StatusGlyph $color={SEASON_COLOR[season]}>{SEASON_GLYPH[season]}</StatusGlyph>
            {season.charAt(0).toUpperCase() + season.slice(1)}
          </StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Phase</StatusLabel>
          <StatusValue $color={PHASE_COLOR[phase]}>
            <StatusGlyph $color={PHASE_COLOR[phase]}>{PHASE_GLYPH[phase]}</StatusGlyph>
            {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Weather</StatusLabel>
          <StatusValue $color={wColor}>
            <StatusGlyph $color={wColor}>{WEATHER_GLYPH[weather] ?? '?'}</StatusGlyph>
            {weather.charAt(0).toUpperCase() + weather.slice(1)}
          </StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Alive</StatusLabel>
          <StatusValue $color={alive > 0 ? THEME.alive : THEME.death}>{alive}</StatusValue>
        </StatusCell>
        <StatusCell>
          <StatusLabel>Signal</StatusLabel>
          <AwarenessPips>
            {[1, 2, 3, 4, 5].map(n => <Pip key={n} $active={awarenessStage >= n} $level={n} />)}
          </AwarenessPips>
        </StatusCell>
      </StatusBlock>

      <CtrlBtn $active={isPaused} onClick={onPauseToggle} title="Pause / Resume [Space]">
        {isPaused ? '▶ Resume' : '⏸ Pause'}
      </CtrlBtn>
      <SpeedGroup>
        {([1, 2, 4, 8] as const).map(s => (
          <SpeedBtn key={s} $active={simSpeed === s && !isPaused} onClick={() => onSpeedChange(s)}>
            {s}×
          </SpeedBtn>
        ))}
      </SpeedGroup>
      <CtrlBtn onClick={onMuteToggle} title={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted ? '♪' : '♫'}
      </CtrlBtn>
      <CtrlBtn onClick={onSave} title="Manual save [Ctrl+S]">
        Save
      </CtrlBtn>
      <CtrlBtn onClick={onRestartRequest} style={{ color: THEME.textTertiary }}>
        Reset
      </CtrlBtn>
    </Bar>
  )
}
