'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect } from 'react'
import { Button } from './ui/Button'

const CloseModal: FC = () => {
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') router.back()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router])

  return (
    <Button variant='ghost' className='h-10 w-10 p-0' onClick={() => router.back()} aria-label='Cerrar'>
      <X className='h-4 w-4' aria-hidden='true' />
    </Button>
  )
}

export default CloseModal
