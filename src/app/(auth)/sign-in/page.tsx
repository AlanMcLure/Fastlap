import SignIn from '@/components/SignIn'
import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { FC } from 'react'

const page: FC = () => {
  return (
    <div className='mx-auto max-w-md space-y-6 py-10'>
      <Link href='/' className={cn(buttonVariants({ variant: 'ghost' }), '-ml-4')}>
        <ChevronLeft className='mr-2 h-4 w-4' aria-hidden='true' />
        Inicio
      </Link>

      <div className='rounded-xl border border-input bg-card px-6 py-10'>
        <SignIn />
      </div>
    </div>
  )
}

export default page
