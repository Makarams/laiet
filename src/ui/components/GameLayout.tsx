import { useState, useEffect, useRef, useCallback } from 'react'
import styled, { createGlobalStyle, keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { GameCanvas } from './GameCanvas'
import { DossierPanel } from '../panels/DossierPanel'
import { MessageLogPanel } from '../panels/MessageLogPanel'
import { ColonyStatsPanel } from '../panels/ColonyStatsPanel'
import { EventPopupLayer } from './EventPopup'
import { Toolbar, Tool } from './Toolbar'
import { updateMusicContext, computeMusicKey, updateWeatherAudio, setMuted, isMuted, unlockAudio } from '@/audio/chiptune'
import { EnrichmentType } from '@/types'
import { saveToCloud } from '@/db/persistence'
import { THEME } from '@/ui/theme'

// ─── Global Field Guide styles ────────────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%; height: 100dvh;
    background: ${THEME.bg};
    color: ${THEME.textPrimary};
    font-family: ${THEME.font};
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  /* Import Space Grotesk */
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${THEME.bgDeep}; }
  ::-webkit-scrollbar-thumb { background: ${THEME.borderMid}; border-radius: 2px; }
`

const LOG_HEIGHT = 220

// ─── Layout ───────────────────────────────────────────────────────────────────

const Layout = styled.div`
  height: 100vh; height: 100dvh; min-height: 0;
  display: flex; flex-direction: column;
  padding: 8px 10px 10px; gap: 7px;
  box-sizing: border-box; overflow: hidden;
  background: ${THEME.bg};

  @media(max-width:900px){
    height: auto; min-height: 100svh;
    padding: 6px 8px 10px; gap: 6px; overflow: auto;
  }
  @media(max-width:600px){ padding: 4px 4px 8px; gap: 4px; }
`
const Main = styled.div`
  display: grid;
  grid-template-columns: minmax(180px,220px) 1fr minmax(200px,250px);
  gap: 10px; flex: 1; min-height: 0; min-width: 0;
  @media(max-width:1100px){ grid-template-columns: minmax(160px,190px) 1fr minmax(180px,220px); gap:8px; }
  @media(max-width:900px){ grid-template-columns:1fr; grid-template-rows:auto 1fr auto; flex:none; }
`
const Left   = styled.div`display:flex;flex-direction:column;min-width:0;min-height:0;@media(max-width:900px){order:2;}`
const Center = styled.div`position:relative;display:flex;flex-direction:column;gap:8px;min-width:0;@media(max-width:900px){order:1;}`
const Right  = styled.div`display:flex;flex-direction:column;min-width:0;min-height:0;@media(max-width:900px){order:3;}`
const LogArea= styled.div`height:${LOG_HEIGHT}px;flex-shrink:0;@media(max-width:900px){height:160px;}@media(max-width:600px){height:130px;}`

// ─── Endgame overlay ──────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;}to{opacity:1;}`
const EndgameOverlay = styled.div`
  position:fixed;inset:0;
  background:rgba(14,14,14,0.96);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  font-family:${THEME.font};color:${THEME.textSecondary};
  z-index:100;animation:${fadeIn} 1.2s ease;
`
const EndgameGlyph = styled.div<{ $type:string }>`
  font-size:56px;font-weight:700;
  color:${p => p.$type==='fracture' ? THEME.threat : THEME.death};
  margin-bottom:1.6rem;
`
const EndgameTitle = styled.div<{ $type:string }>`
  font-size:22px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;
  color:${p => p.$type==='fracture' ? THEME.threat : THEME.death};
  margin-bottom:1.4rem;
`
const EndgameBody = styled.div`
  max-width:480px;text-align:center;line-height:1.8;font-size:13px;
  color:${THEME.textSecondary};font-style:italic;
`
const EndgameBtn = styled.button`
  margin-top:2.5rem;background:transparent;
  border:2px solid ${THEME.border};border-radius:6px;
  color:${THEME.textSecondary};font-family:${THEME.font};font-size:12px;font-weight:600;
  padding:11px 28px;cursor:pointer;letter-spacing:0.1em;transition:all 0.2s;
  &:hover{border-color:${THEME.amber};color:${THEME.amber};}
`

// ─── Toast ────────────────────────────────────────────────────────────────────

const slideUp = keyframes`
  from{opacity:0;transform:translateX(-50%) translateY(10px);}
  to{opacity:1;transform:translateX(-50%) translateY(0);}
`
const Toast = styled.div<{ $ok:boolean }>`
  position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
  background:#242424;border:2px solid ${p => p.$ok ? THEME.alive : THEME.threat};
  color:${p => p.$ok ? THEME.alive : THEME.threat};
  font-family:${THEME.font};font-size:12px;font-weight:600;letter-spacing:0.1em;
  padding:10px 26px;border-radius:6px;z-index:500;
  animation:${slideUp} 0.18s ease-out;white-space:nowrap;pointer-events:none;
`

// ─── Confirm modal ────────────────────────────────────────────────────────────

const ConfirmOverlay = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,0.82);
  display:flex;align-items:center;justify-content:center;z-index:300;
`
const ConfirmBox = styled.div`
  background:#242424;border:2px solid ${THEME.border};border-radius:8px;
  padding:28px 36px;font-family:${THEME.font};text-align:center;max-width:400px;
`
const ConfirmTitle = styled.div`
  font-size:14px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;
  color:${THEME.textPrimary};margin-bottom:12px;
`
const ConfirmBody = styled.div`
  font-size:12px;font-weight:400;color:${THEME.textSecondary};line-height:1.8;margin-bottom:22px;
`
const ConfirmRow = styled.div`display:flex;gap:10px;justify-content:center;`
const ConfirmBtn = styled.button<{ $danger?:boolean }>`
  background:${p => p.$danger ? 'rgba(200,80,80,0.12)' : 'transparent'};
  border:2px solid ${p => p.$danger ? THEME.death : THEME.border};
  color:${p => p.$danger ? THEME.death : THEME.textSecondary};
  font-family:${THEME.font};font-size:12px;font-weight:600;
  padding:9px 22px;cursor:pointer;border-radius:5px;letter-spacing:0.06em;transition:all 0.12s;
  &:hover{border-color:${p => p.$danger ? THEME.threat : THEME.textSecondary};
    color:${p => p.$danger ? THEME.threat : THEME.textPrimary};}
`

const ENDGAME_GLYPH: Record<string,string> = { extinction:'✝', fracture:'◇' }
const ENDGAME_TITLE: Record<string,string> = { extinction:'Extinction', fracture:'Fracture' }

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
      // Simulation keeps running in background — browsers throttle setTimeout to ~1Hz
      // but the time-delta loop in startTicking catches up correctly on any callback.
      // We only save to cloud when the tab hides so progress is preserved if the
      // browser later terminates the tab entirely.
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
        />

        <Main>
          <Left><ColonyStatsPanel /></Left>
          <Center>
            <GameCanvas activeTool={activeTool} selectedEnrichment={selectedEnrichment} />
            <EventPopupLayer />
            <LogArea><MessageLogPanel /></LogArea>
          </Center>
          <Right><DossierPanel /></Right>
        </Main>

        {gameState.endgame && (
          <EndgameOverlay>
            <EndgameGlyph $type={gameState.endgame}>{ENDGAME_GLYPH[gameState.endgame]}</EndgameGlyph>
            <EndgameTitle $type={gameState.endgame}>{ENDGAME_TITLE[gameState.endgame]}</EndgameTitle>
            <EndgameBody>{gameState.messages[gameState.messages.length-1]?.text}</EndgameBody>
            <EndgameBtn onClick={()=>setShowRestartConfirm(true)}>Begin Again</EndgameBtn>
          </EndgameOverlay>
        )}

        {showRestartConfirm && (
          <ConfirmOverlay onClick={()=>setShowRestartConfirm(false)}>
            <ConfirmBox onClick={e=>e.stopPropagation()}>
              <ConfirmTitle>Reset Colony</ConfirmTitle>
              <ConfirmBody>
                This will erase the current world and all its creatures.<br />
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
