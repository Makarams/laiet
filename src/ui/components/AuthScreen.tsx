import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { supabase } from '@/db/supabase'
import { useLaietStore } from '@/store/gameStore'
import { THEME } from '@/ui/theme'

const fadeUp = keyframes`from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}`
const glow = keyframes`
  0%, 100% { text-shadow: 0 0 24px ${THEME.amberGlow}; }
  50%      { text-shadow: 0 0 40px ${THEME.amberGlow}, 0 0 60px ${THEME.amberDim}; }
`

const Screen = styled.div`
  min-height:100vh; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  background:
    radial-gradient(1000px 700px at 50% 30%, ${THEME.amberDim} 0%, transparent 60%),
    radial-gradient(800px 600px at 80% 90%, ${THEME.waterDim} 0%, transparent 65%),
    ${THEME.bg};
  font-family:${THEME.font};
  color:${THEME.textPrimary};
  padding:1rem;
  animation:${fadeUp} 0.55s ${THEME.motion.easeOut};
`
const Logo = styled.div`
  font-size:${THEME.type.hero}px; font-weight:700;
  color:${THEME.textPrimary};
  letter-spacing:0.10em;
  margin-bottom:6px;
  animation: ${glow} 4s ease-in-out infinite;
`
const LogoAccent = styled.span`color:${THEME.amber};`
const Subtitle = styled.div`
  font-size:${THEME.type.sm}px; font-weight:700;
  text-transform:uppercase; letter-spacing:0.32em;
  color:${THEME.textTertiary};
  margin-bottom:3.5rem;
`
const Form = styled.div`
  display:flex; flex-direction:column;
  gap:${THEME.space.md}px;
  width:340px;
  padding:${THEME.space.xxl}px ${THEME.space.xxl}px ${THEME.space.xl}px;
  background:${THEME.panelGradient};
  border:1px solid ${THEME.borderMid};
  border-radius:${THEME.radius.lg}px;
  box-shadow: ${THEME.shadow.pop};
`
const FormTitle = styled.div`
  font-size:${THEME.type.base}px; font-weight:700;
  text-transform:uppercase; letter-spacing:0.22em;
  color:${THEME.textTertiary};
  margin-bottom:${THEME.space.xs}px;
  text-align:center;
`
const Input = styled.input`
  background:${THEME.bgDeep};
  border:1px solid ${THEME.border};
  border-radius:${THEME.radius.sm}px;
  color:${THEME.textPrimary};
  font-family:${THEME.font};
  font-size:${THEME.type.lg}px; font-weight:500;
  padding:${THEME.space.md}px ${THEME.space.lg}px;
  outline:none; width:100%; box-sizing:border-box;
  transition: border-color ${THEME.motion.fast} ${THEME.motion.easeOut},
              box-shadow ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:focus {
    border-color:${THEME.amber};
    box-shadow: 0 0 0 3px ${THEME.amberDim};
  }
  &::placeholder { color:${THEME.textTertiary}; }
`
const PrimaryBtn = styled.button`
  background:${THEME.amber};
  border:none; border-radius:${THEME.radius.sm}px;
  color:${THEME.textInverse};
  font-family:${THEME.font};
  font-size:${THEME.type.md}px; font-weight:700;
  padding:${THEME.space.lg}px;
  cursor:pointer;
  letter-spacing:0.08em; text-transform:uppercase;
  transition: opacity ${THEME.motion.fast} ${THEME.motion.easeOut},
              transform ${THEME.motion.fast} ${THEME.motion.easeOut},
              box-shadow ${THEME.motion.fast} ${THEME.motion.easeOut};
  box-shadow: 0 0 18px ${THEME.amberGlow};
  &:hover { opacity:0.92; transform: translateY(-1px); box-shadow: 0 0 26px ${THEME.amberGlow}; }
  &:disabled { opacity:0.35; cursor:not-allowed; transform: none; box-shadow: none; }
`
const GhostBtn = styled.button`
  background:transparent;
  border:1px solid ${THEME.border};
  border-radius:${THEME.radius.sm}px;
  color:${THEME.textTertiary};
  font-family:${THEME.font};
  font-size:${THEME.type.base}px; font-weight:600;
  padding:${THEME.space.md}px;
  cursor:pointer; letter-spacing:0.08em;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:hover { border-color:${THEME.textSecondary}; color:${THEME.textSecondary}; }
`
const Divider = styled.div`height:1px;background:${THEME.border};margin:${THEME.space.xs}px 0;`
const ErrorMsg  = styled.div`color:${THEME.threat};font-size:${THEME.type.base}px;font-weight:600;text-align:center;`
const SuccessMsg= styled.div`color:${THEME.alive};font-size:${THEME.type.base}px;font-weight:600;text-align:center;`
const Footer = styled.div`
  margin-top:3rem;
  font-size:${THEME.type.base}px; font-weight:400;
  color:${THEME.textTertiary};
  text-align:center; line-height:2;
  letter-spacing:0.1em;
`

const INVITE_HASH = '3039373833340a'

function checkInvite(code: string): boolean {
  const expected = [57, 55, 56, 51, 52]
  const buf = [...code].map(c => c.charCodeAt(0))
  if (buf.length !== expected.length) return false
  return expected.every((v, i) => buf[i] === v)
}
void INVITE_HASH

export function AuthScreen() {
  const [mode, setMode]         = useState<'login'|'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [message, setMessage]   = useState('')
  const setUser = useLaietStore(s => s.setUser)

  function switchMode(next: 'login' | 'signup') {
    setMode(next); setError(''); setInvite('')
  }

  async function handleSubmit() {
    setLoading(true); setError(''); setMessage('')
    try {
      if (mode === 'signup') {
        if (!checkInvite(invite.trim())) {
          setError('Invalid invitation code.')
          setLoading(false)
          return
        }
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) setMessage('Check your email to confirm your account.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) setUser(data.user.id, data.user.email ?? '')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = !loading && !!email && !!password && (mode === 'login' || !!invite)

  return (
    <Screen>
      <Logo>LA<LogoAccent>·</LogoAccent>IET</Logo>
      <Subtitle>Specimen Cabinet</Subtitle>

      <Form>
        <FormTitle>{mode === 'login' ? 'Access record' : 'New observer'}</FormTitle>
        <Input type="email" placeholder="email" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <Input type="password" placeholder="password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        {mode === 'signup' && (
          <Input type="text" placeholder="invitation code" value={invite}
            onChange={e => setInvite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete="off" />
        )}
        {error   && <ErrorMsg>{error}</ErrorMsg>}
        {message && <SuccessMsg>{message}</SuccessMsg>}
        <PrimaryBtn onClick={handleSubmit} disabled={!canSubmit}>
          {loading ? 'Processing…' : mode === 'login' ? 'Access' : 'Create account'}
        </PrimaryBtn>
        <Divider />
        <GhostBtn onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'New here? Create account' : 'Already have an account? Sign in'}
        </GhostBtn>
      </Form>

      <Footer>
        field record persists across sessions<br />
        the colony runs without you
      </Footer>
    </Screen>
  )
}
