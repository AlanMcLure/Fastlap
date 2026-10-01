import Link from 'next/link'

import Countdown from '@/components/f1-dashboard/Countdown'
import { sessionStart, RACE_DURATION_HOURS } from '@/lib/f1/calendar'
import { getNextRace } from '@/lib/f1/queries'
import type { Race } from '@/lib/f1/schemas'

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])

/**
 * Stand-in while the module streams in. It has the height of the finished card (measured: 242 px on
 * phones, 266 px from md up), so the feed below does not jump when the card arrives (CLS).
 */
export const NextRacePlaceholder = () => (
  <div className='h-[242px] rounded-xl border border-border bg-card p-5 md:h-[266px]' aria-hidden='true'>
    <div className='h-3 w-1/2 animate-pulse rounded bg-muted' />
  </div>
)

/**
 * Next race with its countdown, for the home page. The social home must never wait for
 * (or fail because of) the F1 API: it gives up after a few seconds and renders nothing.
 */
const NextRaceModule = async ({ showDashboardLink }: { showDashboardLink: boolean }) => {
  let race: Race | null = null
  try {
    race = await withTimeout(getNextRace(), 4000)
  } catch (error) {
    console.error('Next race module skipped', error)
    return null
  }
  if (!race) return null

  const { start } = sessionStart(race.date, race.time)
  const end = new Date(start.getTime() + RACE_DURATION_HOURS * 3600 * 1000)

  return (
    <section
      aria-label='Próximo Gran Premio'
      className='relative overflow-hidden rounded-xl border border-input bg-card p-5'>
      <div className='dot-grid pointer-events-none absolute inset-0 opacity-40' aria-hidden='true' />
      <div className='relative'>
        <p className='label flex items-center gap-2'>
          <span className='text-display' aria-hidden='true'>●</span> PRÓXIMO GP · RONDA {race.round}
        </p>
        <h2 className='mt-2 text-lg leading-snug text-display'>{race.raceName}</h2>
        <p className='label mt-1'>
          {race.Circuit.Location.locality}, {race.Circuit.Location.country}
        </p>
        <div className='mt-5'>
          <Countdown startIso={start.toISOString()} endIso={end.toISOString()} />
        </div>
        <div className='mt-5 flex flex-wrap gap-2'>
          <Link
            href={`/gp/${race.season}/${race.round}`}
            className='label rounded-full border border-input px-4 py-2.5 text-display transition-colors hover:border-display'>
            HILO Y VOTACIÓN
          </Link>
          {showDashboardLink && (
            <Link
              href={`/f1-dashboard/carrera/${race.season}/${race.round}`}
              className='label rounded-full border border-input px-4 py-2.5 text-display transition-colors hover:border-display'>
              VER EN F1
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

export default NextRaceModule
