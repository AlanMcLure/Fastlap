'use client'

import { Flag, Home, LogIn, Plus, Trophy, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { isCurrent } from './NavLinks'

/** Bottom navigation on phones, where the top bar has no room for the sections. */
const MobileNav = ({ username }: { username: string | null }) => {
  const pathname = usePathname()
  // a post page has its own bottom bar (MobileCommentBar) instead
  if (/^\/r\/[^/]+\/post\//.test(pathname)) return null
  const signedIn = username !== null
  const profile = signedIn ? `/u/${username}` : '/sign-in'

  const item = (href: string, label: string, Icon: typeof Home, match?: string) => {
    const current = isCurrent(pathname, { href, label, match })
    return (
      <Link
        href={href}
        aria-current={current ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-[0.08em]',
          current ? 'text-display' : 'text-muted-foreground'
        )}>
        <Icon className='h-5 w-5' aria-hidden='true' />
        {label}
      </Link>
    )
  }

  return (
    <nav
      aria-label='Navegación principal'
      className='fixed inset-x-0 bottom-0 z-[10] grid h-16 grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] md:hidden'>
      {item('/', 'Inicio', Home)}
      {item('/gp', 'GP', Flag)}
      <Link href={signedIn ? '/submit' : '/sign-in'} aria-label='Publicar' className='flex items-center justify-center'>
        <span className='flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground'>
          <Plus className='h-5 w-5' aria-hidden='true' />
        </span>
      </Link>
      {item('/pronosticos', 'Pronóst.', Trophy)}
      {signedIn ? item(profile, 'Perfil', User, '/u/') : item(profile, 'Entrar', LogIn)}
    </nav>
  )
}

export default MobileNav
