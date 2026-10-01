import Link from 'next/link'

import { getDriverStandings } from '@/lib/f1/queries'

import DataError from './DataError'
import StandingsTable from './StandingsTable'

/** The top of the current drivers' championship, for the dashboard home. */
const StandingsPreview = async () => {
  let standings: Awaited<ReturnType<typeof getDriverStandings>> = null
  try {
    standings = await getDriverStandings('current')
  } catch (error) {
    console.error('Could not load the standings preview', error)
    return <DataError refresh />
  }

  if (!standings || standings.standings.length === 0) return null

  const rows = standings.standings.slice(0, 5).map((s) => ({
    id: s.Driver.driverId,
    position: s.position !== undefined ? String(s.position) : s.positionText,
    code: s.Driver.code ?? s.Driver.familyName.slice(0, 3).toUpperCase(),
    name: `${s.Driver.givenName} ${s.Driver.familyName}`,
    team: s.Constructors[0]?.name,
    wins: s.wins,
    points: s.points,
  }))

  return (
    <section aria-labelledby='standings-preview-title' className='space-y-4'>
      <div className='flex items-end justify-between gap-4'>
        <div>
          <p className='label'>TEMPORADA {standings.season} · TRAS LA RONDA {standings.round}</p>
          <h2 id='standings-preview-title' className='mt-2 text-2xl text-display'>Clasificación de pilotos</h2>
        </div>
        <Link
          href='/f1-dashboard/clasificacion'
          className='label rounded-full border border-input px-4 py-2.5 text-display transition-colors hover:border-display'>
          VER COMPLETA
        </Link>
      </div>
      <StandingsTable rows={rows} caption='Los cinco primeros del campeonato de pilotos' />
    </section>
  )
}

export default StandingsPreview
