import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function PATCH(req: Request) {
    try {
        const session = await getAuthSession()

        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { imageUrl } = z.object({
            imageUrl: z.string().url(),
        }).parse(body)

        // update profile image
        await db.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                image: imageUrl,
            },
        })

        return new Response('OK')
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 400 })
        }

        return new Response(
            'Could not update profile image at this time. Please try later',
            { status: 500 }
        )
    }
}