import PremiumCard from '@/components/PremiumCard'
import { PREMIUM_ENABLED } from '@/lib/features'
import CustomFeed from '@/components/homepage/CustomFeed'
import GeneralFeed from '@/components/homepage/GeneralFeed'
import { buttonVariants } from '@/components/ui/Button'
import { getAuthSession } from '@/lib/auth'
import { Home as HomeIcon } from 'lucide-react'
import Link from 'next/link'

export default async function Home() {
  const session = await getAuthSession()

  return (
    <>
      <h1 className='font-bold text-3xl md:text-4xl'>Tu feed</h1>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-4 py-6'>
        {/* Subreddit info y PremiumCard */}
        <div className='space-y-4 order-first md:order-last'>
          <div className='overflow-hidden h-fit rounded-lg border border-border order-first'>
            <div className='bg-muted px-6 py-4'>
              <p className='font-semibold py-3 flex items-center gap-1.5'>
                <HomeIcon className='h-4 w-4' />
                Inicio
              </p>
            </div>
            <div className='-my-3 divide-y divide-border px-5 py-4 text-sm leading-6'>
              <div className='flex justify-between gap-x-4 py-3'>
                <p className='text-muted-foreground'>
                  Tu página principal de FastLap. Encuentra las mejores comunidades de aficionados de la Fórmula 1. O crea tú mismo la tuya propia.
                </p>
              </div>

              <Link
                className={buttonVariants({
                  className: 'w-full mt-4 mb-6',
                })}
                href={`/r/create`}>
                Crear comunidad
              </Link>

            </div>

          </div>
          {/* Mostrar PremiumCard solo si el usuario es de tipo USER */}
          {PREMIUM_ENABLED && session?.user?.role === 'USER' && <PremiumCard />}
        </div>
        {/* Feed de posts */}
        <div className='md:col-span-2'>
          {session ? <CustomFeed /> : <GeneralFeed />}
        </div>
      </div>
    </>
  )
}
