import { Editor } from '@/components/Editor'
import { Button } from '@/components/ui/Button'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

interface pageProps {
  params: Promise<{ slug: string }>
}

const page = async ({ params }: pageProps) => {
  const { slug } = await params
  const subreddit = await db.subreddit.findFirst({
    where: {
      name: slug,
    },
  })

  if (!subreddit) return notFound()

  return (
    <div className='flex flex-col items-start gap-6'>
      {/* heading */}
      <div className='border-b border-border pb-5'>
        <div className='-ml-2 -mt-2 flex flex-wrap items-baseline'>
          <h3 className='ml-2 mt-2 text-base font-semibold leading-6 text-foreground'>
            Crear publicación
          </h3>
          <p className='ml-2 mt-1 truncate text-sm text-muted-foreground'>
            en r/{slug}
          </p>
        </div>
      </div>

      {/* form */}
      <Editor subredditId={subreddit.id} />

      <div className='w-full flex justify-end'>
        <Button type='submit' className='w-full' form='subreddit-post-form'>
          Publicar
        </Button>
      </div>
    </div>
  )
}

export default page
