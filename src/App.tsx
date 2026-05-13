import { lazy, Suspense, useEffect, useState } from 'react'
import { useLaietStore } from '@/store/gameStore'
import { supabase } from '@/db/supabase'
import { AuthScreen } from '@/ui/components/AuthScreen'
import { ProfileScreen } from '@/ui/components/ProfileScreen'
import { CaretakerProfile } from '@/types'
import styled, { createGlobalStyle, keyframes } from 'styled-components'

const NewWorldScreen = lazy(() =>
  import('@/ui/components/NewWorldScreen').then(m => ({ default: m.NewWorldScreen }))
)
const GameLayout = lazy(() =>
  import('@/ui/components/GameLayout').then(m => ({ default: m.GameLayout }))
)

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%;
    background: #04040e;
    background-image:
      radial-gradient(ellipse at top, rgba(40, 30, 90, 0.18), transparent 60%),
      radial-gradient(ellipse at bottom, rgba(20, 60, 120, 0.10), transparent 70%),
      linear-gradient(180deg, #04040e 0%, #06061a 100%);
    color: #ede2c4;
    font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
    overflow-x: auto;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #04040e; }
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #2e2e60, #1a1a32);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover { background: #4a4a80; }

  button { font-family: inherit; }

  /* Selection */
  ::selection {
    background: rgba(200, 120, 240, 0.35);
    color: #ffffff;
  }
`

// Subtle vertical scan moving slowly down
const scanH = keyframes`
  0%   { transform: translateY(-100%); opacity: 0; }
  8%   { opacity: 1; }
  92%  { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
`

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  47%      { opacity: 1; }
  48%      { opacity: 0.6; }
  49%      { opacity: 1; }
  82%      { opacity: 1; }
  83%      { opacity: 0.85; }
  84%      { opacity: 1; }
`

const ScanLine = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(180deg,
    transparent,
    rgba(180, 140, 255, 0.08) 50%,
    transparent
  );
  pointer-events: none;
  z-index: 9999;
  animation: ${scanH} 14s linear infinite;
`

const Vignette = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
  background:
    radial-gradient(ellipse 90% 70% at center, transparent 55%, rgba(0, 0, 8, 0.55) 100%);
`

const LoadingScreen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  letter-spacing: 0.3em;
  gap: 14px;
  animation: ${flicker} 6s infinite;
`

const LoadingLogo = styled.div`
  font-size: 22px;
  color: #c878f0;
  text-shadow: 0 0 18px rgba(200, 120, 240, 0.55);
  letter-spacing: 0.4em;
`

const LoadingHint = styled.div`
  font-size: 11px;
  color: #8888b0;
  letter-spacing: 0.25em;
`

const LoadingDots = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 8px;
`

const Dot = styled.div<{ delay: number }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5ec8e0;
  opacity: 0.3;
  animation: pulse 1.4s infinite;
  animation-delay: ${p => p.delay}s;

  @keyframes pulse {
    0%, 100% { opacity: 0.2; }
    50%      { opacity: 1; box-shadow: 0 0 6px #5ec8e0; }
  }
`

function LazyFallback({ hint }: { hint: string }) {
  return (
    <LoadingScreen>
      <LoadingLogo>◈ LA-IET ◈</LoadingLogo>
      <LoadingHint>{hint}</LoadingHint>
      <LoadingDots>
        <Dot delay={0} /><Dot delay={0.2} /><Dot delay={0.4} />
      </LoadingDots>
    </LoadingScreen>
  )
}

export function App() {
  const userId = useLaietStore(s => s.userId)
  const gameState = useLaietStore(s => s.gameState)
  const isLoading = useLaietStore(s => s.isLoading)
  const setUser = useLaietStore(s => s.setUser)
  const clearUser = useLaietStore(s => s.clearUser)
  const loadWorld = useLaietStore(s => s.loadWorld)
  const [authChecked, setAuthChecked] = useState(false)
  // Held in App until NewWorldScreen consumes it. Cleared when a world loads.
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
  }, [])

  useEffect(() => {
    if (userId && !gameState && !isLoading) {
      loadWorld(userId)
    }
  }, [userId])

  if (!authChecked || isLoading) {
    return (
      <>
        <GlobalStyle />
        <LoadingScreen>
          <LoadingLogo>◈ LA-IET ◈</LoadingLogo>
          <LoadingHint>
            {!authChecked ? '∙ checking session ∙' : '∙ awakening specimen ∙'}
          </LoadingHint>
          <LoadingDots>
            <Dot delay={0} />
            <Dot delay={0.2} />
            <Dot delay={0.4} />
          </LoadingDots>
        </LoadingScreen>
      </>
    )
  }

  return (
    <>
      <GlobalStyle />
      <ScanLine />
      <Vignette />
      {!userId && <AuthScreen />}
      {userId && !gameState && !pendingProfile && (
        <ProfileScreen onComplete={setPendingProfile} />
      )}
      {userId && !gameState && pendingProfile && (
        <Suspense fallback={<LazyFallback hint="∙ preparing world ∙" />}>
          <NewWorldScreen profile={pendingProfile} onWorldCreated={() => setPendingProfile(null)} />
        </Suspense>
      )}
      {userId && gameState && (
        <Suspense fallback={<LazyFallback hint="∙ awakening specimen ∙" />}>
          <GameLayout />
        </Suspense>
      )}
    </>
  )
}
