import styled from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { describeGenome } from '@/engine/genetics'
import { Creature, CreatureState } from '@/types'
import { THEME, creatureColor } from '@/ui/theme'

const STATE_LABELS: Record<CreatureState, string> = {
  idle:'inactive', wandering:'wandering', seeking_food:'foraging',
  seeking_water:'seeking water', seeking_shelter:'seeking shelter',
  seeking_warmth:'seeking warmth', bonding:'pair-seeking', fighting:'in conflict',
  fleeing:'fleeing', reproducing:'reproducing', mourning:'mourning',
  observing:'boundary survey', dreaming:'memory-returning', sick:'compromised',
  migrating:'migrating', scavenging:'scavenging', dying:'critical',
  playing:'play behaviour', using_enrichment:'using enrichment',
  seeking_healroot:'seeking remedy', grooming:'grooming',
}

const Panel = styled.div`
  background: ${THEME.bgPanel}; border: 2px solid ${THEME.border}; border-radius: 6px;
  padding: 12px 14px; font-family: ${THEME.font}; font-size: 13px; color: ${THEME.textPrimary};
  flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column;
  box-sizing:border-box;
  &::-webkit-scrollbar { width:4px; }
  &::-webkit-scrollbar-thumb { background:${THEME.borderMid}; border-radius:2px; }
`
const PanelHeader = styled.div`
  display:flex; justify-content:space-between; align-items:baseline;
  padding-bottom:8px; margin-bottom:10px; border-bottom:2px solid ${THEME.border};
`
const PanelTitle = styled.div`
  font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.2em;
  color:${THEME.textSecondary}; display:flex; align-items:center; gap:6px;
`
const ActiveDot = styled.span`width:6px;height:6px;border-radius:50%;background:${THEME.amber};display:inline-block;`
const PanelTag = styled.div`font-size:10px;font-weight:600;color:${THEME.textTertiary};letter-spacing:0.1em;`
const Section = styled.div`margin-top:10px;`
const SectionTitle = styled.div`
  font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.22em;
  color:${THEME.textTertiary}; margin-bottom:7px; display:flex; align-items:center; gap:6px;
  &::after { content:''; flex:1; height:1px; background:${THEME.border}; }
`
const Row = styled.div`
  display:flex; justify-content:space-between; align-items:center; padding:3px 0; line-height:1.5;
`
const Label = styled.span`font-size:12px;font-weight:500;color:${THEME.textSecondary};`
const Value = styled.span<{ $color?: string }>`
  font-size:13px; font-weight:700; color:${p => p.$color ?? THEME.textPrimary};
`

// ─── Creature name & identity ─────────────────────────────────────────────────

const CreatureName = styled.div<{ $color: string }>`
  font-size:18px; font-weight:700; color:${p => p.$color};
  margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
`
const IdLine = styled.div`
  font-size:11px; font-weight:500; color:${THEME.textTertiary}; letter-spacing:0.05em; margin-bottom:4px;
`
const StateLine = styled.div`
  display:flex; align-items:center; justify-content:space-between; margin-top:3px;
`
const StateLabel = styled.span`font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:${THEME.textTertiary};`
const StateValue = styled.span`font-size:11px;font-weight:600;color:${THEME.alive};`

// ─── Trait badges ─────────────────────────────────────────────────────────────

const TraitRow = styled.div`display:flex;gap:5px;flex-wrap:wrap;margin-bottom:5px;`
const TraitBadge = styled.span<{ $color: string }>`
  font-size:10px; font-weight:700; padding:3px 9px; border-radius:4px;
  background:${p => p.$color}18; border:1px solid ${p => p.$color}44; color:${p => p.$color};
  text-transform:uppercase; letter-spacing:0.06em;
`

// ─── Stat bars ────────────────────────────────────────────────────────────────

const StatRow = styled.div`display:flex;align-items:center;gap:7px;margin-bottom:5px;`
const StatLabel = styled.span`
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;
  color:${THEME.textTertiary};width:52px;flex-shrink:0;
`
const BarTrack = styled.div`flex:1;height:4px;background:${THEME.bgDeep};border-radius:2px;overflow:hidden;`
const BarFill = styled.div<{ $w: number; $color: string }>`
  width:${p => Math.min(100,Math.max(0,p.$w))}%;height:100%;background:${p => p.$color};border-radius:2px;
`
const StatValue = styled.span<{ $accent?: string }>`
  font-size:11px;font-weight:700;color:${p => p.$accent ?? THEME.textSecondary};width:32px;text-align:right;
`

// ─── Bonds ────────────────────────────────────────────────────────────────────

const BondList = styled.div`display:flex;flex-direction:column;gap:4px;`
const BondRow = styled.div`display:flex;align-items:center;gap:7px;`
const BondName = styled.span`font-size:12px;font-weight:600;color:${THEME.textPrimary};width:70px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`
const BondBar = styled.div`flex:1;height:4px;background:${THEME.bgDeep};border-radius:2px;overflow:hidden;`
const BondFill = styled.div<{ $pct: number; $strength: number }>`
  width:${p => Math.min(100,p.$pct)}%;height:100%;
  background:${p => p.$strength > 70 ? THEME.water : p.$strength > 40 ? '#a870c0' : THEME.borderMid};
`
const BondStrength = styled.span<{ $strength: number }>`
  font-size:10px;font-weight:700;
  color:${p => p.$strength > 70 ? THEME.water : p.$strength > 40 ? '#a870c0' : THEME.textTertiary};
  width:24px;text-align:right;
`

// ─── Morphology ───────────────────────────────────────────────────────────────

const MorphRow = styled.div`display:flex;align-items:center;gap:7px;margin:3px 0;`
const MorphLabel = styled.span`font-size:10px;font-weight:600;color:${THEME.textTertiary};width:50px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.1em;`
const MorphTrack = styled.div`flex:1;height:4px;background:${THEME.bgDeep};border-radius:2px;overflow:hidden;`
const MorphFill = styled.div<{ $w: number }>`
  width:${p => Math.max(1,Math.min(100,p.$w))}%;height:100%;
  background:linear-gradient(90deg,${THEME.water}88,${THEME.water});
`
const MorphValue = styled.span`font-size:10px;color:${THEME.textTertiary};width:28px;text-align:right;`

// ─── Monologue ────────────────────────────────────────────────────────────────

const Monologue = styled.div`
  margin-top:12px; padding:10px 14px 10px 16px;
  background:rgba(100,181,246,0.05);
  border-left:2px solid ${THEME.water}44;
  font-style:italic; color:${THEME.textSecondary};
  font-size:12px; line-height:1.7; border-radius:0 4px 4px 0;
`

// ─── Heal button ──────────────────────────────────────────────────────────────

const HealBtn = styled.button`
  background:rgba(120,200,120,0.10); border:1px solid #3a6a3a; color:${THEME.alive};
  font-family:${THEME.font}; font-size:11px; font-weight:700;
  padding:7px 12px; cursor:pointer; border-radius:4px; margin-bottom:6px; width:100%;
  letter-spacing:0.06em; transition:all 0.12s;
  &:hover { background:rgba(120,200,120,0.18); border-color:${THEME.alive}; }
`

const Empty = styled.div`
  color:${THEME.textTertiary}; font-size:12px; text-align:center;
  margin-top:1.5rem; line-height:2; font-style:italic;
`

// ─── Monologue text generator ─────────────────────────────────────────────────

function generateMonologue(c: Creature): string {
  if (c.state === 'mourning')   return `${c.name} is stationary. social group recently reduced.`
  if (c.state === 'sick')       return `${c.name} showing reduced mobility. temperature regulation failing.`
  if (c.state === 'fighting')   return `${c.name} in resource conflict. outcome undetermined.`
  if (c.state === 'dreaming')   return `${c.name} has returned to a prior location. standing still.`
  if (c.state === 'observing')  return `${c.name} at boundary edge. repeated passes. no apparent need.`
  if (c.genome.mind === 'Sentinel' && c.sentience > 50)
    return `${c.name} has logged more boundary passes than any other subject this cycle.`
  if (c.genome.mind === 'Dreaming')
    return `${c.name} moves toward sites the colony has already used. pattern unclear.`
  if (c.hunger > 70)  return `${c.name} at hunger threshold. no food source located within range.`
  if (c.thirst > 75)  return `${c.name} at thirst threshold. moving toward water.`
  if (c.warmth < 25)  return `${c.name} below warmth threshold. seeking shelter.`
  if (c.stress > 70)  return `${c.name} elevated stress. no external threat identified.`
  if (c.bonds.length > 2) return `${c.name} remaining proximate to known social contacts.`
  const idle = [
    `${c.name} is stationary. no active drive.`,
    `${c.name} moving without apparent objective.`,
    `${c.name} at rest. all thresholds within normal range.`,
    `no notable activity from ${c.name} this cycle.`,
  ]
  return idle[Math.floor(Math.random() * idle.length)]
}

// ─── Stat bar helper ──────────────────────────────────────────────────────────

function StatBarRow({ label, value, barColor, accent }:
  { label:string; value:number; barColor:string; accent?:string }) {
  return (
    <StatRow>
      <StatLabel>{label}</StatLabel>
      <BarTrack><BarFill $w={value} $color={barColor} /></BarTrack>
      <StatValue $accent={accent}>{Math.round(value)}%</StatValue>
    </StatRow>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DossierPanel() {
  const gameState    = useLaietStore(s => s.gameState)
  const selectedId   = useLaietStore(s => s.selectedCreatureId)
  const healCreature = useLaietStore(s => s.healCreature)

  const creature  = selectedId ? gameState?.creatures[selectedId] : null
  const caretaker = gameState?.caretaker

  if (!creature || creature.diedOnDay !== null) {
    const alive = gameState ? Object.values(gameState.creatures).filter(c => c.diedOnDay === null) : []
    const maxGen = alive.length > 0 ? Math.max(...alive.map(c => c.generation)) : 0
    const avgSentience = alive.length > 0
      ? Math.round(alive.reduce((s,c) => s + c.sentience, 0) / alive.length) : 0

    return (
      <Panel>
        <PanelHeader>
          <PanelTitle><ActiveDot />Field Record</PanelTitle>
          <PanelTag>SBJ ···</PanelTag>
        </PanelHeader>
        <Empty>{selectedId ? 'Subject deceased ; record closed' : 'No subject selected'}<br />click a specimen to open record</Empty>
        {alive.length > 0 && (
          <Section style={{ marginTop:'1.5rem' }}>
            <SectionTitle>Colony</SectionTitle>
            <Row><Label>Alive</Label><Value $color={THEME.alive}>{alive.length}</Value></Row>
            <Row><Label>Max generation</Label><Value $color={THEME.amber}>{maxGen}</Value></Row>
            <Row><Label>Avg sentience</Label><Value $color="#c878f0">{avgSentience}%</Value></Row>
            <Row>
              <Label>Bonded pairs</Label>
              <Value>{Math.floor(alive.filter(c => c.bonds.some(b => b.strength >= 42)).length / 2)}</Value>
            </Row>
          </Section>
        )}
      </Panel>
    )
  }

  const color = creatureColor(creature.genome.body)
  const topBonds = [...creature.bonds]
    .filter(b => gameState?.creatures[b.targetId]?.diedOnDay === null)
    .sort((a,b) => b.strength - a.strength)
    .slice(0, 4)

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle><ActiveDot />Field Record</PanelTitle>
        <PanelTag>SBJ-{creature.id.slice(0,4).toUpperCase()}</PanelTag>
      </PanelHeader>

      <CreatureName $color={color}>{creature.name} {creature.familyName}</CreatureName>
      <IdLine>Gen {creature.generation} · Age {creature.age}d / {creature.maxAge}d · ({creature.x},{creature.y})</IdLine>
      <StateLine>
        <StateLabel>Activity</StateLabel>
        <StateValue>{STATE_LABELS[creature.state] ?? creature.state}</StateValue>
      </StateLine>

      <Section>
        <SectionTitle>Biology</SectionTitle>
        <TraitRow>
          <TraitBadge $color={color}>{creature.genome.personality}</TraitBadge>
          <TraitBadge $color={THEME.shell}>{creature.genome.body}</TraitBadge>
          <TraitBadge $color="#c878f0">{creature.genome.mind}</TraitBadge>
        </TraitRow>
        {creature.recentMutation !== undefined && creature.mutatedTraits && creature.mutatedTraits.length > 0 && (
          <div style={{ marginTop:5, padding:'3px 8px',
            background:'rgba(100,181,246,0.08)', border:`1px solid ${THEME.water}44`,
            borderRadius:4, fontSize:10, color:THEME.water, letterSpacing:'0.1em', fontWeight:600 }}>
            ⚡ mutated: {creature.mutatedTraits.join(', ')}
          </div>
        )}
        <div style={{ color:THEME.textTertiary, fontSize:10, lineHeight:1.6, marginTop:4 }}>
          {describeGenome(creature.genome)}
        </div>
      </Section>

      <Section>
        <SectionTitle>Vitals</SectionTitle>
        {caretaker && caretaker.healCharges > 0 && creature.health < 80 && (
          <HealBtn onClick={() => healCreature(creature.id)}>
            Heal ; {caretaker.healCharges} charge{caretaker.healCharges !== 1 ? 's' : ''} left
          </HealBtn>
        )}
        <StatBarRow label="Health"   value={creature.health}
          barColor={creature.health < 30 ? THEME.threat : creature.health < 60 ? THEME.amber : THEME.alive}
          accent={creature.health < 30 ? THEME.threat : undefined} />
        <StatBarRow label="Hunger"   value={creature.hunger}
          barColor={creature.hunger > 70 ? THEME.threat : THEME.amber}
          accent={creature.hunger > 70 ? THEME.threat : undefined} />
        <StatBarRow label="Thirst"   value={creature.thirst}
          barColor={creature.thirst > 70 ? THEME.water : `${THEME.water}66`}
          accent={creature.thirst > 70 ? THEME.water : undefined} />
        <StatBarRow label="Warmth"   value={creature.warmth}
          barColor={creature.warmth < 25 ? THEME.water : '#c49840'}
          accent={creature.warmth < 25 ? THEME.water : undefined} />
        <StatBarRow label="Stress"   value={creature.stress}
          barColor={creature.stress > 70 ? THEME.death : THEME.borderMid}
          accent={creature.stress > 70 ? THEME.death : undefined} />
        <StatBarRow label="Sentience" value={creature.sentience}
          barColor="#c878f044" accent="#c878f0" />
      </Section>

      <Section>
        <SectionTitle>Bonds · {creature.bonds.length}</SectionTitle>
        {topBonds.length === 0
          ? <div style={{ fontSize:11, color:THEME.textTertiary, fontStyle:'italic', padding:'3px 0' }}>no recorded bonds</div>
          : (
            <BondList>
              {topBonds.map(b => {
                const other = gameState!.creatures[b.targetId]
                return (
                  <BondRow key={b.targetId}>
                    <BondName>{other.name}</BondName>
                    <BondBar><BondFill $pct={b.strength} $strength={b.strength} /></BondBar>
                    <BondStrength $strength={b.strength}>{Math.round(b.strength)}</BondStrength>
                  </BondRow>
                )
              })}
            </BondList>
          )}
      </Section>

      <Section>
        <SectionTitle>Descent</SectionTitle>
        <Row><Label>Offspring</Label><Value $color={THEME.alive}>{creature.offspringIds.length}</Value></Row>
        <Row><Label>Transmissions</Label><Value>{creature.messagesSent}</Value></Row>
        <Row><Label>Kills</Label>
          <Value $color={creature.killCount > 0 ? THEME.death : undefined}>{creature.killCount}</Value>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Form</SectionTitle>
        {(() => {
          const m = creature.genome.morphology ?? { sizeScale:1.0, limbLength:0, spinalLength:0, colorDrift:0, eyeSize:1.0 }
          return (
            <>
              <MorphRow><MorphLabel>Size</MorphLabel><MorphTrack><MorphFill $w={((m.sizeScale-0.7)/0.8)*100}/></MorphTrack><MorphValue>{m.sizeScale.toFixed(2)}</MorphValue></MorphRow>
              <MorphRow><MorphLabel>Limbs</MorphLabel><MorphTrack><MorphFill $w={m.limbLength*100}/></MorphTrack><MorphValue>{m.limbLength.toFixed(2)}</MorphValue></MorphRow>
              <MorphRow><MorphLabel>Spine</MorphLabel><MorphTrack><MorphFill $w={m.spinalLength*100}/></MorphTrack><MorphValue>{m.spinalLength.toFixed(2)}</MorphValue></MorphRow>
              <MorphRow><MorphLabel>Eyes</MorphLabel><MorphTrack><MorphFill $w={((m.eyeSize-0.7)/0.8)*100}/></MorphTrack><MorphValue>{m.eyeSize.toFixed(2)}</MorphValue></MorphRow>
            </>
          )
        })()}
      </Section>

      <Monologue>{generateMonologue(creature)}</Monologue>
    </Panel>
  )
}
