import Link from 'next/link'

import { sessionStart } from '@/lib/f1/calendar'
import { getNextRace } from '@/lib/f1/queries'
import { predictionDeadline } from '@/lib/league'
import { TICKER_LABEL, tickerState } from '@/lib/raceTicker'
import { withTimeout } from '@/lib/timeout'
import { cn } from '@/lib/utils'
import TickerClock from './TickerClock'

/** The ticker's fixed-height bar: the page below is laid out for it, so it never jumps. */
export const TickerBar = ({ children }: { children?: React.ReactNode }) => (
  <div className='h-10 border-t border-border bg-card'>
    <div className='container mx-auto flex h-full max-w-7xl items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] sm:gap-5'>
      {children}
    </div>
  </div>
)

/**
 * One slim line under the navigation, like a TV caption: the next (or current) Grand Prix, a
 * countdown and the way to its thread and predictions. The F1 API must never hold the page:
 * after a few seconds the bar stays empty.
 */
const RaceTicker = async () => {
  const race = await withTimeout(getNextRace(), 4000).catch(() => null)
  if (!race) return <TickerBar />

  const now = new Date()
  const state = tickerState(race, now)
  const deadline = predictionDeadline(race, 'RACE')
  const canPredict = !deadline || now < deadline
  const { start } = sessionStart(race.date, race.time)
  const hub = `/gp/${race.season}/${race.round}`
  const hot = state !== 'next'
  const name = race.raceName.replace(/ Grand Prix/, '').trim()

  return (
    <TickerBar>
      <span className={cn('flex shrink-0 items-center gap-2', hot ? 'text-signal' : 'text-muted-foreground')}>
        <span className={cn('h-2 w-2 rounded-full', hot ? 'bg-signal' : 'bg-faint')} aria-hidden='true' />
        <span className='hidden sm:inline'>{TICKER_LABEL[state]}</span>
        <span className='sm:hidden'>{state === 'next' ? 'PRÓXIMO' : state === 'live' ? 'EN CARRERA' : 'HOY'}</span>
      </span>
      <Link href={hub} className='min-w-0 truncate text-display underline-offset-4 hover:underline'>
        GP {name}
        <span className='hidden text-muted-foreground md:inline'>
          {' '}· {race.Circuit.Location.locality} · R{race.round}
        </span>
      </Link>
      {state !== 'live' && <TickerClock startIso={start.toISOString()} />}
      <Link href={hub} className='ml-auto hidden shrink-0 text-display underline-offset-4 hover:underline sm:inline'>
        HILO DEL GP
      </Link>
      <Link
        href='/pronosticos'
        className={cn(
          'hidden shrink-0 rounded-full px-3 py-1.5 font-bold transition-opacity hover:opacity-90 sm:inline',
          hot && canPredict ? 'bg-signal text-black' : 'border border-input text-display'
        )}>
        {canPredict ? 'PRONOSTICAR' : 'PRONÓSTICOS'}
      </Link>
      <Link href={hub} className='ml-auto text-base text-display sm:hidden' aria-label='Ir al hilo del GP'>
        →
      </Link>
    </TickerBar>
  )
}

export default RaceTicker
