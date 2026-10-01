import Link from 'next/link'

import { raceStatus, sessionStart, RACE_DURATION_HOURS } from '@/lib/f1/calendar'
import type { Race } from '@/lib/f1/schemas'

import Countdown from './Countdown'
import SessionList from './SessionList'

interface NextRaceCardProps {
  race: Race
  now?: Date
}

/** The next (or current) race: countdown, circuit and the weekend's sessions in the viewer's time zone. */
const NextRaceCard = ({ race, now = new Date() }: NextRaceCardProps) => {
  const { start } = sessionStart(race.date, race.time)
  const end = new Date(start.getTime() + RACE_DURATION_HOURS * 3600 * 1000)
  const status = raceStatus(race, now)

  return (
    <section
      aria-labelledby='next-race-title'
      className='relative overflow-hidden rounded-2xl border border-input bg-card p-5 sm:p-8'>
      <div className='dot-grid pointer-events-none absolute inset-0 opacity-50' aria-hidden='true' />

      <div className='relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end'>
        <div>
          <p className='label flex items-center gap-2'>
            <span className={status === 'in-progress' ? 'text-signal' : 'text-display'} aria-hidden='true'>●</span>
            {status === 'in-progress' ? 'EN CURSO' : 'PRÓXIMO GP'} · RONDA {race.round}
          </p>
          <h2 id='next-race-title' className='mt-3 text-2xl text-display sm:text-3xl'>
            {race.raceName}
          </h2>
          <p className='label mt-2'>
            {race.Circuit.circuitName} · {race.Circuit.Location.locality}, {race.Circuit.Location.country}
          </p>
        </div>

        <Countdown startIso={start.toISOString()} endIso={end.toISOString()} />
      </div>

      <div className='relative mt-8'>
        <SessionList race={race} />
      </div>

      <div className='relative mt-6 flex flex-wrap gap-2'>
        <Link
          href={`/f1-dashboard/carrera/${race.season}/${race.round}`}
          className='label rounded-full border border-input px-4 py-2.5 text-display transition-colors hover:border-display'>
          VER CARRERA
        </Link>
        <Link
          href='/f1-dashboard/carreras'
          className='label rounded-full border border-border px-4 py-2.5 transition-colors hover:text-display'>
          CALENDARIO COMPLETO
        </Link>
      </div>
    </section>
  )
}

export default NextRaceCard
