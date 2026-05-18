import { useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ColonyMessage, MessageCategory } from '@/types'
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
  gap: ${THEME.space.md}px;
`
const Title = styled.div`
  font-size: ${THEME.type.base}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.22em;
  color: ${THEME.textSecondary};
  display: flex; align-items: center; gap: ${THEME.space.sm}px;
  flex-shrink: 0;
`
const ActiveDot = styled.span`
  width:7px; height:7px; border-radius:50%;
  background:${THEME.amber};
  box-shadow: 0 0 8px ${THEME.amberGlow};
  display:inline-block;
`
const TabRow = styled.div`
  display:flex; gap:${THEME.space.xs}px; align-items:center;
  flex-wrap: wrap; justify-content: flex-end; flex: 1;
`
const Tab = styled.button<{ $active: boolean; $accent: string }>`
  background: ${p => p.$active ? `${p.$accent}24` : 'transparent'};
  border: 1px solid ${p => p.$active ? p.$accent : THEME.border};
  color: ${p => p.$active ? p.$accent : THEME.textTertiary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.sm}px; font-weight: 700;
  padding: ${THEME.space.xs}px ${THEME.space.md}px;
  cursor: pointer; border-radius: ${THEME.radius.sm}px;
  letter-spacing: 0.12em; text-transform: uppercase;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  display: inline-flex; align-items: center; gap: 6px;
  box-shadow: ${p => p.$active ? `0 0 10px ${p.$accent}33` : 'none'};
  &:hover { border-color: ${p => p.$accent}; color: ${p => p.$accent}; }
`
const TabCount = styled.span`
  font-size: ${THEME.type.xs}px;
  opacity: 0.65;
  font-weight: 600;
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
const MessageLine = styled.div<{ $stage:number; $isNew:boolean; $clickable:boolean; $important:boolean }>`
  padding: ${THEME.space.sm}px ${THEME.space.md}px ${THEME.space.sm}px ${THEME.space.lg}px;
  border-left: ${p => p.$important ? '3px' : '2px'} solid ${p => lineColor(p.$stage)};
  background: ${p => p.$important ? `${lineColor(p.$stage)}10` : 'transparent'};
  color: ${p => lineColor(p.$stage, true)};
  animation: ${p => p.$isNew ? fadeIn : 'none'} ${THEME.motion.slow} ${THEME.motion.easeOut};
  line-height: 1.7;
  font-size: ${p => p.$stage >= 3 ? `${THEME.type.lg}px` : `${THEME.type.md}px`};
  font-style: ${p => p.$stage >= 2 ? 'italic' : 'normal'};
  font-weight: ${p => p.$important ? 600 : p.$stage >= 3 ? 500 : 400};
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  border-radius: 0 ${THEME.radius.sm}px ${THEME.radius.sm}px 0;
  transition: background ${THEME.motion.fast} ${THEME.motion.easeOut},
              box-shadow ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:hover {
    background: ${p => p.$clickable ? THEME.bgHover : (p.$important ? `${lineColor(p.$stage)}10` : 'transparent')};
    box-shadow: ${p => p.$stage >= 3 ? `inset 4px 0 16px -8px ${lineColor(p.$stage)}` : 'none'};
  }
`
const Empty = styled.div`
  color: ${THEME.textTertiary}; text-align:center;
  margin-top: 2.5rem;
  font-size:${THEME.type.md}px; font-style:italic; letter-spacing:0.12em;
`

// ─── Categorisation ─────────────────────────────────────────────────────────
// Three buckets, mutually exclusive:
//   general   — routine observations, births, weather notes, day-to-day chatter
//   important — colony milestones the player should not miss (mass die-off,
//               legendary creatures, race emergence/loss, awareness stage-up,
//               lineage extinction, fracture events, deep-awareness speech)
//   event     — direct caretaker-facing messages and absence/return notes
// Producers may set msg.category explicitly; otherwise we derive it from
// stage and content keywords (back-compat with older saves and untagged paths).
function categoryOf(msg: ColonyMessage): MessageCategory {
  if (msg.category) return msg.category
  if (msg.stage >= 4) return 'important'
  const t = msg.text.toLowerCase()
  if (/(extinction|silence|mass die-off|lineage|fracture|legendary|prolific|longevity|last-of|race emerged|race revived|race lost|awakened|ascended)/i.test(t)) {
    return 'important'
  }
  if (/(returned|absence|away|caretaker)/i.test(t)) {
    return 'event'
  }
  return 'general'
}

type TabKey = 'general' | 'important' | 'event'

const TABS: { key: TabKey; label: string; accent: string }[] = [
  { key: 'general',   label: 'General',   accent: THEME.textSecondary },
  { key: 'important', label: 'Important', accent: THEME.amber },
  { key: 'event',     label: 'Event',     accent: THEME.water },
]

export function MessageLogPanel() {
  const gameState    = useLaietStore(s => s.gameState)
  const unread       = useLaietStore(s => s.unreadMessageCount)
  const markRead     = useLaietStore(s => s.markMessagesRead)
  const selectCreature = useLaietStore(s => s.selectCreature)
  const [tab, setTab] = useState<TabKey>('general')

  const messages = gameState?.messages ?? []
  const recentThreshold = messages.length - 5

  // Pre-categorise once so we can show counts per tab and filter cheaply.
  const { byTab, counts } = useMemo(() => {
    const byTab: Record<TabKey, ColonyMessage[]> = { general: [], important: [], event: [] }
    for (const m of messages) byTab[categoryOf(m)].push(m)
    const counts = {
      general:   byTab.general.length,
      important: byTab.important.length,
      event:     byTab.event.length,
    }
    return { byTab, counts }
  }, [messages])

  const filtered = byTab[tab]

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
        <TabRow>
          {TABS.map(f => (
            <Tab key={f.key} $active={tab === f.key} $accent={f.accent}
              onClick={e => { e.stopPropagation(); setTab(f.key) }}>
              {f.label}
              <TabCount>{counts[f.key]}</TabCount>
            </Tab>
          ))}
        </TabRow>
      </Header>

      <Log>
        {filtered.length === 0 && <Empty>nothing recorded in this band</Empty>}
        {groupedReversed.map(group => (
          <div key={group.day}>
            <DaySeparator>Day {group.day}</DaySeparator>
            {group.items.map(msg => {
              const origIdx = messages.indexOf(msg)
              const isNew = origIdx >= recentThreshold
              const clickable = !!msg.creatureId &&
                gameState?.creatures[msg.creatureId]?.diedOnDay === null
              return (
                <MessageLine key={msg.id} $stage={msg.stage} $isNew={isNew} $clickable={clickable} $important={tab === 'important'}
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
