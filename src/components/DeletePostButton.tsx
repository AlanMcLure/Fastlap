import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { FC, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'

interface DeletePostButtonProps {
  postId: string,
  authorId: string
}

const DeletePostButton:FC<DeletePostButtonProps> = ({ postId, authorId }) => {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  
  const { data: session } = useSession()

  const [isDialogOpen, setDialogOpen] = useState(false)

  const handleDelete = () => {
    setDialogOpen(false)
    deletePost()
  }

  const openDialog = () => {
    setDialogOpen(true)
  }

  const { mutate: deletePost } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.delete(`/api/subreddit/post/delete/${postId}`)
      return data
    },
    onError: () => {
      return toast({
        title: 'Algo fue mal.',
        description: "El post no se ha borrado correctamente. Por favor, inténtalo de nuevo.",
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['infinite-query']) // Invalida todas las consultas con la clave 'post'

      router.push(pathname);

      return toast({
        description: 'Tú post ha sido borrado.',
      })
    },
  })

  if (session?.user?.id !== authorId) {
    return null
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <Button
        className='bg-red-500'
        onClick={openDialog}
        variant='destructive'
        size='sm'>
        Borrar
        <Trash2 className='ml-1.5' size={16} />
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás seguro de que quieres borrar este post?</DialogTitle>
          <DialogDescription>
            Está acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size='xs' variant='outline' type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button size='xs' type="submit" onClick={handleDelete}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeletePostButton