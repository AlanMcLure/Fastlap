import Link from 'next/link'

import ScrollRegion from '@/components/ScrollRegion'
import CompareForm, { type DriverOption } from '@/components/f1-dashboard/CompareForm'
import DataError from '@/components/f1-dashboard/DataError'
import { compareDrivers, headToHead, type CompareRow } from '@/lib/f1/compare'
import { championshipYears, entriesByDriver, statsOf, type DriverEntry } from '@/lib/f1/driver'
import { getDriver, getDriverResults, getDriverSeasons, getDrivers } from '@/lib/f1/queries'
import type { Driver } from '@/lib/f1/schemas'
import { resolveSeason, seasonOptions } from '@/lib/f1/season'

// Career numbers change after every race, and the page depends on the query string.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Comparar pilotos · FastLap' }

const ID = /^[a-z0-9_]{1,60}$/

interface Side {
  driver: Driver
  entries: DriverEntry[]
  titles: number
  seasons: number
}

async function loadSide(id: string): Promise<Side | 'missing' | 'error'> {
  try {
    const driver = await getDriver(id)
    if (!driver) return 'missing'
    const [career, standings] = await Promise.all([getDriverResults(id), getDriverSeasons(id)])
    const entries = entriesByDriver(career).get(id) ?? []
    return {
      driver,
      entries,
      titles: championshipYears(standings, new Date().getUTCFullYear()).length,
      seasons: new Set(entries.map((e) => e.race.season)).size,
    }
  } catch (error) {
    console.error(`Could not load driver ${id} for the comparison`, error)
    return 'error'
  }
}

const fullName = (d: Driver) => `${d.givenName} ${d.familyName}`

const Bar = ({ share }: { share: number }) => (
  <div className='mt-2 flex h-1.5 gap-0.5' aria-hidden='true'>
    <div className='flex flex-1 justify-end rounded-l-full bg-muted'>
      <div className='rounded-l-full bg-primary' style={{ width: `${share}%` }} />
    </div>
    <div className='flex flex-1 rounded-r-full bg-muted'>
      <div className='rounded-r-full bg-primary/60' style={{ width: `${100 - share}%` }} />
    </div>
  </div>
)

const Value = ({ text, leader }: { text: string; leader: boolean }) => (
  <td className={`px-3 py-3 text-right font-mono tabular-nums sm:px-4 ${leader ? 'font-bold text-display' : 'text-muted-foreground'}`}>
    {text}
    {leader && (
      <>
        <span aria-hidden='true' className='ml-1.5'>▲</span>
        <span className='sr-only'> (mejor)</span>
      </>
    )}
  </td>
)

const H2HLine = ({ label, a, b, tied, nameA, nameB }: { label: string; a: number; b: number; tied: number; nameA: string; nameB: string }) => {
  const total = a + b + tied
  return (
    <li className='rounded-xl border border-border bg-card p-4'>
      <p className='label'>{label}</p>
      <p className='mt-2 flex flex-wrap items-baseline justify-between gap-x-4 text-foreground'>
        <span><span className='font-mono text-2xl text-display'>{a}</span> {nameA}</span>
        {tied > 0 && <span className='label'>{tied} IGUAL{tied === 1 ? '' : 'ES'}</span>}
        <span>{nameB} <span className='font-mono text-2xl text-display'>{b}</span></span>
      </p>
      <Bar share={total === 0 ? 50 : Math.round((a / Math.max(1, a + b)) * 100)} />
    </li>
  )
}

const ComparePage = async ({ searchParams }: { searchParams: Promise<{ a?: string; b?: string; season?: string }> }) => {
  const params = await searchParams
  const a = params.a && ID.test(params.a) ? params.a : ''
  const b = params.b && ID.test(params.b) ? params.b : ''
  const season = resolveSeason(params.season)

  // The lists come from one season; the chosen drivers are kept even if they are not in it.
  let list: Driver[] = []
  try {
    list = await getDrivers(season)
  } catch (error) {
    console.error('Could not load the driver list', error)
  }
  const [sideA, sideB] = await Promise.all([a ? loadSide(a) : null, b ? loadSide(b) : null])

  const options: DriverOption[] = list.map((d) => ({ id: d.driverId, name: fullName(d) }))
  for (const side of [sideA, sideB]) {
    if (side && typeof side === 'object' && !options.some((o) => o.id === side.driver.driverId)) {
      options.push({ id: side.driver.driverId, name: fullName(side.driver) })
    }
  }
  options.sort((x, y) => x.name.localeCompare(y.name, 'es'))

  const both = sideA && sideB && typeof sideA === 'object' && typeof sideB === 'object' ? { a: sideA, b: sideB } : null
  const rows: CompareRow[] = both
    ? compareDrivers(
        { stats: statsOf(both.a.entries), titles: both.a.titles, seasons: both.a.seasons },
        { stats: statsOf(both.b.entries), titles: both.b.titles, seasons: both.b.seasons }
      )
    : []
  const h2h = both && a !== b ? headToHead(both.a.entries, both.b.entries) : null

  const problem = (side: Side | 'missing' | 'error' | null, id: string) =>
    side === 'missing' ? `No existe ningún piloto con el identificador «${id}».` : side === 'error' ? 'No se han podido cargar los datos de este piloto.' : null

  return (
    <div className='max-w-5xl space-y-8'>
      <header>
        <p className='label'>PILOTOS · COMPARADOR</p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>Comparar pilotos</h1>
        <p className='mt-2 text-muted-foreground'>
          Carrera completa de cada uno con los resultados de la API de F1 (puntos de carrera, sin contar sprints), y el cara a cara
          en las carreras en las que coincidieron.
        </p>
      </header>

      <CompareForm a={a} b={b} season={season} years={seasonOptions(season)} options={options} />

      {list.length === 0 && <DataError message='No se ha podido cargar la lista de pilotos de esta temporada; puedes escribir un identificador en la dirección.' />}

      {[problem(sideA, a), problem(sideB, b)].map((p, i) => p && <p key={i} role='alert' className='rounded-xl border border-border bg-card p-5 text-signal'>{p}</p>)}

      {!a || !b ? (
        <p className='rounded-xl border border-border bg-card p-5 text-foreground'>Elige dos pilotos para ver su comparación.</p>
      ) : a === b ? (
        <p className='rounded-xl border border-border bg-card p-5 text-foreground'>Elige dos pilotos distintos.</p>
      ) : both ? (
        <>
          <ScrollRegion label={`Comparación de ${fullName(both.a.driver)} y ${fullName(both.b.driver)}`}>
            <table className='w-full border-collapse text-left'>
              <caption className='sr-only'>Estadísticas de carrera de {fullName(both.a.driver)} y {fullName(both.b.driver)}</caption>
              <thead>
                <tr className='border-b border-border'>
                  <th scope='col' className='px-3 py-3 font-normal sm:px-4'><span className='label'>ESTADÍSTICA</span></th>
                  {[both.a.driver, both.b.driver].map((d) => (
                    <th key={d.driverId} scope='col' className='px-3 py-3 text-right font-normal sm:px-4'>
                      <Link href={`/f1-dashboard/piloto/${d.driverId}`} className='text-display underline-offset-4 hover:underline'>
                        <span className='hidden sm:inline'>{d.givenName} </span>{d.familyName}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className='border-b border-border last:border-0'>
                    <th scope='row' className='min-w-[9rem] px-3 py-3 text-left font-normal sm:px-4'>
                      <span className='label'>{row.label}</span>
                      <Bar share={row.aShare} />
                    </th>
                    <Value text={row.aText} leader={row.leader === 'a'} />
                    <Value text={row.bText} leader={row.leader === 'b'} />
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>

          <section aria-labelledby='h2h-title' className='space-y-4'>
            <h2 id='h2h-title' className='label'>CARA A CARA</h2>
            {h2h && h2h.shared > 0 ? (
              <>
                <p className='text-sm text-muted-foreground'>
                  {h2h.shared} {h2h.shared === 1 ? 'carrera' : 'carreras'} en las que coincidieron. Quien termina clasificado se
                  considera por delante de quien no termina.
                </p>
                <ul className='grid gap-3 sm:grid-cols-2'>
                  <H2HLine label='ADELANTE EN LA CARRERA' a={h2h.raceA} b={h2h.raceB} tied={h2h.raceTied} nameA={both.a.driver.familyName} nameB={both.b.driver.familyName} />
                  <H2HLine label='ADELANTE EN LA PARRILLA' a={h2h.gridA} b={h2h.gridB} tied={h2h.gridTied} nameA={both.a.driver.familyName} nameB={both.b.driver.familyName} />
                </ul>
              </>
            ) : (
              <p className='rounded-xl border border-border bg-card p-5 text-muted-foreground'>No coincidieron en ninguna carrera.</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

export default ComparePage
