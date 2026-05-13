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
  padding: 2.5rem 1.5rem;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
`

const Title = styled.div`
  font-size: clamp(15px, 4.5vw, 20px);
  color: #c878f0;
  letter-spacing: 0.28em;
  margin-bottom: 0.4rem;
  text-shadow: 0 0 24px rgba(200, 120, 240, 0.45);
  text-align: center;
`

const Subtitle = styled.div`
  font-size: 10.5px;
  color: #6a6a98;
  letter-spacing: 0.18em;
  margin-bottom: 2rem;
  text-align: center;
`

const Prose = styled.div`
  font-size: 11px;
  color: #9aacb8;
  width: 100%;
  max-width: 400px;
  text-align: center;
  line-height: 2;
  margin-bottom: 2rem;
  font-style: italic;
  letter-spacing: 0.04em;
  overflow-wrap: break-word;
`

const Form = styled.div`
  width: min(420px, 100%);
  box-sizing: border-box;
  padding: 22px 24px 24px;
  background: linear-gradient(180deg, rgba(20, 20, 50, 0.45), rgba(8, 8, 28, 0.85));
  border: 1px solid #2e2e60;
  border-radius: 4px;
  box-shadow: 0 0 28px rgba(80, 60, 160, 0.18), inset 0 0 30px rgba(0, 0, 0, 0.4);
`

const SpecimenBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px 0;
  border-bottom: 1px solid #161636;

  &:first-child {
    padding-top: 0;
  }

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }
`

const SpecimenHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`

const SpecimenNum = styled.span`
  font-size: 10px;
  color: #5ec8e0;
  letter-spacing: 0.22em;
  font-weight: bold;
`

const SpecimenTag = styled.span`
  font-size: 9px;
  color: #363656;
  letter-spacing: 0.16em;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const FieldLabel = styled.div`
  font-size: 9px;
  color: #44446a;
  letter-spacing: 0.20em;
  text-transform: uppercase;
`

const Input = styled.input`
  background: #06061a;
  border: 1px solid #1c1c3e;
  border-radius: 2px;
  color: #ede2c4;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  padding: 7px 11px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  letter-spacing: 0.04em;
  transition: all 0.15s;

  &:focus {
    border-color: #5ec8e0;
    box-shadow: 0 0 8px rgba(94, 200, 224, 0.22);
  }
  &::placeholder { color: #282845; }
`

const Btn = styled.button`
  background: rgba(200, 120, 240, 0.14);
  border: 1px solid #5a3878;
  color: #c878f0;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  padding: 12px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.22em;
  width: 100%;
  display: block;
  margin-top: 20px;
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
  font-size: 10px;
  color: #48486a;
  text-align: center;
  line-height: 2;
  letter-spacing: 0.10em;
  margin-top: 1.8rem;
  max-width: 100%;
  overflow-wrap: break-word;
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
    unlockAudio()
    const named = pairs.filter(p => p.name.trim() && p.familyName.trim())
    initNewWorld(userId, named, profile)
    onWorldCreated()
  }

  return (
    <Screen>
      <Title>◈ NEW SPECIMEN</Title>
      <Subtitle>∙ initialising observation cabinet ∙</Subtitle>

      <Prose>
        four creatures will be placed in the world, one of each kind.<br />
        they will remember the names you give.<br />
        their offspring will carry those names forward, reshaped by time.
      </Prose>

      <Form>
        {pairs.map((pair, i) => (
          <SpecimenBlock key={i}>
            <SpecimenHeader>
              <SpecimenNum>◇ {String(i + 1).padStart(2, '0')}</SpecimenNum>
              <SpecimenTag>{i === 0 ? 'required' : 'optional'}</SpecimenTag>
            </SpecimenHeader>
            <FieldGroup>
              <FieldLabel>given name</FieldLabel>
              <Input
                placeholder='given name'
                value={pair.name}
                onChange={e => update(i, 'name', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>family name</FieldLabel>
              <Input
                placeholder='family name'
                value={pair.familyName}
                onChange={e => update(i, 'familyName', e.target.value)}
              />
            </FieldGroup>
          </SpecimenBlock>
        ))}

        <Btn onClick={handleBegin} disabled={!valid}>
          ◇  begin observation  ◇
        </Btn>
      </Form>

      <Note>
        the world generates from a random seed each time.<br />
        your colony is saved to your account automatically.
      </Note>
    </Screen>
  )
}
