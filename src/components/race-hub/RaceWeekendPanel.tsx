import Link from 'next/link'

import LocalTime from '@/components/f1-dashboard/LocalTime'
import TickerClock from '@/components/race-ticker/TickerClock'
import { sessionStart, weekendSessions } from '@/lib/f1/calendar'
import { getCalendar, getRaceResults } from '@/lib/f1/queries'
import type { Race } from '@/lib/f1/schemas'
import { predictionDeadline } from '@/lib/league'
import { hasReplay } from '@/lib/replay/replays'
import { sessionState } from '@/lib/postPage'
import { TICKER_LABEL, tickerState } from '@/lib/raceTicker'
import { withTimeout } from '@/lib/timeout'
import { cn } from '@/lib/utils'

const STATE_LABEL = { done: 'HECHO', live: 'EN CURSO', upcoming: '' } as const

/**
 * The weekend above the conversation of an official race thread: status and countdown (or the
 * podium once there are results), the sessions, and the way to predictions and Driver of the Day.
 * The F1 API must never hold the thread: after a few seconds the panel is just left out.
 */
const RaceWeekendPanel = async ({ season, round }: { season: number; round: number }) => {
  const [calendar, results] = await Promise.allSettled([
    withTimeout(getCalendar(season), 4000),
    withTimeout(getRaceResults(season, round), 4000),
  ])
  const withResults = results.status === 'fulfilled' ? results.value : null
  const race: Race | undefined =
    withResults ?? (calendar.status === 'fulfilled' ? calendar.value.find((r) => r.round === round) : undefined)
  if (!race) return null

  const now = new Date()
  const podium = withResults?.Results.slice(0, 3) ?? []
  const replay = podium.length > 0 ? await hasReplay(season, round).catch(() => false) : false
  const fastest = withResults?.Results.find((r) => r.FastestLap?.rank === 1)
  const state = tickerState(race, now)
  const { start } = sessionStart(race.date, race.time)
  const hub = `/gp/${season}/${round}`
  const deadline = predictionDeadline(race, 'RACE')
  const predictionsOpen = !deadline || now < deadline

  return (
    <section aria-label='El fin de semana' className='overflow-hidden rounded-xl border border-input'>
      {podium.length > 0 ? (
        <div className='border-b border-border bg-card px-5 py-4'>
          <p className='label'>RESULTADO</p>
          <ol className='mt-3 space-y-2'>
            {podium.map((r) => (
              <li key={r.Driver.driverId} className='flex items-baseline gap-3'>
                <span className='w-8 font-mono font-bold text-display'>P{r.position}</span>
                <span className='flex-1 text-display'>
                  {r.Driver.givenName} {r.Driver.familyName}
                </span>
                <span className='label'>{r.Constructor.name}</span>
              </li>
            ))}
          </ol>
          {replay && (
            <Link href={`/gp/${season}/${round}/repeticion`} className='label mt-3 inline-flex items-center gap-2 text-display hover:underline'>
              VER LA REPETICIÓN <span aria-hidden='true'>→</span>
            </Link>
          )}
          {fastest && (
            <p className='mt-3 text-sm text-muted-foreground'>
              Vuelta rápida: <span className='text-display'>{fastest.Driver.familyName}</span>
              {fastest.FastestLap?.Time?.time && <span className='font-mono'> · {fastest.FastestLap.Time.time}</span>}
            </p>
          )}
        </div>
      ) : (
        <div className='relative flex flex-wrap items-center gap-4 border-b border-border bg-card px-5 py-4'>
          <div className='dot-grid pointer-events-none absolute inset-0 opacity-40' aria-hidden='true' />
          <p className={cn('label relative flex-1', state !== 'next' && 'text-signal')}>
            <span aria-hidden='true'>● </span>
            {TICKER_LABEL[state]}
          </p>
          {state !== 'live' && (
            <span className='relative'>
              <TickerClock startIso={start.toISOString()} size='lg' />
            </span>
          )}
        </div>
      )}

      <ol className='divide-y divide-border px-5 text-sm'>
        {weekendSessions(race).map((session) => {
          const s = sessionState(session, now)
          return (
            <li
              key={session.key}
              className={cn(
                'flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5',
                s === 'done' ? 'text-muted-foreground' : 'text-display'
              )}>
              <span>{session.label}</span>
              <span className={cn('label', s === 'live' && 'text-signal')}>
                {s === 'upcoming' ? <LocalTime iso={session.start.toISOString()} timeKnown={session.timeKnown} /> : STATE_LABEL[s]}
              </span>
            </li>
          )
        })}
      </ol>

      <div className='grid border-t border-border sm:grid-cols-2'>
        <Link href='/pronosticos' className='flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-accent sm:border-r sm:border-border'>
          <span>
            <span className='label block'>PRONÓSTICOS</span>
            <span className='text-sm text-display'>
              {podium.length > 0 ? 'Mira cómo han puntuado' : predictionsOpen ? 'Haz el tuyo antes de la clasificación' : 'Cerrados hasta el resultado'}
            </span>
          </span>
          <span aria-hidden='true'>→</span>
        </Link>
        <Link href={hub} className='flex items-center justify-between gap-3 border-t border-border px-5 py-3.5 transition-colors hover:bg-accent sm:border-t-0'>
          <span>
            <span className='label block'>PILOTO DEL DÍA</span>
            <span className='text-sm text-display'>{podium.length > 0 ? 'Vota en el hub del GP' : 'Se abre al acabar la carrera'}</span>
          </span>
          <span aria-hidden='true'>→</span>
        </Link>
      </div>
    </section>
  )
}

export default RaceWeekendPanel
