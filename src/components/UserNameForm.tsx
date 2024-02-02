'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { User } from '@prisma/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { UsernameValidator } from '@/lib/validators/username'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'

interface UserNameFormProps extends React.HTMLAttributes<HTMLFormElement> {
  user: Pick<User, 'id' | 'username'>
}

type FormData = z.infer<typeof UsernameValidator>

export function UserNameForm({ user, className, ...props }: UserNameFormProps) {
  const router = useRouter()
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(UsernameValidator),
    defaultValues: {
      name: user?.username || '',
    },
  })

  const { mutate: updateUsername, isLoading } = useMutation({
    mutationFn: async ({ name }: FormData) => {
      const payload: FormData = { name }

      const { data } = await axios.patch(`/api/username/`, payload)
      return data
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response?.status === 409) {
          return toast({
            title: 'Nombre de usuario no disponible',
            description: 'Por favor, elija otro nombre de usuario',
            variant: 'destructive',
          })
        }
      }

      return toast({
        title: 'Algo fue mal',
        description: 'Por favor, inténtelo de nuevo más tarde',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        description: 'Su nombre de usuario ha sido actualizado',
      })
      router.refresh()
    },
  })

  return (
    <form
      className={cn(className)}
      onSubmit={handleSubmit((e) => updateUsername(e))}
      {...props}>
      <Card className='min-h-[250px]'>
        <CardHeader>
          <CardTitle>Tú nombre de usuario</CardTitle>
          <CardDescription>
            El nombre de usuario es único y se utiliza para identificarlo en
            FastLap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='relative grid gap-1'>
            <div className='absolute top-0 left-0 w-8 h-10 grid place-items-center'>
              <span className='text-sm text-zinc-400'>u/</span>
            </div>
            <Label className='sr-only' htmlFor='name'>
              Nombre
            </Label>
            <Input
              id='name'
              className='w-full pl-6'
              size={32}
              {...register('name')}
            />
            {errors?.name && (
              <p className='px-1 text-xs text-red-600'>{errors.name.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button isLoading={isLoading}>Cambiar nombre</Button>
        </CardFooter>
      </Card>
    </form>
  )
}
