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
  return (
    <figure className='rounded-2xl border border-input bg-card p-4 sm:p-6'>
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
              className={`grid items-center gap-3 ${names ? 'grid-cols-[1.5rem_minmax(7rem,11rem)_1fr_auto]' : 'grid-cols-[1.5rem_3rem_1fr_auto]'}`}>
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
              <span className='text-right font-mono text-sm tabular-nums text-foreground'>
                {item.display}
                {item.aside && <span className='ml-3 text-muted-foreground'>{item.aside}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  )
}

export default BarList
