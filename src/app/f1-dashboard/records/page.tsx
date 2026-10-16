import Link from 'next/link'
import { notFound } from 'next/navigation'

import BackButton from '@/components/BackButton'
import DataError from '@/components/f1-dashboard/DataError'
import BarList from '@/components/f1-stats/BarList'
import StatsAttribution from '@/components/f1-stats/StatsAttribution'
import { statsEnabled } from '@/lib/f1stats/client'
import { getConstructorRecords, getDriverRecords, type RecordKind } from '@/lib/f1stats/queries'
import type { StatsConstructor, StatsDriver } from '@/lib/f1stats/schemas'

export const metadata = { title: 'Récords · FastLap' }

// Rendered per request: the tab comes from the URL (the data itself is cached for a day).
export const dynamic = 'force-dynamic'

const CATEGORIES: { kind: RecordKind; title: string; driverField: keyof StatsDriver; teamField: keyof StatsConstructor }[] = [
  { kind: 'titles', title: 'MUNDIALES', driverField: 'totalChampionshipWins', teamField: 'totalChampionshipWins' },
  { kind: 'wins', title: 'VICTORIAS', driverField: 'totalRaceWins', teamField: 'totalRaceWins' },
  { kind: 'poles', title: 'POLES', driverField: 'totalPolePositions', teamField: 'totalPolePositions' },
  { kind: 'podiums', title: 'PODIOS', driverField: 'totalPodiums', teamField: 'totalPodiums' },
  { kind: 'fastestLaps', title: 'VUELTAS RÁPIDAS', driverField: 'totalFastestLaps', teamField: 'totalFastestLaps' },
  { kind: 'starts', title: 'GRANDES PREMIOS', driverField: 'totalRaceStarts', teamField: 'totalRaceStarts' },
  { kind: 'points', title: 'PUNTOS', driverField: 'totalPoints', teamField: 'totalPoints' },
]

interface RecordsPageProps {
  searchParams: Promise<{ tipo?: string }>
}

const formatNumber = (value: number) =>
  Number.isInteger(value) ? value.toLocaleString('es-ES') : value.toLocaleString('es-ES', { maximumFractionDigits: 1 })

const RecordsPage = async ({ searchParams }: RecordsPageProps) => {
  if (!statsEnabled()) notFound()
  const teams = (await searchParams).tipo === 'equipos'

  let boards: { title: string; description?: string; rows: { id: string; name: string; value: number; extra?: string }[] }[]
  try {
    boards = await Promise.all(
      CATEGORIES.map(async (category) => {
        if (teams) {
          const rows = await getConstructorRecords(category.kind)
          return {
            title: category.title,
            rows: rows.map((c) => ({ id: c.id, name: c.name, value: Number(c[category.teamField]) })),
          }
        }
        const rows = await getDriverRecords(category.kind)
        return {
          title: category.title,
          description: category.kind === 'wins' ? 'Al lado, el porcentaje de sus carreras que ganó.' : undefined,
          rows: rows.map((d) => ({
            id: d.id,
            name: d.name,
            value: Number(d[category.driverField]),
            extra:
              category.kind === 'wins' && d.totalRaceStarts > 0
                ? `${Math.round((d.totalRaceWins / d.totalRaceStarts) * 100)} %`
                : undefined,
          })),
        }
      })
    )
  } catch (error) {
    console.error('Could not load the records', error)
    boards = []
  }

  const tab = (value: boolean, label: string) => (
    <Link
      href={value ? '/f1-dashboard/records?tipo=equipos' : '/f1-dashboard/records'}
      aria-current={teams === value ? 'page' : undefined}
      className={`label rounded-full px-4 py-2 transition-colors ${teams === value ? 'bg-primary text-primary-foreground' : 'hover:text-display'}`}>
      {label}
    </Link>
  )

  return (
    <div className='max-w-5xl space-y-8'>
      <div>
        <BackButton defaultPath='/f1-dashboard' backText='Volver al Dashboard' className='-ml-5' />
        <p className='label mt-4'>HISTORIA DE LA F1 · DESDE 1950</p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>Récords</h1>
        <div className='mt-6 inline-flex rounded-full border border-input p-0.5'>
          {tab(false, 'PILOTOS')}
          {tab(true, 'EQUIPOS')}
        </div>
      </div>

      {boards.length === 0 ? (
        <DataError message='Los récords no están disponibles ahora mismo.' refresh />
      ) : (
        <div className='grid gap-6 lg:grid-cols-2'>
          {boards.map((board) => {
            return (
              <BarList
                key={board.title}
                title={board.title}
                description={board.description}
                names
                mode='amount'
                items={board.rows.map((row) => ({
                  key: row.id,
                  label: row.name,
                  value: row.value,
                  display: formatNumber(row.value),
                  aside: row.extra,
                }))}
              />
            )
          })}
        </div>
      )}
      <p className='text-xs text-muted-foreground'>
        Los puntos no son comparables entre épocas: el reparto cambió muchas veces (hoy gana 25 el primero; en 1950, 8).
      </p>
      <StatsAttribution detailed={false} />
    </div>
  )
}

export default RecordsPage
