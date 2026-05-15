# Genetics & Visual System — LA-IET.EXE

## Genome slots

| Slot | Options |
|---|---|
| Personality | Curious · Timid · Aggressive · Lazy · Greedy · Nurturing · Wanderer · Recluse · Hoarder · Empath · Furtive · Territorial · Social · Stoic |
| Body | Spore · Shell · Spike · Wisp |
| Mind | Feral · Aware · Dreaming · Sentinel |
| morphSeed | 0..1; per-creature asymmetry seed |

Mutation rate: 8% default, 5% (profile=slow), 13% (profile=fast). Asexual (Spore): 15%.  
`morphSeed` drifts ±0.09 sexual, ±0.16 asexual.

## Morphology traits (heritable)

| Field | Range | Effect |
|---|---|---|
| sizeScale | 0.7–1.5 | Body size multiplier |
| limbLength | 0–1 | Appendage elongation |
| spinalLength | 0–1 | Dorsal feature growth |
| colorDrift | −0.5–0.5 | Accumulated hue offset |
| eyeSize | 0.7–1.5 | Eye size relative to mind baseline |

## Body types

| Body | Max age | Speed | Fight | Repro rate | Asexual |
|---|---|---|---|---|---|
| Spore | 450 | 1.2× | 0.4 | 0.010 | Yes |
| Shell | 1500 | 0.5× | 0.6 | 0.004 | No |
| Spike | 700 | 0.9× | 2.0 | 0.004 | No |
| Wisp | 600 | 2.2× | 0.3 | 0.006 | No |

## Creature color

`genomeColor(genome)` → HSL from personality base hue, body saturation/lightness mod, mind hue shift, morphSeed drift (±11°).

## Shape by body

- **Shell** — flat ellipse + dorsal arc; ridges at gen/spinalLength thresholds; flanges at limbLength > 0.35
- **Spike** — round body + dorsal spine (scaled by kills + gen + spinalLength); segmented limbs at limbLength > 0.55
- **Wisp** — tall ellipse + bezier tail + fraying strand; diaphanous fins at limbLength > 0.30
- **Spore** — asymmetric blob (morphSeed-driven); pseudopod lobes at limbLength > 0.20; flagellum at spinalLength > 0.35

`genFactor = min(1, generation / 5)` gates visual feature classes.

## Visual overlays

- **Biome tint** — arid: warm orange; wetland: cool blue; lush: green; rocky: grey mineral
- **Stress marks** — jagged cracks at stress > 65, scaled to `(stress − 65) / 35`
- **Newborn glow** — pulsing yellow halo for age < 60 ticks
- **Night dimming** — α 0.55; Curious/Dreaming stay at α 0.92 (nocturnal)
- **Cave dimming** — `CAVE_CREATURE_ALPHA = 0.50`

## Micro-animations

| Type | Duration | Trigger |
|---|---|---|
| jump | 600ms | Playing state or birth |
| shake | 500ms | Warmth < 30 or sick recovery |
| sneeze | 400ms | Sick state or arid biome |
| groom | 900ms | Grooming state |
| wag | 700ms | Bonded partner enters proximity |

Trigger chance: 0.008–0.025 per tick.

## Community roles (assignRole)

Priority order:
```
Recluse personality                                 → recluse
Sentinel + (lineages≥4 OR sentience≥60 AND gen≥3)  → elder
Dreaming/Sentinel + Curious/Wanderer                → shaman
Nurturing + (Dreaming OR offspring≥4)               → healer
Nurturing                                           → nurturer
Aggressive OR Spike body                            → guardian
Wisp + (Wanderer OR Curious OR generation≥2)        → scout
Wanderer OR Greedy                                  → forager
Dreaming/Sentinel (fallback)                        → shaman
```

## Adding a new personality trait

1. Add to `PersonalityTrait` in `src/types/index.ts`
2. Add behavior in `tickBehavior()` in `src/creatures/behavior.ts`
3. Add `needSatisfaction` penalty in `computeNeedSatisfaction()`
4. Add base HSL to `genomeColor()` in `src/engine/genetics.ts`
5. Add description to `describeGenome()`
6. Add perceptual seeds to `starterEmoji()` in `src/engine/speech.ts`
7. Optionally: `assignRole()` and `src/engine/messages.ts`

## Adding a new tile type

1. Add to `TileType` in `src/types/index.ts`
2. Add three-face colors to `TILE_COLORS` in `src/ui/renderer/tiles.ts`
3. Add decoration to `drawTileDecoration()` in `renderer/tiles.ts`
4. Add movement modifier to `TILE_MOVE_MODIFIER` in `src/engine/constants.ts`
5. Handle passability in `isTilePassable()` in `src/world/worldGen.ts`
6. Add food/water/shelter logic in `tickTiles()` in `src/engine/tick.ts`
