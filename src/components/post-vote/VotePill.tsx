import { ArrowBigDown, ArrowBigUp } from 'lucide-react'

import { cn } from '@/lib/utils'

type VoteValue = 'UP' | 'DOWN'

interface VotePillProps {
  votes: number
  current?: VoteValue | null
  onVote: (type: VoteValue) => void
  size?: 'md' | 'sm'
}

/** Up / score / down as one pill. A cast vote is shown by a filled arrow and a stronger border. */
const VotePill = ({ votes, current, onVote, size = 'md' }: VotePillProps) => {
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

export default VotePill
