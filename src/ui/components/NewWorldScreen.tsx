import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { CaretakerProfile } from '@/types'
import { unlockAudio } from '@/audio/unlock'

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  93%      { opacity: 1; }
  94%      { opacity: 0.65; }
  95%      { opacity: 1; }
`

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  color: #ede2c4;
  animation: ${flicker} 9s infinite;
  padding: 2rem 1rem;
`

const Title = styled.div`
  font-size: 22px;
  color: #c878f0;
  letter-spacing: 0.32em;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 24px rgba(200, 120, 240, 0.45);
`

const Subtitle = styled.div`
  font-size: 11px;
  color: #8888b0;
  letter-spacing: 0.32em;
  margin-bottom: 2.5rem;
`

const Prose = styled.div`
  font-size: 11px;
  color: #9aacb8;
  max-width: 480px;
  text-align: center;
  line-height: 2;
  margin-bottom: 2.5rem;
  font-style: italic;
  letter-spacing: 0.04em;
`

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 380px;
  padding: 20px 22px;
  background:
    linear-gradient(180deg, rgba(20, 20, 50, 0.45), rgba(8, 8, 28, 0.85));
  border: 1px solid #2e2e60;
  border-radius: 4px;
  box-shadow: 0 0 28px rgba(80, 60, 160, 0.18), inset 0 0 30px rgba(0, 0, 0, 0.4);
`

const NameField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const FieldLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9.5px;
  color: #5ec8e0;
  letter-spacing: 0.18em;

  &::before {
    content: '◇';
    color: #5ec8e0;
  }
`

const FieldRow = styled.div`
  display: flex;
  gap: 8px;
`

const Input = styled.input`
  background: #06061a;
  border: 1px solid #1c1c40;
  border-radius: 2px;
  color: #ede2c4;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  padding: 7px 11px;
  outline: none;
  flex: 1;
  letter-spacing: 0.04em;
  transition: all 0.15s;

  &:focus {
    border-color: #5ec8e0;
    box-shadow: 0 0 8px rgba(94, 200, 224, 0.25);
  }
  &::placeholder { color: #3a3a55; }
`

const Btn = styled.button`
  background: rgba(200, 120, 240, 0.14);
  border: 1px solid #5a3878;
  color: #c878f0;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  padding: 11px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.2em;
  margin-top: 4px;
  transition: all 0.15s;

  &:hover {
    background: rgba(200, 120, 240, 0.20);
    border-color: #c878f0;
    color: #f0a0ff;
    box-shadow: 0 0 14px rgba(200, 120, 240, 0.35);
  }
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`

const Note = styled.div`
  font-size: 10.5px;
  color: #7070a0;
  text-align: center;
  line-height: 1.8;
  letter-spacing: 0.12em;
  margin-top: 2rem;
`

interface NamePair { name: string; familyName: string }

const DEFAULT_NAMES: NamePair[] = [
  { name: '', familyName: '' },
  { name: '', familyName: '' },
  { name: '', familyName: '' },
  { name: '', familyName: '' },
]

interface NewWorldScreenProps {
  profile: CaretakerProfile
  onWorldCreated: () => void
}

export function NewWorldScreen({ profile, onWorldCreated }: NewWorldScreenProps) {
  const userId = useLaietStore(s => s.userId)
  const initNewWorld = useLaietStore(s => s.initNewWorld)
  const [pairs, setPairs] = useState<NamePair[]>(DEFAULT_NAMES)

  const update = (i: number, field: 'name' | 'familyName', val: string) => {
    setPairs(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }

  const valid = pairs.filter(p => p.name.trim() && p.familyName.trim()).length >= 1

  const handleBegin = () => {
    if (!userId) return
    unlockAudio()  // user-gesture context: prime the AudioContext before GameLayout mounts
    const named = pairs.filter(p => p.name.trim() && p.familyName.trim())
    initNewWorld(userId, named, profile)
    onWorldCreated()
  }

  return (
    <Screen>
      <Title>◈ NEW SPECIMEN</Title>
      <Subtitle>∙ initialising observation cabinet ∙</Subtitle>

      <Prose>
        four creatures will be placed in the world — one of each kind.<br />
        name them. they will remember the names you give.<br />
        their offspring will carry those names forward, changed by time.
      </Prose>

      <Form>
        {pairs.map((pair, i) => (
          <NameField key={i}>
            <FieldLabel>
              specimen {i + 1}{i === 0 ? ' · required' : ' · optional'}
            </FieldLabel>
            <FieldRow>
              <Input
                placeholder='given name'
                value={pair.name}
                onChange={e => update(i, 'name', e.target.value)}
              />
              <Input
                placeholder='family name'
                value={pair.familyName}
                onChange={e => update(i, 'familyName', e.target.value)}
              />
            </FieldRow>
          </NameField>
        ))}

        <Btn onClick={handleBegin} disabled={!valid}>
          ◇  BEGIN OBSERVATION  ◇
        </Btn>
      </Form>

      <Note>
        the world generates from a random seed each time<br />
        your colony will be saved to your account automatically
      </Note>
    </Screen>
  )
}
