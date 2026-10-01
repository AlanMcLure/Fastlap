import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { FC, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'

interface DeletePostButtonProps {
  postId: string,
  authorId: string,
  invalidatePostsCache: () => void;
}

const DeletePostButton: FC<DeletePostButtonProps> = ({ postId, authorId, invalidatePostsCache }) => {

  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession()

  const [isDialogOpen, setDialogOpen] = useState(false)

  const handleDelete = async () => {
    setDialogOpen(false)
    await deletePost();
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
        title: 'Algo fue mal',
        description: "El post no se ha borrado correctamente. Por favor, inténtalo de nuevo.",
        variant: 'destructive',
      })
    },
    onSuccess: () => {

      invalidatePostsCache();
      router.push(pathname);

      return toast({
        description: 'Tú post ha sido borrado.',
      })
    },
  })

  if (session?.user?.id !== authorId && session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <>
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
          <DropdownMenuItem onSelect={openDialog} className='cursor-pointer gap-2 text-signal focus:text-signal'>
            <Trash2 size={16} aria-hidden='true' />
            Borrar publicación
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar esta publicación?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size='sm' variant='outline' type='button' onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size='sm' variant='destructive' type='button' onClick={handleDelete}>
              Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DeletePostButton
