'use client'

import Image from 'next/image'

function CustomImageRenderer({ data }: any) {
  const src = data.file.url

  return (
    <div className='relative w-full min-h-[15rem]'>
      <Image alt='image' className='object-contain' fill src={src} sizes='(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px' quality={50} />
    </div>
  )
}

export default CustomImageRenderer
