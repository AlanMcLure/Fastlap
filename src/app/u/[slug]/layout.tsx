import BackButton from '@/components/BackButton'
import { buttonVariants } from '@/components/ui/Button'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

interface PageProps {
  params: {
    slug: string
  }
}

const UserLayout = async ({
  children,
  params: { slug },
}: {
  children: ReactNode
  params: { slug: string }
}) => {

  const user = await db.user.findFirst({
    where: { username: slug },
  })

  const comunidadesCreadasCount = await db.subreddit.count({
    where: {
      creatorId: user?.id
    }
  })

  const voteCount = await db.vote.count({
    where: {
      userId: user?.id
    }  
  })

  const postCount = await db.post.count({
    where: {
      authorId: user?.id
    }
  })

  if (!user) return notFound()

  const session = await getAuthSession()

  return (
    <div className='sm:container max-w-7xl mx-auto h-full pt-12'>
      <div>
        <BackButton />

        <div className='grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-4 py-6'>
          <ul className='flex flex-col col-span-2 space-y-6'>{children}</ul>

          {/* info sidebar */}
          <div className='overflow-hidden h-fit rounded-lg border border-gray-200 order-first md:order-last'>
            <div className='bg-red-200 px-6 py-4'>
              <p className='font-semibold py-3'>Sobre {user.username}</p>
            </div>
            <dl className='divide-y divide-gray-100 px-6 py-4 text-sm leading-6 bg-white'>
              <div className='flex justify-between gap-x-4 py-3'>
                <dt className='text-gray-500'>Desde</dt>
                <dd className='text-gray-700'>
                  <time dateTime={user.createdAt.toDateString()}>
                    {format(user.createdAt, 'd MMMM yyyy', {locale: es})}
                  </time>
                </dd>
              </div>
              <div className='flex justify-between gap-x-4 py-3'>
                <dt className='text-gray-500'>Tipo de usuario</dt>
                <dd className='flex items-start gap-x-2'>
                  <div className='text-gray-900'>{user.role}</div>
                </dd>
              </div>
              <div className='flex justify-between gap-x-4 py-3'>
                <dt className='text-gray-500'>Comunidades creadas</dt>
                <dd className='flex items-start gap-x-2'>
                  <div className='text-gray-900'>{comunidadesCreadasCount}</div>
                </dd>
              </div>
              <div className='flex justify-between gap-x-4 py-3'>
                <dt className='text-gray-500'>Posts</dt>
                <dd className='flex items-start gap-x-2'>
                  <div className='text-gray-900'>{postCount}</div>
                </dd>
              </div>
              <div className='flex justify-between gap-x-4 py-3'>
                <dt className='text-gray-500'>Votos</dt>
                <dd className='flex items-start gap-x-2'>
                  <div className='text-gray-900'>{voteCount}</div>
                </dd>
              </div>
              {session?.user?.id === user.id ? (
                <div className='flex justify-between gap-x-4 py-3'>
                  <dt className='text-gray-500'>Este es tu perfil</dt>
                </div>
              ) : null}
              {/* <Link
                className={buttonVariants({
                  variant: 'outline',
                  className: 'w-full mb-6',
                })}
                href={`${username}/submit`}>
                Create Post
              </Link> */}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserLayout

// import { buttonVariants } from '@/components/ui/Button'
// import { getAuthSession } from '@/lib/auth'
// import { db } from '@/lib/db'
// import { format } from 'date-fns'
// import Link from 'next/link'
// import { notFound } from 'next/navigation'
// import { ReactNode } from 'react'

// const UserLayout = async ({
//   children,
//   params: { username },
// }: {
//   children: ReactNode
//   params: { username: string }
// }) => {
//   const session = await getAuthSession()

//   const user = await db.user.findFirst({
//     where: { username: username },
//     include: {
      
//     },
//   })

//   if (!user) return notFound()

//   return (
//     <div className='sm:container max-w-7xl mx-auto h-full pt-12'>
//       <div>
//         <div className='grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-4 py-6'>
//           <ul className='flex flex-col col-span-2 space-y-6'>{children}</ul>

//           {/* info sidebar */}
//           <div className='overflow-hidden h-fit rounded-lg border border-gray-200 order-first md:order-last'>
//             <div className='bg-red-200 px-6 py-4'>
//               <p className='font-semibold py-3'>About User {user.username}</p>
//             </div>
//             <dl className='divide-y divide-gray-100 px-6 py-4 text-sm leading-6 bg-white'>
//               <div className='flex justify-between gap-x-4 py-3'>
//                 <dt className='text-gray-500'>Joined</dt>
//                 <dd className='text-gray-700'>
//                   <time dateTime={user.createdAt.toDateString()}>
//                     {format(user.createdAt, 'MMMM d, yyyy')}
//                   </time>
//                 </dd>
//               </div>
//               <div className='flex justify-between gap-x-4 py-3'>
//                 <dt className='text-gray-500'>Posts</dt>
//                 <dd className='flex items-start gap-x-2'>
//                   <div className='text-gray-900'>{user.posts.length}</div>
//                 </dd>
//               </div>
//               {session?.user?.id === user.id ? (
//                 <div className='flex justify-between gap-x-4 py-3'>
//                   <dt className='text-gray-500'>This is your profile</dt>
//                 </div>
//               ) : null}
//               <Link
//                 className={buttonVariants({
//                   variant: 'outline',
//                   className: 'w-full mb-6',
//                 })}
//                 href={`${username}/submit`}>
//                 Create Post
//               </Link>
//             </dl>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default UserLayout