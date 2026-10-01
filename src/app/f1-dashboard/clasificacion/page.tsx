import Link from 'next/link'

import BackButton from '@/components/BackButton'
import DataError from '@/components/f1-dashboard/DataError'
import PointsChart from '@/components/f1-dashboard/PointsChart'
import SeasonSelect from '@/components/f1-dashboard/SeasonSelect'
import StandingsTable, { type StandingRow } from '@/components/f1-dashboard/StandingsTable'
import { pointsProgression, type ProgressionKind } from '@/lib/f1/progression'
import { getConstructorStandings, getDriverStandings, getSeasonResults, getSeasonSprintResults } from '@/lib/f1/queries'
import { resolveSeason, seasonOptions } from '@/lib/f1/season'

// Rendered per request: the selected season and championship come from the URL.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Clasificación · FastLap' }

interface StandingsPageProps {
  searchParams: Promise<{ season?: string; tipo?: string }>
}

async function loadRows(season: number, kind: ProgressionKind) {
  if (kind === 'drivers') {
    const standings = await getDriverStandings(season)
    const rows: StandingRow[] = (standings?.standings ?? []).map((s) => ({
      id: s.Driver.driverId,
      position: s.position !== undefined ? String(s.position) : s.positionText,
      code: s.Driver.code ?? s.Driver.familyName.slice(0, 3).toUpperCase(),
      name: `${s.Driver.givenName} ${s.Driver.familyName}`,
      team: s.Constructors.map((c) => c.name).join(' / '),
      wins: s.wins,
      points: s.points,
    }))
    return { round: standings?.round, rows }
  }

  const standings = await getConstructorStandings(season)
  const rows: StandingRow[] = (standings?.standings ?? []).map((s) => ({
    id: s.Constructor.constructorId,
    position: s.position !== undefined ? String(s.position) : s.positionText,
    name: s.Constructor.name,
    wins: s.wins,
    points: s.points,
  }))
  return { round: standings?.round, rows }
}

async function loadProgression(season: number, kind: ProgressionKind) {
  const [races, sprints] = await Promise.all([getSeasonResults(season), getSeasonSprintResults(season)])
  return pointsProgression(races, sprints, kind)
}

const StandingsPage = async ({ searchParams }: StandingsPageProps) => {
  const params = await searchParams
  const season = resolveSeason(params.season)
  const kind: ProgressionKind = params.tipo === 'equipos' ? 'constructors' : 'drivers'

  // The table and the chart load independently: if one fails the other still shows.
  const [table, chart] = await Promise.allSettled([loadRows(season, kind), loadProgression(season, kind)])
  if (table.status === 'rejected') console.error('Could not load the standings', table.reason)
  if (chart.status === 'rejected') console.error('Could not load the points progression', chart.reason)

  const tab = (value: ProgressionKind, label: string, tipo?: string) => (
    <Link
      href={`/f1-dashboard/clasificacion?${new URLSearchParams({ season: String(season), ...(tipo ? { tipo } : {}) })}`}
      aria-current={kind === value ? 'page' : undefined}
      className={`label rounded-full px-4 py-2 transition-colors ${
        kind === value ? 'bg-primary text-primary-foreground' : 'hover:text-display'
      }`}>
      {label}
    </Link>
  )

  const title = kind === 'drivers' ? 'Campeonato de pilotos' : 'Campeonato de constructores'
  const round = table.status === 'fulfilled' ? table.value.round : undefined

  return (
    <div className='mx-auto max-w-5xl space-y-8 px-4 pb-16 sm:px-6'>
      <div>
        <BackButton defaultPath='/f1-dashboard' backText='Volver al Dashboard' />
        <div className='mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
          <div>
            <p className='label'>
              TEMPORADA {season}
              {round ? ` · TRAS LA RONDA ${round}` : ''}
            </p>
            <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>Clasificación</h1>
          </div>
          <SeasonSelect
            value={season}
            years={seasonOptions(season)}
            basePath='/f1-dashboard/clasificacion'
            keep={kind === 'constructors' ? { tipo: 'equipos' } : {}}
          />
        </div>
      </div>

      <nav aria-label='Tipo de campeonato' className='inline-flex rounded-full border border-input p-0.5'>
        {tab('drivers', 'PILOTOS')}
        {tab('constructors', 'EQUIPOS', 'equipos')}
      </nav>

      {table.status === 'rejected' ? (
        <DataError refresh />
      ) : table.value.rows.length === 0 ? (
        <p className='rounded-xl border border-border bg-card p-6 text-muted-foreground'>
          {kind === 'constructors' && season < 1958
            ? 'El campeonato de constructores empezó en 1958.'
            : `Todavía no hay clasificación para la temporada ${season}.`}
        </p>
      ) : (
        <>
          <StandingsTable rows={table.value.rows} caption={title} />
          {chart.status === 'fulfilled' && chart.value.rounds.length > 1 && (
            <PointsChart progression={chart.value} title={`Evolución de puntos · ${title.toLowerCase()}`} />
          )}
          {chart.status === 'rejected' && (
            <p className='text-sm text-muted-foreground'>No se ha podido cargar la evolución de puntos.</p>
          )}
        </>
      )}
    </div>
  )
}

export default StandingsPage
