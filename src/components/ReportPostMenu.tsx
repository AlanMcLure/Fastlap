'use client'

import { Flag, MoreHorizontal } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { FC, useState } from 'react'

import ReportDialog from '@/components/ReportDialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'

/** "⋯" menu with "Denunciar publicación" for signed-in users who are not the author. */
const ReportPostMenu: FC<{ postId: string; authorId: string }> = ({ postId, authorId }) => {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  if (!session?.user || session.user.id === authorId) return null

  return (
    <>
      {/* modal={false}: a modal menu shifts the layout under the pointer and selects an item by itself */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            aria-label='Más acciones de la publicación'
            className='-mr-2 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
            <MoreHorizontal className='h-4 w-4' aria-hidden='true' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onSelect={() => setOpen(true)} className='cursor-pointer gap-2'>
            <Flag size={16} aria-hidden='true' />
            Denunciar publicación
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ReportDialog type='POST' id={postId} open={open} onOpenChange={setOpen} />
    </>
  )
}

export default ReportPostMenu
