'use client'

import { useNowSeconds } from '@/hooks/use-now-seconds'
import { compactCountdown } from '@/lib/raceTicker'
import { cn } from '@/lib/utils'

/** Countdown to the race start in dot-matrix digits: ticker size by default, `lg` for the race thread panel. */
const TickerClock = ({ startIso, size = 'sm' }: { startIso: string; size?: 'sm' | 'lg' }) => {
  const digits = cn('display leading-none tabular-nums text-display', size === 'lg' ? 'text-4xl' : 'text-lg')
  const now = useNowSeconds()

  if (now === null) {
    return (
      <span className={digits} aria-hidden='true'>
        --:--
      </span>
    )
  }
  const left = Date.parse(startIso) / 1000 - now
  if (left <= 0) return null
  return (
    <span role='timer' aria-label={`Faltan ${compactCountdown(left)}`} className={digits}>
      {compactCountdown(left)}
    </span>
  )
}

export default TickerClock
