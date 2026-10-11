'use client'

import { Share2 } from 'lucide-react'

import { shareLink } from '@/lib/share'
import { cn } from '@/lib/utils'

/** "Compartir" for one page of the site: system share sheet, or the link copied. */
const ShareButton = ({ title, path, className }: { title: string; path: string; className?: string }) => (
  <button
    type='button'
    onClick={() => shareLink(title, path)}
    className={cn(
      'inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      className
    )}>
    <Share2 className='h-4 w-4' aria-hidden='true' />
    Compartir
  </button>
)

export default ShareButton
