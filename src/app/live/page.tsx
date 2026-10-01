import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import LiveTower from '@/components/live/LiveTower'
import { liveEnabled } from '@/lib/live/hub'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Directo (prototipo)' }

/** Prototype of slice 9: live timing tower over a simulated source. Off unless LIVE_SIMULATION=true. */
const LivePage = () => {
  if (!liveEnabled()) notFound()

  return (
    <div className='mx-auto max-w-3xl space-y-6 py-6'>
      <header>
        <p className='label'>PROTOTIPO · DATOS SIMULADOS</p>
        <h1 className='mt-2 text-3xl font-bold text-display'>Directo</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Carrera simulada con pilotos inventados. No es una sesión real: sirve para medir cómo se reparte un directo
          antes de conectar una fuente de verdad.
        </p>
      </header>
      <LiveTower />
    </div>
  )
}

export default LivePage
