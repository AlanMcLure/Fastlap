'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { Button } from '@/components/ui/Button'

/** Re-renders the current server page (used by error states of server components). */
const RefreshButton = () => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button variant='outline' isLoading={pending} onClick={() => startTransition(() => router.refresh())}>
      Reintentar
    </Button>
  )
}

export default RefreshButton
