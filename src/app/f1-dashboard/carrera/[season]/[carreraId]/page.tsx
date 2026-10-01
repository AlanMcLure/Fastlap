import Link from 'next/link'
import { notFound } from 'next/navigation'

import BackButton from '@/components/BackButton'
import DataError from '@/components/f1-dashboard/DataError'
import PitStopsTable from '@/components/f1-dashboard/PitStopsTable'
import RaceSummary from '@/components/f1-dashboard/RaceSummary'
import ResultsTable from '@/components/f1-dashboard/ResultsTable'
import SessionList from '@/components/f1-dashboard/SessionList'
import StandingsTable from '@/components/f1-dashboard/StandingsTable'
import { driverRows } from '@/components/f1-dashboard/standingRows'
import { raceStatus } from '@/lib/f1/calendar'
import { formatRaceDate } from '@/lib/f1/format'
import { groupPitStops, raceSummary } from '@/lib/f1/race'
import { getCalendar, getDriverStandings, getPitStops, getRaceResults } from '@/lib/f1/queries'
import type { Race } from '@/lib/f1/schemas'

// Rendered per request: whether the race has been run depends on the current time.
export const dynamic = 'force-dynamic'

interface RacePageProps {
  params: Promise<{ season: string; carreraId: string }>
}

const parseInt10 = (value: string) => (/^\d{1,4}$/.test(value) ? Number(value) : NaN)

const RacePage = async ({ params }: RacePageProps) => {
  const { season: rawSeason, carreraId } = await params
  const season = parseInt10(rawSeason)
  const round = parseInt10(carreraId)
  if (!Number.isInteger(season) || !Number.isInteger(round) || season < 1950 || round < 1 || round > 40) notFound()

  // Each block loads on its own: a failing one does not hide the rest.
  const [results, pitStops, calendar, standings] = await Promise.allSettled([
    getRaceResults(season, round),
    getPitStops(season, round),
    getCalendar(season),
    getDriverStandings(season, round),
  ])
  for (const [name, outcome] of Object.entries({ results, pitStops, calendar, standings })) {
    if (outcome.status === 'rejected') console.error(`Could not load ${name} for ${season} round ${round}`, outcome.reason)
  }

  const raceResults = results.status === 'fulfilled' ? results.value : null
  const races: Race[] = calendar.status === 'fulfilled' ? calendar.value : []
  const race: Race | undefined = raceResults ?? races.find((r) => r.round === round)

  if (!race) {
    // Neither results nor calendar: either the API is down or the round does not exist.
    if (results.status === 'rejected' && calendar.status === 'rejected') {
      return (
        <div className='max-w-5xl space-y-6'>
          <BackButton defaultPath='/f1-dashboard/carreras' backText='Volver al calendario' />
          <DataError refresh />
        </div>
      )
    }
    notFound()
  }

  const now = new Date()
  const status = raceStatus(race, now)
  const previous = races.find((r) => r.round === round - 1)
  const next = races.find((r) => r.round === round + 1)
  const hasResults = raceResults !== null && raceResults.Results.length > 0
  const stopGroups =
    pitStops.status === 'fulfilled' && raceResults ? groupPitStops(pitStops.value, raceResults.Results) : []
  const { locality, country } = race.Circuit.Location

  return (
    <div className='max-w-5xl space-y-8'>
      <div>
        <BackButton defaultPath='/f1-dashboard/carreras' backText='Volver al calendario' />
        <p className='label mt-4'>
          TEMPORADA {season} · RONDA {round} · {formatRaceDate(race.date).toUpperCase()}
        </p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>{race.raceName}</h1>
        <p className='mt-2 text-muted-foreground'>
          {race.Circuit.circuitName} · {locality}, {country}
        </p>
      </div>

      {hasResults ? (
        <>
          <RaceSummary summary={raceSummary(raceResults.Results)} />

          <section aria-labelledby='results-title' className='space-y-4'>
            <h2 id='results-title' className='label'>CLASIFICACIÓN DE LA CARRERA</h2>
            <ResultsTable results={raceResults.Results} caption={`Resultados de ${race.raceName} ${season}`} />
          </section>

          {stopGroups.length > 0 && (
            <section aria-labelledby='stops-title' className='space-y-4'>
              <h2 id='stops-title' className='label'>PARADAS EN BOXES</h2>
              <PitStopsTable groups={stopGroups} />
            </section>
          )}
          {pitStops.status === 'rejected' && (
            <p className='text-sm text-muted-foreground'>No se han podido cargar las paradas en boxes.</p>
          )}

          {standings.status === 'fulfilled' && standings.value && (
            <section aria-labelledby='after-title' className='space-y-4'>
              <div className='flex items-end justify-between gap-4'>
                <h2 id='after-title' className='label'>CAMPEONATO DE PILOTOS TRAS ESTA CARRERA · 10 PRIMEROS</h2>
                <Link
                  href={`/f1-dashboard/clasificacion?season=${season}`}
                  className='label rounded-full border border-input px-4 py-2.5 text-display transition-colors hover:border-display'>
                  VER COMPLETA
                </Link>
              </div>
              <StandingsTable rows={driverRows(standings.value, 10)} caption='Los diez primeros del campeonato tras esta carrera' />
            </section>
          )}
        </>
      ) : results.status === 'rejected' ? (
        <DataError message='No se han podido cargar los resultados de esta carrera.' refresh />
      ) : (
        <section className='space-y-4'>
          <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
            {status === 'finished'
              ? 'Todavía no hay resultados publicados para esta carrera. Suelen aparecer poco después de terminar.'
              : status === 'in-progress'
                ? 'La carrera está en curso. Los resultados aparecerán cuando termine.'
                : 'Esta carrera aún no se ha disputado.'}
          </p>
          <h2 className='label'>HORARIO DEL FIN DE SEMANA</h2>
          <SessionList race={race} />
        </section>
      )}

      <nav aria-label='Carreras anterior y siguiente' className='flex flex-wrap justify-between gap-3 border-t border-border pt-6'>
        {previous ? (
          <Link
            href={`/f1-dashboard/carrera/${season}/${previous.round}`}
            className='label rounded-full border border-border px-4 py-2.5 transition-colors hover:text-display'>
            ← R{previous.round} · {previous.raceName}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/f1-dashboard/carrera/${season}/${next.round}`}
            className='label rounded-full border border-border px-4 py-2.5 transition-colors hover:text-display'>
            R{next.round} · {next.raceName} →
          </Link>
        )}
      </nav>
    </div>
  )
}

export default RacePage
