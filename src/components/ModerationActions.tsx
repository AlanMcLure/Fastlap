'use client'

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { FC, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { toast } from '@/hooks/use-toast'
import type { TargetType } from '@/lib/moderation'

/** Moderator decision on one reported item: dismiss the reports, or remove the content (after confirming). */
const ModerationActions: FC<{ type: TargetType; id: string }> = ({ type, id }) => {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { mutate, isPending, variables } = useMutation({
    mutationFn: (action: 'remove' | 'dismiss') => axios.post('/api/moderation/resolve', { type, id, action }),
    onSuccess: (_data, action) => {
      setConfirmOpen(false)
      toast({ description: action === 'remove' ? 'Contenido eliminado y autor avisado.' : 'Denuncias descartadas.' })
      router.refresh()
    },
    onError: () =>
      toast({ title: 'No se ha podido aplicar', description: 'Puede que otro moderador ya lo haya resuelto.', variant: 'destructive' }),
  })

  return (
    <div className='flex flex-wrap gap-2'>
      <Button size='sm' variant='outline' onClick={() => mutate('dismiss')} disabled={isPending} isLoading={isPending && variables === 'dismiss'}>
        Descartar denuncias
      </Button>
      <Button size='sm' variant='destructive' onClick={() => setConfirmOpen(true)} disabled={isPending}>
        Eliminar {type === 'POST' ? 'publicación' : 'comentario'}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar {type === 'POST' ? 'esta publicación' : 'este comentario'}?</DialogTitle>
            <DialogDescription>
              Se borra para todos y no se puede deshacer. Se avisará a su autor y quedará anotado en el registro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size='sm' variant='outline' type='button' onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button size='sm' variant='destructive' type='button' onClick={() => mutate('remove')} isLoading={isPending && variables === 'remove'} disabled={isPending}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ModerationActions
