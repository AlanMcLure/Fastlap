import { redirect } from 'next/navigation'

import { UserNameForm } from '@/components/UserNameForm'
import { authOptions, getAuthSession } from '@/lib/auth'
import ToFeedButton from '@/components/ToFeedButton'
import { ProfileImageForm } from '@/components/ProfileImageForm'

export const metadata = {
  title: 'Ajustes',
  description: 'Ajustes de tu cuenta de FastLap',
}

export default async function SettingsPage() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect(authOptions?.pages?.signIn || '/login')
  }

  return (
    <div className='max-w-4xl mx-auto py-12'>
      <ToFeedButton />
      <div className='grid items-start gap-8 mt-4'>
        <h1 className='font-bold text-3xl md:text-4xl'>Ajustes</h1>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-10 items-start justify-center'>
          <UserNameForm
            user={{
              id: session.user.id,
              username: session.user.username || '',
            }}
          />
          <ProfileImageForm
            user={{
              id: session.user.id,
              name: session.user.name || '',
              image: session.user.image || '',
            }}
          />
        </div>
      </div>
    </div>
  )
}

{/* <div className='flex flex-col flex-grow sm:flex-grow-0'>
            <UserNameForm
              user={{
                id: session.user.id,
                username: session.user.username || '',
              }}
            />
          </div>
          <div className='flex flex-col flex-grow sm:flex-grow-0'>
            <ProfileImageForm
              user={{
                id: session.user.id,
                name: session.user.name || '',
                image: session.user.image || '',
              }}
            />
          </div> */}