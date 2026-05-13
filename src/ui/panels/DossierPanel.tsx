import styled from 'styled-components'
import { useLaietStore } from '@/store/gameStore'
import { genomeColor, describeGenome } from '@/engine/genetics'
import { Creature, CreatureState } from '@/types'

const STATE_LABELS: Record<CreatureState, string> = {
  idle:             'resting',
  wandering:        'wandering',
  seeking_food:     'searching for food',
  seeking_water:    'searching for water',
  seeking_shelter:  'seeking shelter',
  seeking_warmth:   'seeking warmth',
  bonding:          'searching for a mate',
  fighting:         'fighting',
  fleeing:          'fleeing a threat',
  reproducing:      'reproducing',
  mourning:         'mourning a loss',
  observing:        'watching the perimeter',
  dreaming:         'dreaming',
  sick:             'ill',
  migrating:        'migrating',
  scavenging:       'scavenging',
  dying:            'dying',
  playing:          'playing',
  using_enrichment: 'using enrichment',
}

const Panel = styled.div`
  background:
    linear-gradient(180deg, rgba(20, 20, 50, 0.30), rgba(8, 8, 28, 0.88)),
    #06061a;
  border: 1px solid #2a2a50;
  border-radius: 4px;
  padding: 11px 12px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  color: #c0c8e0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-sizing: border-box;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.40), 0 0 0 1px rgba(80, 120, 200, 0.05);

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #2e2e60; border-radius: 2px; }
`

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 8px;
  margin-bottom: 9px;
  border-bottom: 1px solid #2a2a50;
`

const PanelTitle = styled.div`
  font-size: 13px;
  color: #5ec8e0;
  letter-spacing: 0.22em;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(94, 200, 224, 0.35);
`

const PanelTag = styled.div`
  font-size: 10px;
  color: #4a4a78;
  letter-spacing: 0.18em;
`

const CreatureName = styled.div<{ color: string }>`
  font-size: 17px;
  font-weight: bold;
  color: ${p => p.color};
  letter-spacing: 0.05em;
  text-shadow: 0 0 16px ${p => p.color}60;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const IdLine = styled.div`
  font-size: 10.5px;
  color: #4a4a78;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
`

const Section = styled.div`
  margin-top: 9px;
`

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: #4a7090;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin: 3px 0 6px;
  font-weight: bold;

  &::before {
    content: '';
    width: 4px;
    height: 4px;
    background: #3a6080;
    transform: rotate(45deg);
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #1a2040, transparent);
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5px 0;
`

const Label = styled.span`
  color: #7070a0;
  font-size: 11.5px;
`

const Value = styled.span<{ accent?: string }>`
  color: ${p => p.accent ?? '#c0c8e0'};
  font-size: 11.5px;
  font-weight: bold;
`

// ─── Trait badges ────────────────────────────────────────────────────────────

const TraitRow = styled.div`
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 5px;
`

const TraitBadge = styled.span<{ color: string }>`
  display: inline-block;
  background: ${p => p.color}22;
  border: 1px solid ${p => p.color}66;
  color: ${p => p.color};
  font-size: 10.5px;
  padding: 3px 9px;
  border-radius: 2px;
  letter-spacing: 0.06em;
  font-weight: bold;
`

// ─── Stat bars ───────────────────────────────────────────────────────────────

const StatRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 4px 0;
`

const StatGlyph = styled.span<{ color: string }>`
  width: 11px;
  font-size: 12px;
  color: ${p => p.color};
  flex-shrink: 0;
  text-align: center;
`

const StatLabel = styled.span`
  color: #7070a0;
  font-size: 11px;
  width: 58px;
  flex-shrink: 0;
`

const BarTrack = styled.div`
  flex: 1;
  height: 6px;
  background: #0e0e1e;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid #1e2040;
`

const BarFill = styled.div<{ width: number; color: string }>`
  width: ${p => Math.max(0, Math.min(100, p.width))}%;
  height: 100%;
  background: linear-gradient(90deg, ${p => p.color}, ${p => p.color}dd);
  transition: width 0.35s ease;
`

const StatValue = styled.span<{ accent?: string }>`
  color: ${p => p.accent ?? '#7070a0'};
  font-size: 11px;
  width: 36px;
  text-align: right;
  flex-shrink: 0;
  font-weight: bold;
`

// ─── Bond network ────────────────────────────────────────────────────────────

const BondList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
`

const BondRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
`

const BondName = styled.span`
  color: #c0c8e0;
  width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: bold;
`

const BondBar = styled.div`
  flex: 1;
  height: 4px;
  background: #0e0e1e;
  border-radius: 2px;
  overflow: hidden;
`

const BondFill = styled.div<{ percent: number; strength: number }>`
  width: ${p => Math.max(2, Math.min(100, p.percent))}%;
  height: 100%;
  background: ${p =>
    p.strength > 70 ? 'linear-gradient(90deg, #60a8d8, #3a90c0)' :
    p.strength > 40 ? 'linear-gradient(90deg, #a870c0, #8050a0)' :
    'linear-gradient(90deg, #3a70a0, #2a5888)'};
`

const BondStrength = styled.span<{ strength: number }>`
  font-size: 10.5px;
  color: ${p => p.strength > 70 ? '#60a8d8' : p.strength > 40 ? '#a870c0' : '#5888a0'};
  width: 24px;
  text-align: right;
  font-weight: bold;
`

// ─── Monologue ───────────────────────────────────────────────────────────────

const Monologue = styled.div`
  margin-top: 12px;
  padding: 10px 14px 10px 18px;
  background: linear-gradient(180deg, rgba(30, 60, 90, 0.12), rgba(6, 10, 28, 0.60));
  border-left: 2px solid #2a5878;
  font-style: italic;
  color: #9ab8cc;
  font-size: 11.5px;
  line-height: 1.85;
  border-radius: 0 2px 2px 0;
  position: relative;

  &::before {
    content: '«';
    position: absolute;
    top: -3px;
    left: 6px;
    font-size: 22px;
    color: #2a5878;
    line-height: 1;
  }
`

// ─── Empty state ─────────────────────────────────────────────────────────────

const Empty = styled.div`
  color: #4a4a78;
  font-size: 11.5px;
  text-align: center;
  margin-top: 1.5rem;
  line-height: 2;
  letter-spacing: 0.05em;
`

const EmptyHint = styled.div`
  color: #2e2e5a;
  font-size: 11px;
  letter-spacing: 0.15em;
  margin-top: 10px;
`

// ─── Morphology bars ─────────────────────────────────────────────────────────

const MorphRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 3px 0;
`

const MorphLabel = styled.span`
  color: #4a5878;
  font-size: 10.5px;
  width: 56px;
  flex-shrink: 0;
  letter-spacing: 0.04em;
`

const MorphTrack = styled.div`
  flex: 1;
  height: 4px;
  background: #0e0e1e;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid #1e2040;
`

const MorphFill = styled.div<{ width: number }>`
  width: ${p => Math.max(1, Math.min(100, p.width))}%;
  height: 100%;
  background: linear-gradient(90deg, #1a3a60, #5ec8e0);
`

const MorphValue = styled.span`
  color: #4a6890;
  font-size: 10px;
  width: 28px;
  text-align: right;
  flex-shrink: 0;
`

// ─── Heal button ─────────────────────────────────────────────────────────────

const HealBtn = styled.button`
  background: rgba(200, 80, 80, 0.10);
  border: 1px solid #5a1a2a;
  color: #e06070;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 10px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 2px;
  margin-bottom: 6px;
  width: 100%;
  letter-spacing: 0.10em;
  transition: all 0.15s;

  &:hover {
    border-color: #c82840;
    color: #ff7088;
    box-shadow: 0 0 10px rgba(200, 40, 64, 0.30);
  }
`

// ─── Monologue generator ─────────────────────────────────────────────────────

function generateMonologue(creature: Creature): string {
  const { genome, state, hunger, thirst, warmth, stress, bonds, sentience } = creature

  if (state === 'mourning') return `${creature.name} stands very still. something is missing.`
  if (state === 'sick') return `${creature.name} is not well. the warmth feels wrong.`
  if (state === 'fighting') return `${creature.name} does not back down easily.`
  if (state === 'dreaming') return `${creature.name} has been here before. the ground remembers.`
  if (state === 'observing') return `${creature.name} watches from the edge. still. patient.`

  if (genome.mind === 'Sentinel' && sentience > 50) {
    return `${creature.name} is aware of more than the others. it watches directions they do not.`
  }
  if (genome.mind === 'Dreaming') {
    return `${creature.name} moves slowly, as though following something only it can see.`
  }
  if (hunger > 70) return `${creature.name} is very hungry. searching.`
  if (thirst > 75) return `${creature.name} needs water. moving toward the river.`
  if (warmth < 25) return `${creature.name} is cold. seeking shelter.`
  if (stress > 70) return `${creature.name} is unsettled. something nearby is wrong.`
  if (bonds.length > 2) return `${creature.name} stays close to those it knows. content.`

  const idle = [
    `${creature.name} is resting. quiet for now.`,
    `${creature.name} moves without urgency today.`,
    `${creature.name} seems at ease in this place.`,
    `nothing troubles ${creature.name} at this moment.`,
  ]
  return idle[Math.floor(Math.random() * idle.length)]
}

function StatBarRow({ glyph, glyphColor, label, value, barColor, accent }: {
  glyph: string; glyphColor: string; label: string; value: number; barColor: string; accent?: string
}) {
  return (
    <StatRow>
      <StatGlyph color={glyphColor}>{glyph}</StatGlyph>
      <StatLabel>{label}</StatLabel>
      <BarTrack>
        <BarFill width={value} color={barColor} />
      </BarTrack>
      <StatValue accent={accent}>{Math.round(value)}%</StatValue>
    </StatRow>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function DossierPanel() {
  const gameState = useLaietStore(s => s.gameState)
  const selectedId = useLaietStore(s => s.selectedCreatureId)
  const healCreature = useLaietStore(s => s.healCreature)

  const creature = selectedId ? gameState?.creatures[selectedId] : null
  const caretaker = gameState?.caretaker

  if (!creature || creature.diedOnDay !== null) {
    const alive = gameState ? Object.values(gameState.creatures).filter(c => c.diedOnDay === null) : []
    const maxGen = alive.length > 0 ? Math.max(...alive.map(c => c.generation)) : 0
    const avgSentience = alive.length > 0
      ? Math.round(alive.reduce((s, c) => s + c.sentience, 0) / alive.length)
      : 0

    return (
      <Panel>
        <PanelHeader>
          <PanelTitle>◇ DOSSIER</PanelTitle>
          <PanelTag>SBJ-—</PanelTag>
        </PanelHeader>
        <Empty>
          {selectedId ? '◌ subject deceased' : '◌ no subject selected'}
          <EmptyHint>∙ click a specimen to inspect ∙</EmptyHint>
        </Empty>

        {alive.length > 0 && (
          <Section style={{ marginTop: '1.5rem' }}>
            <SectionTitle>colony overview</SectionTitle>
            <Row>
              <Label>alive</Label>
              <Value accent='#88c060'>{alive.length}</Value>
            </Row>
            <Row>
              <Label>max generation</Label>
              <Value accent='#d4a040'>{maxGen}</Value>
            </Row>
            <Row>
              <Label>avg sentience</Label>
              <Value accent='#a870c0'>{avgSentience}%</Value>
            </Row>
            <Row>
              <Label>bonded pairs</Label>
              <Value>
                {Math.floor(alive.filter(c => c.bonds.some(b => b.strength >= 42)).length / 2)}
              </Value>
            </Row>
          </Section>
        )}
      </Panel>
    )
  }

  const color = genomeColor(creature.genome)
  const topBonds = [...creature.bonds]
    .filter(b => gameState?.creatures[b.targetId]?.diedOnDay === null)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4)

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>◇ DOSSIER</PanelTitle>
        <PanelTag>SBJ-{creature.id.slice(0, 4).toUpperCase()}</PanelTag>
      </PanelHeader>

      <CreatureName color={color}>{creature.name} {creature.familyName}</CreatureName>
      <IdLine>
        gen {creature.generation} · age {creature.age}d / {creature.maxAge}d · ({creature.x},{creature.y})
      </IdLine>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 9, color: '#6a5840' }}>state</span>
        <span style={{ fontSize: 10, color: '#88c060', letterSpacing: '0.06em' }}>
          ◉ {STATE_LABELS[creature.state] ?? creature.state}
        </span>
      </div>

      <Section>
        <SectionTitle>genome</SectionTitle>
        <TraitRow>
          <TraitBadge color={color}>{creature.genome.personality}</TraitBadge>
          <TraitBadge color='#5888a0'>{creature.genome.body}</TraitBadge>
          <TraitBadge color='#a870c0'>{creature.genome.mind}</TraitBadge>
        </TraitRow>
        {creature.recentMutation !== undefined && creature.mutatedTraits && creature.mutatedTraits.length > 0 && (
          <div style={{
            marginTop: 5, padding: '3px 8px',
            background: 'rgba(94, 200, 224, 0.08)',
            border: '1px solid rgba(94, 200, 224, 0.28)',
            borderRadius: 2, fontSize: 9, color: '#5ec8e0',
            letterSpacing: '0.10em',
          }}>
            ⚡ mutated {creature.mutatedTraits.join(', ')} this generation
          </div>
        )}
        <div style={{ color: '#4a5870', fontSize: 9, lineHeight: 1.6, marginTop: 4 }}>
          {describeGenome(creature.genome)}
        </div>
      </Section>

      <Section>
        <SectionTitle>vitals</SectionTitle>

        {caretaker && caretaker.healCharges > 0 && creature.health < 80 && (
          <HealBtn onClick={() => healCreature(creature.id)}>
            ♥ HEAL ({caretaker.healCharges} left)
          </HealBtn>
        )}

        <StatBarRow
          glyph='♥' glyphColor='#c85030'
          label='health' value={creature.health}
          barColor={creature.health < 30 ? '#c85030' : creature.health < 60 ? '#d4a040' : '#88c060'}
          accent={creature.health < 30 ? '#d07060' : undefined}
        />
        <StatBarRow
          glyph='✦' glyphColor='#d4a040'
          label='hunger' value={creature.hunger}
          barColor={creature.hunger > 70 ? '#c85030' : '#9a7030'}
          accent={creature.hunger > 70 ? '#d07050' : undefined}
        />
        <StatBarRow
          glyph='~' glyphColor='#5888a0'
          label='thirst' value={creature.thirst}
          barColor={creature.thirst > 70 ? '#3878a0' : '#2a5870'}
          accent={creature.thirst > 70 ? '#5888a0' : undefined}
        />
        <StatBarRow
          glyph='*' glyphColor='#c49840'
          label='warmth' value={creature.warmth}
          barColor={creature.warmth < 25 ? '#3878a0' : '#7a4828'}
          accent={creature.warmth < 25 ? '#5888a0' : undefined}
        />
        <StatBarRow
          glyph='!' glyphColor='#c85030'
          label='stress' value={creature.stress}
          barColor={creature.stress > 70 ? '#902020' : '#3a2830'}
          accent={creature.stress > 70 ? '#c85030' : undefined}
        />
        <StatBarRow
          glyph='◈' glyphColor='#a870c0'
          label='sentience' value={creature.sentience}
          barColor='#6a4090' accent='#a870c0'
        />
      </Section>

      <Section>
        <SectionTitle>bonds · {creature.bonds.length}</SectionTitle>
        {topBonds.length === 0 ? (
          <div style={{ fontSize: 11, color: '#3a3a60', fontStyle: 'italic', padding: '4px 0', letterSpacing: '0.08em' }}>
            no living bonds yet
          </div>
        ) : (
          <BondList>
            {topBonds.map(b => {
              const other = gameState!.creatures[b.targetId]
              return (
                <BondRow key={b.targetId}>
                  <BondName>{other.name}</BondName>
                  <BondBar>
                    <BondFill percent={b.strength} strength={b.strength} />
                  </BondBar>
                  <BondStrength strength={b.strength}>{Math.round(b.strength)}</BondStrength>
                </BondRow>
              )
            })}
          </BondList>
        )}
      </Section>

      <Section>
        <SectionTitle>lineage</SectionTitle>
        <Row>
          <Label>offspring</Label>
          <Value accent='#88c060'>{creature.offspringIds.length}</Value>
        </Row>
        <Row>
          <Label>messages sent</Label>
          <Value>{creature.messagesSent}</Value>
        </Row>
        <Row>
          <Label>kills</Label>
          <Value accent={creature.killCount > 0 ? '#c85030' : undefined}>
            {creature.killCount}
          </Value>
        </Row>
        {creature.parentIds[0] && (
          <Row>
            <Label>parents</Label>
            <Value style={{ fontSize: 9, color: '#4a5870', letterSpacing: '0.06em' }}>
              {creature.parentIds[0]?.slice(0, 4)} × {creature.parentIds[1]?.slice(0, 4) ?? '—'}
            </Value>
          </Row>
        )}
      </Section>

      <Section>
        <SectionTitle>morphology</SectionTitle>
        {(() => {
          const m = creature.genome.morphology ?? { sizeScale: 1.0, limbLength: 0, spinalLength: 0, colorDrift: 0, eyeSize: 1.0 }
          return (
            <>
              <MorphRow>
                <MorphLabel>size</MorphLabel>
                <MorphTrack><MorphFill width={((m.sizeScale - 0.7) / 0.8) * 100} /></MorphTrack>
                <MorphValue>{m.sizeScale.toFixed(2)}</MorphValue>
              </MorphRow>
              <MorphRow>
                <MorphLabel>limbs</MorphLabel>
                <MorphTrack><MorphFill width={m.limbLength * 100} /></MorphTrack>
                <MorphValue>{m.limbLength.toFixed(2)}</MorphValue>
              </MorphRow>
              <MorphRow>
                <MorphLabel>spine</MorphLabel>
                <MorphTrack><MorphFill width={m.spinalLength * 100} /></MorphTrack>
                <MorphValue>{m.spinalLength.toFixed(2)}</MorphValue>
              </MorphRow>
              <MorphRow>
                <MorphLabel>eyes</MorphLabel>
                <MorphTrack><MorphFill width={((m.eyeSize - 0.7) / 0.8) * 100} /></MorphTrack>
                <MorphValue>{m.eyeSize.toFixed(2)}</MorphValue>
              </MorphRow>
            </>
          )
        })()}
      </Section>

      <Monologue>{generateMonologue(creature)}</Monologue>
    </Panel>
  )
}
