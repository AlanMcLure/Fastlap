export interface PostPreview {
  /** Plain text of the first paragraphs, cut at a word boundary. */
  text: string
  imageUrl?: string
  imageAlt?: string
}

interface Block {
  type?: unknown
  data?: Record<string, unknown>
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }

/** EditorJS stores inline HTML (<b>, <a>, <br>...): turn it into plain text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim()
}

function blockTexts(block: Block): string[] {
  const data = block.data ?? {}
  switch (block.type) {
    case 'paragraph':
    case 'header':
      return typeof data.text === 'string' ? [htmlToText(data.text)] : []
    case 'list':
      return Array.isArray(data.items)
        ? data.items.flatMap((item) =>
            typeof item === 'string'
              ? [htmlToText(item)]
              : item && typeof item === 'object' && typeof (item as { content?: unknown }).content === 'string'
                ? [htmlToText((item as { content: string }).content)]
                : []
          )
        : []
    default:
      return []
  }
}

/**
 * What the feed card shows of a post: the start of its text and its first image.
 * Accepts the raw EditorJS JSON (or a JSON string, as cached in Redis) and never throws.
 */
export function postPreview(content: unknown, maxChars = 280): PostPreview {
  let value = content
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return { text: '' }
    }
  }

  const rawBlocks = (value as { blocks?: unknown } | null)?.blocks
  const blocks: Block[] = Array.isArray(rawBlocks) ? rawBlocks.filter((b): b is Block => typeof b === 'object' && b !== null) : []

  let text = blocks
    .flatMap(blockTexts)
    .filter(Boolean)
    .join(' ')
  if (text.length > maxChars) {
    const cut = text.slice(0, maxChars)
    text = `${cut.slice(0, Math.max(cut.lastIndexOf(' '), maxChars / 2)).trimEnd()}…`
  }

  const image = blocks.find((block) => {
    const url = (block.data?.file as { url?: unknown } | undefined)?.url
    return block.type === 'image' && typeof url === 'string' && url.startsWith('https://')
  })
  const imageUrl = (image?.data?.file as { url: string } | undefined)?.url
  const caption = typeof image?.data?.caption === 'string' ? htmlToText(image.data.caption) : ''

  return { text, imageUrl, imageAlt: imageUrl ? caption : undefined }
}
