import { describe, expect, it } from 'vitest'

import { htmlToText, postPreview } from './postPreview'

const doc = (blocks: unknown[]) => ({ time: 1, blocks, version: '2' })

describe('htmlToText', () => {
  it('strips tags, decodes entities and collapses spaces', () => {
    expect(htmlToText('Hola <b>mundo</b>&nbsp;&amp; <a href="x">amigos</a><br>fin')).toBe('Hola mundo & amigos fin')
  })
})

describe('postPreview', () => {
  it('joins the text blocks (paragraphs, headings and list items)', () => {
    const preview = postPreview(
      doc([
        { type: 'header', data: { text: 'Título', level: 2 } },
        { type: 'paragraph', data: { text: 'Primera <i>frase</i>.' } },
        { type: 'list', data: { items: ['uno', { content: 'dos' }] } },
        { type: 'code', data: { code: 'ignored()' } },
      ])
    )
    expect(preview.text).toBe('Título Primera frase. uno dos')
  })

  it('cuts long text at a word boundary and adds an ellipsis', () => {
    const preview = postPreview(doc([{ type: 'paragraph', data: { text: 'palabra '.repeat(100) } }]), 50)
    expect(preview.text.endsWith('…')).toBe(true)
    expect(preview.text.length).toBeLessThanOrEqual(51)
    expect(preview.text).not.toMatch(/palab…$/)
  })

  it('takes the first image with an https url and its caption as alt text', () => {
    const preview = postPreview(
      doc([
        { type: 'image', data: { file: { url: 'http://insecure.example/a.png' } } },
        { type: 'image', data: { file: { url: 'https://utfs.io/f/a.png' }, caption: 'La <b>salida</b>' } },
      ])
    )
    expect(preview.imageUrl).toBe('https://utfs.io/f/a.png')
    expect(preview.imageAlt).toBe('La salida')
  })

  it('ignores an image over plain http', () => {
    expect(postPreview(doc([{ type: 'image', data: { file: { url: 'http://x/a.png' } } }])).imageUrl).toBeUndefined()
  })

  it('accepts the JSON string kept in the Redis cache', () => {
    expect(postPreview(JSON.stringify(doc([{ type: 'paragraph', data: { text: 'desde la caché' } }]))).text).toBe('desde la caché')
  })

  it.each([null, undefined, 5, '', 'no json', {}, { blocks: 'x' }, { blocks: [null, 3, {}] }])('never throws for %j', (input) => {
    expect(postPreview(input)).toEqual({ text: '', imageUrl: undefined, imageAlt: undefined })
  })
})
