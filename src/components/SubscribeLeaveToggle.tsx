'use client'
import { Button } from '@/components/ui/Button'
import { SubscribeToSubredditPayload } from '@/lib/validators/subreddit'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'
import { useToast } from '../hooks/use-toast'
import { useCustomToasts } from '@/hooks/use-custom-toasts'

interface SubscribeLeaveToggleProps {
  isSubscribed: boolean
  subredditId: string
  subredditName: string
}

const SubscribeLeaveToggle = ({
  isSubscribed,
  subredditId,
  subredditName,
}: SubscribeLeaveToggleProps) => {
  const { toast } = useToast()
  const { loginToast } = useCustomToasts()
  const router = useRouter()

  const { mutate: subscribe, isLoading: isSubLoading } = useMutation({
    mutationFn: async () => {
      const payload: SubscribeToSubredditPayload = {
        subredditId,
      }

      const { data } = await axios.post('/api/subreddit/subscribe', payload)
      return data as string
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return loginToast()
        }
      }

      return toast({
        title: 'Algo fue mal',
        description: 'Por favor, inténtelo de nuevo más tarde',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      startTransition(() => {
        // Refresh the current route and fetch new data from the server without
        // losing client-side browser or React state.
        router.refresh()
      })
      toast({
        title: 'Suscrito!',
        description: `Ahora estás suscrito a r/${subredditName}`,
      })
    },
  })

  const { mutate: unsubscribe, isLoading: isUnsubLoading } = useMutation({
    mutationFn: async () => {
      const payload: SubscribeToSubredditPayload = {
        subredditId,
      }

      const { data } = await axios.post('/api/subreddit/unsubscribe', payload)
      return data as string
    },
    onError: (err: AxiosError) => {
      toast({
        title: 'Error',
        description: err.response?.data as string,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      startTransition(() => {
        // Refresh the current route and fetch new data from the server without
        // losing client-side browser or React state.
        router.refresh()
      })
      toast({
        title: 'Desuscrito!',
        description: `Ahora estás desuscrito de r/${subredditName}`,
      })
    },
  })

  return isSubscribed ? (
    <Button
      className='w-full mt-1 mb-4'
      isLoading={isUnsubLoading}
      onClick={() => unsubscribe()}>
      Dejar comunidad
    </Button>
  ) : (
    <Button
      className='w-full mt-1 mb-4'
      isLoading={isSubLoading}
      onClick={() => subscribe()}>
      Únete para postear
    </Button>
  )
}

export default SubscribeLeaveToggle
