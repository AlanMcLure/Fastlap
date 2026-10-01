'use client'

import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'

import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { toast } from '@/hooks/use-toast'

/** Reads the file name the server chose from the Content-Disposition header. */
function fileNameFrom(header: string | undefined): string {
  return header?.match(/filename="([^"]+)"/)?.[1] ?? 'fastlap-datos.json'
}

export function ExportDataForm() {
  const { mutate: download, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.get<Blob>('/api/account/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = url
      link.download = fileNameFrom(res.headers['content-disposition'])
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    },
    onSuccess: () => toast({ description: 'Tus datos se han descargado.' }),
    onError: (err) => {
      const status = err instanceof AxiosError ? err.response?.status : undefined
      toast({
        title: 'No se han podido descargar tus datos',
        description:
          status === 429 ? 'Demasiados intentos. Prueba de nuevo dentro de una hora.' : 'Inténtalo de nuevo más tarde.',
        variant: 'destructive',
      })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Descargar mis datos</CardTitle>
        <CardDescription>
          Un archivo JSON con tu perfil, publicaciones, comentarios, votos, suscripciones, pronósticos, notificaciones y
          denuncias. No incluye contraseñas ni cookies de sesión.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button type='button' variant='outline' isLoading={isPending} onClick={() => download()}>
          Descargar mis datos
        </Button>
      </CardFooter>
    </Card>
  )
}
