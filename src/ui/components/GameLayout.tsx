import { useState, useEffect, useRef, useCallback } from 'react'
import styled, { createGlobalStyle, keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { GameCanvas } from './GameCanvas'
import { DossierPanel } from '../panels/DossierPanel'
import { MessageLogPanel } from '../panels/MessageLogPanel'
import { ColonyStatsPanel } from '../panels/ColonyStatsPanel'
import { EventPopupLayer } from './EventPopup'
import { Toolbar, Tool, BuildKind } from './Toolbar'
import { updateMusicContext, computeMusicKey, updateWeatherAudio, setMuted, isMuted, unlockAudio } from '@/audio/chiptune'
import { EnrichmentType } from '@/types'
import { saveToCloud } from '@/db/persistence'
import { THEME } from '@/ui/theme'

// ─── Global styles ────────────────────────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%; height: 100dvh;
    background:
      radial-gradient(1200px 600px at 50% -10%, rgba(232,200,74,0.04), transparent 70%),
      radial-gradient(900px 700px at 100% 110%, rgba(108,188,248,0.04), transparent 65%),
      ${THEME.bg};
    color: ${THEME.textPrimary};
    font-family: ${THEME.font};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    overflow: hidden;
  }

  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: ${THEME.borderMid};
    border-radius: 999px;
    border: 1px solid transparent;
    background-clip: padding-box;
    &:hover { background: ${THEME.borderHi}; background-clip: padding-box; }
  }

  ::selection { background: ${THEME.amberDim}; color: ${THEME.amberSoft}; }

  button { font-family: inherit; }
  input { font-family: inherit; }
`

const LOG_HEIGHT = 240

// ─── Layout ───────────────────────────────────────────────────────────────────

const Layout = styled.div`
  height: 100vh; height: 100dvh; min-height: 0;
  display: flex; flex-direction: column;
  padding: ${THEME.space.md}px ${THEME.space.lg}px ${THEME.space.lg}px;
  gap: ${THEME.space.md}px;
  box-sizing: border-box; overflow: hidden;

  @media(max-width:900px){
    height: auto; min-height: 100svh;
    padding: ${THEME.space.sm}px ${THEME.space.md}px ${THEME.space.lg}px;
    gap: ${THEME.space.sm}px; overflow: auto;
  }
  @media(max-width:600px){ padding: ${THEME.space.xs}px ${THEME.space.xs}px ${THEME.space.md}px; gap: ${THEME.space.xs}px; }
`
const Main = styled.div`
  display: grid;
  grid-template-columns: minmax(200px,240px) 1fr minmax(220px,272px);
  gap: ${THEME.space.lg}px;
  flex: 1; min-height: 0; min-width: 0;
  @media(max-width:1100px){ grid-template-columns: minmax(170px,200px) 1fr minmax(190px,230px); gap: ${THEME.space.md}px; }
  @media(max-width:900px){ grid-template-columns:1fr; grid-template-rows:auto 1fr auto; flex:none; }
`
const Left   = styled.div`display:flex;flex-direction:column;min-width:0;min-height:0;@media(max-width:900px){order:2;}`
const Center = styled.div`position:relative;display:flex;flex-direction:column;gap:${THEME.space.md}px;min-width:0;@media(max-width:900px){order:1;}`
const Right  = styled.div`display:flex;flex-direction:column;min-width:0;min-height:0;@media(max-width:900px){order:3;}`
const LogArea= styled.div`
  height:${LOG_HEIGHT}px; flex-shrink:0;
  @media(max-width:900px){height:180px;}
  @media(max-width:600px){height:150px;}
`

// ─── Endgame overlay ──────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;}to{opacity:1;}`
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 1px ${THEME.deathDim}, 0 0 50px rgba(217,96,96,0.18); }
  50%      { box-shadow: 0 0 0 1px ${THEME.deathDim}, 0 0 80px rgba(217,96,96,0.32); }
`
const EndgameOverlay = styled.div`
  position:fixed; inset:0;
  background:
    radial-gradient(1000px 800px at 50% 40%, rgba(217,96,96,0.10), transparent 65%),
    rgba(8,8,10,0.96);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  font-family:${THEME.font}; color:${THEME.textSecondary};
  z-index:100; animation:${fadeIn} 1.2s ease;
  backdrop-filter: blur(6px);
`
const EndgameSeal = styled.div`
  width: 110px; height: 110px; border-radius: 50%;
  background: ${THEME.bgDeep};
  border: 2px solid ${THEME.deathDim};
  display: flex; align-items: center; justify-content: center;
  margin-bottom: ${THEME.space.xxl}px;
  animation: ${pulseGlow} 3.6s ease-in-out infinite;
`
const EndgameGlyph = styled.div`
  font-size: 48px; font-weight: 300;
  color: ${THEME.death};
  letter-spacing: 0.05em;
`
const EndgameTitle = styled.div`
  font-size: ${THEME.type.xxl}px; font-weight:700;
  letter-spacing: 0.32em; text-transform: uppercase;
  color: ${THEME.death};
  margin-bottom: ${THEME.space.lg}px;
`
const EndgameBody = styled.div`
  max-width: 520px; text-align: center; line-height: 1.85;
  font-size: ${THEME.type.lg}px;
  color: ${THEME.textSecondary}; font-style: italic;
  padding: 0 ${THEME.space.xl}px;
`
const EndgameBtn = styled.button`
  margin-top: ${THEME.space.xxxl}px;
  background: transparent;
  border: 2px solid ${THEME.border};
  border-radius: ${THEME.radius.md}px;
  color: ${THEME.textSecondary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.md}px; font-weight:600;
  padding: ${THEME.space.lg}px ${THEME.space.xxxl}px;
  cursor: pointer; letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: all ${THEME.motion.slow} ${THEME.motion.easeOut};
  &:hover {
    border-color: ${THEME.amber}; color: ${THEME.amber};
    box-shadow: ${THEME.glow.amber};
  }
`

// ─── Toast ────────────────────────────────────────────────────────────────────

const slideUp = keyframes`
  from { opacity:0; transform: translateX(-50%) translateY(14px); }
  to   { opacity:1; transform: translateX(-50%) translateY(0); }
`
const Toast = styled.div<{ $ok:boolean }>`
  position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
  background: ${THEME.panelGradientHi};
  border: 1px solid ${p => p.$ok ? THEME.alive : THEME.threat};
  color: ${p => p.$ok ? THEME.alive : THEME.threat};
  font-family: ${THEME.font};
  font-size: ${THEME.type.md}px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  padding: ${THEME.space.lg}px ${THEME.space.xxl}px;
  border-radius: ${THEME.radius.md}px;
  z-index: 500;
  box-shadow: ${p => p.$ok ? THEME.glow.alive : THEME.glow.threat};
  animation: ${slideUp} ${THEME.motion.base} ${THEME.motion.easeOut};
  white-space: nowrap; pointer-events: none;
`

// ─── Confirm modal ────────────────────────────────────────────────────────────

const fadeBg = keyframes`from{opacity:0;}to{opacity:1;}`
const popIn = keyframes`
  from { opacity:0; transform: scale(0.96) translateY(6px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
`
const ConfirmOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.78);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 300;
  animation: ${fadeBg} ${THEME.motion.base} ease;
`
const ConfirmBox = styled.div`
  background: ${THEME.panelGradient};
  border: 1px solid ${THEME.borderMid};
  border-radius: ${THEME.radius.lg}px;
  padding: ${THEME.space.xxxl}px ${THEME.space.xxxl}px ${THEME.space.xxl}px;
  font-family: ${THEME.font}; text-align: center; max-width: 440px;
  box-shadow: ${THEME.shadow.pop};
  animation: ${popIn} ${THEME.motion.slow} ${THEME.motion.easeOut};
`
const ConfirmTitle = styled.div`
  font-size: ${THEME.type.lg}px; font-weight: 700;
  letter-spacing: 0.24em; text-transform: uppercase;
  color: ${THEME.textPrimary};
  margin-bottom: ${THEME.space.lg}px;
`
const ConfirmBody = styled.div`
  font-size: ${THEME.type.md}px; font-weight: 400;
  color: ${THEME.textSecondary}; line-height: 1.9;
  margin-bottom: ${THEME.space.xxl}px;
`
const ConfirmRow = styled.div`display:flex;gap:${THEME.space.md}px;justify-content:center;`
const ConfirmBtn = styled.button<{ $danger?:boolean; $primary?:boolean }>`
  background: ${p => p.$danger ? THEME.deathDim : p.$primary ? THEME.amberDim : 'transparent'};
  border: 1px solid ${p => p.$danger ? THEME.death : p.$primary ? THEME.amber : THEME.border};
  color: ${p => p.$danger ? THEME.death : p.$primary ? THEME.amber : THEME.textSecondary};
  font-family: ${THEME.font}; font-size: ${THEME.type.md}px; font-weight: 600;
  padding: ${THEME.space.md}px ${THEME.space.xxl}px;
  cursor: pointer; border-radius: ${THEME.radius.sm}px;
  letter-spacing: 0.08em; text-transform: uppercase;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:hover {
    border-color: ${p => p.$danger ? THEME.threat : p.$primary ? THEME.amberSoft : THEME.textSecondary};
    color: ${p => p.$danger ? THEME.threat : p.$primary ? THEME.amberSoft : THEME.textPrimary};
    transform: translateY(-1px);
  }
`

// ─── Endgame visuals ──────────────────────────────────────────────────────────

const ENDGAME_GLYPH  = '✝'
const ENDGAME_TITLE  = 'Extinction'

// ─── Component ────────────────────────────────────────────────────────────────

export function GameLayout() {
  const gameState      = useLaietStore(s => s.gameState)
  const manualSave     = useLaietStore(s => s.manualSave)
  const resetWorld     = useLaietStore(s => s.resetWorld)
  const isPaused       = useLaietStore(s => s.isPaused)
  const simSpeed       = useLaietStore(s => s.simSpeed)
  const togglePause    = useLaietStore(s => s.togglePause)
  const setSimSpeed    = useLaietStore(s => s.setSimSpeed)

  const [activeTool, setActiveTool]             = useState<Tool>('select')
  const [selectedEnrichment, setSelectedEnrichment] = useState<EnrichmentType>('resting_spot')
  const [selectedBuild, setSelectedBuild]       = useState<BuildKind>('fence')
  const [muted, setMutedState]                  = useState(isMuted())
  const [toast, setToast]                       = useState<{msg:string;ok:boolean}|null>(null)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  const showToast = useCallback((msg:string, ok=true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({msg,ok})
    toastTimer.current = setTimeout(()=>setToast(null),2500)
  }, [])

  const handleManualSave = useCallback(async () => {
    try { await manualSave(); showToast('Saved') }
    catch { showToast('Save failed ; check connection', false) }
  }, [manualSave, showToast])

  const handleRestartConfirm = useCallback(()=>{setShowRestartConfirm(false);resetWorld()},[resetWorld])

  const musicKey = useLaietStore(s => s.gameState ? computeMusicKey(s.gameState) : '')
  const weather  = useLaietStore(s => s.gameState?.weather ?? 'clear')
  useEffect(()=>{if(muted)return;updateMusicContext(musicKey)},[musicKey,muted])
  useEffect(()=>{if(muted)return;updateWeatherAudio(weather)},[weather,muted])

  useEffect(()=>{
    const handleVisibility = () => {
      if (document.hidden) {
        const state = useLaietStore.getState().gameState
        if (state && !state.endgame) {
          saveToCloud(state).catch(()=>{})
        }
      }
    }
    const handleClose=()=>useLaietStore.getState().markSessionEnd()
    document.addEventListener('visibilitychange',handleVisibility)
    window.addEventListener('beforeunload',handleClose)
    window.addEventListener('pagehide',handleClose)
    return ()=>{
      document.removeEventListener('visibilitychange',handleVisibility)
      window.removeEventListener('beforeunload',handleClose)
      window.removeEventListener('pagehide',handleClose)
    }
  },[]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      const t=e.target as HTMLElement|null
      if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return
      if(e.key==='Escape')setShowRestartConfirm(false)
      if(e.key===' '){e.preventDefault();togglePause()}
      if(e.key==='1')setActiveTool('select')
      if(e.key==='2')setActiveTool('food')
      if(e.key==='3')setActiveTool('tree')
      if(e.key==='4')setActiveTool('water')
      if(e.key==='5')setActiveTool('thunder')
      if(e.key==='6')setActiveTool('fire')
      if(e.key==='7')setActiveTool('enrich')
      if(e.key==='8')setActiveTool('build')
      if(e.key==='9')setActiveTool('bush')
      if(e.key==='s'&&(e.ctrlKey||e.metaKey)){e.preventDefault();handleManualSave()}
    }
    window.addEventListener('keydown',handler)
    return ()=>window.removeEventListener('keydown',handler)
  },[handleManualSave,togglePause])

  const handleMuteToggle=()=>{
    unlockAudio();const next=!muted;setMuted(next);setMutedState(next)
  }

  if (!gameState) return null

  return (
    <>
      <GlobalStyle />
      <Layout>
        <Toolbar
          activeTool={activeTool} onToolChange={setActiveTool}
          onMuteToggle={handleMuteToggle} isMuted={muted}
          isPaused={isPaused} simSpeed={simSpeed}
          onPauseToggle={togglePause} onSpeedChange={setSimSpeed}
          onRestartRequest={()=>setShowRestartConfirm(true)}
          onSave={handleManualSave}
          day={gameState.time.day} year={gameState.time.year}
          season={gameState.time.season} phase={gameState.time.phase}
          alive={Object.values(gameState.creatures).filter(c=>c.diedOnDay===null).length}
          awarenessStage={gameState.awarenessStage}
          selectedEnrichment={selectedEnrichment}
          onEnrichmentChange={setSelectedEnrichment}
          selectedBuild={selectedBuild}
          onBuildChange={setSelectedBuild}
        />

        <Main>
          <Left><ColonyStatsPanel /></Left>
          <Center>
            <GameCanvas activeTool={activeTool} selectedEnrichment={selectedEnrichment} selectedBuild={selectedBuild} />
            <EventPopupLayer />
            <LogArea><MessageLogPanel /></LogArea>
          </Center>
          <Right><DossierPanel /></Right>
        </Main>

        {gameState.endgame && (
          <EndgameOverlay>
            <EndgameSeal><EndgameGlyph>{ENDGAME_GLYPH}</EndgameGlyph></EndgameSeal>
            <EndgameTitle>{ENDGAME_TITLE}</EndgameTitle>
            <EndgameBody>{gameState.messages[gameState.messages.length-1]?.text}</EndgameBody>
            <EndgameBtn onClick={()=>setShowRestartConfirm(true)}>Begin Again</EndgameBtn>
          </EndgameOverlay>
        )}

        {showRestartConfirm && (
          <ConfirmOverlay onClick={()=>setShowRestartConfirm(false)}>
            <ConfirmBox onClick={e=>e.stopPropagation()}>
              <ConfirmTitle>Reset Colony</ConfirmTitle>
              <ConfirmBody>
                This erases the current world and all its creatures.<br />
                Fossil records of previous extinctions are preserved.<br />
                A new world will be generated from a fresh seed.
              </ConfirmBody>
              <ConfirmRow>
                <ConfirmBtn onClick={()=>setShowRestartConfirm(false)}>Cancel</ConfirmBtn>
                <ConfirmBtn $danger onClick={handleRestartConfirm}>Begin Again</ConfirmBtn>
              </ConfirmRow>
            </ConfirmBox>
          </ConfirmOverlay>
        )}

        {toast && <Toast $ok={toast.ok}>{toast.msg}</Toast>}
      </Layout>
    </>
  )
}
