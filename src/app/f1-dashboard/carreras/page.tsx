import BackButton from '@/components/BackButton'
import DataError from '@/components/f1-dashboard/DataError'
import RaceCard from '@/components/f1-dashboard/RaceCard'
import SeasonSelect from '@/components/f1-dashboard/SeasonSelect'
import { findUpcomingRace } from '@/lib/f1/calendar'
import { getCalendar } from '@/lib/f1/queries'
import type { Race } from '@/lib/f1/schemas'

// Rendered per request: the status of each race (finished, next...) depends on the current time.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Calendario · FastLap' }

const FIRST_SEASON = 1950

interface RacesPageProps {
  searchParams: Promise<{ season?: string }>
}

const RacesPage = async ({ searchParams }: RacesPageProps) => {
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const requested = Number((await searchParams).season)
  const season =
    Number.isInteger(requested) && requested >= FIRST_SEASON && requested <= currentYear + 1 ? requested : currentYear
  const years = Array.from({ length: currentYear - FIRST_SEASON + 1 }, (_, i) => currentYear - i)
  if (!years.includes(season)) years.unshift(season)

  let races: Race[] = []
  let failed = false
  try {
    races = await getCalendar(season)
  } catch (error) {
    console.error('Could not load the calendar', error)
    failed = true
  }

  const nextRace = findUpcomingRace(races, now)

  return (
    <div className='mx-auto max-w-7xl px-4 pb-16 sm:px-6'>
      <BackButton defaultPath='/f1-dashboard' backText='Volver al Dashboard' />

      <div className='mb-8 mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <p className='label'>
            {failed ? 'CALENDARIO' : `${races.length} CARRERAS`} · TEMPORADA {season}
          </p>
          <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>Calendario</h1>
        </div>
        <SeasonSelect value={season} years={years} />
      </div>

      {failed ? (
        <DataError refresh />
      ) : races.length === 0 ? (
        <p className='rounded-xl border border-border bg-card p-6 text-muted-foreground'>
          Todavía no hay calendario publicado para la temporada {season}.
        </p>
      ) : (
        <ul className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {races.map((race) => (
            <li key={race.round}>
              <RaceCard race={race} isNext={race.round === nextRace?.round} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RacesPage
