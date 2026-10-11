'use client'

import { Download, Share2 } from 'lucide-react'
import { FC } from 'react'

import { Button, buttonVariants } from '@/components/ui/Button'
import { shareLink } from '@/lib/share'

interface ShareActionsProps {
  /** Title for the share sheet. */
  title: string
  /** Path to share (relative to the site), e.g. "/gp/2026/5". */
  path: string
  /** Share-card image of this page (see the opengraph-image routes); enables "Descargar imagen". */
  imageHref?: string
  /** Name of the downloaded image. */
  fileName?: string
}

/** Share the link (system share sheet, or copy it) and download the share card as an image. */
const ShareActions: FC<ShareActionsProps> = ({ title, path, imageHref, fileName }) => {
  const share = () => shareLink(title, path)

  return (
    <div className='flex flex-wrap gap-2'>
      <Button type='button' size='sm' variant='outline' onClick={share}>
        <Share2 className='mr-2 h-4 w-4' aria-hidden='true' />
        Compartir
      </Button>
      {imageHref && (
        <a href={imageHref} download={fileName ?? 'fastlap.png'} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
          <Download className='mr-2 h-4 w-4' aria-hidden='true' />
          Descargar imagen
        </a>
      )}
    </div>
  )
}

export default ShareActions
