import Link from 'next/link'
import { notFound } from 'next/navigation'

import BackButton from '@/components/BackButton'
import DataError from '@/components/f1-dashboard/DataError'
import SeasonSelect from '@/components/f1-dashboard/SeasonSelect'
import BarList from '@/components/f1-stats/BarList'
import DriverLineChart from '@/components/f1-stats/DriverLineChart'
import DriverStatsTable from '@/components/f1-stats/DriverStatsTable'
import StatsAttribution from '@/components/f1-stats/StatsAttribution'
import TeammateBattles from '@/components/f1-stats/TeammateBattles'
import { resolveSeason, seasonOptions } from '@/lib/f1/season'
import { statsEnabled } from '@/lib/f1stats/client'
import {
  DETAILED_FROM,
  getConstructorStandingsProgression,
  getDriverSeasonStats,
  getDriverStandingsProgression,
  getQualifyingPace,
  getSeasonConstructors,
  getSeasonDrivers,
  getSeasonPitStops,
  getTeammateBattles,
} from '@/lib/f1stats/queries'
import { formatDelta } from '@/lib/f1stats/race'
import { driverCodes, mainBattles, positionsChart, qualifyingPaceChart } from '@/lib/f1stats/season'

// The season and the championship shown come from the URL.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Temporada · FastLap' }

interface SeasonPageProps {
  searchParams: Promise<{ season?: string; tipo?: string }>
}

async function safe<T>(name: string, promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    console.error(`Could not load ${name}`, error)
    return null
  }
}

const percent = (value: number | null) => (value == null ? '—' : `${formatDelta(value, 2)} %`.replace('.', ','))

const SeasonPage = async ({ searchParams }: SeasonPageProps) => {
  if (!statsEnabled()) notFound()
  const params = await searchParams
  const season = resolveSeason(params.season)
  const teamsView = params.tipo === 'equipos'

  const [drivers, constructors, progression, stats, pace, battles, pits] = await Promise.all([
    safe('season drivers', getSeasonDrivers(season)),
    safe('season constructors', getSeasonConstructors(season)),
    safe('progression', teamsView ? getConstructorStandingsProgression(season) : getDriverStandingsProgression(season)),
    safe('driver stats', getDriverSeasonStats(season)),
    safe('qualifying pace', getQualifyingPace(season)),
    safe('teammates', getTeammateBattles(season)),
    season >= DETAILED_FROM ? safe('pit stops', getSeasonPitStops(season, 10)) : Promise.resolve(null),
  ])

  const codes = driverCodes(drivers ?? [])
  const teamNames = new Map((constructors ?? []).map((c) => [c.id, c.name]))
  const everythingFailed = [drivers, progression, stats, pace, battles].every((value) => value === null)

  const tab = (teams: boolean, label: string) => (
    <Link
      href={`/f1-dashboard/temporada?${new URLSearchParams({ season: String(season), ...(teams ? { tipo: 'equipos' } : {}) })}#evolucion`}
      aria-current={teamsView === teams ? 'page' : undefined}
      className={`label rounded-full px-4 py-2 transition-colors ${teamsView === teams ? 'bg-primary text-primary-foreground' : 'hover:text-display'}`}>
      {label}
    </Link>
  )

  const positions = progression ? positionsChart(progression, teamsView ? teamNames : codes) : null
  const paceChart = pace && pace.teams.length > 0 ? qualifyingPaceChart(pace) : null
  const shownBattles = mainBattles(battles ?? [])

  return (
    <div className='max-w-5xl space-y-10'>
      <div>
        <BackButton defaultPath='/f1-dashboard' backText='Volver al Dashboard' className='-ml-5' />
        <div className='mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
          <div>
            <p className='label'>
              TEMPORADA {season}
              {progression?.rounds.length ? ` · ${progression.rounds.length} CARRERAS` : ''}
            </p>
            <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>La temporada en datos</h1>
          </div>
          <SeasonSelect value={season} years={seasonOptions(season)} basePath='/f1-dashboard/temporada' keep={teamsView ? { tipo: 'equipos' } : {}} />
        </div>
      </div>

      {everythingFailed && <DataError message='Los datos de la temporada no están disponibles ahora mismo.' refresh />}

      {positions && positions.rows.length > 0 && (
        <section id='evolucion' aria-label='Evolución del campeonato' className='scroll-mt-28 space-y-4'>
          <div className='inline-flex rounded-full border border-input p-0.5'>
            {tab(false, 'PILOTOS')}
            {tab(true, 'EQUIPOS')}
          </div>
          <DriverLineChart
            title={teamsView ? 'POSICIÓN EN EL MUNDIAL DE CONSTRUCTORES' : 'POSICIÓN EN EL MUNDIAL DE PILOTOS'}
            description='Clasificación oficial tras cada Gran Premio (incluye sprints y sanciones).'
            rows={positions.rows}
            drivers={positions.series}
            initial={positions.series.slice(0, 3).map((s) => s.number)}
            reversed
            yDomain={[1, Math.max(positions.series.length, 2)]}
            formatValue={(v) => `P${v}`}
            yTickFormat={(v) => `P${v}`}
            xTick='R'
            xName='RONDA'
          />
        </section>
      )}

      {stats && stats.length > 0 && (
        <section aria-labelledby='stats-title' className='space-y-4'>
          <h2 id='stats-title' className='label'>NÚMEROS DE CADA PILOTO</h2>
          <DriverStatsTable rows={stats} codes={codes} teams={teamNames} caption={`Estadísticas de los pilotos en ${season}`} />
          <p className='text-xs text-muted-foreground'>
            Puntos del campeonato (con sprints). Salida y llegada: posición media; la llegada solo cuenta las carreras terminadas.
            +/-: posiciones ganadas desde la parrilla en toda la temporada. En negrita, el mejor de cada columna.
          </p>
        </section>
      )}

      {pace && paceChart && (
        <section aria-labelledby='pace-title' className='space-y-4'>
          <h2 id='pace-title' className='label'>RITMO A UNA VUELTA DE CADA EQUIPO</h2>
          <div className='grid gap-6 lg:grid-cols-[2fr_3fr]'>
            <BarList
              title='DIFERENCIA MEDIANA CON EL MÁS RÁPIDO'
              description='Mejor vuelta del equipo en clasificación frente a la mejor de todas, en cada Gran Premio.'
              names
              items={pace.teams
                .filter((team) => team.medianGapPercent != null)
                .map((team) => ({
                  key: team.constructorId,
                  label: team.constructorName ?? team.constructorId,
                  value: team.medianGapPercent!,
                  display: team.medianGapPercent === 0 ? '0 %' : percent(team.medianGapPercent),
                  aside: team.fastestCount ? `${team.fastestCount} × el más rápido` : undefined,
                }))}
            />
            <DriverLineChart
              title='CARRERA A CARRERA'
              description='Diferencia con el equipo más rápido de cada clasificación (0 % = el más rápido).'
              rows={paceChart.rows}
              drivers={paceChart.series}
              initial={paceChart.series.slice(0, 3).map((s) => s.number)}
              reversed
              yDomain={[0, 'auto']}
              formatValue={(v) => `${v.toFixed(2).replace('.', ',')} %`}
              yTickFormat={(v) => `${v}%`}
              xTick='R'
              xName='RONDA'
              legend='EQUIPOS'
            />
          </div>
        </section>
      )}

      {shownBattles.length > 0 && (
        <section aria-labelledby='mates-title' className='space-y-4'>
          <h2 id='mates-title' className='label'>DUELOS ENTRE COMPAÑEROS</h2>
          <TeammateBattles battles={shownBattles} codes={codes} />
          <p className='text-xs text-muted-foreground'>
            Solo carreras que ambos disputaron con el mismo equipo. La diferencia a una vuelta compara la última ronda de la
            clasificación en la que los dos marcaron tiempo.
          </p>
        </section>
      )}

      {pits && (
        <section aria-labelledby='pits-title' className='space-y-4'>
          <h2 id='pits-title' className='label'>PARADAS EN BOXES</h2>
          <div className='grid gap-6 lg:grid-cols-2'>
            <BarList
              title='EQUIPOS MÁS RÁPIDOS EN BOXES'
              description='Tiempo en el pit lane frente a la mediana de cada carrera (cada circuito tiene un pit lane distinto).'
              names
              items={pits.teams
                .filter((team) => team.laneDeltaToRaceMedian != null)
                .map((team, index, all) => ({
                  key: team.teamName,
                  label: team.teamName,
                  value: team.laneDeltaToRaceMedian! - all[0].laneDeltaToRaceMedian!,
                  display: `${formatDelta(team.laneDeltaToRaceMedian, 2)} s`,
                  aside: `${team.stops} paradas`,
                }))}
            />
            <BarList
              title='PARADAS MÁS RÁPIDAS'
              description='Tiempo con el coche parado (solo algunas carreras desde 2024).'
              items={pits.fastest
                .filter((stop) => stop.stopDuration != null)
                .map((stop, index, all) => ({
                  key: `${stop.raceId}-${stop.driverId}-${index}`,
                  label: (stop.driverId && codes.get(stop.driverId)) || '—',
                  detail: stop.teamName,
                  value: stop.stopDuration! - all[0].stopDuration!,
                  display: `${stop.stopDuration!.toFixed(1)} s`,
                  aside: `R${stop.round} · ${stop.teamName ?? ''}`,
                }))}
            />
          </div>
        </section>
      )}

      <StatsAttribution detailed={season >= DETAILED_FROM} />
    </div>
  )
}

export default SeasonPage
