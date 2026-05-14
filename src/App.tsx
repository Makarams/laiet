import { lazy, Suspense, useEffect, useState } from 'react'
import { useLaietStore } from '@/store/gameStore'
import { supabase } from '@/db/supabase'
import { AuthScreen } from '@/ui/components/AuthScreen'
import { ProfileScreen } from '@/ui/components/ProfileScreen'
import { CaretakerProfile } from '@/types'
import styled, { createGlobalStyle, keyframes } from 'styled-components'
import { THEME } from '@/ui/theme'

const NewWorldScreen = lazy(() =>
  import('@/ui/components/NewWorldScreen').then(m => ({ default: m.NewWorldScreen }))
)
const GameLayout = lazy(() =>
  import('@/ui/components/GameLayout').then(m => ({ default: m.GameLayout }))
)

// ─── Global baseline (Field Guide) ───────────────────────────────────────────
// GameLayout injects its own GlobalStyle for the in-game view.
// This baseline covers auth, loading, and profile screens.
const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%;
    background: ${THEME.bg};
    color: ${THEME.textPrimary};
    font-family: ${THEME.font};
    -webkit-font-smoothing: antialiased;
    overflow-x: auto;
  }

  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${THEME.bgDeep}; }
  ::-webkit-scrollbar-thumb { background: ${THEME.borderMid}; border-radius: 2px; }

  button { font-family: inherit; }

  ::selection {
    background: rgba(232, 200, 74, 0.25);
    color: #ffffff;
  }
`

// ─── Loading screen ───────────────────────────────────────────────────────────

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`

const pulseBar = keyframes`
  0%   { width: 0%; }
  40%  { width: 65%; }
  70%  { width: 82%; }
  100% { width: 100%; }
`

const dotPulse = keyframes`
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%       { opacity: 1;   transform: scale(1.0); }
`

const LoadingScreen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${THEME.bg};
  font-family: ${THEME.font};
  gap: 10px;
  animation: ${fadeIn} 0.3s ease;
`

const LoadingLogo = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${THEME.textPrimary};
  letter-spacing: 0.08em;
`

const LoadingAccent = styled.span`color: ${THEME.amber};`

const LoadingLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: ${THEME.textTertiary};
  margin-bottom: 6px;
`

const LoadingBarTrack = styled.div`
  width: 180px;
  height: 2px;
  background: ${THEME.border};
  border-radius: 1px;
  overflow: hidden;
  margin-top: 4px;
`

const LoadingBarFill = styled.div`
  height: 100%;
  background: ${THEME.amber};
  border-radius: 1px;
  animation: ${pulseBar} 2.2s ease-out infinite;
`

const LoadingDots = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 6px;
`

const Dot = styled.div<{ $delay: number }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${THEME.amber};
  animation: ${dotPulse} 1.2s ease-in-out infinite;
  animation-delay: ${p => p.$delay}s;
`

function LazyFallback({ hint }: { hint: string }) {
  return (
    <LoadingScreen>
      <LoadingLogo>LA<LoadingAccent>·</LoadingAccent>IET</LoadingLogo>
      <LoadingLabel>{hint}</LoadingLabel>
      <LoadingBarTrack><LoadingBarFill /></LoadingBarTrack>
      <LoadingDots>
        <Dot $delay={0} /><Dot $delay={0.2} /><Dot $delay={0.4} />
      </LoadingDots>
    </LoadingScreen>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const userId    = useLaietStore(s => s.userId)
  const gameState = useLaietStore(s => s.gameState)
  const isLoading = useLaietStore(s => s.isLoading)
  const setUser   = useLaietStore(s => s.setUser)
  const clearUser = useLaietStore(s => s.clearUser)
  const loadWorld = useLaietStore(s => s.loadWorld)

  const [authChecked, setAuthChecked] = useState(false)
  const [pendingProfile, setPendingProfile] = useState<CaretakerProfile | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user.id, data.session.user.email ?? '')
      }
      setAuthChecked(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user.id, session.user.email ?? '')
      } else {
        clearUser()
      }
    })

    return () => { listener.subscription.unsubscribe() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userId && !gameState && !isLoading) {
      loadWorld(userId)
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading state ───────────────────────────────────────────────────────────
  if (!authChecked || isLoading) {
    return (
      <>
        <GlobalStyle />
        <LazyFallback hint={!authChecked ? 'Connecting' : 'Loading record'} />
      </>
    )
  }

  return (
    <>
      <GlobalStyle />

      {!userId && <AuthScreen />}

      {userId && !gameState && !pendingProfile && (
        <ProfileScreen onComplete={setPendingProfile} />
      )}

      {userId && !gameState && pendingProfile && (
        <Suspense fallback={<LazyFallback hint="Building world" />}>
          <NewWorldScreen profile={pendingProfile} onWorldCreated={() => setPendingProfile(null)} />
        </Suspense>
      )}

      {userId && gameState && (
        <Suspense fallback={<LazyFallback hint="Loading record" />}>
          <GameLayout />
        </Suspense>
      )}
    </>
  )
}
