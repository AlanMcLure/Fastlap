import CloseModal from '@/components/CloseModal'
import SignIn from '@/components/SignIn'
import { FC } from 'react'

const page: FC = () => {
  return (
    <div className='fixed inset-0 z-10 bg-background/80' role='dialog' aria-modal='true' aria-label='Iniciar sesión'>
      <div className='container flex items-center h-full max-w-lg mx-auto'>
        <div className='relative w-full h-fit rounded-xl border border-input bg-card px-2 py-16'>
          <div className='absolute top-4 right-4'>
            <CloseModal />
          </div>

          <SignIn />
        </div>
      </div>
    </div>
  )
}

export default page
