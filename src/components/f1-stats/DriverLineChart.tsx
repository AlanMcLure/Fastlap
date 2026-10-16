'use client'

import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ChartDriver, Neutralisation } from '@/lib/f1stats/race'

// Monochrome (direction B): every driver is a faint line; the chosen ones stand out by lightness and dash.
const HIGHLIGHTS = [
  { stroke: 'rgb(var(--display))', dash: undefined, width: 2.5 },
  { stroke: 'rgb(var(--display))', dash: '6 4', width: 2.25 },
  { stroke: 'rgb(var(--muted-foreground))', dash: undefined, width: 2.25 },
  { stroke: 'rgb(var(--muted-foreground))', dash: '6 4', width: 2 },
  { stroke: 'rgb(var(--display))', dash: '2 3', width: 2 },
]
const MAX_HIGHLIGHTS = HIGHLIGHTS.length

/** How values are shown. A plain string, because functions cannot be passed from server components. */
export type ChartUnit = 'gap' | 'position' | 'percent'

const FORMAT: Record<ChartUnit, { value: (v: number) => string; tick: (v: number) => string }> = {
  gap: { value: (v) => (v === 0 ? 'LÍDER' : `+${v.toFixed(1)} s`), tick: (v) => `${v}s` },
  position: { value: (v) => `P${v}`, tick: (v) => `P${v}` },
  percent: { value: (v) => `${v.toFixed(2).replace('.', ',')} %`, tick: (v) => `${v}%` },
}

const NEUTRAL_LABEL: Record<Neutralisation['kind'], string> = { sc: 'SC', vsc: 'VSC', red: 'ROJA' }

interface DriverLineChartProps {
  title: string
  description: string
  rows: Record<string, number>[]
  drivers: ChartDriver[]
  /** Driver numbers highlighted at first. */
  initial: number[]
  /** Positions: P1 at the top. */
  reversed?: boolean
  yDomain?: [number | string, number | string]
  unit: ChartUnit
  neutralisations?: Neutralisation[]
  footnote?: string
  /** Prefix of the x ticks ("V12") and name of the x unit in the tooltip ("VUELTA 12"). */
  xTick?: string
  xName?: string
  /** Legend title; defaults to drivers. */
  legend?: string
}

interface TooltipEntry {
  dataKey?: string | number
  value?: number | string
}

/** Lap-by-lap line chart of every driver (gaps, positions...) with up to five highlighted drivers. */
const DriverLineChart = ({
  title,
  description,
  rows,
  drivers,
  initial,
  reversed = false,
  yDomain,
  unit,
  neutralisations = [],
  footnote,
  xTick = 'V',
  xName = 'VUELTA',
  legend = 'DESTACAR',
}: DriverLineChartProps) => {
  const [selected, setSelected] = useState<number[]>(initial.slice(0, MAX_HIGHLIGHTS))
  const { value: formatValue, tick: yTickFormat } = FORMAT[unit]
  const codes = new Map(drivers.map((d) => [d.number, d.code]))

  const toggle = (number: number) =>
    setSelected((current) =>
      current.includes(number)
        ? current.filter((n) => n !== number)
        : current.length >= MAX_HIGHLIGHTS
          ? [...current.slice(1), number]
          : [...current, number]
    )

  const style = (number: number) => {
    const index = selected.indexOf(number)
    return index === -1 ? null : HIGHLIGHTS[index]
  }

  // Background lines first so the highlighted ones are drawn on top.
  const order = [...drivers].sort((a, b) => Number(selected.includes(a.number)) - Number(selected.includes(b.number)))

  const renderTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: number }) => {
    if (!active || !payload?.length) return null
    const shown = payload
      .filter((entry) => selected.includes(Number(entry.dataKey)) && entry.value != null)
      .sort((a, b) => Number(a.value) - Number(b.value))
    if (!shown.length) return null
    return (
      <div className='rounded-lg border border-input bg-popover px-3 py-2 text-sm'>
        <p className='label mb-2'>
          {xName} {label}
        </p>
        <ul className='space-y-1 tabular-nums'>
          {shown.map((entry) => (
            <li key={String(entry.dataKey)} className='flex justify-between gap-6'>
              <span className='font-mono text-foreground'>{codes.get(Number(entry.dataKey))}</span>
              <span className='font-mono text-display'>{formatValue(Number(entry.value))}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <figure className='min-w-0 rounded-2xl border border-input bg-card p-4 sm:p-6'>
      <figcaption>
        <span className='label'>{title}</span>
        <span className='mt-1 block text-sm text-muted-foreground'>{description}</span>
      </figcaption>

      <div
        className='mt-4 h-80 w-full'
        role='img'
        aria-label={`${title}. Destacados: ${selected.map((n) => codes.get(n)).join(', ') || 'ninguno'}`}>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid stroke='rgb(var(--border))' vertical={false} />
            {neutralisations.map((period) => (
              <ReferenceArea
                key={`${period.kind}-${period.fromLap}`}
                x1={period.fromLap}
                x2={period.toLap}
                fill='rgb(var(--muted))'
                fillOpacity={1}
                ifOverflow='extendDomain'
                label={{ value: NEUTRAL_LABEL[period.kind], position: 'insideTop', fill: 'rgb(var(--muted-foreground))', fontSize: 10 }}
              />
            ))}
            <XAxis
              dataKey='lap'
              type='number'
              domain={['dataMin', 'dataMax']}
              tickLine={false}
              axisLine={{ stroke: 'rgb(var(--input))' }}
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(lap) => `${xTick}${lap}`}
              allowDecimals={false}
            />
            <YAxis
              reversed={reversed}
              domain={yDomain}
              allowDataOverflow
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={yTickFormat}
              width={44}
              allowDecimals={false}
            />
            <Tooltip cursor={{ stroke: 'rgb(var(--input))' }} content={renderTooltip} />
            {order.map((driver) => {
              const highlight = style(driver.number)
              return (
                <Line
                  key={driver.number}
                  type='linear'
                  dataKey={String(driver.number)}
                  stroke={highlight?.stroke ?? 'rgb(var(--input))'}
                  strokeWidth={highlight?.width ?? 1}
                  strokeDasharray={highlight?.dash}
                  dot={false}
                  activeDot={highlight ? { r: 4 } : false}
                  connectNulls
                  isAnimationActive={false}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <fieldset className='mt-4'>
        <legend className='label mb-2'>
          {legend} (HASTA {MAX_HIGHLIGHTS})
        </legend>
        <ul className='flex flex-wrap gap-1.5'>
          {drivers.map((driver) => {
            const highlight = style(driver.number)
            return (
              <li key={driver.number}>
                <button
                  type='button'
                  onClick={() => toggle(driver.number)}
                  aria-pressed={highlight !== null}
                  title={driver.team ?? undefined}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
                    highlight ? 'border-display text-display' : 'border-input text-muted-foreground hover:text-display'
                  }`}>
                  {highlight && (
                    <svg width='16' height='6' aria-hidden='true'>
                      <line x1='0' y1='3' x2='16' y2='3' stroke={highlight.stroke} strokeWidth={highlight.width} strokeDasharray={highlight.dash} />
                    </svg>
                  )}
                  {driver.code}
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>
      {footnote && <p className='mt-4 text-xs text-muted-foreground'>{footnote}</p>}
    </figure>
  )
}

export default DriverLineChart
