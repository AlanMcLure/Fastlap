'use client'

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { FC, useState } from 'react'

import { toast } from '@/hooks/use-toast'
import type { DotdState, Tally } from '@/lib/raceHub'
import { cn } from '@/lib/utils'

export interface Candidate {
  driverId: string
  name: string
  code: string
  team: string
}

interface DriverOfDayProps {
  season: number
  round: number
  candidates: Candidate[]
  state: DotdState
  initialTally: Tally[]
  initialMine: string | null
  signedIn: boolean
}

interface VoteResponse {
  mine: string
  tally: Tally[]
}

const DriverOfDay: FC<DriverOfDayProps> = ({ season, round, candidates, state, initialTally, initialMine, signedIn }) => {
  const [tally, setTally] = useState(initialTally)
  const [mine, setMine] = useState(initialMine)

  const { mutate, isPending } = useMutation({
    mutationFn: async (driverId: string) => {
      const { data } = await axios.post<VoteResponse>('/api/f1/dotd', { season, round, driverId })
      return data
    },
    onSuccess: (data) => {
      setMine(data.mine)
      setTally(data.tally)
    },
    onError: () =>
      toast({
        title: 'No se ha podido votar',
        description: 'Puede que la votación haya cerrado. Inténtalo de nuevo.',
        variant: 'destructive',
      }),
  })

  const byId = new Map(candidates.map((c) => [c.driverId, c]))
  const total = tally.reduce((sum, t) => sum + t.votes, 0)
  const canVote = state === 'open' && signedIn

  return (
    <section aria-labelledby='dotd-title' className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <h2 id='dotd-title' className='label'>PILOTO DEL DÍA</h2>
        <p className='label'>
          {state === 'open' ? 'VOTACIÓN ABIERTA' : state === 'closed' ? 'VOTACIÓN CERRADA' : 'SE ABRE AL TERMINAR LA CARRERA'}
        </p>
      </div>

      {state === 'not-open' ? (
        <p className='rounded-xl border border-border bg-card p-5 text-foreground'>
          Podrás votar a tu piloto del día cuando termine la carrera y haya resultados. La votación dura 48 horas.
        </p>
      ) : (
        <div className='space-y-4 rounded-xl border border-input bg-card p-5'>
          {state === 'open' && !signedIn && (
            <p className='text-sm text-muted-foreground'>
              <Link href='/sign-in' className='text-display underline underline-offset-4'>Inicia sesión</Link> para votar.
            </p>
          )}

          {canVote && (
            <div role='radiogroup' aria-label='Elige tu piloto del día' className='flex flex-wrap gap-2'>
              {candidates.map((c) => (
                <button
                  key={c.driverId}
                  type='button'
                  role='radio'
                  aria-checked={mine === c.driverId}
                  disabled={isPending}
                  onClick={() => mine !== c.driverId && mutate(c.driverId)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
                    mine === c.driverId
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input text-foreground hover:border-display'
                  )}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {tally.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Todavía no hay votos.</p>
          ) : (
            <ol aria-label='Resultado de la votación' className='space-y-3'>
              {tally.slice(0, 5).map((t) => {
                const c = byId.get(t.driverId)
                return (
                  <li key={t.driverId}>
                    <div className='flex items-baseline justify-between gap-3 text-sm'>
                      <span className={cn('text-foreground', mine === t.driverId && 'text-display')}>
                        {c?.name ?? t.driverId}
                        {mine === t.driverId && <span className='label ml-2'>TU VOTO</span>}
                      </span>
                      <span className='tabular-nums text-muted-foreground'>{t.percent}% · {t.votes}</span>
                    </div>
                    <div className='mt-1 h-1 rounded-full bg-muted' aria-hidden='true'>
                      <div className='h-1 rounded-full bg-primary' style={{ width: `${t.percent}%` }} />
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
          {total > 0 && <p className='label'>{total} {total === 1 ? 'VOTO' : 'VOTOS'}</p>}
        </div>
      )}
    </section>
  )
}

export default DriverOfDay
