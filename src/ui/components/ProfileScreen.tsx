import { useState } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { CaretakerProfile } from '@/types'

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
`

// ─── Layout ──────────────────────────────────────────────────────────────────

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  padding: 3rem 1.5rem;
  position: relative;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 3.2rem;
  animation: ${fadeIn} 0.6s ease;
`

const HeaderGlyph = styled.div`
  font-size: 18px;
  color: #c878f0;
  letter-spacing: 0.5em;
  text-shadow: 0 0 20px rgba(200, 120, 240, 0.45);
  margin-bottom: 0.7rem;
  animation: ${pulse} 4s ease-in-out infinite;
`

const HeaderSub = styled.div`
  font-size: 10px;
  color: #8888b0;
  letter-spacing: 0.32em;
`

// ─── Question card ────────────────────────────────────────────────────────────

const QuestionWrap = styled.div<{ visible: boolean }>`
  width: 100%;
  max-width: 540px;
  opacity: ${p => p.visible ? 1 : 0};
  transition: opacity 0.22s ease;
  animation: ${p => p.visible ? css`${fadeIn} 0.28s ease` : 'none'};
`

const QuestionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.4rem;
`

const QuestionIndex = styled.div`
  font-size: 10px;
  color: #7878a0;
  letter-spacing: 0.24em;
`

const QuestionRule = styled.div`
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #2a2a50, transparent);
`

const QuestionText = styled.div`
  font-size: 14px;
  color: #ede2c4;
  letter-spacing: 0.05em;
  line-height: 1.7;
  margin-bottom: 0.5rem;
`

const QuestionSub = styled.div`
  font-size: 10px;
  color: #6060a0;
  letter-spacing: 0.12em;
  font-style: italic;
  margin-bottom: 1.8rem;
  line-height: 1.8;
`

// ─── Option cards ─────────────────────────────────────────────────────────────

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const OptionCard = styled.button<{ selected: boolean }>`
  background: ${p => p.selected
    ? 'linear-gradient(180deg, rgba(200,120,240,0.14), rgba(120,60,180,0.08))'
    : 'linear-gradient(180deg, rgba(20,20,50,0.40), rgba(8,8,28,0.75))'};
  border: 1px solid ${p => p.selected ? '#c878f0' : '#2a2a50'};
  border-radius: 3px;
  padding: 14px 18px;
  cursor: pointer;
  text-align: left;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  transition: all 0.16s ease;
  box-shadow: ${p => p.selected
    ? '0 0 16px rgba(200,120,240,0.20), inset 0 0 12px rgba(200,120,240,0.06)'
    : 'none'};
  width: 100%;

  &:hover {
    border-color: ${p => p.selected ? '#c878f0' : '#5a4a80'};
    background: linear-gradient(180deg, rgba(200,120,240,0.08), rgba(8,8,28,0.75));
  }
`

const OptionGlyph = styled.span<{ selected: boolean }>`
  font-size: 11px;
  color: ${p => p.selected ? '#c878f0' : '#3a3a58'};
  letter-spacing: 0.2em;
  margin-right: 10px;
  transition: color 0.16s;
`

const OptionLabel = styled.span<{ selected: boolean }>`
  font-size: 12px;
  color: ${p => p.selected ? '#f0d8ff' : '#c0b8e0'};
  letter-spacing: 0.06em;
  font-weight: ${p => p.selected ? 'bold' : 'normal'};
`

const OptionDesc = styled.div`
  font-size: 10.5px;
  color: #8080a8;
  letter-spacing: 0.10em;
  font-style: italic;
  margin-top: 5px;
  margin-left: 21px;
  line-height: 1.6;
`

// ─── Navigation ───────────────────────────────────────────────────────────────

const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
  width: 100%;
  max-width: 540px;
`

const ProgressDots = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`

const ProgressDot = styled.div<{ active: boolean; done: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  background: ${p => p.active ? '#c878f0' : p.done ? '#6a3a88' : '#1a1a30'};
  box-shadow: ${p => p.active ? '0 0 8px #c878f0' : 'none'};
  border: 1px solid ${p => p.active ? '#c878f0' : p.done ? '#4a2860' : '#2a2a40'};
`

const NavBtn = styled.button<{ disabled?: boolean }>`
  background: ${p => p.disabled ? 'transparent' : 'rgba(200,120,240,0.12)'};
  border: 1px solid ${p => p.disabled ? '#1a1a30' : '#5a3878'};
  color: ${p => p.disabled ? '#2a2a40' : '#c878f0'};
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 11px;
  padding: 8px 20px;
  cursor: ${p => p.disabled ? 'default' : 'pointer'};
  border-radius: 2px;
  letter-spacing: 0.18em;
  transition: all 0.15s;
  pointer-events: ${p => p.disabled ? 'none' : 'auto'};

  &:hover {
    border-color: #c878f0;
    color: #f0a0ff;
    box-shadow: 0 0 12px rgba(200,120,240,0.28);
  }
`

// ─── Question data ────────────────────────────────────────────────────────────

interface Option<T extends string> {
  value: T
  glyph: string
  label: string
  desc: string
}

interface Question {
  key: keyof CaretakerProfile
  text: string
  sub: string
  options: Option<string>[]
}

const QUESTIONS: Question[] = [
  {
    key: 'presence',
    text: 'how will you regard the colony?',
    sub: 'this shapes your tools and how often you\'re able to act',
    options: [
      { value: 'interventionist', glyph: '◈', label: 'with care', desc: 'I will act when they need me — food, healing, shelter' },
      { value: 'observer',        glyph: '◎', label: 'with distance', desc: 'I\'ll intervene when it matters. otherwise I watch.' },
      { value: 'silent',          glyph: '◌', label: 'with silence', desc: 'this is their world. I am only observing.' },
    ],
  },
  {
    key: 'world',
    text: 'what kind of world should they inherit?',
    sub: 'determines the generosity of the environment across seasons',
    options: [
      { value: 'fertile',  glyph: '✦', label: 'generous', desc: 'let life take hold easily. food regrows quickly. drought is rare.' },
      { value: 'varied',   glyph: '◇', label: 'balanced', desc: 'abundance and hardship in turns. the world is indifferent.' },
      { value: 'scarce',   glyph: '◌', label: 'resistant', desc: 'scarcity will shape who survives. drought lingers. food is earned.' },
    ],
  },
  {
    key: 'evolution',
    text: 'how should generations change them?',
    sub: 'affects mutation rate and how fast the mind develops',
    options: [
      { value: 'fast', glyph: '⚡', label: 'quickly', desc: 'I want to see them become something unrecognizable. change is rapid.' },
      { value: 'slow', glyph: '∿', label: 'gradually', desc: 'let each generation echo the last. lineages stabilize slowly.' },
    ],
  },
  {
    key: 'focus',
    text: 'what will you watch most closely?',
    sub: 'the colony will subtly tend toward what you pay attention to',
    options: [
      { value: 'bonds',     glyph: '♥', label: 'their bonds', desc: 'love, grief, loyalty. who stays close. who mourns.' },
      { value: 'survival',  glyph: '◈', label: 'their survival', desc: 'what endures the world. what breaks. what endures.' },
      { value: 'awareness', glyph: '◉', label: 'their awakening', desc: 'the moment they notice something watching. what it means.' },
    ],
  },
  {
    key: 'expectation',
    text: 'what do you expect to witness?',
    sub: 'your expectation shapes the world\'s tendency, not its certainty',
    options: [
      { value: 'ascension',   glyph: '◈', label: 'transcendence', desc: 'they will grow beyond this world. the colony will ascend.' },
      { value: 'persistence', glyph: '◇', label: 'endurance', desc: 'they will simply persist. no dramatic ending. just time.' },
      { value: 'extinction',  glyph: '✝', label: 'extinction', desc: 'I want to see the last one fall. I\'ll watch until the end.' },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface ProfileScreenProps {
  onComplete: (profile: CaretakerProfile) => void
}

type PartialProfile = Partial<CaretakerProfile>

export function ProfileScreen({ onComplete }: ProfileScreenProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<PartialProfile>({})
  const [visible, setVisible] = useState(true)

  const q = QUESTIONS[step]
  const selected = answers[q.key] as string | undefined

  function choose(value: string) {
    const next = { ...answers, [q.key]: value }
    setAnswers(next)
  }

  function advance() {
    if (!selected) return
    if (step < QUESTIONS.length - 1) {
      setVisible(false)
      setTimeout(() => {
        setStep(s => s + 1)
        setVisible(true)
      }, 200)
    } else {
      onComplete(answers as CaretakerProfile)
    }
  }

  function back() {
    if (step === 0) return
    setVisible(false)
    setTimeout(() => {
      setStep(s => s - 1)
      setVisible(true)
    }, 200)
  }

  return (
    <Screen>
      <Header>
        <HeaderGlyph>◈ LA-IET ◈</HeaderGlyph>
        <HeaderSub>∙ before the world begins ∙</HeaderSub>
      </Header>

      <QuestionWrap visible={visible}>
        <QuestionMeta>
          <QuestionIndex>◇ {String(step + 1).padStart(2, '0')} / 05</QuestionIndex>
          <QuestionRule />
        </QuestionMeta>

        <QuestionText>{q.text}</QuestionText>
        <QuestionSub>{q.sub}</QuestionSub>

        <Options>
          {q.options.map(opt => (
            <OptionCard
              key={opt.value}
              selected={selected === opt.value}
              onClick={() => choose(opt.value)}
            >
              <div>
                <OptionGlyph selected={selected === opt.value}>{opt.glyph}</OptionGlyph>
                <OptionLabel selected={selected === opt.value}>{opt.label}</OptionLabel>
              </div>
              <OptionDesc>{opt.desc}</OptionDesc>
            </OptionCard>
          ))}
        </Options>
      </QuestionWrap>

      <NavRow>
        <NavBtn onClick={back} disabled={step === 0}>
          ← back
        </NavBtn>

        <ProgressDots>
          {QUESTIONS.map((_, i) => (
            <ProgressDot
              key={i}
              active={i === step}
              done={i < step || (i === step && !!selected)}
            />
          ))}
        </ProgressDots>

        <NavBtn onClick={advance} disabled={!selected}>
          {step < QUESTIONS.length - 1 ? 'next →' : '◈  begin  ◈'}
        </NavBtn>
      </NavRow>
    </Screen>
  )
}
