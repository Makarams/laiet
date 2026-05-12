import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { GameEvent } from '@/types'
import { sfxEvent } from '@/audio/chiptune'
import { useEffect } from 'react'

const slideIn = keyframes`
  from { transform: translateX(24px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
`

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 18px rgba(200, 120, 240, 0.20); }
  50%      { box-shadow: 0 0 28px rgba(200, 120, 240, 0.45); }
`

const Container = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  max-width: 280px;
`

const EventCard = styled.div`
  background:
    linear-gradient(180deg, rgba(20, 20, 50, 0.85), rgba(8, 8, 28, 0.95));
  border: 1px solid #2e2e60;
  border-left: 3px solid #c878f0;
  border-radius: 3px;
  padding: 8px 11px 10px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  color: #ede2c4;
  animation: ${slideIn} 0.3s ease, ${pulse} 3s ease infinite;
  backdrop-filter: blur(4px);
`

const EventHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #c878f0;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 5px;
  text-shadow: 0 0 6px rgba(200, 120, 240, 0.30);

  &::before {
    content: '◈';
    color: #c878f0;
  }
`

const EventBody = styled.div`
  color: #ede2c4;
  margin-bottom: 9px;
  line-height: 1.5;
  font-size: 10.5px;
`

const OptionRow = styled.div`
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
`

const OptionBtn = styled.button`
  background: rgba(94, 200, 224, 0.06);
  border: 1px solid #2a4a60;
  color: #5ec8e0;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 10px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.05em;
  transition: all 0.15s;

  &:hover {
    border-color: #5ec8e0;
    color: #8af0ff;
    box-shadow: 0 0 8px rgba(94, 200, 224, 0.30);
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
          <OptionBtn
            key={opt.action}
            onClick={() => resolveEvent(event.id, opt.action)}
          >
            {opt.label}
          </OptionBtn>
        ))}
      </OptionRow>
    </EventCard>
  )
}

export function EventPopupLayer() {
  const gameState = useLaietStore(s => s.gameState)
  const pendingEvents = (gameState?.events ?? [])
    .filter(e => !e.resolved)
    .slice(-3)

  if (pendingEvents.length === 0) return null

  return (
    <Container>
      {pendingEvents.map(e => (
        <EventPopup key={e.id} event={e} />
      ))}
    </Container>
  )
}
