'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/hooks/use-toast'
import { useCustomToasts } from '@/hooks/use-custom-toasts'
import { CreateSubredditPayload } from '@/lib/validators/subreddit'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import BackButton from '@/components/BackButton'

const Page = () => {
  const router = useRouter()
  const [input, setInput] = useState<string>('')
  const { loginToast } = useCustomToasts()

  const { mutate: createCommunity, isLoading } = useMutation({
    mutationFn: async () => {
      const payload: CreateSubredditPayload = {
        name: input.toLowerCase(),
      }

      const { data } = await axios.post('/api/subreddit', payload)
      return data as string
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response?.status === 409) {
          return toast({
            title: 'Esa comunidad ya existe.',
            description: 'Escoge un nombre distinto.',
            variant: 'destructive',
          })
        }

        if (err.response?.status === 422) {
          return toast({
            title: 'Nombre de comunidad inválido.',
            description: 'Nombre entre 3 y 21 caracteres.',
            variant: 'destructive',
          })
        }

        if (err.response?.status === 401) {
          return loginToast()
        }
      }

      toast({
        title: 'Ha ocurrido un error.',
        description: 'No se pudo crear la comunidad.',
        variant: 'destructive',
      })
    },
    onSuccess: (data) => {
      router.push(`/r/${data}`)
    },
  })

  return (
    <div className='container flex flex-col items-start h-full max-w-3xl mx-auto'>
      <div className='w-full'>
        <BackButton />
      </div>
      <div className='relative bg-white w-full h-fit p-4 rounded-lg space-y-6 mt-6 self-center'>
        <div className='flex justify-between items-center'>
          <h1 className='text-xl font-semibold'>Crear una Comunidad</h1>
        </div>

        <hr className='bg-red-500 h-px' />

        <div>
          <p className='text-lg font-medium'>Nombre</p>
          <p className='text-xs pb-2'>
            Los nombres de las comunidades no pueden ser cambiados (de momento).
          </p>
          <div className='relative'>
            <p className='absolute text-sm left-0 w-8 inset-y-0 grid place-items-center text-zinc-400'>
              r/
            </p>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className='pl-6'
            />
          </div>
        </div>

        <div className='flex justify-end gap-4'>
          <Button
            disabled={isLoading}
            variant='subtle'
            onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            isLoading={isLoading}
            disabled={input.length === 0}
            onClick={() => createCommunity()}>
            Crear Comunidad
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Page
