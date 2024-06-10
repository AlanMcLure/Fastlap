'use client'

import EditorJS from '@editorjs/editorjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'
import { z } from 'zod'

import { toast } from '@/hooks/use-toast'
import { uploadFiles } from '@/lib/uploadthing'
import { PostCreationRequest, PostValidator } from '@/lib/validators/post'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import '@/styles/editor.css'

type FormData = z.infer<typeof PostValidator>

interface EditorProps {
  subredditId: string
}

export const Editor: React.FC<EditorProps> = ({ subredditId }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(PostValidator),
    defaultValues: {
      subredditId,
      title: '',
      content: null,
    },
  })
  const ref = useRef<EditorJS | null>(null)
  const _titleRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const pathname = usePathname()

  const { mutate: createPost } = useMutation({
    mutationFn: async ({ title, content, subredditId }: PostCreationRequest) => {
      const payload: PostCreationRequest = { title, content, subredditId }
      const { data } = await axios.post('/api/subreddit/post/create', payload)
      return data
    },
    onError: () => {
      return toast({
        title: 'Algo fue mal',
        description: 'La publicación no ha sido creada. Por favor, inténtelo de nuevo más tarde',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      // turn pathname /r/mycommunity/submit into /r/mycommunity
      const newPathname = pathname.split('/').slice(0, -1).join('/')
      router.push(newPathname)

      router.refresh()

      return toast({
        description: 'Su publicación ha sido creada',
      })
    },
  })

  const initializeEditor = useCallback(async () => {
    try {
      const EditorJS = (await import('@editorjs/editorjs')).default
      const Header = (await import('@editorjs/header')).default
      const Embed = (await import('@editorjs/embed')).default
      const Table = (await import('@editorjs/table')).default
      const List = (await import('@editorjs/list')).default
      const Code = (await import('@editorjs/code')).default
      const LinkTool = (await import('@editorjs/link')).default
      const InlineCode = (await import('@editorjs/inline-code')).default
      const ImageTool = (await import('@editorjs/image')).default

      if (!ref.current) {
        const editor = new EditorJS({
          holder: 'editor',
          onReady: () => {
            ref.current = editor
          },
          placeholder: 'Escribe algo...',
          inlineToolbar: true,
          data: { blocks: [] },
          tools: {
            header: Header,
            linkTool: {
              class: LinkTool,
              config: {
                endpoint: '/api/link',
              },
            },
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  async uploadByFile(file: File) {
                    const [res] = await uploadFiles([file], 'imageUploader')

                    return {
                      success: 1,
                      file: {
                        url: res.fileUrl,
                      },
                    }
                  },
                },
              },
            },
            list: List,
            code: Code,
            inlineCode: InlineCode,
            table: Table,
            embed: Embed,
          },
        })
        ref.current = editor
      }
    } catch (error) {
      console.error('Failed to initialize the editor:', error)
    }
  }, [])

  useEffect(() => {
    if (Object.keys(errors).length) {
      for (const [_key, value] of Object.entries(errors)) {
        toast({
          title: 'Algo fue mal',
          description: (value as { message: string }).message,
          variant: 'destructive',
        })
      }
    }
  }, [errors])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      const init = async () => {
        await initializeEditor()
        setTimeout(() => {
          _titleRef?.current?.focus()
        }, 0)
      }

      init()

      return () => {
        if (ref.current) {
          ref.current.destroy()
          ref.current = null
        }
      }
    }
  }, [isMounted, initializeEditor])

  async function onSubmit(data: FormData) {
    const blocks = await ref.current?.save()

    const payload: PostCreationRequest = {
      title: data.title,
      content: blocks,
      subredditId,
    }

    createPost(payload)
  }

  if (!isMounted) {
    return null
  }

  const { ref: titleRef, ...rest } = register('title')

  return (
    <div className='w-full p-4 bg-zinc-50 rounded-lg border border-zinc-200'>
      <form
        id='subreddit-post-form'
        className='w-fit'
        onSubmit={handleSubmit(onSubmit)}>
        <div className='prose prose-stone dark:prose-invert'>
          <TextareaAutosize
            ref={(e) => {
              titleRef(e)
              // @ts-ignore
              _titleRef.current = e
            }}
            {...rest}
            placeholder='Título'
            className='w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none'
          />
          <div id='editor' className='min-h-[500px]' />
          <p className='text-sm text-gray-500'>
            Usa{' '}
            <kbd className='rounded-md border bg-muted px-1 text-xs uppercase'>
              Tab
            </kbd>{' '}
            para abrir el menú de comandos.
          </p>
        </div>
      </form>
    </div>
  )
}
