'use client'

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { FC, FormEvent, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/hooks/use-toast'
import { DETAILS_MAX, REPORT_REASONS, type ReportReason, type TargetType } from '@/lib/moderation'

interface ReportDialogProps {
  type: TargetType
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Asks for a reason (and optional details) and sends the report. */
const ReportDialog: FC<ReportDialogProps> = ({ type, id, open, onOpenChange }) => {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const noun = type === 'POST' ? 'publicación' : 'comentario'

  const { mutate, isPending } = useMutation({
    mutationFn: () => axios.post('/api/reports', { type, id, reason, details: details.trim() || undefined }),
    onSuccess: () => {
      onOpenChange(false)
      setReason(null)
      setDetails('')
      toast({ description: 'Gracias. Un moderador revisará la denuncia.' })
    },
    onError: (error) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      toast({
        title: status === 409 ? 'Ya la habías denunciado' : 'No se ha enviado la denuncia',
        description:
          status === 409 ? 'Revisaremos este contenido; no hace falta repetirlo.'
          : status === 429 ? 'Has enviado muchas denuncias seguidas. Inténtalo más tarde.'
          : 'Inténtalo de nuevo más tarde.',
        variant: 'destructive',
      })
      if (status === 409) onOpenChange(false)
    },
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (reason) mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>Denunciar {noun}</DialogTitle>
            <DialogDescription>¿Qué problema tiene? Solo los moderadores verán tu denuncia.</DialogDescription>
          </DialogHeader>

          <div role='radiogroup' aria-label='Motivo de la denuncia' className='space-y-2'>
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className='flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 text-sm transition-colors has-[:checked]:border-display has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'>
                <input
                  type='radio'
                  name='reason'
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className='mt-1'
                />
                <span>
                  <span className='block text-foreground'>{r.label}</span>
                  <span className='block text-muted-foreground'>{r.help}</span>
                </span>
              </label>
            ))}
          </div>

          <div>
            <label htmlFor='report-details' className='label'>DETALLES (OPCIONAL)</label>
            <Textarea
              id='report-details'
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={DETAILS_MAX}
              rows={3}
              className='mt-2'
            />
          </div>

          <DialogFooter>
            <Button size='sm' variant='outline' type='button' onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button size='sm' type='submit' disabled={!reason || isPending} isLoading={isPending}>Enviar denuncia</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ReportDialog
