import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { GameEvent } from '@/types'
import { sfxEvent } from '@/audio/chiptune'
import { useEffect } from 'react'
import { THEME } from '@/ui/theme'

const slideIn = keyframes`
  from { transform: translateX(24px) scale(0.98); opacity:0; }
  to   { transform: translateX(0) scale(1); opacity:1; }
`

const Container = styled.div`
  position: absolute;
  top: ${THEME.space.lg}px;
  right: ${THEME.space.lg}px;
  display: flex; flex-direction: column;
  gap: ${THEME.space.md}px;
  z-index: 10;
  max-width: 300px;
`
const EventCard = styled.div`
  background: ${THEME.panelGradient};
  border: 1px solid ${THEME.borderMid};
  border-left: 3px solid ${THEME.amber};
  border-radius: ${THEME.radius.md}px;
  padding: ${THEME.space.lg}px ${THEME.space.lg}px ${THEME.space.lg}px;
  font-family: ${THEME.font};
  font-size: ${THEME.type.md}px;
  color: ${THEME.textPrimary};
  animation: ${slideIn} ${THEME.motion.slow} ${THEME.motion.easeOut};
  box-shadow: ${THEME.shadow.pop}, 0 0 24px ${THEME.amberGlow};
`
const EventHeader = styled.div`
  font-size: ${THEME.type.xs}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.22em;
  color: ${THEME.amber};
  margin-bottom: ${THEME.space.md}px;
  display: flex; align-items: center; gap: ${THEME.space.sm}px;
  &::before {
    content: ''; width: 7px; height: 7px; border-radius: 50%;
    background: ${THEME.amber};
    box-shadow: 0 0 10px ${THEME.amberGlow};
  }
`
const EventBody = styled.div`
  color: ${THEME.textSecondary};
  margin-bottom: ${THEME.space.lg}px;
  line-height: 1.65;
  font-size: ${THEME.type.md}px;
`
const OptionRow = styled.div`display:flex;gap:${THEME.space.sm}px;flex-wrap:wrap;`
const OptionBtn = styled.button`
  background: transparent;
  border: 1px solid ${THEME.border};
  border-radius: ${THEME.radius.sm}px;
  color: ${THEME.textSecondary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.base}px; font-weight: 600;
  padding: ${THEME.space.sm}px ${THEME.space.lg}px;
  cursor: pointer;
  letter-spacing: 0.06em; text-transform: uppercase;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:hover {
    border-color: ${THEME.amber};
    color: ${THEME.amber};
    box-shadow: 0 0 12px ${THEME.amberGlow};
    transform: translateY(-1px);
  }
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
