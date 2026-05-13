import { z } from 'zod'

const EditorBlock = z.object({
  type: z.string(),
  data: z.record(z.any()),
})

const EditorContent = z.object({
  time: z.number().optional(),
  blocks: z.array(EditorBlock),
  version: z.string().optional(),
})

export const PostValidator = z.object({
  title: z
    .string()
    .min(3, {
      message: 'El título debe tener al menos 3 caracteres',
    })
    .max(128, {
      message: 'El título no puede tener más de 128 caracteres',
    }),
  subredditId: z.string(),
  content: EditorContent.nullable().optional(),
})

export type PostCreationRequest = z.infer<typeof PostValidator>
