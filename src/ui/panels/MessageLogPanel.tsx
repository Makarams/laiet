import { useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ColonyMessage } from '@/types'
import { THEME, awarenessColor } from '@/ui/theme'

const fadeIn = keyframes`
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0); }
`

const Panel = styled.div`
  background: ${THEME.panelGradient};
  border: 1px solid ${THEME.borderMid};
  border-radius: ${THEME.radius.lg}px;
  padding: ${THEME.space.lg}px ${THEME.space.xl}px;
  font-family: ${THEME.font};
  font-size: ${THEME.type.lg}px;
  color: ${THEME.textPrimary};
  display: flex; flex-direction: column; height: 100%; box-sizing: border-box;
  box-shadow: ${THEME.shadow.panel};
`
const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: ${THEME.space.md}px;
  padding-bottom: ${THEME.space.md}px;
  border-bottom: 1px solid ${THEME.border};
  flex-shrink: 0;
`
const Title = styled.div`
  font-size: ${THEME.type.base}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.22em;
  color: ${THEME.textSecondary};
  display: flex; align-items: center; gap: ${THEME.space.sm}px;
`
const ActiveDot = styled.span`
  width:7px; height:7px; border-radius:50%;
  background:${THEME.amber};
  box-shadow: 0 0 8px ${THEME.amberGlow};
  display:inline-block;
`
const FilterRow = styled.div`display:flex;gap:${THEME.space.xs}px;align-items:center;`
const FilterBtn = styled.button<{ $active: boolean; $accent: string }>`
  background: ${p => p.$active ? `${p.$accent}22` : 'transparent'};
  border: 1px solid ${p => p.$active ? p.$accent : THEME.border};
  color: ${p => p.$active ? p.$accent : THEME.textTertiary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.sm}px; font-weight: 700;
  padding: ${THEME.space.xs}px ${THEME.space.md}px;
  cursor: pointer; border-radius: ${THEME.radius.xs}px;
  letter-spacing: 0.1em; text-transform: uppercase;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  box-shadow: ${p => p.$active ? `0 0 10px ${p.$accent}33` : 'none'};
  &:hover { border-color: ${p => p.$accent}; color: ${p => p.$accent}; }
`
const UnreadBadge = styled.span`
  background: ${THEME.amberDim};
  border: 1px solid ${THEME.amberBorder};
  color: ${THEME.amber};
  font-size: ${THEME.type.sm}px; font-weight: 700;
  padding: 2px 8px;
  border-radius: ${THEME.radius.xs}px;
  margin-left: 4px;
  box-shadow: 0 0 8px ${THEME.amberGlow};
`
const Log = styled.div`
  flex:1; overflow-y:auto;
  display:flex; flex-direction:column;
  gap:2px; padding-right:${THEME.space.xs}px;
  &::-webkit-scrollbar { width:5px; }
  &::-webkit-scrollbar-thumb { background:${THEME.borderMid}; border-radius:999px; }
`
const DaySeparator = styled.div`
  display:flex; align-items:center; gap:${THEME.space.md}px;
  font-size:${THEME.type.xs}px; font-weight:700;
  color:${THEME.textTertiary};
  letter-spacing:0.24em; text-transform:uppercase;
  margin:${THEME.space.md}px 0 ${THEME.space.xs}px;
  padding:0 2px;
  &::before, &::after { content:''; flex:1; height:1px; background:${THEME.border}; }
`
function lineColor(stage: number, foreground = false): string {
  if (stage >= 5) return foreground ? '#e8f6ff' : awarenessColor(5)
  if (stage >= 4) return foreground ? '#ffd9a0' : awarenessColor(4)
  if (stage >= 3) return foreground ? '#ecc9ff' : awarenessColor(3)
  if (stage === 2) return foreground ? '#b8d8fc' : awarenessColor(2)
  return foreground ? THEME.textSecondary : THEME.borderMid
}
const MessageLine = styled.div<{ $stage:number; $isNew:boolean; $clickable:boolean }>`
  padding: ${THEME.space.sm}px ${THEME.space.md}px ${THEME.space.sm}px ${THEME.space.lg}px;
  border-left: 2px solid ${p => lineColor(p.$stage)};
  color: ${p => lineColor(p.$stage, true)};
  animation: ${p => p.$isNew ? fadeIn : 'none'} ${THEME.motion.slow} ${THEME.motion.easeOut};
  line-height: 1.65;
  font-size: ${p => p.$stage >= 3 ? `${THEME.type.lg}px` : `${THEME.type.md}px`};
  font-style: ${p => p.$stage >= 2 ? 'italic' : 'normal'};
  font-weight: ${p => p.$stage >= 3 ? 500 : 400};
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  border-radius: 0 ${THEME.radius.sm}px ${THEME.radius.sm}px 0;
  transition: background ${THEME.motion.fast} ${THEME.motion.easeOut},
              box-shadow ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:hover {
    background: ${p => p.$clickable ? THEME.bgHover : 'transparent'};
    box-shadow: ${p => p.$stage >= 3 ? `inset 4px 0 16px -8px ${lineColor(p.$stage)}` : 'none'};
  }
`
const Empty = styled.div`
  color: ${THEME.textTertiary}; text-align:center;
  margin-top: 2.5rem;
  font-size:${THEME.type.md}px; font-style:italic; letter-spacing:0.12em;
`

type FilterKey = 'all' | 'obs' | 'aware' | 'death'

function categorize(msg: ColonyMessage): FilterKey[] {
  const keys: FilterKey[] = ['all']
  if (msg.stage === 1) keys.push('obs')
  if (msg.stage >= 2) keys.push('aware')
  if (/(died|gone|silent|fell|never moved again|stops moving|grew still|extinction|silence)/i.test(msg.text)) {
    keys.push('death')
  }
  return keys
}

const FILTERS: { key: FilterKey; label: string; accent: string }[] = [
  { key: 'all',   label: 'All',   accent: THEME.textSecondary },
  { key: 'obs',   label: 'Obs',   accent: THEME.water },
  { key: 'aware', label: 'Aware', accent: '#c878f0' },
  { key: 'death', label: 'Death', accent: THEME.death },
]

export function MessageLogPanel() {
  const gameState    = useLaietStore(s => s.gameState)
  const unread       = useLaietStore(s => s.unreadMessageCount)
  const markRead     = useLaietStore(s => s.markMessagesRead)
  const selectCreature = useLaietStore(s => s.selectCreature)
  const [filter, setFilter] = useState<FilterKey>('all')

  const messages = gameState?.messages ?? []
  const recentThreshold = messages.length - 5

  const filtered = useMemo(() =>
    filter === 'all' ? messages : messages.filter(m => categorize(m).includes(filter)),
    [messages, filter]
  )

  const groupedReversed = useMemo(() => {
    const reversed = [...filtered].reverse()
    const groups: { day:number; items:ColonyMessage[] }[] = []
    let current: { day:number; items:ColonyMessage[] } | null = null
    for (const m of reversed) {
      if (!current || current.day !== m.day) {
        current = { day: m.day, items: [] }
        groups.push(current)
      }
      current.items.push(m)
    }
    return groups
  }, [filtered])

  return (
    <Panel onClick={markRead}>
      <Header>
        <Title>
          <ActiveDot />
          Field Log
          {unread > 0 && <UnreadBadge>+{unread}</UnreadBadge>}
        </Title>
        <FilterRow>
          {FILTERS.map(f => (
            <FilterBtn key={f.key} $active={filter === f.key} $accent={f.accent}
              onClick={e => { e.stopPropagation(); setFilter(f.key) }}>
              {f.label}
            </FilterBtn>
          ))}
        </FilterRow>
      </Header>

      <Log>
        {filtered.length === 0 && <Empty>awaiting transmission</Empty>}
        {groupedReversed.map(group => (
          <div key={group.day}>
            <DaySeparator>Day {group.day}</DaySeparator>
            {group.items.map(msg => {
              const origIdx = messages.indexOf(msg)
              const isNew = origIdx >= recentThreshold
              const clickable = !!msg.creatureId &&
                gameState?.creatures[msg.creatureId]?.diedOnDay === null
              return (
                <MessageLine key={msg.id} $stage={msg.stage} $isNew={isNew} $clickable={clickable}
                  onClick={e => {
                    e.stopPropagation()
                    if (clickable) selectCreature(msg.creatureId!)
                  }}>
                  {msg.text}
                </MessageLine>
              )
            })}
          </div>
        ))}
      </Log>
    </Panel>
  )
}
