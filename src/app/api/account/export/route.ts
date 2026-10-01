import { collectUserData, exportFileName } from '@/lib/accountExport'
import { getAuthSession } from '@/lib/auth'
import { accountExportRatelimit } from '@/lib/ratelimit'

/** Downloads the caller's own data as a JSON file. */
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user) return new Response('Unauthorized', { status: 401 })

    const { success } = await accountExportRatelimit.limit(session.user.id)
    if (!success) return new Response('Too many requests', { status: 429 })

    const data = await collectUserData(session.user.id)
    if (!data) return new Response('Not found', { status: 404 })

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFileName(data.profile.username)}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Data export failed:', error)
    return new Response('Could not export the data at this time. Please try later', { status: 500 })
  }
}
