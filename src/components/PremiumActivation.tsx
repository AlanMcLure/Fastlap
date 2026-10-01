'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { buttonVariants } from '@/components/ui/Button'

const MAX_ATTEMPTS = 10
const RETRY_MS = 2000

const isActive = (role?: string) => role === 'PREMIUM' || role === 'ADMIN'

const PremiumActivation = () => {
  const { data: session, update } = useSession()
  const [attempts, setAttempts] = useState(0)
  const active = isActive(session?.user?.role)

  // The Stripe webhook may land after the user returns from checkout, so ask the
  // server to refresh the session token until the new role shows up.
  useEffect(() => {
    if (active || attempts >= MAX_ATTEMPTS) return
    const timer = setTimeout(async () => {
      await update()
      setAttempts((n) => n + 1)
    }, attempts === 0 ? 0 : RETRY_MS)
    return () => clearTimeout(timer)
  }, [active, attempts, update])

  if (active) {
    return (
      <>
        <h1 className='text-2xl font-bold text-gray-900'>¡Ya eres Premium!</h1>
        <p className='mt-3 text-gray-600'>
          Tu suscripción está activa y ya puedes acceder al F1 Dashboard.
        </p>
        <Link href='/f1-dashboard' className={buttonVariants({ className: 'mt-6' })}>
          Ir al F1 Dashboard
        </Link>
      </>
    )
  }

  if (attempts >= MAX_ATTEMPTS) {
    return (
      <>
        <h1 className='text-2xl font-bold text-gray-900'>Pago recibido</h1>
        <p className='mt-3 text-gray-600'>
          Estamos confirmando tu suscripción. Si en unos minutos no tienes acceso,
          cierra sesión y vuelve a entrar.
        </p>
        <Link href='/' className={buttonVariants({ variant: 'outline', className: 'mt-6' })}>
          Volver al inicio
        </Link>
      </>
    )
  }

  return (
    <>
      <Loader2 className='mx-auto h-8 w-8 animate-spin text-zinc-500' />
      <p className='mt-4 text-gray-600'>Activando tu suscripción Premium…</p>
    </>
  )
}

export default PremiumActivation
