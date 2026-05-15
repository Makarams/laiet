import styled from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { ROLE_LABELS } from '@/engine/speech'
import { CreatureState } from '@/types'
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
  padding: 14px 16px; font-family: ${THEME.font}; font-size: 13px; color: ${THEME.textPrimary};
  flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column;
  box-sizing:border-box;
  &::-webkit-scrollbar { width:4px; }
  &::-webkit-scrollbar-thumb { background:${THEME.borderMid}; border-radius:2px; }
`
const PanelHeader = styled.div`
  display:flex; justify-content:space-between; align-items:baseline;
  padding-bottom:8px; margin-bottom:12px; border-bottom:2px solid ${THEME.border};
`
const PanelTitle = styled.div`
  font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.2em;
  color:${THEME.textSecondary}; display:flex; align-items:center; gap:6px;
`
const ActiveDot = styled.span`width:6px;height:6px;border-radius:50%;background:${THEME.amber};display:inline-block;`
const PanelTag = styled.div`font-size:10px;font-weight:600;color:${THEME.textTertiary};letter-spacing:0.1em;`
const Section = styled.div`margin-top:14px;`
const SectionTitle = styled.div`
  font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.22em;
  color:${THEME.textTertiary}; margin-bottom:8px; display:flex; align-items:center; gap:6px;
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
  font-size:22px; font-weight:700; color:${p => p.$color};
  margin-bottom:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
`
const IdLine = styled.div`
  font-size:11px; font-weight:500; color:${THEME.textTertiary}; letter-spacing:0.05em;
`
const StateLine = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  margin-top:6px; margin-bottom:4px;
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
const RoleBadge = styled.span`
  font-size:10px; font-weight:700; padding:3px 9px; border-radius:4px;
  background:${THEME.amber}15; border:1px solid ${THEME.amber}55; color:${THEME.amber};
  letter-spacing:0.04em;
`

// ─── Stat bars ────────────────────────────────────────────────────────────────

const StatRow = styled.div`display:flex;align-items:center;gap:7px;margin-bottom:5px;`
const StatLabel = styled.span`
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;
  color:${THEME.textTertiary};width:66px;flex-shrink:0;
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

  // ── Empty / dead state ────────────────────────────────────────────────────
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
        <Empty>
          {selectedId ? 'Subject deceased · record closed' : 'No subject selected'}
          <br />click a specimen to open record
        </Empty>
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

  // ── Derived values ────────────────────────────────────────────────────────
  const color = creatureColor(creature.genome.body)

  const parentA = creature.parentIds[0] ? (gameState?.creatures[creature.parentIds[0]] ?? null) : null
  const parentB = creature.parentIds[1] ? (gameState?.creatures[creature.parentIds[1]] ?? null) : null
  const isProgenitor = !creature.parentIds[0] && !creature.parentIds[1]

  const aliveBonds = creature.bonds.filter(b => gameState?.creatures[b.targetId]?.diedOnDay === null)
  const topBonds   = [...aliveBonds].sort((a, b) => b.strength - a.strength).slice(0, 4)

  return (
    <Panel>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <PanelHeader>
        <PanelTitle><ActiveDot />Field Record</PanelTitle>
        <PanelTag>SBJ-{creature.id.slice(0,4).toUpperCase()}</PanelTag>
      </PanelHeader>

      {/* ── Identity ────────────────────────────────────────────────────── */}
      <CreatureName $color={color}>{creature.name} {creature.familyName}</CreatureName>
      <IdLine>Gen {creature.generation} · age {creature.age}d / {creature.maxAge}d</IdLine>
      <StateLine>
        <StateLabel>Activity</StateLabel>
        <StateValue>{STATE_LABELS[creature.state] ?? creature.state}</StateValue>
      </StateLine>

      {/* ── Lineage ─────────────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Lineage</SectionTitle>
        {isProgenitor ? (
          <div style={{ fontSize:11, color:THEME.textTertiary, fontStyle:'italic', padding:'3px 0' }}>
            progenitor · world seed
          </div>
        ) : (
          <>
            {([parentA, parentB] as const).map((parent, idx) => {
              if (!parent) return null
              const pColor = creatureColor(parent.genome.body)
              const dead   = parent.diedOnDay !== null
              return (
                <Row key={idx}>
                  <Label>{idx === 0 ? 'Parent A' : 'Parent B'}</Label>
                  <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
                    <Value $color={dead ? THEME.textTertiary : pColor}>
                      {parent.name} {parent.familyName}
                    </Value>
                    <span style={{ fontSize:9, color:THEME.textTertiary, letterSpacing:'0.05em' }}>
                      g{parent.generation}{dead ? ' †' : ''}
                    </span>
                  </div>
                </Row>
              )
            })}
            {parentA && !parentB && (
              <div style={{ fontSize:10, color:THEME.textTertiary, fontStyle:'italic', padding:'2px 0' }}>
                single-parent division
              </div>
            )}
          </>
        )}
      </Section>

      {/* ── Biology ─────────────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Biology</SectionTitle>
        <TraitRow>
          <TraitBadge $color={color}>{creature.genome.personality}</TraitBadge>
          <TraitBadge $color={THEME.shell}>{creature.genome.body}</TraitBadge>
          <TraitBadge $color="#c878f0">{creature.genome.mind}</TraitBadge>
          {creature.genome.race && (
            <TraitBadge $color="#8060c0">{creature.genome.race}</TraitBadge>
          )}
        </TraitRow>
        {creature.role && (
          <div style={{ display:'flex', alignItems:'center', gap:6, margin:'5px 0 2px' }}>
            <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em', color:THEME.textTertiary, flexShrink:0 }}>Role</span>
            <RoleBadge>{ROLE_LABELS[creature.role]}</RoleBadge>
          </div>
        )}
        {creature.recentMutation !== undefined
          && creature.mutatedTraits
          && creature.mutatedTraits.length > 0 && (
          <div style={{ marginTop:6, padding:'3px 8px',
            background:'rgba(100,181,246,0.08)', border:`1px solid ${THEME.water}44`,
            borderRadius:4, fontSize:10, color:THEME.water, letterSpacing:'0.1em', fontWeight:600 }}>
            ⚡ mutated: {creature.mutatedTraits.join(', ')}
          </div>
        )}
      </Section>

      {/* ── Vitals ──────────────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Vitals</SectionTitle>
        {caretaker && caretaker.healCharges > 0 && creature.health < 50 && (
          <HealBtn onClick={() => healCreature(creature.id)}>
            Heal · {caretaker.healCharges} charge{caretaker.healCharges !== 1 ? 's' : ''} left
          </HealBtn>
        )}
        <StatBarRow label="Health"    value={creature.health}
          barColor={creature.health < 30 ? THEME.threat : creature.health < 60 ? THEME.amber : THEME.alive}
          accent={creature.health < 30 ? THEME.threat : undefined} />
        <StatBarRow label="Hunger"    value={creature.hunger}
          barColor={creature.hunger > 70 ? THEME.threat : THEME.amber}
          accent={creature.hunger > 70 ? THEME.threat : undefined} />
        <StatBarRow label="Thirst"    value={creature.thirst}
          barColor={creature.thirst > 70 ? THEME.water : `${THEME.water}66`}
          accent={creature.thirst > 70 ? THEME.water : undefined} />
        <StatBarRow label="Warmth"    value={creature.warmth}
          barColor={creature.warmth < 25 ? THEME.water : '#c49840'}
          accent={creature.warmth < 25 ? THEME.water : undefined} />
        <StatBarRow label="Stress"    value={creature.stress}
          barColor={creature.stress > 70 ? THEME.death : THEME.borderMid}
          accent={creature.stress > 70 ? THEME.death : undefined} />
        <StatBarRow label="Sentience" value={creature.sentience}
          barColor="#c878f044" accent="#c878f0" />
      </Section>

      {/* ── Bonds ───────────────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Bonds · {aliveBonds.length}</SectionTitle>
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
          )
        }
      </Section>

      {/* ── Record ──────────────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Record</SectionTitle>
        <Row><Label>Offspring</Label><Value $color={THEME.alive}>{creature.offspringIds.length}</Value></Row>
        <Row>
          <Label>Kills</Label>
          <Value $color={creature.killCount > 0 ? THEME.death : undefined}>{creature.killCount}</Value>
        </Row>
        <Row><Label>Transmissions</Label><Value>{creature.messagesSent}</Value></Row>
      </Section>

    </Panel>
  )
}
