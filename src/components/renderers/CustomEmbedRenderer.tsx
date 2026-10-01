'use client'

// Old posts may still hold `embed` blocks. They are shown as a plain link, never
// as an iframe, so reading a post loads nothing from third-party sites.
function CustomEmbedRenderer({ data }: any) {
  const source = typeof data?.source === 'string' ? data.source : ''
  let href: string | null = null
  try {
    const url = new URL(source)
    if (url.protocol === 'https:' || url.protocol === 'http:') href = url.href
  } catch {
    href = null
  }
  if (!href) return null

  return (
    <p className='text-sm'>
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer nofollow ugc'
        className='break-all underline underline-offset-2'>
        {href}
      </a>
    </p>
  )
}

export default CustomEmbedRenderer
