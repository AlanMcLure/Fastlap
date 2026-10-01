'use client'

import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { toast } from '@/hooks/use-toast'
import { confirmationMatches } from '@/lib/accountRules'

interface DeleteAccountFormProps {
  username: string
  isAdmin: boolean
}

export function DeleteAccountForm({ username, isAdmin }: DeleteAccountFormProps) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')

  const { mutate: remove, isPending } = useMutation({
    mutationFn: async () => {
      await axios.delete('/api/account', { data: { confirm } })
    },
    onSuccess: () => {
      toast({ description: 'Tu cuenta ha sido eliminada.' })
      void signOut({ callbackUrl: '/' })
    },
    onError: (err) => {
      const status = err instanceof AxiosError ? err.response?.status : undefined
      toast({
        title: 'No se ha podido eliminar la cuenta',
        description:
          status === 429
            ? 'Demasiados intentos. Prueba de nuevo dentro de una hora.'
            : status === 403
              ? 'Una cuenta de administrador no se puede eliminar desde aquí.'
              : 'Inténtalo de nuevo más tarde.',
        variant: 'destructive',
      })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eliminar mi cuenta</CardTitle>
        <CardDescription>
          Se borran tu perfil, tus votos, suscripciones, pronósticos y notificaciones. Tus publicaciones y comentarios no
          se borran: se quedan como «Usuario eliminado» para que las conversaciones sigan teniendo sentido (puedes
          borrarlos tú antes). No se puede deshacer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAdmin && (
          <p className='text-sm text-muted-foreground'>
            Tu cuenta es de administrador: pide que te quiten el rol antes de poder eliminarla.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button type='button' variant='destructive' disabled={isAdmin} onClick={() => setOpen(true)}>
          Eliminar mi cuenta
        </Button>
      </CardFooter>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setConfirm('')
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar tu cuenta?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Para confirmar, escribe tu nombre de usuario:{' '}
              <span className='font-mono text-foreground'>{username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-1'>
            <Label htmlFor='confirm-username' className='sr-only'>
              Escribe tu nombre de usuario para confirmar
            </Label>
            <Input
              id='confirm-username'
              autoComplete='off'
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button size='sm' variant='outline' type='button' onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              size='sm'
              variant='destructive'
              type='button'
              isLoading={isPending}
              disabled={!confirmationMatches(confirm, username)}
              onClick={() => remove()}>
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
