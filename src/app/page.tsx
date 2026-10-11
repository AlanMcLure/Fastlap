import Link from 'next/link'

import PremiumCard from '@/components/PremiumCard'
import { UserAvatar } from '@/components/UserAvatar'
import HomeFeed from '@/components/homepage/HomeFeed'
import HomeRail from '@/components/homepage/HomeRail'
import { getAuthSession } from '@/lib/auth'
import { PREMIUM_ENABLED } from '@/lib/features'
import { cn } from '@/lib/utils'

interface HomeProps {
  searchParams: Promise<{ feed?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getAuthSession()
  const viewerId = session?.user?.id
  // "Todo" is the only choice for visitors; signed-in users start on their followed communities.
  const all = !viewerId || (await searchParams).feed === 'todo'

  const tab = (href: string, label: string, current: boolean) => (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'flex h-11 items-center border-b-2 px-3 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
        current ? 'border-display text-display' : 'border-transparent text-muted-foreground hover:text-display'
      )}>
      {label}
    </Link>
  )

  return (
    <div className='flex flex-col gap-8 pb-10 lg:flex-row lg:items-start'>
      <div className='min-w-0 flex-1'>
        <h1 className='sr-only'>{viewerId ? 'Tu feed' : 'Comunidades de Fórmula 1'}</h1>
        <nav aria-label='Feed' className='flex gap-1'>
          {viewerId && tab('/', 'Para ti', !all)}
          {tab(viewerId ? '/?feed=todo' : '/', 'Todo', all)}
        </nav>

        {session?.user && (
          <Link
            href='/submit'
            className='flex items-center gap-3 border-t border-border py-4 text-muted-foreground transition-colors hover:text-foreground'>
            <UserAvatar user={{ name: session.user.username ?? null, image: session.user.image ?? null }} className='h-9 w-9' />
            <span className='flex-1'>¿Qué te ha parecido la última carrera?</span>
            <span className='rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'>Publicar</span>
          </Link>
        )}

        <HomeFeed viewerId={viewerId} all={all} />
      </div>

      <aside aria-label='Más en FastLap' className='w-full shrink-0 lg:sticky lg:top-[7.5rem] lg:w-80'>
        <HomeRail viewerId={viewerId} />
        {PREMIUM_ENABLED && session?.user?.role === 'USER' && (
          <div className='pt-5'>
            <PremiumCard />
          </div>
        )}
      </aside>
    </div>
  )
}
