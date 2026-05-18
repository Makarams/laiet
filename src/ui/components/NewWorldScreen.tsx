import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { CaretakerProfile } from '@/types'
import { unlockAudio } from '@/audio/unlock'
import { THEME } from '@/ui/theme'

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`

const Screen = styled.div`
  height:100vh; height:100dvh;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:
    radial-gradient(900px 600px at 50% 30%, ${THEME.amberDim} 0%, transparent 60%),
    ${THEME.bg};
  font-family:${THEME.font};
  color:${THEME.textPrimary};
  padding:1.25rem; box-sizing:border-box; width:100%; overflow:hidden;
  @media(max-height:640px){justify-content:flex-start;padding-top:1rem;overflow-y:auto;}
`
const Cabinet = styled.div`
  width:min(580px,100%); display:flex; flex-direction:column;
  animation:${fadeUp} 0.4s ${THEME.motion.easeOut} both;
`
const Header = styled.div`
  display:flex; flex-direction:column; align-items:center;
  gap:${THEME.space.xs}px;
  margin-bottom:${THEME.space.lg}px;
`
const Logo = styled.div`
  font-size:clamp(16px, 3.5vw, ${THEME.type.xxl}px);
  font-weight:700; color:${THEME.textPrimary};
  letter-spacing:0.10em;
  text-shadow: 0 0 18px ${THEME.amberGlow};
`
const LogoAccent = styled.span`color:${THEME.amber};`
const Eyebrow = styled.div`
  font-size:${THEME.type.xs}px; font-weight:700;
  text-transform:uppercase; letter-spacing:0.32em;
  color:${THEME.textTertiary};
`
const Prose = styled.div`
  font-size:${THEME.type.md}px;
  color:${THEME.textSecondary};
  text-align:center; line-height:1.8;
  font-style:italic;
  padding:${THEME.space.lg}px 0;
  border-top:1px solid ${THEME.border};
  border-bottom:1px solid ${THEME.border};
  margin-bottom:${THEME.space.lg}px;
`
const Form = styled.div`
  background:${THEME.panelGradient};
  border:1px solid ${THEME.borderMid};
  border-radius:${THEME.radius.lg}px;
  overflow:hidden;
  box-shadow:${THEME.shadow.panel};
`
const Grid = styled.div`display:grid; grid-template-columns:1fr 1fr; gap:0;`
const Cell = styled.div<{ $pos:'tl'|'tr'|'bl'|'br' }>`
  padding:${THEME.space.lg}px ${THEME.space.xl}px;
  display:flex; flex-direction:column; gap:${THEME.space.md}px;
  border-right:${p => (p.$pos==='tl'||p.$pos==='bl') ? `1px solid ${THEME.border}` : 'none'};
  border-bottom:${p => (p.$pos==='tl'||p.$pos==='tr') ? `1px solid ${THEME.border}` : 'none'};
`
const CellTop = styled.div`display:flex; align-items:center; gap:${THEME.space.sm}px;`
const TypeBadge = styled.span<{ $color: string }>`
  font-size:${THEME.type.xs}px; font-weight:700;
  padding:2px 8px; border-radius:${THEME.radius.xs}px;
  letter-spacing:0.12em; text-transform:uppercase;
  background:${p => p.$color}1c;
  border:1px solid ${p => p.$color}55;
  color:${p => p.$color};
  box-shadow:0 0 8px ${p => p.$color}33;
`
const CellId = styled.span`
  font-size:${THEME.type.sm}px; font-weight:600;
  color:${THEME.textTertiary};
`
const RequiredDot = styled.span`
  width:6px;height:6px;border-radius:50%;
  background:${THEME.amber};
  box-shadow:0 0 6px ${THEME.amberGlow};
  margin-left:auto;
`
const FieldRow = styled.div`display:flex;flex-direction:column;gap:${THEME.space.xs}px;`
const FieldLabel = styled.label`
  font-size:${THEME.type.xs}px; font-weight:700;
  text-transform:uppercase; letter-spacing:0.22em;
  color:${THEME.textTertiary};
`
const Input = styled.input`
  background:${THEME.bgDeep};
  border:1px solid ${THEME.border};
  border-radius:${THEME.radius.xs}px;
  color:${THEME.textPrimary};
  font-family:${THEME.font};
  font-size:${THEME.type.md}px; font-weight:500;
  padding:${THEME.space.sm}px ${THEME.space.md}px;
  outline:none; width:100%; box-sizing:border-box;
  transition: border-color ${THEME.motion.fast} ${THEME.motion.easeOut},
              box-shadow ${THEME.motion.fast} ${THEME.motion.easeOut};
  &:focus {
    border-color:${THEME.amber};
    box-shadow: 0 0 0 3px ${THEME.amberDim};
  }
  &::placeholder { color:${THEME.textTertiary}; }
`
const Footer = styled.div`
  padding:${THEME.space.lg}px ${THEME.space.xl}px;
  border-top:1px solid ${THEME.border};
  display:flex; align-items:center; gap:${THEME.space.lg}px;
`
const FooterNote = styled.div`
  font-size:${THEME.type.sm}px; font-weight:500;
  color:${THEME.textTertiary};
  line-height:1.7; flex:1;
`
const BeginBtn = styled.button`
  background:${THEME.amber};
  border:none; border-radius:${THEME.radius.sm}px;
  color:${THEME.textInverse};
  font-family:${THEME.font};
  font-size:${THEME.type.md}px; font-weight:700;
  padding:${THEME.space.md}px ${THEME.space.xxl}px;
  cursor:pointer;
  letter-spacing:0.08em; text-transform:uppercase;
  white-space:nowrap; flex-shrink:0;
  transition: opacity ${THEME.motion.fast} ${THEME.motion.easeOut},
              transform ${THEME.motion.fast} ${THEME.motion.easeOut},
              box-shadow ${THEME.motion.fast} ${THEME.motion.easeOut};
  box-shadow: 0 0 18px ${THEME.amberGlow};
  &:hover:not(:disabled) { opacity:0.92; transform: translateY(-1px); box-shadow: 0 0 26px ${THEME.amberGlow}; }
  &:disabled { opacity:0.3; cursor:not-allowed; transform: none; box-shadow: none; }
`

const BODY_LABELS   = ['Spore','Shell','Spike','Wisp'] as const
const BODY_COLORS   = [THEME.spore, THEME.shell, THEME.spike, THEME.wisp]
const CELL_POS      = ['tl','tr','bl','br'] as const

interface NamePair { name:string; familyName:string }
interface NewWorldScreenProps { profile:CaretakerProfile; onWorldCreated:()=>void }

export function NewWorldScreen({ profile, onWorldCreated }: NewWorldScreenProps) {
  const userId       = useLaietStore(s => s.userId)
  const initNewWorld = useLaietStore(s => s.initNewWorld)
  const [pairs, setPairs] = useState<NamePair[]>([
    {name:'',familyName:''},{name:'',familyName:''},{name:'',familyName:''},{name:'',familyName:''},
  ])

  const update = (i:number, field:'name'|'familyName', val:string) => {
    setPairs(prev => prev.map((p,idx) => idx===i ? {...p,[field]:val} : p))
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
      <Cabinet>
        <Header>
          <Logo>LA<LogoAccent>·</LogoAccent>IET</Logo>
          <Eyebrow>New Observation</Eyebrow>
        </Header>

        <Prose>
          Four subjects will be placed in the world ; one of each morphotype.<br />
          Names are recorded and inherited across generations.<br />
          Offspring carry modified versions forward.
        </Prose>

        <Form>
          <Grid>
            {pairs.map((pair,i) => (
              <Cell key={i} $pos={CELL_POS[i]}>
                <CellTop>
                  <TypeBadge $color={BODY_COLORS[i]}>{BODY_LABELS[i]}</TypeBadge>
                  <CellId>0{i+1}</CellId>
                  {i===0 && <RequiredDot title="required"/>}
                </CellTop>
                <FieldRow>
                  <FieldLabel htmlFor={`given-${i}`}>Given name</FieldLabel>
                  <Input id={`given-${i}`} placeholder=";" value={pair.name}
                    onChange={e => update(i,'name',e.target.value)} />
                </FieldRow>
                <FieldRow>
                  <FieldLabel htmlFor={`family-${i}`}>Family name</FieldLabel>
                  <Input id={`family-${i}`} placeholder=";" value={pair.familyName}
                    onChange={e => update(i,'familyName',e.target.value)} />
                </FieldRow>
              </Cell>
            ))}
          </Grid>
          <Footer>
            <FooterNote>
              Subject 01 required.<br />
              World seed: randomised.
            </FooterNote>
            <BeginBtn onClick={handleBegin} disabled={!valid}>Begin →</BeginBtn>
          </Footer>
        </Form>
      </Cabinet>
    </Screen>
  )
}
