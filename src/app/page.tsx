import { Suspense } from 'react'

import PremiumCard from '@/components/PremiumCard'
import { PREMIUM_ENABLED, canAccessDashboard } from '@/lib/features'
import CustomFeed from '@/components/homepage/CustomFeed'
import GeneralFeed from '@/components/homepage/GeneralFeed'
import NextRaceModule from '@/components/homepage/NextRaceModule'
import { SkeletonCard } from '@/components/SkeletonCard'
import { buttonVariants } from '@/components/ui/Button'
import { getAuthSession } from '@/lib/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await getAuthSession()

  return (
    <>
      <p className='label'>{session ? 'PARA TI' : 'FASTLAP'}</p>
      <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>{session ? 'Tu feed' : 'Comunidades de F1'}</h1>

      <div className='grid grid-cols-1 gap-y-6 py-8 md:grid-cols-3 md:gap-x-6'>
        {/* Next race, about FastLap and Premium */}
        <aside className='order-first space-y-4 md:order-last'>
          <Suspense fallback={<SkeletonCard />}>
            <NextRaceModule showDashboardLink={!!session && canAccessDashboard(session.user.role)} />
          </Suspense>

          <Link
            href='/pronosticos'
            className='flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 text-display transition-colors hover:border-input'>
            <span>
              <span className='label block'>PRONÓSTICOS</span>
              <span className='mt-1 block text-sm text-muted-foreground'>Clasificación global de la temporada</span>
            </span>
            <span aria-hidden='true'>→</span>
          </Link>

          <div className='hidden rounded-xl border border-border bg-card p-5 md:block'>
            <p className='label'>INICIO</p>
            <p className='mt-3 text-sm leading-6 text-muted-foreground'>
              Tu página principal de FastLap. Encuentra las mejores comunidades de aficionados de la Fórmula 1, o crea la tuya.
            </p>
            <Link className={buttonVariants({ className: 'mt-5 w-full' })} href='/r/create'>
              Crear comunidad
            </Link>
          </div>

          {PREMIUM_ENABLED && session?.user?.role === 'USER' && <PremiumCard />}
        </aside>

        {/* Feed de posts */}
        <div className='md:col-span-2'>{session ? <CustomFeed /> : <GeneralFeed />}</div>
      </div>
    </>
  )
}
