import { useState, useEffect, useRef, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { GameCanvas } from './GameCanvas'
import { DossierPanel } from '../panels/DossierPanel'
import { MessageLogPanel } from '../panels/MessageLogPanel'
import { ColonyStatsPanel } from '../panels/ColonyStatsPanel'
import { EventPopupLayer } from './EventPopup'
import { Toolbar, Tool } from './Toolbar'
import { updateMusicContext, computeMusicKey, setMuted, isMuted, unlockAudio } from '@/audio/chiptune'
import { EnrichmentType } from '@/types'

const LOG_HEIGHT = 220

const Layout = styled.div`
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 10px 10px;
  gap: 7px;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 900px) {
    height: auto;
    min-height: 100svh;
    padding: 6px 8px 10px;
    gap: 6px;
    overflow: auto;
  }

  @media (max-width: 600px) {
    padding: 4px 4px 8px;
    gap: 4px;
  }
`

const Main = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 220px) 1fr minmax(200px, 250px);
  gap: 10px;
  flex: 1;
  min-height: 0;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(160px, 190px) 1fr minmax(180px, 220px);
    gap: 8px;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    flex: none;
  }
`

const Left = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  @media (max-width: 900px) {
    order: 2;
  }
`

const Center = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  @media (max-width: 900px) {
    order: 1;
  }
`

const Right = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  @media (max-width: 900px) {
    order: 3;
  }
`

const LogArea = styled.div`
  height: ${LOG_HEIGHT}px;
  flex-shrink: 0;

  @media (max-width: 900px) {
    height: 160px;
  }

  @media (max-width: 600px) {
    height: 130px;
  }
`

// Endgame overlay — dramatic, color-coded per ending
const EndgameOverlay = styled.div`
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at center, rgba(8, 4, 22, 0.85), rgba(2, 2, 8, 0.97));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  color: #7878a0;
  z-index: 100;
  animation: fadeIn 1.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`

const EndgameGlyph = styled.div<{ type: string }>`
  font-size: 56px;
  color: ${p =>
    p.type === 'ascension' ? '#c878f0' :
    p.type === 'fracture'  ? '#ff7848' :
    '#ff5060'};
  text-shadow: 0 0 40px currentColor;
  margin-bottom: 1.6rem;
  letter-spacing: 0.2em;
`

const EndgameTitle = styled.div<{ type: string }>`
  font-size: 24px;
  letter-spacing: 0.5em;
  color: ${p =>
    p.type === 'ascension' ? '#c878f0' :
    p.type === 'fracture'  ? '#ff7848' :
    '#ff5060'};
  margin-bottom: 1.4rem;
  text-shadow: 0 0 24px currentColor;
`

const EndgameBody = styled.div`
  max-width: 480px;
  text-align: center;
  line-height: 2;
  font-size: 12px;
  color: #9a9ac0;
  font-style: italic;
  letter-spacing: 0.05em;
`

const EndgameBtn = styled.button`
  margin-top: 2.6rem;
  background: transparent;
  border: 1px solid #2e2e60;
  color: #9a9ac0;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  padding: 10px 28px;
  cursor: pointer;
  letter-spacing: 0.18em;
  border-radius: 2px;
  transition: all 0.2s;

  &:hover {
    border-color: #c878f0;
    color: #f0a0ff;
    box-shadow: 0 0 12px rgba(200, 120, 240, 0.30);
  }
`

// ─── Toast ────────────────────────────────────────────────────────────────────

const slideUp = keyframes`
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
`

const Toast = styled.div<{ ok: boolean }>`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(6, 6, 20, 0.96);
  border: 1px solid ${p => p.ok ? '#80f0a0' : '#ff5060'};
  color: ${p => p.ok ? '#80f0a0' : '#ff8090'};
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  letter-spacing: 0.18em;
  padding: 10px 26px;
  border-radius: 3px;
  z-index: 500;
  box-shadow: 0 0 22px ${p => p.ok ? 'rgba(128,240,160,0.22)' : 'rgba(255,80,96,0.22)'};
  animation: ${slideUp} 0.18s ease-out;
  white-space: nowrap;
  pointer-events: none;
`

// ─── Restart confirm modal ────────────────────────────────────────────────────

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(2, 2, 10, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
`

const ConfirmBox = styled.div`
  background: linear-gradient(180deg, rgba(20,20,50,0.55), rgba(8,8,28,0.95));
  border: 1px solid #4a2878;
  border-radius: 4px;
  padding: 28px 36px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 0 40px rgba(120, 60, 200, 0.22);
`

const ConfirmTitle = styled.div`
  font-size: 14px;
  color: #d088ff;
  letter-spacing: 0.32em;
  margin-bottom: 14px;
  text-shadow: 0 0 10px rgba(200,120,240,0.45);
`

const ConfirmBody = styled.div`
  font-size: 11.5px;
  color: #9a9ac0;
  line-height: 1.8;
  letter-spacing: 0.06em;
  margin-bottom: 24px;
`

const ConfirmRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`

const ConfirmBtn = styled.button<{ danger?: boolean }>`
  background: ${p => p.danger ? 'rgba(255,80,96,0.12)' : 'rgba(80,80,120,0.12)'};
  border: 1px solid ${p => p.danger ? '#7a2828' : '#3a3a60'};
  color: ${p => p.danger ? '#ff7080' : '#9090b8'};
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  padding: 9px 22px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.14em;
  transition: all 0.15s;

  &:hover {
    border-color: ${p => p.danger ? '#ff5060' : '#8080c0'};
    color: ${p => p.danger ? '#ff9090' : '#c0c0e8'};
    box-shadow: 0 0 10px ${p => p.danger ? 'rgba(255,80,96,0.28)' : 'rgba(128,128,200,0.20)'};
  }
`

// ─── Endgame ──────────────────────────────────────────────────────────────────

const ENDGAME_GLYPH: Record<string, string> = {
  extinction: '✝',
  fracture:   '◇',
  ascension:  '◈',
}

const ENDGAME_TITLE: Record<string, string> = {
  extinction: 'EXTINCTION',
  fracture:   'FRACTURE',
  ascension:  'ASCENSION',
}

export function GameLayout() {
  const gameState      = useLaietStore(s => s.gameState)
  const manualSave     = useLaietStore(s => s.manualSave)
  const markSessionEnd = useLaietStore(s => s.markSessionEnd)
  const resetWorld     = useLaietStore(s => s.resetWorld)
  const isPaused       = useLaietStore(s => s.isPaused)
  const simSpeed       = useLaietStore(s => s.simSpeed)
  const togglePause    = useLaietStore(s => s.togglePause)
  const setSimSpeed    = useLaietStore(s => s.setSimSpeed)

  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [selectedEnrichment, setSelectedEnrichment] = useState<EnrichmentType>('resting_spot')
  const [muted, setMutedState] = useState(isMuted())
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, ok = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, ok })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const handleManualSave = useCallback(async () => {
    try {
      await manualSave()
      showToast('◈  save complete')
    } catch {
      showToast('save failed — check connection', false)
    }
  }, [manualSave, showToast])

  const handleRestartConfirm = useCallback(() => {
    setShowRestartConfirm(false)
    resetWorld()
  }, [resetWorld])

  // Derive music context key — only changes when key string changes
  const musicKey = useLaietStore(s =>
    s.gameState ? computeMusicKey(s.gameState) : ''
  )

  useEffect(() => {
    if (muted) return
    updateMusicContext(musicKey)
  }, [musicKey, muted])

  useEffect(() => {
    const handler = () => markSessionEnd()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      const store = useLaietStore.getState()
      if (document.hidden) {
        store.stopTicking()
      } else if (!store.isPaused && store.gameState && !store.gameState.endgame) {
        store.startTicking()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (e.key === 'Escape') setShowRestartConfirm(false)
      if (e.key === ' ') { e.preventDefault(); togglePause() }
      if (e.key === '1') setActiveTool('select')
      if (e.key === '2') setActiveTool('food')
      if (e.key === '3') setActiveTool('tree')
      if (e.key === '4') setActiveTool('river')
      if (e.key === '5') setActiveTool('thunder')
      if (e.key === '6') setActiveTool('fire')
      if (e.key === '7') setActiveTool('enrich')
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleManualSave() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleManualSave, togglePause])

  const handleMuteToggle = () => {
    // unlockAudio() is called here because we are inside a click handler —
    // a user-gesture context — which is the only place ctx.resume() is
    // guaranteed to succeed on first call in all browsers.
    unlockAudio()
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  if (!gameState) return null

  return (
    <Layout>
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onMuteToggle={handleMuteToggle}
        isMuted={muted}
        isPaused={isPaused}
        simSpeed={simSpeed}
        onPauseToggle={togglePause}
        onSpeedChange={setSimSpeed}
        onRestartRequest={() => setShowRestartConfirm(true)}
        onSave={handleManualSave}
        day={gameState.time.day}
        year={gameState.time.year}
        season={gameState.time.season}
        phase={gameState.time.phase}
        alive={Object.values(gameState.creatures).filter(c => c.diedOnDay === null).length}
        awarenessStage={gameState.awarenessStage}
        selectedEnrichment={selectedEnrichment}
        onEnrichmentChange={setSelectedEnrichment}
      />

      <Main>
        <Left>
          <ColonyStatsPanel />
        </Left>

        <Center>
          <GameCanvas activeTool={activeTool} selectedEnrichment={selectedEnrichment} />
          <EventPopupLayer />
          <LogArea>
            <MessageLogPanel />
          </LogArea>
        </Center>

        <Right>
          <DossierPanel />
        </Right>
      </Main>

      {gameState.endgame && (
        <EndgameOverlay>
          <EndgameGlyph type={gameState.endgame}>
            {ENDGAME_GLYPH[gameState.endgame]}
          </EndgameGlyph>
          <EndgameTitle type={gameState.endgame}>
            {ENDGAME_TITLE[gameState.endgame]}
          </EndgameTitle>
          <EndgameBody>
            {gameState.messages[gameState.messages.length - 1]?.text}
          </EndgameBody>
          {gameState.endgame === 'extinction' && (
            <EndgameBtn onClick={() => setShowRestartConfirm(true)}>
              ◇  BEGIN AGAIN  ◇
            </EndgameBtn>
          )}
        </EndgameOverlay>
      )}

      {showRestartConfirm && (
        <ConfirmOverlay onClick={() => setShowRestartConfirm(false)}>
          <ConfirmBox onClick={e => e.stopPropagation()}>
            <ConfirmTitle>◇  RESET COLONY  ◇</ConfirmTitle>
            <ConfirmBody>
              this will erase the current world and all its creatures.<br />
              fossil records of previous extinctions are preserved.<br />
              a new world will be generated from a fresh seed.
            </ConfirmBody>
            <ConfirmRow>
              <ConfirmBtn onClick={() => setShowRestartConfirm(false)}>
                cancel
              </ConfirmBtn>
              <ConfirmBtn danger onClick={handleRestartConfirm}>
                ◇  begin again
              </ConfirmBtn>
            </ConfirmRow>
          </ConfirmBox>
        </ConfirmOverlay>
      )}

      {toast && <Toast ok={toast.ok}>{toast.msg}</Toast>}
    </Layout>
  )
}
