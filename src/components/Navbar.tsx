import { getAuthSession } from '@/lib/auth'
import Link from 'next/link'
import { buttonVariants } from './ui/Button'
import { UserAccountNav } from './UserAccountNav'
import SearchBar from './SearchBar'
import ThemeToggle from './ThemeToggle'
import { Icons } from './Icons'
import NotificationBell from './NotificationBell'
import { canAccessDashboard } from '@/lib/features'

const navLink = 'label transition-colors hover:text-display'

const Navbar = async () => {
  const session = await getAuthSession()
  return (
    <div className='fixed top-0 inset-x-0 z-[10] h-14 border-b border-border bg-background/95 backdrop-blur-none'>
      <div className='container max-w-7xl h-full mx-auto flex items-center gap-3 sm:gap-6'>
        {/* logo */}
        <Link href='/' className='flex shrink-0 items-center gap-2 text-display' aria-label='FastLap, inicio'>
          <Icons.logo className='h-7 w-7' />
          <span className='label hidden text-display md:block'>FASTLAP</span>
        </Link>

        {/* F1 Dashboard link: every signed-in user, or only PREMIUM/ADMIN when Premium is enabled */}
        <nav className='flex shrink-0 items-center gap-4'>
          {session?.user && canAccessDashboard(session.user.role) && (
            <Link href='/f1-dashboard' className={navLink}>
              F1
            </Link>
          )}
        </nav>

        {/* search bar */}
        <SearchBar />

        {/* actions */}
        <div className='flex shrink-0 items-center gap-1'>
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
    </div>
  )
}

export default Navbar
