'use client'

import Link from 'next/link'
import { User as NextAuthUser } from 'next-auth'
import { signOut } from 'next-auth/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { UserAvatar } from '@/components/UserAvatar'
import { UserRole } from '@prisma/client'

interface User extends NextAuthUser {
  username: string,
  role: UserRole
}

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, 'name' | 'image' | 'email' | 'username' | 'role'>
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar
          user={{ name: user.name || null, image: user.image || null }}
          className='h-8 w-8'
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='bg-white' align='end'>
        <div className='flex items-center justify-start gap-2 p-2'>
          <div className='flex flex-col space-y-1 leading-none'>
            {user.name && <p className='font-medium'>{user.name}</p>}
            {user.role && <p className='font-semibold text-sm'>{user.role}</p>}
            {user.email && (
              <p className='w-[200px] truncate text-sm text-muted-foreground'>
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/'>Feed</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href='/r/create'>Crear Comunidad</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/u/${user.username}`}>Perfil</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href='/settings'>Ajustes</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href='/faqs'>FAQs</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='cursor-pointer'
          onSelect={(event) => {
            event.preventDefault()
            signOut({
              callbackUrl: `${window.location.origin}/sign-in`,
            })
          }}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
