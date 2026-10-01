import Link from 'next/link'
import { notFound } from 'next/navigation'

import BackButton from '@/components/BackButton'
import DataError from '@/components/f1-dashboard/DataError'
import StatTile from '@/components/f1-dashboard/StatTile'
import { championshipYears, entriesByDriver, seasonLines, statsOf, teamHistory } from '@/lib/f1/driver'
import { driverCode, formatRaceDate } from '@/lib/f1/format'
import { getDriver, getDriverResults, getDriverSeasons } from '@/lib/f1/queries'
import ScrollRegion from '@/components/ScrollRegion'

// Career numbers change after every race.
export const dynamic = 'force-dynamic'

interface DriverPageProps {
  params: Promise<{ pilotoId: string }>
}

const DriverPage = async ({ params }: DriverPageProps) => {
  const { pilotoId } = await params
  if (!/^[a-z0-9_]{1,60}$/.test(pilotoId)) notFound()

  let driver
  try {
    driver = await getDriver(pilotoId)
  } catch (error) {
    console.error(`Could not load driver ${pilotoId}`, error)
    return (
      <div className='max-w-5xl space-y-6'>
        <BackButton defaultPath='/f1-dashboard/pilotos' backText='Volver a pilotos' className='-ml-5' />
        <DataError refresh />
      </div>
    )
  }
  if (!driver) notFound()

  const [career, seasons] = await Promise.allSettled([getDriverResults(pilotoId), getDriverSeasons(pilotoId)])
  if (career.status === 'rejected') console.error(`Could not load the career of ${pilotoId}`, career.reason)
  if (seasons.status === 'rejected') console.error(`Could not load the seasons of ${pilotoId}`, seasons.reason)

  const entries = career.status === 'fulfilled' ? (entriesByDriver(career.value).get(pilotoId) ?? []) : []
  const standings = seasons.status === 'fulfilled' ? seasons.value : []
  const stats = statsOf(entries)
  const titles = championshipYears(standings, new Date().getUTCFullYear())
  const teams = teamHistory(entries)
  const lines = seasonLines(entries, standings)

  return (
    <div className='max-w-5xl space-y-10'>
      <div>
        <BackButton defaultPath='/f1-dashboard/pilotos' backText='Volver a pilotos' className='-ml-5' />
        <div className='mt-4 flex items-start justify-between gap-6'>
          <div>
            <p className='label'>PILOTO · {driver.nationality.toUpperCase()}</p>
            <h1 className='mt-2 text-3xl font-bold text-display md:text-5xl'>
              {driver.givenName} <span className='block'>{driver.familyName}</span>
            </h1>
            <p className='mt-3 text-muted-foreground'>
              Nació el {formatRaceDate(driver.dateOfBirth)}
              {driver.url && (
                <>
                  {' · '}
                  <a href={driver.url} target='_blank' rel='noopener noreferrer' className='underline underline-offset-4 hover:text-display'>
                    Wikipedia
                  </a>
                </>
              )}
            </p>
          </div>
          <p className='display text-6xl sm:text-8xl' aria-label={driver.permanentNumber ? `Número ${driver.permanentNumber}` : `Código ${driverCode(driver)}`}>
            {driver.permanentNumber ?? driverCode(driver)}
          </p>
        </div>
      </div>

      {career.status === 'rejected' ? (
        <DataError message='No se han podido cargar los resultados de este piloto.' refresh />
      ) : entries.length === 0 ? (
        <p className='rounded-xl border border-border bg-card p-6 text-muted-foreground'>Este piloto todavía no tiene carreras registradas.</p>
      ) : (
        <>
          <section aria-labelledby='stats-title' className='space-y-4'>
            <h2 id='stats-title' className='label'>CARRERA EN LA F1</h2>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              <StatTile label='CARRERAS' value={stats.races} detail={`${lines.length} temporada${lines.length === 1 ? '' : 's'}`} />
              <StatTile label='VICTORIAS' value={stats.wins} />
              <StatTile label='PODIOS' value={stats.podiums} />
              <StatTile
                label='TÍTULOS'
                value={seasons.status === 'fulfilled' ? titles.length : '—'}
                detail={titles.length ? titles.join(', ') : undefined}
              />
              <StatTile label='SALIDAS P1' value={stats.polePositions} />
              <StatTile label='V. RÁPIDAS' value={stats.fastestLaps} />
              <StatTile label='PUNTOS' value={stats.points} detail='de carrera' />
              <StatTile label='ABANDONOS' value={stats.retirements} />
            </div>
            {stats.bestFinish !== null && (
              <p className='text-sm text-muted-foreground'>
                Mejor resultado: {stats.bestFinish}º{stats.bestFinishCount > 1 ? ` (${stats.bestFinishCount} veces)` : ''}.
              </p>
            )}
          </section>

          <section aria-labelledby='teams-title' className='space-y-4'>
            <h2 id='teams-title' className='label'>EQUIPOS</h2>
            <ul className='flex flex-wrap gap-2'>
              {teams.map((team) => (
                <li key={team.id} className='rounded-full border border-border bg-card px-4 py-2 text-sm'>
                  <span className='text-display'>{team.name}</span>{' '}
                  <span className='label'>
                    {team.firstSeason === team.lastSeason ? team.firstSeason : `${team.firstSeason}–${team.lastSeason}`} · {team.races} GP
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby='seasons-title' className='space-y-4'>
            <h2 id='seasons-title' className='label'>TEMPORADA A TEMPORADA</h2>
            <ScrollRegion label={`Resultados de ${driver.givenName} ${driver.familyName} por temporada`}>
              <table className='w-full border-collapse text-left tabular-nums'>
                <caption className='sr-only'>Resultados de {driver.givenName} {driver.familyName} por temporada</caption>
                <thead>
                  <tr className='label border-b border-border'>
                    <th scope='col' className='px-4 py-3 font-normal'>AÑO</th>
                    <th scope='col' className='hidden px-2 py-3 font-normal sm:table-cell'>EQUIPO</th>
                    <th scope='col' className='px-2 py-3 text-right font-normal'>GP</th>
                    <th scope='col' className='px-2 py-3 text-right font-normal'>VIC</th>
                    <th scope='col' className='hidden px-2 py-3 text-right font-normal sm:table-cell'>POD</th>
                    <th scope='col' className='px-2 py-3 text-right font-normal'>PTS</th>
                    <th scope='col' className='px-4 py-3 text-right font-normal'>POS</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.season} className='border-b border-border last:border-0'>
                      <td className='px-4 py-3 font-mono'>
                        <Link
                          href={`/f1-dashboard/clasificacion?season=${line.season}`}
                          className='text-display underline-offset-4 hover:underline'>
                          {line.season}
                        </Link>
                      </td>
                      <td className='hidden px-2 py-3 text-sm text-muted-foreground sm:table-cell'>{line.teams.join(' / ')}</td>
                      <td className='px-2 py-3 text-right font-mono text-muted-foreground'>{line.races}</td>
                      <td className='px-2 py-3 text-right font-mono text-muted-foreground'>{line.wins}</td>
                      <td className='hidden px-2 py-3 text-right font-mono text-muted-foreground sm:table-cell'>{line.podiums}</td>
                      <td className='px-2 py-3 text-right font-mono text-display'>{line.officialPoints ?? line.points}</td>
                      <td className='px-4 py-3 text-right font-mono text-display'>{line.positionText ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
            <p className='text-xs text-muted-foreground'>
              Las cifras de carrera se calculan con los resultados de cada Gran Premio y no incluyen puntos de sprint. Los títulos y
              la posición final salen de la clasificación de cada temporada; la temporada en curso no cuenta como título.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

export default DriverPage
