import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { getSummary, isProfilerEnabled, setProfilerEnabled, resetProfiler } from '@/engine/profiler'
import { THEME } from '@/ui/theme'

// Dev-only tick profiler overlay. Toggle with backtick (`). When disabled the
// component still mounts but renders nothing; the profiler module itself
// short-circuits all timing work when off, so leaving this mounted is free.

const Wrap = styled.div`
  position: absolute;
  top: 60px;
  left: 12px;
  background: rgba(8, 10, 14, 0.86);
  border: 1px solid ${THEME.borderMid};
  border-radius: ${THEME.radius.sm}px;
  padding: ${THEME.space.md}px ${THEME.space.lg}px;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 10px;
  line-height: 1.55;
  color: ${THEME.textSecondary};
  letter-spacing: 0.04em;
  z-index: 50;
  pointer-events: auto;
  min-width: 184px;
  user-select: none;
`
const Title = styled.div`
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.18em;
  color: ${THEME.amber};
  margin-bottom: ${THEME.space.sm}px;
  display: flex; justify-content: space-between; align-items: center;
`
const Row = styled.div<{ $hot: boolean }>`
  display: flex; justify-content: space-between; gap: ${THEME.space.md}px;
  color: ${p => p.$hot ? THEME.threat : THEME.textSecondary};
`
const Hint = styled.div`
  margin-top: ${THEME.space.sm}px;
  color: ${THEME.textTertiary};
  font-size: 9px;
  letter-spacing: 0.08em;
`
const ResetBtn = styled.button`
  background: transparent;
  border: 1px solid ${THEME.border};
  color: ${THEME.textTertiary};
  font-family: inherit;
  font-size: 9px; font-weight: 700;
  padding: 1px 6px;
  border-radius: ${THEME.radius.xs}px;
  cursor: pointer;
  letter-spacing: 0.12em; text-transform: uppercase;
  &:hover { color: ${THEME.amber}; border-color: ${THEME.amber}; }
`

const HOT_MS = 8   // a phase running this long is the bottleneck

export function ProfilerHud() {
  const [, setTick] = useState(0)
  const [on, setOn] = useState(isProfilerEnabled())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.key === '`' || e.key === '~') {
        const next = !isProfilerEnabled()
        setProfilerEnabled(next)
        setOn(next)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!on) return
    const id = window.setInterval(() => setTick(t => t + 1), 250)
    return () => window.clearInterval(id)
  }, [on])

  if (!on) return null

  const { stats, totalTicks } = getSummary()
  // Sort phases by mean cost descending; keep 'total' pinned at the bottom.
  const orderable = stats.filter(s => s.phase !== 'total').sort((a, b) => b.mean - a.mean)
  const total = stats.find(s => s.phase === 'total')

  return (
    <Wrap>
      <Title>
        TICK PROFILER
        <ResetBtn onClick={resetProfiler}>reset</ResetBtn>
      </Title>
      {orderable.map(s => (
        <Row key={s.phase} $hot={s.mean >= HOT_MS}>
          <span>{s.phase}</span>
          <span>{s.mean.toFixed(2)} <span style={{ opacity: 0.5 }}>· max {s.max.toFixed(1)}</span></span>
        </Row>
      ))}
      {total && (
        <Row key="total" $hot={total.mean >= HOT_MS * 2} style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${THEME.border}` }}>
          <span style={{ fontWeight: 700 }}>total</span>
          <span style={{ fontWeight: 700 }}>{total.mean.toFixed(2)} · max {total.max.toFixed(1)}</span>
        </Row>
      )}
      <Hint>ticks recorded: {totalTicks} · press ` to hide</Hint>
    </Wrap>
  )
}
