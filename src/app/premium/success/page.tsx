import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth'
import PremiumActivation from '@/components/PremiumActivation'

export const metadata = {
  title: 'Suscripción Premium',
  description: '',
}

export default async function PremiumSuccessPage() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className='sm:container max-w-xl mx-auto pt-24 px-4 text-center'>
      <PremiumActivation />
    </div>
  )
}
