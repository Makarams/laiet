import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { GameEvent } from '@/types'
import { sfxEvent } from '@/audio/chiptune'
import { useEffect } from 'react'
import { THEME } from '@/ui/theme'

const slideIn = keyframes`from{transform:translateX(20px);opacity:0;}to{transform:translateX(0);opacity:1;}`

const Container = styled.div`
  position:absolute; top:14px; right:14px;
  display:flex; flex-direction:column; gap:8px; z-index:10; max-width:290px;
`
const EventCard = styled.div`
  background:#242424; border:2px solid ${THEME.border};
  border-left:3px solid ${THEME.amber}; border-radius:6px;
  padding:10px 12px 12px; font-family:${THEME.font}; font-size:12px;
  color:${THEME.textPrimary}; animation:${slideIn} 0.25s ease;
`
const EventHeader = styled.div`
  font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.2em;
  color:${THEME.amber}; margin-bottom:6px;
  display:flex; align-items:center; gap:6px;
  &::before { content:''; width:6px; height:6px; border-radius:50%; background:${THEME.amber}; }
`
const EventBody = styled.div`
  color:${THEME.textSecondary}; margin-bottom:10px; line-height:1.6; font-size:12px;
`
const OptionRow = styled.div`display:flex;gap:5px;flex-wrap:wrap;`
const OptionBtn = styled.button`
  background:transparent; border:2px solid ${THEME.border}; border-radius:4px;
  color:${THEME.textSecondary}; font-family:${THEME.font}; font-size:11px; font-weight:600;
  padding:5px 11px; cursor:pointer; letter-spacing:0.04em; transition:all 0.12s;
  &:hover { border-color:${THEME.amber}; color:${THEME.amber}; }
`

function EventPopup({ event }: { event: GameEvent }) {
  const resolveEvent = useLaietStore(s => s.resolveEvent)
  useEffect(() => { sfxEvent() }, [])
  return (
    <EventCard>
      <EventHeader>{event.title}</EventHeader>
      <EventBody>{event.body}</EventBody>
      <OptionRow>
        {event.options.map(opt => (
          <OptionBtn key={opt.action} onClick={() => resolveEvent(event.id, opt.action)}>
            {opt.label}
          </OptionBtn>
        ))}
      </OptionRow>
    </EventCard>
  )
}

export function EventPopupLayer() {
  const gameState = useLaietStore(s => s.gameState)
  const pendingEvents = (gameState?.events ?? []).filter(e => !e.resolved).slice(-3)
  if (pendingEvents.length === 0) return null
  return (
    <Container>
      {pendingEvents.map(e => <EventPopup key={e.id} event={e} />)}
    </Container>
  )
}
