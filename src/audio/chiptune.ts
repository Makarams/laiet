import type { GameState } from '@/types'
import { getAudioCtx, unlockAudio } from './unlock'

export { unlockAudio }

// ─── Audio context (singleton) ────────────────────────────────────────────────

let masterGain: GainNode | null = null
let muted = false
let currentKey = ''
let currentLoop: LoopHandle | null = null
let lastContextSwitch = 0

const CROSSFADE_SECS = 2.2
const CONTEXT_COOLDOWN_MS = 3_000

function getCtx(): AudioContext {
  const c = getAudioCtx()
  if (!masterGain) {
    masterGain = c.createGain()
    masterGain.gain.value = 0.26
    masterGain.connect(c.destination)
  }
  return c
}

// ─── Note table (Hz) ──────────────────────────────────────────────────────────

const N: Record<string, number> = {
  C2: 65.41, G2: 98.00,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  Gb4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00, B5: 987.77,
}
const R = 0 // rest — scheduleNote skips zeros

// ─── Track definitions ────────────────────────────────────────────────────────
//
// Each track is a set of short phrases chosen randomly each cycle.
// R (= 0) = silence for that step. Keeps music sparse and non-distracting.
//
// beatLen  = seconds per step (higher = slower, more ambient)
// noteLen  = how long each oscillator rings (always < beatLen)
// gain     = per-note amplitude before masterGain scaling
// gapBeats = silence added after each phrase (in beats) — adds natural breathing room
// bassFreqs = [root, fifth] for a quiet bass note under each phrase, or null
// bassGain = amplitude of bass note

interface Track {
  patterns: number[][]
  wave: OscillatorType
  beatLen: number
  noteLen: number
  gain: number
  gapBeats: number
  bassFreqs: [number, number] | null
  bassGain: number
}

const TRACKS: Record<string, Track> = {

  // ── Fragile open: colony just awakened ────────────────────────────────────────
  genesis: {
    patterns: [
      [N.C4, R,    R,    R,    N.E4, R,    R,    R   ],
      [R,    N.G4, R,    R,    R,    N.E4, R,    R   ],
      [N.C4, R,    N.E4, R,    R,    R,    N.G4, R   ],
      [R,    R,    N.E4, R,    R,    N.C4, R,    R   ],
    ],
    wave: 'sine', beatLen: 0.58, noteLen: 0.40, gain: 0.065,
    gapBeats: 3,
    bassFreqs: null, bassGain: 0,
  },

  // ── Hopeful ascending — C major pentatonic (C D E G A) ───────────────────────
  spring_day: {
    patterns: [
      [N.E4, R,    N.G4, R,    N.A4, N.G4, R,    N.E4, R,    N.C4],
      [N.C4, R,    N.E4, R,    N.G4, R,    N.A4, R,    N.G4      ],
      [N.G4, R,    N.A4, R,    N.C5, R,    N.A4, R,    N.G4, N.E4],
      [N.D4, R,    N.E4, N.G4, R,    N.E4, R,    N.D4, R,    N.C4],
    ],
    wave: 'triangle', beatLen: 0.30, noteLen: 0.20, gain: 0.085,
    gapBeats: 2,
    bassFreqs: [N.C3, N.G3], bassGain: 0.036,
  },

  // ── Same scale, hushed — lower register, slower ───────────────────────────────
  spring_night: {
    patterns: [
      [N.E3, N.G3, N.A3, N.C4              ],
      [N.C3, R,    N.E3, R,    N.G3        ],
      [N.G3, N.A3, N.C4, R,    N.G3        ],
      [R,    N.E3, R,    N.G3, R,    N.E3  ],
    ],
    wave: 'sine', beatLen: 0.44, noteLen: 0.30, gain: 0.062,
    gapBeats: 4,
    bassFreqs: null, bassGain: 0,
  },

  // ── Warm and settled — G major pentatonic (G A B D E) ────────────────────────
  summer_day: {
    patterns: [
      [N.G4, R,    N.A4, R,    N.B4, N.A4, R,    N.G4, R,    N.E4],
      [N.D4, R,    N.E4, R,    N.G4, R,    N.A4, R,    N.G4      ],
      [N.G4, R,    N.D4, R,    N.E4, N.G4, R,    N.B4            ],
      [N.A4, R,    N.G4, N.E4, R,    N.D4, R,    N.E4, R,    N.G4],
    ],
    wave: 'triangle', beatLen: 0.32, noteLen: 0.22, gain: 0.080,
    gapBeats: 2,
    bassFreqs: [N.G3, N.D3], bassGain: 0.034,
  },

  // ── Lazy, sparse — large gaps between phrases ─────────────────────────────────
  summer_night: {
    patterns: [
      [N.G4, R,    R,    N.A4, R,    R,    N.D4, R   ],
      [N.D4, R,    R,    R,    N.G4, R,    R,    R   ],
      [R,    N.A4, R,    R,    R,    N.G4, R,    N.E4],
      [N.E4, R,    N.D4, R,    R,    R,    N.G4, R   ],
    ],
    wave: 'sine', beatLen: 0.50, noteLen: 0.34, gain: 0.062,
    gapBeats: 4,
    bassFreqs: null, bassGain: 0,
  },

  // ── Melancholic descent — A minor pentatonic (A C D E G) ─────────────────────
  autumn_day: {
    patterns: [
      [N.A4, N.G4, R,    N.E4, N.D4, R,    N.C4        ],
      [N.E4, R,    N.D4, N.C4, R,    N.A3, R,    N.C4  ],
      [N.G4, R,    N.E4, R,    N.D4, N.E4, R,    N.G4  ],
      [N.C4, R,    N.E4, N.G4, R,    N.E4, N.D4, R, N.C4],
    ],
    wave: 'triangle', beatLen: 0.32, noteLen: 0.22, gain: 0.080,
    gapBeats: 3,
    bassFreqs: [N.A3, N.E3], bassGain: 0.032,
  },

  // ── Darker — A natural minor, much slower ─────────────────────────────────────
  autumn_night: {
    patterns: [
      [N.A3, N.C4, R,    N.E4              ],
      [N.E4, R,    N.D4, R,    N.C4, N.A3  ],
      [N.C4, R,    R,    N.A3, R,    N.G3  ],
      [R,    N.A3, R,    N.C4, R,    R     ],
    ],
    wave: 'sine', beatLen: 0.50, noteLen: 0.34, gain: 0.062,
    gapBeats: 4,
    bassFreqs: null, bassGain: 0,
  },

  // ── Cold isolation — D minor pentatonic (D F A C) ────────────────────────────
  winter_day: {
    patterns: [
      [N.D4, R,    N.F4, R,    R,    N.A4, R,    R   ],
      [N.A4, R,    N.F4, R,    N.D4, R,    R,    R   ],
      [R,    N.D4, R,    R,    N.F4, R,    N.A4, R   ],
      [N.D5, R,    R,    N.C5, R,    N.A4, R,    R   ],
    ],
    wave: 'triangle', beatLen: 0.50, noteLen: 0.34, gain: 0.070,
    gapBeats: 5,
    bassFreqs: null, bassGain: 0,
  },

  // ── Near silence — long intervals, barely audible ─────────────────────────────
  winter_night: {
    patterns: [
      [N.D4, R, R, R, R, R, N.A4, R],
      [R,    R, N.D5, R, R, R, R,  R],
      [N.A4, R, R, R, N.D4, R, R,  R],
      [R,    R, R, N.F4, R, R, R,  R],
    ],
    wave: 'sine', beatLen: 0.70, noteLen: 0.50, gain: 0.055,
    gapBeats: 6,
    bassFreqs: null, bassGain: 0,
  },

  // ── Uneasy — minor thirds, slower and softer than before ─────────────────────
  tension: {
    patterns: [
      [N.A4, R,    N.Bb4, R,    N.G4,  R,    N.Ab4, N.A4  ],
      [N.E4, R,    N.F4,  R,    N.Eb4, R,    N.E4,  R     ],
      [N.A3, R,    N.Bb3, R,    N.E4,  R,    N.Eb4, N.A4  ],
      [N.G4, R,    N.Ab4, N.A4, R,     N.Bb4,R,     N.G4  ],
    ],
    wave: 'triangle', beatLen: 0.22, noteLen: 0.15, gain: 0.065,
    gapBeats: 1,
    bassFreqs: [N.A3, N.E3], bassGain: 0.026,
  },

  // ── Eerie — only perfect 5ths, very slow, colony grows aware ─────────────────
  awareness_2_day: {
    patterns: [
      [N.A4, R, R, R, R, R, N.E5, R, R, R, R, R],
      [N.D4, R, R, R, R, N.A4, R, R, R, R, N.D4, R],
      [N.G4, R, R, R, N.D5, R, R, R, R, N.G4, R, R],
      [R, R, N.E4, R, R, R, R, R, N.B4, R, R, R],
    ],
    wave: 'sine', beatLen: 0.70, noteLen: 0.50, gain: 0.060,
    gapBeats: 4,
    bassFreqs: null, bassGain: 0,
  },

  // ── Same, approaching silence ─────────────────────────────────────────────────
  awareness_2_night: {
    patterns: [
      [N.A4, R, R, R, R, R, R, R, R, R, R, R],
      [R, R, R, R, N.E5, R, R, R, R, R, R, R],
      [N.D5, R, R, R, R, R, R, R, N.A4, R, R, R],
      [R, R, R, R, R, R, N.G4, R, R, R, R, R],
    ],
    wave: 'sine', beatLen: 0.90, noteLen: 0.64, gain: 0.048,
    gapBeats: 6,
    bassFreqs: null, bassGain: 0,
  },

  // ── Pure, watching — colony addresses the caretaker directly ─────────────────
  awareness_3: {
    patterns: [
      [N.C4, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
      [R, R, R, R, R, R, N.G4, R, R, R, R, R, R, R, R, R],
      [R, R, N.E4, R, R, R, R, R, R, R, N.G4, R, R, R, R, R],
      [N.C5, R, R, R, R, R, R, R, R, R, R, R, R, R, N.G4, R],
    ],
    wave: 'sine', beatLen: 0.95, noteLen: 0.72, gain: 0.052,
    gapBeats: 8,
    bassFreqs: null, bassGain: 0,
  },

  // ── Transcendent — full ascending C major, colony has ascended ───────────────
  ascendant: {
    patterns: [
      [N.C5, R, N.E5, R, N.G5, R, N.A5, R, N.G5, R, N.E5],
      [N.A4, R, N.C5, R, N.E5, R, N.G5, R, N.E5, R, N.C5],
      [N.G4, R, N.B4, R, N.D5, R, N.G5, R, N.D5, R, N.B4],
      [N.E4, R, N.G4, R, N.C5, R, N.E5, R, N.G5, R, N.E5],
    ],
    wave: 'sine', beatLen: 0.26, noteLen: 0.20, gain: 0.090,
    gapBeats: 2,
    bassFreqs: [N.C3, N.G3], bassGain: 0.040,
  },
}

// ─── Loop engine ──────────────────────────────────────────────────────────────

interface LoopHandle {
  fadeOut(secs: number): void
  stop(): void
}

function scheduleNote(
  c: AudioContext,
  target: AudioNode,
  freq: number,
  wave: OscillatorType,
  dur: number,
  when: number,
  g: number,
): void {
  if (freq === R || freq === 0) return
  const osc = c.createOscillator()
  const og  = c.createGain()
  osc.type  = wave
  osc.frequency.setValueAtTime(freq, when)
  og.gain.setValueAtTime(0, when)
  og.gain.linearRampToValueAtTime(g, when + 0.022)
  og.gain.linearRampToValueAtTime(0, when + dur - 0.022)
  osc.connect(og)
  og.connect(target)
  osc.start(when)
  osc.stop(when + dur)
}

function startLoop(key: string, fadeInSecs: number): LoopHandle {
  const c = getCtx()
  const loopGain = c.createGain()
  loopGain.gain.setValueAtTime(0, c.currentTime)
  loopGain.connect(masterGain!)

  const track = TRACKS[key] ?? TRACKS.genesis
  let running = true

  function schedulePhrase(when: number) {
    if (!running || muted) return

    const { patterns, wave, beatLen, noteLen, gain, gapBeats, bassFreqs, bassGain } = track
    const pat = patterns[Math.floor(Math.random() * patterns.length)]

    // Quiet bass pedal sustaining under the phrase
    if (bassFreqs) {
      const bf = bassFreqs[Math.random() < 0.65 ? 0 : 1]
      scheduleNote(c, loopGain, bf, 'triangle', beatLen * pat.length * 0.55, when, bassGain)
    }

    for (let i = 0; i < pat.length; i++) {
      scheduleNote(c, loopGain, pat[i], wave, noteLen, when + i * beatLen, gain)
    }

    // Phrase duration + breathing gap (gapBeats adds silence after each phrase)
    const phraseDur = pat.length * beatLen + gapBeats * beatLen
    const msUntilNext = Math.max(0, phraseDur * 1000 - 60)
    setTimeout(() => schedulePhrase(when + phraseDur), msUntilNext)
  }

  function begin() {
    if (!running) return
    const startTime = c.currentTime + 0.12
    loopGain.gain.setValueAtTime(0, c.currentTime)
    loopGain.gain.linearRampToValueAtTime(1.0, c.currentTime + fadeInSecs)
    schedulePhrase(startTime)
  }

  // If the AudioContext is suspended (e.g. before a user gesture), wait for
  // it to resume before scheduling any notes so times aren't in the past.
  if (c.state !== 'running') {
    c.resume().then(begin).catch(() => {})
  } else {
    begin()
  }

  return {
    fadeOut(secs: number) {
      // Stop scheduling new phrases immediately; let scheduled notes fade via gain.
      running = false
      const now = c.currentTime
      loopGain.gain.cancelScheduledValues(now)
      loopGain.gain.setValueAtTime(loopGain.gain.value, now)
      loopGain.gain.linearRampToValueAtTime(0, now + secs)
    },
    stop() {
      running = false
      const now = c.currentTime
      loopGain.gain.cancelScheduledValues(now)
      loopGain.gain.setValueAtTime(0, now)
    },
  }
}

// ─── Music context key ────────────────────────────────────────────────────────
//
// Derives a stable string key from game state. Called each tick from the UI
// selector; only triggers a music change when the string value changes.

export function computeMusicKey(gs: GameState): string {
  // Highest priority: special endings / late-game stages
  if (gs.colonyStage === 'ascendant') return 'ascendant'
  if (gs.awarenessStage === 3) return 'awareness_3'
  if (gs.awarenessStage === 2) {
    return gs.time.phase === 'night' ? 'awareness_2_night' : 'awareness_2_day'
  }

  const alive = Object.values(gs.creatures).filter(c => c.diedOnDay === null)
  const avgHealth = alive.length > 0
    ? alive.reduce((s, c) => s + c.health, 0) / alive.length
    : 100

  // Tension: active unresolved fight, critical health, or tiny winter colony
  const hasFight   = gs.events.some(e => e.type === 'fight' && !e.resolved)
  const isCritical = avgHealth < 28
  const winterPeril = gs.time.season === 'winter' && alive.length > 0 && alive.length <= 3
  if (hasFight || isCritical || winterPeril) return 'tension'

  // Genesis: very new, still tiny colony
  if (alive.length <= 4 && gs.time.day < 30) return 'genesis'

  // Default: season + day/night
  const phase = gs.time.phase === 'night' ? 'night' : 'day'
  return `${gs.time.season}_${phase}`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function updateMusicContext(key: string): void {
  if (muted || !key) return
  if (key === currentKey) return
  const now = Date.now()
  if (now - lastContextSwitch < CONTEXT_COOLDOWN_MS) return

  if (currentLoop) currentLoop.fadeOut(CROSSFADE_SECS)
  currentLoop = startLoop(key, CROSSFADE_SECS)
  currentKey  = key
  lastContextSwitch = now
}

export function stopAudio(): void {
  if (currentLoop) { currentLoop.stop(); currentLoop = null }
  currentKey = ''
}

export function setMuted(m: boolean): void {
  muted = m
  if (m) {
    stopAudio()
  } else {
    // Ensure the AudioContext is running before the next updateMusicContext call.
    // This is called from unlockAudio() which is invoked inside a click handler,
    // so ctx.resume() has user-gesture context here.
    unlockAudio()
    lastContextSwitch = 0
    currentKey = ''
  }
}

export function isMuted(): boolean {
  return muted
}

// ─── SFX ─────────────────────────────────────────────────────────────────────

function sfxNote(
  freq: number, type: OscillatorType,
  dur: number, when: number, gain: number,
): void {
  const c = getCtx()
  if (!masterGain) return
  const osc = c.createOscillator()
  const og  = c.createGain()
  osc.type  = type
  osc.frequency.setValueAtTime(freq, when)
  og.gain.setValueAtTime(0, when)
  og.gain.linearRampToValueAtTime(gain, when + 0.015)
  og.gain.linearRampToValueAtTime(0, when + dur - 0.015)
  osc.connect(og)
  og.connect(masterGain)
  osc.start(when)
  osc.stop(when + dur)
}

export function sfxDrop(): void {
  if (muted) return
  const t = getCtx().currentTime
  // Soft two-tone chime instead of harsh square blip
  sfxNote(N.G5, 'sine', 0.12, t,        0.09)
  sfxNote(N.C5, 'sine', 0.10, t + 0.08, 0.06)
}

export function sfxHeal(): void {
  if (muted) return
  const t = getCtx().currentTime
  ;[N.C4, N.E4, N.G4, N.C5].forEach((f, i) =>
    sfxNote(f, 'sine', 0.12, t + i * 0.09, 0.10))
}

export function sfxDeath(): void {
  if (muted) return
  const t = getCtx().currentTime
  ;[N.G3, N.F3, N.E3, N.C3].forEach((f, i) =>
    sfxNote(f, 'sine', 0.18, t + i * 0.13, 0.08))
}

export function sfxEvent(): void {
  if (muted) return
  const t = getCtx().currentTime
  // Gentle double-tap instead of sharp square pulse
  sfxNote(N.A4, 'triangle', 0.08, t,        0.08)
  sfxNote(N.A4, 'triangle', 0.06, t + 0.12, 0.05)
}

export function sfxAscension(): void {
  if (muted) return
  const t = getCtx().currentTime
  ;[N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.A5].forEach((f, i) =>
    sfxNote(f, 'sine', 0.45, t + i * 0.16, 0.14))
}
