import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { supabase } from '@/db/supabase'
import { CaretakerProfile } from '@/types'
import { THEME } from '@/ui/theme'

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`

const Screen = styled.div`
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: ${THEME.bg}; font-family: ${THEME.font};
  color: ${THEME.textPrimary}; padding: 2rem 1rem;
  animation: ${fadeUp} 0.4s ease;
`
const Logo = styled.div`
  font-size: 28px; font-weight: 700; color: ${THEME.textPrimary};
  letter-spacing: 0.08em; margin-bottom: 4px;
`
const LogoAccent = styled.span`color: ${THEME.amber};`
const Eyebrow = styled.div`
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.3em; color: ${THEME.textTertiary}; margin-bottom: 2.5rem;
`
const Form = styled.div`
  width: min(880px, 100%); display: grid; grid-template-columns: 1fr 1fr; gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`
const FormColumn = styled.div`
  display: flex; flex-direction: column; gap: 14px;
`
const FormActions = styled.div`
  grid-column: 1 / -1; display: flex; flex-direction: column; gap: 10px; margin-top: 4px;
`
const Section = styled.div`
  background: #242424; border: 2px solid ${THEME.border}; border-radius: 8px; padding: 22px 24px;
`
const SectionTitle = styled.div`
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em;
  color: ${THEME.textTertiary}; margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
  &::after { content: ''; flex: 1; height: 1px; background: ${THEME.border}; }
`
const OptionGrid = styled.div<{ $cols: number }>`
  display: grid; grid-template-columns: repeat(${p => p.$cols}, 1fr); gap: 6px;
`
const OptionBtn = styled.button<{ $selected: boolean; $accent: string }>`
  background: ${p => p.$selected ? `${p.$accent}18` : 'transparent'};
  border: 2px solid ${p => p.$selected ? p.$accent : THEME.border};
  color: ${p => p.$selected ? p.$accent : THEME.textSecondary};
  font-family: ${THEME.font}; font-size: 11px; font-weight: 600;
  padding: 8px 6px; cursor: pointer; border-radius: 5px;
  letter-spacing: 0.06em; transition: all 0.12s; text-align: center;
  &:hover { border-color: ${p => p.$accent}; color: ${p => p.$accent}; }
`
const Hint = styled.div`
  font-size: 11px; color: ${THEME.textTertiary}; line-height: 1.7;
  font-style: italic; margin-top: 8px;
`
const PrimaryBtn = styled.button`
  background: ${THEME.amber}; border: none; border-radius: 5px;
  color: #1c1c1c; font-family: ${THEME.font}; font-size: 12px; font-weight: 700;
  padding: 13px; cursor: pointer; letter-spacing: 0.08em; text-transform: uppercase;
  transition: opacity 0.12s;
  &:hover { opacity: 0.88; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`
const SignOutBtn = styled.button`
  background: transparent; border: 2px solid ${THEME.border}; border-radius: 5px;
  color: ${THEME.textTertiary}; font-family: ${THEME.font};
  font-size: 11px; font-weight: 600; padding: 9px;
  cursor: pointer; transition: all 0.12s;
  &:hover { border-color: ${THEME.textSecondary}; color: ${THEME.textSecondary}; }
`

// ─── Profile options ──────────────────────────────────────────────────────────

type Presence    = CaretakerProfile['presence']
type World       = CaretakerProfile['world']
type Evolution   = CaretakerProfile['evolution']
type Focus       = CaretakerProfile['focus']
type Expectation = CaretakerProfile['expectation']
type Visibility  = CaretakerProfile['visibility']

const WORLD_HINTS: Record<World, string> = {
  fertile: 'abundant food, mild climate, forgiving start',
  varied:  'mixed ; moderate challenge across seasons',
  scarce:  'sparse food, extended drought, high lethality',
}
const PRESENCE_HINTS: Record<Presence, string> = {
  interventionist: 'more interventions, shorter tool cooldowns',
  observer:        'balanced ; standard charges and cooldowns',
  silent:          'minimal intervention; colony self-sustains',
}
const EVOLUTION_HINTS: Record<Evolution, string> = {
  fast:  'rapid mutation, swift lineage divergence, sentience accelerates',
  slow:  'gradual change, stable traits, generations echo each other',
}
const FOCUS_HINTS: Record<Focus, string> = {
  bonds:     'bond formation accelerated; mourning extended',
  survival:  'harsher baseline; longer droughts, sparser food',
  awareness: 'sentience grows faster; signal events trigger earlier',
}
const VISIBILITY_HINTS: Record<Visibility, string> = {
  attentive: 'creatures sense your presence; awareness blooms quickly',
  neutral:   'balanced ; creatures develop independence over time',
  hidden:    'your presence is subtle; awareness grows slowly, more autonomy',
}
const EXPECTATION_HINTS: Record<Expectation, string> = {
  persistence: 'no bias ; the colony persists according to its own nature',
  extinction:  'the world presses harder; harsher baseline conditions',
}

const WORLD_COLORS:     Record<World,       string> = { fertile: THEME.alive, varied: THEME.amber, scarce: THEME.threat }
const PRESENCE_COLORS:  Record<Presence,    string> = { interventionist: THEME.water, observer: THEME.amber, silent: THEME.textSecondary }
const EVOLUTION_COLORS: Record<Evolution,   string> = { fast: THEME.threat, slow: THEME.water }
const FOCUS_COLORS:     Record<Focus,       string> = { bonds: '#c878f0', survival: THEME.alive, awareness: THEME.water }
const VISIBILITY_COLORS: Record<Visibility, string> = { attentive: '#f0a8f0', neutral: THEME.amber, hidden: '#6a9a8a' }
const EXPECT_COLORS:    Record<Expectation, string> = { persistence: THEME.amber, extinction: THEME.death }

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { onComplete: (p: CaretakerProfile) => void }

export function ProfileScreen({ onComplete }: Props) {
  const clearUser = useLaietStore(s => s.clearUser)

  const [presence,    setPresence]    = useState<Presence>('observer')
  const [world,       setWorld]       = useState<World>('varied')
  const [evolution,   setEvolution]   = useState<Evolution>('slow')
  const [focus,       setFocus]       = useState<Focus>('survival')
  const [expectation, setExpectation] = useState<Expectation>('persistence')
  const [visibility,  setVisibility]  = useState<Visibility>('neutral')

  const handleSubmit = () => {
    const profile: CaretakerProfile = { presence, world, evolution, focus, expectation, visibility }
    onComplete(profile)
  }

  return (
    <Screen>
      <Logo>LA<LogoAccent>·</LogoAccent>IET</Logo>
      <Eyebrow>Configure observation</Eyebrow>

      <Form>
        <FormColumn>
          {/* World type */}
          <Section>
            <SectionTitle>Conditions</SectionTitle>
            <OptionGrid $cols={3}>
              {(['fertile','varied','scarce'] as World[]).map(w => (
                <OptionBtn key={w} $selected={world === w} $accent={WORLD_COLORS[w]}
                  onClick={() => setWorld(w)}>
                  {w}
                </OptionBtn>
              ))}
            </OptionGrid>
            <Hint>{WORLD_HINTS[world]}</Hint>
          </Section>

          {/* Evolution speed */}
          <Section>
            <SectionTitle>Mutation Rate</SectionTitle>
            <OptionGrid $cols={2}>
              {(['fast','slow'] as Evolution[]).map(e => (
                <OptionBtn key={e} $selected={evolution === e} $accent={EVOLUTION_COLORS[e]}
                  onClick={() => setEvolution(e)}>
                  {e}
                </OptionBtn>
              ))}
            </OptionGrid>
            <Hint>{EVOLUTION_HINTS[evolution]}</Hint>
          </Section>

          {/* Expectation */}
          <Section>
            <SectionTitle>Expectation</SectionTitle>
            <OptionGrid $cols={3}>
              {(['persistence','extinction'] as Expectation[]).map(e => (
                <OptionBtn key={e} $selected={expectation === e} $accent={EXPECT_COLORS[e]}
                  onClick={() => setExpectation(e)}>
                  {e.slice(0, 11)}
                </OptionBtn>
              ))}
            </OptionGrid>
            <Hint>{EXPECTATION_HINTS[expectation]}</Hint>
          </Section>
        </FormColumn>

        <FormColumn>
          {/* Caretaker presence */}
          <Section>
            <SectionTitle>Role</SectionTitle>
            <OptionGrid $cols={3}>
              {(['interventionist','observer','silent'] as Presence[]).map(p => (
                <OptionBtn key={p} $selected={presence === p} $accent={PRESENCE_COLORS[p]}
                  onClick={() => setPresence(p)}>
                  {p.slice(0, 10)}
                </OptionBtn>
              ))}
            </OptionGrid>
            <Hint>{PRESENCE_HINTS[presence]}</Hint>
          </Section>

          {/* Focus */}
          <Section>
            <SectionTitle>Colony Focus</SectionTitle>
            <OptionGrid $cols={3}>
              {(['bonds','survival','awareness'] as Focus[]).map(f => (
                <OptionBtn key={f} $selected={focus === f} $accent={FOCUS_COLORS[f]}
                  onClick={() => setFocus(f)}>
                  {f}
                </OptionBtn>
              ))}
            </OptionGrid>
            <Hint>{FOCUS_HINTS[focus]}</Hint>
          </Section>

          {/* Visibility */}
          <Section>
            <SectionTitle>Your Presence</SectionTitle>
            <OptionGrid $cols={3}>
              {(['attentive','neutral','hidden'] as Visibility[]).map(v => (
                <OptionBtn key={v} $selected={visibility === v} $accent={VISIBILITY_COLORS[v]}
                  onClick={() => setVisibility(v)}>
                  {v}
                </OptionBtn>
              ))}
            </OptionGrid>
            <Hint>{VISIBILITY_HINTS[visibility]}</Hint>
          </Section>
        </FormColumn>

        <FormActions>
          <PrimaryBtn onClick={handleSubmit}>Name subjects →</PrimaryBtn>

          <SignOutBtn onClick={async () => { await supabase.auth.signOut(); clearUser() }}>
            Sign out
          </SignOutBtn>
        </FormActions>
      </Form>
    </Screen>
  )
}
