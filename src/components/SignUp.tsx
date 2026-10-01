import { Icons } from '@/components/Icons'
import UserAuthForm from '@/components/UserAuthForm'
import Link from 'next/link'

const SignUp = () => {
  return (
    <div className='container mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
      <div className='flex flex-col space-y-2 text-center'>
        <Icons.logo className='mx-auto h-10 w-10 text-display' aria-hidden='true' />
        <p className='label'>REGISTRO</p>
        <h1 className='text-2xl font-semibold tracking-tight text-display'>Crea tu cuenta</h1>
        <p className='mx-auto max-w-xs text-sm text-muted-foreground'>
          Únete a la comunidad de aficionados de la Fórmula 1. ¡Es gratis!
        </p>
      </div>
      <UserAuthForm />
      <p className='px-8 text-center text-sm text-muted-foreground'>
        ¿Ya eres uno más de esta comunidad?{' '}
        <Link
          href='/sign-in'
          className='text-sm text-foreground underline underline-offset-4 hover:text-display'>
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}

export default SignUp
