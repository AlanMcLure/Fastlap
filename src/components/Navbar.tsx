import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { getAuthSession } from '@/lib/auth'
import { canAccessDashboard } from '@/lib/features'
import { Icons } from './Icons'
import NavLinks, { type NavItem } from './NavLinks'
import NotificationBell from './NotificationBell'
import RaceTicker, { TickerBar } from './race-ticker/RaceTicker'
import SearchBar from './SearchBar'
import ThemeToggle from './ThemeToggle'
import { buttonVariants } from './ui/Button'
import { UserAccountNav } from './UserAccountNav'

/**
 * Fixed header, 96 px tall: the navigation row (56 px) and the race ticker (40 px) under it.
 * The root layout offsets the page by exactly that height.
 */
const Navbar = async () => {
  const session = await getAuthSession()
  const items: NavItem[] = [
    { href: '/', label: 'Inicio' },
    { href: '/gp', label: 'GP' },
    { href: '/pronosticos', label: 'Pronósticos' },
    { href: '/juegos', label: 'Juegos' },
    ...(session?.user && canAccessDashboard(session.user.role) ? [{ href: '/f1-dashboard', label: 'Datos' }] : []),
  ]

  return (
    <header className='fixed inset-x-0 top-0 z-[10] bg-background/95'>
      <div className='container mx-auto flex h-14 max-w-7xl items-center gap-3 border-b border-border sm:gap-6'>
        <Link href='/' className='flex shrink-0 items-center gap-2 text-display' aria-label='FastLap, inicio'>
          <Icons.logo className='h-7 w-7' />
          <span className='label hidden text-display lg:block'>FASTLAP</span>
        </Link>

        <NavLinks items={items} />

        <SearchBar />

        <div className='flex shrink-0 items-center gap-1'>
          {session?.user && (
            <Link href='/submit' className={buttonVariants({ size: 'sm', className: 'hidden gap-1.5 rounded-full md:inline-flex' })}>
              <Plus className='h-4 w-4' aria-hidden='true' />
              Publicar
            </Link>
          )}
          <ThemeToggle />
          {session?.user && <NotificationBell />}
          {session?.user ? (
            <UserAccountNav user={{ ...session.user, username: session.user.username || '' }} />
          ) : (
            <Link href='/sign-in' className={buttonVariants({ size: 'sm' })}>
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>

      <Suspense fallback={<TickerBar />}>
        <RaceTicker />
      </Suspense>
    </header>
  )
}

export default Navbar
