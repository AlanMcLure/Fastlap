'use client'

import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatDelta, formatLapTime } from '@/lib/f1stats/race'
import type { LapComparison } from '@/lib/f1stats/schemas'

interface LapComparisonChartProps {
  comparison: LapComparison
  codeA: string
  codeB: string
}

interface Row {
  lap: number
  delta: number | null
  gap: number | null
  timeA: number | null
  timeB: number | null
}

/** Bars beyond this are laps behind the safety car, pit stops or incidents: clipped to keep the scale readable. */
const CLIP = 3

/**
 * Two drivers lap by lap: bars = how much faster A was on that lap (up) or B (down); line = distance
 * between them on track at the end of each lap (positive = A ahead).
 */
const LapComparisonChart = ({ comparison, codeA, codeB }: LapComparisonChartProps) => {
  const rows: Row[] = comparison.laps.map((lap) => ({
    lap: lap.lap,
    delta: lap.delta == null ? null : Math.max(-CLIP, Math.min(CLIP, lap.delta)),
    gap: lap.gap,
    timeA: lap.timeA,
    timeB: lap.timeB,
  }))

  const renderTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload?: Row }[]; label?: number }) => {
    const row = active ? payload?.[0]?.payload : undefined
    if (!row) return null
    return (
      <div className='rounded-lg border border-input bg-popover px-3 py-2 text-sm tabular-nums'>
        <p className='label mb-2'>VUELTA {label}</p>
        <p className='flex justify-between gap-6 font-mono'>
          <span>{codeA}</span>
          <span className='text-display'>{formatLapTime(row.timeA)}</span>
        </p>
        <p className='flex justify-between gap-6 font-mono'>
          <span>{codeB}</span>
          <span className='text-display'>{formatLapTime(row.timeB)}</span>
        </p>
        <p className='mt-1 flex justify-between gap-6 font-mono text-muted-foreground'>
          <span>EN PISTA</span>
          <span>{formatDelta(row.gap)}</span>
        </p>
      </div>
    )
  }

  return (
    <figure className='rounded-2xl border border-input bg-card p-4 sm:p-6'>
      <figcaption>
        <span className='label'>
          {codeA} CONTRA {codeB} · VUELTA A VUELTA
        </span>
        <span className='mt-1 block text-sm text-muted-foreground'>
          Barras: diferencia en cada vuelta (hacia arriba, {codeA} más rápido; recortadas a ±{CLIP} s). Línea: distancia en
          pista al final de cada vuelta (hacia arriba, {codeA} delante).
        </span>
      </figcaption>
      <div className='mt-4 h-72 w-full' role='img' aria-label={`Comparación vuelta a vuelta entre ${codeA} y ${codeB}`}>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid stroke='rgb(var(--border))' vertical={false} />
            <XAxis
              dataKey='lap'
              tickLine={false}
              axisLine={{ stroke: 'rgb(var(--input))' }}
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(lap) => `V${lap}`}
            />
            <YAxis
              yAxisId='delta'
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
              width={40}
              domain={[-CLIP, CLIP]}
              allowDataOverflow
            />
            <YAxis
              yAxisId='gap'
              orientation='right'
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
              width={40}
            />
            <ReferenceLine yAxisId='delta' y={0} stroke='rgb(var(--input))' />
            <Tooltip cursor={{ fill: 'rgb(var(--muted))' }} content={renderTooltip} />
            <Bar yAxisId='delta' dataKey='delta' fill='rgb(var(--muted-foreground))' isAnimationActive={false} />
            <Line
              yAxisId='gap'
              type='linear'
              dataKey='gap'
              stroke='rgb(var(--display))'
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <dl className='mt-4 grid grid-cols-3 gap-3 text-center'>
        <div>
          <dt className='label'>VUELTAS MÁS RÁPIDO · {codeA}</dt>
          <dd className='mt-1 font-mono text-2xl text-display'>{comparison.lapsFasterA}</dd>
        </div>
        <div>
          <dt className='label'>VUELTAS MÁS RÁPIDO · {codeB}</dt>
          <dd className='mt-1 font-mono text-2xl text-display'>{comparison.lapsFasterB}</dd>
        </div>
        <div>
          <dt className='label'>DIFERENCIA MEDIA</dt>
          <dd className='mt-1 font-mono text-2xl text-display'>{formatDelta(comparison.averageDelta)}</dd>
        </div>
      </dl>
    </figure>
  )
}

export default LapComparisonChart
