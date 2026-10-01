import Link from 'next/link'

import DataError from '@/components/f1-dashboard/DataError'
import DriverStandings from '@/components/f1-dashboard/DriverStandings'
import NextRaceCard from '@/components/f1-dashboard/NextRaceCard'
import { getNextRace } from '@/lib/f1/queries'
import type { Race } from '@/lib/f1/schemas'

// Rendered per request: the status of each race (finished, next...) depends on the current time.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'F1 · FastLap' }

const DashboardPage = async () => {
  let nextRace: Race | null = null
  let failed = false

  try {
    nextRace = await getNextRace()
  } catch (error) {
    console.error('Could not load the next race', error)
    failed = true
  }

  return (
    <div className='space-y-8 px-4 pb-16 sm:px-6'>
      <div>
        <p className='label'>FÓRMULA 1</p>
        <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>Dashboard</h1>
      </div>

      {failed ? (
        <DataError refresh />
      ) : nextRace ? (
        <NextRaceCard race={nextRace} />
      ) : (
        <div className='rounded-xl border border-border bg-card p-6'>
          <p className='text-foreground'>La temporada ha terminado y el calendario de la siguiente aún no está publicado.</p>
          <Link href='/f1-dashboard/carreras' className='label mt-4 inline-block text-display underline-offset-4 hover:underline'>
            VER EL CALENDARIO
          </Link>
        </div>
      )}

      <DriverStandings />
    </div>
  )
}

export default DashboardPage
