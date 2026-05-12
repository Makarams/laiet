import { useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ColonyMessage } from '@/types'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`

const Panel = styled.div`
  background:
    linear-gradient(180deg, rgba(20, 20, 50, 0.30), rgba(8, 8, 28, 0.85)),
    #06061a;
  border: 1px solid #2a2a50;
  border-radius: 4px;
  padding: 10px 14px 12px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  color: #f0e6c8;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  box-sizing: border-box;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.40);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2a2a55;
  flex-shrink: 0;
`

const Title = styled.div`
  font-size: 12px;
  color: #d088ff;
  letter-spacing: 0.22em;
  text-shadow: 0 0 10px rgba(200, 120, 240, 0.40);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;

  &::before {
    content: '◈';
    color: #d088ff;
    text-shadow: 0 0 10px #d088ff;
  }
`

// ─── Filter chips ────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'obs' | 'aware' | 'death'

const FilterRow = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
`

const FilterBtn = styled.button<{ active: boolean; accent: string }>`
  background: ${p => p.active ? `${p.accent}28` : 'rgba(28, 28, 50, 0.35)'};
  border: 1px solid ${p => p.active ? p.accent : '#3a3a60'};
  color: ${p => p.active ? p.accent : '#9090b8'};
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 10.5px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: all 0.15s;
  font-weight: bold;

  &:hover {
    border-color: ${p => p.accent};
    color: ${p => p.accent};
  }
`

const UnreadBadge = styled.span`
  background: rgba(200, 120, 240, 0.22);
  border: 1px solid #7a48a8;
  color: #f0a0ff;
  font-size: 10.5px;
  padding: 3px 9px;
  border-radius: 2px;
  letter-spacing: 0.10em;
  margin-left: 5px;
  box-shadow: 0 0 8px rgba(200, 120, 240, 0.40);
  font-weight: bold;
`

// ─── Log ─────────────────────────────────────────────────────────────────────

const Log = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-right: 4px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #2e2e60; border-radius: 2px; }
`

const DaySeparator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: #8a8ab0;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  margin: 8px 0 3px;
  padding: 0 4px;
  font-weight: bold;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #3a4a6e, transparent);
  }
`

const MessageLine = styled.div<{ stage: number; isNew: boolean; clickable: boolean }>`
  padding: 4px 10px;
  border-left: 2px solid ${p =>
    p.stage === 3 ? '#d088ff' :
    p.stage === 2 ? '#5ec8e0' :
    '#3a3a60'};
  color: ${p =>
    p.stage === 3 ? '#f0c0ff' :
    p.stage === 2 ? '#a0e8f8' :
    '#c0c0d8'};
  animation: ${p => p.isNew ? fadeIn : 'none'} 0.4s ease;
  line-height: 1.55;
  font-size: ${p => p.stage === 3 ? '13px' : '12px'};
  font-style: ${p => p.stage >= 2 ? 'italic' : 'normal'};
  text-shadow: ${p => p.stage === 3 ? '0 0 8px rgba(208, 136, 255, 0.45)' :
    p.stage === 2 ? '0 0 6px rgba(94, 200, 224, 0.30)' : 'none'};
  cursor: ${p => p.clickable ? 'pointer' : 'default'};
  transition: background 0.15s;
  border-radius: 0 2px 2px 0;

  &:hover {
    background: ${p => p.clickable ? 'rgba(94, 200, 224, 0.06)' : 'transparent'};
  }

  .day {
    color: #6a6a8a;
    margin-right: 7px;
    font-style: normal;
    letter-spacing: 0.06em;
  }
`

const Empty = styled.div`
  color: #6a6a8a;
  text-align: center;
  margin-top: 1.8rem;
  font-size: 11.5px;
  letter-spacing: 0.18em;
  font-style: italic;
`

// ─── Filter logic ────────────────────────────────────────────────────────────

function categorize(msg: ColonyMessage): FilterKey[] {
  const keys: FilterKey[] = ['all']
  if (msg.stage === 1) keys.push('obs')
  if (msg.stage >= 2) keys.push('aware')
  // Death-related messages start with patterns from messages.ts deathMessage
  if (/(died|gone|silent|fell|never moved again|stops moving|grew still|extinction|silence)/i.test(msg.text)) {
    keys.push('death')
  }
  return keys
}

const FILTERS: { key: FilterKey; label: string; accent: string }[] = [
  { key: 'all',   label: 'ALL',     accent: '#7a78a5' },
  { key: 'obs',   label: 'OBS',     accent: '#9aacb8' },
  { key: 'aware', label: 'AWARE',   accent: '#c878f0' },
  { key: 'death', label: 'DEATH',   accent: '#ff5060' },
]

// ─── Main panel ──────────────────────────────────────────────────────────────

export function MessageLogPanel() {
  const gameState = useLaietStore(s => s.gameState)
  const unread = useLaietStore(s => s.unreadMessageCount)
  const markRead = useLaietStore(s => s.markMessagesRead)
  const selectCreature = useLaietStore(s => s.selectCreature)

  const [filter, setFilter] = useState<FilterKey>('all')

  const messages = gameState?.messages ?? []
  const recentThreshold = messages.length - 5

  const filtered = useMemo(() =>
    filter === 'all'
      ? messages
      : messages.filter(m => categorize(m).includes(filter)),
    [messages, filter]
  )

  // Build day-grouped reversed view (newest first)
  const groupedReversed = useMemo(() => {
    const reversed = [...filtered].reverse()
    const groups: { day: number; items: ColonyMessage[] }[] = []
    let current: { day: number; items: ColonyMessage[] } | null = null
    for (const m of reversed) {
      if (!current || current.day !== m.day) {
        current = { day: m.day, items: [] }
        groups.push(current)
      }
      current.items.push(m)
    }
    return groups
  }, [filtered])

  const onMessageClick = (msg: ColonyMessage) => {
    if (msg.creatureId && gameState?.creatures[msg.creatureId]?.diedOnDay === null) {
      selectCreature(msg.creatureId)
    }
  }

  return (
    <Panel onClick={markRead}>
      <Header>
        <Title>TRANSMISSION LOG</Title>
        <FilterRow>
          {FILTERS.map(f => (
            <FilterBtn
              key={f.key}
              active={filter === f.key}
              accent={f.accent}
              onClick={(e) => { e.stopPropagation(); setFilter(f.key) }}
            >
              {f.label}
            </FilterBtn>
          ))}
          {unread > 0 && <UnreadBadge>+{unread}</UnreadBadge>}
        </FilterRow>
      </Header>

      <Log>
        {filtered.length === 0 && (
          <Empty>
            ∙ awaiting transmission ∙
          </Empty>
        )}
        {groupedReversed.map(group => (
          <div key={group.day}>
            <DaySeparator>day {group.day}</DaySeparator>
            {group.items.map((msg) => {
              const origIdx = messages.indexOf(msg)
              const isNew = origIdx >= recentThreshold
              const clickable = !!msg.creatureId && gameState?.creatures[msg.creatureId]?.diedOnDay === null
              return (
                <MessageLine
                  key={msg.id}
                  stage={msg.stage}
                  isNew={isNew}
                  clickable={clickable}
                  onClick={(e) => { e.stopPropagation(); onMessageClick(msg) }}
                >
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
