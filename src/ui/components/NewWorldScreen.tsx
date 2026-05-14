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
  background:${THEME.bg}; font-family:${THEME.font}; color:${THEME.textPrimary};
  padding:1.25rem; box-sizing:border-box; width:100%; overflow:hidden;
  @media(max-height:640px){justify-content:flex-start;padding-top:1rem;overflow-y:auto;}
`
const Cabinet = styled.div`
  width:min(560px,100%); display:flex; flex-direction:column;
  animation:${fadeUp} 0.35s ease-out both;
`
const Header = styled.div`
  display:flex; flex-direction:column; align-items:center; gap:4px; margin-bottom:14px;
`
const Logo = styled.div`
  font-size:clamp(14px,3.5vw,20px); font-weight:700; color:${THEME.textPrimary}; letter-spacing:0.08em;
`
const LogoAccent = styled.span`color:${THEME.amber};`
const Eyebrow = styled.div`
  font-size:9px; font-weight:700; text-transform:uppercase;
  letter-spacing:0.28em; color:${THEME.textTertiary};
`
const Prose = styled.div`
  font-size:12px; color:${THEME.textSecondary}; text-align:center;
  line-height:1.7; font-style:italic; padding:11px 0 14px;
  border-top:1px solid ${THEME.border}; border-bottom:1px solid ${THEME.border}; margin-bottom:14px;
`
const Form = styled.div`
  background:#242424; border:2px solid ${THEME.border}; border-radius:8px; overflow:hidden;
`
const Grid = styled.div`display:grid; grid-template-columns:1fr 1fr; gap:0;`
const Cell = styled.div<{ $pos:'tl'|'tr'|'bl'|'br' }>`
  padding:13px 15px 15px;
  display:flex; flex-direction:column; gap:8px;
  border-right:${p => (p.$pos==='tl'||p.$pos==='bl') ? `1px solid ${THEME.border}` : 'none'};
  border-bottom:${p => (p.$pos==='tl'||p.$pos==='tr') ? `1px solid ${THEME.border}` : 'none'};
`
const CellTop = styled.div`display:flex; align-items:center; gap:7px;`
const TypeBadge = styled.span<{ $color: string }>`
  font-size:9px; font-weight:700; padding:2px 7px; border-radius:3px; letter-spacing:0.1em;
  text-transform:uppercase; background:${p => p.$color}15; border:1px solid ${p => p.$color}30;
  color:${p => p.$color};
`
const CellId = styled.span`font-size:10px;font-weight:600;color:${THEME.textTertiary};`
const RequiredDot = styled.span`
  width:5px;height:5px;border-radius:50%;background:${THEME.amber};margin-left:auto;
`
const FieldRow = styled.div`display:flex;flex-direction:column;gap:3px;`
const FieldLabel = styled.label`
  font-size:9px; font-weight:700; text-transform:uppercase;
  letter-spacing:0.2em; color:${THEME.textTertiary};
`
const Input = styled.input`
  background:${THEME.bgDeep}; border:2px solid ${THEME.border};
  border-radius:4px; color:${THEME.textPrimary};
  font-family:${THEME.font}; font-size:12px; font-weight:500;
  padding:6px 9px; outline:none; width:100%; box-sizing:border-box;
  transition:border-color 0.12s;
  &:focus { border-color:${THEME.amber}; }
  &::placeholder { color:${THEME.textTertiary}; }
`
const Footer = styled.div`
  padding:11px 16px; border-top:1px solid ${THEME.border};
  display:flex; align-items:center; gap:14px;
`
const FooterNote = styled.div`
  font-size:10px; font-weight:500; color:${THEME.textTertiary}; line-height:1.7; flex:1;
`
const BeginBtn = styled.button`
  background:${THEME.amber}; border:none; border-radius:5px;
  color:#1c1c1c; font-family:${THEME.font}; font-size:12px; font-weight:700;
  padding:10px 20px; cursor:pointer; letter-spacing:0.06em; white-space:nowrap;
  flex-shrink:0; transition:opacity 0.12s;
  &:hover:not(:disabled) { opacity:0.88; }
  &:disabled { opacity:0.3; cursor:not-allowed; }
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
