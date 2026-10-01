'use client'

import { Flag } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { FC, useState } from 'react'

import ReportDialog from '@/components/ReportDialog'
import { Button } from '@/components/ui/Button'

/** "Denunciar" for a comment, for signed-in users who are not its author. */
const ReportCommentButton: FC<{ commentId: string; authorId: string }> = ({ commentId, authorId }) => {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  if (!session?.user || session.user.id === authorId) return null

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant='ghost'
        size='xs'
        className='text-muted-foreground'
        aria-label='Denunciar comentario'>
        <Flag className='mr-1.5' size={14} aria-hidden='true' />
        Denunciar
      </Button>
      <ReportDialog type='COMMENT' id={commentId} open={open} onOpenChange={setOpen} />
    </>
  )
}

export default ReportCommentButton
