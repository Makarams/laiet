# Audio System — LA-IET.EXE

## Architecture

```
masterGain (0.28)
  ├── musicBus  (1.0) — pad + melody + bass
  └── ambientBus (1.0) — weather noise chains
```

All audio lives in `src/audio/chiptune.ts`. Context singleton in `src/audio/unlock.ts`.

## Music layers

Every music context runs three simultaneous layers:

**Pad** — Sustained chord clusters. Each chord = [root, third, fifth] Hz, rendered as 9 detuned
oscillators (3 tones × 3 detune offsets: −7, 0, +7 cents). Chords change every 6 seconds with
a 1.8-second overlap, ensuring continuous harmonic texture. Gain per oscillator: 0.036.

**Melody** — Phrase-based melodic lines. Patterns stay in the correct scale for the active chord
progression. Gap between phrases ≤ 0.5 beats (no long silences). Uses `setTimeout` scheduled
to fire just before the next phrase starts.

**Bass** — Root/fifth pulse, two hits per phrase. Triangle wave, quiet.

## Music contexts

| Key | Scene |
|---|---|
| `genesis` | Tiny new colony (≤4 alive, day < 30) |
| `spring_day / night` | C major pentatonic, 0.26s beat |
| `summer_day / night` | G major pentatonic, 0.28s beat |
| `autumn_day / night` | A minor pentatonic, 0.30s beat |
| `winter_day / night` | D minor, slower, sparser |
| `tension` | A Phrygian, fast (0.18s beat), no gap |
| `awareness_2_day / night` | Open fifths, slow, eerie |
| `awareness_3` | Near-silence; wide spacing, pure intervals |
| `ascendant` | Full ascending C major, fast |

`computeMusicKey(gs)` selects the active key from GameState each tick. Context switches are
debounced by `MUSIC_COOLDOWN_MS = 4000` and crossfade over `CROSSFADE_SECS = 3.0`.

## Weather ambient

Runs independently on `ambientBus`. Called via `updateWeatherAudio(weather)` when `WeatherState` changes.

| Weather | Sound design |
|---|---|
| `rain` | Lowpass noise (900 Hz) + bandpass shimmer (2800 Hz). Bus gain 0.092. |
| `storm` | Heavy lowpass (1400 Hz) + low rumble (180 Hz). Bus gain 0.112. Thunder events every 16–50s. |
| `snow` | Very soft lowpass wind (280 Hz) + narrow bandpass moan (82 Hz). Occasional creak tones every 10–30s. Bus gain 0.058. |
| `drought` | Highpass hiss (2600 Hz) + warm bandpass haze (420 Hz). Bus gain 0.062. |
| `clear` | No ambient layer. |

**Thunder** — each event: low boom oscillator (42–56 Hz, 2.8s exponential decay) + short noise
crack (lowpass 700 Hz, 1.6s decay). Intensity randomised 0.65–1.0.

**Snow creaks** — triangle oscillator at 270–400 Hz, 0.65s envelope; simulates branch load creak.

## Public API

```typescript
computeMusicKey(gs: GameState): string          // derive key from game state
updateMusicContext(key: string): void           // switch music context (debounced)
updateWeatherAudio(weather: WeatherState): void // switch weather ambient (crossfade 2.5s)
stopAudio(): void
setMuted(m: boolean): void
isMuted(): boolean

// SFX
sfxDrop()       // food drop chime
sfxHeal()       // heal chord
sfxDeath()      // descending tones
sfxEvent()      // event notification double-tap
sfxAscension()  // ascending fanfare
```

## Integration (GameLayout.tsx)

```typescript
const musicKey = useLaietStore(s => s.gameState ? computeMusicKey(s.gameState) : '')
const weather  = useLaietStore(s => s.gameState?.weather ?? 'clear')
useEffect(()=>{if(muted)return;updateMusicContext(musicKey)},[musicKey,muted])
useEffect(()=>{if(muted)return;updateWeatherAudio(weather)},[weather,muted])
```
