export interface BarItem {
  key: string
  label: string
  detail?: string | null
  /** Gap mode: distance to the best (0 = best, shortest bar). Amount mode: the quantity itself. */
  value: number
  display: string
  /** Right-hand text (e.g. the absolute time). */
  aside?: string
}

interface BarListProps {
  title: string
  description?: string
  items: BarItem[]
  emptyText?: string
  /** Labels are full names instead of three-letter codes. */
  names?: boolean
  /** 'gap': bars measure the distance to the best (times). 'amount': bars measure the value (wins, titles). */
  mode?: 'gap' | 'amount'
}

/** Ranking as horizontal bars, timing-tower style: gaps to the best (shortest = best) or plain amounts. */
const BarList = ({ title, description, items, emptyText = 'Sin datos suficientes.', names = false, mode = 'gap' }: BarListProps) => {
  const max = Math.max(...items.map((i) => i.value), 0)
  // Shared columns (monospace widths in ch) so every bar has the same track and stays comparable.
  // The aside gets its own column from sm up; on phones it drops below the row, under the bar.
  const valueWidth = Math.max(...items.map((i) => i.display.length), 0) + 1
  const asideWidth = Math.max(...items.map((i) => i.aside?.length ?? 0), 0)
  const label = names ? 'minmax(6rem,9rem)' : '3rem'
  const columns = {
    '--cols': `1.5rem ${label} minmax(0,1fr) ${valueWidth}ch`,
    '--cols-sm': `1.5rem ${label} minmax(0,1fr) ${valueWidth}ch${asideWidth ? ` ${asideWidth}ch` : ''}`,
  } as React.CSSProperties
  return (
    <figure className='min-w-0 rounded-2xl border border-input bg-card p-4 sm:p-6'>
      <figcaption>
        <span className='label'>{title}</span>
        {description && <span className='mt-1 block text-sm text-muted-foreground'>{description}</span>}
      </figcaption>
      {items.length === 0 ? (
        <p className='mt-4 text-sm text-muted-foreground'>{emptyText}</p>
      ) : (
        <ol className='mt-4 space-y-2'>
          {items.map((item, index) => (
            <li
              key={item.key}
              style={columns}
              className='grid items-center gap-x-3 gap-y-0.5 [grid-template-columns:var(--cols)] sm:[grid-template-columns:var(--cols-sm)]'>
              <span className='font-mono text-xs text-muted-foreground'>{index + 1}</span>
              <span
                className={names ? 'truncate text-sm text-display' : 'font-mono text-sm font-bold text-display'}
                title={item.detail ?? undefined}>
                {item.label}
              </span>
              <span className='relative h-2 rounded-full bg-border' aria-hidden='true'>
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${index === 0 ? 'bg-display' : 'bg-muted-foreground'}`}
                  style={{ width: `${max > 0 ? Math.max(2, (item.value / max) * 100) : mode === 'amount' ? 0 : 2}%` }}
                />
              </span>
              <span className='whitespace-nowrap text-right font-mono text-sm tabular-nums text-foreground'>{item.display}</span>
              {item.aside && (
                <span className='col-span-2 col-start-3 whitespace-nowrap text-right font-mono text-xs text-muted-foreground sm:col-span-1 sm:col-start-auto sm:text-sm'>
                  {item.aside}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </figure>
  )
}

export default BarList
