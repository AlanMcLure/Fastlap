'use client'

import CustomCodeRenderer from '@/components/renderers/CustomCodeRenderer'
import CustomImageRenderer from '@/components/renderers/CustomImageRenderer'
import CustomEmbedRenderer from '@/components/renderers/CustomEmbedRenderer'
import { FC } from 'react'
import dynamic from 'next/dynamic'

const Output = dynamic(
  async () => (await import('editorjs-react-renderer')).default,
  { ssr: false }
)

interface EditorOutputProps {
  content: any
}

const renderers = {
  image: CustomImageRenderer,
  code: CustomCodeRenderer,
  embed: CustomEmbedRenderer,
}

// Post body at reading size (the page is about the post).
const style = {
  paragraph: {
    fontSize: '1.0625rem',
    lineHeight: '1.65',
    marginBottom: '0.75rem',
  },
}

const EditorOutput: FC<EditorOutputProps> = ({ content }) => {
  return (
    <Output
      style={style}
      className='max-w-2xl text-foreground'
      renderers={renderers}
      data={content}
    />
  )
}

export default EditorOutput
