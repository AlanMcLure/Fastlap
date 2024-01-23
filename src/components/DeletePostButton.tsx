import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { FC } from 'react'

interface DeletePostButtonProps {
  postId: string
}

const DeletePostButton:FC<DeletePostButtonProps> = ({ postId }) => {
  const router = useRouter()

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
      router.push('/subreddit') // Redirige al usuario a la página principal del subreddit después de eliminar un post
    },
  })

  return (
    <Button
      onClick={() => deletePost()}
      variant='ghost'
      size='xs'>
      Delete
    </Button>
  )
}

export default DeletePostButton