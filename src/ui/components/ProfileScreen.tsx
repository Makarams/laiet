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
  background:
    radial-gradient(900px 600px at 50% 20%, ${THEME.amberDim} 0%, transparent 60%),
    radial-gradient(700px 500px at 90% 90%, ${THEME.waterDim} 0%, transparent 60%),
    ${THEME.bg};
  font-family: ${THEME.font};
  color: ${THEME.textPrimary};
  padding: 2rem 1rem;
  animation: ${fadeUp} 0.45s ${THEME.motion.easeOut};
`
const Logo = styled.div`
  font-size: ${THEME.type.title + 6}px; font-weight: 700;
  color: ${THEME.textPrimary};
  letter-spacing: 0.10em;
  margin-bottom: 6px;
  text-shadow: 0 0 24px ${THEME.amberGlow};
`
const LogoAccent = styled.span`color: ${THEME.amber};`
const Eyebrow = styled.div`
  font-size: ${THEME.type.xs}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.32em;
  color: ${THEME.textTertiary};
  margin-bottom: 2.75rem;
`
const Form = styled.div`
  width: min(920px, 100%);
  display: grid; grid-template-columns: 1fr 1fr;
  gap: ${THEME.space.xl}px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`
const FormColumn = styled.div`
  display: flex; flex-direction: column;
  gap: ${THEME.space.lg}px;
`
const FormActions = styled.div`
  grid-column: 1 / -1;
  display: flex; flex-direction: column;
  gap: ${THEME.space.md}px;
  margin-top: ${THEME.space.xs}px;
`
const Section = styled.div`
  background: ${THEME.panelGradient};
  border: 1px solid ${THEME.borderMid};
  border-radius: ${THEME.radius.lg}px;
  padding: ${THEME.space.xxl}px ${THEME.space.xxl}px;
  box-shadow: ${THEME.shadow.panel};
`
const SectionTitle = styled.div`
  font-size: ${THEME.type.sm}px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.24em;
  color: ${THEME.textTertiary};
  margin-bottom: ${THEME.space.lg}px;
  display: flex; align-items: center; gap: ${THEME.space.md}px;
  &::after { content: ''; flex: 1; height: 1px; background: ${THEME.border}; }
`
const OptionGrid = styled.div<{ $cols: number }>`
  display: grid; grid-template-columns: repeat(${p => p.$cols}, 1fr);
  gap: ${THEME.space.sm}px;
`
const OptionBtn = styled.button<{ $selected: boolean; $accent: string }>`
  background: ${p => p.$selected ? `${p.$accent}1f` : 'transparent'};
  border: 1px solid ${p => p.$selected ? p.$accent : THEME.border};
  color: ${p => p.$selected ? p.$accent : THEME.textSecondary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.base}px; font-weight: 600;
  padding: ${THEME.space.md}px ${THEME.space.sm}px;
  cursor: pointer; border-radius: ${THEME.radius.sm}px;
  letter-spacing: 0.06em; text-align: center;
  text-transform: capitalize;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  box-shadow: ${p => p.$selected ? `0 0 14px ${p.$accent}33` : 'none'};
  &:hover {
    border-color: ${p => p.$accent};
    color: ${p => p.$accent};
    transform: translateY(-1px);
  }
`
const Hint = styled.div`
  font-size: ${THEME.type.base}px;
  color: ${THEME.textTertiary};
  line-height: 1.7;
  font-style: italic;
  margin-top: ${THEME.space.md}px;
`
const PrimaryBtn = styled.button`
  background: ${THEME.amber};
  border: none; border-radius: ${THEME.radius.sm}px;
  color: ${THEME.textInverse};
  font-family: ${THEME.font};
  font-size: ${THEME.type.md}px; font-weight: 700;
  padding: ${THEME.space.lg}px;
  cursor: pointer;
  letter-spacing: 0.1em; text-transform: uppercase;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  box-shadow: 0 0 18px ${THEME.amberGlow};
  &:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 0 26px ${THEME.amberGlow}; }
  &:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }
`
const SignOutBtn = styled.button`
  background: transparent;
  border: 1px solid ${THEME.border};
  border-radius: ${THEME.radius.sm}px;
  color: ${THEME.textTertiary};
  font-family: ${THEME.font};
  font-size: ${THEME.type.base}px; font-weight: 600;
  padding: ${THEME.space.md}px;
  cursor: pointer;
  transition: all ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:hover { border-color: ${THEME.textSecondary}; color: ${THEME.textSecondary}; }
`

// ─── Profile options ──────────────────────────────────────────────────────────

type World       = CaretakerProfile['world']
type Evolution   = CaretakerProfile['evolution']
type Focus       = CaretakerProfile['focus']
type Expectation = CaretakerProfile['expectation']
type Visibility  = CaretakerProfile['visibility']

// Hints describe the *mechanical* effect, not the mood — every line names
// something the simulation actually does differently.
const WORLD_HINTS: Record<World, string> = {
  fertile: 'food regrows fast, droughts brief, weather mild, disease rare — survival eases, evolution slows',
  varied:  'baseline ; standard regrowth, droughts, weather, disease pressure',
  scarce:  'food slow, droughts long, weather severe, disease elevated — evolution accelerates under pressure',
}
const EVOLUTION_HINTS: Record<Evolution, string> = {
  fast:  'mutation 18%, morphology drifts hard, adaptations inherit easily ; lineages diverge fast',
  drift: 'mutation 10%, balanced morphology drift ; the middle path',
  slow:  'mutation 4%, morphology stable, adaptations rarely inherited ; deliberate stasis',
}
const FOCUS_HINTS: Record<Focus, string> = {
  bonds:     'bonds form 45% faster, tribes coalesce easier ; sentience growth slows (creatures focus outward)',
  survival:  'natural enrichment 35% denser ; bonds form 15% slower ; sentience slower',
  awareness: 'sentience 40% faster, colony speaks 25% more often ; bonds 10% slower',
}
const VISIBILITY_HINTS: Record<Visibility, string> = {
  attentive: 'caretaker_contact registers at 50% wider reach ; awareness messages 20% more frequent',
  neutral:   'creatures notice you at normal range ; balanced messaging',
  hidden:    'caretaker_contact reach halved ; awareness messages 20% slower ; the colony has more autonomy',
}
const EXPECTATION_HINTS: Record<Expectation, string> = {
  persistence: 'no narrative bias ; new lineages start neutral, fracture takes its natural time',
  adaptation:  'adaptations inherit 25% better, mutation +20% boost, new lineages mildly ally ; resilience-tilted',
  fracture:    'new lineage pairs start mildly hostile, conflict fractures 35% sooner ; more, smaller tribes',
}

const WORLD_COLORS:     Record<World,       string> = { fertile: THEME.alive, varied: THEME.amber, scarce: THEME.threat }
const EVOLUTION_COLORS: Record<Evolution,   string> = { fast: THEME.threat, drift: THEME.amber, slow: THEME.water }
const FOCUS_COLORS:     Record<Focus,       string> = { bonds: '#c878f0', survival: THEME.alive, awareness: THEME.water }
const VISIBILITY_COLORS: Record<Visibility, string> = { attentive: '#f0a8f0', neutral: THEME.amber, hidden: '#6a9a8a' }
const EXPECT_COLORS:    Record<Expectation, string> = { persistence: THEME.amber, adaptation: THEME.alive, fracture: THEME.death }

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { onComplete: (p: CaretakerProfile) => void }

export function ProfileScreen({ onComplete }: Props) {
  const clearUser = useLaietStore(s => s.clearUser)

  // Every setting starts at its neutral middle so the player can see which
  // choice they're changing from. The Presence axis was removed — caretaker
  // actions are unlimited and balanced by the actionLoad pressure curve.
  const [world,       setWorld]       = useState<World>('varied')
  const [evolution,   setEvolution]   = useState<Evolution>('drift')
  const [focus,       setFocus]       = useState<Focus>('survival')
  const [expectation, setExpectation] = useState<Expectation>('persistence')
  const [visibility,  setVisibility]  = useState<Visibility>('neutral')

  const handleSubmit = () => {
    const profile: CaretakerProfile = { world, evolution, focus, expectation, visibility }
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

          {/* Evolution speed — now 3 options */}
          <Section>
            <SectionTitle>Mutation Rate</SectionTitle>
            <OptionGrid $cols={3}>
              {(['fast','drift','slow'] as Evolution[]).map(e => (
                <OptionBtn key={e} $selected={evolution === e} $accent={EVOLUTION_COLORS[e]}
                  onClick={() => setEvolution(e)}>
                  {e}
                </OptionBtn>
              ))}
            </OptionGrid>
            <Hint>{EVOLUTION_HINTS[evolution]}</Hint>
          </Section>

          {/* Expectation — now 3 options */}
          <Section>
            <SectionTitle>Expectation</SectionTitle>
            <OptionGrid $cols={3}>
              {(['persistence','adaptation','fracture'] as Expectation[]).map(e => (
                <OptionBtn key={e} $selected={expectation === e} $accent={EXPECT_COLORS[e]}
                  onClick={() => setExpectation(e)}>
                  {e}
                </OptionBtn>
              ))}
            </OptionGrid>
            <Hint>{EXPECTATION_HINTS[expectation]}</Hint>
          </Section>
        </FormColumn>

        <FormColumn>
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
