import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Juegos',
  description: 'Minijuegos de Fórmula 1 de FastLap: gratis, sin cuenta y con un reto nuevo cada día.',
  alternates: { canonical: '/juegos' },
}

const GAMES = [
  {
    href: '/juegos/adivina-piloto',
    label: 'DIARIO',
    title: 'Adivina el piloto',
    text: 'Un piloto secreto de la parrilla cada día. Adivínalo en 8 intentos con pistas de nacionalidad, equipo, número, edad, victorias y puntos.',
  },
]

const GamesPage = () => (
  <div className='mx-auto max-w-3xl space-y-8 py-6'>
    <header className='space-y-3'>
      <p className='label'>JUEGOS</p>
      <h1 className='text-3xl font-bold text-display'>Minijuegos de F1</h1>
      <p className='text-sm text-muted-foreground'>
        Gratis, sin cuenta y sin premios: solo por diversión. Tu progreso se guarda en tu navegador.
      </p>
    </header>

    <ul className='grid gap-4 sm:grid-cols-2'>
      {GAMES.map((game) => (
        <li key={game.href}>
          <Link
            href={game.href}
            className='block h-full rounded-xl border border-input bg-card p-5 transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
            <p className='label'>{game.label}</p>
            <h2 className='mt-2 text-xl font-semibold text-display'>{game.title}</h2>
            <p className='mt-2 text-sm text-muted-foreground'>{game.text}</p>
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default GamesPage
