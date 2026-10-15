import Link from 'next/link'
import { notFound } from 'next/navigation'

import BackButton from '@/components/BackButton'
import ScrollRegion from '@/components/ScrollRegion'
import DataError from '@/components/f1-dashboard/DataError'
import StatTile from '@/components/f1-dashboard/StatTile'
import BarList from '@/components/f1-stats/BarList'
import StatsAttribution from '@/components/f1-stats/StatsAttribution'
import { statsEnabled } from '@/lib/f1stats/client'
import { getCircuit, getCircuitHistory } from '@/lib/f1stats/queries'
import { circuitFacts } from '@/lib/f1stats/records'

export const metadata = { title: 'Circuito · FastLap' }

interface CircuitPageProps {
  params: Promise<{ id: string }>
}

const CircuitPage = async ({ params }: CircuitPageProps) => {
  if (!statsEnabled()) notFound()
  const { id } = await params
  if (!/^[a-z0-9-]{1,80}$/.test(id)) notFound()

  let circuit
  let history
  try {
    ;[circuit, history] = await Promise.all([getCircuit(id), getCircuitHistory(id)])
  } catch (error) {
    console.error('Could not load the circuit', error)
    return (
      <div className='max-w-5xl space-y-6'>
        <BackButton defaultPath='/f1-dashboard/carreras' backText='Volver' className='-ml-5' />
        <DataError message='Los datos del circuito no están disponibles ahora mismo.' refresh />
      </div>
    )
  }
  if (!circuit || !history) notFound()

  const facts = circuitFacts(circuit)
  const latest = history.editions[0]

  return (
    <div className='max-w-5xl space-y-8'>
      <div>
        <BackButton defaultPath='/f1-dashboard/carreras' backText='Volver' className='-ml-5' />
        <p className='label mt-4'>CIRCUITO · {facts.join(' · ').toUpperCase()}</p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>{circuit.fullName}</h1>
        <p className='mt-2 text-muted-foreground'>
          {circuit.placeName}
          {circuit.previousNames ? ` · Antes: ${circuit.previousNames}` : ''}
          {circuit.latitude != null && circuit.longitude != null && (
            <>
              {' · '}
              <a
                href={`https://www.openstreetmap.org/?mlat=${circuit.latitude}&mlon=${circuit.longitude}#map=15/${circuit.latitude}/${circuit.longitude}`}
                target='_blank'
                rel='noreferrer'
                className='underline-offset-4 hover:text-display hover:underline'>
                Ver en el mapa
              </a>
            </>
          )}
        </p>
      </div>

      <section aria-label='Cifras del circuito' className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        <StatTile label='GRANDES PREMIOS' value={history.races} detail={latest ? `Desde ${history.editions.at(-1)?.year}` : undefined} />
        <StatTile label='LONGITUD' value={circuit.length ? `${circuit.length} km` : '—'} detail={circuit.turns ? `${circuit.turns} curvas` : undefined} />
        <StatTile
          label='DE LA POLE A LA VICTORIA'
          value={history.poleToWinPercent != null ? `${Math.round(history.poleToWinPercent)} %` : '—'}
          detail={`${history.poleToWin} veces`}
        />
        <StatTile
          label='ÚLTIMO GANADOR'
          value={latest?.winnerName?.split(' ').at(-1) ?? '—'}
          detail={latest ? `${latest.year} · ${latest.winnerConstructorName ?? ''}` : undefined}
        />
      </section>

      <div className='grid gap-6 lg:grid-cols-2'>
        <BarList
          title='PILOTOS CON MÁS VICTORIAS'
          names
          mode='amount'
          items={history.mostWinsDrivers.map((leader) => ({
            key: leader.id,
            label: leader.name ?? leader.id,
            value: leader.wins,
            display: String(leader.wins),
          }))}
        />
        <BarList
          title='EQUIPOS CON MÁS VICTORIAS'
          names
          mode='amount'
          items={history.mostWinsConstructors.map((leader) => ({
            key: leader.id,
            label: leader.name ?? leader.id,
            value: leader.wins,
            display: String(leader.wins),
          }))}
        />
      </div>

      <section aria-labelledby='editions-title' className='space-y-4'>
        <h2 id='editions-title' className='label'>TODAS LAS EDICIONES</h2>
        <ScrollRegion label={`Ganadores en ${circuit.name}`}>
          <table className='w-full border-collapse text-left tabular-nums'>
            <caption className='sr-only'>Ganador, pole y vuelta rápida de cada Gran Premio disputado en {circuit.name}</caption>
            <thead>
              <tr className='label border-b border-border'>
                <th scope='col' className='w-16 px-4 py-3 font-normal'>AÑO</th>
                <th scope='col' className='px-2 py-3 font-normal'>GANADOR</th>
                <th scope='col' className='hidden px-2 py-3 font-normal sm:table-cell'>EQUIPO</th>
                <th scope='col' className='hidden px-2 py-3 font-normal md:table-cell'>POLE</th>
                <th scope='col' className='px-4 py-3 font-normal'>VUELTA RÁPIDA</th>
              </tr>
            </thead>
            <tbody>
              {history.editions.map((edition) => (
                <tr key={edition.raceId} className='border-b border-border last:border-0'>
                  <td className='px-4 py-3 font-mono'>
                    <Link href={`/f1-dashboard/carrera/${edition.year}/${edition.round}`} className='text-display underline-offset-4 hover:underline'>
                      {edition.year}
                    </Link>
                  </td>
                  <td className='px-2 py-3 text-display'>
                    {edition.winnerName ?? '—'}
                    {edition.poleId && edition.poleId === edition.winnerId && (
                      <span className='label ml-2' title='Ganó desde la pole'>
                        DESDE LA POLE
                      </span>
                    )}
                  </td>
                  <td className='hidden px-2 py-3 text-sm text-muted-foreground sm:table-cell'>{edition.winnerConstructorName ?? '—'}</td>
                  <td className='hidden px-2 py-3 text-sm text-muted-foreground md:table-cell'>{edition.poleName ?? '—'}</td>
                  <td className='px-4 py-3 text-sm text-muted-foreground'>
                    {edition.fastestLapName ?? '—'}
                    {edition.fastestLapTime && <span className='ml-2 font-mono'>{edition.fastestLapTime}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <p className='text-xs text-muted-foreground'>
          La longitud y el trazado han cambiado con los años: los tiempos de vuelta de épocas distintas no son comparables.
        </p>
      </section>

      <StatsAttribution detailed={false} />
    </div>
  )
}

export default CircuitPage
