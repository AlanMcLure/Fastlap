import { describe, expect, it } from 'vitest'
import { PostValidator } from './post'

const base = { title: 'Hola', subredditId: 's1' }

describe('PostValidator', () => {
  it('acepta bloques normales', () => {
    const r = PostValidator.safeParse({
      ...base,
      content: { blocks: [{ type: 'paragraph', data: { text: 'hi' } }] },
    })
    expect(r.success).toBe(true)
  })

  it('rechaza bloques embed (iframes de terceros)', () => {
    const r = PostValidator.safeParse({
      ...base,
      content: {
        blocks: [{ type: 'embed', data: { service: 'youtube', source: 'https://youtu.be/x' } }],
      },
    })
    expect(r.success).toBe(false)
  })
})
