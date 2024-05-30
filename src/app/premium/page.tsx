import { redirect } from 'next/navigation'

import { authOptions, getAuthSession } from '@/lib/auth'
import BackButton from '@/components/BackButton'
import { buttonVariants } from '@/components/ui/Button'
import { CreditCard } from 'lucide-react'
import Image from 'next/image'

export const metadata = {
  title: 'Premium pricing',
  description: '',
}

export default async function PremiumPage() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect(authOptions?.pages?.signIn || '/login')
  }

  return (
    <div className='sm:container max-w-7xl mx-auto h-full pt-12'>
        <div>
            <BackButton />
            <section className='py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6'>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Un nuevo mundo de estadísticas de F1 a tu alcance.</h2>
                        <p className="mb-6 font-light text-gray-500 md:text-lg dark:text-gray-400">Flowbite helps you connect with friends and communities of people who share your interests. Connecting with your friends and family as well as discovering new ones is easy with features like Groups.</p>
                    </div>
                    <div className='rounded-lg border border-gray-200 p-6 bg-white shadow-sm'>
                        <div className='relative h-64 w-full'>
                        <Image
                                src='/f1-grafico.jpg'
                                alt='ejemplo de grafico'
                                layout='fill'
                                objectFit='cover'
                                objectPosition='center top'
                            />
                        </div>
                        <p className='text-gray-700 mb-4 mt-6'>¡Accede a todas las funciones exclusivas por solo 5€/mes!</p>
                        <div className='flex justify-between items-center'>
                            <p className='text-2xl font-semibold'>5€/mes</p>
                            <button className={buttonVariants({ size: 'lg', className: 'bg-red-600 text-white' })}>
                            Suscribirse
                            <CreditCard className='ml-2 h-5 w-5' />
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
  )
}