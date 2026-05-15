import type { GameState, WeatherState } from '@/types'
import { getAudioCtx, unlockAudio } from './unlock'

export { unlockAudio }

// ─── Bus topology ─────────────────────────────────────────────────────────────
//  masterGain (0.28)
//    ├── musicBus  (1.0) ← pad + melody + bass layers
//    └── ambientBus (1.0) ← weather noise chains

let masterGain: GainNode | null = null
let musicBus:   GainNode | null = null
let ambientBus: GainNode | null = null
let muted = false
let currentMusicKey   = ''
let currentWeatherKey = ''
let lastMusicSwitch   = 0
const CROSSFADE_SECS    = 3.0
const MUSIC_COOLDOWN_MS = 4_000

interface Handle { fadeOut(secs: number): void; stop(): void }

let activeMusicHandle:   Handle | null = null
let activeWeatherHandle: Handle | null = null

function getCtx(): AudioContext {
  const c = getAudioCtx()
  if (!masterGain) {
    masterGain = c.createGain()
    masterGain.gain.value = 0.28
    masterGain.connect(c.destination)
    musicBus = c.createGain()
    musicBus.gain.value = 1.0
    musicBus.connect(masterGain)
    ambientBus = c.createGain()
    ambientBus.gain.value = 1.0
    ambientBus.connect(masterGain)
  }
  return c
}

// ─── Frequency table ─────────────────────────────────────────────────────────

const N: Record<string, number> = {
  Bb2: 116.54,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00, B5: 987.77,
}
const R = 0 // rest — scheduleNote skips zeros

// ─── Pad layer (sustained chord clusters) ─────────────────────────────────────
// Each chord = [root, third, fifth] Hz, rendered as 9 detuned oscillators
// (3 tones × 3 detune offsets) so there is always harmonic texture underneath
// the melody. Chords advance every PAD_CHORD_SECS and overlap by PAD_OVERLAP.

type Chord = readonly [number, number, number]

const CHORD_PROGS: Record<string, readonly Chord[]> = {
  genesis:           [[N.C4,N.E4,N.G4],[N.A3,N.C4,N.E4],[N.F3,N.A3,N.C4],[N.G3,N.B3,N.D4]],
  spring_day:        [[N.C4,N.E4,N.G4],[N.F3,N.A3,N.C4],[N.G3,N.B3,N.D4],[N.A3,N.C4,N.E4]],
  spring_night:      [[N.C4,N.E4,N.G4],[N.A3,N.C4,N.E4],[N.F3,N.A3,N.C4],[N.G3,N.B3,N.D4]],
  summer_day:        [[N.G3,N.B3,N.D4],[N.C4,N.E4,N.G4],[N.D4,N.Fs4,N.A4],[N.E4,N.G4,N.B4]],
  summer_night:      [[N.G3,N.B3,N.D4],[N.E3,N.G3,N.B3],[N.C4,N.E4,N.G4],[N.D4,N.Fs4,N.A4]],
  autumn_day:        [[N.A3,N.C4,N.E4],[N.F3,N.A3,N.C4],[N.C4,N.E4,N.G4],[N.G3,N.B3,N.D4]],
  autumn_night:      [[N.A3,N.C4,N.E4],[N.G3,N.Bb3,N.D4],[N.F3,N.A3,N.C4],[N.E3,N.G3,N.B3]],
  winter_day:        [[N.D4,N.F4,N.A4],[N.C4,N.E4,N.G4],[N.Bb3,N.D4,N.F4],[N.A3,N.C4,N.E4]],
  winter_night:      [[N.D4,N.F4,N.A4],[N.A3,N.C4,N.E4],[N.C4,N.Eb4,N.G4],[N.D4,N.F4,N.A4]],
  tension:           [[N.A3,N.C4,N.E4],[N.Bb3,N.D4,N.F4],[N.A3,N.C4,N.E4],[N.G3,N.B3,N.D4]],
  awareness_2_day:   [[N.D4,N.A4,N.D5],[N.A3,N.E4,N.A4],[N.G3,N.D4,N.G4],[N.E4,N.B4,N.E5]],
  awareness_2_night: [[N.D4,N.A4,N.D5],[N.G3,N.D4,N.G4],[N.A3,N.E4,N.A4],[N.D4,N.A4,N.D5]],
  awareness_3:       [[N.C4,N.G4,N.C5],[N.D4,N.A4,N.D5],[N.G3,N.D4,N.G4],[N.C4,N.G4,N.C5]],
  ascendant:         [[N.C4,N.E4,N.G4],[N.G4,N.B4,N.D5],[N.A4,N.C5,N.E5],[N.G4,N.B4,N.D5]],
}

const PAD_DETUNES    = [-7, 0, 7]  // cents; 3 osc per tone for richness
const PAD_CHORD_SECS = 6.0         // seconds per chord change
const PAD_OVERLAP    = 1.8         // crossfade overlap between chords
const PAD_GAIN_PER_OSC = 0.036     // 9 total osc per chord; sum is perceptually ~0.12

function scheduleChord(
  c: AudioContext, target: AudioNode,
  chord: Chord, startTime: number, holdSecs: number,
): void {
  const attack  = Math.min(1.2, holdSecs * 0.22)
  const release = Math.min(1.8, holdSecs * 0.32)
  for (const freq of chord) {
    for (const detune of PAD_DETUNES) {
      const osc = c.createOscillator()
      const og  = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      osc.detune.setValueAtTime(detune, startTime)
      og.gain.setValueAtTime(0, startTime)
      og.gain.linearRampToValueAtTime(PAD_GAIN_PER_OSC, startTime + attack)
      og.gain.setValueAtTime(PAD_GAIN_PER_OSC, startTime + holdSecs - release)
      og.gain.linearRampToValueAtTime(0, startTime + holdSecs)
      osc.connect(og); og.connect(target)
      osc.start(startTime); osc.stop(startTime + holdSecs + 0.1)
    }
  }
}

function startPadLayer(c: AudioContext, target: AudioNode, chords: readonly Chord[]): { stop(): void } {
  let running  = true
  let chordIdx = 0
  let nextTime = c.currentTime + 0.1

  function scheduleAhead() {
    if (!running) return
    while (running && nextTime < c.currentTime + PAD_CHORD_SECS * 2) {
      scheduleChord(c, target, chords[chordIdx % chords.length], nextTime, PAD_CHORD_SECS + PAD_OVERLAP)
      nextTime += PAD_CHORD_SECS
      chordIdx++
    }
    if (running) setTimeout(scheduleAhead, PAD_CHORD_SECS * 400)
  }
  scheduleAhead()
  return { stop() { running = false } }
}

// ─── Melody tracks ────────────────────────────────────────────────────────────
// Patterns are in the correct key for each chord progression.
// gapBeats ≤ 0.5 — no long silences between phrases.

interface MelodyTrack {
  patterns: number[][]
  wave: OscillatorType
  beatLen: number    // seconds per step
  noteLen: number    // how long each note rings (< beatLen)
  gain: number
  gapBeats: number   // silence between phrases (≤ 0.5)
  bassFreqs: readonly [number, number] | null
  bassGain: number
}

const MELODY: Record<string, MelodyTrack> = {
  genesis: {
    patterns: [
      [N.C4, R,    N.E4, N.G4, R,    N.E4, N.C4, R   ],
      [N.E4, N.G4, R,    N.C5, R,    N.G4, N.E4, N.C4],
      [N.G4, R,    N.E4, N.C4, N.E4, R,    N.G4, R   ],
      [R,    N.C4, N.E4, R,    N.G4, N.E4, R,    N.C4],
    ],
    wave: 'sine', beatLen: 0.48, noteLen: 0.36, gain: 0.065, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  spring_day: {
    patterns: [
      [N.E4, N.G4, N.A4, N.G4, N.E4, N.C4, N.D4, N.E4, R,    N.G4],
      [N.C4, N.E4, R,    N.G4, N.A4, R,    N.G4, N.E4, N.D4, N.C4],
      [N.G4, N.A4, N.C5, R,    N.A4, N.G4, R,    N.E4, N.G4, R   ],
      [N.D4, N.E4, N.G4, R,    N.A4, N.G4, N.E4, R,    N.D4, N.C4],
    ],
    wave: 'triangle', beatLen: 0.26, noteLen: 0.19, gain: 0.078, gapBeats: 0.5,
    bassFreqs: [N.C3, N.G3], bassGain: 0.032,
  },
  spring_night: {
    patterns: [
      [N.E4, R,    N.G4, N.A4, R,    N.G4, N.E4, R   ],
      [N.C4, N.E4, R,    N.G4, R,    N.E4, N.C4, N.D4],
      [N.G4, R,    N.E4, N.G4, N.A4, R,    N.G4, R   ],
      [R,    N.C4, R,    N.E4, N.G4, R,    N.E4, N.C4],
    ],
    wave: 'sine', beatLen: 0.40, noteLen: 0.30, gain: 0.060, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  summer_day: {
    patterns: [
      [N.G4, N.A4, N.B4, N.A4, N.G4, N.E4, N.D4, N.G4, R,    N.B4],
      [N.D4, N.E4, N.G4, R,    N.A4, N.B4, R,    N.A4, N.G4, N.D4],
      [N.B4, N.A4, R,    N.G4, N.E4, R,    N.D4, N.E4, N.G4, R   ],
      [N.G4, R,    N.D4, N.E4, N.G4, N.A4, R,    N.G4, N.B4, N.A4],
    ],
    wave: 'triangle', beatLen: 0.28, noteLen: 0.20, gain: 0.076, gapBeats: 0.5,
    bassFreqs: [N.G3, N.D3], bassGain: 0.030,
  },
  summer_night: {
    patterns: [
      [N.G4, R,    N.A4, N.B4, R,    N.A4, N.G4, R   ],
      [N.D4, N.E4, R,    N.G4, N.A4, R,    N.G4, N.E4],
      [N.B4, R,    N.G4, R,    N.E4, N.G4, R,    N.B4],
      [N.A4, N.G4, R,    N.E4, R,    N.D4, N.E4, N.G4],
    ],
    wave: 'sine', beatLen: 0.42, noteLen: 0.31, gain: 0.058, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  autumn_day: {
    patterns: [
      [N.A4, N.G4, N.E4, N.D4, N.C4, R,    N.A3, N.C4, N.D4, N.E4],
      [N.E4, N.D4, N.C4, N.A3, R,    N.C4, N.D4, N.E4, R,    N.G4],
      [N.G4, R,    N.E4, N.D4, N.C4, N.D4, N.E4, R,    N.G4, N.A4],
      [N.C4, N.A3, R,    N.C4, N.E4, N.G4, R,    N.E4, N.D4, N.C4],
    ],
    wave: 'triangle', beatLen: 0.30, noteLen: 0.21, gain: 0.072, gapBeats: 0.5,
    bassFreqs: [N.A3, N.E3], bassGain: 0.028,
  },
  autumn_night: {
    patterns: [
      [N.A3, N.C4, N.E4, R,    N.D4, N.C4, R,    N.A3],
      [N.E4, R,    N.D4, N.C4, R,    N.A3, N.C4, R   ],
      [N.C4, N.E4, R,    N.G4, R,    N.E4, N.D4, N.C4],
      [R,    N.A3, N.C4, R,    N.E4, R,    N.D4, N.E4],
    ],
    wave: 'sine', beatLen: 0.44, noteLen: 0.33, gain: 0.058, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  winter_day: {
    patterns: [
      [N.D4, R,    N.F4, R,    N.A4, R,    N.F4, N.D4],
      [N.A4, R,    N.F4, R,    N.D4, R,    N.A3, N.D4],
      [R,    N.D4, N.F4, R,    N.A4, R,    N.C5, N.A4],
      [N.D5, R,    N.C5, R,    N.A4, N.F4, R,    N.D4],
    ],
    wave: 'triangle', beatLen: 0.50, noteLen: 0.38, gain: 0.066, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  winter_night: {
    patterns: [
      [N.D4, R,    R,    N.A4, R,    R,    N.F4, R   ],
      [R,    N.D4, R,    R,    R,    N.D5, R,    R   ],
      [N.A4, R,    R,    N.F4, R,    N.D4, R,    R   ],
      [R,    R,    N.F4, R,    R,    R,    N.A4, R   ],
    ],
    wave: 'sine', beatLen: 0.62, noteLen: 0.48, gain: 0.050, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  tension: {
    patterns: [
      [N.A4, N.Bb4, N.A4, N.G4,  N.A4, N.Bb4, N.G4,  N.A4],
      [N.E4, N.F4,  N.E4, N.Eb4, R,    N.E4,  N.F4,  N.E4],
      [N.A3, N.Bb3, N.C4, N.D4,  N.E4, N.Eb4, N.D4,  N.A3],
      [N.G4, N.Ab4, N.A4, R,     N.Bb4,N.A4,  N.Ab4, N.G4],
    ],
    wave: 'triangle', beatLen: 0.18, noteLen: 0.13, gain: 0.070, gapBeats: 0,
    bassFreqs: [N.A3, N.E3], bassGain: 0.026,
  },
  awareness_2_day: {
    patterns: [
      [N.A4, R, R, R, N.E5, R, R, R, N.D5, R, R, R],
      [N.D4, R, R, N.A4, R, R, N.D5, R, R, N.A4, R, R],
      [N.G4, R, R, N.D5, R, R, N.G4, R, R, R,    N.A4, R],
      [R, N.E4, R, R, R, N.B4, R, R, R, N.E5, R, R],
    ],
    wave: 'sine', beatLen: 0.50, noteLen: 0.40, gain: 0.056, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  awareness_2_night: {
    patterns: [
      [N.A4, R, R, R, R, N.E5, R, R, R, R, R, R],
      [R,    R, R, N.D5, R, R, R, R, N.A4, R, R, R],
      [N.G4, R, R, R, N.D5, R, R, R, R, R, N.G4, R],
      [R,    R, N.E4, R, R, R, N.B4, R, R, R, R, R],
    ],
    wave: 'sine', beatLen: 0.68, noteLen: 0.54, gain: 0.046, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  awareness_3: {
    patterns: [
      [N.C4, R, R, R, R, R, R, R, N.G4, R, R, R, R, R, R, R],
      [R,    R, R, R, N.E4, R, R, R, R, R, R, N.G4, R, R, R, R],
      [R, N.C5, R, R, R, R, R, R, R, R, N.G4, R, R, R, R, R],
      [N.C4, R, R, R, R, N.E4, R, R, R, R, R, N.C5, R, R, R, R],
    ],
    wave: 'sine', beatLen: 0.72, noteLen: 0.60, gain: 0.048, gapBeats: 0.5,
    bassFreqs: null, bassGain: 0,
  },
  ascendant: {
    patterns: [
      [N.C5, N.E5, N.G5, N.A5, N.G5, N.E5, N.C5, R,    N.G4, N.C5],
      [N.A4, N.C5, N.E5, N.G5, N.E5, N.C5, N.A4, N.G4, R,    N.A4],
      [N.G4, N.B4, N.D5, N.G5, N.D5, N.B4, N.G4, R,    N.E4, N.G4],
      [N.E4, N.G4, N.C5, N.E5, N.G5, N.E5, N.C5, N.G4, N.E4, R   ],
    ],
    wave: 'sine', beatLen: 0.22, noteLen: 0.17, gain: 0.086, gapBeats: 0.5,
    bassFreqs: [N.C3, N.G3], bassGain: 0.036,
  },
}

// ─── Note scheduler ───────────────────────────────────────────────────────────

function scheduleNote(
  c: AudioContext, target: AudioNode,
  freq: number, wave: OscillatorType,
  dur: number, when: number, g: number,
): void {
  if (!freq) return
  const osc = c.createOscillator()
  const og  = c.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(freq, when)
  og.gain.setValueAtTime(0, when)
  og.gain.linearRampToValueAtTime(g, when + 0.018)
  og.gain.linearRampToValueAtTime(0, when + dur - 0.018)
  osc.connect(og); og.connect(target)
  osc.start(when); osc.stop(when + dur)
}

// ─── Music loop (melody + pad + bass) ────────────────────────────────────────

function startMusicLoop(key: string, fadeInSecs: number): Handle {
  const c        = getCtx()
  const loopGain = c.createGain()
  loopGain.gain.setValueAtTime(0, c.currentTime)
  loopGain.connect(musicBus!)

  const track  = MELODY[key]       ?? MELODY.genesis
  const chords = CHORD_PROGS[key]  ?? CHORD_PROGS.genesis
  let running  = true

  const padLayer = startPadLayer(c, loopGain, chords)

  function schedulePhrase(when: number) {
    if (!running || muted) return
    const { patterns, wave, beatLen, noteLen, gain, gapBeats, bassFreqs, bassGain } = track
    const pat = patterns[Math.floor(Math.random() * patterns.length)]

    if (bassFreqs) {
      const bf   = bassFreqs[Math.random() < 0.65 ? 0 : 1]
      const half = Math.floor(pat.length * 0.5)
      scheduleNote(c, loopGain, bf, 'triangle', beatLen * half * 0.9, when, bassGain)
      scheduleNote(c, loopGain, bf, 'triangle', beatLen * (pat.length - half) * 0.9, when + beatLen * half, bassGain * 0.7)
    }

    for (let i = 0; i < pat.length; i++) {
      scheduleNote(c, loopGain, pat[i], wave, noteLen, when + i * beatLen, gain)
    }

    const phraseDur = pat.length * beatLen + gapBeats * beatLen
    setTimeout(() => schedulePhrase(when + phraseDur), Math.max(0, phraseDur * 1000 - 50))
  }

  function begin() {
    if (!running) return
    loopGain.gain.linearRampToValueAtTime(1.0, c.currentTime + fadeInSecs)
    schedulePhrase(c.currentTime + 0.1)
  }

  if (c.state !== 'running') c.resume().then(begin).catch(() => {})
  else begin()

  return {
    fadeOut(secs) {
      running = false; padLayer.stop()
      const now = c.currentTime
      loopGain.gain.cancelScheduledValues(now)
      loopGain.gain.setValueAtTime(loopGain.gain.value, now)
      loopGain.gain.linearRampToValueAtTime(0, now + secs)
    },
    stop() {
      running = false; padLayer.stop()
      const now = c.currentTime
      loopGain.gain.cancelScheduledValues(now)
      loopGain.gain.setValueAtTime(0, now)
    },
  }
}

// ─── Weather ambient engine ───────────────────────────────────────────────────
// Noise-based ambient layers with distinct spectral character per weather state.
// Thunder is randomised during storms; snow has occasional creak tones.

function createNoiseBuffer(c: AudioContext): AudioBuffer {
  const buf  = c.createBuffer(1, c.sampleRate * 3, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function loopNoise(
  c: AudioContext, buf: AudioBuffer,
  filterType: BiquadFilterType, freq: number, Q: number,
  srcGain: number, target: AudioNode,
): AudioBufferSourceNode {
  const src  = c.createBufferSource()
  const filt = c.createBiquadFilter()
  const g    = c.createGain()
  src.buffer = buf; src.loop = true
  filt.type  = filterType; filt.frequency.value = freq; filt.Q.value = Q
  g.gain.value = srcGain
  src.connect(filt); filt.connect(g); g.connect(target)
  src.start()
  return src
}

function fireThunder(c: AudioContext, target: AudioNode, buf: AudioBuffer, intensity: number): void {
  const now = c.currentTime

  const boom  = c.createOscillator(); const boomG = c.createGain()
  boom.type   = 'sine'
  boom.frequency.setValueAtTime(42 + Math.random() * 14, now)
  boomG.gain.setValueAtTime(0, now)
  boomG.gain.linearRampToValueAtTime(0.20 * intensity, now + 0.04)
  boomG.gain.exponentialRampToValueAtTime(0.001, now + 2.8)
  boom.connect(boomG); boomG.connect(target)
  boom.start(now); boom.stop(now + 2.9)

  const crack  = c.createBufferSource(); const crackF = c.createBiquadFilter(); const crackG = c.createGain()
  crack.buffer = buf; crackF.type = 'lowpass'; crackF.frequency.value = 700
  crackG.gain.setValueAtTime(0, now)
  crackG.gain.linearRampToValueAtTime(0.25 * intensity, now + 0.02)
  crackG.gain.exponentialRampToValueAtTime(0.001, now + 1.6)
  crack.connect(crackF); crackF.connect(crackG); crackG.connect(target)
  crack.start(now); crack.stop(now + 1.7)
}

function startWeatherAmbient(weather: string): Handle {
  const c   = getCtx()
  const bus = c.createGain()
  bus.gain.setValueAtTime(0, c.currentTime)
  bus.connect(ambientBus!)

  const buf     = createNoiseBuffer(c)
  let running   = true
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  const sources: AudioBufferSourceNode[] = []

  function scheduleThunderLoop() {
    if (!running) return
    const delay = (16 + Math.random() * 34) * 1000
    pendingTimer = setTimeout(() => {
      if (running) { fireThunder(c, bus, buf, 0.65 + Math.random() * 0.35); scheduleThunderLoop() }
    }, delay)
  }

  function scheduleCreakLoop() {
    if (!running) return
    const delay = (10 + Math.random() * 20) * 1000
    pendingTimer = setTimeout(() => {
      if (!running) return
      const when = c.currentTime
      const osc = c.createOscillator(); const g = c.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(270 + Math.random() * 130, when)
      g.gain.setValueAtTime(0, when)
      g.gain.linearRampToValueAtTime(0.030, when + 0.05)
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.65)
      osc.connect(g); g.connect(bus)
      osc.start(when); osc.stop(when + 0.7)
      scheduleCreakLoop()
    }, delay)
  }

  switch (weather) {
    case 'rain':
      sources.push(loopNoise(c, buf, 'lowpass',  900, 0.8, 0.55, bus))
      sources.push(loopNoise(c, buf, 'bandpass', 2800, 1.5, 0.10, bus))
      bus.gain.linearRampToValueAtTime(0.092, c.currentTime + 2.0)
      break

    case 'storm':
      sources.push(loopNoise(c, buf, 'lowpass',  1400, 0.6, 0.75, bus))
      sources.push(loopNoise(c, buf, 'lowpass',   180, 1.0, 0.28, bus))
      bus.gain.linearRampToValueAtTime(0.112, c.currentTime + 1.5)
      // First thunder after 5–12 seconds, then random thereafter
      pendingTimer = setTimeout(() => {
        if (running) { fireThunder(c, bus, buf, 0.80); scheduleThunderLoop() }
      }, (5 + Math.random() * 7) * 1000)
      break

    case 'snow':
      // Muted low-frequency wind bed
      sources.push(loopNoise(c, buf, 'lowpass',   280, 0.5, 0.32, bus))
      // Narrow wind-moan resonance
      sources.push(loopNoise(c, buf, 'bandpass',   82, 3.0, 0.16, bus))
      bus.gain.linearRampToValueAtTime(0.058, c.currentTime + 3.5)
      // Occasional distant creak (branch under snow load)
      scheduleCreakLoop()
      break

    case 'drought':
      // Dry high-frequency hiss
      sources.push(loopNoise(c, buf, 'highpass', 2600, 1.0, 0.22, bus))
      // Warm low haze
      sources.push(loopNoise(c, buf, 'bandpass',  420, 0.4, 0.11, bus))
      bus.gain.linearRampToValueAtTime(0.062, c.currentTime + 2.5)
      break

    default: break
  }

  return {
    fadeOut(secs) {
      running = false
      if (pendingTimer) clearTimeout(pendingTimer)
      const now = c.currentTime
      bus.gain.cancelScheduledValues(now)
      bus.gain.setValueAtTime(bus.gain.value, now)
      bus.gain.linearRampToValueAtTime(0, now + secs)
    },
    stop() {
      running = false
      if (pendingTimer) clearTimeout(pendingTimer)
      sources.forEach(s => { try { s.stop() } catch { /* already ended */ } })
      bus.gain.setValueAtTime(0, c.currentTime)
    },
  }
}

// ─── Music context key ────────────────────────────────────────────────────────

export function computeMusicKey(gs: GameState): string {
  if (gs.colonyStage === 'ascendant') return 'ascendant'
  if (gs.awarenessStage === 3) return 'awareness_3'
  if (gs.awarenessStage === 2)
    return gs.time.phase === 'night' ? 'awareness_2_night' : 'awareness_2_day'

  const alive = Object.values(gs.creatures).filter(c => c.diedOnDay === null)
  const avgHealth = alive.length > 0
    ? alive.reduce((s, c) => s + c.health, 0) / alive.length
    : 100

  const hasFight    = gs.events.some(e => e.type === 'fight' && !e.resolved)
  const isCritical  = avgHealth < 28
  const winterPeril = gs.time.season === 'winter' && alive.length > 0 && alive.length <= 3
  if (hasFight || isCritical || winterPeril) return 'tension'

  if (alive.length <= 4 && gs.time.day < 30) return 'genesis'

  const phase = gs.time.phase === 'night' ? 'night' : 'day'
  return `${gs.time.season}_${phase}`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function updateMusicContext(key: string): void {
  if (muted || !key) return
  if (key === currentMusicKey) return
  const now = Date.now()
  if (now - lastMusicSwitch < MUSIC_COOLDOWN_MS) return
  if (activeMusicHandle) activeMusicHandle.fadeOut(CROSSFADE_SECS)
  activeMusicHandle = startMusicLoop(key, CROSSFADE_SECS)
  currentMusicKey   = key
  lastMusicSwitch   = now
}

export function updateWeatherAudio(weather: WeatherState): void {
  if (muted) return
  const key = weather ?? 'clear'
  if (key === currentWeatherKey) return
  if (activeWeatherHandle) activeWeatherHandle.fadeOut(2.5)
  activeWeatherHandle  = key !== 'clear' ? startWeatherAmbient(key) : null
  currentWeatherKey    = key
}

export function stopAudio(): void {
  activeMusicHandle?.stop();   activeMusicHandle   = null
  activeWeatherHandle?.stop(); activeWeatherHandle = null
  currentMusicKey = ''; currentWeatherKey = ''
}

export function setMuted(m: boolean): void {
  muted = m
  if (m) { stopAudio() }
  else   { unlockAudio(); lastMusicSwitch = 0; currentMusicKey = ''; currentWeatherKey = '' }
}

export function isMuted(): boolean { return muted }

// ─── SFX ─────────────────────────────────────────────────────────────────────

function sfxNote(freq: number, type: OscillatorType, dur: number, when: number, gain: number): void {
  const c = getCtx()
  if (!masterGain) return
  const osc = c.createOscillator(); const og = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, when)
  og.gain.setValueAtTime(0, when)
  og.gain.linearRampToValueAtTime(gain, when + 0.012)
  og.gain.linearRampToValueAtTime(0, when + dur - 0.012)
  osc.connect(og); og.connect(masterGain)
  osc.start(when); osc.stop(when + dur)
}

export function sfxDrop(): void {
  if (muted) return
  const t = getCtx().currentTime
  sfxNote(N.G5, 'sine', 0.12, t,        0.09)
  sfxNote(N.C5, 'sine', 0.10, t + 0.08, 0.06)
}

export function sfxHeal(): void {
  if (muted) return
  const t = getCtx().currentTime
  ;[N.C4, N.E4, N.G4, N.C5].forEach((f, i) => sfxNote(f, 'sine', 0.12, t + i * 0.09, 0.10))
}

export function sfxDeath(): void {
  if (muted) return
  const t = getCtx().currentTime
  ;[N.G3, N.F3, N.E3, N.C3].forEach((f, i) => sfxNote(f, 'sine', 0.18, t + i * 0.13, 0.08))
}

export function sfxEvent(): void {
  if (muted) return
  const t = getCtx().currentTime
  sfxNote(N.A4, 'triangle', 0.08, t,        0.08)
  sfxNote(N.A4, 'triangle', 0.06, t + 0.12, 0.05)
}

export function sfxAscension(): void {
  if (muted) return
  const t = getCtx().currentTime
  ;[N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.A5].forEach((f, i) =>
    sfxNote(f, 'sine', 0.45, t + i * 0.16, 0.14))
}
