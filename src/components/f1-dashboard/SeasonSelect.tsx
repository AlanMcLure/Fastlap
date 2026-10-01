'use client'

import { useRouter } from 'next/navigation'

interface SeasonSelectProps {
  value: number
  years: number[]
  /** Page the selector navigates to, e.g. "/f1-dashboard/carreras". */
  basePath: string
  /** Other query parameters to keep when the season changes. */
  keep?: Record<string, string>
}

const SeasonSelect = ({ value, years, basePath, keep = {} }: SeasonSelectProps) => {
  const router = useRouter()

  const go = (season: string) => {
    const params = new URLSearchParams({ ...keep, season })
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <label className='flex items-center gap-3'>
      <span className='label'>TEMPORADA</span>
      <select value={value} onChange={(e) => go(e.target.value)}>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  )
}

export default SeasonSelect
