'use client'

import { toast } from '@/hooks/use-toast'

/** Opens the system share sheet for a page of the site, or copies its link where there is none. */
export async function shareLink(title: string, path: string) {
  const url = `${window.location.origin}${path}`
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    toast({ description: 'Enlace copiado al portapapeles.' })
  } catch (error) {
    // closing the share sheet is not an error
    if (error instanceof DOMException && error.name === 'AbortError') return
    toast({ title: 'No se ha podido compartir', description: `Copia el enlace a mano: ${url}`, variant: 'destructive' })
  }
}
