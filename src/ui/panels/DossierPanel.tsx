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
    linear-gradient(180deg, rgba(20, 20, 50, 0.30), rgba(8, 8, 28, 0.85)),
    #06061a;
  border: 1px solid #2a2a50;
  border-radius: 4px;
  padding: 11px 12px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  color: #f0e6c8;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-sizing: border-box;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.40);

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #3a3a70; border-radius: 2px; }
`

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 8px;
  margin-bottom: 9px;
  border-bottom: 1px solid #2a2a55;
`

const PanelTitle = styled.div`
  font-size: 13px;
  color: #80e0f0;
  letter-spacing: 0.22em;
  text-shadow: 0 0 10px rgba(94, 200, 224, 0.40);
  font-weight: bold;
`

const PanelTag = styled.div`
  font-size: 10px;
  color: #7a7aa0;
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
  color: #8888b0;
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
  color: #80e0f0;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin: 3px 0 6px;
  font-weight: bold;

  &::before {
    content: '';
    width: 4px;
    height: 4px;
    background: #5ec8e0;
    box-shadow: 0 0 4px #5ec8e0;
    transform: rotate(45deg);
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #1c2e3e, transparent);
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5px 0;
`

const Label = styled.span`
  color: #a8a8d0;
  font-size: 11.5px;
`

const Value = styled.span<{ accent?: string }>`
  color: ${p => p.accent ?? '#f0e6c8'};
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
  text-shadow: 0 0 6px ${p => p.color}55;
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
  color: #a8a8d0;
  font-size: 11px;
  width: 58px;
  flex-shrink: 0;
`

const BarTrack = styled.div`
  flex: 1;
  height: 6px;
  background: #0c0c22;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid #14143a;
`

const BarFill = styled.div<{ width: number; color: string }>`
  width: ${p => Math.max(0, Math.min(100, p.width))}%;
  height: 100%;
  background: linear-gradient(90deg, ${p => p.color}, ${p => p.color}dd);
  box-shadow: 0 0 5px ${p => p.color}aa;
  transition: width 0.35s ease;
`

const StatValue = styled.span<{ accent?: string }>`
  color: ${p => p.accent ?? '#a8a8d0'};
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
  color: #f0e6c8;
  width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: bold;
`

const BondBar = styled.div`
  flex: 1;
  height: 4px;
  background: #0c0c22;
  border-radius: 2px;
  overflow: hidden;
`

const BondFill = styled.div<{ percent: number; strength: number }>`
  width: ${p => Math.max(2, Math.min(100, p.percent))}%;
  height: 100%;
  background: ${p =>
    p.strength > 70 ? 'linear-gradient(90deg, #ff80c0, #ff5090)' :
    p.strength > 40 ? 'linear-gradient(90deg, #c878f0, #a058d0)' :
    'linear-gradient(90deg, #5ec8e0, #3a98b8)'};
  box-shadow: 0 0 5px ${p =>
    p.strength > 70 ? '#ff80c0' :
    p.strength > 40 ? '#c878f0' :
    '#5ec8e0'};
`

const BondStrength = styled.span<{ strength: number }>`
  font-size: 10.5px;
  color: ${p => p.strength > 70 ? '#ff80c0' : p.strength > 40 ? '#c878f0' : '#5ec8e0'};
  width: 24px;
  text-align: right;
  font-weight: bold;
`

// ─── Monologue ───────────────────────────────────────────────────────────────

const Monologue = styled.div`
  margin-top: 12px;
  padding: 10px 14px 10px 18px;
  background: linear-gradient(180deg, rgba(94, 200, 224, 0.07), rgba(8, 8, 28, 0.75));
  border-left: 2px solid #4ea8c8;
  font-style: italic;
  color: #c0d0e0;
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
    color: #4ea8c8;
    line-height: 1;
  }
`

// ─── Empty state ─────────────────────────────────────────────────────────────

const Empty = styled.div`
  color: #8888b0;
  font-size: 11.5px;
  text-align: center;
  margin-top: 1.5rem;
  line-height: 2;
  letter-spacing: 0.05em;
`

const EmptyHint = styled.div`
  color: #8080a0;
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
  color: #8888b0;
  font-size: 10.5px;
  width: 56px;
  flex-shrink: 0;
  letter-spacing: 0.04em;
`

const MorphTrack = styled.div`
  flex: 1;
  height: 4px;
  background: #0c0c22;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid #14143a;
`

const MorphFill = styled.div<{ width: number }>`
  width: ${p => Math.max(1, Math.min(100, p.width))}%;
  height: 100%;
  background: linear-gradient(90deg, #6040a8, #c878f0);
  box-shadow: 0 0 4px #c878f080;
`

const MorphValue = styled.span`
  color: #9090c0;
  font-size: 10px;
  width: 28px;
  text-align: right;
  flex-shrink: 0;
`

// ─── Heal button ─────────────────────────────────────────────────────────────

const HealBtn = styled.button`
  background: rgba(255, 80, 96, 0.10);
  border: 1px solid #5a2828;
  color: #ff7080;
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
    border-color: #ff5060;
    color: #ff8090;
    box-shadow: 0 0 10px rgba(255, 80, 96, 0.30);
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
              <Value accent='#80f0a0'>{alive.length}</Value>
            </Row>
            <Row>
              <Label>max generation</Label>
              <Value accent='#ffb050'>{maxGen}</Value>
            </Row>
            <Row>
              <Label>avg sentience</Label>
              <Value accent='#c878f0'>{avgSentience}%</Value>
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
        <span style={{ fontSize: 9, color: '#7a78a5' }}>state</span>
        <span style={{ fontSize: 10, color: '#80f0a0', letterSpacing: '0.06em' }}>
          ◉ {STATE_LABELS[creature.state] ?? creature.state}
        </span>
      </div>

      <Section>
        <SectionTitle>genome</SectionTitle>
        <TraitRow>
          <TraitBadge color={color}>{creature.genome.personality}</TraitBadge>
          <TraitBadge color='#80c8ff'>{creature.genome.body}</TraitBadge>
          <TraitBadge color='#c878f0'>{creature.genome.mind}</TraitBadge>
        </TraitRow>
        {creature.recentMutation !== undefined && creature.mutatedTraits && creature.mutatedTraits.length > 0 && (
          <div style={{
            marginTop: 5, padding: '3px 8px',
            background: 'rgba(255, 220, 40, 0.10)',
            border: '1px solid rgba(255, 220, 40, 0.30)',
            borderRadius: 2, fontSize: 9, color: '#ffe060',
            letterSpacing: '0.10em',
          }}>
            ⚡ mutated {creature.mutatedTraits.join(', ')} this generation
          </div>
        )}
        <div style={{ color: '#5a5a85', fontSize: 9, lineHeight: 1.6, marginTop: 4 }}>
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
          glyph='♥' glyphColor='#ff5060'
          label='health' value={creature.health}
          barColor={creature.health < 30 ? '#ff5060' : creature.health < 60 ? '#ffb050' : '#80f0a0'}
          accent={creature.health < 30 ? '#ff7080' : undefined}
        />
        <StatBarRow
          glyph='✦' glyphColor='#ffb050'
          label='hunger' value={creature.hunger}
          barColor={creature.hunger > 70 ? '#ff5060' : '#a08030'}
          accent={creature.hunger > 70 ? '#ff8050' : undefined}
        />
        <StatBarRow
          glyph='~' glyphColor='#5ec8e0'
          label='thirst' value={creature.thirst}
          barColor={creature.thirst > 70 ? '#3088b8' : '#1e5878'}
          accent={creature.thirst > 70 ? '#5ec8e0' : undefined}
        />
        <StatBarRow
          glyph='*' glyphColor='#ffc070'
          label='warmth' value={creature.warmth}
          barColor={creature.warmth < 25 ? '#3098b8' : '#8a5028'}
          accent={creature.warmth < 25 ? '#5ec8e0' : undefined}
        />
        <StatBarRow
          glyph='!' glyphColor='#ff5060'
          label='stress' value={creature.stress}
          barColor={creature.stress > 70 ? '#a02828' : '#3a3055'}
          accent={creature.stress > 70 ? '#ff5060' : undefined}
        />
        <StatBarRow
          glyph='◈' glyphColor='#c878f0'
          label='sentience' value={creature.sentience}
          barColor='#7050b8' accent='#c878f0'
        />
      </Section>

      <Section>
        <SectionTitle>bonds · {creature.bonds.length}</SectionTitle>
        {topBonds.length === 0 ? (
          <div style={{ fontSize: 11, color: '#6060a0', fontStyle: 'italic', padding: '4px 0', letterSpacing: '0.08em' }}>
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
          <Value accent='#80f0a0'>{creature.offspringIds.length}</Value>
        </Row>
        <Row>
          <Label>messages sent</Label>
          <Value>{creature.messagesSent}</Value>
        </Row>
        <Row>
          <Label>kills</Label>
          <Value accent={creature.killCount > 0 ? '#ff5060' : undefined}>
            {creature.killCount}
          </Value>
        </Row>
        {creature.parentIds[0] && (
          <Row>
            <Label>parents</Label>
            <Value style={{ fontSize: 9, color: '#5a5a85', letterSpacing: '0.06em' }}>
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
