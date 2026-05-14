import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { supabase } from '@/db/supabase'
import { useLaietStore } from '@/store/gameStore'
import { THEME } from '@/ui/theme'

const fadeUp = keyframes`from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}`

const Screen = styled.div`
  min-height:100vh; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  background:${THEME.bg}; font-family:${THEME.font};
  color:${THEME.textPrimary}; padding:1rem;
  animation:${fadeUp} 0.5s ease;
`
const Logo = styled.div`
  font-size:40px; font-weight:700; color:${THEME.textPrimary};
  letter-spacing:0.1em; margin-bottom:4px;
`
const LogoAccent = styled.span`color:${THEME.amber};`
const Subtitle = styled.div`
  font-size:10px; font-weight:700; text-transform:uppercase;
  letter-spacing:0.3em; color:${THEME.textTertiary}; margin-bottom:3.5rem;
`
const Form = styled.div`
  display:flex; flex-direction:column; gap:10px; width:320px;
  padding:24px; background:#242424;
  border:2px solid ${THEME.border}; border-radius:8px;
`
const FormTitle = styled.div`
  font-size:11px; font-weight:700; text-transform:uppercase;
  letter-spacing:0.2em; color:${THEME.textTertiary}; margin-bottom:4px; text-align:center;
`
const Input = styled.input`
  background:${THEME.bgDeep}; border:2px solid ${THEME.border};
  border-radius:5px; color:${THEME.textPrimary};
  font-family:${THEME.font}; font-size:13px; font-weight:500;
  padding:9px 12px; outline:none; width:100%; box-sizing:border-box;
  transition:border-color 0.15s;
  &:focus { border-color:${THEME.amber}; }
  &::placeholder { color:${THEME.textTertiary}; }
`
const PrimaryBtn = styled.button`
  background:${THEME.amber}; border:none; border-radius:5px;
  color:#1c1c1c; font-family:${THEME.font}; font-size:12px; font-weight:700;
  padding:11px; cursor:pointer; letter-spacing:0.06em; text-transform:uppercase;
  transition:opacity 0.12s;
  &:hover { opacity:0.88; }
  &:disabled { opacity:0.35; cursor:not-allowed; }
`
const GhostBtn = styled.button`
  background:transparent; border:2px solid ${THEME.border}; border-radius:5px;
  color:${THEME.textTertiary}; font-family:${THEME.font}; font-size:11px; font-weight:600;
  padding:9px; cursor:pointer; letter-spacing:0.08em;
  transition:all 0.12s;
  &:hover { border-color:${THEME.textSecondary}; color:${THEME.textSecondary}; }
`
const Divider = styled.div`height:1px;background:${THEME.border};margin:2px 0;`
const ErrorMsg  = styled.div`color:${THEME.threat};font-size:11px;font-weight:600;text-align:center;`
const SuccessMsg= styled.div`color:${THEME.alive};font-size:11px;font-weight:600;text-align:center;`
const Footer = styled.div`
  margin-top:2.5rem; font-size:11px; font-weight:400; color:${THEME.textTertiary};
  text-align:center; line-height:1.9; letter-spacing:0.08em;
`

export function AuthScreen() {
  const [mode, setMode]       = useState<'login'|'signup'>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [message, setMessage] = useState('')
  const setUser = useLaietStore(s => s.setUser)

  async function handleSubmit() {
    setLoading(true); setError(''); setMessage('')
    try {
      if (mode === 'signup') {
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
        {error   && <ErrorMsg>{error}</ErrorMsg>}
        {message && <SuccessMsg>{message}</SuccessMsg>}
        <PrimaryBtn onClick={handleSubmit} disabled={loading || !email || !password}>
          {loading ? 'Processing…' : mode === 'login' ? 'Access' : 'Create account'}
        </PrimaryBtn>
        <Divider />
        <GhostBtn onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
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
