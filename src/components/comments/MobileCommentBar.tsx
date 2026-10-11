'use client'

import { COMMENT_FIELD_ID } from '../CreateComment'

/**
 * On phones the bottom of a post page is a comment bar instead of the navigation: one tap
 * takes you to the composer. Signed-out visitors land on its "Inicia sesión" line.
 */
const MobileCommentBar = () => {
  const open = () => {
    const field = document.getElementById(COMMENT_FIELD_ID)
    const target = field ?? document.getElementById('comentarios')
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    field?.focus({ preventScroll: true })
  }

  return (
    <div className='fixed inset-x-0 bottom-0 z-[10] border-t border-border bg-background/95 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] md:hidden'>
      <button
        type='button'
        onClick={open}
        className='flex h-11 w-full items-center rounded-full bg-muted px-4 text-left text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
        Añade un comentario…
      </button>
    </div>
  )
}

export default MobileCommentBar
