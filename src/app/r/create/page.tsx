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
  const valid = input.length >= 3

  const { mutate: createCommunity, isPending: isLoading } = useMutation({
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
            description: 'Entre 3 y 21 caracteres: letras, números y guiones bajos.',
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
    <div className='mx-auto w-full max-w-3xl'>
      <div className='w-full'>
        <BackButton />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (valid && !isLoading) createCommunity()
        }}
        className='relative mt-6 h-fit w-full space-y-6 rounded-xl border border-input bg-card p-5'>
        <div>
          <p className='label'>NUEVA COMUNIDAD</p>
          <h1 className='mt-2 text-xl font-semibold text-display'>Crear una comunidad</h1>
        </div>

        <div>
          <label htmlFor='community-name' className='text-lg font-medium text-display'>Nombre</label>
          <p id='community-name-help' className='pb-2 text-sm text-muted-foreground'>
            De 3 a 21 caracteres: letras, números y guiones bajos. El nombre no se puede cambiar (de momento).
          </p>
          <div className='relative'>
            <p className='absolute text-sm left-0 w-8 inset-y-0 grid place-items-center text-muted-foreground' aria-hidden='true'>
              r/
            </p>
            <Input
              id='community-name'
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              maxLength={21}
              placeholder='formula1'
              autoComplete='off'
              aria-describedby='community-name-help'
              className='pl-7'
            />
          </div>
        </div>

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            disabled={isLoading}
            variant='subtle'
            onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type='submit' isLoading={isLoading} disabled={!valid}>
            Crear comunidad
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Page
