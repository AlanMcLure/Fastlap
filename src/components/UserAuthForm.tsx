'use client'

import { cn } from '@/lib/utils'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import * as React from 'react'
import { FC } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'
import { CONSENT_COOKIE, CONSENT_COOKIE_MAX_AGE_SECONDS, CONSENT_TEXT, TERMS_VERSION } from '@/lib/consent'
import { Icons } from './Icons'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

/** Auth.js sends the user back with ?error=AccessDenied when the consent check refuses them. */
const ConsentError: FC = () => {
  const error = useSearchParams().get('error')
  if (error !== 'AccessDenied') return null
  return (
    <p role='alert' className='text-sm text-signal'>
      Para crear tu cuenta debes confirmar que tienes la edad mínima y aceptar las condiciones. Marca la casilla e inténtalo de nuevo.
    </p>
  )
}

const UserAuthForm: FC<UserAuthFormProps> = ({ className, ...props }) => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [accepted, setAccepted] = React.useState<boolean>(false)

  const loginWithGoogle = async () => {
    if (!accepted) return
    setIsLoading(true)

    try {
      // Read by the server in the signIn callback; short-lived and only a record that the box was ticked.
      const secure = window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `${CONSENT_COOKIE}=${TERMS_VERSION}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
      await signIn('google')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error logueando con Google',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <React.Suspense fallback={null}>
        <ConsentError />
      </React.Suspense>
      <label className='flex items-start gap-3 text-left text-sm text-muted-foreground'>
        <input
          type='checkbox'
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className='mt-0.5 h-4 w-4 shrink-0 accent-primary'
        />
        <span>{CONSENT_TEXT}</span>
      </label>
      <Button
        isLoading={isLoading}
        type='button'
        size='sm'
        className='w-full'
        onClick={loginWithGoogle}
        disabled={isLoading || !accepted}>
        {isLoading ? null : <Icons.google className='h-4 w-4 mr-2' />}
        Google
      </Button>
    </div>
  )
}

export default UserAuthForm
