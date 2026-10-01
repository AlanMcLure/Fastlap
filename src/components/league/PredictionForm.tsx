'use client'

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { FC, FormEvent, useState } from 'react'

import LocalTime from '@/components/f1-dashboard/LocalTime'
import { Button } from '@/components/ui/Button'
import { toast } from '@/hooks/use-toast'
import type { PredictionKind } from '@/lib/league'

export interface DriverOption {
  id: string
  name: string
}

interface PredictionFormProps {
  leagueId: string
  round: number
  kind: PredictionKind
  drivers: DriverOption[]
  initial: { p1: string; p2: string; p3: string; fastestLap: string | null } | null
  deadlineIso: string
  /** Deadline already passed: the saved guess is shown, not editable. */
  locked: boolean
}

const PLACES = ['p1', 'p2', 'p3'] as const

const PredictionForm: FC<PredictionFormProps> = ({ leagueId, round, kind, drivers, initial, deadlineIso, locked }) => {
  const router = useRouter()
  const [pick, setPick] = useState({
    p1: initial?.p1 ?? '',
    p2: initial?.p2 ?? '',
    p3: initial?.p3 ?? '',
    fastestLap: initial?.fastestLap ?? '',
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await axios.post('/api/league/predict', {
        leagueId,
        round,
        kind,
        p1: pick.p1,
        p2: pick.p2,
        p3: pick.p3,
        fastestLap: kind === 'RACE' && pick.fastestLap ? pick.fastestLap : null,
      })
    },
    onSuccess: () => {
      toast({ description: 'Pronóstico guardado. Puedes cambiarlo hasta que se cierre.' })
      router.refresh()
    },
    onError: (error) =>
      toast({
        title: 'No se ha guardado',
        description: axios.isAxiosError(error) && typeof error.response?.data === 'string'
          ? error.response.data
          : 'Inténtalo de nuevo.',
        variant: 'destructive',
      }),
  })

  const name = (id: string) => drivers.find((d) => d.id === id)?.name ?? id
  const title = kind === 'RACE' ? 'CARRERA' : 'SPRINT'
  const complete = PLACES.every((p) => pick[p]) && new Set(PLACES.map((p) => pick[p])).size === 3

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (complete) mutate()
  }

  const chosen = PLACES.map((p) => pick[p]).filter(Boolean)
  const repeated = new Set(chosen).size !== chosen.length

  return (
    <form onSubmit={submit} className='space-y-4 rounded-xl border border-input bg-card p-5' aria-label={`Pronóstico de ${title.toLowerCase()}`}>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='label'>PRONÓSTICO · {title}</h3>
        <p className='label'>
          {locked ? 'CERRADO' : <>CIERRA <LocalTime iso={deadlineIso} /></>}
        </p>
      </div>

      {locked ? (
        initial ? (
          <ol className='space-y-1 text-foreground'>
            {PLACES.map((p, i) => (
              <li key={p}><span className='label mr-3'>P{i + 1}</span>{name(initial[p])}</li>
            ))}
            {kind === 'RACE' && initial.fastestLap && (
              <li><span className='label mr-3'>VR</span>{name(initial.fastestLap)}</li>
            )}
          </ol>
        ) : (
          <p className='text-sm text-muted-foreground'>No enviaste pronóstico a tiempo.</p>
        )
      ) : (
        <>
          <div className='grid gap-3 sm:grid-cols-2'>
            {PLACES.map((p, i) => (
              <label key={p} className='flex flex-col gap-1.5'>
                <span className='label'>PUESTO {i + 1}</span>
                <select
                  value={pick[p]}
                  aria-invalid={repeated && chosen.filter((id) => id === pick[p]).length > 1}
                  onChange={(e) => setPick({ ...pick, [p]: e.target.value })}
                  required>
                  <option value=''>Elige piloto</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
            ))}
            {kind === 'RACE' && (
              <label className='flex flex-col gap-1.5'>
                <span className='label'>VUELTA RÁPIDA (OPCIONAL)</span>
                <select value={pick.fastestLap} onChange={(e) => setPick({ ...pick, fastestLap: e.target.value })}>
                  <option value=''>Sin pronóstico</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
            )}
          </div>
          {repeated && <p role='alert' className='text-sm text-signal'>Elige tres pilotos distintos.</p>}
          <Button type='submit' size='sm' disabled={!complete || isPending} isLoading={isPending}>
            {initial ? 'Actualizar pronóstico' : 'Guardar pronóstico'}
          </Button>
        </>
      )}
    </form>
  )
}

export default PredictionForm
