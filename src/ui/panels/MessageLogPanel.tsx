import { useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ColonyMessage } from '@/types'
import { THEME } from '@/ui/theme'

const fadeIn = keyframes`
  from { opacity:0; transform:translateY(4px); }
  to   { opacity:1; transform:translateY(0); }
`

const Panel = styled.div`
  background: ${THEME.bgPanel};
  border: 2px solid ${THEME.border};
  border-radius: 6px;
  padding: 10px 14px 12px;
  font-family: ${THEME.font};
  font-size: 13px;
  color: ${THEME.textPrimary};
  display: flex; flex-direction: column; height: 100%; box-sizing: border-box;
`
const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid ${THEME.border}; flex-shrink: 0;
`
const Title = styled.div`
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.2em; color: ${THEME.textSecondary};
  display: flex; align-items: center; gap: 6px;
`
const ActiveDot = styled.span`width:6px;height:6px;border-radius:50%;background:${THEME.amber};display:inline-block;`
const FilterRow = styled.div`display:flex;gap:5px;align-items:center;`
const FilterBtn = styled.button<{ $active: boolean; $accent: string }>`
  background: ${p => p.$active ? `${p.$accent}22` : 'transparent'};
  border: 1px solid ${p => p.$active ? p.$accent : THEME.border};
  color: ${p => p.$active ? p.$accent : THEME.textTertiary};
  font-family: ${THEME.font}; font-size: 10px; font-weight: 700;
  padding: 3px 9px; cursor: pointer; border-radius: 4px; letter-spacing: 0.1em;
  text-transform: uppercase; transition: all 0.12s;
  &:hover { border-color: ${p => p.$accent}; color: ${p => p.$accent}; }
`
const UnreadBadge = styled.span`
  background: rgba(232,200,74,0.15); border: 1px solid ${THEME.amberBorder};
  color: ${THEME.amber}; font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 4px; margin-left: 4px;
`
const Log = styled.div`
  flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:1px; padding-right:4px;
  &::-webkit-scrollbar { width:4px; }
  &::-webkit-scrollbar-thumb { background:${THEME.borderMid}; border-radius:2px; }
`
const DaySeparator = styled.div`
  display:flex; align-items:center; gap:8px;
  font-size:9px; font-weight:700; color:${THEME.textTertiary};
  letter-spacing:0.2em; text-transform:uppercase;
  margin:8px 0 3px; padding:0 2px;
  &::before,&::after { content:''; flex:1; height:1px; background:${THEME.border}; }
`
const MessageLine = styled.div<{ $stage:number; $isNew:boolean; $clickable:boolean }>`
  padding: 5px 10px;
  border-left: 2px solid ${p =>
    p.$stage >= 5 ? '#d0eeff' :
    p.$stage >= 4 ? '#f0a040' :
    p.$stage >= 3 ? '#c878f0' :
    p.$stage === 2 ? THEME.water :
    THEME.borderMid};
  color: ${p =>
    p.$stage >= 5 ? '#e8f6ff' :
    p.$stage >= 4 ? '#ffe0b0' :
    p.$stage >= 3 ? '#f0d0ff' :
    p.$stage === 2 ? '#b8e0ff' :
    THEME.textSecondary};
  animation: ${p => p.$isNew ? fadeIn : 'none'} 0.35s ease;
  line-height: 1.6;
  font-size: ${p => p.$stage >= 3 ? '13px' : '12px'};
  font-style: ${p => p.$stage >= 2 ? 'italic' : 'normal'};
  font-weight: ${p => p.$stage >= 3 ? 500 : 400};
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  border-radius: 0 4px 4px 0;
  transition: background 0.12s;
  &:hover { background: ${p => p.$clickable ? 'rgba(255,255,255,0.04)' : 'transparent'}; }
`
const Empty = styled.div`
  color: ${THEME.textTertiary}; text-align:center; margin-top:2rem;
  font-size:12px; font-style:italic; letter-spacing:0.1em;
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
