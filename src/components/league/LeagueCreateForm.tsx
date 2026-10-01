'use client'

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { FC, FormEvent, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/hooks/use-toast'
import { DEFAULT_RULES, MAX_RULE_POINTS } from '@/lib/league'

const FIELDS = [
  { key: 'exactPoints', label: 'PUNTOS POR PUESTO EXACTO' },
  { key: 'presentPoints', label: 'PUNTOS SI ESTÁ EN EL PODIO EN OTRO PUESTO' },
  { key: 'fastestLapPoints', label: 'PUNTOS POR LA VUELTA RÁPIDA' },
] as const

const LeagueCreateForm: FC<{ subredditId: string }> = ({ subredditId }) => {
  const router = useRouter()
  const [rules, setRules] = useState({
    exactPoints: String(DEFAULT_RULES.exactPoints),
    presentPoints: String(DEFAULT_RULES.presentPoints),
    fastestLapPoints: String(DEFAULT_RULES.fastestLapPoints),
  })
  const [sprintEnabled, setSprintEnabled] = useState(DEFAULT_RULES.sprintEnabled)

  const values = {
    exactPoints: Number(rules.exactPoints),
    presentPoints: Number(rules.presentPoints),
    fastestLapPoints: Number(rules.fastestLapPoints),
  }
  const valid = Object.values(values).every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_RULE_POINTS)

  const { mutate, isPending } = useMutation({
    mutationFn: () => axios.post('/api/league/create', { subredditId, ...values, sprintEnabled }),
    onSuccess: () => router.refresh(),
    onError: (error) =>
      toast({
        title: 'No se ha podido abrir la liga',
        description: axios.isAxiosError(error) && error.response?.status === 409
          ? 'Esta comunidad ya tiene liga esta temporada.'
          : 'Inténtalo de nuevo.',
        variant: 'destructive',
      }),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (valid) mutate()
  }

  return (
    <form onSubmit={submit} className='space-y-4 rounded-xl border border-input bg-card p-5'>
      <p className='label'>REGLAS DE LA LIGA</p>
      <div className='grid gap-3 sm:grid-cols-3'>
        {FIELDS.map(({ key, label }) => (
          <label key={key} className='flex flex-col gap-1.5'>
            <span className='label'>{label}</span>
            <Input
              type='number'
              inputMode='numeric'
              min={0}
              max={MAX_RULE_POINTS}
              value={rules[key]}
              onChange={(e) => setRules({ ...rules, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <label className='flex items-center gap-3 text-sm text-foreground'>
        <input type='checkbox' checked={sprintEnabled} onChange={(e) => setSprintEnabled(e.target.checked)} />
        Incluir las carreras sprint
      </label>
      <Button type='submit' disabled={!valid || isPending} isLoading={isPending}>
        Abrir la liga de esta temporada
      </Button>
    </form>
  )
}

export default LeagueCreateForm
