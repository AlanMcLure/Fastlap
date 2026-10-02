import type { Metadata } from 'next'
import Link from 'next/link'

import DataError from '@/components/f1-dashboard/DataError'
import DriverGuessGame from '@/components/games/DriverGuessGame'
import { dateKeyMadrid, MAX_ATTEMPTS } from '@/lib/games/driverGuess'
import { loadGamePool } from '@/lib/games/driverGuessData'

// A new puzzle every day: never cache the page across midnight.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Adivina el piloto',
  description: 'Un piloto secreto de la parrilla de F1 cada día. Adivínalo en 8 intentos con pistas de nacionalidad, equipo, número, edad, victorias y puntos.',
  alternates: { canonical: '/juegos/adivina-piloto' },
}

const DriverGuessPage = async () => {
  const now = new Date()
  let loaded: Awaited<ReturnType<typeof loadGamePool>> = null
  try {
    loaded = await loadGamePool(now)
  } catch (error) {
    console.error('Daily driver game unavailable', error)
  }

  return (
    <div className='mx-auto max-w-3xl space-y-6 py-6'>
      <header className='space-y-3'>
        <p className='label'>JUEGOS · DIARIO</p>
        <h1 className='text-3xl font-bold text-display'>Adivina el piloto</h1>
        <p className='text-sm text-muted-foreground'>
          Hay un piloto secreto de la parrilla y cambia cada día. Tienes {MAX_ATTEMPTS} intentos: cada uno te dice qué coincide
          (✓), y en números si el secreto tiene más (↑) o menos (↓). Las pistas son nacionalidad, equipo, número, edad, victorias y
          puntos de la temporada.
        </p>
        <Link href='/juegos' className='text-sm text-muted-foreground underline underline-offset-4 hover:text-display'>
          Todos los juegos
        </Link>
      </header>

      {loaded && loaded.pool.length > 0 ? (
        <DriverGuessGame
          date={dateKeyMadrid(now)}
          season={loaded.season}
          pool={loaded.pool.map(({ id, name }) => ({ id, name }))}
        />
      ) : (
        <DataError refresh message='El juego de hoy no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.' />
      )}
    </div>
  )
}

export default DriverGuessPage
