import { buttonVariants } from '@/components/ui/Button'
import Link from 'next/link'
import { Star } from 'lucide-react'

const PremiumCard = () => {
  return (
    <div className='overflow-hidden h-fit rounded-lg border border-gray-200 mt-4'>
      <div className='bg-yellow-200 px-6 py-4'>
        <p className='font-semibold py-3 flex items-center gap-1.5'>
          <Star className='h-4 w-4' />
          Opción Premium
        </p>
      </div>
      <div className='-my-3 divide-y divide-gray-100 px-5 py-4 text-sm leading-6'>
        <div className='flex justify-between gap-x-4 py-3'>
          <p className='text-zinc-500'>
            Accede a características exclusivas y conviértete en un usuario Premium de FastLap. ¡Mejora tu experiencia hoy mismo!
          </p>
        </div>
        <Link
          className={buttonVariants({
            className: 'w-full mt-4 mb-6',
          })}
          href={`/premium`}>
          Más información
        </Link>
      </div>
    </div>
  )
}

export default PremiumCard
