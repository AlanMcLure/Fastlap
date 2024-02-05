import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { Icons } from './Icons'
import { buttonVariants } from './ui/Button'
import { UserAccountNav } from './UserAccountNav'
import SearchBar from './SearchBar'
import { LayoutDashboard } from 'lucide-react'

const Navbar = async () => {
  const session = await getServerSession(authOptions)
  return (
    <div className='fixed top-0 inset-x-0 h-fit bg-red-500 border-b border-red-700 z-[10] py-2'>
      <div className='container max-w-7xl h-full mx-auto flex items-center justify-between gap-2'>
        {/* logo */}
        <Link href='/' className='flex gap-2 items-center'>
          <Icons.logo className='h-8 w-8 sm:h-6 sm:w-6' />
          <p className='hidden text-zinc-900 text-1xl font-bold md:block'>FastLap</p>
        </Link>

        {/* f1-dashboard link */}
        <Link href='/f1-dashboard' className='flex gap-2 items-center'>
          <LayoutDashboard className='h-8 w-8 sm:h-6 sm:w-6' />
          <p className='hidden text-zinc-900 text-1xl font-bold md:block'>F1 Dashboard</p>
        </Link>

        {/* search bar */}
        <SearchBar />

        {/* actions */}
        {session?.user ? (
          <UserAccountNav user={{ ...session.user, username: session.user.username || '' }} />
        ) : (
          <Link href='/sign-in' className={buttonVariants()}>
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  )
}

export default Navbar
