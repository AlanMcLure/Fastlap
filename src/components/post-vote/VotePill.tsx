import { ArrowBigDown, ArrowBigUp } from 'lucide-react'

import { cn } from '@/lib/utils'

type VoteValue = 'UP' | 'DOWN'

interface VotePillProps {
  votes: number
  current?: VoteValue | null
  onVote: (type: VoteValue) => void
  size?: 'md' | 'sm'
  /** `column`: arrows above and below a big dot-matrix score, for the feed's left gutter. */
  layout?: 'pill' | 'column'
}

/** Up / score / down as one pill. A cast vote is shown by a filled arrow and a stronger border. */
const VotePill = ({ votes, current, onVote, size = 'md', layout = 'pill' }: VotePillProps) => {
  if (layout === 'column') return <VoteColumn votes={votes} current={current} onVote={onVote} />

  const arrow = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const button = cn(
    'inline-flex items-center justify-center rounded-full transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  )

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border transition-colors',
        current ? 'border-display' : 'border-input'
      )}>
      <button
        type='button'
        onClick={() => onVote('UP')}
        aria-label='Votar a favor'
        aria-pressed={current === 'UP'}
        className={button}>
        <ArrowBigUp className={cn(arrow, current === 'UP' ? 'fill-display text-display' : 'text-muted-foreground')} />
      </button>

      <span
        aria-live='polite'
        className={cn('min-w-7 text-center font-mono tabular-nums text-display', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {votes}
      </span>

      <button
        type='button'
        onClick={() => onVote('DOWN')}
        aria-label='Votar en contra'
        aria-pressed={current === 'DOWN'}
        className={button}>
        <ArrowBigDown className={cn(arrow, current === 'DOWN' ? 'fill-display text-display' : 'text-muted-foreground')} />
      </button>
    </div>
  )
}

/** The feed's timing-tower gutter: up, the score in big dot-matrix digits, down. */
function VoteColumn({ votes, current, onVote }: Pick<VotePillProps, 'votes' | 'current' | 'onVote'>) {
  const button =
    'inline-flex h-8 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <div className='flex flex-col items-center'>
      <button type='button' onClick={() => onVote('UP')} aria-label='Votar a favor' aria-pressed={current === 'UP'} className={button}>
        <ArrowBigUp className={cn('h-5 w-5', current === 'UP' ? 'fill-display text-display' : 'text-muted-foreground')} />
      </button>
      <span aria-live='polite' className='display min-w-8 text-center text-[22px] leading-none tabular-nums text-display'>
        {votes}
      </span>
      <button type='button' onClick={() => onVote('DOWN')} aria-label='Votar en contra' aria-pressed={current === 'DOWN'} className={button}>
        <ArrowBigDown className={cn('h-5 w-5', current === 'DOWN' ? 'fill-display text-display' : 'text-muted-foreground')} />
      </button>
    </div>
  )
}

export default VotePill
