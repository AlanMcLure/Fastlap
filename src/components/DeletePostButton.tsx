import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { FC } from 'react'

interface DeletePostButtonProps {
  postId: string
}

const DeletePostButton:FC<DeletePostButtonProps> = ({ postId }) => {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const { mutate: deletePost } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.delete(`/api/subreddit/post/delete/${postId}`)
      return data
    },
    onError: () => {
      return toast({
        title: 'Something went wrong.',
        description: "Post wasn't deleted successfully. Please try again.",
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['infinite-query']) // Invalida todas las consultas con la clave 'post'

      router.push(pathname);

      return toast({
        description: 'Tú post ha sido borado.',
      })
    },
  })

  return (
    <Button
    className='bg-red-500'
      onClick={() => deletePost()}
      variant='destructive'
      size='sm'>
      Delete
    </Button>
  )
}

export default DeletePostButton