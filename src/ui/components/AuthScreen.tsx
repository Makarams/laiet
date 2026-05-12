import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { supabase } from '@/db/supabase'
import { useLaietStore } from '@/store/gameStore'

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
`

const flicker = keyframes`
  0%, 100%      { opacity: 1; }
  47%, 49%, 84% { opacity: 1; }
  48%           { opacity: 0.55; }
  83%           { opacity: 0.85; }
`

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  color: #ede2c4;
  animation: ${flicker} 7s infinite;
  padding: 1rem;
`

const Title = styled.div`
  font-size: 38px;
  letter-spacing: 0.4em;
  color: #c878f0;
  margin-bottom: 6px;
  text-shadow: 0 0 24px rgba(200, 120, 240, 0.55);
`

const Subtitle = styled.div`
  font-size: 11px;
  color: #8888b0;
  letter-spacing: 0.32em;
  margin-bottom: 3.5rem;
`

const Cursor = styled.span`
  animation: ${blink} 1.1s step-end infinite;
  color: #c878f0;
`

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 320px;
  padding: 22px 24px;
  background:
    linear-gradient(180deg, rgba(20, 20, 50, 0.45), rgba(8, 8, 28, 0.85));
  border: 1px solid #2e2e60;
  border-radius: 4px;
  box-shadow: 0 0 28px rgba(80, 60, 160, 0.18), inset 0 0 30px rgba(0, 0, 0, 0.4);
`

const Prompt = styled.div`
  font-size: 9.5px;
  color: #5ec8e0;
  letter-spacing: 0.22em;
  text-align: center;
  margin-bottom: 4px;
`

const Input = styled.input`
  background: #06061a;
  border: 1px solid #1c1c40;
  border-radius: 2px;
  color: #ede2c4;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  padding: 8px 12px;
  outline: none;
  width: 100%;
  letter-spacing: 0.05em;
  transition: all 0.15s;

  &:focus {
    border-color: #5ec8e0;
    box-shadow: 0 0 8px rgba(94, 200, 224, 0.25);
  }
  &::placeholder { color: #3a3a55; }
`

const Btn = styled.button<{ variant?: 'primary' | 'ghost' }>`
  background: ${p => p.variant === 'ghost' ? 'transparent' : 'rgba(200, 120, 240, 0.12)'};
  border: 1px solid ${p => p.variant === 'ghost' ? '#2a2a50' : '#5a3878'};
  color: ${p => p.variant === 'ghost' ? '#7a78a5' : '#c878f0'};
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  padding: 9px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.16em;
  transition: all 0.15s;

  &:hover {
    border-color: ${p => p.variant === 'ghost' ? '#5ec8e0' : '#c878f0'};
    color: ${p => p.variant === 'ghost' ? '#5ec8e0' : '#f0a0ff'};
    box-shadow: ${p => p.variant === 'ghost' ? 'none' : '0 0 14px rgba(200, 120, 240, 0.30)'};
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const ErrorMsg = styled.div`
  color: #ff7080;
  font-size: 10.5px;
  text-align: center;
  letter-spacing: 0.05em;
`

const SuccessMsg = styled.div`
  color: #80f0a0;
  font-size: 10.5px;
  text-align: center;
  letter-spacing: 0.05em;
`

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, #2a2a50, transparent);
  margin: 4px 0;
`

const Footer = styled.div`
  margin-top: 2.5rem;
  font-size: 10.5px;
  color: #7070a0;
  text-align: center;
  line-height: 2;
  letter-spacing: 0.15em;
`

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const setUser = useLaietStore(s => s.setUser)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          setMessage('◇ check your email to confirm ◇')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) {
          setUser(data.user.id, data.user.email ?? '')
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Title>LA-IET<Cursor>_</Cursor></Title>
      <Subtitle>∙ SPECIMEN CABINET v0.2 ∙</Subtitle>

      <Form>
        <Prompt>
          {mode === 'login' ? '◈ ENTER COLONY' : '◈ NEW OBSERVER'}
        </Prompt>

        <Input
          type='email'
          placeholder='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <Input
          type='password'
          placeholder='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {error && <ErrorMsg>◌ {error}</ErrorMsg>}
        {message && <SuccessMsg>{message}</SuccessMsg>}

        <Btn onClick={handleSubmit} disabled={loading || !email || !password}>
          {loading ? '∙ processing ∙' : mode === 'login' ? '◇ ENTER' : '◇ CREATE'}
        </Btn>

        <Divider />

        <Btn
          variant='ghost'
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
        >
          {mode === 'login' ? 'new specimen? create account' : 'have an account? sign in'}
        </Btn>
      </Form>

      <Footer>
        your colony survives device changes<br />
        time passes while you are away
      </Footer>
    </Screen>
  )
}
