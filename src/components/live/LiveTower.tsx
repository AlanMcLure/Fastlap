'use client'

import { useEffect, useRef, useState } from 'react'

import type { LiveState } from '@/lib/live/types'
import { cn } from '@/lib/utils'

type Connection = 'connecting' | 'live' | 'reconnecting'

const STATUS_LABEL: Record<LiveState['status'], string> = {
  green: 'BANDERA VERDE',
  'safety-car': 'SAFETY CAR',
  finished: 'CARRERA TERMINADA',
}

const seconds = (value: number) => value.toFixed(1)

/** Live timing tower fed by the SSE stream. EventSource reconnects by itself; stale updates are dropped by `seq`. */
const LiveTower = () => {
  const [state, setState] = useState<LiveState | null>(null)
  const [connection, setConnection] = useState<Connection>('connecting')
  const last = useRef({ run: 0, seq: 0 })

  useEffect(() => {
    const source = new EventSource('/api/live/stream')
    source.onopen = () => setConnection('live')
    source.onerror = () => setConnection('reconnecting')
    source.onmessage = (event) => {
      const next: LiveState = JSON.parse(event.data)
      // Drop duplicates and out-of-order updates; a new run restarts its seq at 1.
      if (next.run === last.current.run && next.seq <= last.current.seq) return
      last.current = { run: next.run, seq: next.seq }
      setState(next)
    }
    return () => source.close()
  }, [])

  if (!state) {
    return <p className='rounded-xl border border-border bg-card p-5 text-foreground'>Conectando con el directo…</p>
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='label flex items-center gap-2'>
          <span className={cn(state.status === 'safety-car' ? 'text-signal' : 'text-display')} aria-hidden='true'>●</span>
          {STATUS_LABEL[state.status]} · VUELTA {state.lap}/{state.totalLaps}
        </p>
        <p className='label' aria-live='polite'>
          {connection === 'live' ? 'EN DIRECTO' : connection === 'reconnecting' ? 'RECONECTANDO…' : 'CONECTANDO…'}
        </p>
      </div>

      <div className='overflow-x-auto rounded-2xl border border-input bg-card'>
        <table className='w-full border-collapse text-left tabular-nums'>
          <caption className='sr-only'>Torre de tiempos en directo</caption>
          <thead>
            <tr className='label border-b border-border'>
              <th scope='col' className='w-12 px-3 py-3 font-normal sm:px-4'>POS</th>
              <th scope='col' className='px-2 py-3 font-normal'>PILOTO</th>
              <th scope='col' className='px-2 py-3 text-right font-normal'>INTERV.</th>
              <th scope='col' className='w-24 px-3 py-3 text-right font-normal sm:px-4'>LÍDER</th>
            </tr>
          </thead>
          <tbody>
            {state.tower.map((row) => (
              <tr key={row.driverId} className='border-b border-border last:border-0'>
                <td className='px-3 py-2.5 text-muted-foreground sm:px-4'>{row.position}</td>
                <td className='px-2 py-2.5 font-mono text-display'>{row.code}</td>
                <td className='px-2 py-2.5 text-right text-muted-foreground'>
                  {row.position === 1 ? '' : `+${seconds(row.interval)}`}
                </td>
                <td className='px-3 py-2.5 text-right text-foreground sm:px-4'>
                  {row.position === 1 ? 'LÍDER' : row.lapsDown > 0 ? `+${row.lapsDown} V` : `+${seconds(row.gap)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-labelledby='rc-title' className='space-y-3'>
        <h2 id='rc-title' className='label'>DIRECCIÓN DE CARRERA</h2>
        {state.messages.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Sin mensajes por ahora.</p>
        ) : (
          <ul className='divide-y divide-border rounded-xl border border-input bg-card'>
            {state.messages.map((m) => (
              <li key={m.id} className='flex gap-4 px-5 py-3 text-sm'>
                <span className='label shrink-0'>V{m.lap}</span>
                <span className='text-foreground'>{m.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default LiveTower
