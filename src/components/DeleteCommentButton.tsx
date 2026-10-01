import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { FC, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'

interface DeleteCommentButtonProps {
  commentId: string,
  authorId: string
}

const DeleteCommentButton:FC<DeleteCommentButtonProps> = ({ commentId, authorId }) => {
  const router = useRouter()
  
  const { data: session } = useSession()

  const [isDialogOpen, setDialogOpen] = useState(false)

  const handleDelete = () => {
    setDialogOpen(false)
    deleteComment()
  }

  const openDialog = () => {
    setDialogOpen(true)
  }

  const { mutate: deleteComment } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.delete(`/api/subreddit/post/comment/delete/${commentId}`)
      return data
    },
    onError: () => {
      return toast({
        title: 'Algo fue mal.',
        description: "El comentario no se ha borrado correctamente. Por favor, inténtalo de nuevo.",
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      router.refresh()

      return toast({
        description: 'Tú comentario ha sido borrado.',
      })
    },
  })

  if (session?.user?.id !== authorId) {
    return null
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <Button
        onClick={openDialog}
        variant='ghost'
        size='xs'
        className='text-muted-foreground hover:text-signal'
        aria-label='Borrar comentario'>
        <Trash2 className='mr-1.5' size={14} aria-hidden='true' />
        Borrar
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Borrar este comentario?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size='sm' variant='outline' type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button size='sm' variant='destructive' type="button" onClick={handleDelete}>Borrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteCommentButton