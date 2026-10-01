import Link from 'next/link'

import { raceStatus, type RaceStatus } from '@/lib/f1/calendar'
import { formatRaceDay } from '@/lib/f1/format'
import type { Race } from '@/lib/f1/schemas'

const STATUS_LABEL: Record<RaceStatus, string> = {
  finished: 'FINALIZADA',
  'in-progress': 'EN CURSO',
  upcoming: 'PENDIENTE',
}

interface RaceCardProps {
  race: Race
  /** Highlights the race that comes next. */
  isNext?: boolean
  now?: Date
}

/** One race of the season calendar, linking to its results. */
const RaceCard = ({ race, isNext = false, now = new Date() }: RaceCardProps) => {
  const status = raceStatus(race, now)
  const { locality, country } = race.Circuit.Location

  return (
    <Link
      href={`/f1-dashboard/carrera/${race.season}/${race.round}`}
      className={`group flex h-full flex-col justify-between gap-6 rounded-xl border bg-card p-5 transition-colors hover:border-display ${
        isNext ? 'border-display' : 'border-border'
      }`}>
      <div>
        <div className='flex items-center justify-between gap-2'>
          <span className='label'>RONDA {String(race.round).padStart(2, '0')}</span>
          <span className={`label ${status === 'in-progress' ? 'text-signal' : isNext ? 'text-display' : 'text-muted-foreground'}`}>
            {status === 'in-progress' ? '● ' : ''}
            {isNext && status === 'upcoming' ? 'PRÓXIMA' : STATUS_LABEL[status]}
          </span>
        </div>
        <h2 className='mt-4 text-xl leading-snug text-display'>{race.raceName}</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {locality}, {country}
        </p>
      </div>
      <p className='label'>
        <span className='text-foreground'>{formatRaceDay(race.date)}</span> · {race.Circuit.circuitName}
      </p>
    </Link>
  )
}

export default RaceCard
