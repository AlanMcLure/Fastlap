import Link from 'next/link'

import DataError from '@/components/f1-dashboard/DataError'
import DriverCard from '@/components/f1-dashboard/DriverCard'
import SeasonSelect from '@/components/f1-dashboard/SeasonSelect'
import { entriesByDriver, statsOf } from '@/lib/f1/driver'
import { getDriverStandings, getDrivers, getSeasonResults } from '@/lib/f1/queries'
import { resolveSeason, seasonOptions } from '@/lib/f1/season'

// Rendered per request: the selected season and filter come from the URL.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Pilotos · FastLap' }

type Filter = 'todos' | 'ganadores' | 'podio'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todos', label: 'TODOS' },
  { value: 'ganadores', label: 'GANADORES' },
  { value: 'podio', label: 'CON PODIO' },
]

interface DriversPageProps {
  searchParams: Promise<{ season?: string; filtro?: string }>
}

const DriversPage = async ({ searchParams }: DriversPageProps) => {
  const params = await searchParams
  const season = resolveSeason(params.season)
  const filter: Filter = FILTERS.some((f) => f.value === params.filtro) ? (params.filtro as Filter) : 'todos'

  // The list loads first; standings and results only add numbers to the cards.
  const [drivers, standings, results] = await Promise.allSettled([
    getDrivers(season),
    getDriverStandings(season),
    getSeasonResults(season),
  ])
  for (const [name, outcome] of Object.entries({ drivers, standings, results })) {
    if (outcome.status === 'rejected') console.error(`Could not load ${name} for ${season}`, outcome.reason)
  }

  const header = (
    <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
      <div>
        <p className='label'>TEMPORADA {season}</p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>Pilotos</h1>
      </div>
      <SeasonSelect
        value={season}
        years={seasonOptions(season)}
        basePath='/f1-dashboard/pilotos'
        keep={filter === 'todos' ? {} : { filtro: filter }}
      />
    </div>
  )

  if (drivers.status === 'rejected') {
    return (
      <div className='max-w-7xl space-y-8'>
        {header}
        <DataError refresh />
      </div>
    )
  }

  const entries = results.status === 'fulfilled' ? entriesByDriver(results.value) : null
  const positions = new Map(
    standings.status === 'fulfilled' && standings.value
      ? standings.value.standings.map((s) => [s.Driver.driverId, { position: s.position ?? Infinity, team: s.Constructors[0]?.name }])
      : []
  )

  const cards = drivers.value
    .map((driver) => {
      const driverEntries = entries?.get(driver.driverId) ?? []
      const stats = entries ? statsOf(driverEntries) : undefined
      const team = positions.get(driver.driverId)?.team ?? driverEntries[driverEntries.length - 1]?.result.Constructor.name
      return { driver, stats, team, position: positions.get(driver.driverId)?.position ?? Infinity }
    })
    .filter(({ stats }) => (!stats ? true : filter === 'ganadores' ? stats.wins > 0 : filter === 'podio' ? stats.podiums > 0 : true))
    .sort(
      (a, b) =>
        a.position - b.position ||
        (b.stats?.points ?? 0) - (a.stats?.points ?? 0) ||
        a.driver.familyName.localeCompare(b.driver.familyName)
    )

  return (
    <div className='max-w-7xl space-y-8'>
      {header}

      <nav aria-label='Filtro de pilotos' className='inline-flex rounded-full border border-input p-0.5'>
        {FILTERS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/f1-dashboard/pilotos?${new URLSearchParams({ season: String(season), ...(value === 'todos' ? {} : { filtro: value }) })}`}
            aria-current={filter === value ? 'page' : undefined}
            className={`label rounded-full px-4 py-2 transition-colors ${filter === value ? 'bg-primary text-primary-foreground' : 'hover:text-display'}`}>
            {label}
          </Link>
        ))}
      </nav>

      {!entries && filter !== 'todos' && (
        <p className='text-sm text-muted-foreground'>No se han podido cargar los resultados: el filtro no se ha aplicado.</p>
      )}

      {cards.length === 0 ? (
        <p className='rounded-xl border border-border bg-card p-6 text-muted-foreground'>
          No hay pilotos que cumplan este filtro en la temporada {season}.
        </p>
      ) : (
        <ul className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {cards.map(({ driver, stats, team }) => (
            <li key={driver.driverId}>
              <DriverCard driver={driver} team={team} stats={stats} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DriversPage
