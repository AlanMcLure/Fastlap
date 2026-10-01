'use client'

import { useRouter } from 'next/navigation'
import { FC } from 'react'

export interface DriverOption {
  id: string
  name: string
}

interface CompareFormProps {
  a: string
  b: string
  season: number
  years: number[]
  options: DriverOption[]
}

/** Two drivers (and the season that fills the lists) in the URL: the page is shareable and works with the back button. */
const CompareForm: FC<CompareFormProps> = ({ a, b, season, years, options }) => {
  const router = useRouter()

  const go = (next: { a?: string; b?: string; season?: number }) => {
    const params = new URLSearchParams()
    const na = next.a ?? a
    const nb = next.b ?? b
    if (na) params.set('a', na)
    if (nb) params.set('b', nb)
    params.set('season', String(next.season ?? season))
    router.push(`/f1-dashboard/comparar?${params.toString()}`)
  }

  const picker = (label: string, value: string, key: 'a' | 'b') => (
    <label className='flex min-w-0 flex-col gap-1.5'>
      <span className='label'>{label}</span>
      <select value={value} onChange={(e) => go({ [key]: e.target.value })}>
        <option value=''>Elige piloto</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </label>
  )

  return (
    <form onSubmit={(e) => e.preventDefault()} className='grid gap-4 rounded-xl border border-input bg-card p-5 sm:grid-cols-3' aria-label='Elegir pilotos a comparar'>
      {picker('PILOTO A', a, 'a')}
      {picker('PILOTO B', b, 'b')}
      <label className='flex min-w-0 flex-col gap-1.5'>
        <span className='label'>LISTA DE LA TEMPORADA</span>
        <select value={season} onChange={(e) => go({ season: Number(e.target.value) })}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
    </form>
  )
}

export default CompareForm
