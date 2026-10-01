'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { Progression } from '@/lib/f1/progression'

// Monochrome (Nothing language): lines differ by lightness and dash pattern, not by hue.
const STYLES = [
  { stroke: 'rgb(var(--display))', dash: undefined, width: 2.5 },
  { stroke: 'rgb(var(--muted-foreground))', dash: undefined, width: 2 },
  { stroke: 'rgb(var(--display))', dash: '6 4', width: 2 },
  { stroke: 'rgb(var(--muted-foreground))', dash: '6 4', width: 2 },
  { stroke: 'rgb(var(--faint))', dash: undefined, width: 2 },
]

export const CHART_SERIES = STYLES.length

interface PointsChartProps {
  progression: Progression
  title: string
}

interface TooltipEntry {
  dataKey?: string | number
  value?: number | string
}

const ChartTooltip = ({
  active,
  payload,
  label,
  progression,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: number
  progression: Progression
}) => {
  if (!active || !payload?.length) return null
  const round = progression.rounds.find((r) => r.round === label)
  const names = new Map(progression.series.map((s) => [s.id, s.code]))

  return (
    <div className='rounded-lg border border-input bg-popover px-3 py-2 text-sm'>
      <p className='label mb-2'>
        R{label} · {round?.raceName}
      </p>
      <ul className='space-y-1 tabular-nums'>
        {[...payload]
          .sort((a, b) => Number(b.value) - Number(a.value))
          .map((entry) => (
            <li key={String(entry.dataKey)} className='flex justify-between gap-6'>
              <span className='font-mono text-foreground'>{names.get(String(entry.dataKey))}</span>
              <span className='font-mono text-display'>{entry.value}</span>
            </li>
          ))}
      </ul>
    </div>
  )
}

/** Accumulated points of the leading drivers or teams, round by round. */
const PointsChart = ({ progression, title }: PointsChartProps) => {
  const top = progression.series.slice(0, CHART_SERIES)
  const data = progression.rounds.map((round, index) => ({
    round: round.round,
    ...Object.fromEntries(top.map((series) => [series.id, series.points[index]])),
  }))

  return (
    <figure className='rounded-2xl border border-input bg-card p-4 sm:p-6'>
      <figcaption className='label mb-4'>{title}</figcaption>

      <div className='h-72 w-full' role='img' aria-label={`${title}: ${top.map((s) => s.name).join(', ')}`}>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke='rgb(var(--border))' vertical={false} />
            <XAxis
              dataKey='round'
              tickLine={false}
              axisLine={{ stroke: 'rgb(var(--input))' }}
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(round) => `R${round}`}
              interval='preserveStartEnd'
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: 'rgb(var(--input))' }}
              content={<ChartTooltip progression={progression} />}
            />
            {top.map((series, index) => (
              <Line
                key={series.id}
                type='linear'
                dataKey={series.id}
                stroke={STYLES[index].stroke}
                strokeWidth={STYLES[index].width}
                strokeDasharray={STYLES[index].dash}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className='mt-4 flex flex-wrap gap-x-5 gap-y-2'>
        {top.map((series, index) => (
          <li key={series.id} className='flex items-center gap-2'>
            <svg width='22' height='6' aria-hidden='true'>
              <line
                x1='0'
                y1='3'
                x2='22'
                y2='3'
                stroke={STYLES[index].stroke}
                strokeWidth={STYLES[index].width}
                strokeDasharray={STYLES[index].dash}
              />
            </svg>
            <span className='label text-foreground'>{series.code}</span>
          </li>
        ))}
      </ul>
      <p className='mt-4 text-xs text-muted-foreground'>
        Puntos acumulados calculados a partir del resultado de cada carrera (y sprint). Pueden diferir del campeonato oficial si hubo sanciones posteriores.
      </p>
    </figure>
  )
}

export default PointsChart
