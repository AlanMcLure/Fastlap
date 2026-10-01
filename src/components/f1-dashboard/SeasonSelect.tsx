'use client'

import { useRouter } from 'next/navigation'

interface SeasonSelectProps {
  value: number
  years: number[]
}

const SeasonSelect = ({ value, years }: SeasonSelectProps) => {
  const router = useRouter()

  return (
    <label className='flex items-center gap-3'>
      <span className='label'>TEMPORADA</span>
      <select value={value} onChange={(e) => router.push(`/f1-dashboard/carreras?season=${e.target.value}`)}>
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
