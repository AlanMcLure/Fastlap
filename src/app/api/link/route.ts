import axios from 'axios'

const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^0\./,
  /^169\.254\./,
]

function isSafeUrl(href: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(href)
  } catch {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  const host = parsed.hostname
  if (BLOCKED_PATTERNS.some((p) => p.test(host))) return false
  return true
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const href = url.searchParams.get('url')

  if (!href || !isSafeUrl(href)) {
    return new Response('Invalid href', { status: 400 })
  }

  const res = await axios.get(href, { timeout: 5000, maxRedirects: 3 })

  const titleMatch = res.data.match(/<title>(.*?)<\/title>/)
  const title = titleMatch ? titleMatch[1] : ''

  const descriptionMatch = res.data.match(
    /<meta name="description" content="(.*?)"/
  )
  const description = descriptionMatch ? descriptionMatch[1] : ''

  const imageMatch = res.data.match(/<meta property="og:image" content="(.*?)"/)
  const imageUrl = imageMatch ? imageMatch[1] : ''

  return new Response(
    JSON.stringify({
      success: 1,
      meta: {
        title,
        description,
        image: {
          url: imageUrl,
        },
      },
    })
  )
}
