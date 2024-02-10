'use client'

import { ChevronLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { buttonVariants } from './ui/Button'

interface BackButtonProps {
  defaultPath?: string;
  backText?: string;
  feedText?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ defaultPath = '/', backText = 'Volver a la Comunidad', feedText = 'Volver a tú Feed' }) => {
  const pathname = usePathname()

  // if path is /r/mycom, turn into /
  // if path is /r/mycom/post/cligad6jf0003uhest4qqkeco, turn into /r/mycom

  const subredditPath = getSubredditPath(pathname, defaultPath)

  return (
    <a href={subredditPath} className={buttonVariants({ variant: 'ghost' })}>
      <ChevronLeft className='h-4 w-4 mr-1' />
      {subredditPath === '/' ? feedText : backText}
    </a>
  )
}

const getSubredditPath = (pathname: string, defaultPath: string) => {
  if (pathname.includes('r/')) {
    const splitPath = pathname.split('/')

    if (splitPath.length === 3) return '/'
    else if (splitPath.length > 3) return `/${splitPath[1]}/${splitPath[2]}`
  }
  // default path, in case pathname does not match expected format
  else return defaultPath
}

export default BackButton
