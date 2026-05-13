let ctx: AudioContext | null = null

export function getAudioCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function unlockAudio(): void {
  const c = getAudioCtx()
  if (c.state === 'suspended') c.resume().catch(() => {})
}
