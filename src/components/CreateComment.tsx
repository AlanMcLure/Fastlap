'use client'

import { Button } from '@/components/ui/Button'
import { toast } from '@/hooks/use-toast'
import { CommentRequest } from '@/lib/validators/comment'

import { useCustomToasts } from '@/hooks/use-custom-toasts'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { FC, useState } from 'react'
import { UserAvatar } from '@/components/UserAvatar'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface CreateCommentProps {
  postId: string
  replyToId?: string
  signedIn: boolean
}

/** Id of the composer's field: the phone bar (MobileCommentBar) focuses it. */
export const COMMENT_FIELD_ID = 'nuevo-comentario'

const CreateComment: FC<CreateCommentProps> = ({ postId, replyToId, signedIn }) => {
  const { data: session } = useSession()
  const [input, setInput] = useState<string>('')
  const router = useRouter()
  const { loginToast } = useCustomToasts()

  const { mutate: comment, isPending: isLoading } = useMutation({
    mutationFn: async ({ postId, text, replyToId }: CommentRequest) => {
      const payload: CommentRequest = { postId, text, replyToId }

      const { data } = await axios.patch(
        `/api/subreddit/post/comment/`,
        payload
      )
      return data
    },

    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return loginToast()
        }
      }

      return toast({
        title: 'Algo fue mal',
        description: 'El comentario no ha sido creado. Por favor, inténtelo de nuevo más tarde',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      router.refresh()
      setInput('')
    },
  })

  if (!signedIn) {
    return (
      <p className='rounded-2xl border border-input px-4 py-3 text-sm text-muted-foreground'>
        <Link href='/sign-in' className='text-display underline underline-offset-2'>
          Inicia sesión
        </Link>{' '}
        para comentar.
      </p>
    )
  }

  return (
    <div className='flex gap-3 rounded-2xl border border-input px-4 py-3 focus-within:border-display'>
      <UserAvatar
        user={{ name: session?.user?.username ?? null, image: session?.user?.image ?? null }}
        className='mt-0.5 h-8 w-8 shrink-0'
      />
      <label htmlFor={COMMENT_FIELD_ID} className='sr-only'>
        Tu comentario
      </label>
      <textarea
        id={COMMENT_FIELD_ID}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={1}
        placeholder='Añade un comentario…'
        className='min-h-9 flex-1 resize-none self-center bg-transparent py-1.5 leading-6 text-foreground outline-none placeholder:text-muted-foreground [field-sizing:content]'
      />
      <Button
        size='sm'
        className='self-end rounded-full'
        isLoading={isLoading}
        disabled={input.trim().length === 0}
        onClick={() => comment({ postId, text: input, replyToId })}>
        Comentar
      </Button>
    </div>
  )
}

export default CreateComment
